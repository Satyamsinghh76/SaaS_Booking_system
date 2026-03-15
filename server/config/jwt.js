'use strict';

const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('./database');

const signAccessToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m', algorithm: 'HS256' }
  );

const signRefreshToken = (user) =>
  jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', algorithm: 'HS256' }
  );

// Explicitly pin to HS256 — prevents algorithm confusion attacks (e.g., alg:none or RS256 swap).
const verifyAccessToken  = (token) => jwt.verify(token, process.env.JWT_SECRET,         { algorithms: ['HS256'] });
const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET,  { algorithms: ['HS256'] });

const saveRefreshToken = async (userId, rawToken) => {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const decoded   = jwt.decode(rawToken);
  const expiresAt = new Date(decoded.exp * 1000);
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (token_hash)
     DO UPDATE SET user_id = EXCLUDED.user_id, expires_at = EXCLUDED.expires_at, revoked = FALSE`,
    [userId, tokenHash, expiresAt]
  );
  return tokenHash;
};

const findRefreshToken = async (rawToken) => {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const { rows } = await query(
    `SELECT rt.*, u.email, u.role, u.is_active
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = $1 AND rt.revoked = FALSE AND rt.expires_at > NOW()`,
    [tokenHash]
  );
  return rows[0] || null;
};

const revokeRefreshToken = async (rawToken) => {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await query('UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1', [tokenHash]);
};

const revokeAllUserTokens = async (userId) => {
  await query(
    'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1 AND revoked = FALSE',
    [userId]
  );
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  saveRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
};
