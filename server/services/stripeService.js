/**
 * stripeService.js
 * ─────────────────────────────────────────────────────────────
 * All direct Stripe API calls live here.
 * Controllers and the webhook handler call this service;
 * they never import stripe directly.
 *
 * Keeping Stripe calls in one place makes it easy to:
 *   - Mock in tests
 *   - Swap payment providers in the future
 *   - Add logging/monitoring in one spot
 */

const { stripe, CURRENCY, SUCCESS_URL, CANCEL_URL, toCents, fromCents } = require('../config/stripe');

const StripeService = {

  /**
   * Create a Stripe Checkout Session for a booking.
   *
   * The session URL is what the client redirects to.
   * Stripe handles card collection, 3DS, etc.
   *
   * @param {object} params
   * @param {object} params.booking      - booking row (with service_name, price_snapshot)
   * @param {object} params.user         - user row (email, name)
   * @param {string} params.idempotencyKey - unique key to prevent duplicate sessions
   *
   * @returns {Promise<Stripe.Checkout.Session>}
   */
  async createCheckoutSession({ booking, user, idempotencyKey }) {
    const amountCents = toCents(booking.price_snapshot);

    const session = await stripe.checkout.sessions.create(
      {
        // Payment configuration
        mode:     'payment',
        currency: CURRENCY,

        // Line items shown in Stripe's UI
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency:     CURRENCY,
              unit_amount:  amountCents,
              product_data: {
                name:        booking.service_name,
                description: [
                  `Date: ${booking.date}`,
                  `Time: ${booking.start_time} – ${booking.end_time}`,
                  `Duration: ${booking.duration_minutes} min`,
                ].join('  |  '),
                metadata: {
                  service_id: booking.service_id,
                },
              },
            },
          },
        ],

        // Pre-fill the customer email in Stripe UI
        customer_email: user.email,

        // Metadata is returned in every webhook event — critical for mapping
        // the Stripe session back to our booking without a DB query
        metadata: {
          booking_id:  booking.id,
          user_id:     user.id,
          service_id:  booking.service_id,
          booking_date: booking.date,
          start_time:   booking.start_time,
        },

        // Redirect URLs
        success_url: SUCCESS_URL,  // includes {CHECKOUT_SESSION_ID} placeholder
        cancel_url:  CANCEL_URL,

        // Allow customer to adjust quantity: no (it's a fixed service slot)
        payment_intent_data: {
          metadata: {
            booking_id: booking.id,
            user_id:    user.id,
          },
        },

        // Session expires after 30 minutes of inactivity
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      },
      {
        // Idempotency key: Stripe won't create two sessions for the same key
        idempotencyKey,
      }
    );

    return session;
  },

  /**
   * Retrieve a Checkout Session by ID, expanding the payment intent.
   * Used when the user returns to the success page.
   *
   * @param {string} sessionId  cs_test_...
   * @returns {Promise<Stripe.Checkout.Session>}
   */
  async retrieveSession(sessionId) {
    return stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'payment_intent.payment_method'],
    });
  },

  /**
   * Issue a full or partial refund for a PaymentIntent.
   *
   * @param {string}  paymentIntentId  pi_...
   * @param {number}  [amountCents]    omit for full refund
   * @param {string}  [reason]         'duplicate' | 'fraudulent' | 'requested_by_customer'
   * @returns {Promise<Stripe.Refund>}
   */
  async createRefund(paymentIntentId, amountCents, reason = 'requested_by_customer') {
    const params = {
      payment_intent: paymentIntentId,
      reason,
    };
    if (amountCents) params.amount = amountCents;

    return stripe.refunds.create(params);
  },

  /**
   * Create or retrieve a Stripe Customer for a user.
   * Useful if you want to save payment methods for repeat bookings.
   *
   * @param {object} user  { id, email, name }
   * @returns {Promise<Stripe.Customer>}
   */
  async getOrCreateCustomer(user) {
    // Search existing customers by email
    const existing = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (existing.data.length > 0) return existing.data[0];

    return stripe.customers.create({
      email:    user.email,
      name:     user.name,
      metadata: { user_id: user.id },
    });
  },

  /**
   * Construct and verify a Stripe Webhook Event from the raw request body.
   * MUST use the raw body (Buffer), NOT the parsed JSON.
   *
   * @param {Buffer} rawBody          - req.rawBody from the webhook route
   * @param {string} signatureHeader  - req.headers['stripe-signature']
   * @returns {Stripe.Event}
   * @throws {Error} if signature is invalid
   */
  constructWebhookEvent(rawBody, signatureHeader) {
    const { WEBHOOK_SECRET } = require('../config/stripe');
    return stripe.webhooks.constructEvent(rawBody, signatureHeader, WEBHOOK_SECRET);
  },

  // ── Helpers ───────────────────────────────────────────────

  toCents,
  fromCents,
};

module.exports = StripeService;
