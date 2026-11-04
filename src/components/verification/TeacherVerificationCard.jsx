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
  Award,
  Building2,
  FileCheck2
} from 'lucide-react';
import { verificationAPI } from '../../services/api';
import { useScholar } from '../../context/ScholarContext';

const DESIGNATIONS = [
  'Assistant Professor',
  'Associate Professor',
  'Professor',
  'Lecturer',
  'Research Scholar',
  'Research Scientist',
  'Other',
];

export default function TeacherVerificationCard() {
  const { teacherProfile, refreshVerificationStatus } = useScholar();

  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    fullName: teacherProfile.fullName || '',
    institutionalEmail: teacherProfile.institutionalEmail || teacherProfile.email || '',
    institution: teacherProfile.institution || '',
    department: teacherProfile.department || '',
    designation: teacherProfile.designation || 'Associate Professor',
    facultyIdNumber: teacherProfile.facultyIdNumber || '',
  });

  const verificationStatus = teacherProfile.verificationStatus || 'Not Submitted';
  const rejectionReason = teacherProfile.rejectionReason;

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
      setError('Please upload your Faculty ID card or official institutional appointment proof (PDF/image).');
      return;
    }

    if (!formData.institution.trim() || !formData.department.trim() || !formData.facultyIdNumber.trim()) {
      setError('Institution, department, and faculty ID number are required.');
      return;
    }

    setIsSubmittingForm(true);
    setError('');
    setSuccess('');

    try {
      const data = new FormData();
      data.append('fullName', formData.fullName.trim());
      data.append('institutionalEmail', formData.institutionalEmail.trim());
      data.append('institution', formData.institution.trim());
      data.append('department', formData.department.trim());
      data.append('designation', formData.designation);
      data.append('facultyIdNumber', formData.facultyIdNumber.trim());
      data.append('facultyIdDocument', file);

      const res = await verificationAPI.submitTeacher(data);

      try {
        const stored = JSON.parse(localStorage.getItem('scholarconnect_user') || '{}');
        localStorage.setItem('scholarconnect_user', JSON.stringify({
          ...stored,
          verificationStatus: 'Verified',
          institution: formData.institution.trim(),
          department: formData.department.trim(),
          designation: formData.designation,
          facultyId: formData.facultyIdNumber.trim(),
        }));
      } catch {}

      setSuccess('Faculty credentials verified instantly! You are now a Verified Faculty member and may publish research opportunities.');
      setShowForm(false);
      setFile(null);

      if (refreshVerificationStatus) {
        await refreshVerificationStatus();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit faculty verification. Please try again.');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 sm:p-8 space-y-6 text-left animate-fadeIn">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Faculty & Researcher Identity Verification
            </h3>
            <p className="text-xs text-slate-500">
              Only verified faculty mentors and researchers may publish research opportunities to students.
            </p>
          </div>
        </div>

        {/* Status Badges */}
        <div>
          {verificationStatus === 'Verified' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Verified Faculty</span>
            </span>
          )}

          {verificationStatus === 'Pending Verification' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>Pending Review</span>
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
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Rejection Alert */}
      {verificationStatus === 'Rejected' && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-rose-800">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span>Faculty Verification Declined</span>
          </div>
          <p className="text-rose-700 leading-relaxed pl-6">
            <strong>Reason:</strong> {rejectionReason || 'The uploaded institutional proof or ID was not accepted. Please re-upload official appointment documentation.'}
          </p>
          <div className="pt-2 pl-6">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs"
            >
              Resubmit Faculty Documents
            </button>
          </div>
        </div>
      )}

      {/* Pending Notice */}
      {verificationStatus === 'Pending Verification' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 leading-relaxed">
          <Clock className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-bold">Faculty Credentials Under Administrative Audit</p>
            <p className="text-amber-800 mt-0.5">
              Your institutional documentation has been encrypted and submitted to the platform review board. You will receive an email notification when approval is completed, after which opportunity publishing is unlocked.
            </p>
          </div>
        </div>
      )}

      {/* Verified Banner */}
      {verificationStatus === 'Verified' && (
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 text-emerald-950 text-xs flex items-start gap-3">
          <FileCheck2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-emerald-900">Faculty Credentials Verified & Active</p>
            <p className="text-emerald-800 mt-0.5 leading-relaxed">
              Your academic institution ({teacherProfile.institution}) and faculty designation ({teacherProfile.designation}) have been authenticated. You have full publishing privileges for research positions, projects, and hackathons.
            </p>
          </div>
        </div>
      )}

      {/* Not Submitted Prompt */}
      {verificationStatus === 'Not Submitted' && !showForm && (
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-900">Publishing Privileges Require Verification</p>
            <p className="text-slate-500 max-w-lg leading-relaxed">
              To safeguard academic authenticity, research projects and hackathons can only be posted by verified faculty mentors. Submit your institutional proof below to activate publishing.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-xs shrink-0 flex items-center justify-center gap-1.5 transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Verify Faculty ID</span>
          </button>
        </div>
      )}

      {/* Verification Submission Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Submit Faculty Credentials & Official Proof
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
                Full Name *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-teal-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Institutional Email Address *
              </label>
              <input
                type="email"
                value={formData.institutionalEmail}
                onChange={(e) => setFormData({ ...formData, institutionalEmail: e.target.value })}
                placeholder="faculty@university.edu"
                required
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-teal-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Institution / University *
              </label>
              <input
                type="text"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                placeholder="e.g. ABC University"
                required
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-teal-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Academic Department *
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Department of AI & Data Science"
                required
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-teal-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Academic Designation *
              </label>
              <select
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-teal-600 font-medium bg-white"
              >
                {DESIGNATIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Faculty ID / Employee Number *
              </label>
              <input
                type="text"
                value={formData.facultyIdNumber}
                onChange={(e) => setFormData({ ...formData, facultyIdNumber: e.target.value })}
                placeholder="e.g. FAC-2018-042"
                required
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-teal-600 font-medium"
              />
            </div>
          </div>

          {/* Secure File Upload Box */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Faculty ID Card or Official Institutional Proof Document (PDF or image, max 5MB) *
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-5 text-center bg-slate-50/50 hover:bg-teal-50/30 transition-all cursor-pointer relative">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                <UploadCloud className="w-6 h-6 text-teal-600" />
                {file ? (
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span>{file.name}</span>
                    <span className="text-slate-400 font-normal">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-bold text-slate-800">
                      Click or drag your Faculty ID or Appointment Letter here
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
              className="px-6 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmittingForm ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting to Board...</span>
                </>
              ) : (
                <span>Submit for Faculty Verification</span>
              )}
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
