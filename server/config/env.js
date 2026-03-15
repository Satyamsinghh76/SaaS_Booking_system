'use strict';

/**
 * env.js — Environment variable validation
 *
 * Call this module FIRST in server.js (before any other require).
 * The process exits immediately with a clear message if required
 * variables are absent or obviously insecure, so mistakes are caught
 * at startup rather than at runtime inside a request handler.
 */

// ── Required variables ────────────────────────────────────────
// DATABASE_URL (Supabase / Render) replaces all individual DB_* vars.
// Only require the individual vars when DATABASE_URL is absent.
// SQLite mode doesn't require database connection variables.
const REQUIRED = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];

if (!process.env.DATABASE_URL && process.env.DB_TYPE !== 'sqlite') {
  REQUIRED.push('DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD');
}

const missing = REQUIRED.filter((key) => !process.env[key]);

if (missing.length > 0) {
  // Use process.stderr so this surfaces even if stdout is redirected
  process.stderr.write(
    `[FATAL] Missing required environment variable(s):\n` +
    missing.map((k) => `  • ${k}`).join('\n') +
    `\n\nCopy .env.example to .env and fill in the values.\n`
  );
  process.exit(1);
}

// ── Security checks ───────────────────────────────────────────
const MIN_SECRET_LENGTH = 32;

if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < MIN_SECRET_LENGTH) {
  process.stderr.write(
    `[FATAL] JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters.\n`
  );
  process.exit(1);
}

if (
  process.env.NODE_ENV === 'production' &&
  process.env.JWT_REFRESH_SECRET &&
  process.env.JWT_REFRESH_SECRET.length < MIN_SECRET_LENGTH
) {
  process.stderr.write(
    `[FATAL] JWT_REFRESH_SECRET must be at least ${MIN_SECRET_LENGTH} characters.\n`
  );
  process.exit(1);
}

if (process.env.NODE_ENV === 'production') {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    process.stderr.write(
      '[WARN]  STRIPE_SECRET_KEY is not set or does not look like a valid key.\n'
    );
  }
  if (!process.env.CORS_ORIGIN) {
    process.stderr.write(
      '[WARN]  CORS_ORIGIN is not set in production. Defaulting to localhost:3000 which will reject all browser requests.\n'
    );
  } else if (process.env.CORS_ORIGIN === '*') {
    process.stderr.write(
      '[WARN]  CORS_ORIGIN is set to wildcard "*" which is insecure in production.\n'
    );
  } else if (process.env.CORS_ORIGIN.includes('localhost')) {
    process.stderr.write(
      '[WARN]  CORS_ORIGIN is pointing at localhost in a production environment.\n'
    );
  }
}

// ── Validated, typed config object ───────────────────────────
const env = {
  port:          parseInt(process.env.PORT || '5000', 10),
  nodeEnv:       process.env.NODE_ENV || 'development',
  isProduction:  process.env.NODE_ENV === 'production',
  logLevel:      process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  corsOrigin:    process.env.CORS_ORIGIN || 'http://localhost:3000',

  db: {
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT, 10),
    name:     process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },

  jwt: {
    secret:           process.env.JWT_SECRET,
    refreshSecret:    process.env.JWT_REFRESH_SECRET,
    expiresIn:        process.env.JWT_EXPIRES_IN        || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  smtp: {
    host:     process.env.SMTP_HOST,
    port:     parseInt(process.env.SMTP_PORT  || '587', 10),
    user:     process.env.SMTP_USER,
    pass:     process.env.SMTP_PASS,
    from:     process.env.EMAIL_FROM || process.env.SMTP_USER,
  },

  stripe: {
    secretKey:      process.env.STRIPE_SECRET_KEY,
    webhookSecret:  process.env.STRIPE_WEBHOOK_SECRET,
    currency:       process.env.STRIPE_CURRENCY || 'usd',
    successUrl:     process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/booking/success',
    cancelUrl:      process.env.STRIPE_CANCEL_URL  || 'http://localhost:3000/booking/cancel',
  },

  twilio: {
    accountSid:  process.env.TWILIO_ACCOUNT_SID,
    authToken:   process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    enabled:     !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
  },

  google: {
    clientId:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri:  process.env.GOOGLE_REDIRECT_URI,
    calendarId:   process.env.GOOGLE_CALENDAR_ID || 'primary',
    encryptionKey:process.env.TOKEN_ENCRYPTION_KEY,
  },
};

module.exports = env;
