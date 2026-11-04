import path from 'path';
import fs from 'fs';
import { ObjectId } from 'mongodb';
import { getCollections } from '../config/db.js';
import { RESUME_UPLOAD_DIR } from '../middleware/resumeUpload.js';

/**
 * Upload or Replace Student Default Resume
 * POST /api/students/resume
 */
export async function uploadStudentResume(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF resume file provided.' });
    }

    const { users } = getCollections();
    const userId = user.userId;
    const userEmail = (user.email || '').toLowerCase().trim();

    // Find current student record
    let query = {};
    if (ObjectId.isValid(userId)) {
      query = { _id: new ObjectId(userId) };
    } else {
      query = { email: userEmail };
    }

    const student = await users.findOne(query);
    if (!student) {
      // Remove uploaded file if user not found
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    // Clean up previous resume file from disk if it exists
    if (student.resume && student.resume.fileName) {
      const oldPath = path.join(RESUME_UPLOAD_DIR, student.resume.fileName);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (unlinkErr) {
          console.warn('[Resume Cleanup] Could not delete old resume file:', unlinkErr.message);
        }
      }
    }

    const resumeMetadata = {
      originalName: req.file.originalname,
      fileName: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date(),
    };

    await users.updateOne(query, {
      $set: {
        resume: resumeMetadata,
        updatedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Resume uploaded and securely attached to your profile.',
      resume: resumeMetadata,
    });
  } catch (err) {
    // If error, remove newly uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    console.error('uploadStudentResume error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to upload resume.' });
  }
}

/**
 * Get Current Student's Resume Metadata
 * GET /api/students/resume
 */
export async function getStudentResumeInfo(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { users } = getCollections();
    const query = ObjectId.isValid(user.userId)
      ? { _id: new ObjectId(user.userId) }
      : { email: user.email.toLowerCase().trim() };

    const student = await users.findOne(query, { projection: { resume: 1, name: 1, email: 1 } });
    if (!student || !student.resume) {
      return res.status(200).json({
        success: true,
        hasResume: false,
        resume: null,
      });
    }

    return res.status(200).json({
      success: true,
      hasResume: true,
      resume: student.resume,
    });
  } catch (err) {
    console.error('getStudentResumeInfo error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve resume info.' });
  }
}

/**
 * Download Student's Own Resume
 * GET /api/students/resume/download
 */
export async function downloadStudentResume(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { users } = getCollections();
    const query = ObjectId.isValid(user.userId)
      ? { _id: new ObjectId(user.userId) }
      : { email: user.email.toLowerCase().trim() };

    const student = await users.findOne(query);
    if (!student || !student.resume || !student.resume.fileName) {
      return res.status(404).json({ success: false, message: 'No resume found for this account.' });
    }

    const filePath = path.join(RESUME_UPLOAD_DIR, student.resume.fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Resume file not found on disk.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(student.resume.originalName || 'Resume.pdf')}"`
    );

    return res.download(filePath, student.resume.originalName || 'Resume.pdf');
  } catch (err) {
    console.error('downloadStudentResume error:', err);
    return res.status(500).json({ success: false, message: 'Failed to download resume.' });
  }
}

/**
 * Delete Student Default Resume
 * DELETE /api/students/resume
 */
export async function deleteStudentResume(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { users } = getCollections();
    const query = ObjectId.isValid(user.userId)
      ? { _id: new ObjectId(user.userId) }
      : { email: user.email.toLowerCase().trim() };

    const student = await users.findOne(query);
    if (!student || !student.resume) {
      return res.status(404).json({ success: false, message: 'No resume to delete.' });
    }

    // Unlink file if it exists
    if (student.resume.fileName) {
      const filePath = path.join(RESUME_UPLOAD_DIR, student.resume.fileName);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch {}
      }
    }

    await users.updateOne(query, {
      $unset: { resume: '' },
      $set: { updatedAt: new Date() },
    });

    return res.status(200).json({
      success: true,
      message: 'Resume removed successfully.',
    });
  } catch (err) {
    console.error('deleteStudentResume error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete resume.' });
  }
}

/**
 * Download Resume Attached to a Specific Application
 * GET /api/applications/:id/resume
 * 
 * Strict Security: Only the applicant student, the authorized teacher for the opportunity, or admin may download.
 */
export async function downloadApplicationResume(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { applications, opportunities } = getCollections();

    let query = {};
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { id: id }] };
    } else {
      query = { id: id };
    }

    const app = await applications.findOne(query);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (!app.resume || !app.resume.fileName) {
      return res.status(404).json({ success: false, message: 'No resume was attached to this application.' });
    }

    // Authorization verification:
    // 1. Is user the student applicant?
    const isApplicant =
      String(app.studentId) === String(user.userId) ||
      (app.studentEmail && app.studentEmail.toLowerCase() === user.email.toLowerCase()) ||
      (app.email && app.email.toLowerCase() === user.email.toLowerCase());

    // 2. Is user the faculty mentor / teacher who owns the opportunity?
    let isAuthorizedTeacher =
      String(app.teacherId) === String(user.userId) ||
      (app.teacherEmail && app.teacherEmail.toLowerCase() === user.email.toLowerCase());

    if (!isAuthorizedTeacher && app.opportunityId) {
      let oppQuery = {};
      if (ObjectId.isValid(app.opportunityId)) {
        oppQuery = { $or: [{ _id: new ObjectId(app.opportunityId) }, { id: app.opportunityId }] };
      } else {
        oppQuery = { id: app.opportunityId };
      }
      const opp = await opportunities.findOne(oppQuery);
      if (opp) {
        if (
          String(opp.teacherId) === String(user.userId) ||
          (opp.teacherEmail && opp.teacherEmail.toLowerCase() === user.email.toLowerCase())
        ) {
          isAuthorizedTeacher = true;
        }
      }
    }

    const isAdmin = user.role === 'admin';

    if (!isApplicant && !isAuthorizedTeacher && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to access this applicant resume.',
      });
    }

    const filePath = path.join(RESUME_UPLOAD_DIR, app.resume.fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Resume file is not present on the server storage.',
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(app.resume.originalName || 'Applicant_Resume.pdf')}"`
    );

    return res.download(filePath, app.resume.originalName || 'Applicant_Resume.pdf');
  } catch (err) {
    console.error('downloadApplicationResume error:', err);
    return res.status(500).json({ success: false, message: 'Failed to access applicant resume.' });
  }
}

