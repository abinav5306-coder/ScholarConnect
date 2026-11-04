import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, 
  Compass, 
  Users, 
  Award, 
  CheckCircle2, 
  Microscope, 
  ChevronRight, 
  TrendingUp
} from 'lucide-react';
import TeacherLayout from '../../layouts/TeacherLayout';
import { useScholar } from '../../context/ScholarContext';

export default function TeacherDashboardPage() {
  const { 
    teacherProfile, 
    opportunities, 
    applications, 
    closeOpportunity,
    updateApplicationStatus 
  } = useScholar();

  // Active opportunities count
  const activeOpps = opportunities.filter((o) => o.status !== 'Closed');

  // Shortlisted students count
  const shortlistedCount = applications.filter((a) => a.status === 'Shortlisted').length;

  return (
    <TeacherLayout>
      <div className="space-y-8 text-left">
        
        {/* Welcome Hero Banner with Teal Theme */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900 via-teal-800 to-teal-700 text-white p-6 sm:p-8 shadow-card">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20 text-teal-100">
              <Microscope className="w-3.5 h-3.5 text-teal-300" />
              <span>Faculty & Researcher Gateway</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {teacherProfile.fullName}
            </h1>
            <p className="text-sm text-teal-100 leading-relaxed font-normal">
              Manage your academic laboratory positions, publish new inter-university calls, and review student talent submissions across partner universities.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/teacher/create-opportunity"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-teal-950 font-bold text-xs hover:bg-teal-50 shadow-sm transition-all"
              >
                <PlusCircle className="w-4 h-4 text-teal-700" />
                <span>+ Create New Opportunity</span>
              </Link>
              <Link
                to="/teacher/my-opportunities"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs backdrop-blur-sm transition-all"
              >
                <span>Manage Opportunities ({opportunities.length})</span>
              </Link>
            </div>
          </div>

          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-white/5 pointer-events-none blur-2xl"></div>
          <div className="absolute right-12 bottom-6 opacity-10 hidden md:block">
            <Microscope className="w-48 h-48 text-white" />
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500">Total Published</span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {opportunities.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Research & project calls</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500">Active Opportunities</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {activeOpps.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Accepting student applications</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500">Student Applications</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {applications.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Across all published calls</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500">Shortlisted Students</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-600">
              {shortlistedCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Ready for lab interview</p>
          </div>

        </div>

        {/* Main Content Grid: Published Opportunities & Recent Applicants */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          
          {/* Left Column (7 cols): Recently Published Opportunities */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Published Opportunities
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Research projects, hackathons, and assistantships live on the platform
                </p>
              </div>
              <Link
                to="/teacher/my-opportunities"
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 hover:underline"
              >
                <span>View All ({opportunities.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {opportunities.slice(0, 4).map((opp) => (
                <div
                  key={opp.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 hover:shadow-card transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                          {opp.category}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            opp.status === 'Closed'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {opp.status}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        {opp.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {opp.institution} • Deadline: {opp.deadline}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-lg font-extrabold text-teal-700 block">
                        {opp.applicantsCount || 0}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">Applicants</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 text-[11px]">
                      Mode: <strong>{opp.workMode || 'Hybrid'}</strong> • {opp.positions} positions
                    </span>
                    <div className="flex items-center gap-2">
                      {opp.status !== 'Closed' && (
                        <button
                          type="button"
                          onClick={() => closeOpportunity(opp.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                        >
                          Close Call
                        </button>
                      )}
                      <Link
                        to="/teacher/applicants"
                        className="px-3 py-1 text-[11px] font-semibold bg-teal-50 text-teal-800 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200"
                      >
                        View Applicants
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column (5 cols): Recent Student Applicants & Opportunity Performance */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Quick Create Opportunity Card */}
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
                <PlusCircle className="w-4 h-4 text-teal-700" />
                <span>Publish New Opportunity</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Need research assistants or student teams? Publish a verified call. It will appear immediately in the Student Explore portal.
              </p>
              <Link
                to="/teacher/create-opportunity"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                <span>+ Create Opportunity Now</span>
              </Link>
            </div>

            {/* Recent Student Applications */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recent Student Applicants
                </span>
                <Link
                  to="/teacher/applicants"
                  className="text-xs font-semibold text-teal-700 hover:underline"
                >
                  Manage All ({applications.length})
                </Link>
              </div>

              {applications.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No student applications received yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.slice(0, 4).map((app) => (
                    <div
                      key={app.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {app.studentName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {app.studentDepartment} • {app.studentAcademicYear}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                            app.status === 'Shortlisted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'Under Review'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-teal-700 font-medium truncate">
                        Applied for: {app.opportunityTitle}
                      </p>
                      
                      {/* Quick status actions */}
                      <div className="pt-1.5 flex items-center gap-1.5 text-[11px]">
                        <span className="text-slate-400">Update:</span>
                        <button
                          type="button"
                          onClick={() => updateApplicationStatus(app.id, 'Shortlisted')}
                          className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded border border-emerald-200 font-medium"
                        >
                          Shortlist
                        </button>
                        <button
                          type="button"
                          onClick={() => updateApplicationStatus(app.id, 'Under Review')}
                          className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 font-medium"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Performance Overview Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-900 font-bold text-xs">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <span>Opportunity Performance Overview</span>
              </div>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Average Applications per Call:</span>
                  <strong className="text-slate-900">
                    {opportunities.length > 0 ? (applications.length / opportunities.length).toFixed(1) : 0}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Student Review Rate:</span>
                  <strong className="text-slate-900">
                    {applications.length > 0 
                      ? `${Math.round((applications.filter(a => a.status !== 'Submitted').length / applications.length) * 100)}%`
                      : '100%'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Verified Universities Participating:</span>
                  <strong className="text-slate-900">6 Institutions</strong>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </TeacherLayout>
  );
}
