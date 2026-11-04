import express from 'express';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../controllers/notificationController.js';
import { authenticate, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Notification Preferences
router.get('/preferences', authenticate, getNotificationPreferences);
router.put('/preferences', authenticate, updateNotificationPreferences);

// GET /api/notifications/:userId
router.get('/:userId', optionalAuth, getUserNotifications);

// PUT /api/notifications/:id/read
router.put('/:id/read', optionalAuth, markNotificationAsRead);

// PUT /api/notifications/user/:userId/read-all
router.put('/user/:userId/read-all', optionalAuth, markAllNotificationsAsRead);

export default router;
