import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, 
  PlusCircle, 
  Users, 
  Eye, 
  Trash2, 
  CheckCircle2
} from 'lucide-react';
import TeacherLayout from '../../layouts/TeacherLayout';
import OpportunityDetailModal from '../../components/opportunities/OpportunityDetailModal';
import { useScholar } from '../../context/ScholarContext';

export default function TeacherOpportunitiesPage() {
  const { opportunities, closeOpportunity, deleteOpportunity, updateOpportunity } = useScholar();
  
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [actionAlert, setActionAlert] = useState('');

  const filteredOpps = opportunities.filter((o) => {
    if (filterCategory !== 'All' && o.category !== filterCategory) return false;
    return true;
  });

  const handleClose = (id, title) => {
    if (window.confirm(`Are you sure you want to close applications for "${title}"? Students will no longer be able to submit new applications.`)) {
      closeOpportunity(id);
      setActionAlert(`Applications closed for "${title}".`);
      setTimeout(() => setActionAlert(''), 4000);
    }
  };

  const handleReopen = (id, title) => {
    updateOpportunity(id, { status: 'Accepting Applications' });
    setActionAlert(`Opportunity "${title}" reopened for applications.`);
    setTimeout(() => setActionAlert(''), 4000);
  };

  const handleDelete = (id, title) => {
    if (window.confirm(`Permanently delete opportunity "${title}"?`)) {
      deleteOpportunity(id);
      setActionAlert(`Opportunity "${title}" deleted.`);
      setTimeout(() => setActionAlert(''), 4000);
    }
  };

  const handleView = (opp) => {
    setSelectedOpp(opp);
    setDetailModalOpen(true);
  };

  return (
    <TeacherLayout>
      <div className="space-y-6 text-left">
        
        {/* Header Banner */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 mb-2">
                <Compass className="w-3.5 h-3.5" />
                <span>Opportunity Management</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                My Opportunities ({opportunities.length})
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Monitor status, review incoming student applications, or close application calls.
              </p>
            </div>

            <Link
              to="/teacher/create-opportunity"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-xs transition-colors self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Create Opportunity</span>
            </Link>
          </div>

          {/* Category filter dropdown */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Filter by Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 bg-slate-50 p-2 outline-none font-medium text-slate-700"
            >
              <option value="All">All Categories</option>
              <option value="Research Project">Research Project</option>
              <option value="Internship">Internship</option>
              <option value="Hackathon">Hackathon</option>
              <option value="Startup Opportunity">Startup Opportunity</option>
              <option value="Research Assistantship">Research Assistantship</option>
              <option value="Workshops & Conferences">Workshops & Conferences</option>
              <option value="Innovation Challenge">Innovation Challenge</option>
              <option value="Open Source Projects">Open Source Projects</option>
              <option value="Academic Collaborations">Academic Collaborations</option>
            </select>
          </div>
        </div>

        {/* Action alert message */}
        {actionAlert && (
          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span>{actionAlert}</span>
          </div>
        )}

        {/* Table / Cards Listing */}
        {filteredOpps.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 p-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              No opportunities published yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Publish your first research assistantship or project call to start receiving student applications.
            </p>
            <div className="pt-2">
              <Link
                to="/teacher/create-opportunity"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create New Opportunity</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="py-4 px-6">Opportunity Title</th>
                    <th className="py-4 px-4">Category</th>
                    <th className="py-4 px-4">Published Date</th>
                    <th className="py-4 px-4">Deadline</th>
                    <th className="py-4 px-4 text-center">Applicants</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOpps.map((opp) => {
                    const isClosed = opp.status === 'Closed';
                    return (
                      <tr key={opp.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Title & Host Dept */}
                        <td className="py-4 px-6 font-medium text-slate-900 max-w-xs">
                          <span 
                            onClick={() => handleView(opp)}
                            className="font-bold text-slate-900 hover:text-teal-700 cursor-pointer block line-clamp-1"
                          >
                            {opp.title}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {opp.institution} • {opp.department || 'Department'}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-4 px-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                            {opp.category}
                          </span>
                        </td>

                        {/* Published Date */}
                        <td className="py-4 px-4 whitespace-nowrap text-slate-500">
                          {opp.postedDate}
                        </td>

                        {/* Deadline */}
                        <td className="py-4 px-4 whitespace-nowrap font-medium text-slate-700">
                          {opp.deadline}
                        </td>

                        {/* Number of Applicants */}
                        <td className="py-4 px-4 text-center">
                          <Link
                            to="/teacher/applicants"
                            className="inline-flex items-center gap-1 font-bold text-teal-700 hover:underline px-2 py-0.5 rounded-lg bg-teal-50 border border-teal-100"
                          >
                            <Users className="w-3 h-3" />
                            <span>{opp.applicantsCount || 0}</span>
                          </Link>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              isClosed
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : opp.status === 'Closing Soon'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {opp.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Details */}
                            <button
                              type="button"
                              onClick={() => handleView(opp)}
                              title="View opportunity details"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Close / Reopen */}
                            {isClosed ? (
                              <button
                                type="button"
                                onClick={() => handleReopen(opp.id, opp.title)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"
                              >
                                Reopen
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleClose(opp.id, opp.title)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200"
                              >
                                Close Applications
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDelete(opp.id, opp.title)}
                              title="Delete opportunity"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      <OpportunityDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        opportunity={selectedOpp}
        onApply={() => {}}
      />
    </TeacherLayout>
  );
}
