/**
 * webhookHandler.js
 * ─────────────────────────────────────────────────────────────
 * Handles Stripe webhook events.
 *
 * Security model
 * ──────────────
 * 1. Stripe signs every webhook with HMAC-SHA256.
 *    We verify the signature FIRST before doing any work.
 *    An invalid signature → 400, nothing executed.
 *
 * 2. Each Stripe event has a unique evt_... ID.
 *    We attempt to INSERT it into payment_events with ON CONFLICT DO NOTHING.
 *    If the row already exists → the event was already processed → 200 early return.
 *    This makes the handler idempotent (safe to retry without double-processing).
 *
 * 3. We return HTTP 200 QUICKLY, then do the work.
 *    Stripe retries any event that doesn't get a 2xx within 30s.
 *    Heavy processing should be queued (not done inline in production).
 *
 * Handled events
 * ──────────────
 * checkout.session.completed     → mark booking paid + confirmed
 * checkout.session.expired       → mark session expired (user can retry)
 * payment_intent.payment_failed  → log failure, notify if needed
 * charge.refunded                → mark booking refunded + cancelled
 */

const logger        = require('../config/logger').child({ component: 'payment' });
const PaymentModel  = require('../models/paymentModel');
const StripeService = require('../services/stripeService');

// ── Event processors ──────────────────────────────────────────
// Each processor receives the verified Stripe event and returns
// { handled: boolean, message: string }.

const processors = {

  /**
   * checkout.session.completed
   * User completed checkout. Stripe has collected the money.
   * Update booking → paid + confirmed.
   */
  async 'checkout.session.completed'(event) {
    const session    = event.data.object; // Stripe.Checkout.Session
    const bookingId  = session.metadata?.booking_id;

    if (!bookingId) {
      return { handled: false, message: 'No booking_id in session metadata.' };
    }

    if (session.payment_status !== 'paid') {
      // e.g. bank transfer where payment is still pending
      return { handled: true, message: `Payment status is ${session.payment_status} — skipping.` };
    }

    // Update DB session record
    await PaymentModel.updateSessionStatus(session.id, {
      status:                 'paid',
      stripePaymentIntentId:  session.payment_intent,
      paymentMethodType:      session.payment_method_types?.[0],
      paidAt:                 new Date(),
      lastWebhookEvent:       event,
    });

    // Mark booking paid (inside a transaction)
    await PaymentModel.markBookingPaid({
      bookingId,
      stripeSessionId:         session.id,
      stripePaymentIntentId:   session.payment_intent,
    });

    logger.info('checkout.session.completed', { bookingId, event_id: event.id });
    return { handled: true, message: `Booking ${bookingId} marked paid.` };
  },

  /**
   * checkout.session.expired
   * User let the session expire without paying.
   * We mark it expired; they can create a new session.
   */
  async 'checkout.session.expired'(event) {
    const session   = event.data.object;
    const bookingId = session.metadata?.booking_id;

    await PaymentModel.updateSessionStatus(session.id, {
      status:           'expired',
      lastWebhookEvent: event,
    });

    logger.info('checkout.session.expired', { bookingId: bookingId ?? null, event_id: event.id });
    return { handled: true, message: 'Session marked expired.' };
  },

  /**
   * payment_intent.payment_failed
   * Card declined, insufficient funds, 3DS failure, etc.
   * Log it — the user can try again from the success/cancel page.
   */
  async 'payment_intent.payment_failed'(event) {
    const pi         = event.data.object;
    const bookingId  = pi.metadata?.booking_id;
    const reason     = pi.last_payment_error?.message ?? 'Unknown';

    logger.warn('payment_intent.payment_failed', { bookingId: bookingId ?? null, reason, event_id: event.id });
    return { handled: true, message: `Payment failed: ${reason}` };
  },

  /**
   * charge.refunded
   * Refund confirmed by Stripe (may be partial or full).
   * Update booking → refunded + cancelled.
   */
  async 'charge.refunded'(event) {
    const charge    = event.data.object;
    const pi        = charge.payment_intent;

    // Look up the booking via payment session
    const { query } = require('../config/database');
    const { rows }  = await query(
      'SELECT booking_id FROM payment_sessions WHERE stripe_payment_intent_id = $1 LIMIT 1',
      [pi]
    );

    const bookingId = rows[0]?.booking_id;
    if (!bookingId) {
      return { handled: false, message: 'No booking found for payment intent.' };
    }

    await PaymentModel.markBookingRefunded({
      bookingId,
      refundReason: charge.refunds?.data?.[0]?.reason ?? 'requested_by_customer',
    });

    // Update session receipt url
    await PaymentModel.updateSessionStatus(
      charge.metadata?.session_id ?? null,
      {
        status:           'refunded',
        receiptUrl:       charge.receipt_url,
        lastWebhookEvent: event,
      }
    ).catch(() => {}); // not critical if this fails

    logger.info('charge.refunded', { bookingId, event_id: event.id });
    return { handled: true, message: `Booking ${bookingId} marked refunded.` };
  },
};

// ── Main webhook handler ──────────────────────────────────────

/**
 * POST /api/payments/webhook
 *
 * IMPORTANT: This route MUST receive the raw request body (Buffer),
 * not the parsed JSON body. See routes/paymentRoutes.js for the
 * express.raw() middleware applied to this route only.
 */
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  // ── Step 1: Verify signature ──────────────────────────────
  let event;
  try {
    event = StripeService.constructWebhookEvent(req.rawBody, sig);
  } catch (err) {
    logger.error('Stripe webhook signature verification failed', { message: err.message });
    return res.status(400).json({ error: `Webhook signature invalid: ${err.message}` });
  }

  logger.info('Webhook event received', { event_type: event.type, event_id: event.id });

  // ── Step 2: Deduplicate ───────────────────────────────────
  const session     = event.data.object;
  const bookingId   = session.metadata?.booking_id ?? null;
  const existingRec = await PaymentModel.recordWebhookEvent({
    stripeEventId:    event.id,
    eventType:        event.type,
    bookingId,
    paymentSessionId: null, // will be updated if we find it
    payload:          event,
  });

  if (!existingRec) {
    // null means ON CONFLICT DO NOTHING fired — already processed
    logger.info('Webhook duplicate event skipped', { event_id: event.id, event_type: event.type });
    return res.json({ received: true, status: 'duplicate' });
  }

  // ── Step 3: Acknowledge immediately (Stripe needs 2xx fast) ─
  res.json({ received: true });

  // ── Step 4: Process the event (async, after response sent) ──
  const processor = processors[event.type];

  if (!processor) {
    logger.info('Webhook unhandled event type', { event_type: event.type, event_id: event.id });
    await PaymentModel.markWebhookEventProcessed(event.id);
    return;
  }

  try {
    const result = await processor(event);
    await PaymentModel.markWebhookEventProcessed(event.id);
    logger.info('Webhook event processed', { event_type: event.type, event_id: event.id, result: result.message });
  } catch (err) {
    logger.error('Webhook event processing failed', { event_type: event.type, event_id: event.id, message: err.message, stack: err.stack });
    await PaymentModel.markWebhookEventProcessed(event.id, err.message);
    // Do NOT re-throw — Stripe already got 200. Log the error for alerting.
  }
};

module.exports = { handleWebhook };
