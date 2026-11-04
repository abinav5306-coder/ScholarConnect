import express from 'express';
import {
  getTeacherProfile,
  updateTeacherProfile,
} from '../controllers/teacherController.js';
import {
  exportApplicantsExcel,
  exportApplicantsPdf,
} from '../controllers/exportController.js';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==========================================
// Phase 9: Applicant Export Endpoints (Excel & PDF)
// ==========================================
router.post('/export/excel', authenticateToken, exportApplicantsExcel);
router.post('/export/pdf', authenticateToken, exportApplicantsPdf);

// ==========================================
// Teacher Profile Endpoints
// ==========================================
router.get('/:id', optionalAuth, getTeacherProfile);
router.put('/:id', optionalAuth, updateTeacherProfile);

export default router;
