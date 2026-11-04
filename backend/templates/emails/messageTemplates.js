import { renderBaseEmail } from './baseEmail.js';

/**
 * Real-Time Message Email Notification
 * NOTE: As strictly required, NEVER include private message contents in this email.
 */
export function renderMessageNotificationEmail({
  recipientName,
  senderName,
  senderRole = 'mentor',
  opportunityTitle,
  clientUrl = 'http://localhost:5173',
  isStudent = true,
}) {
  const conversationUrl = isStudent 
    ? `${clientUrl}/student/messages` 
    : `${clientUrl}/teacher/messages`;

  const bodyHtml = `
    <p>Hello <strong>${recipientName}</strong>,</p>
    <p>
      You have a new message from <strong>${senderName}</strong> regarding the research opportunity 
      <strong>"${opportunityTitle}"</strong>.
    </p>

    <div class="card-box">
      <div style="font-size: 11px; font-weight: 700; color: #4338ca; text-transform: uppercase; margin-bottom: 8px;">
        Communication Notice
      </div>
      <table class="detail-table">
        <tr>
          <td class="detail-label">Sender:</td>
          <td class="detail-value">${senderName} (${senderRole === 'teacher' ? 'Faculty Mentor' : 'Student Applicant'})</td>
        </tr>
        <tr>
          <td class="detail-label">Research Context:</td>
          <td class="detail-value">${opportunityTitle}</td>
        </tr>
        <tr>
          <td class="detail-label">Received At:</td>
          <td class="detail-value">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, ${new Date().toLocaleDateString()}</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #f1f5f9; border-left: 4px solid #0d9488; padding: 12px 16px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0; font-size: 12px; color: #475569;">
        🔒 <strong>Privacy Policy:</strong> Message contents are encrypted in transit and stored securely in ScholarConnect. To read the message and respond in real-time, please open your ScholarConnect Messages workspace.
      </p>
    </div>
  `;

  return {
    subject: `New Message from ${senderName} regarding ${opportunityTitle} – ScholarConnect`,
    html: renderBaseEmail({
      recipientName,
      preheader: `New message from ${senderName} regarding ${opportunityTitle}`,
      badge: { text: 'New Message', color: 'indigo' },
      title: 'New Message on ScholarConnect',
      subtitle: `${senderName} sent you a message about "${opportunityTitle}"`,
      bodyHtml,
      cta: {
        label: 'Open Secure Conversation',
        url: conversationUrl,
        color: 'indigo',
      },
      footerNote: 'To prevent frequent alerts during active discussions, email notifications are throttled.',
    }),
  };
}

