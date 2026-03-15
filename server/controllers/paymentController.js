const crypto         = require('crypto');
const PaymentModel   = require('../models/paymentModel');
const StripeService  = require('../services/stripeService');
const logger         = require('../config/logger');

// ── Controller helpers ────────────────────────────────────────

/**
 * Build an idempotency key for a (user, booking) pair.
 * If the user retries the exact same booking, Stripe returns the
 * existing session rather than creating a new one.
 */
const buildIdempotencyKey = (userId, bookingId) =>
  crypto
    .createHash('sha256')
    .update(`checkout::${userId}::${bookingId}`)
    .digest('hex');

// ══════════════════════════════════════════════════════════════
//  CONTROLLERS
// ══════════════════════════════════════════════════════════════

/**
 * POST /api/payments/checkout
 * ─────────────────────────────────────────────────────────────
 * Creates a Stripe Checkout Session for an existing booking.
 *
 * Flow:
 *   1. Validate booking belongs to the requesting user
 *   2. Guard against double-payment
 *   3. Create Stripe Checkout Session
 *   4. Persist session record to DB
 *   5. Return checkout URL to client
 *
 * The client redirects to { url } — Stripe handles everything else.
 */
const createCheckoutSession = async (req, res, next) => {
  try {
    const { booking_id } = req.body;
    const userId         = req.user.id;

    // ── 1. Fetch booking ──────────────────────────────────────
    const booking = await PaymentModel.findBookingForPayment(booking_id, userId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    // ── 2. Guard against double-payment ──────────────────────
    if (booking.payment_status === 'paid') {
      return res.status(409).json({
        success: false,
        message: 'This booking has already been paid.',
        code:    'ALREADY_PAID',
      });
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(409).json({
        success: false,
        message: `Cannot pay for a booking with status: ${booking.status}.`,
        code:    'INVALID_BOOKING_STATUS',
      });
    }

    // Check if an open session already exists — re-use it
    const existingSession = await PaymentModel.findSessionByBookingId(booking_id);
    if (existingSession?.status === 'open') {
      // Retrieve the live session to make sure it hasn't expired on Stripe's side
      const liveSession = await StripeService.retrieveSession(existingSession.stripe_session_id);
      if (liveSession.status === 'open') {
        return res.json({
          success:     true,
          message:     'Checkout session already open. Use the existing URL.',
          data: {
            session_id:   liveSession.id,
            checkout_url: liveSession.url,
            expires_at:   new Date(liveSession.expires_at * 1000).toISOString(),
            reused:       true,
          },
        });
      }
      // Otherwise fall through to create a new session
    }

    // ── 3. Create Stripe Checkout Session ────────────────────
    const idempotencyKey = buildIdempotencyKey(userId, booking_id);

    const stripeSession = await StripeService.createCheckoutSession({
      booking: {
        id:              booking.id,
        service_id:      booking.service_id,
        service_name:    booking.service_name,
        date:            booking.date,
        start_time:      booking.start_time,
        end_time:        booking.end_time,
        duration_minutes: booking.duration_minutes,
        price_snapshot:  booking.price_snapshot,
      },
      user: {
        id:    booking.user_id,
        email: booking.user_email,
        name:  booking.user_name,
      },
      idempotencyKey,
    });

    // ── 4. Persist session to DB ─────────────────────────────
    await PaymentModel.createPaymentSession({
      bookingId:       booking_id,
      userId,
      stripeSessionId: stripeSession.id,
      amountTotal:     stripeSession.amount_total,
      currency:        stripeSession.currency,
      idempotencyKey,
      expiresAt:       new Date(stripeSession.expires_at * 1000),
    });

    // ── 5. Return checkout URL ────────────────────────────────
    return res.status(201).json({
      success: true,
      message: 'Checkout session created. Redirect the user to checkout_url.',
      data: {
        session_id:   stripeSession.id,
        checkout_url: stripeSession.url,       // ← client redirects here
        expires_at:   new Date(stripeSession.expires_at * 1000).toISOString(),
        amount:       StripeService.fromCents(stripeSession.amount_total),
        currency:     stripeSession.currency.toUpperCase(),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payments/session/:sessionId
 * ─────────────────────────────────────────────────────────────
 * Retrieve a Checkout Session's current status.
 * Called from the success/cancel page to confirm payment.
 */
const getSessionStatus = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    // Validate it belongs to this user
    const session = await PaymentModel.findSessionByStripeId(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    if (session.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Get live status from Stripe
    const liveSession = await StripeService.retrieveSession(sessionId);

    return res.json({
      success: true,
      data: {
        session_id:      liveSession.id,
        status:          liveSession.status,          // open | complete | expired
        payment_status:  liveSession.payment_status,  // unpaid | paid | no_payment_required
        amount_total:    StripeService.fromCents(liveSession.amount_total),
        currency:        liveSession.currency.toUpperCase(),
        booking_id:      liveSession.metadata.booking_id,
        receipt_url:     liveSession.payment_intent?.charges?.data?.[0]?.receipt_url ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/payments/:bookingId/refund
 * ─────────────────────────────────────────────────────────────
 * Issue a refund for a paid booking. Admin only.
 *
 * Stripe issues the refund; our webhook handler (charge.refunded)
 * updates the DB — so this is fire-and-forget from the API's perspective.
 */
const createRefund = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { reason }    = req.body;

    const booking = await PaymentModel.findBookingForPayment(bookingId, req.user.id === 'admin'
      ? req.body.user_id ?? req.user.id
      : req.user.id
    ) ?? await (async () => {
      // Admin path: fetch without user_id restriction
      const { query } = require('../config/database');
      const { rows }  = await query(
        `SELECT b.*, s.name AS service_name, s.duration_minutes,
                u.email AS user_email, u.name AS user_name
         FROM bookings b
         JOIN services s ON s.id = b.service_id
         JOIN users u    ON u.id = b.user_id
         WHERE b.id = $1`,
        [bookingId]
      );
      return rows[0] ?? null;
    })();

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.payment_status !== 'paid') {
      return res.status(409).json({
        success: false,
        message: `Cannot refund a booking with payment_status: ${booking.payment_status}.`,
      });
    }

    if (!booking.stripe_payment_intent_id) {
      return res.status(409).json({
        success: false,
        message: 'No Stripe payment intent found for this booking.',
      });
    }

    // Issue refund via Stripe
    const refund = await StripeService.createRefund(
      booking.stripe_payment_intent_id,
      undefined,  // full refund
      reason ?? 'requested_by_customer'
    );

    // The booking status update happens when the charge.refunded webhook arrives.
    // We return early with a 202 Accepted.
    return res.status(202).json({
      success: true,
      message: 'Refund initiated. Booking status will update when Stripe confirms.',
      data: {
        refund_id:  refund.id,
        status:     refund.status,   // 'pending' initially
        amount:     StripeService.fromCents(refund.amount),
        currency:   refund.currency.toUpperCase(),
        booking_id: bookingId,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payments/booking/:bookingId
 * ─────────────────────────────────────────────────────────────
 * Get the payment session for a booking.
 * Useful for the frontend to know about payment state.
 */
const getPaymentForBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await PaymentModel.findBookingForPayment(bookingId, req.user.id);
    if (!booking && req.user.role !== 'admin') {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const session = await PaymentModel.findSessionByBookingId(bookingId);

    return res.json({
      success: true,
      data: {
        booking_id:             bookingId,
        payment_status:         booking?.payment_status ?? 'unknown',
        stripe_session_id:      session?.stripe_session_id ?? null,
        stripe_payment_intent:  session?.stripe_payment_intent_id ?? null,
        amount:                 session ? StripeService.fromCents(session.amount_total) : null,
        currency:               session?.currency?.toUpperCase() ?? null,
        paid_at:                session?.paid_at ?? null,
        receipt_url:            session?.receipt_url ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
};
//  DEMO PAYMENT SIMULATION
// ════════════════════════════════════════════════════════════

/**
 * POST /api/payments/simulate
 * ─────────────────────────────────────────────────────────────
 * Simulate a payment for demo purposes without using Stripe.
 * Updates booking status to confirmed and paid.
 */
const simulatePayment = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user.id;

    // ── 1. Validate booking ownership ──────────────────────
    const booking = await PaymentModel.findBookingForPayment(bookingId, userId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied.',
      });
    }

    // ── 2. Check if already paid ────────────────────────────
    if (booking.payment_status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already paid.',
      });
    }

    // ── 3. Simulate payment processing delay ──────────────────
    logger.info(`Starting simulated payment for booking ${bookingId}`, {
      userId,
      amount: booking.amount,
      currency: booking.currency || 'usd',
    });

    // Simulate 2-second payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ── 4. Update booking status ──────────────────────────────
    const updatedBooking = await PaymentModel.updateBookingPayment(
      bookingId,
      'confirmed',
      'paid',
      new Date().toISOString()
    );

    logger.info(`Simulated payment successful for booking ${bookingId}`, {
      userId,
      bookingId,
      status: 'confirmed',
      payment_status: 'paid',
    });

    // ── 5. Return success response ────────────────────────────
    return res.json({
      success: true,
      message: 'Payment simulated successfully',
      data: {
        bookingId: updatedBooking.id,
        status: updatedBooking.status,
        payment_status: updatedBooking.payment_status,
        paid_at: updatedBooking.updated_at,
        amount: updatedBooking.amount,
        currency: updatedBooking.currency || 'usd',
        demo_mode: true,
      },
    });

  } catch (err) {
    logger.error('Error in payment simulation', {
      error: err.message,
      bookingId: req.body.bookingId,
      userId: req.user.id,
    });
    next(err);
  }
};

/**
 * GET /api/payments/status/:bookingId
 * ─────────────────────────────────────────────────────────────
 * Get payment status for a specific booking.
 */
const getPaymentStatus = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await PaymentModel.findBookingForPayment(bookingId, req.user.id);
    
    if (!booking && req.user.role !== 'admin') {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    return res.json({
      success: true,
      data: {
        bookingId: booking.id,
        paymentStatus: booking.payment_status || 'pending',
        status: booking.status || 'pending',
        amount: booking.amount,
        currency: booking.currency || 'usd',
        demo_mode: true,
      },
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCheckoutSession,
  getSessionStatus,
  createRefund,
  getPaymentForBooking,
  simulatePayment,
  getPaymentStatus,
};
