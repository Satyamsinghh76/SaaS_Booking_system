'use strict';

const { AdminBookingModel, AdminUserModel } = require('../models/adminModel');
const Q = require('../utils/analyticsQueries');

// ── Shared helpers ────────────────────────────────────────────

const paginate = (total, page, limit) => ({
  total,
  page,
  limit,
  total_pages: Math.ceil(total / limit),
  has_next:    page * limit < total,
  has_prev:    page > 1,
});

const parseListParams = (q) => ({
  page:  Math.max(1,   parseInt(q.page   || '1',  10)),
  limit: Math.min(100, parseInt(q.limit  || '20', 10)),
});

const parseDateRange = (q) => ({
  from: q.from || q.start_date || undefined,
  to:   q.to   || q.end_date   || undefined,
});

// ── Default date range: last 30 days ─────────────────────────
const defaultRange = () => {
  const to   = new Date();
  const from = new Date(to.getTime() - 30 * 86_400_000);
  return {
    from: from.toISOString().slice(0, 10),
    to:   to.toISOString().slice(0, 10),
  };
};

// ════════════════════════════════════════════════════════════
//  BOOKINGS
// ════════════════════════════════════════════════════════════

/**
 * GET /api/admin/bookings
 * Full-featured paginated booking list with search + filters.
 */
const getAllBookings = async (req, res, next) => {
  try {
    const { page, limit } = parseListParams(req.query);
    const { from, to }    = parseDateRange(req.query);

    const { rows, total } = await AdminBookingModel.findAll({
      userId:        req.query.user_id,
      serviceId:     req.query.service_id,
      status:        req.query.status,
      paymentStatus: req.query.payment_status,
      date:          req.query.date,
      search:        req.query.search,
      from,
      to,
      page,
      limit,
    });

    return res.json({
      success: true,
      data:    rows,
      meta:    paginate(total, page, limit),
      filters: { from, to, status: req.query.status ?? null },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/bookings/:id
 * Single booking with full user + service detail.
 */
const getBookingById = async (req, res, next) => {
  try {
    const booking = await AdminBookingModel.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }
    return res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════
//  USERS
// ════════════════════════════════════════════════════════════

/**
 * GET /api/admin/users
 * Paginated user list with booking aggregates, search, and sort.
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page, limit } = parseListParams(req.query);
    const { from, to }    = parseDateRange(req.query);

    // Parse isActive: "true" → true, "false" → false, absent → undefined
    let isActive;
    if (req.query.is_active === 'true')  isActive = true;
    if (req.query.is_active === 'false') isActive = false;

    const { rows, total } = await AdminUserModel.findAll({
      role:     req.query.role,
      isActive,
      search:   req.query.search,
      from,
      to,
      page,
      limit,
      sortBy:   req.query.sort_by  || 'created_at',
      sortDir:  req.query.sort_dir || 'desc',
    });

    return res.json({
      success: true,
      data:    rows,
      meta:    paginate(total, page, limit),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/users/:id
 * Single user profile with lifetime stats + recent bookings.
 */
const getUserById = async (req, res, next) => {
  try {
    const [user, recentBookings] = await Promise.all([
      AdminUserModel.findById(req.params.id),
      AdminUserModel.getRecentBookings(req.params.id, 5),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({
      success: true,
      data: { ...user, recent_bookings: recentBookings },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/users/:id/status
 * Activate or deactivate a user account.
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const isActive = req.body.is_active;
    if (typeof isActive !== 'boolean') {
      return res.status(422).json({
        success: false,
        message: 'is_active must be a boolean.',
      });
    }

    const updated = await AdminUserModel.updateStatus(req.params.id, isActive);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'}.`,
      data:    updated,
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════
//  ANALYTICS — OVERVIEW
// ════════════════════════════════════════════════════════════

/**
 * GET /api/admin/analytics/overview
 * Top-level KPI summary. Runs 4 queries in parallel.
 *
 * Response shape:
 * {
 *   period:          { from, to },
 *   bookings:        { total, active, cancelled, completed, pending, no_show },
 *   revenue:         { total, avg_booking_value, paid, refunded },
 *   payments:        { paid_count, unpaid_count, refunded_count },
 *   users:           { total, new, active_in_period },
 *   comparison:      { ... period-over-period changes ... }
 * }
 */
const getAnalyticsOverview = async (req, res, next) => {
  try {
    const range = req.query.from ? parseDateRange(req.query) : defaultRange();
    const { from, to } = range;

    // Run all overview queries in parallel
    const [overview, userStats, comparison] = await Promise.all([
      Q.getOverview({ from, to }),
      Q.getUserStats({ from, to }),
      Q.getPeriodComparison(from, to),
    ]);

    return res.json({
      success: true,
      data: {
        period: { from, to },

        bookings: {
          total:      parseInt(overview.total_bookings),
          active:     parseInt(overview.active_bookings),
          completed:  parseInt(overview.completed_bookings),
          pending:    parseInt(overview.pending_bookings),
          cancelled:  parseInt(overview.cancelled_bookings),
          no_show:    parseInt(overview.no_show_bookings),
        },

        revenue: {
          total:             parseFloat(overview.total_revenue),
          avg_booking_value: parseFloat(overview.avg_booking_value),
          total_refunded:    parseFloat(overview.total_refunded),
        },

        payments: {
          paid:     parseInt(overview.paid_bookings),
          unpaid:   parseInt(overview.unpaid_bookings),
          refunded: parseInt(overview.refunded_bookings),
        },

        users: {
          total:            parseInt(userStats.total_users),
          new_in_period:    parseInt(userStats.new_users),
          active_in_period: parseInt(userStats.active_users_in_period),
        },

        comparison,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════
//  ANALYTICS — REVENUE
// ════════════════════════════════════════════════════════════

/**
 * GET /api/admin/analytics/revenue
 * Revenue time-series + breakdown by service.
 * ?granularity=day|month (default: day)
 */
const getRevenueAnalytics = async (req, res, next) => {
  try {
    const { from, to }  = req.query.from ? parseDateRange(req.query) : defaultRange();
    const granularity   = req.query.granularity === 'month' ? 'month' : 'day';

    const [timeSeries, byService] = await Promise.all([
      granularity === 'month'
        ? Q.getRevenueByMonth({ from, to })
        : Q.getRevenueByDay({ from, to }),
      Q.getRevenueByService({ from, to }),
    ]);

    // Compute totals from timeSeries
    const totalRevenue  = timeSeries.reduce((s, r) => s + parseFloat(r.revenue), 0);
    const totalBookings = timeSeries.reduce((s, r) => s + parseInt(r.bookings), 0);

    return res.json({
      success: true,
      data: {
        period:       { from, to, granularity },
        summary: {
          total_revenue:     parseFloat(totalRevenue.toFixed(2)),
          total_bookings:    totalBookings,
          avg_booking_value: totalBookings > 0
            ? parseFloat((totalRevenue / totalBookings).toFixed(2))
            : 0,
        },
        time_series: timeSeries,
        by_service:  byService,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════
//  ANALYTICS — SERVICES
// ════════════════════════════════════════════════════════════

/**
 * GET /api/admin/analytics/services
 * Popular services ranked by bookings and revenue.
 */
const getServiceAnalytics = async (req, res, next) => {
  try {
    const { from, to } = req.query.from ? parseDateRange(req.query) : defaultRange();
    const limit        = Math.min(50, parseInt(req.query.limit || '10', 10));

    const services = await Q.getPopularServices({ from, to, limit });

    // Identify the top service for each dimension
    const topByBookings = services[0]?.service_name ?? null;
    const topByRevenue  = [...services].sort((a, b) => b.total_revenue - a.total_revenue)[0]?.service_name ?? null;

    return res.json({
      success: true,
      data: {
        period:           { from, to },
        top_by_bookings:  topByBookings,
        top_by_revenue:   topByRevenue,
        services,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════
//  ANALYTICS — BOOKINGS PATTERNS
// ════════════════════════════════════════════════════════════

/**
 * GET /api/admin/analytics/bookings
 * Booking volume patterns: hourly, day-of-week, status distribution.
 */
const getBookingPatterns = async (req, res, next) => {
  try {
    const { from, to } = req.query.from ? parseDateRange(req.query) : defaultRange();

    const [byHour, byDow, statusDist] = await Promise.all([
      Q.getBookingsByHour({ from, to }),
      Q.getBookingsByDayOfWeek({ from, to }),
      Q.getStatusDistribution({ from, to }),
    ]);

    // Find peak hour and day
    const peakHour = byHour.reduce((p, c) => (parseInt(c.bookings) > parseInt(p?.bookings ?? 0) ? c : p), null);
    const peakDay  = byDow.reduce((p, c) =>  (parseInt(c.bookings) > parseInt(p?.bookings ?? 0) ? c : p), null);

    return res.json({
      success: true,
      data: {
        period:       { from, to },
        peak_hour:    peakHour  ? `${String(peakHour.hour).padStart(2,'0')}:00` : null,
        peak_day:     peakDay   ? peakDay.day_name?.trim() : null,
        by_hour:      byHour,
        by_day_of_week: byDow,
        status_distribution: statusDist,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════
//  ANALYTICS — USERS
// ════════════════════════════════════════════════════════════

/**
 * GET /api/admin/analytics/users
 * Top customers + user growth trend.
 */
const getUserAnalytics = async (req, res, next) => {
  try {
    const { from, to } = req.query.from ? parseDateRange(req.query) : defaultRange();
    const limit        = Math.min(50, parseInt(req.query.limit || '10', 10));
    const sortBy       = req.query.sort_by === 'bookings' ? 'bookings' : 'revenue';

    const [topCustomers, growth] = await Promise.all([
      Q.getTopCustomers({ from, to, limit, sortBy }),
      Q.getUserGrowthByMonth({ from, to }),
    ]);

    return res.json({
      success: true,
      data: {
        period:        { from, to },
        top_customers: topCustomers,
        growth_by_month: growth,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════
//  ANALYTICS — FULL DASHBOARD (single request)
// ════════════════════════════════════════════════════════════

/**
 * GET /api/admin/analytics/dashboard
 * Returns ALL analytics data in one payload — for dashboard initial load.
 * Runs everything in parallel for performance.
 */
const getDashboard = async (req, res, next) => {
  try {
    const { from, to } = req.query.from ? parseDateRange(req.query) : defaultRange();

    const [
      overview,
      userStats,
      revenueByDay,
      popularServices,
      revenueByService,
      byHour,
      byDow,
      statusDist,
      topCustomers,
      comparison,
    ] = await Promise.all([
      Q.getOverview({ from, to }),
      Q.getUserStats({ from, to }),
      Q.getRevenueByDay({ from, to }),
      Q.getPopularServices({ from, to, limit: 5 }),
      Q.getRevenueByService({ from, to }),
      Q.getBookingsByHour({ from, to }),
      Q.getBookingsByDayOfWeek({ from, to }),
      Q.getStatusDistribution({ from, to }),
      Q.getTopCustomers({ from, to, limit: 5 }),
      Q.getPeriodComparison(from, to),
    ]);

    return res.json({
      success: true,
      data: {
        period: { from, to },

        kpis: {
          total_bookings:    parseInt(overview.total_bookings),
          total_revenue:     parseFloat(overview.total_revenue),
          avg_booking_value: parseFloat(overview.avg_booking_value),
          total_users:       parseInt(userStats.total_users),
          new_users:         parseInt(userStats.new_users),
          cancellation_rate: parseInt(overview.total_bookings) > 0
            ? parseFloat(
                (parseInt(overview.cancelled_bookings) / parseInt(overview.total_bookings) * 100).toFixed(1)
              )
            : 0,
        },

        revenue: {
          time_series: revenueByDay,
          by_service:  revenueByService,
        },

        services:     popularServices,
        patterns: {
          by_hour:             byHour,
          by_day_of_week:      byDow,
          status_distribution: statusDist,
        },
        top_customers: topCustomers,
        comparison,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  // Bookings
  getAllBookings,
  getBookingById,
  // Users
  getAllUsers,
  getUserById,
  updateUserStatus,
  // Analytics
  getAnalyticsOverview,
  getRevenueAnalytics,
  getServiceAnalytics,
  getBookingPatterns,
  getUserAnalytics,
  getDashboard,
};
