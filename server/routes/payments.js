'use strict';

const router  = require('express').Router();
const express = require('express');

const { handleWebhook }        = require('../controllers/webhookHandler');
const {
  createCheckoutSession,
  getSessionStatus,
  createRefund,
  getPaymentForBooking,
  simulatePayment,
  getPaymentStatus,
}                              = require('../controllers/paymentController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  checkoutRules,
  refundRules,
  sessionIdRules,
  bookingIdRules,
}                              = require('../middleware/validatePayment');

// Stripe webhook — raw body required for signature verification.
// MUST be mounted before express.json() in server.js or use express.raw() here.
router.post(
  '/webhook',
  express.raw({
    type: 'application/json',
    verify: (req, _res, buf) => { req.rawBody = buf; },
  }),
  handleWebhook
);

// Authenticated payment routes
router.post('/checkout', authenticate, checkoutRules, createCheckoutSession);
router.get('/session/:sessionId', authenticate, sessionIdRules, getSessionStatus);
router.get('/booking/:bookingId', authenticate, bookingIdRules, getPaymentForBooking);
router.post('/:bookingId/refund', ...requireAdmin, refundRules, createRefund);

// Demo payment simulation routes
router.post('/simulate', authenticate, simulatePayment);
router.get('/status/:bookingId', authenticate, getPaymentStatus);

module.exports = router;
