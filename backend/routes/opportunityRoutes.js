import express from 'express';
import {
  createOpportunity,
  getOpportunities,
  getOpportunityById,
  updateOpportunity,
  deleteOpportunity,
} from '../controllers/opportunityController.js';
import { optionalAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all opportunities (with optional filters & search queries)
router.get('/', optionalAuth, getOpportunities);

// GET opportunity by id
router.get('/:id', optionalAuth, getOpportunityById);

// POST create a new opportunity (Teacher or authenticated user)
router.post('/', optionalAuth, createOpportunity);

// PUT update an opportunity (only teacher owner or admin)
router.put('/:id', optionalAuth, updateOpportunity);

// DELETE an opportunity (only teacher owner)
router.delete('/:id', optionalAuth, deleteOpportunity);

export default router;

