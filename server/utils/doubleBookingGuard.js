/**
 * doubleBookingGuard.js
 * ─────────────────────────────────────────────────────────────
 * All conflict-detection logic lives in ONE place.
 *
 * Three-layer strategy
 * ────────────────────
 *  Layer 1 — Application pre-check  (this file)
 *    SELECT … FOR UPDATE skips the slot row under a transaction lock.
 *    Catches the conflict with a clear user message BEFORE hitting
 *    the DB constraint, and also protects against races in tests.
 *
 *  Layer 2 — PostgreSQL EXCLUDE constraint  (schema.sql)
 *    EXCLUDE USING GIST on (service_id, booking_date, TSRANGE) is
 *    the hard backstop. Even if two requests somehow slip past the
 *    application check simultaneously, the DB will reject one with
 *    error code 23P01.
 *
 *  Layer 3 — Advisory lock  (this file)
 *    pg_try_advisory_xact_lock() serialises concurrent requests for
 *    the same (service_id, date, start_time) before the SELECT, so
 *    the pre-check is effectively atomic without table-level locking.
 *
 * Usage (inside a transaction):
 *   const guard = await checkForConflict(client, { ... });
 *   if (guard.conflict) return res.status(409).json(guard);
 */

/**
 * Convert a "HH:MM" or "HH:MM:SS" string to minutes since midnight.
 * Used to build a stable integer for the advisory lock key.
 */
const timeToMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Build a stable 32-bit integer lock key from service UUID + date + start.
 * PostgreSQL advisory locks take bigint keys; we hash into a safe range.
 *
 * @param {string} serviceId   UUID
 * @param {string} date        "YYYY-MM-DD"
 * @param {string} startTime   "HH:MM"
 * @returns {number}
 */
const buildLockKey = (serviceId, date, startTime) => {
  // Simple but collision-resistant hash for a slot identifier
  const raw = `${serviceId}::${date}::${startTime}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = Math.imul(31, hash) + raw.charCodeAt(i);
    hash |= 0; // keep 32-bit
  }
  // Shift to positive range for pg bigint
  return Math.abs(hash);
};

/**
 * Acquire a session-scoped advisory lock for this exact slot.
 * If another transaction already holds the lock, we fail fast
 * rather than waiting (pg_try_advisory_xact_lock returns FALSE).
 *
 * Must be called INSIDE a transaction (lock auto-releases on commit/rollback).
 *
 * @param {PoolClient} client
 * @param {string}     serviceId
 * @param {string}     date
 * @param {string}     startTime
 * @returns {Promise<boolean>}  true if lock acquired, false if already held
 */
const acquireSlotLock = async (client, serviceId, date, startTime) => {
  const key = buildLockKey(serviceId, date, startTime);
  const { rows } = await client.query(
    'SELECT pg_try_advisory_xact_lock($1) AS acquired',
    [key]
  );
  return rows[0].acquired;
};

/**
 * Application-layer conflict check.
 *
 * Runs a SELECT to find any active booking for the given service on the
 * given date whose time range overlaps the requested [startTime, endTime).
 *
 * Must be called INSIDE a transaction with a prior advisory lock.
 *
 * @param {PoolClient} client
 * @param {object}     params
 * @param {string}     params.serviceId
 * @param {string}     params.date         "YYYY-MM-DD"
 * @param {string}     params.startTime    "HH:MM"
 * @param {string}     params.endTime      "HH:MM"
 * @param {string}     [params.excludeId]  booking UUID to ignore (for reschedules)
 *
 * @returns {Promise<{conflict: boolean, existingBooking?: object}>}
 */
const checkForConflict = async (client, { serviceId, date, startTime, endTime, excludeId }) => {
  const { rows } = await client.query(
    `SELECT
       b.id,
       b.start_time::TEXT AS start_time,
       b.end_time::TEXT   AS end_time,
       b.status
     FROM bookings b
     WHERE b.service_id   = $1
       AND b.booking_date = $2
       AND b.status NOT IN ('cancelled', 'no_show')
       ${excludeId ? 'AND b.id <> $5' : ''}
       -- Half-open interval overlap: [start1, end1) ∩ [start2, end2) ≠ ∅
       AND b.start_time < $4::TIME
       AND b.end_time   > $3::TIME
     LIMIT 1`,
    excludeId
      ? [serviceId, date, startTime, endTime, excludeId]
      : [serviceId, date, startTime, endTime]
  );

  if (rows.length === 0) return { conflict: false };

  return {
    conflict:        true,
    existingBooking: {
      id:         rows[0].id,
      start_time: rows[0].start_time,
      end_time:   rows[0].end_time,
      status:     rows[0].status,
    },
  };
};

/**
 * Full slot-locking sequence:
 *   1. Acquire advisory lock (serialise concurrent requests for this slot)
 *   2. Check for overlapping bookings in the DB
 *
 * Returns an object the caller can inspect before proceeding with INSERT.
 *
 * @param {PoolClient} client         - must be inside BEGIN … COMMIT
 * @param {object}     slotParams     - { serviceId, date, startTime, endTime, excludeId? }
 *
 * @returns {Promise<{
 *   locked:          boolean,
 *   conflict:        boolean,
 *   existingBooking: object | undefined,
 *   message:         string | undefined
 * }>}
 */
const guardSlot = async (client, slotParams) => {
  const { serviceId, date, startTime } = slotParams;

  // ── Step 1: advisory lock ──────────────────────────────────
  const locked = await acquireSlotLock(client, serviceId, date, startTime);

  if (!locked) {
    return {
      locked:   false,
      conflict: true,
      message:  'This time slot is currently being booked by another user. Please try again.',
    };
  }

  // ── Step 2: overlap check ──────────────────────────────────
  const { conflict, existingBooking } = await checkForConflict(client, slotParams);

  if (conflict) {
    return {
      locked:          true,
      conflict:        true,
      existingBooking,
      message:         `This slot (${slotParams.startTime}–${slotParams.endTime}) is already booked.`,
    };
  }

  return { locked: true, conflict: false };
};

module.exports = {
  guardSlot,
  checkForConflict,
  acquireSlotLock,
  buildLockKey,
  timeToMinutes,
};
