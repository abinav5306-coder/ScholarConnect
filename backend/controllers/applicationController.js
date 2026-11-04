import { ObjectId } from 'mongodb';
import { getCollections } from '../config/db.js';
import {
  notifyTeacherOfNewApplication,
  notifyStudentOfApplicationSubmitted,
  notifyStudentOfStatusUpdate,
} from '../services/notificationEmailService.js';

// Status Messages specified by ScholarConnect Application Lifecycle Requirements
export const STATUS_MESSAGES = {
  'Selected': 'Congratulations! You have been selected for this opportunity.',
  'Waiting List': 'Your application is on the waiting list. We will notify you when an opportunity becomes available.',
  'Not Selected': "Thank you for your interest! Although you weren't selected this time, keep exploring new opportunities.",
  'Shortlisted': 'Congratulations! Your application has been shortlisted.',
  'Under Review': 'Your application is currently under review by the faculty mentor.',
  'Submitted': 'Your application has been successfully submitted and recorded.',
};

export const VALID_APPLICATION_STATUSES = [
  'Submitted',
  'Under Review',
  'Shortlisted',
  'Selected',
  'Waiting List',
  'Not Selected',
];

/**
 * Submit a Student Application for an Opportunity
 * POST /api/applications
 */
export async function submitApplication(req, res) {
  try {
    const {
      opportunityId,
      studentId,
      fullName,
      studentName,
      studentEmail,
      email,
      institution,
      studentInstitution,
      department,
      studentDepartment,
      academicYear,
      studentAcademicYear,
      skills,
      studentSkills,
      statementOfInterest,
      whyInterested,
      linkedin,
      github,
      portfolioUrl,
      experience,
      documentNote,
      useProfileResume,
      attachDefaultResume,
    } = req.body;

    if (!opportunityId) {
      return res.status(400).json({ success: false, message: 'opportunityId is required.' });
    }

    const applicantName = (fullName || studentName || req.user?.name || '').trim();
    const applicantEmail = (studentEmail || email || req.user?.email || '').trim().toLowerCase();
    const applicantInstitution = (institution || studentInstitution || '').trim();
    const applicantDept = (department || studentDepartment || '').trim();
    const applicantYear = (academicYear || studentAcademicYear || '').trim();
    const applicantStatement = (statementOfInterest || whyInterested || '').trim();
    const resolvedStudentId = studentId || req.user?.userId || applicantEmail || 'student-demo';

    if (!applicantName || !applicantInstitution || !applicantDept || !applicantYear) {
      return res.status(400).json({
        success: false,
        message: 'Applicant name, institution, department, and academic year are required.',
      });
    }

    if (!applicantStatement) {
      return res.status(400).json({
        success: false,
        message: 'Statement of interest (why you are applying) is required.',
      });
    }

    const { applications, opportunities, notifications, users } = getCollections();

    // 1. Fetch Opportunity info
    let oppQuery = { id: opportunityId };
    if (ObjectId.isValid(opportunityId)) {
      oppQuery = { $or: [{ _id: new ObjectId(opportunityId) }, { id: opportunityId }] };
    }
    const opportunity = await opportunities.findOne(oppQuery);

    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'The selected opportunity does not exist.' });
    }

    // Closed Opportunity Check
    if (opportunity.status === 'Closed') {
      return res.status(400).json({
        success: false,
        message: 'Applications for this opportunity are currently Closed and no longer accepting new submissions.',
      });
    }

    // 2. Prevent Duplicate Applications
    const existingApp = await applications.findOne({
      opportunityId: opportunity._id ? opportunity._id.toString() : opportunityId,
      $or: [
        { studentId: resolvedStudentId },
        { studentEmail: applicantEmail },
        { email: applicantEmail },
      ],
    });

    if (existingApp) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted an application for this opportunity. Duplicate applications are not allowed.',
      });
    }

    // Parse skills (supports arrays or JSON / comma-separated strings from multipart FormData)
    let parsedSkills = [];
    const rawSkills = skills || studentSkills;
    if (Array.isArray(rawSkills)) {
      parsedSkills = rawSkills;
    } else if (typeof rawSkills === 'string') {
      try {
        const jsonParsed = JSON.parse(rawSkills);
        parsedSkills = Array.isArray(jsonParsed) ? jsonParsed : rawSkills.split(',').map((s) => s.trim()).filter(Boolean);
      } catch {
        parsedSkills = rawSkills.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    // Phase 9: Resume Attachment Handling
    let attachedResume = null;
    if (req.file) {
      // 1. Direct PDF file uploaded specifically for this application
      attachedResume = {
        originalName: req.file.originalname,
        fileName: req.file.filename,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedAt: new Date(),
        isCustom: true,
      };
    } else if (useProfileResume === 'true' || useProfileResume === true || attachDefaultResume) {
      // 2. Snapshots default profile resume from MongoDB users collection
      let studentQuery = {};
      if (ObjectId.isValid(resolvedStudentId)) {
        studentQuery = { _id: new ObjectId(resolvedStudentId) };
      } else {
        studentQuery = { email: applicantEmail };
      }
      const studentUser = await users.findOne(studentQuery);
      if (studentUser && studentUser.resume) {
        attachedResume = {
          originalName: studentUser.resume.originalName,
          fileName: studentUser.resume.fileName,
          fileSize: studentUser.resume.fileSize,
          mimeType: studentUser.resume.mimeType || 'application/pdf',
          uploadedAt: studentUser.resume.uploadedAt || new Date(),
          isCustom: false,
        };
      }
    }

    // 3. Create Application Record with Resume and Extended Portfolio references
    const newApplication = {
      opportunityId: opportunity._id ? opportunity._id.toString() : opportunityId,
      opportunityTitle: opportunity.title,
      category: opportunity.category,
      teacherId: opportunity.teacherId || 'teacher-default',
      teacherName: opportunity.teacherName || 'Faculty Mentor',
      teacherEmail: opportunity.teacherEmail || '',
      institution: opportunity.institution,
      studentId: resolvedStudentId,
      studentName: applicantName,
      fullName: applicantName,
      studentEmail: applicantEmail,
      email: applicantEmail,
      studentInstitution: applicantInstitution,
      studentDepartment: applicantDept,
      department: applicantDept,
      studentAcademicYear: applicantYear,
      academicYear: applicantYear,
      studentSkills: parsedSkills,
      skills: parsedSkills,
      statementOfInterest: applicantStatement,
      whyInterested: applicantStatement,
      linkedin: linkedin || '',
      github: github || '',
      portfolioUrl: portfolioUrl || '',
      experience: experience || '',
      documentNote: documentNote || (attachedResume ? `Attached: ${attachedResume.originalName}` : ''),
      resume: attachedResume,
      status: 'Submitted',
      statusMessage: STATUS_MESSAGES['Submitted'],
      appliedAt: new Date().toISOString().split('T')[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertResult = await applications.insertOne(newApplication);
    const appId = insertResult.insertedId.toString();
    newApplication._id = appId;
    newApplication.id = appId;

    // 4. Increment applicants count on Opportunity
    await opportunities.updateOne(oppQuery, {
      $inc: { applicantsCount: 1 },
      $set: { updatedAt: new Date() },
    });

    // 5. Notify the faculty mentor
    try {
      if (opportunity.teacherId) {
        await notifications.insertOne({
          userId: opportunity.teacherId,
          title: 'New Student Application Received',
          message: `${applicantName} applied for "${opportunity.title}".`,
          opportunityId: opportunity._id ? opportunity._id.toString() : opportunityId,
          opportunityTitle: opportunity.title,
          type: 'application',
          isRead: false,
          createdAt: new Date(),
        });
      }
    } catch {
      // Non-blocking notification
    }

    // 6. Automated Email Notifications (Asynchronous / Non-blocking)
    try {
      const { users } = getCollections();
      let resolvedTeacherEmail = opportunity.teacherEmail;
      if (!resolvedTeacherEmail && opportunity.teacherId) {
        let tQ = {};
        if (ObjectId.isValid(opportunity.teacherId)) {
          tQ = { _id: new ObjectId(opportunity.teacherId) };
        } else {
          tQ = { $or: [{ id: opportunity.teacherId }, { email: opportunity.teacherId }] };
        }
        const teacherDoc = await users.findOne(tQ);
        if (teacherDoc) resolvedTeacherEmail = teacherDoc.email;
      }

      // 6a. Send Email Notification to Faculty Mentor
      if (resolvedTeacherEmail) {
        notifyTeacherOfNewApplication({
          teacherEmail: resolvedTeacherEmail,
          teacherName: opportunity.teacherName,
          studentName: applicantName,
          studentInstitution: applicantInstitution,
          studentDepartment: applicantDept,
          studentAcademicYear: applicantYear,
          opportunityTitle: opportunity.title,
          applicationDate: new Date().toLocaleDateString(),
          statementSnippet: applicantStatement,
        }).catch((err) => console.warn('[Application Email Notice]:', err.message));
      }

      // 6b. Send Submission Confirmation Email to Student
      notifyStudentOfApplicationSubmitted({
        studentEmail: applicantEmail,
        studentName: applicantName,
        opportunityTitle: opportunity.title,
        teacherName: opportunity.teacherName,
        institution: opportunity.institution,
        applicationDate: new Date().toLocaleDateString(),
      }).catch((err) => console.warn('[Application Student Confirmation Notice]:', err.message));
    } catch (emailErr) {
      console.warn('[Application Email Dispatch Warning]:', emailErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Application Submitted Successfully! Your application has been recorded in MongoDB Atlas.',
      application: newApplication,
    });
  } catch (err) {
    console.error('Error submitting application:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit application.',
      error: err.message,
    });
  }
}

/**
 * Get Applications for a specific Student
 * GET /api/applications/student/:studentId
 */
export async function getStudentApplications(req, res) {
  try {
    const { studentId } = req.params;
    const { email } = req.query;
    const { applications, opportunities } = getCollections();

    const query = {
      $or: [
        { studentId },
        ...(email ? [{ studentEmail: email.toLowerCase() }, { email: email.toLowerCase() }] : []),
        ...(req.user?.email ? [{ studentEmail: req.user.email.toLowerCase() }, { email: req.user.email.toLowerCase() }] : []),
        ...(req.user?.userId ? [{ studentId: req.user.userId }] : []),
      ],
    };

    const list = await applications
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Cross-check opportunity current status (e.g. if closed by teacher)
    const oppIds = list.map((a) => a.opportunityId).filter(Boolean);
    const oppMap = {};
    if (oppIds.length > 0) {
      const oppQuery = {
        $or: [
          { _id: { $in: oppIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id)) } },
          { id: { $in: oppIds } },
        ],
      };
      const foundOpps = await opportunities.find(oppQuery).toArray();
      foundOpps.forEach((o) => {
        oppMap[o._id.toString()] = o;
        if (o.id) oppMap[o.id] = o;
      });
    }

    const formatted = list.map((a) => {
      const linkedOpp = oppMap[a.opportunityId];
      const oppStatus = linkedOpp?.status || 'Accepting Applications';
      return {
        ...a,
        id: a._id.toString(),
        _id: a._id.toString(),
        opportunityStatus: oppStatus,
        statusMessage: STATUS_MESSAGES[a.status] || '',
      };
    });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      applications: formatted,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Get Applications for a specific Teacher's opportunities
 * GET /api/applications/teacher/:teacherId
 */
export async function getTeacherApplications(req, res) {
  try {
    const { teacherId } = req.params;
    const { applications, opportunities } = getCollections();

    // Find all opportunities by this teacher
    const teacherOpps = await opportunities
      .find({
        $or: [
          { teacherId },
          ...(req.user?.userId ? [{ teacherId: req.user.userId }] : []),
          ...(req.user?.email ? [{ teacherEmail: req.user.email }] : []),
        ],
      })
      .toArray();

    const oppIds = teacherOpps.map((o) => o._id.toString());
    const oppStringIds = teacherOpps.map((o) => o.id).filter(Boolean);

    const list = await applications
      .find({
        $or: [
          { teacherId },
          { opportunityId: { $in: [...oppIds, ...oppStringIds] } },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray();

    const formatted = list.map((a) => ({
      ...a,
      id: a._id.toString(),
      _id: a._id.toString(),
      statusMessage: STATUS_MESSAGES[a.status] || '',
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      applications: formatted,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Get all applications with optional query filters
 * GET /api/applications
 */
export async function getAllApplications(req, res) {
  try {
    const { opportunityId, status, studentEmail } = req.query;
    const filter = {};

    if (opportunityId) filter.opportunityId = opportunityId;
    if (status && status !== 'All') filter.status = status;
    if (studentEmail) {
      filter.$or = [
        { studentEmail: studentEmail.toLowerCase() },
        { email: studentEmail.toLowerCase() },
      ];
    }

    const { applications } = getCollections();
    const list = await applications.find(filter).sort({ createdAt: -1 }).toArray();

    const formatted = list.map((a) => ({
      ...a,
      id: a._id.toString(),
      _id: a._id.toString(),
      statusMessage: STATUS_MESSAGES[a.status] || '',
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      applications: formatted,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Update a Single Application Status
 * PUT /api/applications/:id/status
 */
export async function updateApplicationStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status || !VALID_APPLICATION_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status "${status}". Must be one of: [${VALID_APPLICATION_STATUSES.join(', ')}].`,
      });
    }

    const { applications, notifications } = getCollections();

    let query = { id };
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { id }] };
    }

    const application = await applications.findOne(query);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found in database.' });
    }

    const statusMessage = STATUS_MESSAGES[status] || `Your application status has been updated to ${status}.`;

    await applications.updateOne(query, {
      $set: {
        status,
        statusMessage,
        ...(notes ? { reviewNotes: notes } : {}),
        updatedAt: new Date(),
      },
    });

    const updatedApp = await applications.findOne(query);

    // Create automatic notification in MongoDB for the student
    try {
      const studentTargetId = application.studentId || application.studentEmail || application.email;
      if (studentTargetId) {
        await notifications.insertOne({
          userId: studentTargetId,
          userEmail: (application.studentEmail || application.email || '').toLowerCase(),
          title: `Application Status: ${status}`,
          message: statusMessage,
          opportunityId: application.opportunityId,
          opportunityTitle: application.opportunityTitle,
          status: status,
          type: status === 'Selected' || status === 'Shortlisted' ? 'success' : 'info',
          isRead: false,
          createdAt: new Date(),
        });
      }
    } catch (notifErr) {
      console.warn('Notification insert notice:', notifErr.message);
    }

    // Automated Email Notification to Student (Asynchronous / Non-blocking)
    try {
      const targetStudentEmail = application.studentEmail || application.email;
      if (targetStudentEmail) {
        notifyStudentOfStatusUpdate({
          studentEmail: targetStudentEmail,
          studentName: application.studentName || application.fullName || 'Scholar',
          opportunityTitle: application.opportunityTitle || 'Research Opportunity',
          teacherName: application.teacherName || 'Faculty Mentor',
          status,
        }).catch((err) => console.warn('[Status Email Notice]:', err.message));
      }
    } catch (statusEmailErr) {
      console.warn('[Status Email Dispatch Notice]:', statusEmailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Application status updated to "${status}" and saved in MongoDB Atlas.`,
      application: {
        ...updatedApp,
        id: updatedApp._id.toString(),
        _id: updatedApp._id.toString(),
        statusMessage,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Bulk Update Application Status
 * PUT /api/applications/bulk/status
 * Body: { applicationIds: string[], status: string, notes?: string }
 */
export async function updateBulkApplicationStatus(req, res) {
  try {
    const { applicationIds, status, notes } = req.body;

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'applicationIds must be a non-empty array of application IDs.',
      });
    }

    if (!status || !VALID_APPLICATION_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status "${status}". Must be one of: [${VALID_APPLICATION_STATUSES.join(', ')}].`,
      });
    }

    const { applications, notifications } = getCollections();

    // Build query for all specified IDs (handling both ObjectId and string IDs)
    const validObjectIds = applicationIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
    const query = {
      $or: [
        { _id: { $in: validObjectIds } },
        { id: { $in: applicationIds } },
      ],
    };

    const matchedApplications = await applications.find(query).toArray();
    if (matchedApplications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No matching applications found to update.',
      });
    }

    const statusMessage = STATUS_MESSAGES[status] || `Your application status has been updated to ${status}.`;

    // Bulk update in MongoDB
    await applications.updateMany(query, {
      $set: {
        status,
        statusMessage,
        ...(notes ? { reviewNotes: notes } : {}),
        updatedAt: new Date(),
      },
    });

    // Create notifications for each student
    const notifBatch = matchedApplications.map((app) => ({
      userId: app.studentId || app.studentEmail || app.email,
      userEmail: (app.studentEmail || app.email || '').toLowerCase(),
      title: `Application Status: ${status}`,
      message: statusMessage,
      opportunityId: app.opportunityId,
      opportunityTitle: app.opportunityTitle,
      status: status,
      type: status === 'Selected' || status === 'Shortlisted' ? 'success' : 'info',
      isRead: false,
      createdAt: new Date(),
    }));

    if (notifBatch.length > 0) {
      try {
        await notifications.insertMany(notifBatch);
      } catch (notifErr) {
        console.warn('Bulk notification insert notice:', notifErr.message);
      }
    }

    // Automated Email Notification to Each Student in Bulk Update
    try {
      matchedApplications.forEach((app) => {
        const targetStudentEmail = app.studentEmail || app.email;
        if (targetStudentEmail) {
          notifyStudentOfStatusUpdate({
            studentEmail: targetStudentEmail,
            studentName: app.studentName || app.fullName || 'Scholar',
            opportunityTitle: app.opportunityTitle || 'Research Opportunity',
            teacherName: app.teacherName || 'Faculty Mentor',
            status,
          }).catch((err) => console.warn('[Bulk Status Email Notice]:', err.message));
        }
      });
    } catch (bulkEmailErr) {
      console.warn('[Bulk Email Dispatch Notice]:', bulkEmailErr.message);
    }

    const updatedList = await applications.find(query).toArray();
    const formatted = updatedList.map((a) => ({
      ...a,
      id: a._id.toString(),
      _id: a._id.toString(),
      statusMessage,
    }));

    return res.status(200).json({
      success: true,
      message: `Successfully updated ${updatedList.length} applicant(s) to "${status}".`,
      count: updatedList.length,
      applications: formatted,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
