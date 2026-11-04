import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Search, 
  CheckCircle2, 
  X, 
  CheckSquare, 
  Square, 
  Clock, 
  Award, 
  XCircle, 
  UserCheck, 
  Sparkles,
  MessageSquare,
  FileSpreadsheet,
  FileText,
  Download,
  Eye,
  Globe,
  RefreshCw,
  ExternalLink,
  Layers,
  GraduationCap,
  Building2
} from 'lucide-react';
import { LinkedinIcon, GithubIcon } from '../../components/icons/SocialIcons';
import TeacherLayout from '../../layouts/TeacherLayout';
import { useScholar } from '../../context/ScholarContext';

const STATUS_OPTIONS = [
  'All Statuses',
  'Submitted',
  'Under Review',
  'Shortlisted',
  'Selected',
  'Waiting List',
  'Not Selected',
];

const STATUS_BADGES = {
  'Submitted': 'bg-slate-100 text-slate-700 border-slate-200',
  'Under Review': 'bg-blue-50 text-blue-700 border-blue-200',
  'Shortlisted': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Selected': 'bg-purple-50 text-purple-700 border-purple-200',
  'Waiting List': 'bg-amber-50 text-amber-700 border-amber-200',
  'Not Selected': 'bg-rose-50 text-rose-700 border-rose-200',
};

const ACADEMIC_YEARS = [
  'All Years',
  'First Year',
  'Second Year',
  'Third Year',
  'Fourth Year',
  'Postgraduate',
  'Research Scholar',
];

export default function TeacherApplicantsPage() {
  const { 
    applications, 
    opportunities, 
    updateApplicationStatus, 
    updateBulkApplicationStatus,
    exportApplicantsExcel,
    exportApplicantsPdf,
    downloadApplicantResume,
    previewApplicantResume,
  } = useScholar();

  // Filters State
  const [selectedOppFilter, setSelectedOppFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All Statuses');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All Departments');
  const [selectedYearFilter, setSelectedYearFilter] = useState('All Years');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Feedback State
  const [viewingApp, setViewingApp] = useState(null);
  const [statusUpdatedAlert, setStatusUpdatedAlert] = useState('');
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Multi-student selection state
  const [selectedAppIds, setSelectedAppIds] = useState([]);
  const [bulkStatusTarget, setBulkStatusTarget] = useState('Selected');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Dynamic Departments from current applications
  const uniqueDepartments = useMemo(() => {
    const list = applications
      .map((app) => (app.studentDepartment || app.department || '').trim())
      .filter(Boolean);
    return ['All Departments', ...Array.from(new Set(list))];
  }, [applications]);

  // Filtered applicants list
  const filteredApplicants = useMemo(() => {
    return applications.filter((app) => {
      // Opportunity Filter
      if (selectedOppFilter !== 'All' && String(app.opportunityId) !== String(selectedOppFilter)) {
        return false;
      }
      // Status Filter
      if (selectedStatusFilter !== 'All Statuses' && app.status !== selectedStatusFilter) {
        return false;
      }
      // Department Filter
      if (selectedDeptFilter !== 'All Departments') {
        const appDept = (app.studentDepartment || app.department || '').toLowerCase();
        if (!appDept.includes(selectedDeptFilter.toLowerCase())) return false;
      }
      // Academic Year Filter
      if (selectedYearFilter !== 'All Years') {
        const appYear = app.studentAcademicYear || app.academicYear || '';
        if (appYear !== selectedYearFilter) return false;
      }
      // Search query (name, dept, college, opp title, skills)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (app.studentName || app.fullName)?.toLowerCase().includes(q);
        const matchDept = (app.studentDepartment || app.department)?.toLowerCase().includes(q);
        const matchInst = (app.studentInstitution || app.institution)?.toLowerCase().includes(q);
        const matchOpp = app.opportunityTitle?.toLowerCase().includes(q);
        const matchSkills = Array.isArray(app.studentSkills || app.skills)
          ? (app.studentSkills || app.skills).some((s) => String(s).toLowerCase().includes(q))
          : String(app.studentSkills || app.skills || '').toLowerCase().includes(q);

        if (!matchName && !matchDept && !matchInst && !matchOpp && !matchSkills) return false;
      }
      return true;
    });
  }, [
    applications,
    selectedOppFilter,
    selectedStatusFilter,
    selectedDeptFilter,
    selectedYearFilter,
    searchQuery,
  ]);

  // Single status change handler
  const handleStatusChange = async (appId, newStatus, studentName) => {
    await updateApplicationStatus(appId, newStatus);
    setStatusUpdatedAlert(`Application status for ${studentName} updated to "${newStatus}" and saved in MongoDB Atlas.`);
    if (viewingApp && (viewingApp.id === appId || viewingApp._id === appId)) {
      setViewingApp((prev) => ({ ...prev, status: newStatus }));
    }
    setTimeout(() => setStatusUpdatedAlert(''), 4500);
  };

  // Toggle selection for an individual applicant
  const toggleSelectApplicant = (appId) => {
    setSelectedAppIds((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  // Select all or deselect all visible applicants
  const handleToggleSelectAll = () => {
    const visibleIds = filteredApplicants.map((a) => a.id || a._id);
    const allSelected = visibleIds.every((id) => selectedAppIds.includes(id));
    if (allSelected) {
      setSelectedAppIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedAppIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Execute bulk status update
  const handleApplyBulkStatus = async () => {
    if (selectedAppIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      await updateBulkApplicationStatus(selectedAppIds, bulkStatusTarget);
      setStatusUpdatedAlert(
        `Successfully updated ${selectedAppIds.length} applicant(s) to "${bulkStatusTarget}" in MongoDB Atlas.`
      );
      setSelectedAppIds([]);
    } catch {
      setStatusUpdatedAlert('Error performing bulk update. Please try again.');
    } finally {
      setIsBulkUpdating(false);
      setTimeout(() => setStatusUpdatedAlert(''), 4500);
    }
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const filters = {
        opportunityId: selectedOppFilter,
        status: selectedStatusFilter,
        department: selectedDeptFilter,
        academicYear: selectedYearFilter,
        applicantIds: selectedAppIds.length > 0 ? selectedAppIds : filteredApplicants.map((a) => a.id || a._id),
      };
      await exportApplicantsExcel(filters);
      setStatusUpdatedAlert(`Successfully exported ${filters.applicantIds.length} applicant(s) to Excel (.xlsx).`);
    } catch (err) {
      setStatusUpdatedAlert(`Excel export failed: ${err.message}`);
    } finally {
      setIsExportingExcel(false);
      setTimeout(() => setStatusUpdatedAlert(''), 5000);
    }
  };

  // Export to PDF Report (.pdf)
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const filters = {
        opportunityId: selectedOppFilter,
        status: selectedStatusFilter,
        department: selectedDeptFilter,
        academicYear: selectedYearFilter,
        applicantIds: selectedAppIds.length > 0 ? selectedAppIds : filteredApplicants.map((a) => a.id || a._id),
      };
      await exportApplicantsPdf(filters);
      setStatusUpdatedAlert(`Successfully exported ${filters.applicantIds.length} applicant(s) to PDF report.`);
    } catch (err) {
      setStatusUpdatedAlert(`PDF report export failed: ${err.message}`);
    } finally {
      setIsExportingPdf(false);
      setTimeout(() => setStatusUpdatedAlert(''), 5000);
    }
  };

  const isAllVisibleSelected =
    filteredApplicants.length > 0 &&
    filteredApplicants.every((a) => selectedAppIds.includes(a.id || a._id));

  const exportCount = selectedAppIds.length > 0 ? selectedAppIds.length : filteredApplicants.length;

  return (
    <TeacherLayout>
      <div className="space-y-6 text-left pb-12">
        
        {/* Header & Export Toolbar */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 sm:p-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 mb-2">
                <Users className="w-3.5 h-3.5" />
                <span>Applicant Lifecycle, Dossiers & Export</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Manage Applicants ({applications.length})
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Review complete student dossiers, verified resumes, technical skills, and export filtered candidates to Excel or PDF reports.
              </p>
            </div>

            {/* Export Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={isExportingExcel || exportCount === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                title={`Export ${exportCount} matching applicants to Excel spreadsheet`}
              >
                {isExportingExcel ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4" />
                )}
                <span>Export Excel ({exportCount})</span>
              </button>

              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExportingPdf || exportCount === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                title={`Export ${exportCount} matching applicants to PDF dossier report`}
              >
                {isExportingPdf ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span>Export PDF ({exportCount})</span>
              </button>
            </div>
          </div>

          {/* Filters Row (Requirements 4 & 7) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student, college, skills..."
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-600 outline-none"
              />
            </div>

            {/* Filter by Opportunity */}
            <select
              value={selectedOppFilter}
              onChange={(e) => setSelectedOppFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 bg-white p-2.5 outline-none focus:border-teal-600 font-medium truncate"
            >
              <option value="All">All Opportunities ({opportunities.length})</option>
              {opportunities.map((o) => (
                <option key={o.id || o._id} value={o.id || o._id}>
                  {o.title}
                </option>
              ))}
            </select>

            {/* Filter by Status */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 bg-white p-2.5 outline-none focus:border-teal-600 font-medium"
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            {/* Filter by Department */}
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 bg-white p-2.5 outline-none focus:border-teal-600 font-medium truncate"
            >
              {uniqueDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {/* Filter by Academic Year */}
            <select
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 bg-white p-2.5 outline-none focus:border-teal-600 font-medium"
            >
              {ACADEMIC_YEARS.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status update alert toast */}
        {statusUpdatedAlert && (
          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 animate-fadeIn shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{statusUpdatedAlert}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusUpdatedAlert('')}
              className="p-1 rounded-lg hover:bg-black/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Multi-Student Selection & Bulk Action Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-teal-700 select-none cursor-pointer"
            >
              {isAllVisibleSelected ? (
                <CheckSquare className="w-4 h-4 text-teal-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Select All Visible ({filteredApplicants.length})</span>
            </button>

            {selectedAppIds.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
                {selectedAppIds.length} candidate(s) selected
              </span>
            )}
          </div>

          {/* Bulk Update Controls */}
          {selectedAppIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 animate-fadeIn">
              <span className="text-xs text-slate-500 font-medium">Set Status to:</span>
              <select
                value={bulkStatusTarget}
                onChange={(e) => setBulkStatusTarget(e.target.value)}
                className="text-xs rounded-xl border border-slate-300 bg-white p-2 font-bold outline-none"
              >
                <option value="Selected">Selected</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Under Review">Under Review</option>
                <option value="Waiting List">Waiting List</option>
                <option value="Not Selected">Not Selected</option>
              </select>

              <button
                type="button"
                onClick={handleApplyBulkStatus}
                disabled={isBulkUpdating}
                className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isBulkUpdating ? 'Updating...' : `Update Selected (${selectedAppIds.length})`}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAppIds([])}
                className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Applicants List */}
        {filteredApplicants.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 p-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              No applicants found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {applications.length === 0
                ? 'No students have applied yet. As students apply to your research opportunities, their dossiers will be listed here.'
                : 'No applicants match the current filter selection.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredApplicants.map((app) => {
              const appId = app.id || app._id;
              const isSelected = selectedAppIds.includes(appId);
              const hasResume = !!(app.resume && app.resume.fileName);

              return (
                <div
                  key={appId}
                  className={`bg-white rounded-2xl border transition-all p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${
                    isSelected
                      ? 'border-teal-400 ring-2 ring-teal-100 shadow-md bg-teal-50/20'
                      : 'border-slate-200/90 shadow-subtle hover:shadow-card'
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleSelectApplicant(appId)}
                      className="mt-1 p-0.5 rounded text-slate-400 hover:text-teal-600 cursor-pointer"
                      aria-label={`Select ${app.studentName || app.fullName}`}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-teal-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300 hover:text-slate-500" />
                      )}
                    </button>

                    <div className="space-y-2 flex-1">
                      {/* Name & Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-base">
                          {app.studentName || app.fullName}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-600 font-medium">
                          {app.studentDepartment || app.department} ({app.studentAcademicYear || app.academicYear})
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_BADGES[app.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {app.status}
                        </span>

                        {/* Resume Status Badge */}
                        {hasResume ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <FileText className="w-3 h-3 text-emerald-600" />
                            <span>Resume Attached</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            No Resume
                          </span>
                        )}
                      </div>

                      {/* Opportunity & Institution info */}
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1 font-semibold text-teal-800">
                          Applied for: {app.opportunityTitle}
                        </span>
                        <span>Institution: {app.studentInstitution || app.institution}</span>
                        <span>Date: {app.appliedAt}</span>
                      </div>

                      {/* Skills tags */}
                      {(app.studentSkills || app.skills) && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {(Array.isArray(app.studentSkills || app.skills)
                            ? (app.studentSkills || app.skills)
                            : (app.studentSkills || app.skills).split(',')
                          ).map((sk, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                              {typeof sk === 'string' ? sk.trim() : sk}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Social & Portfolio Links (Requirement 4) */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                        {app.portfolioUrl && (
                          <a
                            href={app.portfolioUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-teal-700 hover:underline font-semibold"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Portfolio</span>
                          </a>
                        )}
                        {app.linkedin && (
                          <a
                            href={app.linkedin}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#0A66C2] hover:underline font-semibold"
                          >
                            <LinkedinIcon className="w-3.5 h-3.5" />
                            <span>LinkedIn</span>
                          </a>
                        )}
                        {app.github && (
                          <a
                            href={app.github}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-slate-700 hover:underline font-semibold"
                          >
                            <GithubIcon className="w-3.5 h-3.5" />
                            <span>GitHub</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Status Changer & Resume Download & Dossier View */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-400 font-medium">Status:</span>
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(appId, e.target.value, app.studentName || app.fullName)}
                        className="text-xs rounded-xl border border-slate-200 bg-white p-2 font-bold outline-none focus:border-teal-600 cursor-pointer"
                      >
                        <option value="Submitted">Submitted</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Selected">Selected</option>
                        <option value="Waiting List">Waiting List</option>
                        <option value="Not Selected">Not Selected</option>
                      </select>
                    </div>

                    {/* Download Resume Button (Requirement 4) */}
                    {hasResume && (
                      <button
                        type="button"
                        onClick={() => downloadApplicantResume(appId, app.studentName || app.fullName)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs transition-colors"
                        title="Download attached PDF resume"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Resume</span>
                      </button>
                    )}

                    <Link
                      to={`/teacher/messages?opportunityId=${encodeURIComponent(app.opportunityId)}&partnerId=${encodeURIComponent(app.studentId || app.studentEmail || '')}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setViewingApp(app)}
                      className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-semibold text-xs transition-colors"
                    >
                      View Dossier
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* =================================================== */}
      {/* STUDENT DOSSIER & APPLICANT PROFILE VIEW MODAL       */}
      {/* =================================================== */}
      {viewingApp && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100 bg-white">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_BADGES[viewingApp.status] || 'bg-slate-100 text-slate-700'}`}>
                    {viewingApp.status}
                  </span>
                  <span className="text-xs text-slate-400">Application #{viewingApp.id || viewingApp._id}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {viewingApp.studentName || viewingApp.fullName}
                </h3>
                <p className="text-xs text-slate-500">
                  {viewingApp.studentDepartment || viewingApp.department} • {viewingApp.studentAcademicYear || viewingApp.academicYear}
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

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              
              {/* Target Project */}
              <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 text-teal-900 space-y-1">
                <span className="font-semibold block text-[11px] text-teal-700 uppercase tracking-wider">
                  Target Opportunity
                </span>
                <p className="font-bold text-sm text-teal-950">{viewingApp.opportunityTitle}</p>
                <p className="text-[11px] text-teal-800">Applied on {viewingApp.appliedAt}</p>
              </div>

              {/* Phase 9: Resume Download Banner */}
              {viewingApp.resume && viewingApp.resume.fileName ? (
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">
                        {viewingApp.resume.originalName || 'Applicant_Resume.pdf'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {viewingApp.resume.fileSize
                          ? `${(viewingApp.resume.fileSize / (1024 * 1024)).toFixed(2)} MB PDF`
                          : 'Official Curriculum Vitae'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => previewApplicantResume(viewingApp.id || viewingApp._id)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs flex items-center gap-1 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-teal-600" />
                      <span>Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadApplicantResume(viewingApp.id || viewingApp._id, viewingApp.studentName || viewingApp.fullName)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Resume</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>No PDF resume was attached with this application.</span>
                </div>
              )}

              {/* Quick Decision Actions in Dossier */}
              <div>
                <span className="font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Quick Decision Action:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(viewingApp.id || viewingApp._id, 'Shortlisted', viewingApp.studentName || viewingApp.fullName)}
                    className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Shortlist</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(viewingApp.id || viewingApp._id, 'Selected', viewingApp.studentName || viewingApp.fullName)}
                    className="p-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Select</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(viewingApp.id || viewingApp._id, 'Waiting List', viewingApp.studentName || viewingApp.fullName)}
                    className="p-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Waiting List</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(viewingApp.id || viewingApp._id, 'Not Selected', viewingApp.studentName || viewingApp.fullName)}
                    className="p-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Not Selected</span>
                  </button>
                </div>
              </div>

              {/* Personal & Academic Details */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div>
                  <span className="text-slate-400 block">Institution</span>
                  <span className="font-semibold text-slate-800">{viewingApp.studentInstitution || viewingApp.institution}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Department</span>
                  <span className="font-semibold text-slate-800">{viewingApp.studentDepartment || viewingApp.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Email Address</span>
                  <span className="font-semibold text-slate-800">{viewingApp.studentEmail || viewingApp.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Academic Year</span>
                  <span className="font-semibold text-slate-800">{viewingApp.studentAcademicYear || viewingApp.academicYear}</span>
                </div>
              </div>

              {/* Skills */}
              <div>
                <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Reported Skills
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(viewingApp.studentSkills || viewingApp.skills)
                    ? (viewingApp.studentSkills || viewingApp.skills)
                    : (viewingApp.studentSkills || viewingApp.skills || '').split(',')
                  ).map((sk, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                      {typeof sk === 'string' ? sk.trim() : sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Statement of Interest */}
              <div>
                <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Motivation / Statement of Interest
                </span>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 whitespace-pre-line leading-relaxed">
                  {viewingApp.statementOfInterest || viewingApp.whyInterested}
                </div>
              </div>

              {/* Previous Experience */}
              {viewingApp.experience && (
                <div>
                  <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Prior Project / Lab Experience
                  </span>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 whitespace-pre-line leading-relaxed">
                    {viewingApp.experience}
                  </div>
                </div>
              )}

              {/* Social & Portfolio Profiles (Requirement 4) */}
              <div className="flex flex-wrap gap-4 pt-1">
                {viewingApp.portfolioUrl && (
                  <a
                    href={viewingApp.portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:underline"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Personal Portfolio</span>
                  </a>
                )}
                {viewingApp.linkedin && (
                  <a
                    href={viewingApp.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A66C2] hover:underline"
                  >
                    <LinkedinIcon className="w-4 h-4" />
                    <span>LinkedIn Profile</span>
                  </a>
                )}
                {viewingApp.github && (
                  <a
                    href={viewingApp.github}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 hover:underline"
                  >
                    <GithubIcon className="w-4 h-4" />
                    <span>GitHub Repositories</span>
                  </a>
                )}
              </div>
            </div>

            {/* Modal Footer with Fine-grained Status Selector */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-700">Set Status:</span>
                <select
                  value={viewingApp.status}
                  onChange={(e) => handleStatusChange(viewingApp.id || viewingApp._id, e.target.value, viewingApp.studentName || viewingApp.fullName)}
                  className="rounded-xl border border-slate-300 bg-white p-2 text-xs font-bold outline-none"
                >
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Selected">Selected</option>
                  <option value="Waiting List">Waiting List</option>
                  <option value="Not Selected">Not Selected</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/teacher/messages?opportunityId=${encodeURIComponent(viewingApp.opportunityId)}&partnerId=${encodeURIComponent(viewingApp.studentId || viewingApp.studentEmail || '')}`}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send Message</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setViewingApp(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-white text-slate-600 font-semibold text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </TeacherLayout>
  );
}
