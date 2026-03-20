const crypto = require('crypto');
const { validationResult } = require('express-validator');
const UserModel = require('../models/userModel');
const NotificationService = require('../services/notificationService');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  saveRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
} = require('../config/jwt');
const logger = require('../config/logger');
const { SEED_EMAILS } = require('../utils/seedAccounts');

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

    // Generate verification token (URL-safe, 48 bytes → 64 chars)
    const verificationToken = crypto.randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    await UserModel.setVerificationToken(user.id, verificationToken, expiresAt);

    // Do NOT issue tokens — user must verify email first
    res.status(201).json({
      success: true,
      message: 'Account created. Please check your email to verify your account.',
      data: { requiresVerification: true, email: user.email },
    });

    // Send verification email (fire-and-forget — never blocks the response)
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const verificationUrl = `${serverUrl.replace(/\/$/, '')}/api/auth/verify-email?token=${verificationToken}`;
    console.log(`📧 [signup] Verification link for ${email}: ${verificationUrl}`);

    NotificationService.sendVerificationEmail({
      email,
      name,
      verificationUrl,
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

    // Seed accounts bypass email verification entirely
    const isSeedAccount = SEED_EMAILS.includes(email.toLowerCase());

    if (!user.email_verified && !isSeedAccount) {
      // For admin accounts, send a fresh verification email on every blocked attempt
      if (user.role === 'admin') {
        const crypto = require('crypto');
        const token = crypto.randomBytes(48).toString('base64url');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await UserModel.setVerificationToken(user.id, token, expires);

        const { sendEmail, buildFromAddress } = require('../utils/emailUtil');
        const serverUrl = process.env.NEXT_PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5000}`;
        const verifyUrl = `${serverUrl}/api/auth/verify-email?token=${token}`;
        sendEmail({
          from: buildFromAddress(),
          to: user.email,
          subject: 'BookFlow Admin Verification',
          html: `
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
              <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px 28px;border-radius:16px 16px 0 0;">
                <h1 style="color:#fff;font-size:22px;margin:0;">Admin Login Verification</h1>
              </div>
              <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:28px;border-radius:0 0 16px 16px;">
                <p style="color:#111827;font-size:16px;">Click below to verify and complete your admin login:</p>
                <div style="text-align:center;margin:24px 0;">
                  <a href="${verifyUrl}" style="display:inline-block;background:#6366f1;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px;">Verify &amp; Login</a>
                </div>
                <p style="color:#6b7280;font-size:13px;">Or copy: <a href="${verifyUrl}" style="color:#6366f1;">${verifyUrl}</a></p>
                <p style="color:#9ca3af;font-size:12px;margin-top:16px;">This link expires in 24 hours.</p>
              </div>
            </div>
          `,
        }).catch((err) => logger.error('Failed to send admin verification email', { error: err.message }));

        logger.info(`Admin verification email sent to ${user.email}`);
      }

      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in. A verification link has been sent to your inbox.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    // Strip password_hash and email_verified from response
    const { password_hash, email_verified, ...safeUser } = user;

    // For admin users: reset email_verified so next login requires re-verification (skip seed accounts)
    if (user.role === 'admin' && !isSeedAccount) {
      const { query } = require('../config/database');
      query('UPDATE users SET email_verified = false WHERE id = $1', [user.id])
        .catch((err) => logger.error('Failed to reset admin email_verified', { error: err.message }));
    }

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

/**
 * POST /api/auth/google
 * Verify a Google ID token, find or create the user, and return JWT tokens.
 */
const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential is required.' });
    }

    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid Google token.' });
    }

    const payload = ticket.getPayload();
    const { name, email } = payload;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account has no email.' });
    }

    const { user } = await UserModel.findOrCreateFromGoogle({ name: name || email.split('@')[0], email });

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    const accessToken  = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    await saveRefreshToken(user.id, refreshToken);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);

    return res.json({
      success: true,
      message: 'Logged in with Google.',
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
 * GET /api/auth/verify-email?token=...
 * Verify the user's email and redirect to the frontend.
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required.' });
    }

    const user = await UserModel.verifyEmail(token);

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link.' });
    }

    console.log(`✅ [auth] Email verified for ${user.email}`);

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    // For admin users: auto-login on verification — issue tokens and redirect to /admin
    if (user.role === 'admin') {
      const { password_hash, email_verified, ...safeUser } = user;
      const accessToken = signAccessToken(safeUser);
      const refreshToken = signRefreshToken(safeUser);
      await saveRefreshToken(safeUser.id, refreshToken);

      // Reset email_verified so next login requires re-verification
      const { query } = require('../config/database');
      query('UPDATE users SET email_verified = false WHERE id = $1', [user.id]).catch(() => {});

      res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
      // Redirect to admin with access token in URL for the client to pick up
      return res.redirect(`${clientUrl}/admin?access_token=${accessToken}`);
    }

    // Regular users: redirect to login page
    return res.redirect(`${clientUrl}/login?verified=true`);
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login, refresh, logout, me, googleLogin, verifyEmail };
