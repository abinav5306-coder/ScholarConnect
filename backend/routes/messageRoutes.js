import express from 'express';
import { 
  sendMessage, 
  getUserMessages, 
  getConversations, 
  getConversationHistory, 
  markAsRead, 
  getUnreadCount 
} from '../controllers/messageController.js';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/messages/conversations - List user's active conversations
router.get('/conversations', authenticateToken, getConversations);

// GET /api/messages/unread/count - Total unread messages count
router.get('/unread/count', authenticateToken, getUnreadCount);

// GET /api/messages/history/:opportunityId/:partnerId - Chronological message thread
router.get('/history/:opportunityId/:partnerId', authenticateToken, getConversationHistory);

// PUT /api/messages/read/:opportunityId/:partnerId - Mark thread as read
router.put('/read/:opportunityId/:partnerId', authenticateToken, markAsRead);

// POST /api/messages - Send message (REST fallback)
router.post('/', authenticateToken, sendMessage);

// GET /api/messages/:userId - Legacy compatibility
router.get('/:userId', optionalAuth, getUserMessages);

export default router;