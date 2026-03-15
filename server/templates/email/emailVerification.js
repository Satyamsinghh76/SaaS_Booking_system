'use strict';

const { baseLayout, escHtml } = require('./baseLayout');

/**
 * @param {object} data
 * @param {string} data.userName
 * @param {string} data.verificationUrl
 * @returns {{ subject: string, html: string, text: string }}
 */
const emailVerificationTemplate = (data) => {
  const { userName, verificationUrl } = data;

  const subject = 'Verify your email — BookFlow';

  const bodyContent = `
    <h1>Welcome, ${escHtml(userName)}!</h1>
    <p>Thanks for signing up for BookFlow. Please verify your email address to activate your account.</p>

    <div class="btn-wrap">
      <a href="${escHtml(verificationUrl)}" class="btn">Verify Email Address</a>
    </div>

    <p style="font-size:14px;color:#6b7280;">
      This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
    </p>

    <hr class="divider" />

    <p style="font-size:13px;color:#9ca3af;">
      If the button doesn't work, copy and paste this URL into your browser:<br />
      <a href="${escHtml(verificationUrl)}" style="color:#6366f1;word-break:break-all;">${escHtml(verificationUrl)}</a>
    </p>
  `;

  const html = baseLayout({
    title: subject,
    preheader: 'Verify your email to get started with BookFlow',
    bodyContent,
    accentColor: '#6366f1',
  });

  const text = [
    `Welcome, ${userName}!`,
    '',
    'Thanks for signing up for BookFlow. Please verify your email address:',
    verificationUrl,
    '',
    'This link expires in 24 hours.',
    'If you didn\'t create an account, you can safely ignore this email.',
  ].join('\n');

  return { subject, html, text };
};

module.exports = { emailVerificationTemplate };
