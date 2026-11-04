import React from 'react';
import { 
  Building2, 
  User, 
  Calendar, 
  Clock, 
  Users, 
  Bookmark, 
  ArrowRight, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useScholar } from '../../context/ScholarContext';

// Color map for category badges
const CATEGORY_STYLES = {
  'Research Project': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Internship': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Hackathon': 'bg-amber-50 text-amber-800 border-amber-200',
  'Startup Opportunity': 'bg-purple-50 text-purple-700 border-purple-200',
  'Research Assistantship': 'bg-blue-50 text-blue-700 border-blue-200',
  'Workshops & Conferences': 'bg-rose-50 text-rose-700 border-rose-200',
  'Innovation Challenge': 'bg-orange-50 text-orange-700 border-orange-200',
  'Open Source Projects': 'bg-cyan-50 text-cyan-800 border-cyan-200',
  'Academic Collaborations': 'bg-violet-50 text-violet-700 border-violet-200',
};

export default function OpportunityCard({
  opportunity,
  onViewDetails,
  onApply,
}) {
  const { hasApplied, isSaved, toggleSaveOpportunity } = useScholar();
  const applied = hasApplied(opportunity.id);
  const saved = isSaved(opportunity.id);
  const isClosed = opportunity.status === 'Closed';

  const categoryStyle = CATEGORY_STYLES[opportunity.category] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <div className="group relative flex flex-col justify-between bg-white rounded-2xl border border-slate-200/90 shadow-subtle hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 p-6 text-left">
      
      {/* Top Header Row: Category Badge + Bookmark + Status */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${categoryStyle}`}>
            {opportunity.category}
          </span>

          <div className="flex items-center gap-2">
            {/* Status indicator badge */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                isClosed
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : opportunity.status === 'Closing Soon'
                  ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {isClosed ? 'Closed' : opportunity.status || 'Accepting Applications'}
            </span>

            {/* Bookmark button */}
            <button
              type="button"
              onClick={() => toggleSaveOpportunity(opportunity.id)}
              aria-label={saved ? 'Remove from saved' : 'Save opportunity'}
              className={`p-1.5 rounded-lg border transition-colors ${
                saved
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50'
              }`}
            >
              <Bookmark className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Opportunity Title */}
        <h3 
          onClick={() => onViewDetails(opportunity)}
          className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer line-clamp-2 leading-snug mb-2"
        >
          {opportunity.title}
        </h3>

        {/* Mentor / Faculty & Institution Meta */}
        <div className="space-y-1 text-xs text-slate-600 mb-3.5">
          <div className="flex items-center gap-1.5 font-medium text-slate-800">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{opportunity.teacherName}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{opportunity.institution}</span>
          </div>
        </div>

        {/* Short Description */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
          {opportunity.shortDescription}
        </p>

        {/* Required Skills Tags */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1.5">
            {opportunity.skills?.slice(0, 4).map((skill, idx) => (
              <span
                key={idx}
                className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700"
              >
                {skill}
              </span>
            ))}
            {opportunity.skills?.length > 4 && (
              <span className="inline-block px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-50 text-slate-500">
                +{opportunity.skills.length - 4} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Meta Grid & Action Buttons */}
      <div>
        {/* Compact Metadata Grid */}
        <div className="pt-3 pb-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              <strong>{opportunity.positions}</strong> {opportunity.positions === 1 ? 'position' : 'positions'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Mode: <strong>{opportunity.workMode || 'Hybrid'}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Deadline: <strong>{opportunity.deadline}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {Array.isArray(opportunity.eligibilityYears) 
                ? opportunity.eligibilityYears.join(', ')
                : opportunity.eligibilityYears || 'All Years'}
            </span>
          </div>
        </div>

        {/* Action Buttons: View Details & Apply Now */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => onViewDetails(opportunity)}
            className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            View Details
          </button>

          {applied ? (
            <div className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Applied</span>
            </div>
          ) : isClosed ? (
            <button
              type="button"
              disabled
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 text-slate-400 text-xs font-semibold cursor-not-allowed"
            >
              Closed
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onApply(opportunity)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <span>Apply Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
