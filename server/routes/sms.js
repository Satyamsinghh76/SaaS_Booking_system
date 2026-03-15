'use strict';

const router = require('express').Router();
const express = require('express');

const {
  sendSMS,
  sendBookingConfirmation,
  sendAppointmentReminder,
  sendCancellationNotice,
  getSMSPreferences,
  updateSMSPreferences,
  getSMSLogs,
  handleWebhook,
  getMessageStatus,
} = require('../controllers/smsController');

const { authenticate, validateUuidParam } = require('../middleware/auth');

// Twilio webhook — raw body required for signature verification
router.post(
  '/webhook',
  express.raw({
    type: 'application/json',
    verify: (req, _res, buf) => { req.rawBody = buf; },
  }),
  handleWebhook
);

// Authenticated SMS routes
router.post('/send', authenticate, sendSMS);
router.get('/preferences', authenticate, getSMSPreferences);
router.put('/preferences', authenticate, updateSMSPreferences);
router.get('/logs', authenticate, getSMSLogs);
router.get('/status/:messageId', authenticate, validateUuidParam('messageId'), getMessageStatus);

// Booking-specific SMS routes
router.post('/booking/:bookingId/confirm', authenticate, validateUuidParam('bookingId'), sendBookingConfirmation);
router.post('/booking/:bookingId/reminder', authenticate, validateUuidParam('bookingId'), sendAppointmentReminder);
router.post('/booking/:bookingId/cancel', authenticate, validateUuidParam('bookingId'), sendCancellationNotice);

module.exports = router;
