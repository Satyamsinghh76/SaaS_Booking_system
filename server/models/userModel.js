const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

/**
 * Columns returned to callers — password_hash is NEVER included.
 */
const PUBLIC_FIELDS = 'id, name, email, role, is_active, created_at, updated_at';

const UserModel = {
  // ── Queries ─────────────────────────────────────────────

  /** Find a user by ID (no password). */
  async findById(id) {
    const { rows } = await query(
      `SELECT ${PUBLIC_FIELDS} FROM users WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  /** Find a user by email (no password). */
  async findByEmail(email) {
    const { rows } = await query(
      `SELECT ${PUBLIC_FIELDS} FROM users WHERE email = $1`,
      [email]
    );
    return rows[0] || null;
  },

  /**
   * Find a user by email AND include the password_hash.
   * Only used internally during login verification.
   */
  async findByEmailWithPassword(email) {
    const { rows } = await query(
      `SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = $1`,
      [email]
    );
    return rows[0] || null;
  },

  /** List all users — admin use only. */
  async findAll({ limit = 50, offset = 0 } = {}) {
    const { rows } = await query(
      `SELECT ${PUBLIC_FIELDS} FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return rows;
  },

  // ── Mutations ────────────────────────────────────────────

  /**
   * Create a new user.
   * Accepts plain-text password and hashes it before inserting.
   */
  async create({ name, email, password, role = 'user' }) {
    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING ${PUBLIC_FIELDS}`,
      [name, email, password_hash, role]
    );
    return rows[0];
  },

  /** Update name / role. Email and password changed via dedicated methods. */
  async update(id, { name, role }) {
    const { rows } = await query(
      `UPDATE users SET name = COALESCE($1, name), role = COALESCE($2, role)
       WHERE id = $3
       RETURNING ${PUBLIC_FIELDS}`,
      [name, role, id]
    );
    return rows[0] || null;
  },

  /** Change a user's password. Accepts new plain-text password. */
  async updatePassword(id, newPassword) {
    const password_hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, id]);
  },

  /** Soft-delete via is_active flag. */
  async deactivate(id) {
    const { rows } = await query(
      `UPDATE users SET is_active = FALSE WHERE id = $1 RETURNING ${PUBLIC_FIELDS}`,
      [id]
    );
    return rows[0] || null;
  },

  // ── Helpers ──────────────────────────────────────────────

  /**
   * Verify a plain-text password against a stored hash.
   * Returns true/false.
   */
  async verifyPassword(plaintext, hash) {
    return bcrypt.compare(plaintext, hash);
  },

  /** Check if an email is already taken. */
  async emailExists(email) {
    const { rows } = await query(
      'SELECT 1 FROM users WHERE email = $1',
      [email]
    );
    return rows.length > 0;
  },
};

module.exports = UserModel;
