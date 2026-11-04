import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { ObjectId } from 'mongodb';
import { fileURLToPath } from 'url';
import { getCollections } from '../config/db.js';
import { sendVerificationDecisionEmail } from '../services/emailService.js';
import { 
  notifyVerificationSubmitted, 
  notifyVerificationDecision 
} from '../services/notificationEmailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Secure private upload directory (not served as public static assets)
const UPLOAD_DIR = path.resolve(__dirname, '../uploads/verifications');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    cb(null, `id_doc_${uniqueSuffix}${ext}`);
  },
});

// File filter: accept images (JPEG, PNG, WEBP) and PDF documents only
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid document format. Only JPEG, PNG, WEBP, and PDF files are allowed.'), false);
  }
};

export const uploadVerificationDocument = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max file size
  },
});

/**
 * Submit Student Academic Identity Verification
 * POST /api/verifications/student/submit
 */
export async function submitStudentVerification(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Student ID card document is required (Image or PDF).' });
    }

    const {
      institution,
      department,
      registerNumber,
      academicYear,
      institutionalEmail,
    } = req.body;

    if (!institution || !department || !registerNumber || !academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Institution name, department, register number, and academic year are required.',
      });
    }

    const { users, notifications, verificationAudits } = getCollections();

    let userQuery = {};
    if (ObjectId.isValid(userId)) {
      userQuery = { _id: new ObjectId(userId) };
    } else {
      userQuery = { $or: [{ email: req.user.email }, { id: userId }] };
    }

    const existingUser = await users.findOne(userQuery);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User record not found.' });
    }

    const docMeta = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date(),
    };

    const updateFields = {
      verificationStatus: 'Pending Verification',
      institution: institution.trim(),
      department: department.trim(),
      registerNumber: registerNumber.trim(),
      academicYear: academicYear.trim(),
      institutionalEmail: (institutionalEmail || '').trim().toLowerCase(),
      verificationDocuments: [docMeta],
      verificationSubmittedAt: new Date(),
      rejectionReason: null,
      updatedAt: new Date(),
    };

    await users.updateOne(userQuery, { $set: updateFields });

    // Create notification for student
    try {
      await notifications.insertOne({
        userId: existingUser._id.toString(),
        userEmail: existingUser.email,
        title: 'Academic Verification Submitted',
        message: 'Your student academic verification credentials and ID document have been received and are pending administrator review.',
        type: 'info',
        isRead: false,
        createdAt: new Date(),
      });
    } catch {
      // Non-blocking
    }

    // Record audit log
    await verificationAudits.insertOne({
      userId: existingUser._id.toString(),
      userEmail: existingUser.email,
      role: 'student',
      action: 'submission',
      previousStatus: existingUser.verificationStatus || 'Not Submitted',
      newStatus: 'Pending Verification',
      timestamp: new Date(),
    });

    // Send confirmation email to student (Asynchronous / Non-blocking)
    notifyVerificationSubmitted({
      userEmail: existingUser.email,
      fullName: existingUser.fullName || existingUser.name || 'Scholar',
      role: 'student',
      institution: institution.trim(),
      department: department.trim(),
    }).catch((err) => console.warn('[Verification Submitted Email Notice]:', err.message));

    const updatedUser = await users.findOne(userQuery, { projection: { passwordHash: 0 } });

    return res.status(200).json({
      success: true,
      message: 'Student academic verification submitted successfully. An administrator will review your documents.',
      user: {
        ...updatedUser,
        id: updatedUser._id.toString(),
      },
    });
  } catch (err) {
    console.error('submitStudentVerification error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to submit verification.',
    });
  }
}

/**
 * Submit Teacher / Researcher Identity Verification
 * POST /api/verifications/teacher/submit
 */
export async function submitTeacherVerification(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Faculty ID card or institutional proof document is required.' });
    }

    const {
      fullName,
      institutionalEmail,
      institution,
      department,
      designation,
      facultyId,
      facultyIdNumber,
    } = req.body;

    const facultyIdVal = (facultyIdNumber || facultyId || '').trim();

    if (!institution || !department || !facultyIdVal || !designation) {
      return res.status(400).json({
        success: false,
        message: 'Full name, institution, department, designation, and Faculty ID number are required.',
      });
    }

    const { users, notifications, verificationAudits } = getCollections();

    let userQuery = {};
    if (ObjectId.isValid(userId)) {
      userQuery = { _id: new ObjectId(userId) };
    } else {
      userQuery = { $or: [{ email: req.user.email }, { id: userId }] };
    }

    const existingUser = await users.findOne(userQuery);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User record not found.' });
    }

    const docMeta = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date(),
    };

    const updateFields = {
      name: (fullName || existingUser.name || '').trim(),
      fullName: (fullName || existingUser.name || '').trim(),
      verificationStatus: 'Pending Verification',
      institution: institution.trim(),
      department: department.trim(),
      designation: designation.trim(),
      facultyId: facultyIdVal,
      facultyIdNumber: facultyIdVal,
      institutionalEmail: (institutionalEmail || '').trim().toLowerCase(),
      verificationDocuments: [docMeta],
      verificationSubmittedAt: new Date(),
      rejectionReason: null,
      updatedAt: new Date(),
    };

    await users.updateOne(userQuery, { $set: updateFields });

    // Create notification for teacher
    try {
      await notifications.insertOne({
        userId: existingUser._id.toString(),
        userEmail: existingUser.email,
        title: 'Faculty Verification Submitted',
        message: 'Your faculty credentials and institutional proof have been submitted for administrator review.',
        type: 'info',
        isRead: false,
        createdAt: new Date(),
      });
    } catch {
      // Non-blocking
    }

    // Record audit log
    await verificationAudits.insertOne({
      userId: existingUser._id.toString(),
      userEmail: existingUser.email,
      role: 'teacher',
      action: 'submission',
      previousStatus: existingUser.verificationStatus || 'Not Submitted',
      newStatus: 'Pending Verification',
      timestamp: new Date(),
    });

    // Send confirmation email to faculty mentor (Asynchronous / Non-blocking)
    notifyVerificationSubmitted({
      userEmail: existingUser.email,
      fullName: (fullName || existingUser.name || 'Faculty Member').trim(),
      role: 'teacher',
      institution: institution.trim(),
      department: department.trim(),
    }).catch((err) => console.warn('[Teacher Verification Submitted Email Notice]:', err.message));

    const updatedUser = await users.findOne(userQuery, { projection: { passwordHash: 0 } });

    return res.status(200).json({
      success: true,
      message: 'Faculty verification submitted successfully. An administrator will verify your credentials.',
      user: {
        ...updatedUser,
        id: updatedUser._id.toString(),
      },
    });
  } catch (err) {
    console.error('submitTeacherVerification error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to submit faculty verification.',
    });
  }
}

/**
 * Get Current User's Verification Status & Documents
 * GET /api/verifications/status
 */
export async function getVerificationStatus(req, res) {
  try {
    const userId = req.user?.userId;
    const { users } = getCollections();

    let query = {};
    if (ObjectId.isValid(userId)) {
      query = { _id: new ObjectId(userId) };
    } else {
      query = { $or: [{ email: req.user.email }, { id: userId }] };
    }

    const user = await users.findOne(query, { projection: { passwordHash: 0 } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      verificationStatus: user.verificationStatus || 'Not Submitted',
      verificationSubmittedAt: user.verificationSubmittedAt,
      verificationReviewedAt: user.verificationReviewedAt,
      rejectionReason: user.rejectionReason,
      documents: user.verificationDocuments || [],
      details: {
        institution: user.institution,
        department: user.department,
        registerNumber: user.registerNumber,
        facultyId: user.facultyId,
        designation: user.designation,
        academicYear: user.academicYear,
        institutionalEmail: user.institutionalEmail,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Admin: Get all verification requests with search and filters
 * GET /api/verifications/requests
 */
export async function getVerificationRequests(req, res) {
  try {
    const { role, status = 'all', search } = req.query;
    const { users } = getCollections();

    const query = {};

    // Role filter
    if (role && role !== 'all') {
      query.role = role;
    } else {
      query.role = { $in: ['student', 'teacher'] };
    }

    // Status filter
    if (status && status !== 'all') {
      query.verificationStatus = status;
    } else {
      // Show users that have submitted or are in verification cycle by default
      query.verificationStatus = { $in: ['Pending Verification', 'Verified', 'Rejected'] };
    }

    // Keyword search
    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { institution: { $regex: q, $options: 'i' } },
        { department: { $regex: q, $options: 'i' } },
        { registerNumber: { $regex: q, $options: 'i' } },
        { facultyId: { $regex: q, $options: 'i' } },
      ];
    }

    const list = await users
      .find(query, { projection: { passwordHash: 0 } })
      .sort({ verificationSubmittedAt: -1, createdAt: -1 })
      .toArray();

    const formatted = list.map((u) => ({
      ...u,
      id: u._id.toString(),
      _id: u._id.toString(),
    }));

    // Calculate status counts
    const pendingCount = await users.countDocuments({ verificationStatus: 'Pending Verification' });
    const verifiedCount = await users.countDocuments({ verificationStatus: 'Verified' });
    const rejectedCount = await users.countDocuments({ verificationStatus: 'Rejected' });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      counts: {
        pending: pendingCount,
        verified: verifiedCount,
        rejected: rejectedCount,
      },
      requests: formatted,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Admin: Approve Academic Verification
 * PUT /api/verifications/:userId/approve
 */
export async function approveVerification(req, res) {
  try {
    const { userId } = req.params;
    const { users, notifications, verificationAudits } = getCollections();

    let query = {};
    if (ObjectId.isValid(userId)) {
      query = { _id: new ObjectId(userId) };
    } else {
      query = { id: userId };
    }

    const user = await users.findOne(query);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await users.updateOne(query, {
      $set: {
        verificationStatus: 'Verified',
        verificationReviewedAt: new Date(),
        verificationReviewedBy: req.user?.name || 'Administrator',
        rejectionReason: null,
        updatedAt: new Date(),
      },
    });

    // Send automatic notification
    try {
      await notifications.insertOne({
        userId: user._id.toString(),
        userEmail: user.email,
        title: 'Academic Identity Verified 🎉',
        message: `Congratulations! Your ${user.role === 'teacher' ? 'faculty credentials' : 'student academic identity'} have been verified. You have received the Verified Scholar badge.`,
        type: 'success',
        isRead: false,
        createdAt: new Date(),
      });
    } catch {
      // Non-blocking
    }

    // Send email decision notification
    notifyVerificationDecision({
      userEmail: user.email,
      fullName: user.fullName || user.name || 'Scholar',
      role: user.role,
      status: 'Verified',
    }).catch(() => {});

    // Record audit log
    await verificationAudits.insertOne({
      userId: user._id.toString(),
      userEmail: user.email,
      role: user.role,
      action: 'approval',
      previousStatus: user.verificationStatus,
      newStatus: 'Verified',
      reviewedBy: req.user?.email || 'admin',
      timestamp: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `Successfully approved verification for ${user.name}.`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Admin: Reject Academic Verification
 * PUT /api/verifications/:userId/reject
 * Body: { rejectionReason: string }
 */
export async function rejectVerification(req, res) {
  try {
    const { userId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({ success: false, message: 'A rejection reason is required.' });
    }

    const { users, notifications, verificationAudits } = getCollections();

    let query = {};
    if (ObjectId.isValid(userId)) {
      query = { _id: new ObjectId(userId) };
    } else {
      query = { id: userId };
    }

    const user = await users.findOne(query);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const reason = rejectionReason.trim();

    await users.updateOne(query, {
      $set: {
        verificationStatus: 'Rejected',
        rejectionReason: reason,
        verificationReviewedAt: new Date(),
        verificationReviewedBy: req.user?.name || 'Administrator',
        updatedAt: new Date(),
      },
    });

    // Send notification
    try {
      await notifications.insertOne({
        userId: user._id.toString(),
        userEmail: user.email,
        title: 'Academic Verification Update',
        message: `Your academic verification could not be approved. Reason: "${reason}". Please review your documents and resubmit.`,
        type: 'alert',
        isRead: false,
        createdAt: new Date(),
      });
    } catch {
      // Non-blocking
    }

    // Send email decision notification
    notifyVerificationDecision({
      userEmail: user.email,
      fullName: user.fullName || user.name || 'Scholar',
      role: user.role,
      status: 'Rejected',
      rejectionReason: reason,
    }).catch(() => {});

    // Record audit log
    await verificationAudits.insertOne({
      userId: user._id.toString(),
      userEmail: user.email,
      role: user.role,
      action: 'rejection',
      previousStatus: user.verificationStatus,
      newStatus: 'Rejected',
      rejectionReason: reason,
      reviewedBy: req.user?.email || 'admin',
      timestamp: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `Verification for ${user.name} marked as Rejected. User notified for resubmission.`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Securely stream uploaded verification document (Admin or Document Owner only)
 * GET /api/verifications/document/:filename
 */
export async function getSecureDocument(req, res) {
  try {
    const { filename } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required to access documents.' });
    }

    // Prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(UPLOAD_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Document file not found.' });
    }

    // Security check: Only Admins or the User who uploaded this document may view it
    if (userRole !== 'admin') {
      const { users } = getCollections();
      let query = { 'verificationDocuments.filename': safeFilename };
      if (ObjectId.isValid(userId)) {
        query._id = new ObjectId(userId);
      }

      const isOwner = await users.findOne(query);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to view this academic document.',
        });
      }
    }

    // Determine MIME type
    const ext = path.extname(safeFilename).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
