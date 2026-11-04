import { renderBaseEmail } from './baseEmail.js';

/**
 * 1. Email sent to relevant verified students when a new opportunity is published
 */
export function renderOpportunityPublishedEmail({
  studentName,
  opportunityTitle,
  category,
  institution,
  teacherName,
  requiredSkills = [],
  eligibilityYears = [],
  deadline,
  shortDescription = '',
  clientUrl = 'http://localhost:5173',
}) {
  const skillsDisplay = Array.isArray(requiredSkills) && requiredSkills.length > 0 
    ? requiredSkills.slice(0, 5).join(', ') 
    : 'Not specified';

  const eligibilityDisplay = Array.isArray(eligibilityYears) && eligibilityYears.length > 0
    ? eligibilityYears.join(', ')
    : 'All academic years';

  const bodyHtml = `
    <p>Dear <strong>${studentName}</strong>,</p>
    <p>A new research opportunity matching your academic profile and technical skills has just been published on ScholarConnect!</p>

    <div class="card-box">
      <div style="font-size: 11px; font-weight: 700; color: #4338ca; text-transform: uppercase; margin-bottom: 8px;">
        Opportunity Overview
      </div>
      <table class="detail-table">
        <tr>
          <td class="detail-label">Title:</td>
          <td class="detail-value">${opportunityTitle}</td>
        </tr>
        <tr>
          <td class="detail-label">Category:</td>
          <td class="detail-value"><span style="color: #0d9488; font-weight: 700;">${category}</span></td>
        </tr>
        <tr>
          <td class="detail-label">Faculty Mentor:</td>
          <td class="detail-value">${teacherName || 'Faculty Researcher'}</td>
        </tr>
        <tr>
          <td class="detail-label">Institution:</td>
          <td class="detail-value">${institution || 'Academic Institution'}</td>
        </tr>
        <tr>
          <td class="detail-label">Required Skills:</td>
          <td class="detail-value">${skillsDisplay}</td>
        </tr>
        <tr>
          <td class="detail-label">Eligibility:</td>
          <td class="detail-value">${eligibilityDisplay}</td>
        </tr>
        <tr>
          <td class="detail-label">Application Deadline:</td>
          <td class="detail-value"><span style="color: #be123c; font-weight: 700;">${deadline || 'Open until filled'}</span></td>
        </tr>
      </table>

      ${shortDescription ? `
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #cbd5e1;">
          <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
            ${shortDescription}
          </p>
        </div>
      ` : ''}
    </div>

    <p style="font-size: 13px; color: #64748b;">
      Positions are limited and applications are reviewed on a rolling basis. Review full objectives and apply early.
    </p>
  `;

  return {
    subject: `New Opportunity: ${opportunityTitle} – ScholarConnect`,
    html: renderBaseEmail({
      recipientName: studentName,
      preheader: `New ${category} call: ${opportunityTitle}`,
      badge: { text: 'New Opportunity Call', color: 'indigo' },
      title: 'New Research Call Matching Your Profile',
      subtitle: `Published by ${teacherName || 'Faculty'} at ${institution || 'Partner Institution'}`,
      bodyHtml,
      cta: {
        label: 'View Opportunity & Apply',
        url: `${clientUrl}/student/explore`,
        color: 'indigo',
      },
    }),
  };
}

/**
 * 2. Email sent to existing applicants when an opportunity is closed
 */
export function renderOpportunityClosedEmail({
  studentName,
  opportunityTitle,
  teacherName,
  currentStatus = 'Under Review',
  clientUrl = 'http://localhost:5173',
}) {
  const bodyHtml = `
    <p>Dear <strong>${studentName}</strong>,</p>
    <p>
      The faculty mentor has officially closed applications for <strong>${opportunityTitle}</strong>. 
      No further applications are being accepted for this opportunity.
    </p>

    <div class="card-box">
      <div style="font-size: 11px; font-weight: 700; color: #b45309; text-transform: uppercase; margin-bottom: 8px;">
        Opportunity Closure Notice
      </div>
      <table class="detail-table">
        <tr>
          <td class="detail-label">Opportunity:</td>
          <td class="detail-value">${opportunityTitle}</td>
        </tr>
        <tr>
          <td class="detail-label">Faculty Mentor:</td>
          <td class="detail-value">${teacherName || 'Faculty Mentor'}</td>
        </tr>
        <tr>
          <td class="detail-label">Your Application Status:</td>
          <td class="detail-value"><span style="color: #4f46e5; font-weight: 700;">${currentStatus}</span></td>
        </tr>
        <tr>
          <td class="detail-label">Closure Date:</td>
          <td class="detail-value">${new Date().toLocaleDateString()}</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #f8fafc; border-left: 4px solid #0d9488; padding: 12px 16px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; color: #334155;">
        <strong>Important note on your application:</strong> This closure does not cancel or invalidate existing submitted applications. The faculty mentor will continue evaluating submitted candidates and will publish final selections.
      </p>
    </div>
  `;

  return {
    subject: `Opportunity Closed: ${opportunityTitle} – ScholarConnect`,
    html: renderBaseEmail({
      recipientName: studentName,
      preheader: `Applications for ${opportunityTitle} are now closed`,
      badge: { text: 'Applications Closed', color: 'amber' },
      title: 'Opportunity Applications Closed',
      subtitle: `Applications are no longer being accepted for "${opportunityTitle}"`,
      bodyHtml,
      cta: {
        label: 'Check My Applications',
        url: `${clientUrl}/student/applications`,
        color: 'indigo',
      },
    }),
  };
}

