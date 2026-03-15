'use strict';

const CalendarService = require('../services/calendarService');
const CalendarModel   = require('../models/calendarModel');

// ════════════════════════════════════════════════════════════
//  OAUTH FLOW
// ════════════════════════════════════════════════════════════

/**
 * GET /api/calendar/oauth/url
 * Returns the Google consent URL. Admin opens this in their browser.
 */
const getOAuthUrl = (req, res) => {
  const url = CalendarService.getAuthUrl();
  return res.json({
    success:  true,
    auth_url: url,
    message:  'Open auth_url in your browser to connect Google Calendar.',
  });
};

/**
 * GET /api/calendar/oauth/callback
 * Google redirects here after admin grants consent.
 * Exchanges `code` for tokens, stores them, redirects admin to success page.
 */
const oauthCallback = async (req, res, next) => {
  try {
    const { code, error } = req.query;

    if (error) {
      return res.status(400).json({
        success: false,
        message: `Google authorisation denied: ${error}`,
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Missing authorisation code from Google.',
      });
    }

    // We need to know which admin is authorising.
    // The admin must be logged in — their session ID is passed via `state` param.
    // For simplicity here we use the first admin user; in production
    // pass &state=<adminId> in getAuthUrl() and read it back here.
    const adminId = req.query.state || req.user?.id;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: 'Could not determine admin user. Pass state=<adminId> in the auth URL.',
      });
    }

    const result = await CalendarService.handleOAuthCallback(code, adminId);

    return res.json({
      success:       true,
      message:       'Google Calendar connected successfully.',
      google_email:  result.googleEmail,
      calendar_id:   result.calendarId,
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════
//  STATUS
// ════════════════════════════════════════════════════════════

/**
 * GET /api/calendar/status
 * Check whether the calendar integration is active and healthy.
 */
const getStatus = async (req, res, next) => {
  try {
    const status = await CalendarService.checkConnection(req.user.id);

    return res.json({
      success: true,
      data: {
        connected:     status.connected,
        calendar_id:   status.calendarId   ?? null,
        calendar_name: status.calendarName ?? null,
        reason:        status.reason       ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════
//  MANUAL SYNC — single booking
// ════════════════════════════════════════════════════════════

/**
 * POST /api/calendar/sync/:bookingId
 * Manually create or update the calendar event for one booking.
 * Idempotent — safe to call multiple times.
 */
const syncBooking = async (req, res, next) => {
  try {
    const booking = await CalendarModel.findBookingForCalendar(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const syncResult = await CalendarService.syncBooking(booking, req.user.id);

    if (syncResult.action === 'skipped') {
      return res.json({
        success: true,
        message: `Booking skipped: ${syncResult.reason}`,
        data:    { action: 'skipped', booking_id: booking.id },
      });
    }

    // Persist event ID to DB
    await CalendarModel.saveGoogleEventId(booking.id, {
      googleEventId: syncResult.eventId,
      calendarId:    syncResult.calendarId,
    });

    await CalendarService.logSyncAction({
      bookingId:    booking.id,
      adminId:      req.user.id,
      action:       syncResult.action === 'created' ? 'create' : 'update',
      status:       'success',
      googleEventId: syncResult.eventId,
    });

    return res.json({
      success: true,
      message: `Calendar event ${syncResult.action}.`,
      data: {
        booking_id:     booking.id,
        google_event_id: syncResult.eventId,
        event_link:     syncResult.eventLink ?? null,
        action:         syncResult.action,
      },
    });
  } catch (err) {
    await CalendarService.logSyncAction({
      bookingId:    req.params.bookingId,
      adminId:      req.user.id,
      action:       'create',
      status:       'failed',
      errorMessage: err.message,
    }).catch(() => {});

    if (err.code === 'CALENDAR_NOT_AUTHORISED') {
      return res.status(403).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// ════════════════════════════════════════════════════════════
//  BULK SYNC
// ════════════════════════════════════════════════════════════

/**
 * POST /api/calendar/sync/bulk
 * Sync all confirmed/completed bookings that don't have a calendar event.
 * Processes up to 100 bookings. Run multiple times for larger backlogs.
 */
const bulkSync = async (req, res, next) => {
  try {
    const limit    = Math.min(100, parseInt(req.query.limit || '50', 10));
    const bookings = await CalendarModel.findUnsynced(limit);

    if (bookings.length === 0) {
      return res.json({
        success: true,
        message: 'All bookings are already synced.',
        data:    { processed: 0, created: 0, skipped: 0, failed: 0 },
      });
    }

    const results = { processed: 0, created: 0, updated: 0, skipped: 0, failed: 0, errors: [] };

    for (const booking of bookings) {
      results.processed++;
      try {
        const syncResult = await CalendarService.syncBooking(booking, req.user.id);

        if (syncResult.action === 'skipped') {
          results.skipped++;
          continue;
        }

        await CalendarModel.saveGoogleEventId(booking.id, {
          googleEventId: syncResult.eventId,
          calendarId:    syncResult.calendarId,
        });

        syncResult.action === 'created' ? results.created++ : results.updated++;

        await CalendarService.logSyncAction({
          bookingId:     booking.id,
          adminId:       req.user.id,
          action:        syncResult.action === 'created' ? 'create' : 'update',
          status:        'success',
          googleEventId: syncResult.eventId,
        });

        // Respect Google Calendar API rate limit: ~10 writes/second
        await new Promise((r) => setTimeout(r, 120));

      } catch (err) {
        results.failed++;
        results.errors.push({ booking_id: booking.id, error: err.message });

        await CalendarService.logSyncAction({
          bookingId:    booking.id,
          adminId:      req.user.id,
          action:       'bulk_sync',
          status:       'failed',
          errorMessage: err.message,
        });
      }
    }

    await CalendarService.logSyncAction({
      adminId:  req.user.id,
      action:   'bulk_sync',
      status:   results.failed === results.processed ? 'failed' : 'success',
      metadata: results,
    });

    return res.json({
      success: true,
      message: `Bulk sync complete: ${results.created} created, ${results.updated} updated, ${results.failed} failed.`,
      data: results,
    });
  } catch (err) {
    if (err.code === 'CALENDAR_NOT_AUTHORISED') {
      return res.status(403).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// ════════════════════════════════════════════════════════════
//  DELETE EVENT
// ════════════════════════════════════════════════════════════

/**
 * DELETE /api/calendar/event/:bookingId
 * Remove the calendar event for a booking (e.g. when it's cancelled).
 */
const deleteEvent = async (req, res, next) => {
  try {
    const booking = await CalendarModel.findBookingForCalendar(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (!booking.google_event_id) {
      return res.json({
        success: true,
        message: 'No calendar event to delete.',
        data:    { booking_id: booking.id },
      });
    }

    await CalendarService.deleteEvent(booking.google_event_id, req.user.id);
    await CalendarModel.clearGoogleEventId(booking.id);

    await CalendarService.logSyncAction({
      bookingId:     booking.id,
      adminId:       req.user.id,
      action:        'delete',
      status:        'success',
      googleEventId: booking.google_event_id,
    });

    return res.json({
      success: true,
      message: 'Calendar event deleted.',
      data:    { booking_id: booking.id },
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════
//  SYNC LOG
// ════════════════════════════════════════════════════════════

/**
 * GET /api/calendar/log
 * View the calendar sync audit log.
 */
const getSyncLog = async (req, res, next) => {
  try {
    const entries = await CalendarModel.getSyncLog({
      bookingId: req.query.booking_id,
      limit:     Math.min(100, parseInt(req.query.limit || '20', 10)),
    });

    return res.json({ success: true, data: entries });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOAuthUrl,
  oauthCallback,
  getStatus,
  syncBooking,
  bulkSync,
  deleteEvent,
  getSyncLog,
};
