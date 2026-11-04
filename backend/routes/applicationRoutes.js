import express from 'express';
import {
  submitApplication,
  getStudentApplications,
  getTeacherApplications,
  getAllApplications,
  updateApplicationStatus,
  updateBulkApplicationStatus,
} from '../controllers/applicationController.js';
import { downloadApplicationResume } from '../controllers/resumeController.js';
import { optionalAuth, authenticateToken } from '../middleware/authMiddleware.js';
import { uploadResumeFile } from '../middleware/resumeUpload.js';

const router = express.Router();

// POST submit a student application (supports multipart with custom resumeFile or JSON)
router.post('/', optionalAuth, uploadResumeFile.single('resumeFile'), submitApplication);

// PUT bulk update application status (e.g. multi-student select & update)
router.put('/bulk/status', optionalAuth, updateBulkApplicationStatus);

// GET download attached resume for an application (Teacher or Student authorized)
router.get('/:id/resume', authenticateToken, downloadApplicationResume);

// GET applications submitted by a specific student
router.get('/student/:studentId', optionalAuth, getStudentApplications);

// GET applications for opportunities posted by a specific teacher
router.get('/teacher/:teacherId', optionalAuth, getTeacherApplications);

// GET all applications (with optional status/opportunity filter)
router.get('/', optionalAuth, getAllApplications);

// PUT update a single application's status
router.put('/:id/status', optionalAuth, updateApplicationStatus);

export default router;
