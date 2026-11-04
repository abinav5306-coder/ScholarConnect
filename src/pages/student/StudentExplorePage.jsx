import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  RotateCcw, 
  SlidersHorizontal,
  Inbox,
  Sparkles
} from 'lucide-react';
import StudentLayout from '../../layouts/StudentLayout';
import OpportunityCard from '../../components/opportunities/OpportunityCard';
import OpportunityDetailModal from '../../components/opportunities/OpportunityDetailModal';
import ApplyModal from '../../components/opportunities/ApplyModal';
import { useScholar } from '../../context/ScholarContext';

const CATEGORY_TABS = [
  'All Categories',
  'Research Project',
  'Internship',
  'Hackathon',
  'Startup Opportunity',
  'Research Assistantship',
  'Workshops & Conferences',
  'Innovation Challenge',
  'Open Source Projects',
  'Academic Collaborations',
];

const FILTER_SKILLS = [
  'Python',
  'Java',
  'React',
  'Machine Learning',
  'Artificial Intelligence',
  'Data Science',
  'Web Development',
  'Robotics',
  'Cybersecurity',
  'IoT',
  'Node.js',
];

const ELIGIBILITY_YEARS = [
  'First Year',
  'Second Year',
  'Third Year',
  'Fourth Year',
  'Postgraduate',
  'Research Scholar',
];

const STATUS_OPTIONS = [
  'Accepting Applications',
  'Closing Soon',
];

const PARTICIPATION_TYPES = [
  'Individual',
  'Team',
];

export default function StudentExplorePage() {
  const { opportunities } = useScholar();

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected category tab
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  // Filter Sidebar State
  const [filterInstitution, setFilterInstitution] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedParticipation, setSelectedParticipation] = useState('');

  // Mobile filter drawer state
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Modals state
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  // Unique Institutions derived from data
  const institutions = useMemo(() => {
    const list = opportunities.map((o) => o.institution).filter(Boolean);
    return Array.from(new Set(list));
  }, [opportunities]);

  // Skill toggle
  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  // Year toggle
  const toggleYear = (year) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All Categories');
    setFilterInstitution('');
    setSelectedSkills([]);
    setSelectedYears([]);
    setSelectedStatus('');
    setSelectedParticipation('');
  };

  // Active filters count
  const activeFilterCount = 
    (selectedCategory !== 'All Categories' ? 1 : 0) +
    (filterInstitution ? 1 : 0) +
    selectedSkills.length +
    selectedYears.length +
    (selectedStatus ? 1 : 0) +
    (selectedParticipation ? 1 : 0) +
    (searchQuery ? 1 : 0);

  // Filtered Opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // 1. Search Query Match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = opp.title?.toLowerCase().includes(query);
        const matchesDesc = (opp.shortDescription + ' ' + (opp.detailedDescription || '')).toLowerCase().includes(query);
        const matchesSkills = opp.skills?.some((s) => s.toLowerCase().includes(query));
        const matchesCategory = opp.category?.toLowerCase().includes(query);
        const matchesInstitution = opp.institution?.toLowerCase().includes(query);
        const matchesTeacher = opp.teacherName?.toLowerCase().includes(query);

        if (!matchesTitle && !matchesDesc && !matchesSkills && !matchesCategory && !matchesInstitution && !matchesTeacher) {
          return false;
        }
      }

      // 2. Category Tab Filter
      if (selectedCategory !== 'All Categories' && opp.category !== selectedCategory) {
        return false;
      }

      // 3. Institution Filter
      if (filterInstitution && opp.institution !== filterInstitution) {
        return false;
      }

      // 4. Skills Filter (Match any selected skill)
      if (selectedSkills.length > 0) {
        const hasSkill = selectedSkills.some((skill) =>
          opp.skills?.some((s) => s.toLowerCase() === skill.toLowerCase())
        );
        if (!hasSkill) return false;
      }

      // 5. Academic Eligibility Years Filter
      if (selectedYears.length > 0) {
        const oppYears = Array.isArray(opp.eligibilityYears)
          ? opp.eligibilityYears
          : [opp.eligibilityYears];
        const hasYear = selectedYears.some((year) =>
          oppYears.some((y) => y && y.toLowerCase().includes(year.toLowerCase()))
        );
        if (!hasYear) return false;
      }

      // 6. Status Filter
      if (selectedStatus && opp.status !== selectedStatus) {
        return false;
      }

      // 7. Participation Type (Individual vs Team)
      if (selectedParticipation && opp.participationType !== selectedParticipation) {
        return false;
      }

      return true;
    });
  }, [
    opportunities,
    searchQuery,
    selectedCategory,
    filterInstitution,
    selectedSkills,
    selectedYears,
    selectedStatus,
    selectedParticipation,
  ]);

  const handleViewDetails = (opp) => {
    setSelectedOpp(opp);
    setDetailModalOpen(true);
  };

  const handleApply = (opp) => {
    setSelectedOpp(opp);
    setApplyModalOpen(true);
  };

  // Render Filter Form Content (reused in desktop sidebar and mobile drawer)
  const renderFilterForm = () => (
    <div className="space-y-4 text-left text-xs">
      
      {/* Category Dropdown/Selector */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          Category
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2 outline-none focus:border-indigo-600 font-medium"
        >
          {CATEGORY_TABS.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Institution Filter */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          Institution
        </label>
        <select
          value={filterInstitution}
          onChange={(e) => setFilterInstitution(e.target.value)}
          className="w-full text-xs rounded-xl border border-slate-200 bg-white p-2 outline-none focus:border-indigo-600 font-medium"
        >
          <option value="">All Institutions</option>
          {institutions.map((inst) => (
            <option key={inst} value={inst}>
              {inst}
            </option>
          ))}
        </select>
      </div>

      {/* Required Skills */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          Required Skills ({selectedSkills.length})
        </label>
        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
          {FILTER_SKILLS.map((skill) => {
            const checked = selectedSkills.includes(skill);
            return (
              <label
                key={skill}
                className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none py-0.5 hover:text-indigo-600"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSkill(skill)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                />
                <span className={checked ? 'font-bold text-indigo-900' : ''}>{skill}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Academic Eligibility */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          Academic Eligibility
        </label>
        <div className="space-y-1">
          {ELIGIBILITY_YEARS.map((year) => {
            const checked = selectedYears.includes(year);
            return (
              <label
                key={year}
                className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none py-0.5 hover:text-indigo-600"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleYear(year)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                />
                <span className={checked ? 'font-bold text-indigo-900' : ''}>{year}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Opportunity Status */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          Opportunity Status
        </label>
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
            <input
              type="radio"
              name="status"
              value=""
              checked={selectedStatus === ''}
              onChange={() => setSelectedStatus('')}
              className="accent-indigo-600"
            />
            <span>All Statuses</span>
          </label>
          {STATUS_OPTIONS.map((status) => (
            <label key={status} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="radio"
                name="status"
                value={status}
                checked={selectedStatus === status}
                onChange={() => setSelectedStatus(status)}
                className="accent-indigo-600"
              />
              <span>{status}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Application Type */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          Application Type
        </label>
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
            <input
              type="radio"
              name="participation"
              value=""
              checked={selectedParticipation === ''}
              onChange={() => setSelectedParticipation('')}
              className="accent-indigo-600"
            />
            <span>Any (Individual or Team)</span>
          </label>
          {PARTICIPATION_TYPES.map((pt) => (
            <label key={pt} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="radio"
                name="participation"
                value={pt}
                checked={selectedParticipation === pt}
                onChange={() => setSelectedParticipation(pt)}
                className="accent-indigo-600"
              />
              <span>{pt} Participation</span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear Filters Button if any active */}
      {activeFilterCount > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClearFilters}
            className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear All Filters</span>
          </button>
        </div>
      )}

    </div>
  );

  // Sidebar Extra Content for StudentLayout (placed in empty space below the menu in student sidebar)
  const sidebarFilterContent = (
    <div className="space-y-3 text-left">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
          Opportunity Filters
        </span>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-[11px] font-semibold text-indigo-600 hover:underline"
          >
            Reset
          </button>
        )}
      </div>

      {renderFilterForm()}
    </div>
  );

  return (
    <StudentLayout 
      globalSearch={searchQuery} 
      onGlobalSearchChange={setSearchQuery}
      sidebarExtra={sidebarFilterContent}
    >
      <div className="space-y-6 text-left">
        
        {/* Top Header & Large Search Banner */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 sm:p-8 space-y-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cross-University Opportunities</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Explore Academic & Research Opportunities
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Find faculty research projects, interdisciplinary hackathons, internships, and lab assistantships across premier institutions.
            </p>
          </div>

          {/* Large Search Bar */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
              <Search className="w-5 h-5 text-indigo-600" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search opportunities by title, skills, institution or category..."
              className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none text-sm transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Navigation Quick Filter Tabs */}
          <div className="pt-2 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORY_TABS.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Bar + Mobile Filter Trigger */}
        <div className="flex items-center justify-between pb-1">
          <div className="text-xs text-slate-600">
            Showing <strong className="text-slate-900">{filteredOpportunities.length}</strong> {filteredOpportunities.length === 1 ? 'opportunity' : 'opportunities'}
            {activeFilterCount > 0 && ` with active filters (${activeFilterCount})`}
          </div>

          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowMobileFilter(true)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters ({activeFilterCount})</span>
            </button>
          </div>
        </div>

        {/* Opportunity Cards Listing (Full Width — 3 cards per row on desktop, 2 on tablet, 1 on mobile) */}
        <div className="w-full min-w-0">
          {filteredOpportunities.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 p-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                No opportunities match your criteria
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try adjusting your search query, selecting different skills, or clearing applied filters.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-4 py-2 rounded-xl bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-800"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredOpportunities.map((opp) => (
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

      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilter && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setShowMobileFilter(false)}
        >
          <div 
            className="w-80 max-w-[85vw] h-full bg-white shadow-2xl p-6 overflow-y-auto ml-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <span className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                Filter Opportunities
              </span>
              <button 
                onClick={() => setShowMobileFilter(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderFilterForm()}
          </div>
        </div>
      )}

      {/* Opportunity Details & Application Modals */}
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
