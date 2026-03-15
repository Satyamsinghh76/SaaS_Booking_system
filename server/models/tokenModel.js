'use strict';

const { query }              = require('../config/database');
const { encrypt, decrypt }   = require('../utils/tokenEncryption');

const TokenModel = {

  /**
   * Save (upsert) tokens for an admin user.
   * Encrypts the refresh token before writing.
   *
   * @param {object} params
   * @param {string} params.userId
   * @param {string} params.refreshToken     plaintext — encrypted here
   * @param {string} params.googleEmail      from token info
   * @param {string} params.calendarId       'primary' or specific ID
   * @param {string[]} params.scopes
   */
  async upsert({ userId, refreshToken, googleEmail, calendarId = 'primary', scopes = [] }) {
    const encryptedToken = encrypt(refreshToken);

    const { rows } = await query(
      `INSERT INTO google_oauth_tokens
         (user_id, encrypted_refresh_token, google_account_email, calendar_id, scopes, token_issued_at, is_valid)
       VALUES ($1, $2, $3, $4, $5, NOW(), TRUE)
       ON CONFLICT (user_id) DO UPDATE SET
         encrypted_refresh_token = EXCLUDED.encrypted_refresh_token,
         google_account_email    = EXCLUDED.google_account_email,
         calendar_id             = EXCLUDED.calendar_id,
         scopes                  = EXCLUDED.scopes,
         token_issued_at         = NOW(),
         is_valid                = TRUE
       RETURNING id, user_id, google_account_email, calendar_id, token_issued_at`,
      [userId, encryptedToken, googleEmail, calendarId, scopes]
    );
    return rows[0];
  },

  /**
   * Retrieve and decrypt tokens for a user.
   * Returns null if no token exists or token is marked invalid.
   *
   * @param {string} userId
   * @returns {{ refreshToken: string, calendarId: string, googleEmail: string } | null}
   */
  async findByUserId(userId) {
    const { rows } = await query(
      `SELECT * FROM google_oauth_tokens
       WHERE user_id = $1 AND is_valid = TRUE`,
      [userId]
    );

    if (!rows[0]) return null;

    const row = rows[0];
    try {
      const refreshToken = decrypt(row.encrypted_refresh_token);
      return {
        id:           row.id,
        userId:       row.user_id,
        refreshToken,
        calendarId:   row.calendar_id || process.env.GOOGLE_CALENDAR_ID || 'primary',
        googleEmail:  row.google_account_email,
        scopes:       row.scopes,
        issuedAt:     row.token_issued_at,
      };
    } catch (err) {
      console.error(`[TokenModel] Decryption failed for user ${userId}:`, err.message);
      return null;
    }
  },

  /** Mark a token as invalid (e.g. after revocation or auth error). */
  async invalidate(userId) {
    await query(
      'UPDATE google_oauth_tokens SET is_valid = FALSE WHERE user_id = $1',
      [userId]
    );
  },

  /** Update last_used_at timestamp. */
  async touchLastUsed(userId) {
    await query(
      'UPDATE google_oauth_tokens SET last_used_at = NOW() WHERE user_id = $1',
      [userId]
    );
  },

  /** Check whether any admin has a valid token. */
  async hasAnyValidToken() {
    const { rows } = await query(
      'SELECT 1 FROM google_oauth_tokens WHERE is_valid = TRUE LIMIT 1'
    );
    return rows.length > 0;
  },

  /** Get the user_id of the first admin with a valid Google OAuth token. */
  async getAuthorizedAdminId() {
    const { rows } = await query(
      'SELECT user_id FROM google_oauth_tokens WHERE is_valid = TRUE ORDER BY last_used_at DESC LIMIT 1'
    );
    return rows[0]?.user_id || null;
  },
};

module.exports = TokenModel;
