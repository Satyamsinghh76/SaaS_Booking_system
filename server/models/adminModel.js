'use strict';

const { query }        = require('../config/database');
const { SEED_EMAILS }  = require('../utils/seedAccounts');

// ── Shared column lists ───────────────────────────────────────

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
  b.cancelled_at,
  b.cancellation_reason,
  b.created_at,
  b.updated_at,
  s.name                        AS service_name,
  s.duration_minutes,
  u.name                        AS user_name,
  u.email                       AS user_email
`.trim();

const USER_COLS = `
  u.id,
  u.name,
  u.email,
  u.role,
  u.is_active,
  u.created_at,
  COUNT(b.id)                                                       AS total_bookings,
  COUNT(b.id) FILTER (WHERE b.status = 'completed')                AS completed_bookings,
  COUNT(b.id) FILTER (WHERE b.status = 'cancelled')                AS cancelled_bookings,
  COALESCE(
    SUM(b.price_snapshot) FILTER (WHERE b.payment_status = 'paid'),
    0
  )::NUMERIC(12,2)                                                  AS total_spent,
  MAX(b.booking_date)::TEXT                                         AS last_booking_date
`.trim();

// ── Dynamic WHERE builder ─────────────────────────────────────

/**
 * Build a parameterised WHERE clause from a map of { column: value }.
 * Values that are undefined/null are skipped.
 *
 * @param {object}  filters    e.g. { 'b.status': 'confirmed', 'b.user_id': uuid }
 * @param {number}  startIdx   first $N index
 * @returns {{ clause: string, values: any[], nextIdx: number }}
 */
const buildWhere = (filters, startIdx = 1) => {
  const conditions = [];
  const values     = [];
  let   idx        = startIdx;

  for (const [col, val] of Object.entries(filters)) {
    if (val === undefined || val === null || val === '') continue;
    conditions.push(`${col} = $${idx++}`);
    values.push(val);
  }

  return {
    clause:  conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
    nextIdx: idx,
  };
};

// ── Booking model ─────────────────────────────────────────────

const AdminBookingModel = {

  /**
   * Paginated list of all bookings with rich filters.
   */
  async findAll({
    userId, serviceId, status, paymentStatus,
    date, from, to,
    search, seedOnly,
    page = 1, limit = 20,
  } = {}) {
    const conditions = ['1=1'];
    const values     = [];
    let   idx        = 1;

    if (userId)        { conditions.push(`b.user_id        = $${idx++}`); values.push(userId); }
    if (serviceId)     { conditions.push(`b.service_id     = $${idx++}`); values.push(serviceId); }
    if (status)        { conditions.push(`b.status         = $${idx++}`); values.push(status); }
    if (paymentStatus) { conditions.push(`b.payment_status = $${idx++}`); values.push(paymentStatus); }
    if (date)          { conditions.push(`b.booking_date   = $${idx++}::DATE`); values.push(date); }
    if (from)          { conditions.push(`b.booking_date  >= $${idx++}::DATE`); values.push(from); }
    if (to)            { conditions.push(`b.booking_date  <= $${idx++}::DATE`); values.push(to); }

    // Seed-account isolation
    if (seedOnly === true) {
      conditions.push(`b.user_id IN (SELECT id FROM users WHERE email = ANY($${idx++}::TEXT[]))`);
      values.push(SEED_EMAILS);
    } else if (seedOnly === false) {
      conditions.push(`b.user_id NOT IN (SELECT id FROM users WHERE email = ANY($${idx++}::TEXT[]))`);
      values.push(SEED_EMAILS);
    }

    // Full-text search across user name, email, service name
    if (search) {
      // Cap length to prevent excessively large ILIKE patterns
      const safeSearch = String(search).trim().slice(0, 100);
      conditions.push(
        `(u.name ILIKE $${idx} OR u.email ILIKE $${idx} OR s.name ILIKE $${idx})`
      );
      values.push(`%${safeSearch}%`);
      idx++;
    }

    const where  = `WHERE ${conditions.join(' AND ')}`;
    const offset = (page - 1) * limit;

    const [countRes, dataRes] = await Promise.all([
      query(
        `SELECT COUNT(*) AS total
         FROM   bookings b
         JOIN   services s ON s.id = b.service_id
         JOIN   users    u ON u.id = b.user_id
         ${where}`,
        values
      ),
      query(
        `SELECT ${BOOKING_COLS}
         FROM   bookings b
         JOIN   services s ON s.id = b.service_id
         JOIN   users    u ON u.id = b.user_id
         ${where}
         ORDER  BY b.created_at DESC
         LIMIT  $${idx} OFFSET $${idx + 1}`,
        [...values, limit, offset]
      ),
    ]);

    return {
      rows:  dataRes.rows,
      total: parseInt(countRes.rows[0].total, 10),
    };
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT ${BOOKING_COLS}
       FROM   bookings b
       JOIN   services s ON s.id = b.service_id
       JOIN   users    u ON u.id = b.user_id
       WHERE  b.id = $1`,
      [id]
    );
    return rows[0] ?? null;
  },
};

// ── User model ────────────────────────────────────────────────

const AdminUserModel = {

  /**
   * Paginated list of users with booking aggregates.
   */
  async findAll({
    role, isActive, search,
    from, to, seedOnly,
    page = 1, limit = 20,
    sortBy = 'created_at', sortDir = 'desc',
  } = {}) {
    const conditions = ['1=1'];
    const values     = [];
    let   idx        = 1;

    if (role !== undefined)     { conditions.push(`u.role      = $${idx++}`); values.push(role); }
    if (isActive !== undefined) { conditions.push(`u.is_active = $${idx++}`); values.push(isActive); }

    // Seed-account isolation
    if (seedOnly === true) {
      conditions.push(`u.id IN (SELECT id FROM users WHERE email = ANY($${idx++}::TEXT[]))`);
      values.push(SEED_EMAILS);
    } else if (seedOnly === false) {
      conditions.push(`u.id NOT IN (SELECT id FROM users WHERE email = ANY($${idx++}::TEXT[]))`);
      values.push(SEED_EMAILS);
    }

    if (search) {
      conditions.push(`(u.name ILIKE $${idx} OR u.email ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    // Filter users who have bookings in the date range
    if (from) { conditions.push(`EXISTS (SELECT 1 FROM bookings b2 WHERE b2.user_id = u.id AND b2.booking_date >= $${idx++}::DATE)`); values.push(from); }
    if (to)   { conditions.push(`EXISTS (SELECT 1 FROM bookings b2 WHERE b2.user_id = u.id AND b2.booking_date <= $${idx++}::DATE)`); values.push(to); }

    const where  = `WHERE ${conditions.join(' AND ')}`;
    const offset = (page - 1) * limit;

    // Whitelist sort columns to prevent SQL injection
    // Use qualified names for columns that exist on multiple tables in the JOIN
    const SORT_MAP = {
      created_at:        'u.created_at',
      name:              'u.name',
      email:             'u.email',
      total_spent:       'total_spent',
      total_bookings:    'total_bookings',
      last_booking_date: 'last_booking_date',
    };
    const safeSort = SORT_MAP[sortBy] || 'u.created_at';
    const safeDir      = sortDir === 'asc' ? 'ASC' : 'DESC';

    const [countRes, dataRes] = await Promise.all([
      query(`SELECT COUNT(*) AS total FROM users u ${where}`, values),
      query(
        `SELECT ${USER_COLS}
         FROM   users u
         LEFT   JOIN bookings b ON b.user_id = u.id
         ${where}
         GROUP  BY u.id, u.name, u.email, u.role, u.is_active, u.created_at
         ORDER  BY ${safeSort} ${safeDir}
         LIMIT  $${idx} OFFSET $${idx + 1}`,
        [...values, limit, offset]
      ),
    ]);

    return {
      rows:  dataRes.rows,
      total: parseInt(countRes.rows[0].total, 10),
    };
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT ${USER_COLS}
       FROM   users u
       LEFT   JOIN bookings b ON b.user_id = u.id
       WHERE  u.id = $1
       GROUP  BY u.id, u.name, u.email, u.role, u.is_active, u.created_at`,
      [id]
    );
    return rows[0] ?? null;
  },

  /** Fetch recent bookings for a specific user. */
  async getRecentBookings(userId, limit = 5) {
    const { rows } = await query(
      `SELECT ${BOOKING_COLS}
       FROM   bookings b
       JOIN   services s ON s.id = b.service_id
       JOIN   users    u ON u.id = b.user_id
       WHERE  b.user_id = $1
       ORDER  BY b.booking_date DESC
       LIMIT  $2`,
      [userId, limit]
    );
    return rows;
  },

  async updateStatus(id, isActive) {
    const { rows } = await query(
      `UPDATE users SET is_active = $1 WHERE id = $2
       RETURNING id, name, email, is_active`,
      [isActive, id]
    );
    return rows[0] ?? null;
  },
};

module.exports = { AdminBookingModel, AdminUserModel };
