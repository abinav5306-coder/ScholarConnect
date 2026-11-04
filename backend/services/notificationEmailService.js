/**
 * ScholarConnect Centralized Automated Email Notification Service
 * 
 * Handles:
 * 1. Student Application Submission Notifications (to Faculty) & Confirmation (to Student)
 * 2. Application Status Change Notifications (Selected, Shortlisted, Waiting List, Not Selected, Under Review)
 * 3. Relevant Student Opportunity Announcements (skill/department/eligibility matched & deduplicated)
 * 4. Opportunity Closure Notifications to Applicants
 * 5. Real-Time Message Notifications (offline/unread recipient; cooldown throttled; zero private contents)
 * 6. Academic Identity Verification Submission, Approval & Rejection Notifications
 * 
 * Respects User Notification Preferences stored in MongoDB Atlas users collection.
 * Asynchronous, non-blocking, and resilient to SMTP outages.
 */

import nodemailer from 'nodemailer';
import { getTransporter } from './emailService.js';
import { getCollections } from '../config/db.js';
import {
  renderNewApplicationTeacherEmail,
  renderApplicationSubmittedStudentEmail,
  renderApplicationStatusStudentEmail,
} from '../templates/emails/applicationTemplates.js';
import {
  renderOpportunityPublishedEmail,
  renderOpportunityClosedEmail,
} from '../templates/emails/opportunityTemplates.js';
import { renderMessageNotificationEmail } from '../templates/emails/messageTemplates.js';
import {
  renderVerificationSubmittedEmail,
  renderVerificationDecisionEmail,
} from '../templates/emails/verificationTemplates.js';

// Message notification cooldown tracker (in-memory, window: 10 minutes)
// Key: recipientEmail:opportunityId:senderId -> timestamp
const messageEmailCooldowns = new Map();
const MESSAGE_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch a user's notification preferences from MongoDB Atlas
 */
export async function getUserNotificationPreferences(userEmailOrId) {
  if (!userEmailOrId) {
    return {
      applicationStatusEmails: true,
      opportunityAnnouncementEmails: true,
      messageEmails: true,
      verificationEmails: true,
    };
  }

  try {
    const { users } = getCollections();
    const query = typeof userEmailOrId === 'string' && userEmailOrId.includes('@')
      ? { email: userEmailOrId.toLowerCase().trim() }
      : { $or: [{ id: userEmailOrId }, { email: userEmailOrId }] };

    const user = await users.findOne(query, { projection: { notificationPreferences: 1, email: 1 } });

    if (user && user.notificationPreferences) {
      return {
        applicationStatusEmails: user.notificationPreferences.applicationStatusEmails !== false,
        opportunityAnnouncementEmails: user.notificationPreferences.opportunityAnnouncementEmails !== false,
        messageEmails: user.notificationPreferences.messageEmails !== false,
        verificationEmails: user.notificationPreferences.verificationEmails !== false,
      };
    }
  } catch (err) {
    console.warn('[Notification Preferences] Could not fetch preferences, defaulting to enabled:', err.message);
  }

  return {
    applicationStatusEmails: true,
    opportunityAnnouncementEmails: true,
    messageEmails: true,
    verificationEmails: true,
  };
}

/**
 * Core centralized email dispatcher with preferences check & MongoDB Atlas audit logging
 */
async function sendNotificationEmail({
  toEmail,
  subject,
  html,
  type, // 'application_status' | 'opportunity_announcement' | 'message' | 'verification' | 'system'
  preferenceKey = null, // e.g. 'applicationStatusEmails'
  metadata = {},
}) {
  const normalizedEmail = String(toEmail || '').toLowerCase().trim();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    console.warn(`[Notification Email] Invalid destination email: "${toEmail}"`);
    return { success: false, reason: 'invalid_email' };
  }

  // 1. Check user notification preferences
  if (preferenceKey) {
    const prefs = await getUserNotificationPreferences(normalizedEmail);
    if (prefs[preferenceKey] === false) {
      console.log(`🔕 [Notification Email Skipped] User ${normalizedEmail} disabled "${preferenceKey}"`);
      return { success: false, skipped: true, reason: 'user_preference_disabled' };
    }
  }

  // 2. Dispatch via Nodemailer Transporter
  try {
    const transporter = await getTransporter();
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_FROM || '"ScholarConnect" <notifications@scholarconnect.edu>';

    const info = await transporter.sendMail({
      from: fromAddress,
      to: normalizedEmail,
      subject,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || null;
    console.log(`✉️  [Notification Email Sent] Type: [${type}] to ${normalizedEmail} | ID: ${info.messageId}`);
    if (previewUrl) {
      console.log(`🔗 [Email Preview]: ${previewUrl}`);
    }

    // 3. Log to MongoDB email_logs collection for audit and duplicate prevention
    try {
      const { emailLogs } = getCollections();
      if (emailLogs) {
        await emailLogs.insertOne({
          recipientEmail: normalizedEmail,
          subject,
          type,
          status: 'sent',
          messageId: info.messageId,
          metadata,
          previewUrl,
          sentAt: new Date(),
        });
      }
    } catch {
      // Non-blocking logging
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
    };
  } catch (error) {
    console.error(`❌ [Notification Email Delivery Failed] Type: [${type}] to ${normalizedEmail}:`, error.message);

    try {
      const { emailLogs } = getCollections();
      if (emailLogs) {
        await emailLogs.insertOne({
          recipientEmail: normalizedEmail,
          subject,
          type,
          status: 'failed',
          error: error.message,
          metadata,
          sentAt: new Date(),
        });
      }
    } catch {}

    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================================================
// 1. STUDENT APPLICATION NOTIFICATIONS
// ============================================================================

/**
 * When a student applies: Notify the faculty mentor
 */
export async function notifyTeacherOfNewApplication({
  teacherEmail,
  teacherName,
  studentName,
  studentInstitution,
  studentDepartment,
  studentAcademicYear,
  opportunityTitle,
  applicationDate,
  statementSnippet = '',
}) {
  const { subject, html } = renderNewApplicationTeacherEmail({
    teacherName,
    studentName,
    studentInstitution,
    studentDepartment,
    studentAcademicYear,
    opportunityTitle,
    applicationDate,
    statementSnippet,
    clientUrl: process.env.CLIENT_URL,
  });

  return sendNotificationEmail({
    toEmail: teacherEmail,
    subject,
    html,
    type: 'application_received',
    preferenceKey: 'applicationStatusEmails',
    metadata: { opportunityTitle, studentName },
  });
}

/**
 * When a student applies: Send submission confirmation to the student
 */
export async function notifyStudentOfApplicationSubmitted({
  studentEmail,
  studentName,
  opportunityTitle,
  teacherName,
  institution,
  applicationDate,
}) {
  const { subject, html } = renderApplicationSubmittedStudentEmail({
    studentName,
    opportunityTitle,
    teacherName,
    institution,
    applicationDate,
    clientUrl: process.env.CLIENT_URL,
  });

  return sendNotificationEmail({
    toEmail: studentEmail,
    subject,
    html,
    type: 'application_submitted_student',
    preferenceKey: 'applicationStatusEmails',
    metadata: { opportunityTitle },
  });
}

// ============================================================================
// 2. APPLICATION STATUS CHANGE NOTIFICATIONS
// ============================================================================

/**
 * When status changes (Selected, Shortlisted, Waiting List, Not Selected, Under Review)
 */
export async function notifyStudentOfStatusUpdate({
  studentEmail,
  studentName,
  opportunityTitle,
  teacherName,
  status,
}) {
  const { subject, html } = renderApplicationStatusStudentEmail({
    studentName,
    opportunityTitle,
    teacherName,
    status,
    clientUrl: process.env.CLIENT_URL,
  });

  return sendNotificationEmail({
    toEmail: studentEmail,
    subject,
    html,
    type: 'application_status_update',
    preferenceKey: 'applicationStatusEmails',
    metadata: { opportunityTitle, status },
  });
}

// ============================================================================
// 3. OPPORTUNITY PUBLICATION NOTIFICATIONS (Matched to relevant students)
// ============================================================================

/**
 * Identify relevant verified students and send announcement emails
 */
export async function notifyRelevantStudentsOfOpportunity({
  opportunityId,
  opportunityTitle,
  category,
  institution,
  teacherName,
  requiredSkills = [],
  eligibilityYears = [],
  department = '',
  deadline,
  shortDescription = '',
}) {
  try {
    const { users, emailLogs } = getCollections();

    // Normalize skills and criteria for matching
    const targetSkills = (requiredSkills || []).map((s) => String(s).toLowerCase().trim());
    const targetYears = (eligibilityYears || []).map((y) => String(y).toLowerCase().trim());
    const targetDept = String(department || '').toLowerCase().trim();

    // Query verified students only
    const query = {
      role: 'student',
      $or: [
        { emailVerified: true },
        { isEmailVerified: true },
      ],
    };

    const students = await users.find(query).toArray();
    console.log(`🔍 [Opportunity Matcher] Evaluating ${students.length} verified student candidates for "${opportunityTitle}"...`);

    let sentCount = 0;

    for (const student of students) {
      const studentEmail = student.email?.toLowerCase().trim();
      if (!studentEmail) continue;

      // Check if already notified for this opportunity
      if (emailLogs) {
        const alreadySent = await emailLogs.findOne({
          recipientEmail: studentEmail,
          type: 'opportunity_announcement',
          'metadata.opportunityId': String(opportunityId),
        });
        if (alreadySent) continue;
      }

      // Check profile match score
      const studentSkills = (Array.isArray(student.skills) ? student.skills : (student.skills || '').split(','))
        .map((s) => String(s).toLowerCase().trim());
      const studentYear = String(student.academicYear || '').toLowerCase().trim();
      const studentDept = String(student.department || '').toLowerCase().trim();
      const studentInterests = (Array.isArray(student.researchInterests) ? student.researchInterests : (student.researchInterests || '').split(','))
        .map((i) => String(i).toLowerCase().trim());

      const skillMatch = targetSkills.some((ts) => studentSkills.some((ss) => ss.includes(ts) || ts.includes(ss)));
      const interestMatch = targetSkills.some((ts) => studentInterests.some((si) => si.includes(ts)));
      const yearMatch = targetYears.length === 0 || targetYears.includes('all years') || targetYears.some((ty) => ty.includes(studentYear) || studentYear.includes(ty));
      const deptMatch = !targetDept || studentDept.includes(targetDept) || targetDept.includes(studentDept);

      // Matches if skills/interests match AND eligibility year matches, or general relevance
      const isRelevant = (skillMatch || interestMatch) && (yearMatch || deptMatch);

      if (isRelevant) {
        const { subject, html } = renderOpportunityPublishedEmail({
          studentName: student.fullName || student.name || 'Scholar',
          opportunityTitle,
          category,
          institution,
          teacherName,
          requiredSkills,
          eligibilityYears,
          deadline,
          shortDescription,
          clientUrl: process.env.CLIENT_URL,
        });

        // Asynchronously dispatch
        sendNotificationEmail({
          toEmail: studentEmail,
          subject,
          html,
          type: 'opportunity_announcement',
          preferenceKey: 'opportunityAnnouncementEmails',
          metadata: { opportunityId: String(opportunityId), opportunityTitle },
        }).catch(() => {});

        sentCount++;
      }
    }

    console.log(`📢 [Opportunity Matcher] Queued announcement emails to ${sentCount} relevant student(s).`);
    return { success: true, matchedCount: sentCount };
  } catch (err) {
    console.error('Failed to notify relevant students:', err.message);
    return { success: false, error: err.message };
  }
}

// ============================================================================
// 4. OPPORTUNITY CLOSURE NOTIFICATIONS
// ============================================================================

/**
 * When an opportunity closes: notify existing applicants
 */
export async function notifyApplicantsOfOpportunityClosed({
  opportunityId,
  opportunityTitle,
  teacherName,
}) {
  try {
    const { applications, users } = getCollections();

    // Find all submitted applications for this opportunity
    const apps = await applications.find({
      $or: [
        { opportunityId: String(opportunityId) },
        { opportunityId: opportunityId },
      ],
    }).toArray();

    if (apps.length === 0) {
      console.log(`ℹ️  [Opportunity Closed] No applicants to notify for opportunity ${opportunityId}`);
      return { success: true, count: 0 };
    }

    let notifiedCount = 0;

    for (const app of apps) {
      const studentEmail = (app.studentEmail || app.email)?.toLowerCase().trim();
      const studentName = app.studentName || app.fullName || 'Scholar';
      if (!studentEmail) continue;

      const { subject, html } = renderOpportunityClosedEmail({
        studentName,
        opportunityTitle,
        teacherName,
        currentStatus: app.status || 'Under Review',
        clientUrl: process.env.CLIENT_URL,
      });

      sendNotificationEmail({
        toEmail: studentEmail,
        subject,
        html,
        type: 'opportunity_closed',
        preferenceKey: 'applicationStatusEmails',
        metadata: { opportunityId: String(opportunityId), currentStatus: app.status },
      }).catch(() => {});

      notifiedCount++;
    }

    console.log(`📪 [Opportunity Closed] Notified ${notifiedCount} student applicant(s) of closure.`);
    return { success: true, count: notifiedCount };
  } catch (err) {
    console.error('Failed to notify applicants of closure:', err.message);
    return { success: false, error: err.message };
  }
}

// ============================================================================
// 5. REAL-TIME MESSAGE EMAIL NOTIFICATIONS (Offline / Unread)
// ============================================================================

/**
 * When a user receives a message: send email if offline/unread with cooldown
 * (Strictly NO private message content in email body)
 */
export async function notifyUserOfNewMessage({
  recipientEmail,
  recipientName,
  senderName,
  senderRole = 'mentor',
  opportunityTitle,
  opportunityId,
  senderId,
  isStudent = true,
}) {
  const normRecipient = String(recipientEmail || '').toLowerCase().trim();
  const cooldownKey = `${normRecipient}:${opportunityId}:${senderId}`;

  // Cooldown check (10 minutes)
  const now = Date.now();
  const lastSent = messageEmailCooldowns.get(cooldownKey) || 0;
  if (now - lastSent < MESSAGE_COOLDOWN_MS) {
    console.log(`⏳ [Message Email Throttled] Cooldown active for ${cooldownKey} (${Math.round((MESSAGE_COOLDOWN_MS - (now - lastSent)) / 1000)}s remaining)`);
    return { success: false, throttled: true, reason: 'cooldown_active' };
  }

  // Update cooldown timestamp
  messageEmailCooldowns.set(cooldownKey, now);

  const { subject, html } = renderMessageNotificationEmail({
    recipientName: recipientName || 'Scholar',
    senderName,
    senderRole,
    opportunityTitle,
    isStudent,
    clientUrl: process.env.CLIENT_URL,
  });

  return sendNotificationEmail({
    toEmail: normRecipient,
    subject,
    html,
    type: 'message_alert',
    preferenceKey: 'messageEmails',
    metadata: { opportunityTitle, senderName, opportunityId },
  });
}

// ============================================================================
// 6. ACADEMIC IDENTITY VERIFICATION NOTIFICATIONS
// ============================================================================

/**
 * When user submits verification documents
 */
export async function notifyVerificationSubmitted({
  userEmail,
  fullName,
  role = 'student',
  institution,
  department,
}) {
  const { subject, html } = renderVerificationSubmittedEmail({
    fullName,
    role,
    institution,
    department,
    clientUrl: process.env.CLIENT_URL,
  });

  return sendNotificationEmail({
    toEmail: userEmail,
    subject,
    html,
    type: 'verification_submitted',
    preferenceKey: 'verificationEmails',
    metadata: { role, institution },
  });
}

/**
 * When administrator verifies or rejects credentials
 */
export async function notifyVerificationDecision({
  userEmail,
  fullName,
  role = 'student',
  status, // 'Verified' | 'Rejected'
  rejectionReason = '',
}) {
  const { subject, html } = renderVerificationDecisionEmail({
    fullName,
    role,
    status,
    rejectionReason,
    clientUrl: process.env.CLIENT_URL,
  });

  return sendNotificationEmail({
    toEmail: userEmail,
    subject,
    html,
    type: 'verification_decision',
    preferenceKey: 'verificationEmails',
    metadata: { role, status, rejectionReason },
  });
}
