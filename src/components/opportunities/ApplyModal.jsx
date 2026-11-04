import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Send, 
  UploadCloud, 
  FileCheck, 
  ArrowRight,
  AlertCircle,
  FileText,
  Paperclip,
  Check
} from 'lucide-react';
import { useScholar } from '../../context/ScholarContext';
import { useNavigate } from 'react-router-dom';

export default function ApplyModal({
  isOpen,
  onClose,
  opportunity,
}) {
  const { studentProfile, applyForOpportunity, hasApplied } = useScholar();
  const navigate = useNavigate();

  // Form State prefilled from Student Profile
  const [formData, setFormData] = useState(() => ({
    fullName: studentProfile?.fullName || '',
    institution: studentProfile?.institution || '',
    department: studentProfile?.department || '',
    academicYear: studentProfile?.academicYear || '',
    skills: Array.isArray(studentProfile?.skills) ? studentProfile.skills.join(', ') : '',
    whyInterested: '',
    linkedin: studentProfile?.linkedin || '',
    github: studentProfile?.github || '',
    portfolioUrl: studentProfile?.portfolioUrl || '',
    experience: studentProfile?.projects?.map(p => `${p.title}: ${p.description}`).join('\n') || '',
    documentNote: '',
  }));

  // Resume attachment state
  // Modes: 'profile' (use default resume) | 'custom' (upload custom PDF) | 'none'
  const hasProfileResume = !!studentProfile?.resume?.originalName;
  const [resumeMode, setResumeMode] = useState(hasProfileResume ? 'profile' : 'custom');
  const [customResumeFile, setCustomResumeFile] = useState(null);

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset form when modal closes/opens
  const [prevOpportunityId, setPrevOpportunityId] = useState(null);
  if (isOpen && opportunity && opportunity.id !== prevOpportunityId) {
    setPrevOpportunityId(opportunity.id);
    setFormData({
      fullName: studentProfile?.fullName || '',
      institution: studentProfile?.institution || '',
      department: studentProfile?.department || '',
      academicYear: studentProfile?.academicYear || '',
      skills: Array.isArray(studentProfile?.skills) ? studentProfile.skills.join(', ') : '',
      whyInterested: '',
      linkedin: studentProfile?.linkedin || '',
      github: studentProfile?.github || '',
      portfolioUrl: studentProfile?.portfolioUrl || '',
      experience: studentProfile?.projects?.map(p => `${p.title}: ${p.description}`).join('\n') || '',
      documentNote: '',
    });
    setResumeMode(hasProfileResume ? 'profile' : 'custom');
    setCustomResumeFile(null);
    setErrors({});
    setApiError('');
    setIsSuccess(false);
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !opportunity) return null;

  const alreadyApplied = hasApplied(opportunity.id || opportunity._id);
  const isClosed = opportunity.status === 'Closed';

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleCustomResumeSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setErrors((prev) => ({ ...prev, resume: 'Only PDF format (.pdf) is permitted.' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, resume: 'PDF resume cannot exceed 5 MB.' }));
        return;
      }
      setCustomResumeFile(file);
      setErrors((prev) => ({ ...prev, resume: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required.';
    if (!formData.institution.trim()) newErrors.institution = 'Institution is required.';
    if (!formData.department.trim()) newErrors.department = 'Department is required.';
    if (!formData.academicYear.trim()) newErrors.academicYear = 'Current academic year is required.';
    if (!formData.whyInterested.trim()) {
      newErrors.whyInterested = 'Please share why you are interested in this opportunity.';
    } else if (formData.whyInterested.trim().length < 20) {
      newErrors.whyInterested = 'Please provide a more detailed motivation (at least 20 characters).';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (alreadyApplied || isClosed) return;

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setApiError('');

    try {
      const skillsArray = formData.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const useProfile = resumeMode === 'profile';
      const fileToUpload = resumeMode === 'custom' ? customResumeFile : null;

      const result = await applyForOpportunity(
        opportunity,
        {
          ...formData,
          skills: skillsArray,
          portfolioUrl: formData.portfolioUrl || studentProfile.portfolioUrl,
        },
        fileToUpload,
        useProfile
      );

      if (result && result.success) {
        setIsSuccess(true);
      } else {
        setApiError(result?.message || 'Failed to submit application. Please check your connection.');
      }
    } catch (err) {
      setApiError(err.message || 'An error occurred while submitting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-modal-title"
    >
      <div 
        className="relative w-full max-w-2xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100 bg-white">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Application Submission
            </span>
            <h2 id="apply-modal-title" className="text-xl font-bold text-slate-900 mt-1">
              Apply for {opportunity.title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Mentor: {opportunity.teacherName} • {opportunity.institution}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {isSuccess ? (
            /* Success Confirmation Screen */
            <div className="py-8 text-center space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-slate-900">
                  Application Submitted Successfully!
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Your application, academic profile, and attached resume have been recorded in MongoDB Atlas. The faculty mentor has been notified.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/student/applications');
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <span>View My Applications</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Continue Browsing
                </button>
              </div>
            </div>
          ) : (
            /* Application Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {apiError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{apiError}</span>
                </div>
              )}

              {/* Section 1: Academic Credentials */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-1.5 border-b border-slate-100">
                  Applicant Profile (Auto-filled from Profile)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      className={`w-full text-xs rounded-xl border p-2.5 outline-none ${
                        errors.fullName ? 'border-rose-400' : 'border-slate-200 focus:border-indigo-600'
                      }`}
                    />
                    {errors.fullName && (
                      <p className="text-[11px] text-rose-600 mt-0.5">{errors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Institution / University *
                    </label>
                    <input
                      type="text"
                      value={formData.institution}
                      onChange={(e) => handleChange('institution', e.target.value)}
                      className={`w-full text-xs rounded-xl border p-2.5 outline-none ${
                        errors.institution ? 'border-rose-400' : 'border-slate-200 focus:border-indigo-600'
                      }`}
                    />
                    {errors.institution && (
                      <p className="text-[11px] text-rose-600 mt-0.5">{errors.institution}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Department / Major *
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => handleChange('department', e.target.value)}
                      className={`w-full text-xs rounded-xl border p-2.5 outline-none ${
                        errors.department ? 'border-rose-400' : 'border-slate-200 focus:border-indigo-600'
                      }`}
                    />
                    {errors.department && (
                      <p className="text-[11px] text-rose-600 mt-0.5">{errors.department}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Current Academic Year *
                    </label>
                    <input
                      type="text"
                      value={formData.academicYear}
                      onChange={(e) => handleChange('academicYear', e.target.value)}
                      className={`w-full text-xs rounded-xl border p-2.5 outline-none ${
                        errors.academicYear ? 'border-rose-400' : 'border-slate-200 focus:border-indigo-600'
                      }`}
                    />
                    {errors.academicYear && (
                      <p className="text-[11px] text-rose-600 mt-0.5">{errors.academicYear}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Motivation & Skills */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-1.5 border-b border-slate-100">
                  Motivation & Relevant Skills
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Relevant Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => handleChange('skills', e.target.value)}
                    placeholder="e.g. Python, Machine Learning, React, PyTorch"
                    className="w-full text-xs rounded-xl border border-slate-200 focus:border-indigo-600 p-2.5 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Why are you interested in this opportunity? *
                  </label>
                  <textarea
                    rows={4}
                    value={formData.whyInterested}
                    onChange={(e) => handleChange('whyInterested', e.target.value)}
                    placeholder="Explain your relevant coursework, enthusiasm for this research topic, or why you would be a great fit..."
                    className={`w-full text-xs rounded-xl border p-3 outline-none resize-none leading-relaxed ${
                      errors.whyInterested ? 'border-rose-400' : 'border-slate-200 focus:border-indigo-600'
                    }`}
                  />
                  {errors.whyInterested && (
                    <p className="text-[11px] text-rose-600 mt-0.5">{errors.whyInterested}</p>
                  )}
                </div>
              </div>

              {/* Section 3: Profile Links */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-1.5 border-b border-slate-100">
                  Portfolio & Social Links
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={formData.linkedin}
                      onChange={(e) => handleChange('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full text-xs rounded-xl border border-slate-200 focus:border-indigo-600 p-2.5 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      GitHub URL
                    </label>
                    <input
                      type="url"
                      value={formData.github}
                      onChange={(e) => handleChange('github', e.target.value)}
                      placeholder="https://github.com/..."
                      className="w-full text-xs rounded-xl border border-slate-200 focus:border-indigo-600 p-2.5 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Portfolio URL
                    </label>
                    <input
                      type="url"
                      value={formData.portfolioUrl}
                      onChange={(e) => handleChange('portfolioUrl', e.target.value)}
                      placeholder="https://alexjohnson.dev"
                      className="w-full text-xs rounded-xl border border-slate-200 focus:border-indigo-600 p-2.5 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Previous Project / Research Experience
                  </label>
                  <textarea
                    rows={3}
                    value={formData.experience}
                    onChange={(e) => handleChange('experience', e.target.value)}
                    placeholder="Summarize key projects, lab experiences, or publications..."
                    className="w-full text-xs rounded-xl border border-slate-200 focus:border-indigo-600 p-3 outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* SECTION 4: RESUME ATTACHMENT (PHASE 9 REQUIREMENT) */}
              <div className="space-y-3 pt-1">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-1.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Academic Resume Attachment</span>
                  </span>
                  <span className="text-[11px] text-slate-400 lowercase font-normal">
                    (PDF format up to 5 MB)
                  </span>
                </h4>

                {hasProfileResume && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="radio"
                        name="resumeChoice"
                        checked={resumeMode === 'profile'}
                        onChange={() => setResumeMode('profile')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          <span className="font-semibold text-slate-900">
                            Attach Profile Resume: {studentProfile.resume.originalName}
                          </span>
                        </div>
                        <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Verified Default
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="radio"
                        name="resumeChoice"
                        checked={resumeMode === 'custom'}
                        onChange={() => setResumeMode('custom')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-semibold text-slate-800">
                        Upload a customized resume for this specific opportunity
                      </span>
                    </label>
                  </div>
                )}

                {(!hasProfileResume || resumeMode === 'custom') && (
                  <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
                    {customResumeFile ? (
                      <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg p-2.5 text-xs text-indigo-900">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-indigo-600" />
                          <span className="font-semibold">{customResumeFile.name}</span>
                          <span className="text-[11px] text-slate-500">
                            ({(customResumeFile.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCustomResumeFile(null)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-1.5">
                        <UploadCloud className="w-6 h-6 text-indigo-600" />
                        <span className="text-xs font-semibold text-indigo-700 hover:underline">
                          Browse and upload tailored PDF resume
                        </span>
                        <span className="text-[11px] text-slate-400">PDF up to 5 MB</span>
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          onChange={handleCustomResumeSelect}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                )}

                {errors.resume && (
                  <p className="text-[11px] text-rose-600 font-semibold">{errors.resume}</p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Recording Application...' : 'Submit Application'}</span>
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}
