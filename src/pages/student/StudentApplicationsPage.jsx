import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Building2, 
  User, 
  Calendar, 
  X, 
  Search, 
  Compass, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  Info,
  Lock,
  MessageSquare,
  Download
} from 'lucide-react';
import StudentLayout from '../../layouts/StudentLayout';
import { useScholar } from '../../context/ScholarContext';

const STATUS_TABS = [
  'All',
  'Submitted',
  'Under Review',
  'Shortlisted',
  'Selected',
  'Waiting List',
  'Not Selected'
];

const STATUS_BADGES = {
  'Submitted': 'bg-slate-100 text-slate-700 border-slate-200',
  'Under Review': 'bg-blue-50 text-blue-700 border-blue-200',
  'Shortlisted': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Selected': 'bg-purple-50 text-purple-700 border-purple-200',
  'Waiting List': 'bg-amber-50 text-amber-700 border-amber-200',
  'Not Selected': 'bg-rose-50 text-rose-700 border-rose-200',
};

// Required Status Messages for Application Tracking
const STATUS_MESSAGES = {
  'Selected': 'Congratulations! You have been selected for this opportunity.',
  'Waiting List': 'Your application is on the waiting list. We will notify you when an opportunity becomes available.',
  'Not Selected': "Thank you for your interest! Although you weren't selected this time, keep exploring new opportunities.",
  'Shortlisted': 'Congratulations! Your application has been shortlisted.',
  'Under Review': 'Your application is currently under review by the faculty mentor.',
  'Submitted': 'Your application has been successfully submitted and recorded.',
};

export default function StudentApplicationsPage() {
  const { applications, opportunities, downloadApplicantResume } = useScholar();
  const [activeTab, setActiveTab] = useState('All');
  const [searchFilter, setSearchFilter] = useState('');
  const [viewingApp, setViewingApp] = useState(null);

  // Map opportunity status to detect closed calls
  const oppMap = {};
  opportunities.forEach((o) => {
    oppMap[o.id] = o;
    if (o._id) oppMap[o._id] = o;
  });

  const filteredApplications = applications.filter((app) => {
    if (activeTab !== 'All' && app.status !== activeTab) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchTitle = app.opportunityTitle?.toLowerCase().includes(q);
      const matchTeacher = app.teacherName?.toLowerCase().includes(q);
      const matchInst = app.institution?.toLowerCase().includes(q);
      if (!matchTitle && !matchTeacher && !matchInst) return false;
    }
    return true;
  });

  return (
    <StudentLayout>
      <div className="space-y-6 text-left">
        
        {/* Header */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
                <FileText className="w-3.5 h-3.5" />
                <span>Real-Time Application Tracking</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                My Applications ({applications.length})
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Monitor faculty decisions, review status changes, and track your ongoing academic proposals.
              </p>
            </div>

            <Link
              to="/student/explore"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-semibold text-xs transition-colors self-start sm:self-auto shadow-xs"
            >
              <Compass className="w-4 h-4" />
              <span>Explore More</span>
            </Link>
          </div>

          {/* Search + Filter Tabs */}
          <div className="pt-2 flex flex-col md:flex-row md:items-center justify-between gap-3 border-t border-slate-100">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {STATUS_TABS.map((tab) => {
                const count = tab === 'All' 
                  ? applications.length 
                  : applications.filter((a) => a.status === tab).length;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      activeTab === tab
                        ? 'bg-indigo-700 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                    }`}
                  >
                    <span>{tab}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      activeTab === tab ? 'bg-indigo-900/60 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Keyword Filter */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter applications..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 p-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              No applications found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {applications.length === 0 
                ? "You haven't submitted any research applications yet. Browse active opportunities to get started."
                : "No applications match the current status filter."}
            </p>
            {applications.length === 0 && (
              <div className="pt-2">
                <Link
                  to="/student/explore"
                  className="px-5 py-2.5 rounded-xl bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-800"
                >
                  Explore Opportunities Now
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app) => {
              const appId = app.id || app._id;
              const linkedOpp = oppMap[app.opportunityId];
              const isOppClosed = linkedOpp?.status === 'Closed' || app.opportunityStatus === 'Closed';
              const statusMsg = STATUS_MESSAGES[app.status] || app.statusMessage || '';

              return (
                <div
                  key={appId}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 sm:p-6 hover:shadow-card transition-all flex flex-col gap-4 text-left"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      {/* Category & Status Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {app.category || 'Research Opportunity'}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            STATUS_BADGES[app.status] || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {app.status}
                        </span>

                        {isOppClosed && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
                            <Lock className="w-3 h-3" />
                            <span>Opportunity Closed</span>
                          </span>
                        )}
                      </div>

                      {/* Opportunity Title */}
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                        {app.opportunityTitle}
                      </h3>

                      {/* Metadata: Teacher, Institution, Date */}
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600">
                        <span className="flex items-center gap-1 font-medium text-slate-800">
                          <User className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{app.teacherName || 'Faculty Mentor'}</span>
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{app.institution}</span>
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Applied on: {app.appliedAt}</span>
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons: Message Mentor & View Details */}
                    <div className="shrink-0 flex items-center gap-2">
                      <Link
                        to={`/student/messages?opportunityId=${app.opportunityId}&partnerId=${app.teacherEmail || app.teacherId || ''}`}
                        className="w-full md:w-auto px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Message Mentor</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => setViewingApp(app)}
                        className="w-full md:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
                      >
                        View Full Details
                      </button>
                    </div>
                  </div>

                  {/* Highlighted Status Message Banner as explicitly requested in Phase 5 */}
                  {statusMsg && (
                    <div
                      className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                        app.status === 'Selected'
                          ? 'bg-purple-50/90 border border-purple-200 text-purple-900 font-medium'
                          : app.status === 'Waiting List'
                          ? 'bg-amber-50/90 border border-amber-200 text-amber-900 font-medium'
                          : app.status === 'Shortlisted'
                          ? 'bg-emerald-50/90 border border-emerald-200 text-emerald-900 font-medium'
                          : app.status === 'Not Selected'
                          ? 'bg-rose-50/90 border border-rose-200 text-rose-900 font-medium'
                          : 'bg-slate-50 border border-slate-200 text-slate-700'
                      }`}
                    >
                      {app.status === 'Selected' && <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />}
                      {app.status === 'Shortlisted' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                      {app.status === 'Waiting List' && <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                      {app.status === 'Not Selected' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                      {(app.status === 'Submitted' || app.status === 'Under Review') && (
                        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold mr-1">Status Update:</span>
                        <span>{statusMsg}</span>
                      </div>
                    </div>
                  )}

                  {/* Closed opportunity explanation */}
                  {isOppClosed && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>This opportunity has closed applications. Your application record is securely preserved.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Modal: View Single Application Details */}
      {viewingApp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-xl max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100">
              <div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_BADGES[viewingApp.status] || 'bg-slate-100 text-slate-700'}`}>
                  {viewingApp.status}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">
                  {viewingApp.opportunityTitle}
                </h3>
                <p className="text-xs text-slate-500">
                  Mentor: {viewingApp.teacherName} • {viewingApp.institution}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingApp(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Status Message Highlight */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Decision Note:</span>
                <p className="text-slate-700">
                  {STATUS_MESSAGES[viewingApp.status] || viewingApp.statusMessage || 'Application received.'}
                </p>
              </div>

              {/* Applicant Info */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Applicant</span>
                  <span className="font-semibold text-slate-800">{viewingApp.studentName || viewingApp.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Academic Year</span>
                  <span className="font-semibold text-slate-800">{viewingApp.studentAcademicYear || viewingApp.academicYear}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Department</span>
                  <span className="font-semibold text-slate-800">{viewingApp.studentDepartment || viewingApp.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Date Applied</span>
                  <span className="font-semibold text-slate-800">{viewingApp.appliedAt}</span>
                </div>
              </div>

              {/* Submitted Statement */}
              <div>
                <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Submitted Statement of Interest
                </span>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 whitespace-pre-line leading-relaxed">
                  {viewingApp.statementOfInterest || viewingApp.whyInterested}
                </div>
              </div>

              {/* Prior Experience */}
              {viewingApp.experience && (
                <div>
                  <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Prior Experience
                  </span>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 whitespace-pre-line leading-relaxed">
                    {viewingApp.experience}
                  </div>
                </div>
              )}

              {/* Phase 9: Attached Resume */}
              {viewingApp.resume && viewingApp.resume.fileName && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">
                        {viewingApp.resume.originalName || 'Attached Resume.pdf'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {viewingApp.resume.isCustom ? 'Tailored Application Resume' : 'Profile Resume Snapshot'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadApplicantResume(viewingApp.id || viewingApp._id, viewingApp.studentName || 'My')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingApp(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </StudentLayout>
  );
}
