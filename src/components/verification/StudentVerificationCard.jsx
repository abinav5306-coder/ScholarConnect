import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw,
  Building2,
  FileCheck2
} from 'lucide-react';
import { verificationAPI } from '../../services/api';
import { useScholar } from '../../context/ScholarContext';

export default function StudentVerificationCard() {
  const { studentProfile, refreshVerificationStatus } = useScholar();

  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    institution: studentProfile.institution || studentProfile.college || '',
    department: studentProfile.department || '',
    registerNumber: studentProfile.registerNumber || '',
    academicYear: studentProfile.academicYear || 'Third Year',
    institutionalEmail: studentProfile.institutionalEmail || studentProfile.email || '',
  });

  const verificationStatus = studentProfile.verificationStatus || 'Not Submitted';
  const rejectionReason = studentProfile.rejectionReason;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(selected.mimetype || selected.type)) {
      setError('Please upload an image (JPG, PNG, WEBP) or PDF document.');
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError('File size must not exceed 5 MB.');
      return;
    }

    setError('');
    setFile(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select or upload your Student ID Card (PDF or image).');
      return;
    }

    if (!formData.institution.trim() || !formData.department.trim() || !formData.registerNumber.trim()) {
      setError('Institution, department, and register number are required.');
      return;
    }

    setIsSubmittingForm(true);
    setError('');
    setSuccess('');

    try {
      const data = new FormData();
      data.append('institution', formData.institution.trim());
      data.append('department', formData.department.trim());
      data.append('registerNumber', formData.registerNumber.trim());
      data.append('academicYear', formData.academicYear);
      data.append('institutionalEmail', formData.institutionalEmail.trim());
      data.append('studentIdDocument', file);

      await verificationAPI.submitStudent(data);

      setSuccess('Student academic identity verification submitted successfully! It is now under administrative review.');
      setShowForm(false);
      setFile(null);

      if (refreshVerificationStatus) {
        await refreshVerificationStatus();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit verification request. Please try again.');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 sm:p-8 space-y-6 text-left animate-fadeIn">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Academic Identity Verification
            </h3>
            <p className="text-xs text-slate-500">
              Verify your active student enrollment with an official institutional ID.
            </p>
          </div>
        </div>

        {/* Status Badges */}
        <div>
          {verificationStatus === 'Verified' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Verified Scholar</span>
            </span>
          )}

          {verificationStatus === 'Pending Verification' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>Pending Verification</span>
            </span>
          )}

          {verificationStatus === 'Rejected' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Verification Rejected</span>
            </span>
          )}

          {verificationStatus === 'Not Submitted' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Not Submitted</span>
            </span>
          )}
        </div>
      </div>

      {/* Success Toast */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Rejection Alert */}
      {verificationStatus === 'Rejected' && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-rose-800">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span>Identity Verification Declined</span>
          </div>
          <p className="text-rose-700 leading-relaxed pl-6">
            <strong>Reason:</strong> {rejectionReason || 'The uploaded student ID was illegible or expired. Please upload a clear photo or PDF.'}
          </p>
          <div className="pt-2 pl-6">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs"
            >
              Resubmit Verification Documents
            </button>
          </div>
        </div>
      )}

      {/* Pending Notice */}
      {verificationStatus === 'Pending Verification' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 leading-relaxed">
          <Clock className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-bold">Documents Under Administrative Review</p>
            <p className="text-amber-800 mt-0.5">
              Your institutional ID and academic records have been securely stored and submitted to our verification team. You will be notified automatically once your credentials are confirmed.
            </p>
          </div>
        </div>
      )}

      {/* Verified Banner */}
      {verificationStatus === 'Verified' && (
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 text-emerald-950 text-xs flex items-start gap-3">
          <FileCheck2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-emerald-900">Academic Standing Authenticated</p>
            <p className="text-emerald-800 mt-0.5 leading-relaxed">
              Your student credentials and institutional affiliation ({studentProfile.institution}) have been verified. Your applications will carry the verified student trust badge to research mentors.
            </p>
          </div>
        </div>
      )}

      {/* Not Submitted Prompt */}
      {verificationStatus === 'Not Submitted' && !showForm && (
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-900">Unlock Full Research Privileges</p>
            <p className="text-slate-500 max-w-lg leading-relaxed">
              Upload your college student ID card to receive verified academic status. Verified students get priority review and mentor recommendations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-semibold text-xs shadow-xs shrink-0 flex items-center justify-center gap-1.5 transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Submit Verification</span>
          </button>
        </div>
      )}

      {/* Verification Submission Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Submit Academic Credentials & ID
            </h4>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                University / College Name *
              </label>
              <input
                type="text"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                placeholder="e.g. Stanford University"
                required
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Department / School *
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Computer Science"
                required
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Student Register / Roll Number *
              </label>
              <input
                type="text"
                value={formData.registerNumber}
                onChange={(e) => setFormData({ ...formData, registerNumber: e.target.value })}
                placeholder="e.g. 21CS042 / REG-9842"
                required
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Academic Year *
              </label>
              <select
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 bg-white"
              >
                <option value="First Year">First Year</option>
                <option value="Second Year">Second Year</option>
                <option value="Third Year">Third Year</option>
                <option value="Fourth Year">Fourth Year</option>
                <option value="Postgraduate">Postgraduate</option>
                <option value="Research Scholar">Research Scholar</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">
                Institutional Email Address
              </label>
              <input
                type="email"
                value={formData.institutionalEmail}
                onChange={(e) => setFormData({ ...formData, institutionalEmail: e.target.value })}
                placeholder="you@institution.edu"
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Secure File Upload Box */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Upload Official Student ID Card (Image or PDF, max 5MB) *
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-5 text-center bg-slate-50/50 hover:bg-indigo-50/30 transition-all cursor-pointer relative">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                <UploadCloud className="w-6 h-6 text-indigo-600" />
                {file ? (
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>{file.name}</span>
                    <span className="text-slate-400 font-normal">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-bold text-slate-800">
                      Click or drag your ID card here
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Supports JPG, PNG, WEBP, and PDF documents
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setFile(null);
                setError('');
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingForm || !file}
              className="px-6 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmittingForm ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Encrypting & Uploading...</span>
                </>
              ) : (
                <span>Submit for Verification</span>
              )}
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
