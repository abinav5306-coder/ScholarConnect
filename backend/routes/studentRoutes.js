import express from 'express';
import {
  getStudentProfile,
  updateStudentProfile,
} from '../controllers/studentController.js';
import {
  uploadStudentResume,
  getStudentResumeInfo,
  downloadStudentResume,
  deleteStudentResume,
} from '../controllers/resumeController.js';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';
import { uploadResumeFile } from '../middleware/resumeUpload.js';

const router = express.Router();

// ==========================================
// Phase 9: Student Resume Management Routes
// (Must precede /:id parameter route)
// ==========================================
router.post('/resume', authenticateToken, uploadResumeFile.single('resumeFile'), uploadStudentResume);
router.get('/resume', authenticateToken, getStudentResumeInfo);
router.get('/resume/download', authenticateToken, downloadStudentResume);
router.delete('/resume', authenticateToken, deleteStudentResume);

// ==========================================
// Student Profile Routes
// ==========================================
router.get('/:id', optionalAuth, getStudentProfile);
router.put('/:id', optionalAuth, updateStudentProfile);

export default router;
