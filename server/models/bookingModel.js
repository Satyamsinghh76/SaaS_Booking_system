const { query, getClient } = require('../config/database');
const { guardSlot }         = require('../utils/doubleBookingGuard');
const { SEED_EMAILS }       = require('../utils/seedAccounts');

/** Public columns returned in every booking response. */
const BOOKING_COLS = `
  b.id,
  b.user_id,
  b.service_id,
  b.booking_date::TEXT          AS date,
  b.start_time::TEXT            AS start_time,
  b.end_time::TEXT              AS end_time,
  b.status,
  b.payment_status,
  b.price_snapshot,
  b.notes,
  b.customer_name,
  b.customer_email,
  b.cancelled_at,
  b.cancellation_reason,
  b.created_at,
  b.updated_at,
  s.name                        AS service_name,
  s.duration_minutes,
  u.name                        AS user_name,
  u.email                       AS user_email,
  u.phone_number                AS user_phone
`.trim();

const BookingModel = {

  // ── Reads ──────────────────────────────────────────────────

  async findById(id) {
    const { rows } = await query(
      `SELECT ${BOOKING_COLS}
       FROM   bookings b
       JOIN   services s ON s.id = b.service_id
       JOIN   users    u ON u.id = b.user_id
       WHERE  b.id = $1`,
      [id]
    );
    return rows[0] ?? null;
  },

  /**
   * List bookings with flexible filters.
   * userId scopes results to a single customer; omit for admin view.
   */
  async findAll({ userId, serviceId, status, paymentStatus, date, from, to, seedOnly, page = 1, limit = 20 } = {}) {
    const conditions = [];
    const values     = [];
    let   idx        = 1;

    if (userId)        { conditions.push(`b.user_id         = $${idx++}`); values.push(userId); }
    if (serviceId)     { conditions.push(`b.service_id      = $${idx++}`); values.push(serviceId); }
    if (status)        { conditions.push(`b.status          = $${idx++}`); values.push(status); }
    if (paymentStatus) { conditions.push(`b.payment_status  = $${idx++}`); values.push(paymentStatus); }
    if (date)          { conditions.push(`b.booking_date    = $${idx++}`); values.push(date); }
    if (from)          { conditions.push(`b.booking_date   >= $${idx++}`); values.push(from); }
    if (to)            { conditions.push(`b.booking_date   <= $${idx++}`); values.push(to); }

    // Seed-account isolation: seed admin sees only seed-user bookings, real admin sees only real-user bookings
    if (seedOnly === true) {
      conditions.push(`b.user_id IN (SELECT id FROM users WHERE email = ANY($${idx++}::TEXT[]))`);
      values.push(SEED_EMAILS);
    } else if (seedOnly === false) {
      conditions.push(`b.user_id NOT IN (SELECT id FROM users WHERE email = ANY($${idx++}::TEXT[]))`);
      values.push(SEED_EMAILS);
    }

    const where  = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const [countRes, dataRes] = await Promise.all([
      query(`SELECT COUNT(*) AS total FROM bookings b ${where}`, values),
      query(
        `SELECT ${BOOKING_COLS}
         FROM   bookings b
         JOIN   services s ON s.id = b.service_id
         JOIN   users    u ON u.id = b.user_id
         ${where}
         ORDER  BY b.booking_date DESC, b.start_time DESC
         LIMIT  $${idx} OFFSET $${idx + 1}`,
        [...values, limit, offset]
      ),
    ]);

    return {
      rows:  dataRes.rows,
      total: parseInt(countRes.rows[0].total, 10),
    };
  },

  // ── Create (with double-booking guard) ────────────────────

  /**
   * Create a booking inside a transaction.
   * The doubleBookingGuard is called here — it acquires an advisory lock
   * and does the overlap check BEFORE the INSERT.
   *
   * Returns { booking } on success or throws with a structured error.
   */
  async create({ userId, serviceId, date, startTime, endTime, priceSnapshot, notes, customerName, customerEmail }) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // ── Double-booking prevention ────────────────────────
      const guard = await guardSlot(client, {
        serviceId,
        date,
        startTime,
        endTime,
      });

      if (guard.conflict) {
        await client.query('ROLLBACK');
        const err = new Error(guard.message);
        err.statusCode = 409;
        err.code       = 'SLOT_CONFLICT';
        err.existing   = guard.existingBooking;
        throw err;
      }

      // ── Insert booking ───────────────────────────────────
      const { rows } = await client.query(
        `INSERT INTO bookings
           (user_id, service_id, booking_date, start_time, end_time, price_snapshot, notes, customer_name, customer_email, status, payment_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', 'unpaid')
         RETURNING
           id, user_id, service_id,
           booking_date::TEXT  AS date,
           start_time::TEXT    AS start_time,
           end_time::TEXT      AS end_time,
           status, payment_status, price_snapshot, notes, customer_name, customer_email, created_at`,
        [userId, serviceId, date, startTime, endTime, priceSnapshot, notes ?? null, customerName ?? null, customerEmail ?? null]
      );

      const booking = rows[0];

      // ── Audit event ──────────────────────────────────────
      await client.query(
        `INSERT INTO booking_events (booking_id, actor_id, event_type, new_status, new_payment, metadata)
         VALUES ($1, $2, 'created', 'pending', 'unpaid', $3)`,
        [
          booking.id,
          userId,
          JSON.stringify({ service_id: serviceId, date, start_time: startTime, end_time: endTime }),
        ]
      );

      await client.query('COMMIT');
      return booking;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // ── Status transitions ────────────────────────────────────

  /**
   * Transition a booking to a new status.
   * Validates allowed transitions to prevent illegal state changes.
   */
  async updateStatus(id, newStatus, { actorId, reason } = {}) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const ALLOWED = {
      pending:   ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled', 'no_show'],
      completed: [],
      cancelled: [],
      no_show:   [],
    };

    if (!ALLOWED[existing.status]?.includes(newStatus)) {
      const err = new Error(
        `Cannot transition from '${existing.status}' to '${newStatus}'. ` +
        `Allowed: ${ALLOWED[existing.status].join(', ') || 'none'}.`
      );
      err.statusCode = 422;
      err.code       = 'INVALID_TRANSITION';
      throw err;
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      let sql, values;
      if (['cancelled', 'no_show'].includes(newStatus)) {
        sql = `UPDATE bookings
               SET status = $1, cancelled_at = NOW(), cancellation_reason = $3
               WHERE id = $2
               RETURNING id, status, updated_at`;
        values = [newStatus, id, reason ?? null];
      } else {
        sql = `UPDATE bookings
               SET status = $1
               WHERE id = $2
               RETURNING id, status, updated_at`;
        values = [newStatus, id];
      }

      const { rows } = await client.query(sql, values);

      await client.query(
        `INSERT INTO booking_events
           (booking_id, actor_id, event_type, previous_status, new_status, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          id,
          actorId ?? null,
          `status_changed_to_${newStatus}`,
          existing.status,
          newStatus,
          JSON.stringify({ reason }),
        ]
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

  /** Update payment status with audit event. */
  async updatePaymentStatus(id, newPaymentStatus, actorId) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `UPDATE bookings SET payment_status = $1 WHERE id = $2
         RETURNING id, payment_status, updated_at`,
        [newPaymentStatus, id]
      );

      await client.query(
        `INSERT INTO booking_events
           (booking_id, actor_id, event_type, previous_payment, new_payment)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, actorId ?? null, 'payment_updated', existing.payment_status, newPaymentStatus]
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

  /** Fetch full audit trail for a booking. */
  async getEvents(bookingId) {
    const { rows } = await query(
      `SELECT be.*, u.name AS actor_name
       FROM   booking_events be
       LEFT   JOIN users u ON u.id = be.actor_id
       WHERE  be.booking_id = $1
       ORDER  BY be.created_at ASC`,
      [bookingId]
    );
    return rows;
  },
};

module.exports = BookingModel;
