'use strict';

const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const UserModel = require('../models/userModel');
const NotificationModel = require('../models/notificationModel');
const { query } = require('../config/database');

router.use(authenticate);

// ── Change Password ──────────────────────────────────────────
router.post('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.'),
], async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await UserModel.findByEmailWithPassword(req.user.email || (await UserModel.findById(req.user.id))?.email);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const ok = await UserModel.verifyPassword(currentPassword, user.password_hash);
    if (!ok) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });

    await UserModel.updatePassword(req.user.id, newPassword);
    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) { next(err); }
});

// ── Notifications ────────────────────────────────────────────
router.get('/notifications', async (req, res, next) => {
  try {
    const notifications = await NotificationModel.findByUser(req.user.id, { limit: 50 });
    const unreadCount = await NotificationModel.countUnread(req.user.id);
    return res.json({ success: true, data: { notifications, unreadCount } });
  } catch (err) { next(err); }
});

router.post('/notifications/:id/read', async (req, res, next) => {
  try {
    await NotificationModel.markAsRead(req.params.id, req.user.id);
    return res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/notifications/read-all', async (req, res, next) => {
  try {
    await NotificationModel.markAllAsRead(req.user.id);
    return res.json({ success: true });
  } catch (err) { next(err); }
});

// ── Payment Methods ──────────────────────────────────────────
router.get('/payment-methods', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM payment_methods WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    return res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.post('/payment-methods', [
  body('cardType').notEmpty(),
  body('last4').isLength({ min: 4, max: 4 }),
  body('expiryMonth').isInt({ min: 1, max: 12 }),
  body('expiryYear').isInt({ min: 2024 }),
], async (req, res, next) => {
  try {
    const { cardType, last4, expiryMonth, expiryYear } = req.body;
    const { rows } = await query(
      `INSERT INTO payment_methods (user_id, card_type, last4, expiry_month, expiry_year)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, cardType, last4, expiryMonth, expiryYear]
    );
    return res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

router.delete('/payment-methods/:id', async (req, res, next) => {
  try {
    await query(
      'DELETE FROM payment_methods WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    return res.json({ success: true });
  } catch (err) { next(err); }
});

// ── Billing History ──────────────────────────────────────────
router.get('/billing-history', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT b.id, s.name AS service_name, b.price_snapshot AS amount,
              b.booking_date AS date, b.payment_status AS status, b.paid_at
       FROM bookings b
       JOIN services s ON s.id = b.service_id
       WHERE b.user_id = $1 AND b.payment_status = 'paid'
       ORDER BY b.paid_at DESC NULLS LAST
       LIMIT 50`,
      [req.user.id]
    );
    return res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

module.exports = router;
