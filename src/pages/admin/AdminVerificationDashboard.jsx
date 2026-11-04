import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Search, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  FileText, 
  RefreshCw, 
  Eye, 
  ExternalLink, 
  User, 
  Building2, 
  GraduationCap, 
  Award, 
  LogOut,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';
import { verificationAPI } from '../../services/api';

export default function AdminVerificationDashboard() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filtering & Search
  const [statusFilter, setStatusFilter] = useState('Pending Verification');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState(null); // { filename, originalName, mimeType }
  const [docBlobUrl, setDocBlobUrl] = useState(null);
  const [loadingDoc, setLoadingDoc] = useState(false);

  // Reject Reason Modal State
  const [rejectingUser, setRejectingUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Fetch Requests
  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await verificationAPI.getRequests({
        status: statusFilter,
        role: roleFilter,
        search: searchQuery,
      });

      if (res && res.success && Array.isArray(res.requests)) {
        setRequests(res.requests);
      } else {
        setRequests([]);
      }
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        navigate('/admin/login');
      } else {
        setError(err.message || 'Failed to load verification requests.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, roleFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.verificationStatus === 'Pending Verification').length;
    const verified = requests.filter((r) => r.verificationStatus === 'Verified').length;
    const rejected = requests.filter((r) => r.verificationStatus === 'Rejected').length;
    return { total, pending, verified, rejected };
  }, [requests]);

  // Filtered requests based on local search as well
  const displayedRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase().trim();
    return requests.filter((r) => {
      const name = (r.name || '').toLowerCase();
      const email = (r.email || '').toLowerCase();
      const inst = (r.institution || '').toLowerCase();
      const dept = (r.department || '').toLowerCase();
      const reg = (r.registerNumber || r.facultyIdNumber || '').toLowerCase();
      return name.includes(q) || email.includes(q) || inst.includes(q) || dept.includes(q) || reg.includes(q);
    });
  }, [requests, searchQuery]);

  // Handle Approve
  const handleApprove = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to approve academic identity for "${userName}"?`)) {
      return;
    }

    setIsProcessingAction(true);
    setError('');
    try {
      await verificationAPI.approve(userId);
      setSuccessMsg(`Academic identity for ${userName} has been successfully verified! Notification dispatched.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchRequests();
    } catch (err) {
      setError(err.message || 'Failed to approve verification.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Open Reject Modal
  const openRejectModal = (user) => {
    setRejectingUser(user);
    setRejectionReason('The uploaded identification document is not legible or has expired. Please submit an official document.');
  };

  // Confirm Reject
  const handleConfirmReject = async () => {
    if (!rejectingUser || !rejectionReason.trim()) return;

    setIsProcessingAction(true);
    setError('');
    try {
      await verificationAPI.reject(rejectingUser.userId || rejectingUser._id, rejectionReason.trim());
      setSuccessMsg(`Verification rejected for ${rejectingUser.name}. Feedback has been communicated.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setRejectingUser(null);
      fetchRequests();
    } catch (err) {
      setError(err.message || 'Failed to reject verification.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Preview Document securely
  const handleOpenPreview = async (doc) => {
    if (!doc || !doc.filename) return;
    setPreviewDoc(doc);
    setLoadingDoc(true);
    setDocBlobUrl(null);

    try {
      const token = localStorage.getItem('scholarconnect_token');
      const response = await fetch(verificationAPI.getDocumentUrl(doc.filename), {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve private document.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDocBlobUrl(url);
    } catch (err) {
      setError(`Cannot preview document: ${err.message}`);
    } finally {
      setLoadingDoc(false);
    }
  };

  const closePreview = () => {
    if (docBlobUrl) {
      URL.revokeObjectURL(docBlobUrl);
    }
    setPreviewDoc(null);
    setDocBlobUrl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('scholarconnect_token');
    localStorage.removeItem('scholarconnect_user');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 w-full bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <BrandLogo size="default" to="/admin/verifications" />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-indigo-300 border border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Identity Audit Portal</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={fetchRequests}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-rose-300 hover:text-rose-200 border border-slate-700 text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-left">
        
        {/* Banner Title */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <span>ScholarConnect Governance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Academic Identity Verification Console
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Inspect student enrollment cards and faculty credentials. Approving unlocks research publishing for faculty and grants verified badges to students.
            </p>
          </div>

          {/* Quick Stats Pill Group */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-center min-w-[90px]">
              <span className="block text-xl font-extrabold text-amber-700">{stats.pending}</span>
              <span className="text-[11px] font-semibold text-amber-800 uppercase">Pending</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center min-w-[90px]">
              <span className="block text-xl font-extrabold text-emerald-700">{stats.verified}</span>
              <span className="text-[11px] font-semibold text-emerald-800 uppercase">Verified</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-center min-w-[90px]">
              <span className="block text-xl font-extrabold text-rose-700">{stats.rejected}</span>
              <span className="text-[11px] font-semibold text-rose-800 uppercase">Rejected</span>
            </div>
          </div>
        </div>

        {/* Feedback / Alert */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {['Pending Verification', 'Verified', 'Rejected', 'All'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status === 'All' ? '' : status)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                  (statusFilter === status || (status === 'All' && !statusFilter))
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Role Filter & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 bg-white p-2.5 outline-none font-semibold text-slate-700 focus:border-indigo-600"
            >
              <option value="all">All Roles (Student & Faculty)</option>
              <option value="student">Students Only</option>
              <option value="teacher">Faculty / Teachers Only</option>
            </select>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 left-3 my-auto" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, roll no..."
                className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 outline-none transition-all"
              />
            </div>
          </div>

        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-700">Loading verification records from MongoDB...</p>
            </div>
          ) : displayedRequests.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/90 p-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                No verification requests found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {statusFilter === 'Pending Verification' 
                  ? 'All submitted student and faculty identity documents have been audited!' 
                  : 'Try adjusting your status or role filter.'}
              </p>
            </div>
          ) : (
            displayedRequests.map((req) => {
              const isStudent = req.role === 'student';
              const latestDoc = req.verificationDocuments?.[req.verificationDocuments.length - 1];

              return (
                <div
                  key={req.userId || req._id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 hover:shadow-card transition-all space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-start gap-3.5">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                        isStudent ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-teal-50 text-teal-700 border border-teal-100'
                      }`}>
                        {req.name?.charAt(0) || 'U'}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-extrabold text-slate-900">{req.name}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isStudent ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-800'
                          }`}>
                            {isStudent ? 'Student' : 'Faculty / Mentor'}
                          </span>
                          <span className="text-xs text-slate-400">• {req.email}</span>
                        </div>

                        <p className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{req.institution}</span>
                          <span>•</span>
                          <span>{req.department}</span>
                          {req.academicYear && (
                            <>
                              <span>•</span>
                              <span>{req.academicYear}</span>
                            </>
                          )}
                          {req.designation && (
                            <>
                              <span>•</span>
                              <span>{req.designation}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 self-start md:self-center">
                      {req.verificationStatus === 'Verified' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </span>
                      )}
                      {req.verificationStatus === 'Pending Verification' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3.5 h-3.5 animate-pulse" />
                          <span>Pending Review</span>
                        </span>
                      )}
                      {req.verificationStatus === 'Rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Identification Details & Documents */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block font-medium">Identifier Number</span>
                      <span className="font-mono font-bold text-slate-800 text-sm">
                        {req.registerNumber || req.facultyIdNumber || 'N/A'}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block font-medium">Institutional Email</span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {req.institutionalEmail || req.email}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block font-medium">Uploaded Document</span>
                        <span className="font-semibold text-slate-800 truncate block max-w-[140px]">
                          {latestDoc?.originalName || 'id_document.pdf'}
                        </span>
                      </div>
                      {latestDoc && (
                        <button
                          type="button"
                          onClick={() => handleOpenPreview(latestDoc)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-indigo-700 font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rejection note if previously rejected */}
                  {req.verificationStatus === 'Rejected' && req.rejectionReason && (
                    <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-800 text-xs">
                      <strong>Rejection Reason: </strong> {req.rejectionReason}
                    </div>
                  )}

                  {/* Action Controls for Pending */}
                  <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isProcessingAction}
                      onClick={() => openRejectModal(req)}
                      className="px-4 py-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 font-semibold text-xs transition-colors"
                    >
                      Reject with Reason
                    </button>

                    <button
                      type="button"
                      disabled={isProcessingAction}
                      onClick={() => handleApprove(req.userId || req._id, req.name)}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Verification</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </main>

      {/* Secure Document Preview Modal */}
      {previewDoc && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn"
          onClick={closePreview}
        >
          <div 
            className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>{previewDoc.originalName || 'Identification Document'}</span>
                </h3>
                <span className="text-xs text-slate-400">Authenticated Secure View</span>
              </div>
              <button
                type="button"
                onClick={closePreview}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex items-center justify-center min-h-[360px] bg-slate-50">
              {loadingDoc ? (
                <div className="text-center space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                  <p className="text-xs text-slate-500 font-semibold">Streaming encrypted document...</p>
                </div>
              ) : docBlobUrl ? (
                previewDoc.mimeType === 'application/pdf' ? (
                  <iframe
                    src={docBlobUrl}
                    title="Document Preview"
                    className="w-full h-[520px] rounded-xl border border-slate-200"
                  />
                ) : (
                  <img
                    src={docBlobUrl}
                    alt="ID Document"
                    className="max-h-[500px] w-auto max-w-full rounded-2xl object-contain shadow-md"
                  />
                )
              ) : (
                <div className="text-rose-600 text-xs font-semibold">
                  Unable to preview document file.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
              <button
                type="button"
                onClick={closePreview}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingUser && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setRejectingUser(null)}
        >
          <div 
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>Reject Identity Verification</span>
              </h3>
              <button
                type="button"
                onClick={() => setRejectingUser(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Provide an official reason for declining verification for <strong>{rejectingUser.name}</strong> ({rejectingUser.email}). This explanation will be communicated via email and presented in their profile.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Official Rejection Reason *
              </label>
              <textarea
                rows={4}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. The student ID card photo is blurry. Please upload a scanned copy of your active university ID."
                className="w-full text-xs rounded-xl border border-slate-200 p-3 outline-none focus:border-rose-600 resize-none leading-relaxed text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingAction || !rejectionReason.trim()}
                onClick={handleConfirmReject}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs disabled:opacity-50"
              >
                {isProcessingAction ? 'Processing Rejection...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
