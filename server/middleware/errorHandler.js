'use strict';

const logger = require('../config/logger');

/**
 * Global error handler — must be registered last in Express.
 *
 * Behaviour:
 *  - All 5xx errors are logged at `error` level with full stack.
 *  - 4xx errors are logged at `warn` level (no stack).
 *  - Stacks are NEVER sent to clients in production.
 *  - req.id (set by requestId middleware) is included in every
 *    response and log entry so errors can be correlated.
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status = err.statusCode || err.status || 500;
  const requestId = req.id; // attached by middleware/requestId.js

  // ── Stripe errors ─────────────────────────────────────────
  if (err.type?.startsWith('Stripe')) {
    logger.warn('Stripe error', { requestId, method: req.method, url: req.originalUrl, stripeCode: err.code, message: err.message });
    return res.status(402).json({ success: false, message: err.message, code: err.code, requestId });
  }

  // ── Postgres unique constraint ────────────────────────────
  if (err.code === '23505') {
    logger.warn('Unique constraint violation', { requestId, detail: err.detail });
    return res.status(409).json({ success: false, message: 'A record with that value already exists.', requestId });
  }

  // ── Postgres EXCLUDE constraint (slot conflict backstop) ──
  if (err.code === '23P01') {
    logger.warn('Slot exclusion constraint hit', { requestId });
    return res.status(409).json({ success: false, message: 'This time slot is already booked.', code: 'SLOT_CONFLICT', requestId });
  }

  // ── SQLite unique constraint (double-booking backstop) ───
  if (err.code === 'SQLITE_CONSTRAINT' && /UNIQUE constraint/i.test(err.message) && /bookings/i.test(err.message)) {
    logger.warn('SQLite slot unique constraint hit', { requestId, message: err.message });
    return res.status(409).json({ success: false, message: 'This time slot is already booked.', code: 'SLOT_CONFLICT', requestId });
  }

  // ── Custom application errors ─────────────────────────────
  if (err.code === 'SLOT_CONFLICT') {
    logger.warn('Slot conflict', { requestId, message: err.message });
    return res.status(409).json({ success: false, message: err.message, code: 'SLOT_CONFLICT', existing: err.existing ?? null, requestId });
  }

  if (err.code === 'INVALID_TRANSITION') {
    logger.warn('Invalid status transition', { requestId, message: err.message });
    return res.status(422).json({ success: false, message: err.message, requestId });
  }

  // ── 5xx — unexpected server errors ───────────────────────
  if (status >= 500) {
    logger.error('Unhandled server error', {
      requestId,
      method:  req.method,
      url:     req.originalUrl,
      status,
      message: err.message,
      stack:   err.stack,
    });
  } else {
    // 4xx logged at warn (no stack needed)
    logger.warn('Client error', {
      requestId,
      method:  req.method,
      url:     req.originalUrl,
      status,
      message: err.message,
    });
  }

  // Never leak stack traces or internal details to clients
  const isProduction = process.env.NODE_ENV === 'production';
  return res.status(status).json({
    success: false,
    message: status >= 500 ? 'An unexpected error occurred.' : err.message,
    requestId,
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = errorHandler;
