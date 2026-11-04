import { renderBaseEmail } from './baseEmail.js';

/**
 * 1. Verification Submitted Confirmation
 */
export function renderVerificationSubmittedEmail({
  fullName,
  role = 'student',
  institution,
  department,
  clientUrl = 'http://localhost:5173',
}) {
  const isStudent = role === 'student';
  const profileUrl = isStudent ? `${clientUrl}/student/profile` : `${clientUrl}/teacher/profile`;

  const bodyHtml = `
    <p>Dear <strong>${fullName}</strong>,</p>
    <p>
      Thank you for submitting your academic identity verification credentials to ScholarConnect.
      Your submission has been queued for verification by the institutional administration team.
    </p>

    <div class="card-box">
      <div style="font-size: 11px; font-weight: 700; color: #0d9488; text-transform: uppercase; margin-bottom: 8px;">
        Submission Details
      </div>
      <table class="detail-table">
        <tr>
          <td class="detail-label">Full Name:</td>
          <td class="detail-value">${fullName}</td>
        </tr>
        <tr>
          <td class="detail-label">Academic Role:</td>
          <td class="detail-value">${isStudent ? 'Student Scholar' : 'Faculty Mentor'}</td>
        </tr>
        <tr>
          <td class="detail-label">Institution:</td>
          <td class="detail-value">${institution || 'Academic Institution'}</td>
        </tr>
        <tr>
          <td class="detail-label">Department:</td>
          <td class="detail-value">${department || 'Department'}</td>
        </tr>
        <tr>
          <td class="detail-label">Status:</td>
          <td class="detail-value"><span style="color: #0d9488; font-weight: 700;">Pending Verification</span></td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #64748b;">
      Verification requests are usually reviewed within 24 to 48 hours. You will receive an email as soon as an administrator reviews your credentials.
    </p>
  `;

  return {
    subject: `Academic Verification Submitted – Under Review – ScholarConnect`,
    html: renderBaseEmail({
      recipientName: fullName,
      preheader: 'Your academic identity verification has been received and is under review.',
      badge: { text: 'Verification Submitted', color: 'teal' },
      title: 'Identity Verification Under Review',
      subtitle: 'Your institutional credentials have been safely received for administrative review',
      bodyHtml,
      cta: {
        label: 'View Verification Status',
        url: profileUrl,
        color: 'teal',
      },
    }),
  };
}

/**
 * 2. Verification Approved / Rejected Decision
 */
export function renderVerificationDecisionEmail({
  fullName,
  role = 'student',
  status, // 'Verified' | 'Rejected'
  rejectionReason = '',
  clientUrl = 'http://localhost:5173',
}) {
  const isApproved = status === 'Verified';
  const isStudent = role === 'student';
  const profileUrl = isStudent ? `${clientUrl}/student/profile` : `${clientUrl}/teacher/profile`;

  const bodyHtml = isApproved ? `
    <p>Dear <strong>${fullName}</strong>,</p>
    <p style="font-size: 15px; font-weight: 600; color: #047857;">
      Congratulations! Your academic identity has been verified by the institutional administrator.
    </p>

    <div class="card-box" style="border-left: 4px solid #059669;">
      <div style="font-size: 11px; font-weight: 700; color: #047857; text-transform: uppercase; margin-bottom: 8px;">
        Verification Summary
      </div>
      <table class="detail-table">
        <tr>
          <td class="detail-label">Account Name:</td>
          <td class="detail-value">${fullName}</td>
        </tr>
        <tr>
          <td class="detail-label">Verified Role:</td>
          <td class="detail-value">${isStudent ? 'Verified Student Scholar' : 'Verified Faculty Mentor'}</td>
        </tr>
        <tr>
          <td class="detail-label">Verification Badge:</td>
          <td class="detail-value"><span style="color: #059669; font-weight: 700;">Active &amp; Displayed on Profile</span></td>
        </tr>
        <tr>
          <td class="detail-label">Approved Date:</td>
          <td class="detail-value">${new Date().toLocaleDateString()}</td>
        </tr>
      </table>
    </div>

    ${!isStudent ? `
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px 18px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #166534; font-size: 13px;">Faculty Publishing Unlocked:</strong>
        <p style="margin: 4px 0 0; font-size: 13px; color: #15803d;">
          You are now fully authorized to publish research projects, internship positions, and lab assistantships for students across premier partner universities.
        </p>
      </div>
    ` : `
      <p style="font-size: 13px; color: #64748b;">
        Your verified status gives faculty mentors greater confidence in your credentials when reviewing your research applications.
      </p>
    `}
  ` : `
    <p>Dear <strong>${fullName}</strong>,</p>
    <p style="font-size: 14px; color: #334155;">
      Your academic identity verification submission could not be verified at this time by the administrator.
    </p>

    <div class="card-box" style="border-left: 4px solid #e11d48; background-color: #fff1f2;">
      <div style="font-size: 11px; font-weight: 700; color: #be123c; text-transform: uppercase; margin-bottom: 8px;">
        Reason for Rejection
      </div>
      <p style="margin: 0; font-size: 14px; font-weight: 600; color: #9f1239;">
        "${rejectionReason || 'Uploaded documentation was blurry, invalid, or expired. Please upload a clear official institutional ID card.'}"
      </p>
    </div>

    <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 12px 16px; border-radius: 4px; margin: 20px 0;">
      <strong style="color: #0f172a; font-size: 13px;">How to resolve:</strong>
      <p style="margin: 4px 0 0; font-size: 13px; color: #475569;">
        Please log in to your profile, navigate to the Academic Verification section, and re-upload a clear scanned copy or high-resolution photo of your current institutional identity card.
      </p>
    </div>
  `;

  return {
    subject: isApproved
      ? `ScholarConnect Academic Identity Verified 🎉`
      : `ScholarConnect Academic Verification Update Required`,
    html: renderBaseEmail({
      recipientName: fullName,
      preheader: isApproved 
        ? 'Your academic credentials have been verified successfully!' 
        : 'Update required on your academic identity verification submission.',
      badge: {
        text: isApproved ? 'VERIFIED SCHOLAR' : 'ACTION REQUIRED',
        color: isApproved ? 'emerald' : 'rose',
      },
      title: isApproved ? 'Academic Identity Verified Successfully' : 'Academic Verification Update Required',
      subtitle: isApproved 
        ? 'Your institutional identity and uploaded credentials have been approved'
        : 'Please review administrator feedback and re-submit your documentation',
      bodyHtml,
      cta: {
        label: isApproved ? 'View Verified Profile' : 'Re-submit Credentials in Profile',
        url: profileUrl,
        color: isApproved ? 'teal' : 'indigo',
      },
    }),
  };
}

