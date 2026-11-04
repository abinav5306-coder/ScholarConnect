import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Send, 
  Search, 
  Check, 
  CheckCheck, 
  Clock, 
  MessageSquare, 
  ArrowLeft, 
  Building2, 
  GraduationCap, 
  Briefcase, 
  ShieldCheck, 
  RefreshCw, 
  Sparkles,
  Inbox,
  UserCheck
} from 'lucide-react';
import TeacherLayout from '../../layouts/TeacherLayout';
import { useScholar } from '../../context/ScholarContext';
import { messageAPI } from '../../services/api';
import { 
  getSocket, 
  joinRoom, 
  sendSocketMessage, 
  sendTypingStart, 
  sendTypingStop, 
  sendMarkAsRead, 
  subscribeToSocketEvent,
  connectSocket
} from '../../services/socket.js';

export default function TeacherMessagesPage() {
  const { teacherProfile, opportunities, applications } = useScholar();
  const [searchParams] = useSearchParams();

  // Selected chat params from URL
  const paramOppId = searchParams.get('opportunityId');
  const paramPartnerId = searchParams.get('partnerId');

  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const currentUserId = teacherProfile.id || teacherProfile.email;
  const currentUserEmail = teacherProfile.email;

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // 1. Fetch Conversations from API
  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const res = await messageAPI.getConversations();

      if (res && res.success && Array.isArray(res.conversations)) {
        setConversations(res.conversations);

        // Auto select if query params present
        if (paramOppId) {
          const match = res.conversations.find(
            (c) => c.opportunityId === paramOppId && (!paramPartnerId || c.partnerId === paramPartnerId || c.partnerEmail === paramPartnerId)
          );
          if (match) {
            setSelectedChat(match);
            setShowMobileChat(true);
            return;
          }
        }

        // Default to first conversation
        if (res.conversations.length > 0 && !selectedChat) {
          setSelectedChat(res.conversations[0]);
        }
      } else {
        buildFallbackConversations();
      }
    } catch (err) {
      console.warn('API getConversations notice:', err.message);
      buildFallbackConversations();
    } finally {
      setLoadingConversations(false);
    }
  };

  // Fallback builder
  const buildFallbackConversations = () => {
    // Collect applicants across all teacher's opportunities
    const list = applications.map((app) => {
      const studentName = app.studentName || app.name || 'Student Applicant';
      const opp = opportunities.find((o) => o.id === app.opportunityId || o.title === app.opportunityTitle) || {};

      return {
        roomId: `room_${app.opportunityId}__${teacherProfile.email}__${app.studentEmail || 'student'}`,
        opportunityId: app.opportunityId,
        opportunityTitle: app.opportunityTitle || opp.title || 'Research Project',
        partnerId: app.studentId || app.studentEmail || 'student-demo',
        partnerEmail: app.studentEmail || 'student@university.edu',
        partnerName,
        partnerRole: 'student',
        partnerInstitution: app.studentInstitution || 'Stanford University',
        partnerDepartment: app.studentDepartment || 'Computer Science',
        partnerAcademicYear: app.studentAcademicYear || 'Third Year',
        partnerAvatar: studentName.charAt(0) || 'S',
        isOnline: true,
        lastMessage: 'I submitted my application and uploaded project links.',
        lastMessageTime: app.appliedAt || new Date().toISOString(),
        unreadCount: 0,
      };
    });

    if (list.length === 0) {
      const opp = (opportunities && opportunities[0]) || {
        id: '6aea2d7ac41b2188f4a03b01',
        title: 'Quantum Information & Bio-Molecular Simulation Lab',
      };
      list.push({
        roomId: `room_${opp.id}__${teacherProfile.email || 'mentor'}__aarav.sharma@university.edu`,
        opportunityId: opp.id,
        opportunityTitle: opp.title,
        partnerId: 'aarav.sharma@university.edu',
        partnerEmail: 'aarav.sharma@university.edu',
        partnerName: 'Aarav Sharma',
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

    setConversations(list);
    if (!selectedChat && list.length > 0) {
      setSelectedChat(list[0]);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [applications.length]);

  // 2. Fetch Message History when selectedChat changes
  useEffect(() => {
    if (!selectedChat) return;

    let isMounted = true;
    const fetchHistory = async () => {
      setLoadingMessages(true);
      try {
        const res = await messageAPI.getHistory(selectedChat.opportunityId, selectedChat.partnerId);
        if (isMounted && res && res.success && Array.isArray(res.messages)) {
          setMessages(res.messages);
        } else {
          setMessages([
            {
              id: 'init-1',
              senderRole: 'student',
              senderName: selectedChat.partnerName,
              message: `Hello Professor, I have applied to your project "${selectedChat.opportunityTitle}". I would love to discuss research objectives and timelines.`,
              createdAt: selectedChat.lastMessageTime || new Date(),
              isRead: true,
            },
          ]);
        }
      } catch (err) {
        setMessages([
          {
            id: 'init-1',
            senderRole: 'student',
            senderName: selectedChat.partnerName,
            message: `Hello Professor, I have applied to your project "${selectedChat.opportunityTitle}". I would love to discuss research objectives and timelines.`,
            createdAt: selectedChat.lastMessageTime || new Date(),
            isRead: true,
          },
        ]);
      } finally {
        if (isMounted) {
          setLoadingMessages(false);
          setTimeout(() => scrollToBottom('auto'), 100);
        }
      }
    };

    fetchHistory();

    // Join Socket Room
    const token = localStorage.getItem('scholarconnect_token');
    connectSocket(token);

    joinRoom({
      roomId: selectedChat.roomId,
      opportunityId: selectedChat.opportunityId,
      partnerId: selectedChat.partnerId,
      applicationId: selectedChat.applicationId,
    });

    sendMarkAsRead(selectedChat.roomId, selectedChat.opportunityId, selectedChat.partnerId);

    setConversations((prev) =>
      prev.map((c) =>
        c.opportunityId === selectedChat.opportunityId && c.partnerId === selectedChat.partnerId
          ? { ...c, unreadCount: 0 }
          : c
      )
    );

    return () => {
      isMounted = false;
    };
  }, [selectedChat?.opportunityId, selectedChat?.partnerId]);

  // 3. Socket Event Listeners
  useEffect(() => {
    const unsubReceive = subscribeToSocketEvent('receive_message', (newMsg) => {
      if (
        selectedChat &&
        newMsg.opportunityId === selectedChat.opportunityId &&
        (newMsg.senderId === selectedChat.partnerId || newMsg.receiverId === selectedChat.partnerId ||
         newMsg.senderEmail === selectedChat.partnerEmail || newMsg.receiverId === currentUserId)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id || (newMsg.tempId && m.tempId === newMsg.tempId))) {
            return prev.map((m) => (m.tempId === newMsg.tempId ? newMsg : m));
          }
          return [...prev, newMsg];
        });

        if (newMsg.senderRole !== 'teacher') {
          sendMarkAsRead(selectedChat.roomId, selectedChat.opportunityId, selectedChat.partnerId);
        }

        setTimeout(() => scrollToBottom('smooth'), 80);
      }

      setConversations((prev) =>
        prev.map((c) => {
          if (c.opportunityId === newMsg.opportunityId) {
            const isCurrentChat = selectedChat && selectedChat.opportunityId === c.opportunityId;
            return {
              ...c,
              lastMessage: newMsg.message,
              lastMessageTime: newMsg.createdAt,
              unreadCount: isCurrentChat || newMsg.senderRole === 'teacher' ? 0 : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        })
      );
    });

    const unsubTyping = subscribeToSocketEvent('typing_indicator', (data) => {
      if (selectedChat && data.opportunityId === selectedChat.opportunityId) {
        setPartnerTyping(Boolean(data.isTyping));
      }
    });

    const unsubRead = subscribeToSocketEvent('message_read', (data) => {
      if (selectedChat && data.opportunityId === selectedChat.opportunityId) {
        setMessages((prev) =>
          prev.map((m) => (m.senderRole === 'teacher' ? { ...m, isRead: true, readAt: data.readAt } : m))
        );
      }
    });

    const unsubOnline = subscribeToSocketEvent('user_online', (data) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.partnerId === data.userId || c.partnerEmail === data.email
            ? { ...c, isOnline: true }
            : c
        )
      );
    });

    const unsubOffline = subscribeToSocketEvent('user_offline', (data) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.partnerId === data.userId || c.partnerEmail === data.email
            ? { ...c, isOnline: false }
            : c
        )
      );
    });

    return () => {
      unsubReceive();
      unsubTyping();
      unsubRead();
      unsubOnline();
      unsubOffline();
    };
  }, [selectedChat, currentUserId]);

  // 4. Handle Typing
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputVal(val);

    if (!selectedChat) return;

    sendTypingStart(selectedChat.roomId, selectedChat.opportunityId, selectedChat.partnerId);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStop(selectedChat.roomId, selectedChat.opportunityId, selectedChat.partnerId);
    }, 1200);
  };

  // 5. Send Message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = inputVal.trim();
    if (!text || !selectedChat) return;

    const tempId = `temp_${Date.now()}`;
    const newMsgObj = {
      id: tempId,
      tempId,
      senderId: currentUserId,
      senderRole: 'teacher',
      senderName: teacherProfile.fullName,
      receiverId: selectedChat.partnerId,
      opportunityId: selectedChat.opportunityId,
      opportunityTitle: selectedChat.opportunityTitle,
      message: text,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    setMessages((prev) => [...prev, newMsgObj]);
    setInputVal('');
    setTimeout(() => scrollToBottom('smooth'), 50);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTypingStop(selectedChat.roomId, selectedChat.opportunityId, selectedChat.partnerId);

    const socketDispatched = sendSocketMessage({
      receiverId: selectedChat.partnerId,
      opportunityId: selectedChat.opportunityId,
      applicationId: selectedChat.applicationId,
      message: text,
      tempId,
      roomId: selectedChat.roomId,
    });

    if (!socketDispatched) {
      try {
        const res = await messageAPI.send({
          receiverId: selectedChat.partnerId,
          opportunityId: selectedChat.opportunityId,
          applicationId: selectedChat.applicationId,
          message: text,
          tempId,
        });
        if (res && res.data) {
          setMessages((prev) => prev.map((m) => (m.tempId === tempId ? res.data : m)));
        }
      } catch (err) {
        console.warn('HTTP fallback message notice:', err.message);
      }
    }

    setConversations((prev) =>
      prev.map((c) =>
        c.opportunityId === selectedChat.opportunityId && c.partnerId === selectedChat.partnerId
          ? { ...c, lastMessage: `You: ${text}`, lastMessageTime: new Date().toISOString() }
          : c
      )
    );
  };

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase().trim();
    return conversations.filter(
      (c) =>
        c.partnerName.toLowerCase().includes(q) ||
        c.opportunityTitle.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  const formatMsgTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <TeacherLayout>
      <div className="space-y-6 text-left">
        
        {/* Banner Title */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Faculty Direct Candidate Messaging</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Messages & Candidate Inquiries
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Direct real-time communication with applicant students, research candidate shortlists, and lab assistants.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchConversations}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-teal-700 hover:bg-slate-50 transition-colors"
              title="Refresh messages"
            >
              <RefreshCw className={`w-4 h-4 ${loadingConversations ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Messaging Layout */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle grid grid-cols-1 md:grid-cols-12 overflow-hidden h-[620px]">
          
          {/* ================================================================= */}
          {/* LEFT COLUMN: APPLICANT CONVERSATIONS                              */}
          {/* ================================================================= */}
          <div className={`md:col-span-5 lg:col-span-4 border-r border-slate-100 flex flex-col h-full ${
            showMobileChat ? 'hidden md:flex' : 'flex'
          }`}>
            
            <div className="p-4 border-b border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Student Inquiries ({conversations.length})
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute inset-y-0 left-3 my-auto" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search students or projects..."
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 outline-none transition-all placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
              {loadingConversations ? (
                <div className="py-16 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-teal-600 mx-auto" />
                  <p className="text-xs text-slate-400">Loading candidate conversations...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="py-16 text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">No applicant inquiries</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    When students apply to your research opportunities, direct messaging channels are established here.
                  </p>
                  <Link
                    to="/teacher/applicants"
                    className="inline-block mt-2 px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold shadow-xs hover:bg-teal-800"
                  >
                    View Applicants
                  </Link>
                </div>
              ) : (
                filteredConversations.map((chat) => {
                  const isSelected = selectedChat && selectedChat.opportunityId === chat.opportunityId && selectedChat.partnerId === chat.partnerId;

                  return (
                    <div
                      key={chat.roomId || `${chat.opportunityId}_${chat.partnerId}`}
                      onClick={() => {
                        setSelectedChat(chat);
                        setShowMobileChat(true);
                      }}
                      className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-teal-50/80 border-teal-200 shadow-2xs'
                          : 'border-transparent hover:bg-slate-50 hover:border-slate-100'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-700 to-teal-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                            {chat.partnerAvatar}
                          </div>
                          {chat.isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" title="Online now" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 text-xs">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-bold text-slate-900 truncate max-w-[130px]">
                              {chat.partnerName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatMsgTime(chat.lastMessageTime)}
                            </span>
                          </div>

                          <p className="text-[11px] font-semibold text-teal-800 truncate">
                            {chat.opportunityTitle}
                          </p>

                          <div className="flex items-center justify-between mt-1">
                            <p className="text-slate-500 text-[11px] truncate max-w-[160px]">
                              {chat.lastMessage}
                            </p>
                            {chat.unreadCount > 0 && (
                              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-teal-700 text-white text-[10px] font-bold shrink-0">
                                {chat.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* ================================================================= */}
          {/* RIGHT COLUMN: ACTIVE CHAT THREAD                                  */}
          {/* ================================================================= */}
          <div className={`md:col-span-7 lg:col-span-8 flex flex-col h-full bg-white ${
            showMobileChat ? 'flex' : 'hidden md:flex'
          }`}>
            
            {selectedChat ? (
              <>
                <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between gap-4 bg-white/80 backdrop-blur-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setShowMobileChat(false)}
                      className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">
                        {selectedChat.partnerAvatar}
                      </div>
                      {selectedChat.isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                      )}
                    </div>

                    <div className="min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-slate-900 text-sm truncate">
                          {selectedChat.partnerName}
                        </h3>
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-800 rounded-full text-[10px] font-bold border border-teal-200">
                          <UserCheck className="w-3 h-3" />
                          <span>Student Applicant</span>
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                        <span className="font-semibold text-teal-800">{selectedChat.opportunityTitle}</span>
                        <span>•</span>
                        <span>{selectedChat.partnerDepartment} ({selectedChat.partnerAcademicYear})</span>
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                      selectedChat.isOnline 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${selectedChat.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      <span>{selectedChat.isOnline ? 'Online' : 'Offline'}</span>
                    </span>
                  </div>
                </div>

                <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto bg-slate-50/50">
                  {loadingMessages ? (
                    <div className="py-20 text-center space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-teal-600 mx-auto" />
                      <p className="text-xs text-slate-400">Loading conversation history...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="py-20 text-center space-y-2">
                      <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-500 font-semibold">Message candidate</p>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                        Inquire about availability, interview rounds, or share lab instructions.
                      </p>
                    </div>
                  ) : (
                    messages.map((m, idx) => {
                      const isMe = m.senderRole === 'teacher' || m.senderId === currentUserId;

                      return (
                        <div
                          key={m.id || m._id || idx}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fadeIn`}
                        >
                          <div
                            className={`max-w-md sm:max-w-lg p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs text-left ${
                              isMe
                                ? 'bg-teal-700 text-white rounded-br-none'
                                : 'bg-white text-slate-800 rounded-bl-none border border-slate-200/80'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{m.message}</p>
                          </div>

                          <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-slate-400">
                            <span>{formatMsgTime(m.createdAt)}</span>
                            {isMe && (
                              m.isRead ? (
                                <span className="text-teal-600 flex items-center" title="Read by student">
                                  <CheckCheck className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="text-slate-400 flex items-center" title="Sent to student">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {partnerTyping && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 animate-fadeIn">
                      <div className="px-3 py-2 bg-white rounded-2xl border border-slate-200 text-slate-600 text-[11px] flex items-center gap-2 shadow-2xs">
                        <span className="flex gap-1 items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce" />
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce [animation-delay:0.4s]" />
                        </span>
                        <span className="font-semibold text-teal-800">{selectedChat.partnerName} is typing...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <form
                  onSubmit={handleSendMessage}
                  className="p-3 sm:p-4 bg-white border-t border-slate-100 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputVal}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={`Message ${selectedChat.partnerName}... (Press Enter to send)`}
                    className="flex-1 text-xs sm:text-sm pl-4 pr-3 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none transition-all placeholder:text-slate-400 font-medium"
                  />

                  <button
                    type="submit"
                    disabled={!inputVal.trim()}
                    className="p-3 sm:px-5 sm:py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-slate-50/40">
                <div className="w-14 h-14 rounded-3xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-xs">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Select a Candidate Thread
                </h3>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                  Choose a student applicant inquiry from the left sidebar to interview candidates, ask technical questions, or coordinate onboarding.
                </p>
              </div>
            )}

          </div>

        </div>

      </div>
    </TeacherLayout>
  );
}