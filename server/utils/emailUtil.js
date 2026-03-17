/**
 * emailUtil.js
 * -----------------------------------------------------------------
 * Centralises all email-sending logic.
 *
 * Transport strategy (checked in order):
 *   1. BREVO_API_KEY set   → Brevo HTTP API (free 300/day, email-verified sender)
 *   2. RESEND_API_KEY set  → Resend HTTP API (requires domain verification)
 *   3. SMTP_USER/PASS set  → Nodemailer SMTP (good for local dev)
 *   4. Neither (dev only)  → Ethereal test account (preview URL in logs)
 */

'use strict';

const dns        = require('dns');
const { promisify } = require('util');
const nodemailer = require('nodemailer');

dns.setDefaultResultOrder('ipv4first');
const dnsLookup = promisify(dns.lookup);

// ── Provider detection ───────────────────────────────────────────
const getProvider = () => {
  if (process.env.BREVO_API_KEY)  return 'brevo';
  if (process.env.RESEND_API_KEY) return 'resend';
  return 'smtp';
};

// ══════════════════════════════════════════════════════════════════
//  Brevo HTTP API transport
// ══════════════════════════════════════════════════════════════════

/**
 * Parse "Name <email>" or plain email into { name, email }.
 */
const parseAddress = (addr) => {
  const match = String(addr).match(/^["']?(.+?)["']?\s*<(.+?)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: undefined, email: String(addr).trim() };
};

const sendViaBrevo = async (envelope) => {
  const to = [].concat(envelope.to).map((addr) => {
    const parsed = parseAddress(addr);
    return parsed.name ? { email: parsed.email, name: parsed.name } : { email: parsed.email };
  });
  const sender = parseAddress(envelope.from);

  const payload = {
    sender: { name: sender.name || 'BookFlow', email: sender.email },
    to,
    subject: envelope.subject,
  };
  if (envelope.html) payload.htmlContent = envelope.html;
  if (envelope.text) payload.textContent = envelope.text;

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key':      process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.message || `Brevo API error ${res.status}`);
    err.statusCode = res.status;
    throw err;
  }

  const recipients = to.map((t) => t.email).join(', ');
  console.log(
    `✅ [email] Sent "${envelope.subject}" to ${recipients}` +
    ` via Brevo | messageId: ${data.messageId}`
  );

  return { messageId: data.messageId, previewUrl: null, accepted: to.map((t) => t.email), rejected: [] };
};

// ══════════════════════════════════════════════════════════════════
//  Resend HTTP API transport
// ══════════════════════════════════════════════════════════════════

const sendViaResend = async (envelope) => {
  const to = [].concat(envelope.to);

  const payload = { from: envelope.from, to, subject: envelope.subject };
  if (envelope.html) payload.html = envelope.html;
  if (envelope.text) payload.text = envelope.text;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.message || `Resend API error ${res.status}`);
    err.statusCode = res.status;
    throw err;
  }

  console.log(
    `✅ [email] Sent "${envelope.subject}" to ${to.join(', ')}` +
    ` via Resend | id: ${data.id}`
  );

  return { messageId: data.id, previewUrl: null, accepted: to, rejected: [] };
};

// ══════════════════════════════════════════════════════════════════
//  SMTP transport (local dev / fallback)
// ══════════════════════════════════════════════════════════════════

let _transporter = null;

const buildTransportOptions = async () => {
  const hostname = process.env.SMTP_HOST || 'smtp.gmail.com';

  let host = hostname;
  try {
    const result = await dnsLookup(hostname, { family: 4 });
    host = result.address;
    console.log(`📧 [email] Resolved ${hostname} → ${host} (IPv4)`);
  } catch (err) {
    console.warn(`⚠️ [email] IPv4 resolution failed for ${hostname}: ${err.message}`);
  }

  const port   = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE != null
    ? process.env.SMTP_SECURE === 'true'
    : port === 465;

  return {
    host,
    port,
    secure,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls: {
      servername: hostname,
      ...(process.env.NODE_ENV !== 'production' && { rejectUnauthorized: false }),
    },
    connectionTimeout: 10000,
    greetingTimeout:   10000,
    socketTimeout:     15000,
  };
};

const getTransporter = async () => {
  if (_transporter) return _transporter;

  const smtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;

  if (!smtpConfigured && process.env.NODE_ENV !== 'production') {
    console.warn(
      '⚠️  [email] SMTP not configured. Using Ethereal test account.\n' +
      '   Emails will NOT be delivered. Check the preview URL in logs.'
    );
    const testAccount = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email', port: 587, secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    return _transporter;
  }

  if (!smtpConfigured) {
    throw new Error('[email] Set BREVO_API_KEY, RESEND_API_KEY, or SMTP_USER/SMTP_PASS in production.');
  }

  _transporter = nodemailer.createTransport(await buildTransportOptions());
  return _transporter;
};

const sendViaSmtp = async (envelope) => {
  const transporter = await getTransporter();
  const info = await transporter.sendMail(envelope);
  const previewUrl = nodemailer.getTestMessageUrl(info) || null;

  console.log(
    `✅ [email] Sent "${envelope.subject}" to ${[].concat(envelope.to).join(', ')}` +
    ` | messageId: ${info.messageId}` +
    (previewUrl ? `\n   📬 Preview: ${previewUrl}` : '')
  );

  return {
    messageId: info.messageId,
    previewUrl,
    accepted:  info.accepted,
    rejected:  info.rejected,
  };
};

// ══════════════════════════════════════════════════════════════════
//  Public API
// ══════════════════════════════════════════════════════════════════

const buildFromAddress = () => {
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  const name    = process.env.EMAIL_FROM_NAME    || 'BookFlow';
  const address = process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER || 'noreply@bookflow.com';
  return `"${name}" <${address}>`;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Send an email with automatic retry.
 * Automatically picks Resend (HTTP) or SMTP based on env vars.
 */
const sendEmail = async (mailOptions, opts = {}) => {
  const maxRetries   = opts.maxRetries   ?? parseInt(process.env.EMAIL_MAX_RETRIES    || '3',    10);
  const retryDelayMs = opts.retryDelayMs ?? parseInt(process.env.EMAIL_RETRY_DELAY_MS || '2000', 10);

  const envelope = { from: buildFromAddress(), ...mailOptions };
  const via      = getProvider();

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (via === 'brevo')  return await sendViaBrevo(envelope);
      if (via === 'resend') return await sendViaResend(envelope);
      return await sendViaSmtp(envelope);
    } catch (err) {
      lastError = err;

      console.error(
        `❌ [email] Send attempt ${attempt}/${maxRetries} failed for "${envelope.subject}" (${via}): ${err.message}`
      );

      // Reset SMTP transporter on connection errors
      if (via === 'smtp' && (
        err.code === 'ENETUNREACH' || err.code === 'ETIMEDOUT' ||
        err.code === 'ECONNREFUSED' || err.message.includes('Connection timeout')
      )) {
        _transporter = null;
      }

      // Don't retry client errors (bad API key, validation errors)
      if ((via === 'resend' || via === 'brevo') && err.statusCode && err.statusCode < 500) break;

      if (attempt === maxRetries) break;

      const delay = retryDelayMs * Math.pow(2, attempt - 1);
      console.log(`   Retrying in ${delay}ms…`);
      await sleep(delay);
    }
  }

  const error     = new Error(`Email delivery failed after ${maxRetries} attempts: ${lastError.message}`);
  error.cause     = lastError;
  error.recipient = mailOptions.to;
  throw error;
};

/**
 * Verify email connectivity at startup.
 */
const verifyConnection = async () => {
  const provider = getProvider();
  if (provider !== 'smtp') {
    console.log(`✅ [email] Using ${provider.toUpperCase()} HTTP API — SMTP verification skipped`);
    return true;
  }
  try {
    const transporter = await getTransporter();
    await transporter.verify();
    console.log('✅ [email] SMTP connection verified');
    return true;
  } catch (err) {
    const msg = `❌ [email] SMTP verification failed: ${err.message}`;
    if (process.env.NODE_ENV === 'production') throw new Error(msg);
    console.warn(msg);
    return false;
  }
};

module.exports = { sendEmail, verifyConnection, buildFromAddress };
