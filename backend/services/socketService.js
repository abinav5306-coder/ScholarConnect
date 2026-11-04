import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getCollections } from '../config/db.js';
import { notifyUserOfNewMessage } from './notificationEmailService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'scholarconnect_super_secret_jwt_key_2026';

let io = null;

// Map to track active connections: user identifier (userId / email) -> Set of socket IDs
const onlineUsers = new Map();

/**
 * Register user connection
 */
function trackUserOnline(identifier, socketId) {
  if (!identifier) return;
  const key = String(identifier).toLowerCase().trim();
  if (!onlineUsers.has(key)) {
    onlineUsers.set(key, new Set());
  }
  onlineUsers.get(key).add(socketId);
}

/**
 * Remove user connection
 */
function trackUserOffline(identifier, socketId) {
  if (!identifier) return false;
  const key = String(identifier).toLowerCase().trim();
  if (onlineUsers.has(key)) {
    const sockets = onlineUsers.get(key);
    sockets.delete(socketId);
    if (sockets.size === 0) {
      onlineUsers.delete(key);
      return true; // Completely offline
    }
  }
  return false;
}

/**
 * Check if a user is online
 */
export function isUserOnline(identifier) {
  if (!identifier) return false;
  const key = String(identifier).toLowerCase().trim();
  return onlineUsers.has(key) && onlineUsers.get(key).size > 0;
}

/**
 * Send an event directly to a user's active sockets
 */
export function emitToUser(identifier, eventName, payload) {
  if (!io || !identifier) return;
  const key = String(identifier).toLowerCase().trim();
  const sockets = onlineUsers.get(key);
  if (sockets && sockets.size > 0) {
    sockets.forEach((socketId) => {
      io.to(socketId).emit(eventName, payload);
    });
  }
}

/**
 * Deterministic Room ID Generator:
 * Creates a unique, canonical room string for an opportunity and pair of participants
 */
export function buildRoomId(opportunityId, userA, userB) {
  const sortedParticipants = [String(userA).toLowerCase(), String(userB).toLowerCase()].sort().join('__');
  return `room_${opportunityId}__${sortedParticipants}`;
}

/**
 * Verify Conversation Access Permission:
 * Validates that the user is authorized to communicate in this opportunity context
 */
export async function verifyConversationAccess(userId, userEmail, userRole, opportunityId, partnerId) {
  try {
    const { opportunities, applications, users } = getCollections();

    // 1. If admin, full access granted
    if (userRole === 'admin') return { allowed: true };

    // 2. Fetch opportunity
    let oppQuery = {};
    if (ObjectId.isValid(opportunityId)) {
      oppQuery = { _id: new ObjectId(opportunityId) };
    } else {
      oppQuery = { id: opportunityId };
    }
    const opportunity = await opportunities.findOne(oppQuery);
    if (!opportunity) {
      return { allowed: false, reason: 'Opportunity not found' };
    }

    const oppIdString = opportunity._id ? opportunity._id.toString() : opportunity.id;
    const teacherIdString = String(opportunity.teacherId || opportunity.teacherEmail || '').toLowerCase();
    const currentUserIdString = String(userId).toLowerCase();
    const currentUserEmailString = String(userEmail).toLowerCase();
    const partnerIdString = String(partnerId).toLowerCase();

    // 3. If teacher role: user must be the opportunity owner
    if (userRole === 'teacher') {
      const isOwner = teacherIdString === currentUserIdString || 
                      teacherIdString === currentUserEmailString || 
                      opportunity.teacherEmail?.toLowerCase() === currentUserEmailString;
      if (!isOwner) {
        return { allowed: false, reason: 'Teacher does not own this opportunity' };
      }

      // Partner must be a student who has applied
      const application = await applications.findOne({
        $and: [
          { $or: [{ opportunityId: oppIdString }, { opportunityId }] },
          { $or: [{ studentId: partnerId }, { studentEmail: partnerId }, { email: partnerId }] },
        ],
      });
      if (!application) {
        return { allowed: false, reason: 'Student has not applied to this opportunity' };
      }

      return { allowed: true, opportunity, application };
    }

    // 4. If student role: user must have submitted an application
    if (userRole === 'student') {
      const application = await applications.findOne({
        $and: [
          { $or: [{ opportunityId: oppIdString }, { opportunityId }] },
          { $or: [{ studentId: userId }, { studentEmail: userEmail }, { email: userEmail }] },
        ],
      });

      if (!application) {
        return { allowed: false, reason: 'Student has not applied to this opportunity' };
      }

      return { allowed: true, opportunity, application };
    }

    return { allowed: false, reason: 'Invalid role for messaging' };
  } catch (err) {
    console.error('verifyConversationAccess error:', err);
    return { allowed: false, reason: err.message };
  }
}

/**
 * Initialize Socket.IO Server
 */
export function initSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  // JWT Authentication Middleware for Socket.IO
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
          return next(new Error('Invalid or expired authentication token'));
        }
        socket.user = {
          userId: decoded.userId || decoded.id,
          email: decoded.email,
          role: decoded.role,
          name: decoded.name || 'Scholar User',
        };
        next();
      });
    } catch (err) {
      next(new Error(`Socket authentication failed: ${err.message}`));
    }
  });

  io.on('connection', (socket) => {
    const { userId, email, role, name } = socket.user;
    console.log(`🔌 [Socket.IO Connected] User: ${name} (${role}) | ID: ${userId} | Socket: ${socket.id}`);

    // Track online presence
    trackUserOnline(userId, socket.id);
    trackUserOnline(email, socket.id);

    // Broadcast online presence to peers
    socket.broadcast.emit('user_online', {
      userId,
      email,
      name,
      role,
    });

    // Send immediate acknowledgement to connected client
    socket.emit('connection_established', {
      userId,
      socketId: socket.id,
      online: true,
    });

    // ------------------------------------------------------------------------
    // EVENT 1: join_room
    // ------------------------------------------------------------------------
    socket.on('join_room', async (data, callback) => {
      try {
        const { opportunityId, partnerId, applicationId } = data || {};

        if (!opportunityId || !partnerId) {
          const errPayload = { success: false, message: 'opportunityId and partnerId are required' };
          if (typeof callback === 'function') callback(errPayload);
          return socket.emit('error', errPayload);
        }

        // Verify access rules
        const check = await verifyConversationAccess(userId, email, role, opportunityId, partnerId);
        if (!check.allowed) {
          console.warn(`[Socket.IO Room Denied] User ${email} denied access to opportunity ${opportunityId}: ${check.reason}`);
          const errPayload = { success: false, message: `Access denied: ${check.reason}` };
          if (typeof callback === 'function') callback(errPayload);
          return socket.emit('error', errPayload);
        }

        const roomId = data.roomId || buildRoomId(opportunityId, userId, partnerId);
        socket.join(roomId);

        console.log(`👥 [Socket.IO Room Joined] ${email} joined ${roomId}`);

        const successPayload = {
          success: true,
          roomId,
          opportunityId,
          partnerId,
          partnerOnline: isUserOnline(partnerId),
        };

        if (typeof callback === 'function') callback(successPayload);
        socket.emit('joined_room', successPayload);
      } catch (err) {
        console.error('join_room error:', err);
        if (typeof callback === 'function') callback({ success: false, message: err.message });
      }
    });

    // ------------------------------------------------------------------------
    // EVENT 2: send_message
    // ------------------------------------------------------------------------
    socket.on('send_message', async (data, callback) => {
      try {
        const { receiverId, opportunityId, applicationId, message, tempId } = data || {};

        if (!receiverId || !opportunityId || !message || !message.trim()) {
          const errPayload = { success: false, message: 'receiverId, opportunityId, and non-empty message are required' };
          if (typeof callback === 'function') callback(errPayload);
          return socket.emit('error', errPayload);
        }

        // Verify access permission
        const check = await verifyConversationAccess(userId, email, role, opportunityId, receiverId);
        if (!check.allowed) {
          const errPayload = { success: false, message: `Access denied: ${check.reason}` };
          if (typeof callback === 'function') callback(errPayload);
          return socket.emit('error', errPayload);
        }

        const { messages, notifications } = getCollections();

        // Construct message document with full metadata
        const messageDoc = {
          senderId: userId,
          senderEmail: email,
          senderName: name,
          senderRole: role,
          receiverId: String(receiverId).trim(),
          opportunityId: String(opportunityId).trim(),
          opportunityTitle: check.opportunity?.title || 'Research Opportunity',
          applicationId: applicationId || (check.application?._id?.toString() || null),
          message: message.trim(),
          isRead: false,
          readAt: null,
          createdAt: new Date(),
        };

        // 1. SAVE TO MONGODB ATLAS FIRST (Never emit without persistence)
        const insertResult = await messages.insertOne(messageDoc);
        const savedMessage = {
          id: insertResult.insertedId.toString(),
          _id: insertResult.insertedId,
          ...messageDoc,
        };

        // 2. CREATE IN-APP NOTIFICATION IN MONGODB ATLAS
        try {
          await notifications.insertOne({
            userId: String(receiverId).trim(),
            userEmail: String(receiverId).trim().toLowerCase(),
            title: `New Message from ${name}`,
            message: `${name}: "${message.trim().slice(0, 70)}${message.length > 70 ? '...' : ''}"`,
            type: 'message',
            isRead: false,
            relatedId: savedMessage.id,
            opportunityId: String(opportunityId).trim(),
            senderId: userId,
            senderName: name,
            createdAt: new Date(),
          });
        } catch (notifErr) {
          console.warn('[Message Notification] Non-blocking notification insert failed:', notifErr.message);
        }

        // 3. BROADCAST TO ROOM
        const roomId = data.roomId || buildRoomId(opportunityId, userId, receiverId);
        io.to(roomId).emit('receive_message', savedMessage);

        // 4. EMIT DIRECT REAL-TIME NOTIFICATION TO RECEIVER'S OTHER TABS/DEVICES
        emitToUser(receiverId, 'new_message_notification', {
          message: savedMessage,
          senderName: name,
        });

        // 4b. DISPATCH EMAIL NOTIFICATION IF RECEIVER IS OFFLINE OR UNREAD (With Cooldown, Zero Private Body)
        try {
          const isReceiverOnline = isUserOnline(receiverId);
          const { users } = getCollections();
          let rQuery = {};
          if (ObjectId.isValid(receiverId)) {
            rQuery = { $or: [{ _id: new ObjectId(receiverId) }, { id: receiverId }, { email: receiverId }] };
          } else {
            rQuery = { $or: [{ email: receiverId }, { id: receiverId }] };
          }
          const receiverDoc = await users.findOne(rQuery);
          if (receiverDoc && receiverDoc.email) {
            notifyUserOfNewMessage({
              recipientEmail: receiverDoc.email,
              recipientName: receiverDoc.fullName || receiverDoc.name || 'Scholar',
              senderName: name,
              senderRole: role,
              opportunityTitle: check.opportunity?.title || 'Research Opportunity',
              opportunityId,
              senderId: userId,
              isStudent: receiverDoc.role === 'student',
            }).catch((err) => console.warn('[Message Email Warning]:', err.message));
          }
        } catch (msgEmailErr) {
          console.warn('[Message Email Dispatch Notice]:', msgEmailErr.message);
        }

        // 5. ACKNOWLEDGE SENDER
        const ackPayload = {
          success: true,
          tempId,
          messageDoc: savedMessage,
        };

        if (typeof callback === 'function') callback(ackPayload);
        socket.emit('message_sent', ackPayload);

        console.log(`💬 [Message Delivered & Saved] From ${email} to ${receiverId} in room ${roomId}`);
      } catch (err) {
        console.error('send_message error:', err);
        if (typeof callback === 'function') callback({ success: false, message: err.message });
      }
    });

    // ------------------------------------------------------------------------
    // EVENT 3: mark_as_read
    // ------------------------------------------------------------------------
    socket.on('mark_as_read', async (data, callback) => {
      try {
        const { opportunityId, partnerId, messageIds } = data || {};
        if (!opportunityId || !partnerId) return;

        const { messages, notifications } = getCollections();

        let updateFilter = {
          opportunityId: String(opportunityId).trim(),
          receiverId: { $in: [userId, email] },
          isRead: false,
        };

        if (Array.isArray(messageIds) && messageIds.length > 0) {
          const objIds = messageIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
          updateFilter = {
            ...updateFilter,
            $or: [{ _id: { $in: objIds } }, { id: { $in: messageIds } }],
          };
        }

        const now = new Date();
        const updateResult = await messages.updateMany(updateFilter, {
          $set: {
            isRead: true,
            readAt: now,
          },
        });

        // Also mark message notifications as read
        try {
          await notifications.updateMany(
            {
              userId: { $in: [userId, email] },
              type: 'message',
              senderId: partnerId,
              isRead: false,
            },
            { $set: { isRead: true, readAt: now } }
          );
        } catch {}

        const roomId = data.roomId || buildRoomId(opportunityId, userId, partnerId);

        // Broadcast read receipt to room
        io.to(roomId).emit('message_read', {
          readBy: userId,
          readByEmail: email,
          opportunityId,
          partnerId,
          readAt: now,
          updatedCount: updateResult.modifiedCount,
          messageIds: Array.isArray(messageIds) ? messageIds : [],
        });

        if (typeof callback === 'function') {
          callback({ success: true, updatedCount: updateResult.modifiedCount });
        }
      } catch (err) {
        console.error('mark_as_read error:', err);
      }
    });

    // ------------------------------------------------------------------------
    // EVENT 4: typing_start
    // ------------------------------------------------------------------------
    socket.on('typing_start', (data) => {
      const { roomId, opportunityId, receiverId } = data || {};
      const targetRoom = roomId || (opportunityId && receiverId ? buildRoomId(opportunityId, userId, receiverId) : null);
      if (targetRoom) {
        socket.to(targetRoom).emit('typing_indicator', {
          isTyping: true,
          userId,
          name,
          opportunityId,
        });
      }
    });

    // ------------------------------------------------------------------------
    // EVENT 5: typing_stop
    // ------------------------------------------------------------------------
    socket.on('typing_stop', (data) => {
      const { roomId, opportunityId, receiverId } = data || {};
      const targetRoom = roomId || (opportunityId && receiverId ? buildRoomId(opportunityId, userId, receiverId) : null);
      if (targetRoom) {
        socket.to(targetRoom).emit('typing_indicator', {
          isTyping: false,
          userId,
          opportunityId,
        });
      }
    });

    // ------------------------------------------------------------------------
    // Disconnect Handler
    // ------------------------------------------------------------------------
    socket.on('disconnect', () => {
      const isCompletelyOfflineUserId = trackUserOffline(userId, socket.id);
      const isCompletelyOfflineEmail = trackUserOffline(email, socket.id);

      if (isCompletelyOfflineUserId || isCompletelyOfflineEmail) {
        console.log(`🔌 [Socket.IO Disconnected] User ${email} is now offline.`);
        socket.broadcast.emit('user_offline', {
          userId,
          email,
          name,
          role,
        });
      }
    });
  });

  return io;
}

export function getIO() {
  return io;
}
