import React from 'react';
import { CheckCircle2, AlertCircle, Users } from 'lucide-react';
import TeacherLayout from '../../layouts/TeacherLayout';

const NOTIFICATIONS = [
  {
    id: 1,
    title: 'New Student Application Received',
    desc: 'Aarav Sharma submitted an application for "Smart Agriculture Research Initiative".',
    time: '1 hour ago',
    type: 'info',
  },
  {
    id: 2,
    title: 'Opportunity Application Deadline Approaching',
    desc: 'The deadline for "National Innovation Hackathon" is in 3 days. 7 team applications have been received.',
    time: 'Yesterday',
    type: 'alert',
  },
  {
    id: 3,
    title: 'Institutional Affiliation Verified',
    desc: 'Your faculty profile with ABC University Department of Computer Science & Robotics is verified for the 2026-2027 academic session.',
    time: '4 days ago',
    type: 'success',
  }
];

export default function TeacherNotificationsPage() {
  return (
    <TeacherLayout>
      <div className="space-y-6 text-left">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Faculty Notifications & Alerts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time updates regarding opportunity deadlines, applicant submissions, and institutional alerts.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 divide-y divide-slate-100">
          {NOTIFICATIONS.map((n) => (
            <div key={n.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
              <div
                className={`p-2.5 rounded-2xl shrink-0 ${
                  n.type === 'success'
                    ? 'bg-emerald-50 text-emerald-600'
                    : n.type === 'alert'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-teal-50 text-teal-700'
                }`}
              >
                {n.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : n.type === 'alert' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <Users className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1 text-xs flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{n.title}</h3>
                  <span className="text-[11px] text-slate-400">{n.time}</span>
                </div>
                <p className="text-slate-600 leading-relaxed">{n.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </TeacherLayout>
  );
}
