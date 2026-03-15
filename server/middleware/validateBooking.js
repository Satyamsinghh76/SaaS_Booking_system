const { body, param, query, validationResult } = require('express-validator');

/** Short-circuit with 422 if any validation rule failed. */
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

// ── Reusable rules ────────────────────────────────────────────

const uuidParam = (field) =>
  param(field).isUUID().withMessage(`${field} must be a valid UUID.`);

const isoDate = (field, label = field) =>
  body(field)
    .notEmpty().withMessage(`${label} is required.`)
    .isDate({ format: 'YYYY-MM-DD', strictMode: true })
    .withMessage(`${label} must be a valid date in YYYY-MM-DD format.`)
    .custom((val) => {
      const today = new Date().toISOString().slice(0, 10);
      if (val < today) throw new Error(`${label} cannot be in the past.`);
      return true;
    });

const timeHHMM = (field, label = field) =>
  body(field)
    .notEmpty().withMessage(`${label} is required.`)
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage(`${label} must be in HH:MM format (24-hour).`);

// ── Rule sets ─────────────────────────────────────────────────

const createBookingRules = [
  body('service_id')
    .notEmpty().withMessage('service_id is required.')
    .isUUID().withMessage('service_id must be a valid UUID.'),

  isoDate('date', 'Booking date'),

  timeHHMM('start_time', 'Start time'),

  body('notes')
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters.'),

  validate,
];

const updateStatusRules = [
  uuidParam('id'),
  body('status')
    .notEmpty().withMessage('status is required.')
    .isIn(['confirmed', 'completed', 'cancelled', 'no_show'])
    .withMessage('status must be one of: confirmed, completed, cancelled, no_show.'),
  body('reason')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 300 }).withMessage('Reason cannot exceed 300 characters.'),
  validate,
];

const updatePaymentRules = [
  uuidParam('id'),
  body('payment_status')
    .notEmpty().withMessage('payment_status is required.')
    .isIn(['unpaid', 'paid', 'refunded', 'waived'])
    .withMessage('payment_status must be one of: unpaid, paid, refunded, waived.'),
  validate,
];

const listBookingsRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1–100.').toInt(),
  query('status').optional().isIn(['pending','confirmed','completed','cancelled','no_show']),
  query('payment_status').optional().isIn(['unpaid','paid','refunded','waived']),
  query('date').optional().isDate({ format: 'YYYY-MM-DD', strictMode: true }).withMessage('date must be YYYY-MM-DD.'),
  query('from').optional().isDate({ format: 'YYYY-MM-DD', strictMode: true }).withMessage('from must be YYYY-MM-DD.'),
  query('to').optional().isDate({ format: 'YYYY-MM-DD', strictMode: true }).withMessage('to must be YYYY-MM-DD.'),
  validate,
];

const idParamRules = [uuidParam('id'), validate];

module.exports = {
  createBookingRules,
  updateStatusRules,
  updatePaymentRules,
  listBookingsRules,
  idParamRules,
};
