/**
 * bookingController.js
 * ─────────────────────────────────────────────────────────────
 * Booking CRUD + status lifecycle with email notifications.
 *
 * Notification integration rules
 * ────────────────────────────────
 * 1. Email is sent AFTER the DB transaction commits successfully.
 * 2. Email failure NEVER fails the HTTP response.
 * 3. Emails are fired with fire-and-forget (non-blocking).
 *
 * Events that trigger an email
 * ─────────────────────────────
 *   updateStatus()     → 'confirmed'  → sendBookingConfirmed
 *                      → 'cancelled'  → sendBookingCancelled
 *   cancelBooking()    → 'cancelled'  → sendBookingCancelled
 *   updatePaymentStatus() → auto-confirm on 'paid' → sendBookingConfirmed
 */

'use strict';

const { query }           = require('../config/database');
const BookingModel        = require('../models/bookingModel');
const NotificationService = require('../services/notificationService');
const TwilioService       = require('../services/twilioService');
const CalendarService     = require('../services/calendarService');
const CalendarModel       = require('../models/calendarModel');
const TokenModel          = require('../models/tokenModel');

// ── Helpers ───────────────────────────────────────────────────

const paginate = (total, page, limit) => ({
  total,
  page,
  limit,
  total_pages: Math.ceil(total / limit),
  has_next:    page * limit < total,
  has_prev:    page > 1,
});

/**
 * Fire-and-forget calendar sync/delete for a booking.
 * Silently skips if no admin has connected Google Calendar.
 */
const calendarSync = async (bookingId, action = 'sync') => {
  try {
    const adminId = await TokenModel.getAuthorizedAdminId();
    if (!adminId) return; // No admin has connected Google Calendar

    const booking = await CalendarModel.findBookingForCalendar(bookingId);
    if (!booking) return;

    if (action === 'sync') {
      const result = await CalendarService.syncBooking(booking, adminId);
      if (result.eventId) {
        await CalendarModel.saveGoogleEventId(bookingId, result.eventId, adminId);
      }
      console.log(`📅 [calendar] ${result.action} event for booking ${bookingId}`);
    } else if (action === 'delete' && booking.google_event_id) {
      await CalendarService.deleteEvent(booking.google_event_id, adminId);
      await CalendarModel.clearGoogleEventId(bookingId);
      console.log(`📅 [calendar] Deleted event for booking ${bookingId}`);
    }
  } catch (err) {
    console.error(`[calendar] Failed to ${action} booking ${bookingId}:`, err.message);
  }
};

const resolveServiceAndEndTime = async (serviceId, startTime) => {
  const { rows } = await query(
    'SELECT id, name, duration_minutes, price, is_active FROM services WHERE id = $1',
    [serviceId]
  );
  if (!rows.length) {
    const err = new Error('Service not found.'); err.statusCode = 404; throw err;
  }
  const svc = rows[0];
  if (!svc.is_active) {
    const err = new Error('This service is no longer accepting bookings.'); err.statusCode = 410; throw err;
  }
  const [h, m] = startTime.split(':').map(Number);
  const totalM = h * 60 + m + svc.duration_minutes;
  if (Math.floor(totalM / 60) >= 24) {
    const err = new Error('Booking would extend past midnight.'); err.statusCode = 422; throw err;
  }
  const endTime = `${String(Math.floor(totalM / 60)).padStart(2, '0')}:${String(totalM % 60).padStart(2, '0')}`;
  return { service: svc, endTime };
};

// ── Controllers ───────────────────────────────────────────────

const createBooking = async (req, res, next) => {
  try {
    const { service_id, date, start_time, notes, customer_name, customer_email, customer_phone } = req.body;
    const userId = req.user.id;

    const { service, endTime } = await resolveServiceAndEndTime(service_id, start_time);

    const booking = await BookingModel.create({
      userId,
      serviceId:     service_id,
      date,
      startTime:     start_time,
      endTime,
      priceSnapshot: service.price,
      notes,
    });

    // Response first, then email (fire-and-forget)
    res.status(201).json({
      success: true,
      message: 'Booking created. Awaiting confirmation.',
      data:    { ...booking, service_name: service.name, duration_minutes: service.duration_minutes },
    });

    // Save phone number to user profile if provided
    if (customer_phone) {
      query('UPDATE users SET phone_number = $1 WHERE id = $2', [customer_phone, userId])
        .catch((err) => console.error('[booking] Failed to save phone:', err.message));
    }

    // Send confirmation email + SMS asynchronously — never blocks the response
    BookingModel.findById(booking.id)
      .then((fullBooking) => {
        if (!fullBooking) return;
        // Use the email/name/phone from the booking form if provided
        if (customer_email) fullBooking.user_email = customer_email;
        if (customer_name)  fullBooking.user_name  = customer_name;
        const phone = customer_phone || fullBooking.user_phone;
        NotificationService.sendBookingConfirmed(fullBooking);

        // Send SMS confirmation if phone number is available
        if (phone) {
          TwilioService.sendBookingConfirmation(fullBooking, {
            id: fullBooking.user_id,
            phone_number: phone,
          }).catch((err) => console.error('[booking] SMS confirmation failed:', err.message));
        }
      })
      .catch((err) => console.error('[booking] Failed to send confirmation email:', err.message));
  } catch (err) {
    if (err.code === 'SLOT_CONFLICT' || err.statusCode === 409 || err.code === '23P01') {
      return res.status(409).json({
        success:  false,
        message:  err.message || 'This time slot is already booked.',
        code:     'SLOT_CONFLICT',
        existing: err.existing ?? null,
      });
    }
    next(err);
  }
};

const getBookings = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const page    = Math.max(1,   parseInt(req.query.page  || '1',  10));
    const limit   = Math.min(100, parseInt(req.query.limit || '20', 10));

    const { rows, total } = await BookingModel.findAll({
      userId:        isAdmin ? req.query.user_id : req.user.id,
      serviceId:     req.query.service_id,
      status:        req.query.status,
      paymentStatus: req.query.payment_status,
      date:          req.query.date,
      from:          req.query.from,
      to:            req.query.to,
      page,
      limit,
    });

    return res.json({ success: true, data: rows, meta: paginate(total, page, limit) });
  } catch (err) {
    next(err);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const booking = await BookingModel.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }
    if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    return res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;

    const booking = await BookingModel.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (req.user.role !== 'admin') {
      if (booking.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
      if (status !== 'cancelled') {
        return res.status(403).json({ success: false, message: 'Users may only cancel bookings.' });
      }
    }

    await BookingModel.updateStatus(req.params.id, status, {
      actorId: req.user.id,
      reason,
    });

    const updatedBooking = await BookingModel.findById(req.params.id);

    // Response first, then email (fire-and-forget)
    res.json({ success: true, message: `Booking ${status}.`, data: updatedBooking });

    if (status === 'confirmed') {
      NotificationService.sendBookingConfirmed(updatedBooking);
      calendarSync(req.params.id, 'sync');
    }
    if (status === 'cancelled') {
      NotificationService.sendBookingCancelled(updatedBooking, {
        cancelledBy: req.user.role === 'admin' ? 'admin' : 'user',
        reason,
      });
      calendarSync(req.params.id, 'delete');
    }
  } catch (err) {
    if (err.code === 'INVALID_TRANSITION') {
      return res.status(422).json({ success: false, message: err.message });
    }
    next(err);
  }
};

const cancelBooking = async (req, res, next) => {
  req.body.status = 'cancelled';
  return updateStatus(req, res, next);
};

const updatePaymentStatus = async (req, res, next) => {
  try {
    const { payment_status } = req.body;
    const booking = await BookingModel.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    await BookingModel.updatePaymentStatus(req.params.id, payment_status, req.user.id);

    let finalBooking = await BookingModel.findById(req.params.id);
    let autoConfirmed = false;

    // Auto-confirm on first payment if still pending
    if (payment_status === 'paid' && finalBooking.status === 'pending') {
      await BookingModel.updateStatus(req.params.id, 'confirmed', { actorId: req.user.id });
      finalBooking = await BookingModel.findById(req.params.id);
      autoConfirmed = true;
    }

    res.json({
      success: true,
      message: `Payment status updated to '${payment_status}'.` + (autoConfirmed ? ' Booking auto-confirmed.' : ''),
      data:    finalBooking,
    });

    if (autoConfirmed) {
      NotificationService.sendBookingConfirmed(finalBooking);
      calendarSync(req.params.id, 'sync');
    }
  } catch (err) {
    next(err);
  }
};

const getBookingEvents = async (req, res, next) => {
  try {
    const booking = await BookingModel.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }
    const events = await BookingModel.getEvents(req.params.id);
    return res.json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/bookings/booked-slots?service_id=...&date=YYYY-MM-DD
 * Returns start_time values already booked for a service on a given date.
 */
const getBookedSlots = async (req, res, next) => {
  try {
    const { service_id, date } = req.query;
    if (!service_id || !date) {
      return res.status(400).json({ success: false, message: 'service_id and date are required.' });
    }
    const { rows } = await query(
      `SELECT start_time FROM bookings
       WHERE service_id = $1
         AND booking_date = $2
         AND status NOT IN ('cancelled', 'no_show')`,
      [service_id, date]
    );
    return res.json({ success: true, data: rows.map(r => r.start_time) });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateStatus,
  cancelBooking,
  updatePaymentStatus,
  getBookingEvents,
  getBookedSlots,
};
