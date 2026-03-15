'use strict';

const router = require('express').Router();

const {
  createBooking,
  getBookings,
  getBookingById,
  updateStatus,
  updatePaymentStatus,
  getBookingEvents,
  cancelBooking,
  getBookedSlots,
} = require('../controllers/bookingController');

const { authenticate, requireAdmin } = require('../middleware/auth');

const {
  createBookingRules,
  updateStatusRules,
  updatePaymentRules,
  listBookingsRules,
  idParamRules,
} = require('../middleware/validateBooking');

// All booking routes require authentication
router.use(authenticate);

router.post('/', createBookingRules, createBooking);
router.get('/booked-slots', getBookedSlots);
router.get('/', listBookingsRules, getBookings);
router.get('/:id', idParamRules, getBookingById);
router.patch('/:id/status', updateStatusRules, updateStatus);
router.delete('/:id', idParamRules, cancelBooking);
router.patch('/:id/payment', ...requireAdmin, updatePaymentRules, updatePaymentStatus);
router.get('/:id/events', ...requireAdmin, idParamRules, getBookingEvents);

module.exports = router;
