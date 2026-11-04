import { ObjectId } from 'mongodb';
import { getCollections } from '../config/db.js';
import { 
  getIO, 
  buildRoomId, 
  isUserOnline, 
  verifyConversationAccess, 
  emitToUser 
} from '../services/socketService.js';
import { notifyUserOfNewMessage } from '../services/notificationEmailService.js';

/**
 * Get all conversations for the authenticated user
 * GET /api/messages/conversations
 */
export async function getConversations(req, res) {
  try {
    const currentUserId = req.user?.userId;
    const currentUserEmail = req.user?.email?.toLowerCase();
    const currentUserRole = req.user?.role;

    if (!currentUserId && !currentUserEmail) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { messages, opportunities, applications, users } = getCollections();

    const conversations = [];

    // ------------------------------------------------------------------------
    // CASE A: STUDENT CONVERSATIONS
    // Find all opportunities the student has applied to, paired with their faculty mentor
    // ------------------------------------------------------------------------
    if (currentUserRole === 'student') {
      const studentApps = await applications
        .find({
          $or: [
            { studentId: currentUserId },
            { studentEmail: currentUserEmail },
            { email: currentUserEmail },
          ],
        })
        .toArray();

      for (const app of studentApps) {
        let oppQuery = {};
        if (ObjectId.isValid(app.opportunityId)) {
          oppQuery = { _id: new ObjectId(app.opportunityId) };
        } else {
          oppQuery = { id: app.opportunityId };
        }

        const opp = await opportunities.findOne(oppQuery);
        if (!opp) continue;

        const oppIdString = opp._id ? opp._id.toString() : opp.id;
        const mentorEmail = (opp.teacherEmail || opp.teacherId || '').toLowerCase();

        // Find mentor details
        const mentorUser = await users.findOne({
          $or: [
            { email: mentorEmail },
            ...(ObjectId.isValid(opp.teacherId) ? [{ _id: new ObjectId(opp.teacherId) }] : []),
          ],
        });

        const partnerIdentifier = mentorUser ? (mentorUser._id?.toString() || mentorUser.email) : mentorEmail;
        const partnerName = mentorUser?.name || opp.teacherName || 'Faculty Mentor';

        // Find latest message in this thread
        const lastMsg = await messages
          .find({
            opportunityId: { $in: [oppIdString, app.opportunityId] },
            $or: [
              { senderId: { $in: [currentUserId, currentUserEmail] }, receiverId: { $in: [partnerIdentifier, mentorEmail] } },
              { senderId: { $in: [partnerIdentifier, mentorEmail] }, receiverId: { $in: [currentUserId, currentUserEmail] } },
            ],
          })
          .sort({ createdAt: -1 })
          .limit(1)
          .next();

        // Count unread incoming messages from this mentor
        const unreadCount = await messages.countDocuments({
          opportunityId: { $in: [oppIdString, app.opportunityId] },
          senderId: { $in: [partnerIdentifier, mentorEmail] },
          receiverId: { $in: [currentUserId, currentUserEmail] },
          isRead: false,
        });

        const roomId = buildRoomId(oppIdString, currentUserId, partnerIdentifier);

        conversations.push({
          roomId,
          opportunityId: oppIdString,
          opportunityTitle: opp.title,
          opportunityCategory: opp.category,
          applicationId: app._id ? app._id.toString() : app.id,
          applicationStatus: app.status,
          partnerId: partnerIdentifier,
          partnerEmail: mentorEmail,
          partnerName,
          partnerRole: 'teacher',
          partnerInstitution: opp.institution,
          partnerDepartment: opp.department,
          partnerDesignation: mentorUser?.designation || 'Faculty Mentor & PI',
          partnerAvatar: partnerName.charAt(0) || 'M',
          isOnline: isUserOnline(partnerIdentifier) || isUserOnline(mentorEmail),
          lastMessage: lastMsg ? lastMsg.message : 'No messages yet. Say hello to your mentor!',
          lastMessageTime: lastMsg ? lastMsg.createdAt : app.createdAt || app.appliedAt,
          unreadCount,
        });
      }
    }

    // ------------------------------------------------------------------------
    // CASE B: TEACHER CONVERSATIONS
    // Find all applications submitted to the teacher's opportunities
    // ------------------------------------------------------------------------
    if (currentUserRole === 'teacher') {
      // Find all opportunities owned by this teacher
      const teacherOpps = await opportunities
        .find({
          $or: [
            { teacherId: currentUserId },
            { teacherEmail: currentUserEmail },
            ...(ObjectId.isValid(currentUserId) ? [{ _id: new ObjectId(currentUserId) }] : []),
          ],
        })
        .toArray();

      const oppIds = teacherOpps.map((o) => (o._id ? o._id.toString() : o.id));

      if (oppIds.length > 0) {
        const applicantList = await applications
          .find({
            opportunityId: { $in: oppIds },
          })
          .sort({ createdAt: -1 })
          .toArray();

        for (const app of applicantList) {
          const matchingOpp = teacherOpps.find((o) => (o._id ? o._id.toString() : o.id) === app.opportunityId);
          if (!matchingOpp) continue;

          const oppIdString = matchingOpp._id ? matchingOpp._id.toString() : matchingOpp.id;
          const studentEmail = (app.studentEmail || app.email || '').toLowerCase();
          const studentId = app.studentId || studentEmail;

          // Find student profile
          const studentUser = await users.findOne({
            $or: [
              { email: studentEmail },
              ...(ObjectId.isValid(studentId) ? [{ _id: new ObjectId(studentId) }] : []),
            ],
          });

          const partnerIdentifier = studentUser ? (studentUser._id?.toString() || studentUser.email) : studentId;
          const partnerName = app.studentName || studentUser?.name || 'Student Applicant';

          // Latest message
          const lastMsg = await messages
            .find({
              opportunityId: { $in: [oppIdString, app.opportunityId] },
              $or: [
                { senderId: { $in: [currentUserId, currentUserEmail] }, receiverId: { $in: [partnerIdentifier, studentEmail] } },
                { senderId: { $in: [partnerIdentifier, studentEmail] }, receiverId: { $in: [currentUserId, currentUserEmail] } },
              ],
            })
            .sort({ createdAt: -1 })
            .limit(1)
            .next();

          // Count unread incoming messages from student
          const unreadCount = await messages.countDocuments({
            opportunityId: { $in: [oppIdString, app.opportunityId] },
            senderId: { $in: [partnerIdentifier, studentEmail] },
            receiverId: { $in: [currentUserId, currentUserEmail] },
            isRead: false,
          });

          const roomId = buildRoomId(oppIdString, currentUserId, partnerIdentifier);

          conversations.push({
            roomId,
            opportunityId: oppIdString,
            opportunityTitle: matchingOpp.title,
            opportunityCategory: matchingOpp.category,
            applicationId: app._id ? app._id.toString() : app.id,
            applicationStatus: app.status,
            partnerId: partnerIdentifier,
            partnerEmail: studentEmail,
            partnerName,
            partnerRole: 'student',
            partnerInstitution: app.studentInstitution || studentUser?.institution || matchingOpp.institution,
            partnerDepartment: app.studentDepartment || studentUser?.department || 'Computer Science',
            partnerAcademicYear: app.studentAcademicYear || studentUser?.academicYear || 'Undergraduate',
            partnerAvatar: partnerName.charAt(0) || 'S',
            isOnline: isUserOnline(partnerIdentifier) || isUserOnline(studentEmail),
            lastMessage: lastMsg ? lastMsg.message : 'No messages yet. Send an inquiry or interview update.',
            lastMessageTime: lastMsg ? lastMsg.createdAt : app.createdAt || app.appliedAt,
            unreadCount,
          });
        }
      }
    }

    // If no active conversations, provide realistic demo sample conversation thread
    if (conversations.length === 0) {
      if (currentUserRole === 'student') {
        const opp = (await opportunities.findOne({})) || {
          _id: new ObjectId('6aea2d7ac41b2188f4a03b01'),
          title: 'Quantum Information & Bio-Molecular Simulation Lab',
          category: 'Research Project',
          teacherName: 'Dr. Ramesh Kumar',
          teacherEmail: 'ramesh.kumar@abc.edu',
          institution: 'ABC University & Stanford Research',
          department: 'School of Artificial Intelligence',
        };
        const oppIdString = opp._id ? opp._id.toString() : (opp.id || '6aea2d7ac41b2188f4a03b01');
        const partnerIdentifier = opp.teacherId || opp.teacherEmail || 'ramesh.kumar@abc.edu';

        conversations.push({
          roomId: buildRoomId(oppIdString, currentUserId, partnerIdentifier),
          opportunityId: oppIdString,
          opportunityTitle: opp.title,
          opportunityCategory: opp.category || 'Research Project',
          partnerId: partnerIdentifier,
          partnerEmail: opp.teacherEmail || 'ramesh.kumar@abc.edu',
          partnerName: opp.teacherName || 'Dr. Ramesh Kumar',
          partnerRole: 'teacher',
          partnerInstitution: opp.institution || 'ABC University',
          partnerDepartment: opp.department || 'School of Artificial Intelligence',
          partnerDesignation: 'Associate Professor & Principal Investigator',
          partnerAvatar: (opp.teacherName || 'R').charAt(0),
          isOnline: true,
          lastMessage: 'Certainly! We primarily utilize Python, Qiskit for quantum circuit synthesis, and PyTorch.',
          lastMessageTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          unreadCount: 1,
        });
      } else {
        const opp = (await opportunities.findOne({})) || {
          _id: new ObjectId('6aea2d7ac41b2188f4a03b01'),
          title: 'Quantum Information & Bio-Molecular Simulation Lab',
        };
        const oppIdString = opp._id ? opp._id.toString() : (opp.id || '6aea2d7ac41b2188f4a03b01');
        const partnerIdentifier = 'alex.johnson@university.edu';

        conversations.push({
          roomId: buildRoomId(oppIdString, currentUserId, partnerIdentifier),
          opportunityId: oppIdString,
          opportunityTitle: opp.title,
          opportunityCategory: 'Research Project',
          partnerId: partnerIdentifier,
          partnerEmail: 'alex.johnson@university.edu',
          partnerName: 'Alex Johnson',
          partnerRole: 'student',
          partnerInstitution: 'Stanford University',
          partnerDepartment: 'Computer Science & Engineering',
          partnerAcademicYear: 'Third Year',
          partnerAvatar: 'A',
          isOnline: true,
          lastMessage: 'Hello Professor! I submitted my application and uploaded project links. Looking forward to discussing the research milestones.',
          lastMessageTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          unreadCount: 1,
        });
      }
    }

    // Sort conversations: most recent message first
    conversations.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

    return res.status(200).json({
      success: true,
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    console.error('getConversations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversations.',
      error: error.message,
    });
  }
}

/**
 * Get Message History for a specific conversation
 * GET /api/messages/history/:opportunityId/:partnerId
 */
export async function getConversationHistory(req, res) {
  try {
    const currentUserId = req.user?.userId;
    const currentUserEmail = req.user?.email?.toLowerCase();
    const currentUserRole = req.user?.role;
    const { opportunityId, partnerId } = req.params;

    if (!currentUserId && !currentUserEmail) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!opportunityId || !partnerId) {
      return res.status(400).json({ success: false, message: 'opportunityId and partnerId are required.' });
    }

    // Verify conversation access
    const check = await verifyConversationAccess(currentUserId, currentUserEmail, currentUserRole, opportunityId, partnerId);
    if (!check.allowed) {
      return res.status(403).json({
        success: false,
        message: `Conversation access denied: ${check.reason}`,
      });
    }

    const { messages } = getCollections();

    // Query all messages between current user and partner for this opportunity
    const list = await messages
      .find({
        opportunityId: String(opportunityId).trim(),
        $or: [
          { senderId: { $in: [currentUserId, currentUserEmail] }, receiverId: { $in: [partnerId, partnerId.toLowerCase()] } },
          { senderId: { $in: [partnerId, partnerId.toLowerCase()] }, receiverId: { $in: [currentUserId, currentUserEmail] } },
        ],
      })
      .sort({ createdAt: 1 })
      .toArray();

    if (list.length === 0) {
      const isStudent = currentUserRole === 'student';
      const sampleMessages = [
        {
          id: 'demo-msg-1',
          senderId: isStudent ? partnerId : (currentUserId || currentUserEmail),
          senderName: isStudent ? 'Dr. Ramesh Kumar' : (req.user?.name || 'Faculty Mentor'),
          senderRole: 'teacher',
          receiverId: isStudent ? (currentUserId || currentUserEmail) : partnerId,
          opportunityId: String(opportunityId).trim(),
          message: isStudent 
            ? `Hello ${req.user?.name || 'there'}! Welcome to ScholarConnect. I'm Dr. Ramesh Kumar, Principal Investigator for the "${check.opportunity?.title || 'Research Project'}". Feel free to ask questions about our research projects, lab setup, or technical prerequisites here!`
            : `Hello! Thank you for applying to our lab. Feel free to ask any questions regarding our lab setup or milestones here.`,
          isRead: true,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'demo-msg-2',
          senderId: isStudent ? (currentUserId || currentUserEmail) : partnerId,
          senderName: isStudent ? (req.user?.name || 'Student') : 'Alex Johnson',
          senderRole: 'student',
          receiverId: isStudent ? partnerId : (currentUserId || currentUserEmail),
          opportunityId: String(opportunityId).trim(),
          message: isStudent
            ? `Hello Dr. Kumar! Thank you for reaching out. I'm very interested in quantum computing and molecular dynamics simulations. Could you share more details about the software stack you use in the lab?`
            : `Hello Professor! I've worked with PyTorch and Python computer vision pipelines and would love to contribute to this research.`,
          isRead: true,
          createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'demo-msg-3',
          senderId: isStudent ? partnerId : (currentUserId || currentUserEmail),
          senderName: isStudent ? 'Dr. Ramesh Kumar' : (req.user?.name || 'Faculty Mentor'),
          senderRole: 'teacher',
          receiverId: isStudent ? (currentUserId || currentUserEmail) : partnerId,
          opportunityId: String(opportunityId).trim(),
          message: isStudent
            ? `Certainly! We primarily utilize Python, Qiskit for quantum circuit synthesis, and PyTorch for our deep learning models. We also run simulations on GPU clusters. Feel free to explore our opportunity details and let me know if you have any questions!`
            : `Great background! I will review your submitted transcript and repository links shortly.`,
          isRead: true,
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
      ];
      return res.status(200).json({
        success: true,
        count: sampleMessages.length,
        opportunity: check.opportunity,
        application: check.application,
        partnerOnline: true,
        messages: sampleMessages,
      });
    }

    const formatted = list.map((msg) => ({
      id: msg._id.toString(),
      _id: msg._id,
      senderId: msg.senderId,
      senderName: msg.senderName,
      senderRole: msg.senderRole,
      receiverId: msg.receiverId,
      opportunityId: msg.opportunityId,
      applicationId: msg.applicationId,
      message: msg.message,
      isRead: Boolean(msg.isRead),
      readAt: msg.readAt,
      createdAt: msg.createdAt,
    }));

    // Auto mark received unread messages as read
    await messages.updateMany(
      {
        opportunityId: String(opportunityId).trim(),
        senderId: { $in: [partnerId, partnerId.toLowerCase()] },
        receiverId: { $in: [currentUserId, currentUserEmail] },
        isRead: false,
      },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return res.status(200).json({
      success: true,
      count: formatted.length,
      opportunity: check.opportunity,
      application: check.application,
      partnerOnline: isUserOnline(partnerId),
      messages: formatted,
    });
  } catch (error) {
    console.error('getConversationHistory error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve message history.',
      error: error.message,
    });
  }
}

/**
 * Send a Message (REST Endpoint fallback)
 * POST /api/messages
 */
export async function sendMessage(req, res) {
  try {
    const currentUserId = req.user?.userId;
    const currentUserEmail = req.user?.email?.toLowerCase();
    const currentUserRole = req.user?.role;
    const currentUserName = req.user?.name || req.body.senderName || 'Scholar User';

    const { receiverId, opportunityId, message, applicationId, tempId } = req.body;

    if (!receiverId || !opportunityId || !message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'receiverId, opportunityId, and message are required.',
      });
    }

    // Access check
    const check = await verifyConversationAccess(currentUserId, currentUserEmail, currentUserRole, opportunityId, receiverId);
    if (!check.allowed) {
      return res.status(403).json({
        success: false,
        message: `Cannot send message: ${check.reason}`,
      });
    }

    const { messages, notifications } = getCollections();

    const newMessage = {
      senderId: currentUserId || currentUserEmail,
      senderEmail: currentUserEmail,
      senderName: currentUserName,
      senderRole: currentUserRole,
      receiverId: String(receiverId).trim(),
      opportunityId: String(opportunityId).trim(),
      opportunityTitle: check.opportunity?.title || 'Research Opportunity',
      applicationId: applicationId || (check.application?._id?.toString() || null),
      message: message.trim(),
      createdAt: new Date(),
      isRead: false,
      readAt: null,
    };

    const result = await messages.insertOne(newMessage);
    const savedMessage = {
      id: result.insertedId.toString(),
      _id: result.insertedId,
      ...newMessage,
    };

    // Notification
    try {
      await notifications.insertOne({
        userId: String(receiverId).trim(),
        userEmail: String(receiverId).trim().toLowerCase(),
        title: `New Message from ${currentUserName}`,
        message: `${currentUserName}: "${message.trim().slice(0, 70)}${message.length > 70 ? '...' : ''}"`,
        type: 'message',
        isRead: false,
        relatedId: savedMessage.id,
        opportunityId: String(opportunityId).trim(),
        senderId: currentUserId || currentUserEmail,
        senderName: currentUserName,
        createdAt: new Date(),
      });
    } catch {}

    // Emit via Socket.IO if initialized
    const io = getIO();
    if (io) {
      const roomId = buildRoomId(opportunityId, currentUserId || currentUserEmail, receiverId);
      io.to(roomId).emit('receive_message', savedMessage);
      emitToUser(receiverId, 'new_message_notification', {
        message: savedMessage,
        senderName: currentUserName,
      });
    }

    // Email notification if offline/unread (cooldown enforced, zero private body)
    try {
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
          senderName: currentUserName,
          senderRole: currentUserRole,
          opportunityTitle: check.opportunity?.title || 'Research Opportunity',
          opportunityId,
          senderId: currentUserId || currentUserEmail,
          isStudent: receiverDoc.role === 'student',
        }).catch((err) => console.warn('[REST Message Email Warning]:', err.message));
      }
    } catch {}

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully.',
      tempId,
      data: savedMessage,
    });
  } catch (error) {
    console.error('sendMessage error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message.',
      error: error.message,
    });
  }
}

/**
 * Mark messages as read
 * PUT /api/messages/read/:opportunityId/:partnerId
 */
export async function markAsRead(req, res) {
  try {
    const currentUserId = req.user?.userId;
    const currentUserEmail = req.user?.email?.toLowerCase();
    const { opportunityId, partnerId } = req.params;

    const { messages, notifications } = getCollections();
    const now = new Date();

    const updateResult = await messages.updateMany(
      {
        opportunityId: String(opportunityId).trim(),
        senderId: { $in: [partnerId, partnerId.toLowerCase()] },
        receiverId: { $in: [currentUserId, currentUserEmail] },
        isRead: false,
      },
      { $set: { isRead: true, readAt: now } }
    );

    // Update notifications
    try {
      await notifications.updateMany(
        {
          userId: { $in: [currentUserId, currentUserEmail] },
          type: 'message',
          senderId: partnerId,
          isRead: false,
        },
        { $set: { isRead: true, readAt: now } }
      );
    } catch {}

    // Broadcast read receipt via Socket
    const io = getIO();
    if (io) {
      const roomId = buildRoomId(opportunityId, currentUserId, partnerId);
      io.to(roomId).emit('message_read', {
        readBy: currentUserId,
        opportunityId,
        partnerId,
        readAt: now,
        count: updateResult.modifiedCount,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Messages marked as read.',
      modifiedCount: updateResult.modifiedCount,
    });
  } catch (error) {
    console.error('markAsRead error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get total unread messages count for current user
 * GET /api/messages/unread/count
 */
export async function getUnreadCount(req, res) {
  try {
    const currentUserId = req.user?.userId;
    const currentUserEmail = req.user?.email?.toLowerCase();

    if (!currentUserId && !currentUserEmail) {
      return res.status(200).json({ success: true, count: 0 });
    }

    const { messages } = getCollections();
    const count = await messages.countDocuments({
      receiverId: { $in: [currentUserId, currentUserEmail] },
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      count,
      unreadCount: count,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get User Messages (legacy compatibility)
 * GET /api/messages/:userId
 */
export async function getUserMessages(req, res) {
  try {
    const { userId } = req.params;
    const { messages } = getCollections();

    const list = await messages
      .find({
        $or: [{ senderId: userId }, { receiverId: userId }],
      })
      .sort({ createdAt: 1 })
      .toArray();

    const formatted = list.map((msg) => ({
      id: msg._id.toString(),
      ...msg,
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      messages: formatted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve messages.',
      error: error.message,
    });
  }
}