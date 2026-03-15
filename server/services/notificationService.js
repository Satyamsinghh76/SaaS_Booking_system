/**
 * notificationService.js
 * ─────────────────────────────────────────────────────────────
 * The only file the booking controller imports for email.
 * Composes templates + calls sendEmail. Keeps controllers thin.
 *
 * Design decisions
 * ────────────────
 * • Never throws to the caller — email failure must NEVER fail a
 *   booking action. Errors are logged (and can be sent to an
 *   alerting system), but the booking transaction has already
 *   committed before this service is invoked.
 *
 * • Fire-and-forget by default (fireAndForget: true).
 *   Set fireAndForget: false in tests to await and assert.
 *
 * • buildPayload() normalises raw DB rows so templates stay clean.
 */

'use strict';

const { sendEmail }                  = require('../utils/emailUtil');
const { bookingConfirmedTemplate }   = require('../templates/email/bookingConfirmed');
const { bookingCancelledTemplate }   = require('../templates/email/bookingCancelled');

// ── Internal helpers ──────────────────────────────────────────

/**
 * Normalise a raw booking row (joined with user + service) into the
 * shape all templates expect.
 *
 * @param {object} booking  DB row with user_name, user_email, service_name, etc.
 */
const buildPayload = (booking) => ({
  // User
  userName:  booking.user_name  || booking.name  || 'Valued Customer',
  userEmail: booking.user_email || booking.email,

  // Booking identity
  bookingId:  booking.id,
  bookingRef: booking.id.slice(0, 8).toUpperCase(),   // e.g. "A1B2C3D4"

  // Service / time
  serviceName:      booking.service_name,
  date:             booking.date             || booking.booking_date,
  startTime:        booking.start_time,
  endTime:          booking.end_time,
  durationMinutes:  booking.duration_minutes,
  price:            parseFloat(booking.price_snapshot || 0).toFixed(2),

  // Optional fields
  notes:                booking.notes             || null,
  cancellationReason:   booking.cancellation_reason || null,
});

/**
 * Core send wrapper — logs success/failure, never propagates errors.
 *
 * @param {object}  mailOptions   - { to, subject, html, text }
 * @param {string}  eventLabel    - used in log lines
 * @param {boolean} fireAndForget - if true, don't await the promise
 */
const dispatchEmail = (mailOptions, eventLabel, fireAndForget = true) => {
  const promise = sendEmail(mailOptions).catch((err) => {
    // Log but do not re-throw — email is non-critical
    console.error(
      `[notification] Failed to send "${eventLabel}" to ${mailOptions.to}: ${err.message}`
    );
    // In production, forward to your alerting system here:
    // alerting.capture(err, { context: eventLabel, to: mailOptions.to });
  });

  if (fireAndForget) return;   // caller doesn't await
  return promise;              // caller awaits (tests)
};

// ── Public API ────────────────────────────────────────────────

const NotificationService = {

  /**
   * Send a booking-confirmed email.
   * Call this AFTER the booking row is committed to the DB.
   *
   * @param {object}  booking         - DB row (joined: user, service)
   * @param {object}  [options]
   * @param {boolean} [options.await] - set true in tests to wait for delivery
   */
  sendBookingConfirmed(booking, { await: shouldAwait = false } = {}) {
    const payload  = buildPayload(booking);
    const template = bookingConfirmedTemplate(payload);

    return dispatchEmail(
      { to: payload.userEmail, ...template },
      `booking_confirmed:${payload.bookingRef}`,
      !shouldAwait,
    );
  },

  /**
   * Send a booking-cancelled email.
   * Call this AFTER the cancellation is committed to the DB.
   *
   * @param {object}  booking
   * @param {object}  [options]
   * @param {string}  [options.cancelledBy]   "user" | "admin"
   * @param {string}  [options.refundAmount]  e.g. "75.00" — include if refund was issued
   * @param {boolean} [options.await]
   */
  sendBookingCancelled(booking, { cancelledBy, refundAmount, await: shouldAwait = false } = {}) {
    const payload  = buildPayload(booking);
    const template = bookingCancelledTemplate({
      ...payload,
      cancelledBy:  cancelledBy  || 'user',
      refundAmount: refundAmount || null,
    });

    return dispatchEmail(
      { to: payload.userEmail, ...template },
      `booking_cancelled:${payload.bookingRef}`,
      !shouldAwait,
    );
  },
};

module.exports = NotificationService;
