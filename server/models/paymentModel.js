const { query, getClient } = require('../config/database');

const PaymentModel = {

  // ── Booking lookups ────────────────────────────────────────

  /**
   * Fetch a booking row joined with service and user details.
   * The payment controller needs service_name, price, and user email.
   */
  async findBookingForPayment(bookingId, userId) {
    const { rows } = await query(
      `SELECT
         b.id,
         b.user_id,
         b.service_id,
         b.booking_date::TEXT     AS date,
         b.start_time::TEXT       AS start_time,
         b.end_time::TEXT         AS end_time,
         b.status,
         b.payment_status,
         b.price_snapshot,
         b.stripe_session_id,
         b.stripe_payment_intent_id,
         s.name                   AS service_name,
         s.duration_minutes,
         u.name                   AS user_name,
         u.email                  AS user_email
       FROM   bookings b
       JOIN   services s ON s.id = b.service_id
       JOIN   users    u ON u.id = b.user_id
       WHERE  b.id      = $1
         AND  b.user_id = $2`,
      [bookingId, userId]
    );
    return rows[0] ?? null;
  },

  // ── Payment sessions ───────────────────────────────────────

  async createPaymentSession({
    bookingId,
    userId,
    stripeSessionId,
    amountTotal,
    currency,
    idempotencyKey,
    expiresAt,
  }) {
    const { rows } = await query(
      `INSERT INTO payment_sessions
         (booking_id, user_id, stripe_session_id, amount_total, currency, idempotency_key, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [bookingId, userId, stripeSessionId, amountTotal, currency, idempotencyKey, expiresAt]
    );
    return rows[0];
  },

  async findSessionByStripeId(stripeSessionId) {
    const { rows } = await query(
      'SELECT * FROM payment_sessions WHERE stripe_session_id = $1',
      [stripeSessionId]
    );
    return rows[0] ?? null;
  },

  async findSessionByBookingId(bookingId) {
    const { rows } = await query(
      `SELECT * FROM payment_sessions
       WHERE  booking_id = $1
       ORDER  BY created_at DESC
       LIMIT  1`,
      [bookingId]
    );
    return rows[0] ?? null;
  },

  async updateSessionStatus(stripeSessionId, { status, stripePaymentIntentId, paymentMethodType, receiptUrl, lastWebhookEvent, paidAt }) {
    const { rows } = await query(
      `UPDATE payment_sessions
       SET  status                    = COALESCE($2, status),
            stripe_payment_intent_id  = COALESCE($3, stripe_payment_intent_id),
            payment_method_type       = COALESCE($4, payment_method_type),
            receipt_url               = COALESCE($5, receipt_url),
            last_webhook_event        = COALESCE($6, last_webhook_event),
            paid_at                   = COALESCE($7, paid_at)
       WHERE stripe_session_id = $1
       RETURNING *`,
      [stripeSessionId, status, stripePaymentIntentId, paymentMethodType, receiptUrl,
       lastWebhookEvent ? JSON.stringify(lastWebhookEvent) : null, paidAt]
    );
    return rows[0] ?? null;
  },

  // ── Booking payment status ─────────────────────────────────

  /**
   * Mark a booking as paid. Runs in a transaction to keep
   * bookings + payment_sessions in sync.
   */
  async markBookingPaid({ bookingId, stripeSessionId, stripePaymentIntentId }) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const { rows: bookingRows } = await client.query(
        `UPDATE bookings
         SET  payment_status             = 'paid',
              status                     = 'confirmed',
              stripe_session_id          = $2,
              stripe_payment_intent_id   = $3,
              paid_at                    = NOW()
         WHERE id = $1
         RETURNING id, status, payment_status, paid_at`,
        [bookingId, stripeSessionId, stripePaymentIntentId]
      );

      await client.query(
        `INSERT INTO booking_events
           (booking_id, event_type, previous_status, new_status, previous_payment, new_payment, metadata)
         VALUES ($1, 'payment_received', 'pending', 'confirmed', 'unpaid', 'paid', $2)`,
        [
          bookingId,
          JSON.stringify({ stripe_session_id: stripeSessionId, stripe_payment_intent_id: stripePaymentIntentId }),
        ]
      );

      await client.query('COMMIT');
      return bookingRows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Mark a booking as refunded.
   */
  async markBookingRefunded({ bookingId, refundReason }) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `UPDATE bookings
         SET  payment_status  = 'refunded',
              status          = 'cancelled',
              refunded_at     = NOW(),
              refund_reason   = $2,
              cancelled_at    = NOW()
         WHERE id = $1
         RETURNING id, status, payment_status`,
        [bookingId, refundReason ?? null]
      );

      await client.query(
        `INSERT INTO booking_events
           (booking_id, event_type, previous_payment, new_payment)
         VALUES ($1, 'refund_issued', 'paid', 'refunded')`,
        [bookingId]
      );

      await client.query('COMMIT');
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // ── Demo Payment Simulation ──────────────────────────────

  /**
   * Update booking status for demo payment simulation.
   * Sets status to 'confirmed' and payment_status to 'paid'.
   */
  async updateBookingPayment(bookingId, status, paymentStatus, paidAt) {
    const { rows } = await query(
      `UPDATE bookings
         SET status = $1,
             payment_status = $2,
             paid_at = $3,
             updated_at = $3
       WHERE id = $4
       RETURNING id, status, payment_status, paid_at, updated_at, price_snapshot`,
      [status, paymentStatus, paidAt, bookingId]
    );

    // Record booking event for audit trail
    if (rows.length > 0) {
      await query(
        `INSERT INTO booking_events
           (booking_id, event_type, previous_payment, new_payment)
         VALUES ($1, 'payment_completed', 'pending', $2)`,
        [bookingId, paymentStatus]
      );
    }

    return rows[0];
  },

  // ── Webhook event deduplication ────────────────────────────

  /**
   * Record a received webhook event.
   * The UNIQUE constraint on stripe_event_id prevents double-processing.
   * Returns null if the event was already stored (duplicate).
   */
  async recordWebhookEvent({ stripeEventId, eventType, bookingId, paymentSessionId, payload }) {
    try {
      const { rows } = await query(
        `INSERT INTO payment_events
           (stripe_event_id, event_type, booking_id, payment_session_id, payload)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (stripe_event_id) DO NOTHING
         RETURNING id`,
        [stripeEventId, eventType, bookingId ?? null, paymentSessionId ?? null, JSON.stringify(payload)]
      );
      return rows[0] ?? null; // null = duplicate, already processed
    } catch (err) {
      if (err.code === '23505') return null; // unique violation = duplicate
      throw err;
    }
  },

  async markWebhookEventProcessed(stripeEventId, errorMessage = null) {
    await query(
      `UPDATE payment_events
       SET  processed     = TRUE,
            error_message = $2
       WHERE stripe_event_id = $1`,
      [stripeEventId, errorMessage]
    );
  },
};

module.exports = PaymentModel;
