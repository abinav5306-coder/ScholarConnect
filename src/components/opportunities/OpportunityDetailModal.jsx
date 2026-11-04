import React, { useEffect } from 'react';
import { 
  X, 
  Building2, 
  User, 
  Calendar, 
  Clock, 
  Users, 
  Award, 
  Target, 
  CheckCircle2, 
  Laptop, 
  FileText, 
  Bookmark,
  AlertCircle
} from 'lucide-react';
import { useScholar } from '../../context/ScholarContext';

export default function OpportunityDetailModal({
  isOpen,
  onClose,
  opportunity,
  onApply,
}) {
  const { hasApplied, isSaved, toggleSaveOpportunity } = useScholar();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !opportunity) return null;

  const applied = hasApplied(opportunity.id);
  const saved = isSaved(opportunity.id);
  const isClosed = opportunity.status === 'Closed';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="opportunity-detail-title"
    >
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Sticky Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100 bg-white">
          <div className="space-y-1.5 pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {opportunity.category}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                  isClosed
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : opportunity.status === 'Closing Soon'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {isClosed ? 'Closed' : opportunity.status || 'Accepting Applications'}
              </span>
            </div>
            <h2 id="opportunity-detail-title" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
              {opportunity.title}
            </h2>
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600">
              <span className="flex items-center gap-1 font-medium text-slate-900">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                {opportunity.teacherName}
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {opportunity.institution} • {opportunity.department || 'Academic Department'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => toggleSaveOpportunity(opportunity.id)}
              className={`p-2 rounded-xl border transition-colors ${
                saved ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-slate-50 text-slate-500 hover:text-slate-800 border-slate-200'
              }`}
              aria-label="Bookmark this opportunity"
            >
              <Bookmark className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          
          {/* Key Facts / Highlights Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <span className="block text-slate-400 font-medium">Work Mode</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <Laptop className="w-3.5 h-3.5 text-indigo-600" />
                {opportunity.workMode || 'Hybrid'}
              </span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Positions</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                {opportunity.positions} Available
              </span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Duration</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                {opportunity.duration || 'Not specified'}
              </span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Deadline</span>
              <span className="font-semibold text-rose-700 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-rose-600" />
                {opportunity.deadline}
              </span>
            </div>
          </div>

          {/* Full Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Complete Description
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {opportunity.detailedDescription || opportunity.shortDescription}
            </p>
          </div>

          {/* Research Objectives / Project Goals */}
          {opportunity.researchObjectives && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" />
                Research Objectives & Goals
              </h3>
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {opportunity.researchObjectives}
              </div>
            </div>
          )}

          {/* Required Technical Skills */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Required Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {opportunity.skills?.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Eligibility Criteria */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Eligibility Criteria
            </h3>
            <div className="p-4 rounded-xl border border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block">Academic Year:</span>
                <span className="font-semibold text-slate-800">
                  {Array.isArray(opportunity.eligibilityYears)
                    ? opportunity.eligibilityYears.join(', ')
                    : opportunity.eligibilityYears || 'Open to all years'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Eligible Degrees:</span>
                <span className="font-semibold text-slate-800">
                  {Array.isArray(opportunity.eligibleDegrees)
                    ? opportunity.eligibleDegrees.join(', ')
                    : opportunity.eligibleDegrees || 'All relevant degrees'}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block">Department / Majors:</span>
                <span className="font-semibold text-slate-800">
                  {opportunity.eligibleDepartments || 'Open to all related STEM departments'}
                </span>
              </div>
            </div>
          </div>

          {/* Benefits / Outcomes */}
          {opportunity.benefits && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                Benefits & Outcomes
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 bg-emerald-50/70 border border-emerald-200/70 p-3.5 rounded-xl leading-relaxed">
                {opportunity.benefits}
              </p>
            </div>
          )}

          {/* Application Instructions */}
          {opportunity.instructions && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Application Instructions
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 border border-slate-200 p-3.5 rounded-xl leading-relaxed">
                {opportunity.instructions}
              </p>
            </div>
          )}

        </div>

        {/* Modal Sticky Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 hidden sm:block">
            Posted on {opportunity.postedDate} • {opportunity.applicantsCount || 0} applicants so far
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
            >
              Close
            </button>

            {applied ? (
              <div className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Application Already Submitted</span>
              </div>
            ) : isClosed ? (
              <button
                type="button"
                disabled
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-slate-200 text-slate-500 text-xs font-semibold cursor-not-allowed"
              >
                Applications Closed
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onApply(opportunity);
                }}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold shadow-sm hover:shadow transition-colors"
              >
                Apply for this Opportunity
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
