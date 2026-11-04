import React, { useState, useRef } from 'react';
import { 
  Briefcase, 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  ExternalLink, 
  Plus, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Globe, 
  Award, 
  Layers, 
  FolderGit2, 
  Save, 
  RefreshCw,
  Eye,
  Calendar,
  Check
} from 'lucide-react';
import { LinkedinIcon, GithubIcon } from '../../components/icons/SocialIcons';
import StudentLayout from '../../layouts/StudentLayout';
import { useScholar } from '../../context/ScholarContext';
import { isValidHttpUrl } from '../../services/urlValidator';

export default function StudentPortfolioPage() {
  const { 
    studentProfile, 
    uploadResume, 
    downloadMyResume, 
    previewMyResume, 
    deleteResume, 
    updateStudent 
  } = useScholar();

  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  // Portfolio Form State (initialized from studentProfile)
  const [formData, setFormData] = useState({
    portfolioUrl: studentProfile.portfolioUrl || '',
    linkedin: studentProfile.linkedin || '',
    github: studentProfile.github || '',
    skills: [...(studentProfile.skills || studentProfile.technicalSkills || [])],
    programmingLanguages: [...(studentProfile.programmingLanguages || ['Python', 'JavaScript', 'TypeScript', 'SQL'])],
    researchInterests: [...(studentProfile.researchInterests || [])],
    projects: studentProfile.projects ? JSON.parse(JSON.stringify(studentProfile.projects)) : [],
    certifications: studentProfile.certifications ? JSON.parse(JSON.stringify(studentProfile.certifications)) : [],
    achievements: studentProfile.achievements ? JSON.parse(JSON.stringify(studentProfile.achievements)) : [],
  });

  // Local state for tags input
  const [newSkill, setNewSkill] = useState('');
  const [newLang, setNewLang] = useState('');
  const [newInterest, setNewInterest] = useState('');

  // Modal states for adding items
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProjectIndex, setEditingProjectIndex] = useState(null);
  const [projectForm, setProjectForm] = useState({
    title: '',
    role: '',
    technologies: '',
    description: '',
    liveUrl: '',
    githubUrl: '',
  });

  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certForm, setCertForm] = useState({
    name: '',
    issuer: '',
    issueDate: '',
    credentialUrl: '',
  });

  const [achievementModalOpen, setAchievementModalOpen] = useState(false);
  const [achievementForm, setAchievementForm] = useState({
    title: '',
    description: '',
    date: '',
  });

  // Resume File Selection Handler
  const handleResumeFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setFeedback({ type: 'error', message: 'Only PDF format (.pdf) is permitted for resume upload.' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'Resume size exceeds 5MB limit. Please compress your PDF.' });
      return;
    }

    setIsUploading(true);
    setFeedback(null);
    try {
      const res = await uploadResume(file);
      if (res && res.success) {
        setFeedback({ type: 'success', message: 'Resume uploaded successfully and linked to your profile!' });
      } else {
        setFeedback({ type: 'error', message: res?.message || 'Failed to upload resume.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error uploading file.' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteResume = async () => {
    if (!window.confirm('Are you sure you want to delete your uploaded resume?')) return;
    try {
      await deleteResume();
      setFeedback({ type: 'success', message: 'Resume removed successfully.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete resume.' });
    }
  };

  // Add / Remove Tag Helpers
  const addTag = (field, value, setter) => {
    const trimmed = value.trim();
    if (trimmed && !formData[field].includes(trimmed)) {
      setFormData((prev) => ({ ...prev, [field]: [...prev[field], trimmed] }));
      setter('');
    }
  };

  const removeTag = (field, tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((t) => t !== tagToRemove),
    }));
  };

  // Project Modal Actions
  const handleOpenProjectModal = (idx = null) => {
    if (idx !== null) {
      const p = formData.projects[idx];
      setProjectForm({
        title: p.title || '',
        role: p.role || '',
        technologies: Array.isArray(p.technologies) ? p.technologies.join(', ') : p.technologies || '',
        description: p.description || '',
        liveUrl: p.liveUrl || p.link || '',
        githubUrl: p.githubUrl || '',
      });
      setEditingProjectIndex(idx);
    } else {
      setProjectForm({
        title: '',
        role: '',
        technologies: '',
        description: '',
        liveUrl: '',
        githubUrl: '',
      });
      setEditingProjectIndex(null);
    }
    setProjectModalOpen(true);
  };

  const handleSaveProject = (e) => {
    e.preventDefault();
    if (!projectForm.title.trim()) return;

    const techs = projectForm.technologies
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const projectItem = {
      id: editingProjectIndex !== null ? formData.projects[editingProjectIndex].id : `proj-${Date.now()}`,
      title: projectForm.title.trim(),
      role: projectForm.role.trim(),
      technologies: techs,
      description: projectForm.description.trim(),
      liveUrl: projectForm.liveUrl.trim(),
      githubUrl: projectForm.githubUrl.trim(),
      link: projectForm.githubUrl.trim() || projectForm.liveUrl.trim(),
    };

    setFormData((prev) => {
      const updated = [...prev.projects];
      if (editingProjectIndex !== null) {
        updated[editingProjectIndex] = projectItem;
      } else {
        updated.push(projectItem);
      }
      return { ...prev, projects: updated };
    });

    setProjectModalOpen(false);
  };

  const handleDeleteProject = (idx) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== idx),
    }));
  };

  // Certification Modal Actions
  const handleSaveCert = (e) => {
    e.preventDefault();
    if (!certForm.name.trim() || !certForm.issuer.trim()) return;

    const certItem = {
      id: `cert-${Date.now()}`,
      name: certForm.name.trim(),
      issuer: certForm.issuer.trim(),
      issueDate: certForm.issueDate || new Date().toISOString().split('T')[0],
      credentialUrl: certForm.credentialUrl.trim(),
    };

    setFormData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, certItem],
    }));

    setCertModalOpen(false);
    setCertForm({ name: '', issuer: '', issueDate: '', credentialUrl: '' });
  };

  const handleDeleteCert = (idx) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== idx),
    }));
  };

  // Achievement Modal Actions
  const handleSaveAchievement = (e) => {
    e.preventDefault();
    if (!achievementForm.title.trim()) return;

    const achItem = {
      id: `ach-${Date.now()}`,
      title: achievementForm.title.trim(),
      description: achievementForm.description.trim(),
      date: achievementForm.date.trim() || `${new Date().getFullYear()}`,
    };

    setFormData((prev) => ({
      ...prev,
      achievements: [...prev.achievements, achItem],
    }));

    setAchievementModalOpen(false);
    setAchievementForm({ title: '', description: '', date: '' });
  };

  const handleDeleteAchievement = (idx) => {
    setFormData((prev) => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== idx),
    }));
  };

  // Save All Portfolio Information to MongoDB Atlas
  const handleSaveAll = async () => {
    // URL Validations
    if (formData.portfolioUrl && !isValidHttpUrl(formData.portfolioUrl)) {
      setFeedback({ type: 'error', message: 'Portfolio URL must be a valid URL starting with http:// or https://' });
      return;
    }
    if (formData.linkedin && !isValidHttpUrl(formData.linkedin)) {
      setFeedback({ type: 'error', message: 'LinkedIn URL must start with http:// or https://' });
      return;
    }
    if (formData.github && !isValidHttpUrl(formData.github)) {
      setFeedback({ type: 'error', message: 'GitHub URL must start with http:// or https://' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    try {
      await updateStudent({
        portfolioUrl: formData.portfolioUrl.trim(),
        linkedin: formData.linkedin.trim(),
        github: formData.github.trim(),
        skills: formData.skills,
        technicalSkills: formData.skills,
        programmingLanguages: formData.programmingLanguages,
        researchInterests: formData.researchInterests,
        projects: formData.projects,
        previousProjects: formData.projects,
        certifications: formData.certifications,
        achievements: formData.achievements,
      });

      setFeedback({
        type: 'success',
        message: 'Portfolio, skills, and project accomplishments saved successfully to MongoDB Atlas!',
      });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save portfolio.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  const currentResume = studentProfile.resume;

  return (
    <StudentLayout>
      <div className="space-y-6 text-left pb-16">
        
        {/* Header Banner */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 sm:p-8 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Academic Career Dossier & Verified Resume</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Resume & Portfolio Management
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Maintain your official academic curriculum vitae, showcased software/research projects, technical competencies, and professional profile links.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving to MongoDB...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Portfolio Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 shadow-2xs animate-fadeIn ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="p-1 rounded-lg hover:bg-black/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SECTION 1: RESUME MANAGEMENT CARD */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Official Academic Resume (PDF)</h2>
                <p className="text-xs text-slate-500">
                  Attached automatically to research and internship applications. Up to 5 MB.
                </p>
              </div>
            </div>

            {currentResume && (
              <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Check className="w-3.5 h-3.5" />
                <span>Resume Active</span>
              </span>
            )}
          </div>

          {currentResume ? (
            /* Active Resume Display */
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-rose-500 shadow-2xs shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 truncate max-w-sm sm:max-w-md">
                    {currentResume.originalName || 'Alex_Johnson_Resume.pdf'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                    <span>
                      {currentResume.fileSize
                        ? `${(currentResume.fileSize / (1024 * 1024)).toFixed(2)} MB`
                        : 'PDF Document'}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Uploaded {currentResume.uploadedAt ? new Date(currentResume.uploadedAt).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={previewMyResume}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Preview</span>
                </button>

                <button
                  type="button"
                  onClick={downloadMyResume}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold text-indigo-700 shadow-2xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isUploading ? 'Replacing...' : 'Replace'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeleteResume}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 transition-colors"
                  title="Delete Resume"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="sr-only sm:not-sr-only">Delete</span>
                </button>
              </div>
            </div>
          ) : (
            /* Upload Empty State */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-indigo-50/20 transition-all cursor-pointer space-y-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
                <Upload className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">
                  {isUploading ? 'Uploading and securing PDF on server...' : 'Upload your Academic Curriculum Vitae (PDF)'}
                </p>
                <p className="text-xs text-slate-500">
                  Drag and drop your file here, or click to browse. Max size 5 MB.
                </p>
              </div>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleResumeFileSelect}
            className="hidden"
          />
        </div>

        {/* SECTION 2: PORTFOLIO & SOCIAL PROFILES */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              <span>Portfolio & Social Links</span>
            </h2>
            <span className="text-[11px] text-slate-400">Validated HTTP/HTTPS links</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                <span>Personal Portfolio Website</span>
              </label>
              <input
                type="url"
                value={formData.portfolioUrl}
                onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                placeholder="https://alexjohnson.dev"
                className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-600 p-3 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <LinkedinIcon className="w-3.5 h-3.5 text-[#0A66C2]" />
                <span>LinkedIn Profile URL</span>
              </label>
              <input
                type="url"
                value={formData.linkedin}
                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/username"
                className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-600 p-3 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <GithubIcon className="w-3.5 h-3.5 text-slate-800" />
                <span>GitHub Profile URL</span>
              </label>
              <input
                type="url"
                value={formData.github}
                onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                placeholder="https://github.com/username"
                className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-600 p-3 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: TECHNICAL SKILLS & PROGRAMMING LANGUAGES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Technical Skills */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Technical Skills ({formData.skills.length})</span>
            </h2>

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('skills', newSkill, setNewSkill))}
                placeholder="Add skill (e.g. PyTorch, Docker, React)..."
                className="flex-1 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 px-3 py-2 outline-none"
              />
              <button
                type="button"
                onClick={() => addTag('skills', newSkill, setNewSkill)}
                className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
              >
                Add
              </button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 pt-1 min-h-[60px]">
              {formData.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeTag('skills', skill)}
                    className="text-indigo-400 hover:text-indigo-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Programming Languages */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Programming Languages ({formData.programmingLanguages.length})</span>
            </h2>

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newLang}
                onChange={(e) => setNewLang(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('programmingLanguages', newLang, setNewLang))}
                placeholder="Add language (e.g. Python, C++, Rust)..."
                className="flex-1 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-600 px-3 py-2 outline-none"
              />
              <button
                type="button"
                onClick={() => addTag('programmingLanguages', newLang, setNewLang)}
                className="px-3 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700"
              >
                Add
              </button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 pt-1 min-h-[60px]">
              {formData.programmingLanguages.map((lang, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200"
                >
                  <span>{lang}</span>
                  <button
                    type="button"
                    onClick={() => removeTag('programmingLanguages', lang)}
                    className="text-purple-400 hover:text-purple-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 4: SHOWCASED PROJECTS */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-indigo-600" />
                <span>Showcased Projects ({formData.projects.length})</span>
              </h2>
              <p className="text-xs text-slate-500">
                Key lab prototypes, software architectures, or published open-source repositories.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenProjectModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </button>
          </div>

          {formData.projects.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-6">
              No projects added yet. Click &quot;Add Project&quot; to showcase your technical accomplishments.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.projects.map((proj, idx) => (
                <div
                  key={proj.id || idx}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-subtle transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-slate-900 leading-snug">{proj.title}</h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenProjectModal(idx)}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(idx)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {proj.role && (
                      <p className="text-[11px] font-semibold text-indigo-600">{proj.role}</p>
                    )}

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {proj.description}
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-slate-200/60">
                    {/* Tech tags */}
                    {Array.isArray(proj.technologies) && proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {proj.technologies.map((t, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-200/70 text-slate-700">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Links */}
                    <div className="flex items-center gap-3 text-xs">
                      {proj.liveUrl && (
                        <a
                          href={proj.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-600 hover:underline font-semibold"
                        >
                          <Globe className="w-3 h-3" />
                          <span>Live Demo</span>
                        </a>
                      )}
                      {proj.githubUrl && (
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-slate-700 hover:underline font-semibold"
                        >
                          <GithubIcon className="w-3 h-3" />
                          <span>Source Code</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 5: CERTIFICATIONS & ACHIEVEMENTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Certifications */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Certifications ({formData.certifications.length})</span>
              </h2>
              <button
                type="button"
                onClick={() => setCertModalOpen(true)}
                className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-50 text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {formData.certifications.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">No certifications added.</p>
              ) : (
                formData.certifications.map((cert, idx) => (
                  <div
                    key={cert.id || idx}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{cert.name}</h4>
                      <p className="text-[11px] text-slate-500">
                        {cert.issuer} {cert.issueDate ? `• ${cert.issueDate}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {cert.credentialUrl && (
                        <a
                          href={cert.credentialUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-lg text-indigo-600 hover:bg-indigo-50"
                          title="Verify Credential"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteCert(idx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Academic Achievements */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Honors & Achievements ({formData.achievements.length})</span>
              </h2>
              <button
                type="button"
                onClick={() => setAchievementModalOpen(true)}
                className="p-1 rounded-lg text-amber-700 hover:bg-amber-50 text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {formData.achievements.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">No honors recorded yet.</p>
              ) : (
                formData.achievements.map((ach, idx) => (
                  <div
                    key={ach.id || idx}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{ach.title}</h4>
                      <p className="text-[11px] text-slate-500">
                        {ach.description} {ach.date ? `• ${ach.date}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAchievement(idx)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* =================================================== */}
      {/* ADD / EDIT PROJECT MODAL                            */}
      {/* =================================================== */}
      {projectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingProjectIndex !== null ? 'Edit Project' : 'Add Showcased Project'}
              </h3>
              <button
                type="button"
                onClick={() => setProjectModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  placeholder="e.g. Real-time Diabetic Retinopathy Classification"
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role / Contribution</label>
                  <input
                    type="text"
                    value={projectForm.role}
                    onChange={(e) => setProjectForm({ ...projectForm, role: e.target.value })}
                    placeholder="e.g. Lead Researcher, Frontend Developer"
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Technologies (comma separated)</label>
                  <input
                    type="text"
                    value={projectForm.technologies}
                    onChange={(e) => setProjectForm({ ...projectForm, technologies: e.target.value })}
                    placeholder="Python, PyTorch, React"
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Summary & Results</label>
                <textarea
                  rows={3}
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  placeholder="Outline key algorithms implemented, datasets utilized, and benchmarks achieved..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Live Demo URL</label>
                  <input
                    type="url"
                    value={projectForm.liveUrl}
                    onChange={(e) => setProjectForm({ ...projectForm, liveUrl: e.target.value })}
                    placeholder="https://myproject.demo.com"
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GitHub / Code URL</label>
                  <input
                    type="url"
                    value={projectForm.githubUrl}
                    onChange={(e) => setProjectForm({ ...projectForm, githubUrl: e.target.value })}
                    placeholder="https://github.com/user/repo"
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================== */}
      {/* ADD CERTIFICATION MODAL                             */}
      {/* =================================================== */}
      {certModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Add Credential / Certification</h3>
              <button
                type="button"
                onClick={() => setCertModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCert} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Certification Name *</label>
                <input
                  type="text"
                  required
                  value={certForm.name}
                  onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
                  placeholder="e.g. Deep Learning Specialization"
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Issuing Organization *</label>
                <input
                  type="text"
                  required
                  value={certForm.issuer}
                  onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
                  placeholder="e.g. Coursera / Stanford Online, AWS"
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={certForm.issueDate}
                    onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Verification URL</label>
                  <input
                    type="url"
                    value={certForm.credentialUrl}
                    onChange={(e) => setCertForm({ ...certForm, credentialUrl: e.target.value })}
                    placeholder="https://verify.url"
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCertModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  Save Credential
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================== */}
      {/* ADD ACHIEVEMENT MODAL                               */}
      {/* =================================================== */}
      {achievementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Add Academic Honor / Award</h3>
              <button
                type="button"
                onClick={() => setAchievementModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAchievement} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Honor / Award Title *</label>
                <input
                  type="text"
                  required
                  value={achievementForm.title}
                  onChange={(e) => setAchievementForm({ ...achievementForm, title: e.target.value })}
                  placeholder="e.g. Dean's Honor Roll, Hackathon First Place"
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Details / Citation</label>
                <input
                  type="text"
                  value={achievementForm.description}
                  onChange={(e) => setAchievementForm({ ...achievementForm, description: e.target.value })}
                  placeholder="e.g. Awarded for top 5% GPA across School of Engineering"
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Year / Period</label>
                <input
                  type="text"
                  value={achievementForm.date}
                  onChange={(e) => setAchievementForm({ ...achievementForm, date: e.target.value })}
                  placeholder="e.g. 2025 - 2026"
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAchievementModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700"
                >
                  Save Honor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </StudentLayout>
  );
}

