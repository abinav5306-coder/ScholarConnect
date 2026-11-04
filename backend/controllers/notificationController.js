import { ObjectId } from 'mongodb';
import { getCollections } from '../config/db.js';

/**
 * Get Notifications for a User
 * GET /api/notifications/:userId
 */
export async function getUserNotifications(req, res) {
  try {
    const { userId } = req.params;
    const { notifications } = getCollections();

    const query = {
      $or: [
        { userId: userId },
        { userEmail: userId.toLowerCase() },
        ...(ObjectId.isValid(userId) ? [{ userId: new ObjectId(userId) }] : []),
      ],
    };

    const list = await notifications
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const formatted = list.map((item) => ({
      id: item._id.toString(),
      ...item,
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      unreadCount: formatted.filter((n) => !n.isRead).length,
      notifications: formatted,
    });
  } catch (error) {
    console.error('getUserNotifications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications.',
      error: error.message,
    });
  }
}

/**
 * Mark a Notification as Read
 * PUT /api/notifications/:id/read
 */
export async function markNotificationAsRead(req, res) {
  try {
    const { id } = req.params;
    const { notifications } = getCollections();

    let filter = {};
    if (ObjectId.isValid(id)) {
      filter = { _id: new ObjectId(id) };
    } else {
      filter = { id: id };
    }

    const result = await notifications.findOneAndUpdate(
      filter,
      { $set: { isRead: true, readAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read in MongoDB Atlas.',
      notification: {
        id: result._id.toString(),
        ...result,
      },
    });
  } catch (error) {
    console.error('markNotificationAsRead error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification.',
      error: error.message,
    });
  }
}

/**
 * Mark All Notifications as Read for a User
 * PUT /api/notifications/user/:userId/read-all
 */
export async function markAllNotificationsAsRead(req, res) {
  try {
    const { userId } = req.params;
    const { notifications } = getCollections();

    const query = {
      $or: [
        { userId: userId },
        { userEmail: userId.toLowerCase() },
      ],
      isRead: false,
    };

    const updateRes = await notifications.updateMany(query, {
      $set: { isRead: true, readAt: new Date() },
    });

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      modifiedCount: updateRes.modifiedCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to mark all as read.',
      error: error.message,
    });
  }
}

/**
 * Get Current User's Notification Preferences
 * GET /api/notifications/preferences
 */
export async function getNotificationPreferences(req, res) {
  try {
    const currentUserId = req.user?.userId;
    const currentUserEmail = req.user?.email?.toLowerCase();

    if (!currentUserId && !currentUserEmail) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { users } = getCollections();
    const query = currentUserId && ObjectId.isValid(currentUserId)
      ? { $or: [{ _id: new ObjectId(currentUserId) }, { email: currentUserEmail }] }
      : { email: currentUserEmail };

    const user = await users.findOne(query);

    const defaultPrefs = {
      applicationStatusEmails: true,
      opportunityAnnouncementEmails: true,
      messageEmails: true,
      verificationEmails: true,
    };

    const preferences = user?.notificationPreferences ? {
      ...defaultPrefs,
      ...user.notificationPreferences,
    } : defaultPrefs;

    return res.status(200).json({
      success: true,
      preferences,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Update Current User's Notification Preferences
 * PUT /api/notifications/preferences
 */
export async function updateNotificationPreferences(req, res) {
  try {
    const currentUserId = req.user?.userId;
    const currentUserEmail = req.user?.email?.toLowerCase();

    if (!currentUserId && !currentUserEmail) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const {
      applicationStatusEmails,
      opportunityAnnouncementEmails,
      messageEmails,
      verificationEmails,
    } = req.body || {};

    const preferences = {
      applicationStatusEmails: applicationStatusEmails !== false,
      opportunityAnnouncementEmails: opportunityAnnouncementEmails !== false,
      messageEmails: messageEmails !== false,
      verificationEmails: verificationEmails !== false,
      updatedAt: new Date(),
    };

    const { users } = getCollections();
    const query = currentUserId && ObjectId.isValid(currentUserId)
      ? { $or: [{ _id: new ObjectId(currentUserId) }, { email: currentUserEmail }] }
      : { email: currentUserEmail };

    await users.updateOne(query, {
      $set: { notificationPreferences: preferences },
    });

    return res.status(200).json({
      success: true,
      message: 'Notification preferences saved successfully in MongoDB Atlas.',
      preferences,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

