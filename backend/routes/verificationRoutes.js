import express from 'express';
import {
  uploadVerificationDocument,
  submitStudentVerification,
  submitTeacherVerification,
  getVerificationStatus,
  getVerificationRequests,
  approveVerification,
  rejectVerification,
  getSecureDocument,
} from '../controllers/verificationController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Student submit identity documents
router.post(
  '/student/submit',
  authenticateToken,
  uploadVerificationDocument.single('studentIdDocument'),
  submitStudentVerification
);

// Teacher submit faculty documents
router.post(
  '/teacher/submit',
  authenticateToken,
  uploadVerificationDocument.single('facultyIdDocument'),
  submitTeacherVerification
);

// Get current user's verification status
router.get('/status', authenticateToken, getVerificationStatus);

// Securely view uploaded document (Owner or Admin)
router.get('/document/:filename', authenticateToken, getSecureDocument);

// Admin-Only Endpoints
router.get('/requests', authenticateToken, requireRole('admin'), getVerificationRequests);
router.put('/:userId/approve', authenticateToken, requireRole('admin'), approveVerification);
router.put('/:userId/reject', authenticateToken, requireRole('admin'), rejectVerification);

export default router;

