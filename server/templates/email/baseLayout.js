/**
 * baseLayout.js
 * ─────────────────────────────────────────────────────────────
 * Returns a complete, responsive HTML email shell.
 * Every transactional email calls this wrapper so branding,
 * footer, and responsive styles stay consistent.
 *
 * Designed to render correctly in:
 *   Gmail, Outlook 2016+, Apple Mail, iOS Mail, Android Gmail
 *
 * @param {object} options
 * @param {string} options.title        - <title> and preview text
 * @param {string} options.preheader    - preview text shown in inbox (hidden in body)
 * @param {string} options.bodyContent  - the inner HTML injected into the card
 * @param {string} [options.accentColor]- hex colour for header bar (default #6366f1)
 *
 * @returns {string}  Complete HTML string
 */
const baseLayout = ({
  title,
  preheader,
  bodyContent,
  accentColor = '#6366f1',
}) => {
  const appName      = process.env.APP_NAME        || 'BookIt';
  const appUrl       = process.env.APP_URL         || 'https://bookit.example.com';
  const supportEmail = process.env.APP_SUPPORT_EMAIL || 'support@bookit.example.com';
  const logoUrl      = process.env.APP_LOGO_URL;
  const year         = new Date().getFullYear();

  return /* html */ `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escHtml(title)}</title>
  <style>
    /* ── Reset ─────────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }

    /* ── Base ──────────────────────────────────────────────── */
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f4f7;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: #1a1a2e;
    }

    /* ── Wrapper ───────────────────────────────────────────── */
    .email-wrapper  { width: 100%; background-color: #f4f4f7; padding: 32px 0; }
    .email-card     { max-width: 600px; margin: 0 auto; background-color: #ffffff;
                      border-radius: 12px; overflow: hidden;
                      box-shadow: 0 4px 24px rgba(0,0,0,0.08); }

    /* ── Header ────────────────────────────────────────────── */
    .email-header   { background-color: ${accentColor}; padding: 32px 40px; text-align: center; }
    .email-header .logo-text {
                      font-size: 28px; font-weight: 700; color: #ffffff;
                      letter-spacing: -0.5px; text-decoration: none; }
    .email-header img.logo { max-height: 40px; width: auto; }

    /* ── Body ──────────────────────────────────────────────── */
    .email-body     { padding: 40px 40px 32px; }
    .email-body h1  { font-size: 24px; font-weight: 700; color: #1a1a2e;
                      margin: 0 0 8px; line-height: 1.3; }
    .email-body p   { margin: 0 0 16px; color: #4a4a6a; }
    .email-body p:last-child { margin-bottom: 0; }

    /* ── Booking detail card ───────────────────────────────── */
    .detail-card    { background: #f8f9ff; border: 1px solid #e8eaf6;
                      border-radius: 8px; padding: 24px; margin: 24px 0; }
    .detail-row     { display: flex; justify-content: space-between;
                      padding: 8px 0; border-bottom: 1px solid #e8eaf6; }
    .detail-row:last-child { border-bottom: none; padding-bottom: 0; }
    .detail-label   { font-size: 13px; font-weight: 600; color: #6b7280;
                      text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-value   { font-size: 15px; font-weight: 500; color: #1a1a2e; text-align: right; }

    /* ── Status badge ──────────────────────────────────────── */
    .badge          { display: inline-block; padding: 4px 12px; border-radius: 20px;
                      font-size: 13px; font-weight: 600; letter-spacing: 0.3px; }
    .badge-confirmed { background: #d1fae5; color: #065f46; }
    .badge-cancelled { background: #fee2e2; color: #991b1b; }
    .badge-pending   { background: #fef3c7; color: #92400e; }

    /* ── CTA button ────────────────────────────────────────── */
    .btn-wrap       { text-align: center; margin: 28px 0; }
    .btn            { display: inline-block; padding: 14px 32px; border-radius: 8px;
                      font-size: 15px; font-weight: 600; text-decoration: none;
                      background-color: ${accentColor}; color: #ffffff; }

    /* ── Divider ───────────────────────────────────────────── */
    .divider        { border: none; border-top: 1px solid #e8eaf6; margin: 28px 0; }

    /* ── Footer ────────────────────────────────────────────── */
    .email-footer   { background-color: #f8f9ff; padding: 24px 40px;
                      text-align: center; border-top: 1px solid #e8eaf6; }
    .email-footer p { font-size: 13px; color: #9ca3af; margin: 4px 0; }
    .email-footer a { color: #6366f1; text-decoration: none; }

    /* ── Responsive ────────────────────────────────────────── */
    @media (max-width: 640px) {
      .email-body, .email-header, .email-footer { padding-left: 24px !important; padding-right: 24px !important; }
      .detail-row { flex-direction: column; gap: 4px; }
      .detail-value { text-align: left; }
    }
  </style>
</head>
<body>
  <!-- Preheader text (shows in inbox preview, hidden visually) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f4f4f7;">
    ${escHtml(preheader)}&nbsp;&zwnj;&hairsp;&zwnj;&hairsp;&zwnj;&hairsp;&zwnj;&hairsp;&zwnj;&hairsp;&zwnj;&hairsp;&zwnj;&hairsp;&zwnj;&hairsp;&zwnj;&hairsp;&zwnj;&hairsp;&zwnj;&hairsp;&zwnj;&hairsp;&zwnj;&hairsp;&zwnj;&hairsp;&zwnj;&hairsp;&zwnj;&hairsp;&zwnj;&hairsp;&zwnj;&hairsp;&zwnj;
  </div>

  <table class="email-wrapper" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center">
        <table class="email-card" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;">

          <!-- Header -->
          <tr>
            <td class="email-header">
              ${logoUrl
                ? `<a href="${appUrl}"><img class="logo" src="${escHtml(logoUrl)}" alt="${escHtml(appName)}" /></a>`
                : `<a href="${appUrl}" class="logo-text">${escHtml(appName)}</a>`
              }
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-body">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer">
              <p>Questions? <a href="mailto:${escHtml(supportEmail)}">${escHtml(supportEmail)}</a></p>
              <p>&copy; ${year} ${escHtml(appName)}. All rights reserved.</p>
              <p><a href="${appUrl}/unsubscribe">Unsubscribe</a> &middot; <a href="${appUrl}/privacy">Privacy Policy</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
};

/** Escape HTML special characters for safe interpolation. */
const escHtml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

module.exports = { baseLayout, escHtml };
