import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Compass } from 'lucide-react';
import StudentLayout from '../../layouts/StudentLayout';
import OpportunityCard from '../../components/opportunities/OpportunityCard';
import OpportunityDetailModal from '../../components/opportunities/OpportunityDetailModal';
import ApplyModal from '../../components/opportunities/ApplyModal';
import { useScholar } from '../../context/ScholarContext';

export default function StudentSavedPage() {
  const { opportunities, savedOpportunities } = useScholar();

  const [selectedOpp, setSelectedOpp] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  // Filter opportunities to only saved ones
  const savedList = opportunities.filter((o) => savedOpportunities.includes(o.id));

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
      <div className="space-y-6 text-left">
        
        {/* Header */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 sm:p-8 space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved Records</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Saved Opportunities ({savedList.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Keep track of research calls, internships, and hackathons you plan to apply for before their deadline.
          </p>
        </div>

        {/* Content Grid */}
        {savedList.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 p-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Bookmark className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              No saved opportunities yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click the bookmark icon on any opportunity card to save it here for quick access later.
            </p>
            <div className="pt-2">
              <Link
                to="/student/explore"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-800"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Opportunities</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {savedList.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                onViewDetails={handleViewDetails}
                onApply={handleApply}
              />
            ))}
          </div>
        )}

      </div>

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
