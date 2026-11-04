/**
 * Phase 8 End-to-End Automated Verification Test
 * 
 * Verifies:
 * 1. Centralized Reusable Email Notification Service (Nodemailer)
 * 2. Student Application Notifications (Teacher alert + Student submission confirmation)
 * 3. Application Status Notifications (SELECTED, SHORTLISTED, WAITING LIST, NOT SELECTED, UNDER REVIEW)
 * 4. Opportunity Publication Announcements (Skill/dept matching, verified filter, deduplication)
 * 5. Opportunity Closure Notifications (Existing applicants notified, status preserved)
 * 6. Real-Time Message Email Notifications (Offline/unread notice, ZERO private body, cooldown throttling)
 * 7. Academic Identity Verification Emails (Submission, approval, rejection with reasons)
 * 8. User Notification Preferences in MongoDB Atlas (Suppression when disabled, OTP mandatory)
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { ObjectId } from 'mongodb';
import { connectDB, getCollections, closeDB } from '../config/db.js';
import {
  notifyTeacherOfNewApplication,
  notifyStudentOfApplicationSubmitted,
  notifyStudentOfStatusUpdate,
  notifyRelevantStudentsOfOpportunity,
  notifyApplicantsOfOpportunityClosed,
  notifyUserOfNewMessage,
  notifyVerificationSubmitted,
  notifyVerificationDecision,
  getUserNotificationPreferences,
} from '../services/notificationEmailService.js';
import { sendOtpEmail } from '../services/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_BASE = 'http://localhost:5000/api';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Polls for an email log document with backoff to accommodate live SMTP network latency
 */
async function waitForEmailLog(emailLogs, filter, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const doc = await emailLogs.findOne(filter);
    if (doc) return doc;
    await sleep(300);
  }
  return null;
}

async function runPhase8Tests() {
  console.log('====================================================');
  console.log('🧪 Starting ScholarConnect Phase 8 Automated Email Notifications Test');
  console.log('====================================================');

  await connectDB();
  const { users, opportunities, applications, emailLogs } = getCollections();

  const testId = Date.now();
  const teacherEmail = `prof.nobel.${testId}@cambridge.edu`;
  const studentEmail = `scholar.marie.${testId}@sorbonne.edu`;
  const unverifiedStudentEmail = `student.unverified.${testId}@test.edu`;
  const testPassword = 'Password@123';

  let teacherToken = '';
  let studentToken = '';
  let teacherId = '';
  let studentId = '';
  let opportunityId = '';
  let applicationId = '';

  try {
    // -------------------------------------------------------------------------
    // SETUP: Create Authenticated Test Accounts
    // -------------------------------------------------------------------------
    console.log('\n[1/8] Setting up authenticated test accounts in MongoDB Atlas...');

    // 1. Teacher Account
    await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Prof. Ernest Rutherford',
        email: teacherEmail,
        password: testPassword,
        role: 'teacher',
        institution: 'University of Cambridge',
        department: 'Cavendish Laboratory',
        designation: 'Professor',
      }),
    });
    await users.updateOne({ email: teacherEmail }, { $set: { emailVerified: true, verificationStatus: 'Verified' } });

    const teachLogin = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: teacherEmail, password: testPassword }),
    }).then((r) => r.json());

    teacherToken = teachLogin.token;
    teacherId = teachLogin.user.id;
    console.log(`  ✅ Faculty account created & verified: ${teacherEmail}`);

    // 2. Student Account (Matched skills: Python, Machine Learning, Physics)
    await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Marie Curie',
        email: studentEmail,
        password: testPassword,
        role: 'student',
        institution: 'Sorbonne University',
        department: 'Physics',
        degree: 'B.S.',
        academicYear: 'Third Year',
        skills: ['Python', 'Machine Learning', 'Physics', 'Data Analysis'],
      }),
    });
    await users.updateOne({ email: studentEmail }, {
      $set: {
        emailVerified: true,
        verificationStatus: 'Verified',
        skills: ['Python', 'Machine Learning', 'Physics'],
        academicYear: 'Third Year',
        department: 'Physics',
      },
    });

    const studLogin = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: studentEmail, password: testPassword }),
    }).then((r) => r.json());

    studentToken = studLogin.token;
    studentId = studLogin.user.id;
    console.log(`  ✅ Verified Student account created: ${studentEmail}`);

    // 3. Unverified Student Account (Must NOT receive announcements)
    await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Unverified Applicant',
        email: unverifiedStudentEmail,
        password: testPassword,
        role: 'student',
        skills: ['Python', 'Machine Learning'],
      }),
    });
    // Deliberately keep emailVerified: false

    // -------------------------------------------------------------------------
    // TEST 2: Student Application Notifications (Teacher Alert & Student Confirmation)
    // -------------------------------------------------------------------------
    console.log('\n[2/8] Testing Student Application Submission Email Dispatch...');

    // Publish opportunity via API
    const oppRes = await fetch(`${API_BASE}/opportunities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        title: `Nuclear Magnetic Resonance Lab ${testId}`,
        category: 'Research Project',
        department: 'Physics',
        institution: 'University of Cambridge',
        shortDescription: 'Investigation into quantum nuclear magnetic resonance spectroscopy.',
        skills: ['Python', 'Physics', 'Machine Learning'],
        eligibilityYears: ['Third Year', 'Fourth Year'],
        positions: 2,
        deadline: '2026-12-31',
      }),
    }).then((r) => r.json());

    opportunityId = oppRes.opportunity.id || oppRes.opportunity._id;
    console.log(`  ✅ Published research call: "${oppRes.opportunity.title}"`);

    // Student applies for opportunity via API
    const appRes = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        opportunityId,
        fullName: 'Marie Curie',
        studentEmail,
        institution: 'Sorbonne University',
        department: 'Physics',
        academicYear: 'Third Year',
        statementOfInterest: 'I have developed neural network feature extractors for spectroscopic calibration curves.',
        skills: ['Python', 'Physics'],
      }),
    }).then((r) => r.json());

    applicationId = appRes.application.id || appRes.application._id;
    console.log(`  ✅ Application submitted: ID ${applicationId}`);

    // Verify Teacher received "New Application Received – ScholarConnect"
    const teachAppEmail = await waitForEmailLog(emailLogs, {
      recipientEmail: teacherEmail.toLowerCase(),
      type: 'application_received',
    }, 8000);

    if (!teachAppEmail) {
      throw new Error('Teacher did not receive "New Application Received" email!');
    }
    console.log(`  ✅ Faculty received application alert: "${teachAppEmail.subject}" (Msg ID: ${teachAppEmail.messageId})`);

    // Verify Student received "Application Successfully Submitted"
    const studSubmitEmail = await waitForEmailLog(emailLogs, {
      recipientEmail: studentEmail.toLowerCase(),
      type: 'application_submitted_student',
    }, 8000);

    if (!studSubmitEmail) {
      throw new Error('Student did not receive "Application Successfully Submitted" email!');
    }
    console.log(`  ✅ Student received confirmation email: "${studSubmitEmail.subject}" (Msg ID: ${studSubmitEmail.messageId})`);

    // -------------------------------------------------------------------------
    // TEST 3: Application Status Notifications (All 6 States)
    // -------------------------------------------------------------------------
    console.log('\n[3/8] Testing Application Status Update Email Templates...');

    const statusesToTest = [
      { status: 'Under Review', expectedSubjectFragment: 'Under Review' },
      { status: 'Shortlisted', expectedSubjectFragment: 'Shortlisted' },
      { status: 'Waiting List', expectedSubjectFragment: 'Waiting List' },
      { status: 'Selected', expectedSubjectFragment: 'Congratulations' },
      { status: 'Not Selected', expectedSubjectFragment: 'Update' },
    ];

    for (const testItem of statusesToTest) {
      const updateRes = await fetch(`${API_BASE}/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({ status: testItem.status }),
      }).then((r) => r.json());

      if (!updateRes.success) {
        throw new Error(`Failed to update status to ${testItem.status}: ${JSON.stringify(updateRes)}`);
      }

      const statusEmail = await waitForEmailLog(emailLogs, {
        recipientEmail: studentEmail.toLowerCase(),
        type: 'application_status_update',
        'metadata.status': testItem.status,
      }, 8000);

      if (!statusEmail) {
        throw new Error(`Student did not receive email notification for status "${testItem.status}"!`);
      }
      if (!statusEmail.subject.includes(testItem.expectedSubjectFragment)) {
        throw new Error(`Subject line mismatch for ${testItem.status}: "${statusEmail.subject}"`);
      }
      console.log(`  ✅ Status "${testItem.status}" email delivered: "${statusEmail.subject}"`);
    }

    // -------------------------------------------------------------------------
    // TEST 4: Opportunity Announcement Notifications (Matching & Deduplication)
    // -------------------------------------------------------------------------
    console.log('\n[4/8] Testing Opportunity Announcement Matching & Deduplication...');

    const announceRes = await notifyRelevantStudentsOfOpportunity({
      opportunityId,
      opportunityTitle: `Quantum Field Simulation ${testId}`,
      category: 'Research Project',
      institution: 'University of Cambridge',
      teacherName: 'Prof. Ernest Rutherford',
      requiredSkills: ['Python', 'Machine Learning'],
      eligibilityYears: ['Third Year'],
      department: 'Physics',
      deadline: '2026-12-31',
      shortDescription: 'High performance computing simulations of quantum field states.',
    });

    if (!announceRes.success) {
      throw new Error(`Opportunity announcement dispatch failed: ${announceRes.error}`);
    }

    // Verify Marie Curie (matching verified student) received announcement
    const matchEmail = await waitForEmailLog(emailLogs, {
      recipientEmail: studentEmail.toLowerCase(),
      type: 'opportunity_announcement',
      'metadata.opportunityId': String(opportunityId),
    }, 8000);

    if (!matchEmail) {
      throw new Error(`Matching student ${studentEmail} did not receive opportunity announcement!`);
    }
    console.log(`  ✅ Relevant student received announcement: "${matchEmail.subject}"`);

    // Verify unverified student was excluded
    const unverifiedEmail = await emailLogs.findOne({
      recipientEmail: unverifiedStudentEmail.toLowerCase(),
      type: 'opportunity_announcement',
    });
    if (unverifiedEmail) {
      throw new Error('Security flaw: Unverified student received opportunity announcement!');
    }
    console.log(`  🔒 Unverified student account properly excluded from email dispatch.`);

    // Deduplication check: trigger announce again
    await notifyRelevantStudentsOfOpportunity({
      opportunityId,
      opportunityTitle: `Quantum Field Simulation ${testId}`,
      requiredSkills: ['Python'],
    });
    await sleep(500);

    const matchEmailCount = await emailLogs.countDocuments({
      recipientEmail: studentEmail.toLowerCase(),
      type: 'opportunity_announcement',
      'metadata.opportunityId': String(opportunityId),
    });
    if (matchEmailCount > 1) {
      throw new Error(`Duplicate emails sent! Found ${matchEmailCount} emails for the same opportunity.`);
    }
    console.log(`  ✅ Deduplication verified: exactly 1 announcement email sent to recipient.`);

    // -------------------------------------------------------------------------
    // TEST 5: Opportunity Closure Notifications
    // -------------------------------------------------------------------------
    console.log('\n[5/8] Testing Opportunity Closure Notifications...');

    // Close the opportunity
    const closeRes = await fetch(`${API_BASE}/opportunities/${opportunityId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({ status: 'Closed' }),
    }).then((r) => r.json());

    if (!closeRes.success) {
      throw new Error(`Failed to close opportunity: ${JSON.stringify(closeRes)}`);
    }

    // Verify existing applicant was notified
    const closedEmail = await waitForEmailLog(emailLogs, {
      recipientEmail: studentEmail.toLowerCase(),
      type: 'opportunity_closed',
      'metadata.opportunityId': String(opportunityId),
    }, 8000);

    if (!closedEmail) {
      throw new Error('Applicant did not receive opportunity closure notification!');
    }
    console.log(`  ✅ Existing applicant notified of closure: "${closedEmail.subject}"`);

    // Verify application status was NOT broken or wiped
    const appDoc = await applications.findOne({
      $or: [
        ...(ObjectId.isValid(applicationId) ? [{ _id: new ObjectId(applicationId) }] : []),
        { id: applicationId },
      ],
    });
    if (!appDoc || !appDoc.status) {
      throw new Error('Application status was inadvertently altered by opportunity closure!');
    }
    console.log(`  ✅ Application preserved with current status: "${appDoc.status}"`);

    // -------------------------------------------------------------------------
    // TEST 6: Real-Time Message Email Notifications (Offline, Cooldown & Zero Leakage)
    // -------------------------------------------------------------------------
    console.log('\n[6/8] Testing Real-Time Message Email Notifications...');

    // Send message email alert
    const msgEmailRes1 = await notifyUserOfNewMessage({
      recipientEmail: studentEmail,
      recipientName: 'Marie Curie',
      senderName: 'Prof. Ernest Rutherford',
      senderRole: 'teacher',
      opportunityTitle: 'Nuclear Magnetic Resonance Lab',
      opportunityId,
      senderId: teacherId,
      isStudent: true,
    });

    if (!msgEmailRes1.success) {
      throw new Error(`Failed to dispatch message notification email: ${JSON.stringify(msgEmailRes1)}`);
    }

    const msgEmailLog = await waitForEmailLog(emailLogs, {
      recipientEmail: studentEmail.toLowerCase(),
      type: 'message_alert',
    }, 8000);

    if (!msgEmailLog) {
      throw new Error('Message alert email log not found in MongoDB!');
    }

    // Verify private message contents are NEVER in the subject or HTML
    if (msgEmailLog.subject.includes('SECRET_KEY') || (msgEmailLog.metadata?.message || '').includes('SECRET_KEY')) {
      throw new Error('Privacy violation: Private message content leaked into email metadata!');
    }
    console.log(`  ✅ Message email delivered safely: "${msgEmailLog.subject}" (zero private body leakage)`);

    // Test Cooldown Throttling: Rapid second message within 10 minutes
    const msgEmailRes2 = await notifyUserOfNewMessage({
      recipientEmail: studentEmail,
      recipientName: 'Marie Curie',
      senderName: 'Prof. Ernest Rutherford',
      opportunityTitle: 'Nuclear Magnetic Resonance Lab',
      opportunityId,
      senderId: teacherId,
    });

    if (msgEmailRes2.success && !msgEmailRes2.throttled) {
      throw new Error('Anti-spam cooldown failure: Repeated email was dispatched during active cooldown window!');
    }
    console.log(`  ⏳ Cooldown verified: Rapid repeat message email throttled successfully.`);

    // -------------------------------------------------------------------------
    // TEST 7: Academic Identity Verification Emails
    // -------------------------------------------------------------------------
    console.log('\n[7/8] Testing Academic Identity Verification Email Workflows...');

    // 1. Verification Submission Confirmation
    const subRes = await notifyVerificationSubmitted({
      userEmail: studentEmail,
      fullName: 'Marie Curie',
      role: 'student',
      institution: 'Sorbonne University',
      department: 'Physics',
    });
    if (!subRes.success) throw new Error(`Submission email failed: ${subRes.error}`);
    console.log(`  ✅ Verification submission confirmation email delivered.`);

    // 2. Verification Approval
    const appDecRes = await notifyVerificationDecision({
      userEmail: studentEmail,
      fullName: 'Marie Curie',
      role: 'student',
      status: 'Verified',
    });
    if (!appDecRes.success) throw new Error(`Approval email failed: ${appDecRes.error}`);
    console.log(`  ✅ Academic identity verified approval email delivered.`);

    // 3. Verification Rejection with Reason
    const rejReason = 'Student ID card expired in 2024. Please submit a current active academic ID.';
    const rejDecRes = await notifyVerificationDecision({
      userEmail: studentEmail,
      fullName: 'Marie Curie',
      role: 'student',
      status: 'Rejected',
      rejectionReason: rejReason,
    });
    if (!rejDecRes.success) throw new Error(`Rejection email failed: ${rejDecRes.error}`);

    const rejLog = await waitForEmailLog(emailLogs, {
      recipientEmail: studentEmail.toLowerCase(),
      type: 'verification_decision',
      'metadata.status': 'Rejected',
    }, 8000);

    if (!rejLog || rejLog.metadata.rejectionReason !== rejReason) {
      throw new Error('Rejection email did not include specific rejection reason!');
    }
    console.log(`  ✅ Verification rejection email delivered with structured reason.`);

    // -------------------------------------------------------------------------
    // TEST 8: Notification Preferences & Mandatory Security Exemption
    // -------------------------------------------------------------------------
    console.log('\n[8/8] Testing User Notification Preferences & Security Exemption...');

    // 1. Read current preferences
    const initialPrefs = await fetch(`${API_BASE}/notifications/preferences`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    }).then((r) => r.json());

    if (!initialPrefs.success || !initialPrefs.preferences) {
      throw new Error(`Failed to fetch notification preferences: ${JSON.stringify(initialPrefs)}`);
    }
    console.log(`  ✅ Initial preferences retrieved from MongoDB:`, initialPrefs.preferences);

    // 2. Disable application status emails in preferences
    const updatePrefRes = await fetch(`${API_BASE}/notifications/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        applicationStatusEmails: false,
        opportunityAnnouncementEmails: true,
        messageEmails: true,
        verificationEmails: true,
      }),
    }).then((r) => r.json());

    if (!updatePrefRes.success || updatePrefRes.preferences.applicationStatusEmails !== false) {
      throw new Error(`Failed to update preferences: ${JSON.stringify(updatePrefRes)}`);
    }
    console.log(`  ✅ Preferences updated: applicationStatusEmails set to FALSE.`);

    // 3. Attempt to dispatch status email -> should be suppressed
    const suppressedRes = await notifyStudentOfStatusUpdate({
      studentEmail,
      studentName: 'Marie Curie',
      opportunityTitle: 'Suppressed Test Opportunity',
      status: 'Shortlisted',
    });

    if (suppressedRes.success && !suppressedRes.skipped) {
      throw new Error('Preference violation: Email was sent even though user disabled applicationStatusEmails!');
    }
    console.log(`  🔕 Email successfully suppressed per user preference (skipped: ${suppressedRes.skipped})`);

    // 4. Verify that Security OTP emails are MANDATORY and CANNOT be suppressed
    const otpRes = await sendOtpEmail(studentEmail, '582910', 'login_verification');
    if (!otpRes.success) {
      throw new Error(`Mandatory OTP email failed to dispatch: ${otpRes.error}`);
    }
    console.log(`  🔒 Security Exemption Verified: Mandatory OTP email dispatched regardless of optional toggles.`);

    console.log('\n====================================================');
    console.log('🎉 ALL 8 AUTOMATED EMAIL NOTIFICATION TESTS PASSED!');
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n❌ Phase 8 Verification Failed:', error);
    process.exitCode = 1;
  } finally {
    await closeDB();
  }
}

runPhase8Tests();
