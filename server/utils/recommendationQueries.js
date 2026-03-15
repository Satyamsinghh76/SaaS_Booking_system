/**
 * recommendationQueries.js
 * ─────────────────────────────────────────────────────────────
 * Every SQL query that feeds the recommendation engine.
 *
 * QUERY DESIGN PRINCIPLES
 * ────────────────────────
 * 1. Recency weighting — bookings from the last 30 days are scored
 *    higher than older ones. Older behaviour may no longer reflect
 *    current patterns (e.g. seasonal shift, staff change).
 *
 * 2. Half-open intervals for time overlap — slot conflict checks
 *    use start < other_end AND end > other_start so adjacent
 *    slots don't falsely collide.
 *
 * 3. All queries are parameterised ($1, $2 …) — no string concat,
 *    no SQL injection surface.
 *
 * 4. Queries are intentionally side-effect-free (SELECT only).
 *    The scoring engine in recommendationService.js combines their
 *    outputs; no single query has to do everything.
 */

'use strict';

const { query } = require('../config/database');

// ══════════════════════════════════════════════════════════════
//  1. HOUR-OF-DAY POPULARITY
//     How often is each hour booked for this service?
//     Used to build a popularity signal (higher bookings = higher demand).
// ══════════════════════════════════════════════════════════════

/**
 * Returns booking frequency per hour-of-day for a service,
 * over the past `lookbackDays` days, filtered to a specific day-of-week.
 *
 * @param {string} serviceId
 * @param {number} dayOfWeek   0 = Sunday … 6 = Saturday
 * @param {number} lookbackDays
 *
 * @returns {Array<{ hour: number, booking_count: number, recency_weighted_count: number }>}
 */
const getHourlyPopularity = async (serviceId, dayOfWeek, lookbackDays = 90) => {
  const { rows } = await query(
    `SELECT
       EXTRACT(HOUR FROM b.start_time)::INTEGER    AS hour,
       COUNT(*)                                     AS booking_count,

       -- Recency weighting: bookings in the last 30 days count 3×,
       -- last 31–60 days count 2×, older count 1×.
       -- This makes the model adapt to recent trend shifts.
       SUM(
         CASE
           WHEN b.booking_date >= CURRENT_DATE - INTERVAL '30 days' THEN 3
           WHEN b.booking_date >= CURRENT_DATE - INTERVAL '60 days' THEN 2
           ELSE 1
         END
       )::NUMERIC                                   AS recency_weighted_count

     FROM   bookings b
     WHERE  b.service_id    = $1
       AND  b.status        IN ('confirmed', 'completed')
       AND  b.booking_date  >= CURRENT_DATE - ($3 || ' days')::INTERVAL
       AND  b.booking_date  <  CURRENT_DATE            -- exclude future bookings
       AND  EXTRACT(DOW FROM b.booking_date) = $2     -- same day-of-week as target
     GROUP  BY EXTRACT(HOUR FROM b.start_time)
     ORDER  BY hour ASC`,
    [serviceId, dayOfWeek, lookbackDays]
  );
  return rows;
};

// ══════════════════════════════════════════════════════════════
//  2. SLOT CONGESTION
//     How many bookings typically overlap with each available slot?
//     Used to find "breathing room" — quiet slots the algorithm
//     can surface as low-crowding recommendations.
// ══════════════════════════════════════════════════════════════

/**
 * For each candidate slot, count how many historical bookings on
 * the same day-of-week overlapped with it. Lower = quieter slot.
 *
 * @param {string}   serviceId
 * @param {number}   dayOfWeek
 * @param {string[]} slotStarts   array of "HH:MM" strings
 * @param {number}   durationMin  slot duration in minutes
 *
 * @returns {Array<{ slot_start: string, overlapping_bookings: number }>}
 */
const getSlotCongestion = async (serviceId, dayOfWeek, slotStarts, durationMin) => {
  if (!slotStarts.length) return [];

  // Build a VALUES list for the slot times:
  // ($2, $3), ($4, $5), …
  // Each pair is (slot_start::TIME, slot_end::TIME)
  const slotValues = [];
  const paramParts = [];
  let   paramIdx   = 4; // $1=serviceId, $2=dow, $3=duration; slots start at $4

  for (const start of slotStarts) {
    paramParts.push(`($${paramIdx}::TIME, ($${paramIdx}::TIME + ($3 || ' minutes')::INTERVAL)::TIME)`);
    slotValues.push(start);
    paramIdx++;
  }

  const { rows } = await query(
    `WITH slot_list(slot_start, slot_end) AS (
       VALUES ${paramParts.join(', ')}
     )
     SELECT
       sl.slot_start::TEXT                           AS slot_start,
       COUNT(b.id)                                   AS overlapping_bookings
     FROM   slot_list sl
     LEFT   JOIN bookings b
       ON   b.service_id   = $1
       AND  b.status       IN ('confirmed', 'completed')
       AND  EXTRACT(DOW FROM b.booking_date) = $2
       -- Half-open interval overlap: [slot_start, slot_end) ∩ [b.start, b.end)
       AND  b.start_time   <  sl.slot_end
       AND  b.end_time     >  sl.slot_start
       AND  b.booking_date >= CURRENT_DATE - INTERVAL '90 days'
       AND  b.booking_date <  CURRENT_DATE
     GROUP  BY sl.slot_start
     ORDER  BY sl.slot_start ASC`,
    [serviceId, dayOfWeek, durationMin, ...slotValues]
  );

  return rows;
};

// ══════════════════════════════════════════════════════════════
//  3. UPCOMING AVAILABILITY
//     Which concrete time slots are actually free on target dates?
//     The recommender only surfaces slots that are genuinely bookable.
// ══════════════════════════════════════════════════════════════

/**
 * Fetch all availability windows for the service within the next
 * `lookAheadDays` days, then subtract confirmed bookings to produce
 * a list of free slots.
 *
 * Returns one row per (date, slot_start, slot_end) tuple.
 *
 * @param {string} serviceId
 * @param {number} lookAheadDays    how many days forward to scan
 * @param {number} leadTimeMinutes  minimum minutes from now before a slot is bookable
 *
 * @returns {Array<{ date: string, slot_start: string, slot_end: string, day_of_week: number }>}
 */
const getUpcomingFreeSlots = async (serviceId, lookAheadDays = 14, leadTimeMinutes = 60) => {
  const { rows } = await query(
    `WITH
     -- All dates in the look-ahead window
     date_series AS (
       SELECT generate_series(
         CURRENT_DATE,
         CURRENT_DATE + ($2 || ' days')::INTERVAL,
         '1 day'::INTERVAL
       )::DATE AS cal_date
     ),

     -- Availability windows that fall within the window
     windows AS (
       SELECT
         d.cal_date                                      AS avail_date,
         a.start_time,
         a.end_time,
         EXTRACT(DOW FROM d.cal_date)::INTEGER           AS day_of_week
       FROM   availability a
       JOIN   date_series d ON EXTRACT(DOW FROM d.cal_date) = a.day_of_week
       WHERE  a.service_id   = $1
         AND  a.is_active    = TRUE
         AND  d.cal_date    >= CURRENT_DATE
     ),

     -- Individual slots generated from each window
     -- Step = service.duration_minutes (no overlap, no buffer here — buffer
     -- is handled at availability-creation time by admins)
     service_meta AS (
       SELECT duration_minutes FROM services WHERE id = $1
     ),
     raw_slots AS (
       SELECT
         w.avail_date                                    AS date,
         w.day_of_week,
         -- Generate one start time per slot within the window
         -- using generate_series on timestamps then casting back to time
         (s.slot_ts AT TIME ZONE 'UTC')::TIME            AS slot_start,
         ((s.slot_ts + (sm.duration_minutes || ' minutes')::INTERVAL) AT TIME ZONE 'UTC')::TIME AS slot_end
       FROM   windows w
       CROSS  JOIN service_meta sm
       CROSS  JOIN LATERAL generate_series(
         (w.avail_date || 'T' || w.start_time)::TIMESTAMPTZ,
         (w.avail_date || 'T' || w.end_time)::TIMESTAMPTZ   - (sm.duration_minutes || ' minutes')::INTERVAL,
         (sm.duration_minutes || ' minutes')::INTERVAL
       ) AS s(slot_ts)
     ),

     -- Already-booked slots on those dates
     booked AS (
       SELECT
         b.booking_date  AS date,
         b.start_time,
         b.end_time
       FROM   bookings b
       WHERE  b.service_id  = $1
         AND  b.status      IN ('pending', 'confirmed')
         AND  b.booking_date BETWEEN CURRENT_DATE AND CURRENT_DATE + ($2 || ' days')::INTERVAL
     )

     -- Only free slots: exclude any slot that overlaps a confirmed booking
     SELECT DISTINCT
       rs.date::TEXT      AS date,
       rs.slot_start::TEXT AS slot_start,
       rs.slot_end::TEXT   AS slot_end,
       rs.day_of_week
     FROM   raw_slots rs
     WHERE  NOT EXISTS (
       SELECT 1 FROM booked bk
       WHERE  bk.date        = rs.date
         AND  bk.start_time  < rs.slot_end
         AND  bk.end_time    > rs.slot_start
     )
     -- Enforce lead time: don't show slots that are too soon
     AND (
       rs.date > CURRENT_DATE
       OR rs.slot_start > (CURRENT_TIME + ($3 || ' minutes')::INTERVAL)::TIME
     )
     ORDER  BY rs.date ASC, rs.slot_start ASC`,
    [serviceId, lookAheadDays, leadTimeMinutes]
  );

  return rows;
};

// ══════════════════════════════════════════════════════════════
//  4. USER PREFERENCE HISTORY
//     What times has this specific user booked before?
//     Personalises the score toward their past patterns.
// ══════════════════════════════════════════════════════════════

/**
 * Returns the user's booking frequency by hour-of-day for this service.
 * Used to add a personalisation bonus to slots the user habitually prefers.
 *
 * @param {string} userId
 * @param {string} serviceId
 *
 * @returns {Array<{ hour: number, personal_count: number }>}
 */
const getUserPreferences = async (userId, serviceId) => {
  const { rows } = await query(
    `SELECT
       EXTRACT(HOUR FROM b.start_time)::INTEGER  AS hour,
       COUNT(*)                                   AS personal_count
     FROM   bookings b
     WHERE  b.user_id     = $1
       AND  b.service_id  = $2
       AND  b.status      IN ('confirmed', 'completed')
     GROUP  BY EXTRACT(HOUR FROM b.start_time)
     ORDER  BY personal_count DESC`,
    [userId, serviceId]
  );
  return rows;
};

// ══════════════════════════════════════════════════════════════
//  5. SERVICE GLOBAL STATS
//     Normalisation denominators — needed to scale scores 0–1.
// ══════════════════════════════════════════════════════════════

/**
 * Returns aggregate stats for the service used to normalise scores.
 *
 * @param {string} serviceId
 */
const getServiceStats = async (serviceId) => {
  const { rows } = await query(
    `SELECT
       s.duration_minutes,
       s.name                                                AS service_name,
       COUNT(b.id)                                           AS total_bookings,
       COUNT(b.id) FILTER (WHERE b.booking_date >= CURRENT_DATE - INTERVAL '30 days')
                                                             AS recent_bookings,
       -- Peak recency-weighted count — used as the normalisation ceiling
       MAX(
         CASE
           WHEN b.booking_date >= CURRENT_DATE - INTERVAL '30 days' THEN 3
           WHEN b.booking_date >= CURRENT_DATE - INTERVAL '60 days' THEN 2
           ELSE 1
         END
       )                                                     AS max_weight_single_booking
     FROM   services s
     LEFT   JOIN bookings b ON b.service_id = s.id
       AND  b.status IN ('confirmed', 'completed')
       AND  b.booking_date < CURRENT_DATE
     WHERE  s.id = $1
     GROUP  BY s.id, s.name, s.duration_minutes`,
    [serviceId]
  );
  return rows[0] ?? null;
};

module.exports = {
  getHourlyPopularity,
  getSlotCongestion,
  getUpcomingFreeSlots,
  getUserPreferences,
  getServiceStats,
};
