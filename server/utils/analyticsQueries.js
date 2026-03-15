/**
 * analyticsQueries.js
 * ─────────────────────────────────────────────────────────────
 * All raw SQL for admin analytics.
 *
 * Design principles
 * ─────────────────
 * • Every query is a named function that accepts a pg client/pool.
 *   The controller calls Promise.all() on several queries in
 *   parallel — this file has no business logic, only SQL.
 *
 * • Date filtering uses BETWEEN with explicit casting so the
 *   planner can use the idx_bookings_date index.
 *
 * • Revenue figures exclude cancelled bookings and use
 *   price_snapshot (locked at booking time) not the current
 *   service price, preserving historical accuracy.
 *
 * • "Active" bookings = confirmed | completed
 *   "All non-cancelled" = pending | confirmed | completed | no_show
 */

'use strict';

const { query } = require('../config/database');

// ── Date range helper ─────────────────────────────────────────

/**
 * Build a safe WHERE clause fragment + param array for an
 * optional [from, to] date range filter.
 *
 * @param {string|undefined} from  "YYYY-MM-DD"
 * @param {string|undefined} to    "YYYY-MM-DD"
 * @param {string}           col   column name, e.g. "b.booking_date"
 * @param {number}           startIdx  first $N placeholder index
 * @returns {{ clause: string, values: any[], nextIdx: number }}
 */
const dateRangeClause = (from, to, col, startIdx = 1) => {
  const values = [];
  let clause   = '';
  let idx      = startIdx;

  if (from && to) {
    clause = `AND ${col} BETWEEN $${idx}::DATE AND $${idx + 1}::DATE`;
    values.push(from, to);
    idx += 2;
  } else if (from) {
    clause = `AND ${col} >= $${idx}::DATE`;
    values.push(from);
    idx += 1;
  } else if (to) {
    clause = `AND ${col} <= $${idx}::DATE`;
    values.push(to);
    idx += 1;
  }

  return { clause, values, nextIdx: idx };
};

// ══════════════════════════════════════════════════════════════
//  OVERVIEW — top-level summary numbers
// ══════════════════════════════════════════════════════════════

/**
 * Returns one row: total_bookings, active_bookings, cancelled_bookings,
 * total_revenue, avg_booking_value, total_users, active_users.
 */
const getOverview = async ({ from, to } = {}) => {
  const { clause, values } = dateRangeClause(from, to, 'b.booking_date', 1);

  const { rows } = await query(
    `SELECT
       -- Booking counts by status
       COUNT(*)                                                       AS total_bookings,
       COUNT(*) FILTER (WHERE b.status IN ('confirmed', 'completed')) AS active_bookings,
       COUNT(*) FILTER (WHERE b.status = 'cancelled')                AS cancelled_bookings,
       COUNT(*) FILTER (WHERE b.status = 'completed')                AS completed_bookings,
       COUNT(*) FILTER (WHERE b.status = 'pending')                  AS pending_bookings,
       COUNT(*) FILTER (WHERE b.status = 'no_show')                  AS no_show_bookings,

       -- Revenue (confirmed + completed + paid only)
       COALESCE(
         SUM(b.price_snapshot)
           FILTER (WHERE b.status IN ('confirmed','completed') AND b.payment_status = 'paid'),
         0
       )::NUMERIC(12,2)                                              AS total_revenue,

       -- Avg booking value across paid bookings
       COALESCE(
         AVG(b.price_snapshot)
           FILTER (WHERE b.status IN ('confirmed','completed') AND b.payment_status = 'paid'),
         0
       )::NUMERIC(10,2)                                              AS avg_booking_value,

       -- Payment breakdown
       COUNT(*) FILTER (WHERE b.payment_status = 'paid')            AS paid_bookings,
       COUNT(*) FILTER (WHERE b.payment_status = 'unpaid')          AS unpaid_bookings,
       COUNT(*) FILTER (WHERE b.payment_status = 'refunded')        AS refunded_bookings,
       COALESCE(
         SUM(b.price_snapshot) FILTER (WHERE b.payment_status = 'refunded'),
         0
       )::NUMERIC(12,2)                                              AS total_refunded

     FROM bookings b
     WHERE 1=1 ${clause}`,
    values
  );

  return rows[0];
};

/**
 * Count of total and new users (registered within the period).
 */
const getUserStats = async ({ from, to } = {}) => {
  const { clause, values } = dateRangeClause(from, to, 'u.created_at::DATE', 1);

  const { rows } = await query(
    `SELECT
       (SELECT COUNT(*) FROM users)                                   AS total_users,
       COUNT(u.id)                                                    AS new_users,
       COUNT(u.id) FILTER (WHERE u.is_active = TRUE)                 AS active_users_in_period
     FROM users u
     WHERE 1=1 ${clause}`,
    values
  );

  return rows[0];
};

// ══════════════════════════════════════════════════════════════
//  REVENUE — time-series breakdown
// ══════════════════════════════════════════════════════════════

/**
 * Daily revenue for the given date range.
 * Returns rows: { date, bookings, revenue }
 */
const getRevenueByDay = async ({ from, to } = {}) => {
  const { clause, values } = dateRangeClause(from, to, 'b.booking_date', 1);

  const { rows } = await query(
    `SELECT
       b.booking_date::TEXT                                     AS date,
       COUNT(*)                                                 AS bookings,
       COALESCE(SUM(b.price_snapshot), 0)::NUMERIC(12,2)        AS revenue
     FROM bookings b
     WHERE b.status IN ('confirmed','completed')
       AND b.payment_status = 'paid'
       ${clause}
     GROUP  BY b.booking_date
     ORDER  BY b.booking_date ASC`,
    values
  );

  return rows;
};

/**
 * Monthly revenue summary.
 * Returns rows: { month (YYYY-MM), bookings, revenue, avg_value }
 */
const getRevenueByMonth = async ({ from, to } = {}) => {
  const { clause, values } = dateRangeClause(from, to, 'b.booking_date', 1);

  const { rows } = await query(
    `SELECT
       TO_CHAR(b.booking_date, 'YYYY-MM')                        AS month,
       COUNT(*)                                                   AS bookings,
       COALESCE(SUM(b.price_snapshot),  0)::NUMERIC(12,2)        AS revenue,
       COALESCE(AVG(b.price_snapshot),  0)::NUMERIC(10,2)        AS avg_value
     FROM bookings b
     WHERE b.status IN ('confirmed','completed')
       AND b.payment_status = 'paid'
       ${clause}
     GROUP  BY TO_CHAR(b.booking_date, 'YYYY-MM')
     ORDER  BY month ASC`,
    values
  );

  return rows;
};

// ══════════════════════════════════════════════════════════════
//  SERVICES — popularity & revenue
// ══════════════════════════════════════════════════════════════

/**
 * Most popular services ranked by number of confirmed/completed bookings.
 * Returns up to `limit` rows.
 *
 * Columns: service_id, service_name, total_bookings, completed_bookings,
 *          cancellation_rate_pct, total_revenue, avg_price
 */
const getPopularServices = async ({ from, to, limit = 10 } = {}) => {
  const { clause, values, nextIdx } = dateRangeClause(from, to, 'b.booking_date', 1);

  const { rows } = await query(
    `SELECT
       s.id                                                                           AS service_id,
       s.name                                                                         AS service_name,
       s.duration_minutes,
       s.price                                                                        AS current_price,

       -- Volume
       COUNT(b.id)                                                                    AS total_bookings,
       COUNT(b.id) FILTER (WHERE b.status = 'completed')                             AS completed_bookings,
       COUNT(b.id) FILTER (WHERE b.status = 'cancelled')                             AS cancelled_bookings,

       -- Cancellation rate as a percentage
       CASE WHEN COUNT(b.id) = 0 THEN 0
         ELSE ROUND(
           COUNT(b.id) FILTER (WHERE b.status = 'cancelled')::NUMERIC /
           COUNT(b.id)::NUMERIC * 100, 1
         )
       END                                                                            AS cancellation_rate_pct,

       -- Revenue (paid only)
       COALESCE(
         SUM(b.price_snapshot)
           FILTER (WHERE b.status IN ('confirmed','completed') AND b.payment_status = 'paid'),
         0
       )::NUMERIC(12,2)                                                              AS total_revenue,

       COALESCE(
         AVG(b.price_snapshot)
           FILTER (WHERE b.status IN ('confirmed','completed') AND b.payment_status = 'paid'),
         0
       )::NUMERIC(10,2)                                                              AS avg_price

     FROM services s
     LEFT JOIN bookings b ON b.service_id = s.id
       AND b.booking_date IS NOT NULL
       ${clause}
     GROUP  BY s.id, s.name, s.duration_minutes, s.price
     ORDER  BY total_bookings DESC, total_revenue DESC
     LIMIT  $${nextIdx}`,
    [...values, limit]
  );

  return rows;
};

/**
 * Revenue split by service (pie-chart friendly).
 * Returns: { service_id, service_name, revenue, revenue_pct }
 */
const getRevenueByService = async ({ from, to } = {}) => {
  const { clause, values } = dateRangeClause(from, to, 'b.booking_date', 1);

  const { rows } = await query(
    `WITH svc_rev AS (
       SELECT
         s.id   AS service_id,
         s.name AS service_name,
         COALESCE(SUM(b.price_snapshot), 0)::NUMERIC(12,2) AS revenue
       FROM services s
       LEFT JOIN bookings b ON b.service_id = s.id
         AND b.status IN ('confirmed','completed')
         AND b.payment_status = 'paid'
         ${clause}
       GROUP BY s.id, s.name
     ),
     total AS (SELECT SUM(revenue) AS grand_total FROM svc_rev)
     SELECT
       sr.service_id,
       sr.service_name,
       sr.revenue,
       CASE WHEN t.grand_total = 0 THEN 0
            ELSE ROUND(sr.revenue / t.grand_total * 100, 1)
       END AS revenue_pct
     FROM svc_rev sr, total t
     ORDER BY sr.revenue DESC`,
    values
  );

  return rows;
};

// ══════════════════════════════════════════════════════════════
//  BOOKINGS — time patterns
// ══════════════════════════════════════════════════════════════

/**
 * Which hours of the day are most popular for bookings?
 * Returns rows: { hour (0-23), bookings }
 */
const getBookingsByHour = async ({ from, to } = {}) => {
  const { clause, values } = dateRangeClause(from, to, 'b.booking_date', 1);

  const { rows } = await query(
    `SELECT
       EXTRACT(HOUR FROM b.start_time)::INTEGER AS hour,
       COUNT(*)                                  AS bookings
     FROM bookings b
     WHERE b.status NOT IN ('cancelled')
       ${clause}
     GROUP BY EXTRACT(HOUR FROM b.start_time)
     ORDER BY hour ASC`,
    values
  );

  return rows;
};

/**
 * Which days of the week get the most bookings?
 * Returns rows: { dow (0=Sun … 6=Sat), day_name, bookings }
 */
const getBookingsByDayOfWeek = async ({ from, to } = {}) => {
  const { clause, values } = dateRangeClause(from, to, 'b.booking_date', 1);

  const { rows } = await query(
    `SELECT
       EXTRACT(DOW FROM b.booking_date)::INTEGER          AS dow,
       TO_CHAR(b.booking_date, 'Day')                     AS day_name,
       COUNT(*)                                            AS bookings
     FROM bookings b
     WHERE b.status NOT IN ('cancelled')
       ${clause}
     GROUP BY EXTRACT(DOW FROM b.booking_date), TO_CHAR(b.booking_date, 'Day')
     ORDER BY dow ASC`,
    values
  );

  return rows;
};

/**
 * Booking status distribution.
 * Returns rows: { status, count, pct }
 */
const getStatusDistribution = async ({ from, to } = {}) => {
  const { clause, values } = dateRangeClause(from, to, 'b.booking_date', 1);

  const { rows } = await query(
    `WITH counts AS (
       SELECT b.status, COUNT(*) AS cnt
       FROM bookings b
       WHERE 1=1 ${clause}
       GROUP BY b.status
     ),
     total AS (SELECT SUM(cnt) AS n FROM counts)
     SELECT
       c.status,
       c.cnt                                                AS count,
       ROUND(c.cnt::NUMERIC / NULLIF(t.n, 0) * 100, 1)    AS pct
     FROM counts c, total t
     ORDER BY c.cnt DESC`,
    values
  );

  return rows;
};

// ══════════════════════════════════════════════════════════════
//  USERS
// ══════════════════════════════════════════════════════════════

/**
 * Top customers by total spend or booking count.
 * @param {'revenue'|'bookings'} sortBy
 */
const getTopCustomers = async ({ from, to, limit = 10, sortBy = 'revenue' } = {}) => {
  const { clause, values, nextIdx } = dateRangeClause(from, to, 'b.booking_date', 1);
  const orderCol = sortBy === 'bookings' ? 'total_bookings' : 'total_spent';

  const { rows } = await query(
    `SELECT
       u.id                                                        AS user_id,
       u.name,
       u.email,
       u.created_at::TEXT                                         AS member_since,
       COUNT(b.id)                                                AS total_bookings,
       COUNT(b.id) FILTER (WHERE b.status = 'completed')         AS completed_bookings,
       COALESCE(
         SUM(b.price_snapshot)
           FILTER (WHERE b.payment_status = 'paid'),
         0
       )::NUMERIC(12,2)                                          AS total_spent,
       MAX(b.booking_date)::TEXT                                  AS last_booking_date
     FROM users u
     LEFT JOIN bookings b ON b.user_id = u.id ${clause}
     WHERE u.role = 'user'
     GROUP  BY u.id, u.name, u.email, u.created_at
     HAVING COUNT(b.id) > 0
     ORDER  BY ${orderCol} DESC
     LIMIT  $${nextIdx}`,
    [...values, limit]
  );

  return rows;
};

/**
 * User registration trend by month.
 */
const getUserGrowthByMonth = async ({ from, to } = {}) => {
  const { clause, values } = dateRangeClause(from, to, 'u.created_at::DATE', 1);

  const { rows } = await query(
    `SELECT
       TO_CHAR(u.created_at, 'YYYY-MM') AS month,
       COUNT(*)                          AS new_users
     FROM users u
     WHERE u.role = 'user'
       ${clause}
     GROUP  BY TO_CHAR(u.created_at, 'YYYY-MM')
     ORDER  BY month ASC`,
    values
  );

  return rows;
};

// ══════════════════════════════════════════════════════════════
//  COMPARISON — period-over-period
// ══════════════════════════════════════════════════════════════

/**
 * Compare current period vs previous period of equal length.
 * Returns: { current, previous, changes }
 */
const getPeriodComparison = async (from, to) => {
  const start   = new Date(`${from}T00:00:00Z`);
  const end     = new Date(`${to}T00:00:00Z`);
  const dayDiff = Math.round((end - start) / 86_400_000);

  const prevEnd   = new Date(start.getTime() - 86_400_000);
  const prevStart = new Date(prevEnd.getTime() - dayDiff * 86_400_000);

  const prevFrom = prevStart.toISOString().slice(0, 10);
  const prevTo   = prevEnd.toISOString().slice(0, 10);

  const [current, previous] = await Promise.all([
    getOverview({ from, to }),
    getOverview({ from: prevFrom, to: prevTo }),
  ]);

  const pct = (curr, prev) => {
    const c = parseFloat(curr  || 0);
    const p = parseFloat(prev  || 0);
    if (p === 0) return c > 0 ? 100 : 0;
    return parseFloat(((c - p) / p * 100).toFixed(1));
  };

  return {
    current_period:  { from, to },
    previous_period: { from: prevFrom, to: prevTo },
    metrics: {
      total_bookings: {
        current:  parseInt(current.total_bookings),
        previous: parseInt(previous.total_bookings),
        change_pct: pct(current.total_bookings, previous.total_bookings),
      },
      total_revenue: {
        current:  parseFloat(current.total_revenue),
        previous: parseFloat(previous.total_revenue),
        change_pct: pct(current.total_revenue, previous.total_revenue),
      },
      avg_booking_value: {
        current:  parseFloat(current.avg_booking_value),
        previous: parseFloat(previous.avg_booking_value),
        change_pct: pct(current.avg_booking_value, previous.avg_booking_value),
      },
      cancellation_rate: {
        current:  parseFloat(current.cancelled_bookings),
        previous: parseFloat(previous.cancelled_bookings),
        change_pct: pct(current.cancelled_bookings, previous.cancelled_bookings),
      },
    },
  };
};

module.exports = {
  getOverview,
  getUserStats,
  getRevenueByDay,
  getRevenueByMonth,
  getPopularServices,
  getRevenueByService,
  getBookingsByHour,
  getBookingsByDayOfWeek,
  getStatusDistribution,
  getTopCustomers,
  getUserGrowthByMonth,
  getPeriodComparison,
  dateRangeClause,
};
