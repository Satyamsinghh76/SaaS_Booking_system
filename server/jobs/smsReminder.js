'use strict';

/**
 * SMS Reminder Scheduler — runs as a cron job.
 * Queries upcoming bookings and sends SMS reminders via Twilio.
 */

require('dotenv').config();
const cron = require('node-cron');
const { query }     = require('../config/database');
const twilio        = require('twilio');

// ── Twilio Client ────────────────────────────────────────────

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;
const missing = Object.entries({ TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER })
  .filter(([, v]) => !v).map(([k]) => k);

let twilioClient, fromNumber;
if (missing.length > 0) {
  console.warn(`[SMS] Missing Twilio env vars: ${missing.join(', ')}. SMS reminders disabled.`);
} else {
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  fromNumber   = TWILIO_PHONE_NUMBER;
}

// ── DB Queries ───────────────────────────────────────────────

async function getBookingsDueForReminder() {
  const { rows } = await query(`
    SELECT id, user_phone, service_name, start_time FROM bookings
    WHERE status = 'confirmed' AND reminder_sent = false
      AND start_time BETWEEN NOW() + INTERVAL '55 minutes' AND NOW() + INTERVAL '65 minutes'
    ORDER BY start_time ASC
  `);
  return rows;
}

async function markReminderSent(bookingId) {
  await query(`UPDATE bookings SET reminder_sent = true WHERE id = $1`, [bookingId]);
}

async function logSmsAttempt({ bookingId, status, twilioSid, error }) {
  try {
    await query(
      `INSERT INTO sms_logs (booking_id, status, twilio_sid, error) VALUES ($1, $2, $3, $4)`,
      [bookingId, status, twilioSid || null, error || null]
    );
  } catch (err) {
    console.error('[DB] Failed to write SMS log:', err.message);
  }
}

// ── SMS Sender ───────────────────────────────────────────────

function formatReminderMessage(serviceName, appointmentTime) {
  const date = new Date(appointmentTime);
  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: process.env.APP_TIMEZONE || 'UTC',
  });
  return `Reminder: Your appointment for ${serviceName} is at ${time}.`;
}

const TRANSIENT_CODES = new Set([20429, 20503, 30001, 30002, 30003]);
const isTransientError = (err) => err.status >= 500 || TRANSIENT_CODES.has(err.code);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendSmsReminder({ to, serviceName, appointmentTime, bookingId, maxRetries = 3 }) {
  if (!twilioClient) return { success: false, error: 'Twilio not configured' };

  const body = formatReminderMessage(serviceName, appointmentTime);
  const tag  = bookingId ? `[booking:${bookingId}]` : '';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const message = await twilioClient.messages.create({ body, from: fromNumber, to });
      console.log(`[SMS] ${tag} Sent to ${to} | SID: ${message.sid}`);
      return { success: true, sid: message.sid };
    } catch (err) {
      console.error(`[SMS] ${tag} Attempt ${attempt}/${maxRetries} failed:`, err.message);
      if (!isTransientError(err) || attempt === maxRetries) {
        return { success: false, error: err.message };
      }
      await sleep(1000 * Math.pow(2, attempt - 1));
    }
  }
}

// ── Scheduler ────────────────────────────────────────────────

const CRON_SCHEDULE = process.env.REMINDER_CRON || '*/5 * * * *';

async function processReminders() {
  console.log(`[Scheduler] ${new Date().toISOString()} — checking reminders…`);
  let bookings;
  try {
    bookings = await getBookingsDueForReminder();
  } catch (err) {
    console.error('[Scheduler] DB query failed:', err.message);
    return;
  }
  if (bookings.length === 0) {
    console.log('[Scheduler] No reminders due.');
    return;
  }
  console.log(`[Scheduler] Found ${bookings.length} booking(s) to remind.`);
  await Promise.allSettled(bookings.map(async (booking) => {
    const { id, user_phone, service_name, start_time } = booking;
    const result = await sendSmsReminder({
      to: user_phone, serviceName: service_name,
      appointmentTime: start_time, bookingId: id,
    });
    if (result.success) {
      await markReminderSent(id);
      await logSmsAttempt({ bookingId: id, status: 'sent', twilioSid: result.sid });
    } else {
      await logSmsAttempt({ bookingId: id, status: 'failed', error: result.error });
    }
  }));
}

function startScheduler() {
  if (!cron.validate(CRON_SCHEDULE)) {
    throw new Error(`[Scheduler] Invalid cron: "${CRON_SCHEDULE}"`);
  }
  console.log(`[Scheduler] Starting SMS reminders — cron: "${CRON_SCHEDULE}"`);
  processReminders();
  cron.schedule(CRON_SCHEDULE, processReminders, {
    scheduled: true,
    timezone: process.env.APP_TIMEZONE || 'UTC',
  });
}

module.exports = { startScheduler, processReminders };
