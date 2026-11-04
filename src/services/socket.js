/**
 * ScholarConnect Real-Time Socket.IO Client Service
 * Manages real-time bidirectional messaging, typing indicators, presence, and read receipts.
 */

import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

let socket = null;
const eventListeners = new Map();

/**
 * Initialize or get active socket connection with JWT authentication
 */
export function getSocket() {
  const token = localStorage.getItem('scholarconnect_token');

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      query: { token },
      transports: ['websocket', 'polling'],
      autoConnect: Boolean(token),
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('⚡ [Socket.IO Connected] Session ID:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ [Socket.IO Connection Notice]:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 [Socket.IO Disconnected]:', reason);
    });
  } else if (token && !socket.connected) {
    socket.auth = { token };
    socket.connect();
  }

  return socket;
}

/**
 * Re-authenticate socket after login
 */
export function connectSocket(token) {
  const authToken = token || localStorage.getItem('scholarconnect_token');
  if (!authToken) return null;

  if (socket) {
    socket.auth = { token: authToken };
    if (!socket.connected) {
      socket.connect();
    }
  } else {
    getSocket();
  }
  return socket;
}

/**
 * Disconnect socket on logout
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Join conversation room
 */
export function joinRoom({ opportunityId, partnerId, applicationId, roomId }, callback) {
  const s = getSocket();
  if (s) {
    s.emit('join_room', { opportunityId, partnerId, applicationId, roomId }, (res) => {
      if (typeof callback === 'function') callback(res);
    });
  }
}

/**
 * Emit message to room and persist in MongoDB Atlas
 */
export function sendSocketMessage({ receiverId, opportunityId, applicationId, message, tempId, roomId }, callback) {
  const s = getSocket();
  if (s && s.connected) {
    s.emit('send_message', { receiverId, opportunityId, applicationId, message, tempId, roomId }, (res) => {
      if (typeof callback === 'function') callback(res);
    });
    return true;
  }
  return false;
}

/**
 * Send typing start indicator
 */
export function sendTypingStart(roomId, opportunityId, receiverId) {
  const s = getSocket();
  if (s && s.connected) {
    s.emit('typing_start', { roomId, opportunityId, receiverId });
  }
}

/**
 * Send typing stop indicator
 */
export function sendTypingStop(roomId, opportunityId, receiverId) {
  const s = getSocket();
  if (s && s.connected) {
    s.emit('typing_stop', { roomId, opportunityId, receiverId });
  }
}

/**
 * Mark conversation messages as read
 */
export function sendMarkAsRead(roomId, opportunityId, partnerId, messageIds, callback) {
  const s = getSocket();
  if (s && s.connected) {
    s.emit('mark_as_read', { roomId, opportunityId, partnerId, messageIds }, (res) => {
      if (typeof callback === 'function') callback(res);
    });
  }
}

/**
 * Subscribe to real-time events with auto-cleanup helper
 */
export function subscribeToSocketEvent(eventName, handler) {
  const s = getSocket();
  if (!s) return () => {};

  s.on(eventName, handler);
  return () => {
    s.off(eventName, handler);
  };
}
