import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

let transporter = null;
let isEthereal = false;

/**
 * Initialize Nodemailer Transporter using configured SMTP or dynamic test account
 */
export async function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  // If user provided custom SMTP credentials in backend/.env
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    console.log(`📧 [Nodemailer] Connecting to configured SMTP: ${SMTP_HOST}:${SMTP_PORT || 587}`);
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: SMTP_SECURE === 'true' || Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
    isEthereal = false;
    return transporter;
  }

  // Fallback to real Ethereal SMTP account for verified live delivery testing
  console.log('📧 [Nodemailer] Provisioning active Ethereal SMTP test account for live email delivery...');
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    isEthereal = true;
    console.log(`✅ [Nodemailer] Real test SMTP account ready (${testAccount.user})`);
    return transporter;
  } catch (err) {
    console.error('Failed to create Ethereal test account:', err.message);
    throw err;
  }
}

/**
 * Send 6-Digit Email OTP for Registration / Login Verification
 * @param {string} toEmail 
 * @param {string} otp 
 * @param {string} purpose 
 */
export async function sendOtpEmail(toEmail, otp, purpose = 'registration') {
  const mailer = await getTransporter();

  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_FROM || `"ScholarConnect Security" <${process.env.SMTP_USER || 'security@scholarconnect.edu'}>`;
  const subject = `Your ScholarConnect Verification Code: ${otp}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid #f1f5f9; }
        .logo { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
        .logo span { color: #4f46e5; }
        .content { padding: 24px 0; text-align: left; }
        .otp-box { background: #f5f3ff; border: 2px dashed #818cf8; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #4338ca; font-family: monospace; }
        .timer-warning { font-size: 13px; color: #dc2626; font-weight: 600; text-align: center; margin-top: 8px; }
        .note { font-size: 13px; color: #64748b; line-height: 1.6; }
        .footer { text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo">Scholar<span>Connect</span></div>
          <p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">Academic Identity & Research Gateway</p>
        </div>
        <div class="content">
          <h2 style="font-size: 18px; color: #1e293b; margin: 0 0 12px;">Verify Your Email Address</h2>
          <p class="note">Please use the 6-digit verification code below to confirm your registered email address and activate your ScholarConnect account.</p>
          
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="timer-warning">⏱ Expires in 5 minutes</div>
          </div>

          <p class="note"><strong>Security notice:</strong> Never share this code with anyone. ScholarConnect staff will never request your verification code.</p>
          <p class="note" style="margin-top: 16px;">If you did not initiate this request, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ScholarConnect Academic Systems. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await mailer.sendMail({
    from: fromAddress,
    to: toEmail,
    subject,
    html: htmlContent,
  });

  const previewUrl = isEthereal ? nodemailer.getTestMessageUrl(info) : null;
  console.log(`✉️  [Email Delivered] OTP sent to ${toEmail} | Message ID: ${info.messageId}`);
  if (isEthereal || process.env.NODE_ENV !== 'production') {
    console.log(`\n========================================================`);
    console.log(`🔑 [DEVELOPMENT OTP CODE]: ${otp}`);
    console.log(`📧 Target Recipient: ${toEmail}`);
    if (previewUrl) {
      console.log(`🔗 Ethereal Sandbox Inbox Preview: ${previewUrl}`);
    }
    console.log(`========================================================\n`);
  }

  return {
    success: true,
    messageId: info.messageId,
    previewUrl,
  };
}

/**
 * Send Academic Verification Status Email (Approval / Rejection)
 */
export async function sendVerificationDecisionEmail(toEmail, status, rejectionReason = '') {
  try {
    const mailer = await getTransporter();
    const isApproved = status === 'Verified';
    const subject = isApproved 
      ? 'ScholarConnect Academic Identity Verified 🎉' 
      : 'ScholarConnect Academic Verification Update';

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 500px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: ${isApproved ? '#059669' : '#dc2626'};">
          ${isApproved ? 'Identity Verified Successfully' : 'Verification Update Required'}
        </h2>
        <p style="font-size: 14px; color: #334155;">
          ${isApproved 
            ? 'Your institutional identity and uploaded credentials have been reviewed and approved by the academic administrator. Your profile now proudly displays the Verified Scholar badge.' 
            : `Your academic verification could not be approved at this time. Reason: <strong>${rejectionReason}</strong>. You may log in to your profile and resubmit clear institutional documentation.`
          }
        </p>
      </div>
    `;

    const info = await mailer.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_FROM || `"ScholarConnect Identity" <${process.env.SMTP_USER || 'identity@scholarconnect.edu'}>`,
      to: toEmail,
      subject,
      html: htmlContent,
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.warn('Could not send decision email:', err.message);
    return { success: false, error: err.message };
  }
}

