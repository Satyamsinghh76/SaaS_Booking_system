const { body, param, query, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Reusable rules ────────────────────────────────────────────

const isValidDate = (field) =>
  field
    .isDate({ format: 'YYYY-MM-DD', strictMode: true })
    .withMessage(`${field.builder?.fields?.[0] ?? field} must be a valid date (YYYY-MM-DD).`)
    .custom((val) => {
      const d = new Date(`${val}T00:00:00Z`);
      if (isNaN(d.getTime())) throw new Error('Invalid date.');
      return true;
    });

const isValidTime = (field, label) =>
  field
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage(`${label} must be in HH:MM format (24h).`);

// ── Rule sets ─────────────────────────────────────────────────

const getSlotsRules = [
  param('serviceId').isUUID().withMessage('serviceId must be a valid UUID.'),
  query('date')
    .notEmpty().withMessage('date query param is required.')
    .isDate({ format: 'YYYY-MM-DD', strictMode: true }).withMessage('date must be YYYY-MM-DD.'),
  query('buffer_minutes')
    .optional()
    .isInt({ min: 0, max: 120 }).withMessage('buffer_minutes must be 0–120.').toInt(),
  query('lead_time_minutes')
    .optional()
    .isInt({ min: 0, max: 1440 }).withMessage('lead_time_minutes must be 0–1440.').toInt(),
  validate,
];

const getSlotsRangeRules = [
  param('serviceId').isUUID().withMessage('serviceId must be a valid UUID.'),
  query('start_date')
    .notEmpty().withMessage('start_date is required.')
    .isDate({ format: 'YYYY-MM-DD', strictMode: true }).withMessage('start_date must be YYYY-MM-DD.'),
  query('end_date')
    .notEmpty().withMessage('end_date is required.')
    .isDate({ format: 'YYYY-MM-DD', strictMode: true }).withMessage('end_date must be YYYY-MM-DD.'),
  query('buffer_minutes').optional().isInt({ min: 0, max: 120 }).toInt(),
  query('lead_time_minutes').optional().isInt({ min: 0, max: 1440 }).toInt(),
  validate,
];

const createWindowRules = [
  body('service_id').isUUID().withMessage('service_id must be a valid UUID.'),
  body('date')
    .notEmpty().withMessage('date is required.')
    .isDate({ format: 'YYYY-MM-DD', strictMode: true }).withMessage('date must be YYYY-MM-DD.'),
  body('start_time')
    .notEmpty().withMessage('start_time is required.')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('start_time must be HH:MM (24h).'),
  body('end_time')
    .notEmpty().withMessage('end_time is required.')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('end_time must be HH:MM (24h).')
    .custom((end, { req }) => {
      if (end <= req.body.start_time) {
        throw new Error('end_time must be after start_time.');
      }
      return true;
    }),
  validate,
];

const updateWindowRules = [
  param('id').isUUID().withMessage('Window ID must be a valid UUID.'),
  body('date')
    .optional()
    .isDate({ format: 'YYYY-MM-DD', strictMode: true }).withMessage('date must be YYYY-MM-DD.'),
  body('start_time')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('start_time must be HH:MM (24h).'),
  body('end_time')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('end_time must be HH:MM (24h).'),
  validate,
];

const idParamRules = [
  param('id').isUUID().withMessage('ID must be a valid UUID.'),
  validate,
];

const serviceIdParamRules = [
  param('serviceId').isUUID().withMessage('serviceId must be a valid UUID.'),
  validate,
];

module.exports = {
  getSlotsRules,
  getSlotsRangeRules,
  createWindowRules,
  updateWindowRules,
  idParamRules,
  serviceIdParamRules,
};
