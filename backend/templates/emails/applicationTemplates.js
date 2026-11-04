import { renderBaseEmail } from './baseEmail.js';

/**
 * 1. Email to Faculty when a student submits an application
 * Subject: "New Application Received – ScholarConnect"
 */
export function renderNewApplicationTeacherEmail({
  teacherName,
  studentName,
  studentInstitution,
  studentDepartment,
  studentAcademicYear,
  opportunityTitle,
  applicationDate,
  statementSnippet = '',
  clientUrl = 'http://localhost:5173',
}) {
  const bodyHtml = `
    <p>Hello <strong>${teacherName || 'Faculty Mentor'}</strong>,</p>
    <p>A new student dossier has been submitted for your research opportunity: <strong>${opportunityTitle}</strong>.</p>

    <div class="card-box">
      <div style="font-size: 11px; font-weight: 700; color: #0d9488; text-transform: uppercase; margin-bottom: 8px;">
        Applicant Dossier Summary
      </div>
      <table class="detail-table">
        <tr>
          <td class="detail-label">Student Name:</td>
          <td class="detail-value">${studentName}</td>
        </tr>
        <tr>
          <td class="detail-label">Institution:</td>
          <td class="detail-value">${studentInstitution || 'Not specified'}</td>
        </tr>
        <tr>
          <td class="detail-label">Department:</td>
          <td class="detail-value">${studentDepartment || 'Not specified'}</td>
        </tr>
        <tr>
          <td class="detail-label">Academic Year:</td>
          <td class="detail-value">${studentAcademicYear || 'Not specified'}</td>
        </tr>
        <tr>
          <td class="detail-label">Submission Date:</td>
          <td class="detail-value">${applicationDate || new Date().toLocaleDateString()}</td>
        </tr>
      </table>

      ${statementSnippet ? `
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #cbd5e1;">
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Statement of Interest Preview:</span>
          <p style="margin: 4px 0 0; font-size: 13px; color: #334155; font-style: italic;">
            "${statementSnippet.slice(0, 180)}${statementSnippet.length > 180 ? '...' : ''}"
          </p>
        </div>
      ` : ''}
    </div>

    <p style="font-size: 13px; color: #64748b;">
      You can review this candidate's verified academic profile, skills, GitHub, and statement of interest in the Student Applicants portal.
    </p>
  `;

  return {
    subject: 'New Application Received – ScholarConnect',
    html: renderBaseEmail({
      recipientName: teacherName,
      preheader: `New applicant ${studentName} applied for ${opportunityTitle}`,
      badge: { text: 'New Applicant', color: 'teal' },
      title: 'New Student Application Received',
      subtitle: `An undergraduate / graduate student has applied to "${opportunityTitle}"`,
      bodyHtml,
      cta: {
        label: 'Review Candidate Dossier',
        url: `${clientUrl}/teacher/applicants`,
        color: 'teal',
      },
    }),
  };
}

/**
 * 2. Confirmation email to student when they submit an application
 * Subject: "Application Successfully Submitted – ScholarConnect"
 */
export function renderApplicationSubmittedStudentEmail({
  studentName,
  opportunityTitle,
  teacherName,
  institution,
  applicationDate,
  clientUrl = 'http://localhost:5173',
}) {
  const bodyHtml = `
    <p>Dear <strong>${studentName}</strong>,</p>
    <p>Your application for <strong>${opportunityTitle}</strong> has been successfully submitted and saved in the ScholarConnect central database.</p>

    <div class="card-box">
      <div style="font-size: 11px; font-weight: 700; color: #4338ca; text-transform: uppercase; margin-bottom: 8px;">
        Application Submission Details
      </div>
      <table class="detail-table">
        <tr>
          <td class="detail-label">Opportunity:</td>
          <td class="detail-value">${opportunityTitle}</td>
        </tr>
        <tr>
          <td class="detail-label">Faculty Mentor:</td>
          <td class="detail-value">${teacherName || 'Faculty Researcher'}</td>
        </tr>
        <tr>
          <td class="detail-label">Host Institution:</td>
          <td class="detail-value">${institution || 'Academic Institution'}</td>
        </tr>
        <tr>
          <td class="detail-label">Initial Status:</td>
          <td class="detail-value"><span style="color: #4f46e5; font-weight: 700;">Submitted</span></td>
        </tr>
        <tr>
          <td class="detail-label">Date Submitted:</td>
          <td class="detail-value">${applicationDate || new Date().toLocaleDateString()}</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #64748b;">
      The faculty mentor will review your application dossier. You will receive real-time email and dashboard notifications whenever your status changes.
    </p>
  `;

  return {
    subject: 'Application Successfully Submitted – ScholarConnect',
    html: renderBaseEmail({
      recipientName: studentName,
      preheader: `Your application for ${opportunityTitle} was received`,
      badge: { text: 'Submitted', color: 'indigo' },
      title: 'Application Successfully Submitted',
      subtitle: `Your submission for "${opportunityTitle}" is now pending mentor review`,
      bodyHtml,
      cta: {
        label: 'Track My Applications',
        url: `${clientUrl}/student/applications`,
        color: 'indigo',
      },
    }),
  };
}

/**
 * 3. Status Change Email sent to student when teacher updates status
 */
export function renderApplicationStatusStudentEmail({
  studentName,
  opportunityTitle,
  teacherName,
  status, // 'Selected' | 'Shortlisted' | 'Waiting List' | 'Not Selected' | 'Under Review'
  clientUrl = 'http://localhost:5173',
}) {
  const statusConfig = {
    'Selected': {
      subject: "Congratulations! You've Been Selected – ScholarConnect",
      badgeText: 'SELECTED',
      badgeColor: 'emerald',
      title: "Congratulations! You've Been Selected",
      message: 'Congratulations! You have been selected for the opportunity. The faculty mentor will contact you with further instructions.',
      nextSteps: 'Please keep an eye on your messages inbox on ScholarConnect for coordination on start dates, onboarding, and project deliverables.',
    },
    'Shortlisted': {
      subject: 'Your Application Has Been Shortlisted – ScholarConnect',
      badgeText: 'SHORTLISTED',
      badgeColor: 'indigo',
      title: 'Your Application Has Been Shortlisted',
      message: 'Great news! The faculty research mentor has shortlisted your application among competitive applicants.',
      nextSteps: 'The mentor may schedule an interview or request additional portfolio materials shortly.',
    },
    'Waiting List': {
      subject: 'Application Update – Waiting List – ScholarConnect',
      badgeText: 'WAITING LIST',
      badgeColor: 'amber',
      title: 'Application Placed on Waiting List',
      message: 'Your application has been placed on the waiting list. We will notify you immediately if a position opens up.',
      nextSteps: 'No action is required from you at this time. You will be automatically notified if your status changes.',
    },
    'Not Selected': {
      subject: 'Update on Your Application – ScholarConnect',
      badgeText: 'NOT SELECTED',
      badgeColor: 'rose',
      title: 'Update on Your Application',
      message: "Thank you for your interest and effort. Although you weren't selected this time, we encourage you to explore other opportunities on ScholarConnect. Keep learning and applying!",
      nextSteps: 'New faculty research calls, hackathons, and lab internships are posted every week across institutions.',
    },
    'Under Review': {
      subject: 'Your Application Is Under Review – ScholarConnect',
      badgeText: 'UNDER REVIEW',
      badgeColor: 'teal',
      title: 'Your Application Is Under Review',
      message: 'Your application is currently under formal review by the faculty mentor and departmental research committee.',
      nextSteps: 'Review decisions are generally communicated within 1-2 weeks of submission.',
    },
    'Submitted': {
      subject: 'Application Successfully Submitted – ScholarConnect',
      badgeText: 'SUBMITTED',
      badgeColor: 'slate',
      title: 'Application Status: Submitted',
      message: 'Your application has been recorded in the platform and is queued for review.',
      nextSteps: 'You can check current statuses across all your active applications in your dashboard.',
    },
  };

  const config = statusConfig[status] || {
    subject: `Application Status Updated: ${status} – ScholarConnect`,
    badgeText: status.toUpperCase(),
    badgeColor: 'indigo',
    title: `Application Status Update: ${status}`,
    message: `Your application status has been updated to "${status}".`,
    nextSteps: 'Check your dashboard for complete information.',
  };

  const bodyHtml = `
    <p>Dear <strong>${studentName}</strong>,</p>
    <p style="font-size: 15px; line-height: 1.5; color: #1e293b; font-weight: 500;">
      ${config.message}
    </p>

    <div class="card-box">
      <div style="font-size: 11px; font-weight: 700; color: #4338ca; text-transform: uppercase; margin-bottom: 8px;">
        Application Record
      </div>
      <table class="detail-table">
        <tr>
          <td class="detail-label">Opportunity:</td>
          <td class="detail-value">${opportunityTitle}</td>
        </tr>
        <tr>
          <td class="detail-label">Faculty Mentor:</td>
          <td class="detail-value">${teacherName || 'Faculty Researcher'}</td>
        </tr>
        <tr>
          <td class="detail-label">Updated Status:</td>
          <td class="detail-value">
            <span style="display: inline-block; padding: 2px 10px; border-radius: 6px; font-weight: 700;">
              ${status}
            </span>
          </td>
        </tr>
        <tr>
          <td class="detail-label">Updated On:</td>
          <td class="detail-value">${new Date().toLocaleDateString()}</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #f1f5f9; border-left: 4px solid #4f46e5; padding: 12px 16px; border-radius: 4px; margin: 20px 0;">
      <strong style="color: #0f172a; font-size: 13px;">Next Steps:</strong>
      <p style="margin: 4px 0 0; font-size: 13px; color: #475569;">${config.nextSteps}</p>
    </div>
  `;

  return {
    subject: config.subject,
    html: renderBaseEmail({
      recipientName: studentName,
      preheader: `${status} - ${opportunityTitle}`,
      badge: { text: config.badgeText, color: config.badgeColor },
      title: config.title,
      subtitle: `Status update regarding your application for "${opportunityTitle}"`,
      bodyHtml,
      cta: {
        label: 'View My Applications',
        url: `${clientUrl}/student/applications`,
        color: status === 'Selected' ? 'teal' : 'indigo',
      },
    }),
  };
}

