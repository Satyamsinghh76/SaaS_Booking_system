const { body, param, validationResult } = require('express-validator');

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

const checkoutRules = [
  body('booking_id')
    .notEmpty().withMessage('booking_id is required.')
    .isUUID().withMessage('booking_id must be a valid UUID.'),
  validate,
];

const refundRules = [
  param('bookingId').isUUID().withMessage('bookingId must be a valid UUID.'),
  body('reason')
    .optional()
    .isIn(['duplicate', 'fraudulent', 'requested_by_customer'])
    .withMessage("reason must be 'duplicate', 'fraudulent', or 'requested_by_customer'."),
  validate,
];

const sessionIdRules = [
  param('sessionId')
    .notEmpty().withMessage('sessionId is required.')
    .matches(/^cs_/).withMessage('sessionId must be a valid Stripe session ID (cs_...).'),
  validate,
];

const bookingIdRules = [
  param('bookingId').isUUID().withMessage('bookingId must be a valid UUID.'),
  validate,
];

module.exports = { checkoutRules, refundRules, sessionIdRules, bookingIdRules };
