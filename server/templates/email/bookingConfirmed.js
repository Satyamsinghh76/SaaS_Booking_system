/**
 * bookingConfirmed.js
 * ─────────────────────────────────────────────────────────────
 * Generates the HTML + plain-text email for a confirmed booking.
 *
 * @param {object} data
 * @param {string} data.userName
 * @param {string} data.serviceName
 * @param {string} data.date            "YYYY-MM-DD"
 * @param {string} data.startTime       "HH:MM"
 * @param {string} data.endTime         "HH:MM"
 * @param {string} data.durationMinutes
 * @param {string} data.price           "75.00"
 * @param {string} data.bookingId       UUID
 * @param {string} data.bookingRef      Short ref shown to the user (first 8 chars of UUID)
 * @param {string} [data.notes]
 *
 * @returns {{ subject: string, html: string, text: string }}
 */

'use strict';

const { baseLayout, escHtml } = require('./baseLayout');

const bookingConfirmedTemplate = (data) => {
  const {
    userName,
    serviceName,
    date,
    startTime,
    endTime,
    durationMinutes,
    price,
    bookingId,
    bookingRef,
    notes,
  } = data;

  const appUrl      = process.env.APP_URL   || 'https://bookit.example.com';
  const appName     = process.env.APP_NAME  || 'BookIt';
  const bookingUrl  = `${appUrl}/bookings/${bookingId}`;

  // ── Formatted date ───────────────────────────────────────────
  const formattedDate = formatDate(date);          // e.g. "Monday, 15 July 2024"
  const formattedTime = `${startTime} – ${endTime}`;

  // ── Subject ──────────────────────────────────────────────────
  const subject = `✅ Booking Confirmed — ${serviceName} on ${formattedDate}`;

  // ── HTML body ────────────────────────────────────────────────
  const bodyContent = /* html */ `
    <h1>You're booked! 🎉</h1>
    <p>Hi ${escHtml(userName)}, your booking is <strong>confirmed</strong>. Here are your details:</p>

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
        <span class="detail-label">Duration</span>
        <span class="detail-value">${escHtml(String(durationMinutes))} min</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Price</span>
        <span class="detail-value">$${escHtml(price)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status</span>
        <span class="detail-value"><span class="badge badge-confirmed">Confirmed</span></span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Booking Ref</span>
        <span class="detail-value" style="font-family:monospace;font-size:13px;">${escHtml(bookingRef)}</span>
      </div>
      ${notes ? `
      <div class="detail-row">
        <span class="detail-label">Notes</span>
        <span class="detail-value">${escHtml(notes)}</span>
      </div>` : ''}
    </div>

    <div class="btn-wrap">
      <a href="${bookingUrl}" class="btn">View Booking</a>
    </div>

    <hr class="divider" />

    <p style="font-size:14px;color:#6b7280;">
      Need to cancel or reschedule? You can manage your booking any time from your
      <a href="${appUrl}/dashboard" style="color:#6366f1;">dashboard</a>.
      Cancellations made 24 hours or more in advance are fully refunded.
    </p>

    <p style="font-size:14px;color:#6b7280;">
      See you soon,<br />
      <strong>The ${escHtml(appName)} Team</strong>
    </p>
  `;

  const html = baseLayout({
    title:      subject,
    preheader:  `Your ${serviceName} booking on ${formattedDate} at ${startTime} is confirmed.`,
    bodyContent,
    accentColor: '#16a34a',   // green for confirmed
  });

  // ── Plain-text fallback ───────────────────────────────────────
  const text = `
Hi ${userName},

Your booking is CONFIRMED.

────────────────────────────
  Service:      ${serviceName}
  Date:         ${formattedDate}
  Time:         ${formattedTime}
  Duration:     ${durationMinutes} min
  Price:        $${price}
  Booking Ref:  ${bookingRef}
  ${notes ? `Notes:        ${notes}\n` : ''}
────────────────────────────

View your booking: ${bookingUrl}

Need to cancel? Manage your booking from your dashboard:
${appUrl}/dashboard

See you soon,
The ${appName} Team
`.trim();

  return { subject, html, text };
};

// ── Date formatter ────────────────────────────────────────────
const formatDate = (isoDate) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  // Use UTC to avoid timezone shifts when constructing from date parts
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
    timeZone: 'UTC',
  });
};

module.exports = { bookingConfirmedTemplate };
