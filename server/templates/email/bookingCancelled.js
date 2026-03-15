/**
 * bookingCancelled.js
 * ─────────────────────────────────────────────────────────────
 * Generates the HTML + plain-text email for a cancelled booking.
 *
 * @param {object} data
 * @param {string} data.userName
 * @param {string} data.serviceName
 * @param {string} data.date              "YYYY-MM-DD"
 * @param {string} data.startTime         "HH:MM"
 * @param {string} data.endTime           "HH:MM"
 * @param {string} data.bookingId         UUID
 * @param {string} data.bookingRef        Short display ref
 * @param {string} [data.cancellationReason]
 * @param {string} [data.cancelledBy]     "user" | "admin"
 * @param {string} [data.refundAmount]    e.g. "75.00" — shown if a refund was issued
 *
 * @returns {{ subject: string, html: string, text: string }}
 */

'use strict';

const { baseLayout, escHtml } = require('./baseLayout');

const bookingCancelledTemplate = (data) => {
  const {
    userName,
    serviceName,
    date,
    startTime,
    endTime,
    bookingId,
    bookingRef,
    cancellationReason,
    cancelledBy    = 'user',
    refundAmount,
  } = data;

  const appUrl     = process.env.APP_URL  || 'https://bookit.example.com';
  const appName    = process.env.APP_NAME || 'BookIt';
  const bookingUrl = `${appUrl}/bookings/${bookingId}`;
  const rebookUrl  = `${appUrl}/services`;

  const formattedDate = formatDate(date);
  const formattedTime = `${startTime} – ${endTime}`;

  // ── Subject ──────────────────────────────────────────────────
  const subject = `Booking Cancelled — ${serviceName} on ${formattedDate}`;

  // ── Contextual intro copy ─────────────────────────────────────
  const introCopy = cancelledBy === 'admin'
    ? `We're sorry to let you know that your booking has been <strong>cancelled by our team</strong>.`
    : `Your booking has been <strong>cancelled</strong> as requested.`;

  // ── Refund notice block ───────────────────────────────────────
  const refundBlock = refundAmount
    ? /* html */ `
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px 20px;margin:20px 0;">
        <p style="margin:0;font-size:14px;color:#1e40af;">
          💳 <strong>Refund issued:</strong> $${escHtml(refundAmount)} will appear on your original
          payment method within 5–10 business days.
        </p>
      </div>`
    : '';

  // ── Reason block ──────────────────────────────────────────────
  const reasonBlock = cancellationReason
    ? /* html */ `
      <div class="detail-row">
        <span class="detail-label">Reason</span>
        <span class="detail-value">${escHtml(cancellationReason)}</span>
      </div>`
    : '';

  // ── HTML body ────────────────────────────────────────────────
  const bodyContent = /* html */ `
    <h1>Booking Cancelled</h1>
    <p>Hi ${escHtml(userName)}, ${introCopy}</p>

    <div class="detail-card">
      <div class="detail-row">
        <span class="detail-label">Service</span>
        <span class="detail-value">${escHtml(serviceName)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date</span>
        <span class="detail-value">${escHtml(formattedDate)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Time</span>
        <span class="detail-value">${escHtml(formattedTime)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status</span>
        <span class="detail-value"><span class="badge badge-cancelled">Cancelled</span></span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Booking Ref</span>
        <span class="detail-value" style="font-family:monospace;font-size:13px;">${escHtml(bookingRef)}</span>
      </div>
      ${reasonBlock}
    </div>

    ${refundBlock}

    <div class="btn-wrap">
      <a href="${rebookUrl}" class="btn" style="background-color:#6366f1;">Book Again</a>
    </div>

    <hr class="divider" />

    <p style="font-size:14px;color:#6b7280;">
      If you didn't request this cancellation or believe this is a mistake, please
      <a href="mailto:${process.env.APP_SUPPORT_EMAIL || 'support@bookit.example.com'}" style="color:#6366f1;">
        contact our support team</a> and we'll get it sorted.
    </p>

    <p style="font-size:14px;color:#6b7280;">
      We hope to see you again soon,<br />
      <strong>The ${escHtml(appName)} Team</strong>
    </p>
  `;

  const html = baseLayout({
    title:      subject,
    preheader:  `Your ${serviceName} booking on ${formattedDate} has been cancelled.`,
    bodyContent,
    accentColor: '#dc2626',   // red for cancelled
  });

  // ── Plain-text fallback ───────────────────────────────────────
  const refundLine    = refundAmount ? `\nRefund:       $${refundAmount} (5–10 business days)\n` : '';
  const reasonLine    = cancellationReason ? `Reason:       ${cancellationReason}\n` : '';

  const text = `
Hi ${userName},

Your booking has been CANCELLED.

────────────────────────────
  Service:      ${serviceName}
  Date:         ${formattedDate}
  Time:         ${formattedTime}
  Booking Ref:  ${bookingRef}
  ${reasonLine}${refundLine}
────────────────────────────

View booking details: ${bookingUrl}

Want to book again? Browse available services:
${rebookUrl}

If this was a mistake, contact us:
${process.env.APP_SUPPORT_EMAIL || 'support@bookit.example.com'}

The ${appName} Team
`.trim();

  return { subject, html, text };
};

// ── Date formatter ────────────────────────────────────────────
const formatDate = (isoDate) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
};

module.exports = { bookingCancelledTemplate };
