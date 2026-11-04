import React from 'react';
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  CheckCheck, 
  Sparkles,
  Inbox
} from 'lucide-react';
import StudentLayout from '../../layouts/StudentLayout';
import { useScholar } from '../../context/ScholarContext';

export default function StudentNotificationsPage() {
  const { 
    notifications, 
    unreadNotificationsCount, 
    markNotificationAsRead, 
    markAllNotificationsAsRead 
  } = useScholar();

  const handleMarkAsRead = (id) => {
    markNotificationAsRead(id);
  };

  const handleMarkAll = () => {
    markAllNotificationsAsRead();
  };

  return (
    <StudentLayout>
      <div className="space-y-6 text-left">
        {/* Header */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Bell className="w-3.5 h-3.5" />
                <span>MongoDB Live Notification Stream</span>
              </span>
              {unreadNotificationsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-600 text-white">
                  {unreadNotificationsCount} New
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Notifications & Status Updates
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Automatic alerts generated when faculty mentors review your applications, update decisions, or publish new calls.
            </p>
          </div>

          {unreadNotificationsCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors self-start sm:self-auto shadow-2xs"
            >
              <CheckCheck className="w-4 h-4 text-indigo-600" />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                No notifications right now
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When you submit applications or when mentors update your candidate status, alerts will appear here in real time.
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              const notifId = n.id || n._id;
              const isUnread = !n.isRead;

              return (
                <div 
                  key={notifId} 
                  className={`py-4.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4 transition-colors ${
                    isUnread ? 'bg-indigo-50/30 -mx-3 px-3 rounded-2xl' : ''
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1">
                    <div
                      className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${
                        n.type === 'success' || n.status === 'Selected' || n.status === 'Shortlisted'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : n.type === 'alert' || n.status === 'Waiting List'
                          ? 'bg-amber-50 text-amber-600 border border-amber-100'
                          : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                      }`}
                    >
                      {n.status === 'Selected' ? (
                        <Sparkles className="w-5 h-5 text-purple-600" />
                      ) : n.status === 'Shortlisted' || n.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : n.status === 'Waiting List' || n.type === 'alert' ? (
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      ) : (
                        <Bell className="w-5 h-5 text-indigo-600" />
                      )}
                    </div>

                    <div className="space-y-1 text-xs flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">
                          {n.title}
                        </h3>
                        {isUnread && (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                            Unread
                          </span>
                        )}
                      </div>

                      <p className="text-slate-600 leading-relaxed">
                        {n.message || n.desc}
                      </p>

                      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                        {n.opportunityTitle && (
                          <span className="font-semibold text-slate-600">
                            {n.opportunityTitle}
                          </span>
                        )}
                        <span>
                          {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mark as read button */}
                  {isUnread && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(notifId)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors shrink-0"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
