'use strict';

const router = require('express').Router();
const { body, query, validationResult } = require('express-validator');

const {
  getAllBookings,
  getBookingById,
  confirmBooking,
  cancelBooking,
  deleteBooking,
  getAllUsers,
  getUserById,
  updateUserStatus,
  getAnalyticsOverview,
  getRevenueAnalytics,
  getServiceAnalytics,
  getBookingPatterns,
  getUserAnalytics,
  getDashboard,
} = require('../controllers/adminController');

const { requireAdmin, validateDateRange, validateUuidParam } = require('../middleware/auth');

// ── Validation helpers ─────────────────────────────────────────

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors:  errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const updateUserStatusRules = [
  body('is_active')
    .exists({ checkNull: true }).withMessage('is_active is required.')
    .isBoolean().withMessage('is_active must be a boolean.')
    .toBoolean(),
  validate,
];

// ── List query validation ──────────────────────────────────────

const BOOKING_STATUSES  = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
const PAYMENT_STATUSES  = ['unpaid', 'paid', 'refunded', 'waived'];
const USER_ROLES        = ['user', 'admin'];
const SORT_DIRS         = ['asc', 'desc'];
const USER_SORT_COLS    = ['created_at', 'name', 'email', 'total_spent', 'total_bookings', 'last_booking_date'];

const bookingListRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1–100.').toInt(),
  query('status').optional().isIn(BOOKING_STATUSES).withMessage(`status must be one of: ${BOOKING_STATUSES.join(', ')}.`),
  query('payment_status').optional().isIn(PAYMENT_STATUSES).withMessage(`payment_status must be one of: ${PAYMENT_STATUSES.join(', ')}.`),
  query('user_id').optional().isUUID().withMessage('user_id must be a valid UUID.'),
  query('service_id').optional().isUUID().withMessage('service_id must be a valid UUID.'),
  query('date').optional().isDate({ format: 'YYYY-MM-DD', strictMode: true }).withMessage('date must be YYYY-MM-DD.'),
  query('search').optional().isString().trim().isLength({ max: 100 }).withMessage('search must be 100 characters or fewer.'),
  validate,
];

const userListRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1–100.').toInt(),
  query('role').optional().isIn(USER_ROLES).withMessage(`role must be one of: ${USER_ROLES.join(', ')}.`),
  query('is_active').optional().isIn(['true', 'false']).withMessage('is_active must be true or false.'),
  query('sort_by').optional().isIn(USER_SORT_COLS).withMessage(`sort_by must be one of: ${USER_SORT_COLS.join(', ')}.`),
  query('sort_dir').optional().isIn(SORT_DIRS).withMessage('sort_dir must be asc or desc.'),
  query('search').optional().isString().trim().isLength({ max: 100 }).withMessage('search must be 100 characters or fewer.'),
  validate,
];

// All admin routes require authentication + admin role
router.use(...requireAdmin);

// Bookings
router.get('/bookings', validateDateRange, bookingListRules, getAllBookings);
router.get('/bookings/:id', validateUuidParam('id'), getBookingById);
router.patch('/bookings/:id/confirm', validateUuidParam('id'), confirmBooking);
router.patch('/bookings/:id/cancel', validateUuidParam('id'), cancelBooking);
router.delete('/bookings/:id', validateUuidParam('id'), deleteBooking);

// Users
router.get('/users', validateDateRange, userListRules, getAllUsers);
router.get('/users/:id', validateUuidParam('id'), getUserById);
router.patch('/users/:id/status', validateUuidParam('id'), updateUserStatusRules, updateUserStatus);

// Analytics
router.get('/analytics/dashboard', validateDateRange, getDashboard);
router.get('/analytics/overview', validateDateRange, getAnalyticsOverview);
router.get('/analytics/revenue', validateDateRange, getRevenueAnalytics);
router.get('/analytics/services', validateDateRange, getServiceAnalytics);
router.get('/analytics/bookings', validateDateRange, getBookingPatterns);
router.get('/analytics/users', validateDateRange, getUserAnalytics);

module.exports = router;
