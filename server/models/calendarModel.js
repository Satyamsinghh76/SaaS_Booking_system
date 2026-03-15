'use strict';

const { query } = require('../config/database');

const BOOKING_COLS = `
  b.id,
  b.user_id,
  b.service_id,
  b.booking_date::TEXT          AS date,
  b.start_time::TEXT            AS start_time,
  b.end_time::TEXT              AS end_time,
  b.status,
  b.payment_status,
  b.price_snapshot,
  b.notes,
  b.google_event_id,
  b.google_calendar_id,
  b.calendar_synced_at,
  s.name                        AS service_name,
  s.duration_minutes,
  u.name                        AS user_name,
  u.email                       AS user_email
`.trim();

const CalendarModel = {

  /**
   * Fetch a booking enriched with user + service for calendar use.
   */
  async findBookingForCalendar(bookingId) {
    const { rows } = await query(
      `SELECT ${BOOKING_COLS}
       FROM   bookings b
       JOIN   services s ON s.id = b.service_id
       JOIN   users    u ON u.id = b.user_id
       WHERE  b.id = $1`,
      [bookingId]
    );
    return rows[0] ?? null;
  },

  /**
   * Persist the Google event ID back onto the booking row.
   */
  async saveGoogleEventId(bookingId, { googleEventId, calendarId }) {
    const { rows } = await query(
      `UPDATE bookings
       SET  google_event_id    = $2,
            google_calendar_id = $3,
            calendar_synced_at = NOW()
       WHERE id = $1
       RETURNING id, google_event_id, calendar_synced_at`,
      [bookingId, googleEventId, calendarId]
    );
    return rows[0] ?? null;
  },

  /**
   * Clear the Google event reference (after deletion).
   */
  async clearGoogleEventId(bookingId) {
    await query(
      `UPDATE bookings
       SET google_event_id    = NULL,
           google_calendar_id = NULL,
           calendar_synced_at = NOW()
       WHERE id = $1`,
      [bookingId]
    );
  },

  /**
   * Find all confirmed/completed bookings that do NOT yet have a
   * Google Calendar event. Used by the bulk-sync endpoint.
   *
   * @param {number} limit   max rows to return (default 100)
   */
  async findUnsynced(limit = 100) {
    const { rows } = await query(
      `SELECT ${BOOKING_COLS}
       FROM   bookings b
       JOIN   services s ON s.id = b.service_id
       JOIN   users    u ON u.id = b.user_id
       WHERE  b.status IN ('confirmed', 'completed')
         AND  b.google_event_id IS NULL
         AND  b.booking_date >= CURRENT_DATE - INTERVAL '90 days'
       ORDER  BY b.booking_date ASC
       LIMIT  $1`,
      [limit]
    );
    return rows;
  },

  /**
   * Fetch all bookings that have a Google event ID — for a full re-sync.
   */
  async findSynced(limit = 500) {
    const { rows } = await query(
      `SELECT ${BOOKING_COLS}
       FROM   bookings b
       JOIN   services s ON s.id = b.service_id
       JOIN   users    u ON u.id = b.user_id
       WHERE  b.google_event_id IS NOT NULL
       ORDER  BY b.booking_date ASC
       LIMIT  $1`,
      [limit]
    );
    return rows;
  },

  /**
   * Fetch recent sync log entries for display.
   */
  async getSyncLog({ bookingId, limit = 20 } = {}) {
    const conditions = ['1=1'];
    const values     = [];
    let   idx        = 1;

    if (bookingId) {
      conditions.push(`sl.booking_id = $${idx++}`);
      values.push(bookingId);
    }

    const { rows } = await query(
      `SELECT
         sl.*,
         u.name  AS admin_name,
         b.booking_date::TEXT AS booking_date
       FROM   calendar_sync_log sl
       LEFT   JOIN users    u ON u.id = sl.admin_id
       LEFT   JOIN bookings b ON b.id = sl.booking_id
       WHERE  ${conditions.join(' AND ')}
       ORDER  BY sl.created_at DESC
       LIMIT  $${idx}`,
      [...values, limit]
    );
    return rows;
  },
};

module.exports = CalendarModel;
