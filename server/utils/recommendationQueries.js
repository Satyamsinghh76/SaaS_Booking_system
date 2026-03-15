/**
 * recommendationQueries.js
 * ─────────────────────────────────────────────────────────────
 * Every SQL query that feeds the recommendation engine.
 *
 * All queries are parameterised and side-effect-free (SELECT only).
 * SQLite-compatible — no PostgreSQL-specific syntax.
 */

'use strict';

const { query } = require('../config/database');

// ══════════════════════════════════════════════════════════════
//  1. HOUR-OF-DAY POPULARITY
// ══════════════════════════════════════════════════════════════

const getHourlyPopularity = async (serviceId, dayOfWeek, lookbackDays = 90) => {
  const { rows } = await query(
    `SELECT
       EXTRACT(HOUR FROM b.start_time)::INTEGER       AS hour,
       COUNT(*)                                        AS booking_count,
       SUM(
         CASE
           WHEN b.booking_date >= CURRENT_DATE - INTERVAL '30 days' THEN 3
           WHEN b.booking_date >= CURRENT_DATE - INTERVAL '60 days' THEN 2
           ELSE 1
         END
       )::NUMERIC AS recency_weighted_count
     FROM   bookings b
     WHERE  b.service_id    = $1
       AND  b.status        IN ('confirmed', 'completed')
       AND  b.booking_date  >= CURRENT_DATE - ($3 || ' days')::INTERVAL
       AND  b.booking_date  <  CURRENT_DATE
       AND  EXTRACT(DOW FROM b.booking_date) = $2
     GROUP  BY EXTRACT(HOUR FROM b.start_time)
     ORDER  BY hour ASC`,
    [serviceId, dayOfWeek, lookbackDays]
  );
  return rows;
};

// ══════════════════════════════════════════════════════════════
//  2. SLOT CONGESTION
// ══════════════════════════════════════════════════════════════

const getSlotCongestion = async (serviceId, dayOfWeek, slotStarts, _durationMin) => {
  if (!slotStarts.length) return [];

  const conditions = slotStarts.map((_, i) => `b.start_time = $${i + 3}::TIME`).join(' OR ');

  const { rows } = await query(
    `SELECT
       b.start_time::TEXT AS slot_start,
       COUNT(b.id)        AS overlapping_bookings
     FROM   bookings b
     WHERE  b.service_id   = $1
       AND  b.status       IN ('confirmed', 'completed')
       AND  EXTRACT(DOW FROM b.booking_date) = $2
       AND  b.booking_date >= CURRENT_DATE - INTERVAL '90 days'
       AND  b.booking_date <  CURRENT_DATE
       AND  (${conditions})
     GROUP  BY b.start_time
     ORDER  BY b.start_time ASC`,
    [serviceId, dayOfWeek, ...slotStarts]
  );

  return rows;
};

// ══════════════════════════════════════════════════════════════
//  3. UPCOMING FREE SLOTS
//     Generate slots from fixed business hours (9-17),
//     subtract already-booked ones, return what's free.
// ══════════════════════════════════════════════════════════════

// Business hours — same as the booking page's generateTimeSlots()
const BUSINESS_HOURS = [9, 10, 11, 13, 14, 15, 16, 17];

const getUpcomingFreeSlots = async (serviceId, lookAheadDays = 14, leadTimeMinutes = 60) => {
  // Get the service duration to compute end times
  const svcResult = await query(
    'SELECT duration_minutes FROM services WHERE id = $1',
    [serviceId]
  );
  const durationMin = svcResult.rows[0]?.duration_minutes ?? 60;

  // Generate all dates in the look-ahead window
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates = [];
  for (let i = 0; i <= lookAheadDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10)); // YYYY-MM-DD
  }

  // Get all booked slots in the window
  const { rows: bookedRows } = await query(
    `SELECT booking_date AS date, start_time
     FROM   bookings
     WHERE  service_id  = $1
       AND  status      IN ('pending', 'confirmed')
       AND  booking_date BETWEEN $2 AND $3`,
    [serviceId, dates[0], dates[dates.length - 1]]
  );

  const bookedSet = new Set(bookedRows.map(r => `${r.date}::${r.start_time}`));

  // Current time for lead-time filtering
  const nowMs = Date.now();

  // Generate free slots
  const freeSlots = [];
  for (const date of dates) {
    const dayOfWeek = new Date(date + 'T00:00:00').getDay(); // 0=Sun, 6=Sat

    for (const hour of BUSINESS_HOURS) {
      const startTime = `${String(hour).padStart(2, '0')}:00`;
      const endMinutes = hour * 60 + durationMin;
      if (endMinutes > 24 * 60) continue; // skip if extends past midnight
      const endHour = Math.floor(endMinutes / 60);
      const endMin = endMinutes % 60;
      const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

      // Skip if already booked
      if (bookedSet.has(`${date}::${startTime}`)) continue;

      // Skip if within lead time
      const slotMs = new Date(`${date}T${startTime}:00`).getTime();
      if (slotMs - nowMs < leadTimeMinutes * 60 * 1000) continue;

      freeSlots.push({
        date,
        slot_start: startTime,
        slot_end: endTime,
        day_of_week: dayOfWeek,
      });
    }
  }

  return freeSlots;
};

// ══════════════════════════════════════════════════════════════
//  4. USER PREFERENCE HISTORY
// ══════════════════════════════════════════════════════════════

const getUserPreferences = async (userId, serviceId) => {
  const { rows } = await query(
    `SELECT
       EXTRACT(HOUR FROM b.start_time)::INTEGER AS hour,
       COUNT(*)                                  AS personal_count
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
// ══════════════════════════════════════════════════════════════

const getServiceStats = async (serviceId) => {
  const { rows } = await query(
    `SELECT
       s.duration_minutes,
       s.name                                          AS service_name,
       COUNT(b.id)                                     AS total_bookings,
       COUNT(b.id) FILTER (WHERE b.booking_date >= CURRENT_DATE - INTERVAL '30 days')
                                                       AS recent_bookings,
       MAX(
         CASE
           WHEN b.booking_date >= CURRENT_DATE - INTERVAL '30 days' THEN 3
           WHEN b.booking_date >= CURRENT_DATE - INTERVAL '60 days' THEN 2
           ELSE 1
         END
       )                                               AS max_weight_single_booking
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
