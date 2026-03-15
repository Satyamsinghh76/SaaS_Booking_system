const { query } = require('../config/database');

const AvailabilityModel = {

  // ── Service lookup ───────────────────────────────────────────

  /**
   * Fetch a single active service (needs duration_minutes for slot gen).
   * Returns null if not found or inactive.
   */
  async findServiceById(serviceId) {
    const { rows } = await query(
      `SELECT id, name, duration_minutes, price
       FROM   services
       WHERE  id = $1 AND is_active = TRUE`,
      [serviceId]
    );
    return rows[0] ?? null;
  },

  // ── Availability windows ─────────────────────────────────────

  /**
   * Fetch all availability windows for a service on a specific date.
   *
   * @param {string} serviceId  UUID
   * @param {string} date       "YYYY-MM-DD"
   * @returns {Array<{id, date, start_time, end_time}>}
   */
  async findWindowsByServiceAndDate(serviceId, date) {
    const { rows } = await query(
      `SELECT id,
              service_id,
              date::TEXT          AS date,
              start_time::TEXT    AS start_time,
              end_time::TEXT      AS end_time
       FROM   availability
       WHERE  service_id = $1
         AND  date       = $2
       ORDER  BY start_time`,
      [serviceId, date]
    );
    return rows;
  },

  /**
   * Fetch all availability windows for a service across a date range.
   * Returns rows grouped by date (useful for multi-day slot generation).
   *
   * @param {string} serviceId
   * @param {string} startDate  "YYYY-MM-DD"
   * @param {string} endDate    "YYYY-MM-DD"
   * @returns {Array<{id, date, start_time, end_time}>}
   */
  async findWindowsByServiceAndDateRange(serviceId, startDate, endDate) {
    const { rows } = await query(
      `SELECT id,
              service_id,
              date::TEXT          AS date,
              start_time::TEXT    AS start_time,
              end_time::TEXT      AS end_time
       FROM   availability
       WHERE  service_id = $1
         AND  date BETWEEN $2 AND $3
       ORDER  BY date, start_time`,
      [serviceId, startDate, endDate]
    );
    return rows;
  },

  // ── Booking lookups ──────────────────────────────────────────

  /**
   * Fetch all confirmed bookings for a service on a specific date.
   * Used to mark slots as unavailable.
   *
   * @param {string} serviceId
   * @param {string} date
   * @returns {Array<{start_time:string, end_time:string}>}
   */
  async findConfirmedBookings(serviceId, date) {
    const { rows } = await query(
      `SELECT start_time::TEXT AS start_time,
              end_time::TEXT   AS end_time
       FROM   bookings
       WHERE  service_id   = $1
         AND  booking_date = $2
         AND  status       = 'confirmed'
       ORDER  BY start_time`,
      [serviceId, date]
    );
    return rows;
  },

  /**
   * Fetch confirmed bookings across a date range.
   * Returns each row with its date so we can group them.
   */
  async findConfirmedBookingsForRange(serviceId, startDate, endDate) {
    const { rows } = await query(
      `SELECT booking_date::TEXT AS date,
              start_time::TEXT   AS start_time,
              end_time::TEXT     AS end_time
       FROM   bookings
       WHERE  service_id    = $1
         AND  booking_date BETWEEN $2 AND $3
         AND  status        = 'confirmed'
       ORDER  BY booking_date, start_time`,
      [serviceId, startDate, endDate]
    );
    return rows;
  },

  // ── Availability window CRUD (admin) ─────────────────────────

  /**
   * Create a new availability window.
   * The DB EXCLUDE constraint prevents overlaps.
   */
  async createWindow({ serviceId, date, startTime, endTime, createdBy }) {
    const { rows } = await query(
      `INSERT INTO availability (service_id, date, start_time, end_time, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING
         id,
         service_id,
         date::TEXT       AS date,
         start_time::TEXT AS start_time,
         end_time::TEXT   AS end_time,
         created_at`,
      [serviceId, date, startTime, endTime, createdBy ?? null]
    );
    return rows[0];
  },

  /**
   * Update an availability window.
   * Fails if the new times overlap an existing window (DB constraint).
   */
  async updateWindow(id, { date, startTime, endTime }) {
    const { rows } = await query(
      `UPDATE availability
       SET  date       = COALESCE($2, date),
            start_time = COALESCE($3, start_time),
            end_time   = COALESCE($4, end_time)
       WHERE id = $1
       RETURNING
         id,
         service_id,
         date::TEXT       AS date,
         start_time::TEXT AS start_time,
         end_time::TEXT   AS end_time`,
      [id, date ?? null, startTime ?? null, endTime ?? null]
    );
    return rows[0] ?? null;
  },

  /** Hard-delete an availability window (no bookings should reference it). */
  async deleteWindow(id) {
    const { rows } = await query(
      `DELETE FROM availability WHERE id = $1
       RETURNING id, service_id, date::TEXT AS date`,
      [id]
    );
    return rows[0] ?? null;
  },

  /** List all windows for a service (admin view). */
  async findAllWindowsForService(serviceId) {
    const { rows } = await query(
      `SELECT id,
              service_id,
              date::TEXT       AS date,
              start_time::TEXT AS start_time,
              end_time::TEXT   AS end_time,
              created_at
       FROM   availability
       WHERE  service_id = $1
       ORDER  BY date, start_time`,
      [serviceId]
    );
    return rows;
  },
};

module.exports = AvailabilityModel;
