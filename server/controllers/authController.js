const { validationResult } = require('express-validator');
const UserModel = require('../models/userModel');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  saveRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
} = require('../config/jwt');

// ── Helpers ───────────────────────────────────────────────

const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ success: false, errors: errors.array() });
    return true;
  }
  return false;
};

// Cookie options for the refresh token (HttpOnly, not accessible via JS)
const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

// ── Controllers ───────────────────────────────────────────

/**
 * POST /api/auth/signup
 * Create a new account and return tokens.
 */
const signup = async (req, res, next) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { name, email, password } = req.body;

    // Duplicate email check
    if (await UserModel.emailExists(email)) {
      return res.status(409).json({
        success: false,
        message: 'An account with that email already exists.',
      });
    }

    // Create user (model handles hashing)
    const user = await UserModel.create({ name, email, password });

    // Issue tokens
    const accessToken  = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    await saveRefreshToken(user.id, refreshToken);

    // Refresh token → HttpOnly cookie; access token → JSON body
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user,
        access_token: accessToken,
        expires_in: process.env.JWT_EXPIRES_IN || '15m',
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Authenticate with email + password and return tokens.
 */
const login = async (req, res, next) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { email, password } = req.body;

    // Fetch user including password hash
    const user = await UserModel.findByEmailWithPassword(email);

    // Use a single generic message — do NOT reveal whether email exists
    const INVALID_MSG = 'Invalid email or password.';

    if (!user) {
      return res.status(401).json({ success: false, message: INVALID_MSG });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    const passwordOk = await UserModel.verifyPassword(password, user.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ success: false, message: INVALID_MSG });
    }

    // Strip password_hash from response
    const { password_hash, ...safeUser } = user;

    const accessToken  = signAccessToken(safeUser);
    const refreshToken = signRefreshToken(safeUser);
    await saveRefreshToken(safeUser.id, refreshToken);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        user: safeUser,
        access_token: accessToken,
        expires_in: process.env.JWT_EXPIRES_IN || '15m',
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/refresh
 * Exchange a valid refresh token for a new access + refresh token pair
 * (refresh token rotation — old token is revoked).
 */
const refresh = async (req, res, next) => {
  try {
    // Accept from cookie (preferred) or body (for API clients)
    const rawToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!rawToken) {
      return res.status(401).json({ success: false, message: 'Refresh token required.' });
    }

    // 1. Verify the JWT signature & expiry
    let decoded;
    try {
      decoded = verifyRefreshToken(rawToken);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    // 2. Verify it exists in DB and has not been revoked
    const record = await findRefreshToken(rawToken);
    if (!record || !record.is_active) {
      return res.status(401).json({ success: false, message: 'Refresh token revoked or not found.' });
    }

    // 3. Revoke the used token (rotation — prevents re-use)
    await revokeRefreshToken(rawToken);

    // 4. Issue fresh pair
    const userPayload   = { id: record.user_id, email: record.email, role: record.role };
    const accessToken   = signAccessToken(userPayload);
    const newRefresh    = signRefreshToken(userPayload);
    await saveRefreshToken(record.user_id, newRefresh);

    res.cookie('refreshToken', newRefresh, REFRESH_COOKIE_OPTS);

    return res.json({
      success: true,
      data: { access_token: accessToken, expires_in: process.env.JWT_EXPIRES_IN || '15m' },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * Revoke the refresh token so it can never be reused.
 */
const logout = async (req, res, next) => {
  try {
    const rawToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (rawToken) {
      await revokeRefreshToken(rawToken);
    }

    res.clearCookie('refreshToken');
    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Return the currently authenticated user's profile.
 * Requires the authenticate middleware.
 */
const me = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login, refresh, logout, me };
