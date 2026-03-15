'use strict';

/**
 * SMS Reminder Scheduler — runs as a cron job.
 * Queries upcoming confirmed bookings and sends SMS reminders via Twilio.
 * Only sends once per booking (tracks via reminder_sent flag).
 */

require('dotenv').config();
const cron = require('node-cron');
const { query } = require('../config/database');
const twilio = require('twilio');

// ── Twilio Client ────────────────────────────────────────────

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;
const missing = Object.entries({ TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER })
  .filter(([, v]) => !v).map(([k]) => k);

let twilioClient, fromNumber;
if (missing.length > 0) {
  console.warn(`[SMS] Missing Twilio env vars: ${missing.join(', ')}. SMS reminders disabled.`);
} else {
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  fromNumber = TWILIO_PHONE_NUMBER;
}

// ── DB Queries ───────────────────────────────────────────────

async function getBookingsDueForReminder() {
  const { rows } = await query(`
    SELECT
      b.id,
      b.booking_date::TEXT AS booking_date,
      b.start_time::TEXT   AS start_time,
      s.name               AS service_name,
      u.phone_number       AS user_phone,
      u.name               AS user_name
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    JOIN users u ON u.id = b.user_id
    WHERE b.status IN ('confirmed', 'pending')
      AND b.reminder_sent = FALSE
      AND u.phone_number IS NOT NULL
      AND (b.booking_date + b.start_time)
          BETWEEN (NOW() + INTERVAL '55 minutes')
              AND (NOW() + INTERVAL '65 minutes')
    ORDER BY b.booking_date, b.start_time ASC
  `);
  return rows;
}

async function markReminderSent(bookingId) {
  await query('UPDATE bookings SET reminder_sent = TRUE WHERE id = $1', [bookingId]);
}

async function logSmsAttempt({ bookingId, userId, phone, status, twilioSid, error }) {
  try {
    await query(
      `INSERT INTO sms_logs (booking_id, user_id, phone_number, message_type, status, twilio_sid, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [bookingId, userId || null, phone || null, 'reminder', status, twilioSid || null, error || null]
    );
  } catch (err) {
    console.error('[SMS] Failed to write SMS log:', err.message);
  }
}

// ── SMS Sender ───────────────────────────────────────────────

function formatTime12h(time24) {
  const [h, m] = time24.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, '0')} ${suffix}`;
}

const TRANSIENT_CODES = new Set([20429, 20503, 30001, 30002, 30003]);
const isTransientError = (err) => err.status >= 500 || TRANSIENT_CODES.has(err.code);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendSmsReminder({ to, serviceName, startTime, bookingDate, bookingId, maxRetries = 3 }) {
  if (!twilioClient) return { success: false, error: 'Twilio not configured' };

  const date = new Date(bookingDate + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
  const body = `Reminder: Your ${serviceName} appointment is coming up on ${date} at ${formatTime12h(startTime)}. — BookFlow`;
  const tag = `[booking:${bookingId}]`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const message = await twilioClient.messages.create({ body, from: fromNumber, to });
      console.log(`[SMS] ${tag} Reminder sent to ${to} | SID: ${message.sid}`);
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
    const result = await sendSmsReminder({
      to: booking.user_phone,
      serviceName: booking.service_name,
      startTime: booking.start_time,
      bookingDate: booking.booking_date,
      bookingId: booking.id,
    });
    if (result.success) {
      await markReminderSent(booking.id);
      await logSmsAttempt({ bookingId: booking.id, phone: booking.user_phone, status: 'sent', twilioSid: result.sid });
    } else {
      await logSmsAttempt({ bookingId: booking.id, phone: booking.user_phone, status: 'failed', error: result.error });
    }
  }));
}

function startScheduler() {
  if (!cron.validate(CRON_SCHEDULE)) {
    throw new Error(`[Scheduler] Invalid cron: "${CRON_SCHEDULE}"`);
  }
  console.log(`[Scheduler] Starting SMS reminders — cron: "${CRON_SCHEDULE}"`);
  cron.schedule(CRON_SCHEDULE, processReminders, {
    scheduled: true,
    timezone: process.env.APP_TIMEZONE || 'UTC',
  });
}

module.exports = { startScheduler, processReminders };
