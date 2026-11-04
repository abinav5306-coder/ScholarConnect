import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Compass, 
  FileText, 
  Bookmark, 
  CheckCircle2, 
  GraduationCap, 
  Award,
  ChevronRight
} from 'lucide-react';
import StudentLayout from '../../layouts/StudentLayout';
import OpportunityCard from '../../components/opportunities/OpportunityCard';
import OpportunityDetailModal from '../../components/opportunities/OpportunityDetailModal';
import ApplyModal from '../../components/opportunities/ApplyModal';
import { useScholar } from '../../context/ScholarContext';

export default function StudentDashboardPage() {
  const { 
    studentProfile, 
    opportunities, 
    applications, 
    savedOpportunities 
  } = useScholar();

  const [selectedOpp, setSelectedOpp] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  // Active opportunities (excluding closed)
  const activeOpportunities = opportunities.filter((o) => o.status !== 'Closed');

  // Shortlisted count
  const shortlistedCount = applications.filter((a) => a.status === 'Shortlisted').length;

  // Handlers for cards
  const handleViewDetails = (opp) => {
    setSelectedOpp(opp);
    setDetailModalOpen(true);
  };

  const handleApply = (opp) => {
    setSelectedOpp(opp);
    setApplyModalOpen(true);
  };

  return (
    <StudentLayout>
      <div className="space-y-8 text-left">
        
        {/* Welcome Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-700 text-white p-6 sm:p-8 shadow-card">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20 text-indigo-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Academic Year 2026–2027</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {studentProfile.fullName}!
            </h1>
            <p className="text-sm text-indigo-100 leading-relaxed font-normal">
              Explore open research assistantships, interdisciplinary hackathons, and lab positions matching your interests in <strong>{studentProfile.department}</strong>.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/student/explore"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-900 font-bold text-xs hover:bg-indigo-50 shadow-sm transition-all"
              >
                <Compass className="w-4 h-4 text-indigo-700" />
                <span>Explore Opportunities</span>
              </Link>
              <Link
                to="/student/profile"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs backdrop-blur-sm transition-all"
              >
                <span>Edit Profile</span>
              </Link>
            </div>
          </div>

          {/* Ambient background graphical rings */}
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-white/5 pointer-events-none blur-2xl"></div>
          <div className="absolute right-12 bottom-6 opacity-10 hidden md:block">
            <GraduationCap className="w-48 h-48 text-white" />
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500">Active Opportunities</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {activeOpportunities.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Across 180+ research universities</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500">Applications Submitted</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {applications.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {applications.length > 0 ? 'Tracked in My Applications' : 'No applications yet'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500">Shortlisted</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {shortlistedCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Lab interview invitations</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500">Saved Opportunities</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Bookmark className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {savedOpportunities.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Bookmarked for later</p>
          </div>

        </div>

        {/* Two-Column Section: Recommended Opportunities & Recent Applications Tracker */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          
          {/* Left Column (8 cols): Recommended Opportunities */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Recommended For You
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Curated based on your skills in {studentProfile.skills?.slice(0, 3).join(', ')}
                </p>
              </div>
              <Link
                to="/student/explore"
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 flex items-center gap-1 hover:underline"
              >
                <span>View all ({opportunities.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opportunities.slice(0, 4).map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onViewDetails={handleViewDetails}
                  onApply={handleApply}
                />
              ))}
            </div>
          </div>

          {/* Right Column (4 cols): Profile Snapshot & Recent Applications */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Profile Snapshot Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Profile Status
                </span>
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified Student
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Institution</span>
                  <span className="font-semibold text-slate-800">{studentProfile.institution}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Program & Year</span>
                  <span className="font-semibold text-slate-800">
                    {studentProfile.degree} • {studentProfile.academicYear} (Class of {studentProfile.graduationYear})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Technical Skills</span>
                  <div className="flex flex-wrap gap-1">
                    {studentProfile.skills?.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/student/profile"
                  className="block w-full py-2.5 text-center text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl transition-colors"
                >
                  Manage Full Profile
                </Link>
              </div>
            </div>

            {/* Recent Applications Tracker */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recent Applications
                </span>
                <Link
                  to="/student/applications"
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  View All
                </Link>
              </div>

              {applications.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  You haven't submitted any applications yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.slice(0, 3).map((app) => (
                    <div
                      key={app.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-900 line-clamp-1">
                          {app.opportunityTitle}
                        </span>
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            app.status === 'Shortlisted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'Under Review'
                              ? 'bg-blue-100 text-blue-800'
                              : app.status === 'Selected'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Mentor: {app.teacherName} • Applied on {app.appliedAt}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Modals */}
      <OpportunityDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        opportunity={selectedOpp}
        onApply={handleApply}
      />

      <ApplyModal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        opportunity={selectedOpp}
      />
    </StudentLayout>
  );
}
