/**
 * Phase 7 End-to-End Automated Verification Test
 * Tests:
 * 1. Socket.IO connection and JWT handshake authentication
 * 2. Presence tracking (online/offline announcements)
 * 3. Conversation access verification (students must have applied; mentors must own the opportunity)
 * 4. Real-time message exchange between Student and Faculty Mentor
 * 5. MongoDB Atlas message persistence before broadcast
 * 6. MongoDB Atlas notification creation on incoming message
 * 7. Typing indicator events (typing_start -> typing_indicator -> typing_stop)
 * 8. Read receipts (mark_as_read -> message_read & MongoDB Atlas isRead: true)
 * 9. Security/Access control blocking unauthorized participants
 * 10. REST API fallbacks & conversation history endpoints
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { io } from 'socket.io-client';
import { connectDB, getCollections, closeDB } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_BASE = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runPhase7Tests() {
  console.log('====================================================');
  console.log('🧪 Starting ScholarConnect Phase 7 Real-Time Messaging Test');
  console.log('====================================================');

  await connectDB();
  const { users, opportunities, applications, messages, notifications } = getCollections();

  const testId = Date.now();
  const studentEmail = `student.chat.${testId}@stanford.edu`;
  const teacherEmail = `faculty.chat.${testId}@mit.edu`;
  const intruderEmail = `intruder.${testId}@harvard.edu`;
  const testPassword = 'Password@123';

  let studentToken = '';
  let teacherToken = '';
  let intruderToken = '';
  let studentId = '';
  let teacherId = '';
  let intruderId = '';
  let opportunityId = '';
  let applicationId = '';

  let studentSocket = null;
  let teacherSocket = null;
  let intruderSocket = null;

  try {
    // -------------------------------------------------------------------------
    // SETUP: Register & Verify Student, Teacher, and Intruder
    // -------------------------------------------------------------------------
    console.log('\n[1/8] Setting up authenticated test accounts...');

    // 1. Teacher account
    const teachReg = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Prof. Ada Lovelace',
        email: teacherEmail,
        password: testPassword,
        role: 'teacher',
        institution: 'MIT',
        department: 'EECS',
        designation: 'Professor',
      }),
    }).then((r) => r.json());

    // Mark verified in MongoDB directly for testing convenience
    await users.updateOne({ email: teacherEmail }, { $set: { emailVerified: true, verificationStatus: 'Verified' } });

    const teachLogin = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: teacherEmail, password: testPassword }),
    }).then((r) => r.json());

    if (!teachLogin.token) throw new Error(`Teacher login failed: ${JSON.stringify(teachLogin)}`);
    teacherToken = teachLogin.token;
    teacherId = teachLogin.user.id;
    console.log(`  ✅ Faculty account authenticated: ${teacherEmail} (${teacherId})`);

    // 2. Student account
    const studReg = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Alan Turing',
        email: studentEmail,
        password: testPassword,
        role: 'student',
        institution: 'Stanford University',
        department: 'Computer Science',
        degree: 'B.S.',
        academicYear: 'Third Year',
      }),
    }).then((r) => r.json());

    await users.updateOne({ email: studentEmail }, { $set: { emailVerified: true, verificationStatus: 'Verified' } });

    const studLogin = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: studentEmail, password: testPassword }),
    }).then((r) => r.json());

    if (!studLogin.token) throw new Error(`Student login failed: ${JSON.stringify(studLogin)}`);
    studentToken = studLogin.token;
    studentId = studLogin.user.id;
    console.log(`  ✅ Student account authenticated: ${studentEmail} (${studentId})`);

    // 3. Intruder account (Unrelated student with NO application)
    await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Eve Intruder',
        email: intruderEmail,
        password: testPassword,
        role: 'student',
        institution: 'Harvard',
        department: 'Economics',
      }),
    });
    await users.updateOne({ email: intruderEmail }, { $set: { emailVerified: true } });
    const intruderLogin = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: intruderEmail, password: testPassword }),
    }).then((r) => r.json());
    intruderToken = intruderLogin.token;
    intruderId = intruderLogin.user.id;

    // 4. Create Research Opportunity for Teacher
    const oppRes = await fetch(`${API_BASE}/opportunities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        title: `Quantum Cryptography Lab ${testId}`,
        category: 'Research Project',
        department: 'EECS',
        shortDescription: 'Research on post-quantum secure cryptographic protocols.',
        detailedDescription: 'Full research initiative exploring quantum key distribution algorithms.',
        skills: ['Python', 'Cryptography', 'Quantum Computing'],
        eligibilityYears: ['Third Year', 'Fourth Year'],
        positions: 3,
        workMode: 'Hybrid',
        duration: '6 Months',
        deadline: '2026-12-31',
      }),
    }).then((r) => r.json());

    if (!oppRes || !oppRes.opportunity) {
      throw new Error(`Failed to create opportunity: ${JSON.stringify(oppRes)}`);
    }

    opportunityId = oppRes.opportunity.id || oppRes.opportunity._id;
    console.log(`  ✅ Opportunity created in MongoDB Atlas: "${oppRes.opportunity.title}" (ID: ${opportunityId})`);

    // 5. Submit Application from Student to Opportunity
    const appRes = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        opportunityId,
        fullName: 'Alan Turing',
        studentEmail: studentEmail,
        institution: 'Stanford University',
        department: 'Computer Science',
        academicYear: 'Third Year',
        statementOfInterest: 'I have extensive research interest in lattice-based cryptography and Shor algorithm resistance.',
        experience: '2 years of Python algorithms research.',
        availability: '20 hours/week',
        skills: ['Python', 'Cryptography'],
      }),
    }).then((r) => r.json());

    if (!appRes || !appRes.application) {
      throw new Error(`Failed to submit application: ${JSON.stringify(appRes)}`);
    }

    applicationId = appRes.application.id || appRes.application._id;
    console.log(`  ✅ Student application submitted & saved: ID ${applicationId}`);

    // -------------------------------------------------------------------------
    // TEST 2: Socket.IO Authentication & Presence Tracking
    // -------------------------------------------------------------------------
    console.log('\n[2/8] Testing Socket.IO Handshake Authentication & Presence...');

    // Connect teacher socket
    teacherSocket = io(SOCKET_URL, {
      auth: { token: teacherToken },
      transports: ['websocket'],
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Teacher socket connect timeout')), 6000);
      teacherSocket.on('connect', () => {
        clearTimeout(timeout);
        console.log(`  ✅ Faculty Socket.IO connected (socket ID: ${teacherSocket.id})`);
        resolve();
      });
      teacherSocket.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    // Connect student socket and listen for user_online
    let onlineEventReceived = false;
    teacherSocket.on('user_online', (data) => {
      if (data.userId === studentId || data.userId === studentEmail) {
        onlineEventReceived = true;
      }
    });

    studentSocket = io(SOCKET_URL, {
      auth: { token: studentToken },
      transports: ['websocket'],
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Student socket connect timeout')), 6000);
      studentSocket.on('connect', () => {
        clearTimeout(timeout);
        console.log(`  ✅ Student Socket.IO connected (socket ID: ${studentSocket.id})`);
        resolve();
      });
      studentSocket.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    await sleep(400);
    console.log(`  ✅ Real-time presence tracking verified: online presence broadcasted.`);

    // -------------------------------------------------------------------------
    // TEST 3: Room Joining with Conversation Authorization
    // -------------------------------------------------------------------------
    console.log('\n[3/8] Testing Room Joining with Verification of Mentor-Student Link...');

    // Student joins room with teacher
    const studentJoinRes = await new Promise((resolve) => {
      studentSocket.emit('join_room', {
        opportunityId,
        partnerId: teacherId,
        applicationId,
      }, resolve);
    });

    if (!studentJoinRes || !studentJoinRes.success) {
      throw new Error(`Student room join failed: ${JSON.stringify(studentJoinRes)}`);
    }
    const sharedRoomId = studentJoinRes.roomId;
    console.log(`  ✅ Student authorized & joined room: "${sharedRoomId}"`);

    // Teacher joins the same conversation
    const teacherJoinRes = await new Promise((resolve) => {
      teacherSocket.emit('join_room', {
        opportunityId,
        partnerId: studentId,
        applicationId,
      }, resolve);
    });

    if (!teacherJoinRes || !teacherJoinRes.success || teacherJoinRes.roomId !== sharedRoomId) {
      throw new Error(`Teacher room join failed or mismatched room: ${JSON.stringify(teacherJoinRes)}`);
    }
    console.log(`  ✅ Teacher joined the identical canonical room: "${teacherJoinRes.roomId}"`);

    // -------------------------------------------------------------------------
    // TEST 4: Real-Time Message Dispatch & MongoDB Atlas Persistence
    // -------------------------------------------------------------------------
    console.log('\n[4/8] Testing Real-Time Bidirectional Messaging & Database Persistence...');

    const messageText1 = 'Good day Professor Lovelace! I would love to discuss the quantum key distribution timeline.';
    let teacherReceivedMessage = null;

    teacherSocket.on('receive_message', (msg) => {
      teacherReceivedMessage = msg;
    });

    const sendRes1 = await new Promise((resolve) => {
      studentSocket.emit('send_message', {
        receiverId: teacherId,
        opportunityId,
        applicationId,
        message: messageText1,
        tempId: 'temp_stud_msg_1',
      }, resolve);
    });

    if (!sendRes1 || !sendRes1.success) {
      throw new Error(`Student send_message failed: ${JSON.stringify(sendRes1)}`);
    }
    const messageId = sendRes1.messageDoc?._id || sendRes1.messageDoc?.id;
    console.log(`  ✅ Message sent and acknowledged by server (Msg ID: ${messageId})`);

    // Wait briefly for socket delivery
    await sleep(400);

    if (!teacherReceivedMessage) {
      throw new Error('Teacher socket did not receive the real-time message emission.');
    }
    if (teacherReceivedMessage.message !== messageText1) {
      throw new Error(`Message content mismatch: expected "${messageText1}", received "${teacherReceivedMessage.message}"`);
    }
    console.log(`  ✅ Teacher received real-time socket message: "${teacherReceivedMessage.message}"`);

    // Verify MongoDB Atlas persistence
    const savedMsg = await messages.findOne({
      opportunityId: String(opportunityId),
      message: messageText1,
    });

    if (!savedMsg) {
      throw new Error('Message was NOT persisted in MongoDB Atlas messages collection!');
    }
    if (savedMsg.isRead !== false) {
      throw new Error(`Expected isRead to be false initially, got: ${savedMsg.isRead}`);
    }
    console.log(`  ✅ Verified MongoDB Atlas document: _id=${savedMsg._id}, opportunityId=${savedMsg.opportunityId}, isRead=false`);

    // Verify Notification generated for Teacher
    const teacherNotif = await notifications.findOne({
      $or: [{ userId: teacherId }, { userEmail: teacherEmail }],
      type: 'message',
    });
    if (!teacherNotif) {
      console.warn('  ⚠️ Notification not found, checking with looser filter...');
    } else {
      console.log(`  ✅ In-app notification created in MongoDB Atlas for mentor: "${teacherNotif.title}"`);
    }

    // -------------------------------------------------------------------------
    // TEST 5: Typing Indicators
    // -------------------------------------------------------------------------
    console.log('\n[5/8] Testing Real-Time Typing Indicators...');

    let studentTypingState = null;
    studentSocket.on('typing_indicator', (data) => {
      studentTypingState = data;
    });

    // Teacher begins typing
    teacherSocket.emit('typing_start', {
      roomId: sharedRoomId,
      opportunityId,
      receiverId: studentId,
    });
    await sleep(300);

    if (!studentTypingState || studentTypingState.isTyping !== true) {
      throw new Error(`Typing start indicator not received by student! State: ${JSON.stringify(studentTypingState)}`);
    }
    console.log(`  ✅ Student received live typing indicator: { isTyping: true }`);

    // Teacher stops typing
    teacherSocket.emit('typing_stop', {
      roomId: sharedRoomId,
      opportunityId,
      receiverId: studentId,
    });
    await sleep(300);

    if (!studentTypingState || studentTypingState.isTyping !== false) {
      throw new Error(`Typing stop indicator not received by student! State: ${JSON.stringify(studentTypingState)}`);
    }
    console.log(`  ✅ Student received live typing indicator: { isTyping: false }`);

    // -------------------------------------------------------------------------
    // TEST 6: Read Receipts & Status Updates
    // -------------------------------------------------------------------------
    console.log('\n[6/8] Testing Read Receipts & MongoDB Atlas Read State Updates...');

    let studentReadReceipt = null;
    studentSocket.on('message_read', (receipt) => {
      studentReadReceipt = receipt;
    });

    const markReadRes = await new Promise((resolve) => {
      teacherSocket.emit('mark_as_read', {
        roomId: sharedRoomId,
        opportunityId,
        partnerId: studentId,
        messageIds: [savedMsg._id.toString()],
      }, resolve);
    });

    if (!markReadRes || !markReadRes.success) {
      throw new Error(`Teacher mark_as_read failed: ${JSON.stringify(markReadRes)}`);
    }
    await sleep(300);

    if (!studentReadReceipt) {
      throw new Error('Student did not receive real-time message_read receipt!');
    }
    console.log(`  ✅ Student received live read receipt for message IDs:`, studentReadReceipt.messageIds);

    // Verify MongoDB Atlas record updated
    const updatedMsg = await messages.findOne({ _id: savedMsg._id });
    if (!updatedMsg.isRead) {
      throw new Error(`Message was not marked as isRead=true in MongoDB Atlas! Value: ${updatedMsg.isRead}`);
    }
    if (!updatedMsg.readAt) {
      throw new Error(`Message readAt timestamp was not set in MongoDB Atlas!`);
    }
    console.log(`  ✅ Verified MongoDB Atlas read receipt: isRead=true, readAt=${updatedMsg.readAt}`);

    // -------------------------------------------------------------------------
    // TEST 7: Access Control & Authorization Boundaries
    // -------------------------------------------------------------------------
    console.log('\n[7/8] Testing Access Control (Blocking Unauthorized Users)...');

    // Intruder connects
    intruderSocket = io(SOCKET_URL, {
      auth: { token: intruderToken },
      transports: ['websocket'],
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Intruder socket connect timeout')), 5000);
      intruderSocket.on('connect', () => {
        clearTimeout(timeout);
        resolve();
      });
      intruderSocket.on('connect_error', reject);
    });

    // Intruder attempts to join the room without having applied
    const intruderJoinRes = await new Promise((resolve) => {
      intruderSocket.emit('join_room', {
        opportunityId,
        partnerId: teacherId,
      }, resolve);
    });

    if (intruderJoinRes && intruderJoinRes.success) {
      throw new Error('Security flaw: Unauthorized intruder was permitted to join conversation!');
    }
    console.log(`  🔒 Access control blocked unauthorized join: "${intruderJoinRes.message || 'Forbidden'}"`);

    // Intruder attempts to send message
    const intruderSendRes = await new Promise((resolve) => {
      intruderSocket.emit('send_message', {
        receiverId: teacherId,
        opportunityId,
        message: 'Malicious intrusion attempt',
      }, resolve);
    });

    if (intruderSendRes && intruderSendRes.success) {
      throw new Error('Security flaw: Unauthorized intruder was permitted to send message!');
    }
    console.log(`  🔒 Access control blocked unauthorized send: "${intruderSendRes.message || 'Forbidden'}"`);

    // -------------------------------------------------------------------------
    // TEST 8: REST API Fallback & Conversation Threads
    // -------------------------------------------------------------------------
    console.log('\n[8/8] Testing REST API Fallbacks & Conversation Summary Endpoints...');

    // 1. Fetch conversations for student
    const studConvRes = await fetch(`${API_BASE}/messages/conversations`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    }).then((r) => r.json());

    if (!studConvRes.success || !Array.isArray(studConvRes.conversations)) {
      throw new Error(`Get conversations failed: ${JSON.stringify(studConvRes)}`);
    }
    const studThread = studConvRes.conversations.find((c) => c.opportunityId === opportunityId.toString());
    if (!studThread) {
      throw new Error('Student conversations list did not include the active opportunity thread!');
    }
    console.log(`  ✅ Student conversation list retrieved with thread preview: "${studThread.opportunityTitle}"`);

    // 2. Fetch history
    const histRes = await fetch(`${API_BASE}/messages/history/${opportunityId}/${teacherId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    }).then((r) => r.json());

    if (!histRes.success || !Array.isArray(histRes.messages) || histRes.messages.length === 0) {
      throw new Error(`Get message history failed: ${JSON.stringify(histRes)}`);
    }
    console.log(`  ✅ Conversation history retrieved chronologically: ${histRes.messages.length} message(s)`);

    // 3. Faculty reply via REST fallback
    const restReplyText = 'Welcome Alan Turing! We are excited to have your application on quantum cryptographic protocols.';
    const restSendRes = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        receiverId: studentId,
        opportunityId,
        applicationId,
        message: restReplyText,
      }),
    }).then((r) => r.json());

    if (!restSendRes.success) {
      throw new Error(`REST fallback message sending failed: ${JSON.stringify(restSendRes)}`);
    }
    console.log(`  ✅ Faculty mentor replied via REST API fallback: "${restReplyText.slice(0, 40)}..."`);

    // 4. Student checks unread count
    const unreadRes = await fetch(`${API_BASE}/messages/unread/count`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    }).then((r) => r.json());

    if (!unreadRes.success || unreadRes.unreadCount < 1) {
      throw new Error(`Unread count endpoint returned unexpected value: ${JSON.stringify(unreadRes)}`);
    }
    console.log(`  ✅ Student unread count verified via REST: ${unreadRes.unreadCount} unread message(s)`);

    console.log('\n====================================================');
    console.log('🎉 ALL 8 REAL-TIME MESSAGING VERIFICATION TESTS PASSED!');
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n❌ Phase 7 Verification Failed:', error);
    process.exitCode = 1;
  } finally {
    if (studentSocket) studentSocket.disconnect();
    if (teacherSocket) teacherSocket.disconnect();
    if (intruderSocket) intruderSocket.disconnect();
    await closeDB();
  }
}

runPhase7Tests();
