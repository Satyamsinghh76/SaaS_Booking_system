/**
 * emailUtil.js
 * ─────────────────────────────────────────────────────────────
 * Centralises all Nodemailer configuration and sending logic.
 *
 * Features
 * ─────────
 * • Single Nodemailer transporter instance (re-used across requests)
 * • Validates SMTP config at startup — fails fast if misconfigured
 * • Automatic retry with exponential back-off for transient errors
 * • Development fallback: if SMTP env vars are absent, creates an
 *   Ethereal test account and logs a preview URL instead of sending
 * • Structured logging for every send attempt and failure
 */

'use strict';

const nodemailer = require('nodemailer');

// ── Transporter singleton ─────────────────────────────────────
let _transporter = null;

/**
 * Build the Nodemailer transport options from environment variables.
 * @returns {import('nodemailer').TransportOptions}
 */
const buildTransportOptions = () => ({
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true', // true = TLS, false = STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Graceful degradation: don't fail on self-signed certs in dev
  ...(process.env.NODE_ENV !== 'production' && {
    tls: { rejectUnauthorized: false },
  }),
});

/**
 * Lazily initialise the transporter.
 * In development with no SMTP config, falls back to Ethereal (catch-all).
 *
 * @returns {Promise<import('nodemailer').Transporter>}
 */
const getTransporter = async () => {
  if (_transporter) return _transporter;

  const smtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;

  if (!smtpConfigured && process.env.NODE_ENV !== 'production') {
    // ── Ethereal fallback for local dev ───────────────────────
    console.warn(
      '⚠️  [email] SMTP not configured. Using Ethereal test account.\n' +
      '   Emails will NOT be delivered. Check the preview URL in logs.'
    );
    const testAccount = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host:   'smtp.ethereal.email',
      port:    587,
      secure:  false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    return _transporter;
  }

  if (!smtpConfigured) {
    throw new Error('[email] SMTP_USER and SMTP_PASS must be set in production.');
  }

  _transporter = nodemailer.createTransport(buildTransportOptions());
  return _transporter;
};

// ── Sender address ────────────────────────────────────────────
const buildFromAddress = () => {
  const name    = process.env.EMAIL_FROM_NAME    || 'BookIt';
  const address = process.env.EMAIL_FROM_ADDRESS || 'noreply@bookit.example.com';
  return `"${name}" <${address}>`;
};

// ── Retry helper ──────────────────────────────────────────────
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Send an email with automatic retry on transient failures.
 *
 * @param {object}  mailOptions  - standard Nodemailer mail options
 * @param {object}  [opts]
 * @param {number}  [opts.maxRetries]    - override EMAIL_MAX_RETRIES
 * @param {number}  [opts.retryDelayMs] - override EMAIL_RETRY_DELAY_MS
 *
 * @returns {Promise<{
 *   messageId:  string,
 *   previewUrl: string | null,
 *   accepted:   string[],
 *   rejected:   string[],
 * }>}
 */
const sendEmail = async (mailOptions, opts = {}) => {
  const maxRetries    = opts.maxRetries    ?? parseInt(process.env.EMAIL_MAX_RETRIES    || '3',    10);
  const retryDelayMs  = opts.retryDelayMs  ?? parseInt(process.env.EMAIL_RETRY_DELAY_MS || '2000', 10);

  const transporter = await getTransporter();
  const envelope = {
    from: buildFromAddress(),
    ...mailOptions,
  };

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const info = await transporter.sendMail(envelope);

      const previewUrl = nodemailer.getTestMessageUrl(info) || null;

      console.log(
        `✅ [email] Sent "${envelope.subject}" to ${[].concat(envelope.to).join(', ')}` +
        ` | messageId: ${info.messageId}` +
        (previewUrl ? `\n   📬 Preview: ${previewUrl}` : '')
      );

      return {
        messageId:  info.messageId,
        previewUrl,
        accepted:   info.accepted,
        rejected:   info.rejected,
      };
    } catch (err) {
      lastError = err;
      const isLastAttempt = attempt === maxRetries;

      console.error(
        `❌ [email] Send attempt ${attempt}/${maxRetries} failed for "${envelope.subject}": ${err.message}`
      );

      if (isLastAttempt) break;

      // Exponential back-off: 2s, 4s, 8s …
      const delay = retryDelayMs * Math.pow(2, attempt - 1);
      console.log(`   Retrying in ${delay}ms…`);
      await sleep(delay);
    }
  }

  // All retries exhausted — throw so the caller can log / alert
  const error     = new Error(`Email delivery failed after ${maxRetries} attempts: ${lastError.message}`);
  error.cause     = lastError;
  error.recipient = mailOptions.to;
  throw error;
};

/**
 * Verify the SMTP connection. Call at app startup to catch config errors early.
 * Does NOT throw in development — just logs a warning.
 *
 * @returns {Promise<boolean>}
 */
const verifyConnection = async () => {
  try {
    const transporter = await getTransporter();
    await transporter.verify();
    console.log('✅ [email] SMTP connection verified');
    return true;
  } catch (err) {
    const msg = `❌ [email] SMTP verification failed: ${err.message}`;
    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg);
    }
    console.warn(msg);
    return false;
  }
};

module.exports = { sendEmail, verifyConnection, buildFromAddress };
