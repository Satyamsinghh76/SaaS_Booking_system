'use strict';

const { query } = require('../config/database');

const NotificationModel = {
  async create({ userId, title, message, type = 'info', link = null }) {
    const { rows } = await query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, title, message, type, link]
    );
    return rows[0];
  },

  async findByUser(userId, { limit = 20, unreadOnly = false } = {}) {
    const filter = unreadOnly ? 'AND read = FALSE' : '';
    const { rows } = await query(
      `SELECT * FROM notifications
       WHERE user_id = $1 ${filter}
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return rows;
  },

  async countUnread(userId) {
    const { rows } = await query(
      'SELECT COUNT(*)::INTEGER AS count FROM notifications WHERE user_id = $1 AND read = FALSE',
      [userId]
    );
    return rows[0]?.count || 0;
  },

  async markAsRead(id, userId) {
    await query(
      'UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
  },

  async markAllAsRead(userId) {
    await query(
      'UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE',
      [userId]
    );
  },
};

module.exports = NotificationModel;
