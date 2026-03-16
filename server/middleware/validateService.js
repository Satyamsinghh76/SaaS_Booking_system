const { body, param, query, validationResult } = require('express-validator');

/**
 * Extracts validation errors from express-validator and
 * short-circuits with a 422 response if any exist.
 */
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

// ── Rule sets ─────────────────────────────────────────────────

const createServiceRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ max: 150 }).withMessage('Name must be 150 characters or fewer.'),

  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Description must be 1000 characters or fewer.'),

  body('duration_minutes')
    .notEmpty().withMessage('Duration is required.')
    .isInt({ min: 1, max: 1440 }).withMessage('Duration must be a whole number between 1 and 1440 minutes.')
    .toInt(),

  body('price')
    .notEmpty().withMessage('Price is required.')
    .isFloat({ min: 0 }).withMessage('Price must be a non-negative number.')
    .toFloat(),

  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Category must be 100 characters or fewer.'),

  validate,
];

const updateServiceRules = [
  param('id')
    .isUUID().withMessage('Service ID must be a valid UUID.'),

  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be blank.')
    .isLength({ max: 150 }).withMessage('Name must be 150 characters or fewer.'),

  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Description must be 1000 characters or fewer.'),

  body('duration_minutes')
    .optional()
    .isInt({ min: 1, max: 1440 }).withMessage('Duration must be a whole number between 1 and 1440 minutes.')
    .toInt(),

  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a non-negative number.')
    .toFloat(),

  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Category must be 100 characters or fewer.'),

  validate,
];

const idParamRules = [
  param('id')
    .isUUID().withMessage('Service ID must be a valid UUID.'),
  validate,
];

const listQueryRules = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer.')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.')
    .toInt(),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Search term must be 100 characters or fewer.'),

  validate,
];

module.exports = {
  createServiceRules,
  updateServiceRules,
  idParamRules,
  listQueryRules,
};
