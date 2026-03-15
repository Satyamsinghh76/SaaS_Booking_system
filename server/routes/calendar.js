'use strict';

const router = require('express').Router();

const {
  getOAuthUrl,
  oauthCallback,
  getStatus,
  syncBooking,
  bulkSync,
  deleteEvent,
  getSyncLog,
} = require('../controllers/calendarController');

const { requireAdmin, validateUuidParam } = require('../middleware/auth');

// OAuth flow
router.get('/oauth/url', ...requireAdmin, getOAuthUrl);
router.get('/oauth/callback', oauthCallback); // Google redirects here — no JWT guard

// Status & audit
router.get('/status', ...requireAdmin, getStatus);
router.get('/log', ...requireAdmin, getSyncLog);

// Sync — bulk must be before /:bookingId to avoid param collision
router.post('/sync/bulk', ...requireAdmin, bulkSync);
router.post('/sync/:bookingId', ...requireAdmin, validateUuidParam('bookingId'), syncBooking);
router.delete('/event/:bookingId', ...requireAdmin, validateUuidParam('bookingId'), deleteEvent);

module.exports = router;
