'use strict';

const express = require('express');
const router = express.Router();
const { sendEmail, buildFromAddress } = require('../utils/emailUtil');
const logger = require('../config/logger');

/**
 * POST /api/support/email
 * Public — no auth required.
 * Sends a support request email to the admin inbox.
 */
router.post('/email', async (req, res) => {
  const { name, email, subject, message } = req.body;

  // ── Validation ──────────────────────────────────────────────
  const errors = [];
  if (!name || !name.trim()) errors.push('Name is required.');
  if (!email || !email.trim()) errors.push('Email is required.');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email format.');
  if (!subject || !subject.trim()) errors.push('Subject is required.');
  if (!message || !message.trim()) errors.push('Message is required.');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors.join(' ') });
  }

  // ── Build email ─────────────────────────────────────────────
  const adminEmail = process.env.SMTP_USER || 'admin@bookflow.com';

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px 28px;border-radius:16px 16px 0 0;">
        <h1 style="color:#fff;font-size:22px;margin:0;">New Support Request</h1>
      </div>
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;padding:28px;border-radius:0 0 16px 16px;">
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:14px;width:90px;vertical-align:top;">Name</td>
            <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;">${escapeHtml(name.trim())}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:14px;vertical-align:top;">Email</td>
            <td style="padding:8px 0;color:#111827;font-size:14px;"><a href="mailto:${escapeHtml(email.trim())}" style="color:#6366f1;">${escapeHtml(email.trim())}</a></td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:14px;vertical-align:top;">Subject</td>
            <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;">${escapeHtml(subject.trim())}</td>
          </tr>
        </table>
        <div style="background:#f9fafb;border-radius:12px;padding:16px 20px;margin-top:8px;">
          <p style="color:#6b7280;font-size:12px;margin:0 0 8px 0;text-transform:uppercase;letter-spacing:0.05em;">Message</p>
          <p style="color:#111827;font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap;">${escapeHtml(message.trim())}</p>
        </div>
        <p style="color:#9ca3af;font-size:12px;margin-top:20px;">Sent from BookFlow Help Center</p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      from: buildFromAddress(),
      to: adminEmail,
      replyTo: email.trim(),
      subject: `[Support] ${subject.trim()}`,
      html,
    });

    logger.info(`Support email sent from ${email} — subject: ${subject}`);
    return res.json({ success: true, message: 'Your request has been sent. We\'ll respond within 24 hours.' });
  } catch (err) {
    logger.error('Failed to send support email', { error: err.message });
    return res.status(500).json({ success: false, message: 'Failed to send your message. Please try again later.' });
  }
});

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = router;
