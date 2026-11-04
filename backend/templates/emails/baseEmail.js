/**
 * ScholarConnect Base Responsive HTML Email Template
 * Brand: ScholarConnect ("Connecting Talent. Advancing Research.")
 * Design:
 * - Clean white background (#f8fafc canvas, #ffffff card)
 * - Indigo primary (#4f46e5), Teal accent (#0d9488)
 * - Modern typography, rounded cards (16px), subtle borders
 * - Accessible CTAs, responsive mobile formatting
 * - Professional academic footer with notification settings link
 */

export function renderBaseEmail({
  recipientName = 'Scholar',
  preheader = '',
  badge = null, // { text: 'APPLICATION UPDATE', color: 'indigo' | 'teal' | 'emerald' | 'amber' | 'rose' }
  title,
  subtitle = null,
  bodyHtml,
  cta = null, // { label: 'View Application', url: 'https://...' }
  secondaryCta = null,
  footerNote = null,
}) {
  const currentYear = new Date().getFullYear();
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  // Badge color mapping
  const badgeColors = {
    indigo: { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe' },
    teal: { bg: '#f0fdfa', text: '#0f766e', border: '#99f6e4' },
    emerald: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
    amber: { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
    rose: { bg: '#fff1f2', text: '#be123c', border: '#fecdd3' },
    slate: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
  };

  const selectedBadge = badge ? (badgeColors[badge.color] || badgeColors.indigo) : null;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${preheader ? `<span style="display:none;font-size:1px;color:#f8fafc;max-height:0;overflow:hidden;">${preheader}</span>` : ''}
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 32px 16px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 18px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.05);
    }
    .header {
      padding: 32px 32px 24px;
      text-align: center;
      border-bottom: 1px solid #f1f5f9;
      background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
    }
    .logo-text {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      text-decoration: none;
    }
    .logo-accent {
      color: #4f46e5;
    }
    .tagline {
      margin: 6px 0 0;
      font-size: 12px;
      font-weight: 600;
      color: #0d9488;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .body-content {
      padding: 32px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 14px;
    }
    .email-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.3;
      margin: 0 0 8px;
      letter-spacing: -0.3px;
    }
    .email-subtitle {
      font-size: 14px;
      color: #64748b;
      margin: 0 0 20px;
      line-height: 1.5;
    }
    .card-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px;
      margin: 20px 0;
    }
    .cta-btn {
      display: inline-block;
      padding: 12px 24px;
      background-color: #4f46e5;
      color: #ffffff !important;
      font-size: 13px;
      font-weight: 700;
      border-radius: 12px;
      text-decoration: none;
      text-align: center;
      transition: background-color 0.2s;
    }
    .cta-btn-teal {
      background-color: #0d9488;
    }
    .secondary-btn {
      display: inline-block;
      padding: 11px 22px;
      background-color: #ffffff;
      color: #334155 !important;
      font-size: 13px;
      font-weight: 600;
      border-radius: 12px;
      border: 1px solid #cbd5e1;
      text-decoration: none;
      margin-left: 10px;
    }
    .detail-table {
      width: 100%;
      margin: 14px 0;
    }
    .detail-table td {
      padding: 7px 0;
      font-size: 13px;
      vertical-align: top;
    }
    .detail-label {
      color: #64748b;
      width: 38%;
      font-weight: 500;
    }
    .detail-value {
      color: #0f172a;
      font-weight: 700;
      width: 62%;
    }
    .footer {
      padding: 24px 32px 32px;
      background-color: #f8fafc;
      border-top: 1px solid #f1f5f9;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      line-height: 1.6;
    }
    .footer a {
      color: #4f46e5;
      text-decoration: none;
      font-weight: 600;
    }
    @media only screen and (max-width: 600px) {
      .container {
        border-radius: 0 !important;
      }
      .body-content, .header, .footer {
        padding: 24px 20px !important;
      }
      .cta-btn, .secondary-btn {
        display: block !important;
        margin: 8px 0 !important;
        width: 100% !important;
        box-sizing: border-box;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      
      <!-- Header -->
      <div class="header">
        <a href="${clientUrl}" class="logo-text">Scholar<span class="logo-accent">Connect</span></a>
        <p class="tagline">Connecting Talent. Advancing Research.</p>
      </div>

      <!-- Main Content -->
      <div class="body-content">
        ${badge ? `
          <div class="badge" style="background-color: ${selectedBadge.bg}; color: ${selectedBadge.text}; border: 1px solid ${selectedBadge.border};">
            ${badge.text}
          </div>
        ` : ''}

        <h1 class="email-title">${title}</h1>
        ${subtitle ? `<p class="email-subtitle">${subtitle}</p>` : ''}

        <div style="font-size: 14px; line-height: 1.6; color: #334155;">
          ${bodyHtml}
        </div>

        ${cta ? `
          <div style="margin-top: 28px; text-align: left;">
            <a href="${cta.url}" class="cta-btn ${cta.color === 'teal' ? 'cta-btn-teal' : ''}">${cta.label} &rarr;</a>
            ${secondaryCta ? `<a href="${secondaryCta.url}" class="secondary-btn">${secondaryCta.label}</a>` : ''}
          </div>
        ` : ''}
      </div>

      <!-- Footer -->
      <div class="footer">
        ${footerNote ? `<p style="margin: 0 0 10px; color: #475569;">${footerNote}</p>` : ''}
        <p style="margin: 0 0 8px;">
          You are receiving this automated email as a registered user of ScholarConnect.
        </p>
        <p style="margin: 0 0 8px;">
          <a href="${clientUrl}/student/settings">Notification Preferences</a> &nbsp;&bull;&nbsp; 
          <a href="${clientUrl}/student/explore">Browse Opportunities</a> &nbsp;&bull;&nbsp; 
          <a href="${clientUrl}">Help Center</a>
        </p>
        <p style="margin: 8px 0 0; font-size: 11px; color: #94a3b8;">
          &copy; ${currentYear} ScholarConnect Platform. Connecting undergraduate and postgraduate talent with research mentors. All rights reserved.
        </p>
      </div>

    </div>
  </div>
</body>
</html>
  `;
}

