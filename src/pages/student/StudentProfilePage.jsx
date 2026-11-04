import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, 
  Building2, 
  Edit3, 
  Plus, 
  X, 
  CheckCircle2, 
  Save, 
  Briefcase,
  FileText,
  Globe,
  ExternalLink,
  Download
} from 'lucide-react';
import { LinkedinIcon, GithubIcon } from '../../components/icons/SocialIcons';
import StudentLayout from '../../layouts/StudentLayout';
import { useScholar } from '../../context/ScholarContext';
import StudentVerificationCard from '../../components/verification/StudentVerificationCard';

const ACADEMIC_YEARS = [
  'First Year',
  'Second Year',
  'Third Year',
  'Fourth Year',
  'Fifth Year',
  'Postgraduate',
  'Research Scholar',
];

export default function StudentProfilePage() {
  const { studentProfile, updateStudent } = useScholar();

  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Editable Form State
  const [formData, setFormData] = useState({
    fullName: '',
    department: '',
    academicYear: '',
    graduationYear: '',
    linkedin: '',
    github: '',
    bio: '',
    skills: [],
    researchInterests: [],
    projects: [],
  });

  // Local inputs for adding skills / interests
  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');

  // Start edit
  const handleStartEdit = () => {
    setFormData({
      fullName: studentProfile.fullName || '',
      department: studentProfile.department || '',
      academicYear: studentProfile.academicYear || '',
      graduationYear: studentProfile.graduationYear || '',
      linkedin: studentProfile.linkedin || '',
      github: studentProfile.github || '',
      bio: studentProfile.bio || '',
      skills: [...(studentProfile.skills || [])],
      researchInterests: [...(studentProfile.researchInterests || [])],
      projects: studentProfile.projects ? JSON.parse(JSON.stringify(studentProfile.projects)) : [],
    });
    setSuccessMessage('');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // Add skill
  const handleAddSkill = (e) => {
    e?.preventDefault();
    const trimmed = newSkill.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
      setNewSkill('');
    }
  };

  // Remove skill
  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  // Add interest
  const handleAddInterest = (e) => {
    e?.preventDefault();
    const trimmed = newInterest.trim();
    if (trimmed && !formData.researchInterests.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, researchInterests: [...prev.researchInterests, trimmed] }));
      setNewInterest('');
    }
  };

  // Remove interest
  const handleRemoveInterest = (interestToRemove) => {
    setFormData((prev) => ({
      ...prev,
      researchInterests: prev.researchInterests.filter((i) => i !== interestToRemove),
    }));
  };

  // Update a project's field
  const handleProjectChange = (idx, field, val) => {
    setFormData((prev) => {
      const updated = [...prev.projects];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, projects: updated };
    });
  };

  // Add new project
  const handleAddProject = () => {
    setFormData((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          id: `proj-${Date.now()}`,
          title: 'New Academic Project',
          technologies: 'e.g. Python, React',
          description: 'Project methodology, experimental results, and outcomes...',
        },
      ],
    }));
  };

  // Remove project
  const handleRemoveProject = (idx) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== idx),
    }));
  };

  // Save changes
  const handleSave = (e) => {
    e.preventDefault();
    updateStudent(formData);
    setIsEditing(false);
    setSuccessMessage('Profile updated successfully! Changes saved locally.');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  return (
    <StudentLayout>
      <div className="space-y-6 text-left">
        
        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Profile Header Banner */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              {/* Profile Photo / Avatar */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-purple-600 text-white font-extrabold text-3xl sm:text-4xl flex items-center justify-center shadow-md ring-4 ring-indigo-50">
                {studentProfile.fullName?.charAt(0) || 'S'}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {studentProfile.fullName}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Student Researcher
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  {studentProfile.department}
                </p>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  {studentProfile.institution}
                </p>
              </div>
            </div>

            {!isEditing && (
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold transition-all shadow-xs self-start sm:self-auto"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          {/* Social Links Row */}
          <div className="pt-4 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{studentProfile.email}</span>
            </div>

            {studentProfile.linkedin && (
              <a
                href={studentProfile.linkedin}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-indigo-600 hover:underline font-medium"
              >
                <LinkedinIcon className="w-4 h-4 text-indigo-700" />
                <span>LinkedIn Profile</span>
              </a>
            )}

            {studentProfile.github && (
              <a
                href={studentProfile.github}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-slate-700 hover:underline font-medium"
              >
                <GithubIcon className="w-4 h-4" />
                <span>GitHub Repositories</span>
              </a>
            )}
          </div>
        </div>

        {/* View vs Edit Mode */}
        {isEditing ? (
          /* ======================================================== */
          /* EDIT PROFILE FORM                                       */
          /* ======================================================== */
          <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8 space-y-8 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                Edit Student Profile
              </h2>
              <span className="text-xs text-slate-400">All fields update in real-time</span>
            </div>

            {/* Basic Info Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 focus:border-indigo-600 p-2.5 outline-none font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 focus:border-indigo-600 p-2.5 outline-none font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Academic Year
                </label>
                <select
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 focus:border-indigo-600 p-2.5 outline-none font-medium bg-white"
                >
                  {ACADEMIC_YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Graduation Year
                </label>
                <input
                  type="text"
                  value={formData.graduationYear}
                  onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 focus:border-indigo-600 p-2.5 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full text-xs rounded-xl border border-slate-200 focus:border-indigo-600 p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GitHub Profile URL
                </label>
                <input
                  type="url"
                  value={formData.github}
                  onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                  placeholder="https://github.com/username"
                  className="w-full text-xs rounded-xl border border-slate-200 focus:border-indigo-600 p-2.5 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Academic Bio / Statement
                </label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 focus:border-indigo-600 p-2.5 outline-none leading-relaxed"
                />
              </div>
            </div>

            {/* Technical Skills Tag Manager */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Technical Skills ({formData.skills.length})
              </label>

              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[46px] items-center">
                {formData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="p-0.5 hover:bg-indigo-200/50 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="Type a skill (e.g. PyTorch, Docker) and press Enter"
                  className="flex-1 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 p-2.5 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold"
                >
                  Add Skill
                </button>
              </div>
            </div>

            {/* Research Interests Tag Manager */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Research Interests ({formData.researchInterests.length})
              </label>

              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[46px] items-center">
                {formData.researchInterests.map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold"
                  >
                    <span>{interest}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInterest(interest)}
                      className="p-0.5 hover:bg-purple-200/50 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddInterest();
                    }
                  }}
                  placeholder="Type a research area (e.g. Quantum Computing, Genomics) and press Enter"
                  className="flex-1 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 p-2.5 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddInterest}
                  className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold"
                >
                  Add Interest
                </button>
              </div>
            </div>

            {/* Previous Projects Editor */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Previous Projects & Research Experience ({formData.projects.length})
                </label>
                <button
                  type="button"
                  onClick={handleAddProject}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Project</span>
                </button>
              </div>

              <div className="space-y-4">
                {formData.projects.map((proj, idx) => (
                  <div
                    key={proj.id || idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative text-left"
                  >
                    <button
                      type="button"
                      onClick={() => handleRemoveProject(idx)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-rose-600"
                      aria-label="Remove project"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Project Title
                        </label>
                        <input
                          type="text"
                          value={proj.title}
                          onChange={(e) => handleProjectChange(idx, 'title', e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-200 bg-white p-2 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Technologies Used
                        </label>
                        <input
                          type="text"
                          value={proj.technologies}
                          onChange={(e) => handleProjectChange(idx, 'technologies', e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-200 bg-white p-2 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Description & Findings
                      </label>
                      <textarea
                        rows={2}
                        value={proj.description}
                        onChange={(e) => handleProjectChange(idx, 'description', e.target.value)}
                        className="w-full text-xs rounded-lg border border-slate-200 bg-white p-2 outline-none resize-none leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        ) : (
          /* ======================================================== */
          /* VIEW PROFILE DETAILS                                     */
          /* ======================================================== */
          <div className="space-y-6">
            {/* Student Academic Identity Verification Card */}
            <StudentVerificationCard />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left 4 cols: Academic credentials card */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100">
                  Academic Credentials
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Degree Program</span>
                    <span className="font-bold text-slate-800 text-sm">{studentProfile.degree}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Current Academic Year</span>
                    <span className="font-semibold text-slate-800">{studentProfile.academicYear}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Expected Graduation</span>
                    <span className="font-semibold text-slate-800">{studentProfile.graduationYear}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Department</span>
                    <span className="font-semibold text-slate-800">{studentProfile.department}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">University</span>
                    <span className="font-semibold text-slate-800">{studentProfile.institution}</span>
                  </div>
                </div>
              </div>

              {/* Resume & Portfolio Gateway Card */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Resume & Portfolio
                  </h3>
                  <Link
                    to="/student/portfolio"
                    className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <span>Manage</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-rose-500" />
                      <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                        {studentProfile.resume?.originalName || 'No resume uploaded'}
                      </span>
                    </div>
                    {studentProfile.resume ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Active
                      </span>
                    ) : (
                      <Link to="/student/portfolio" className="text-[10px] font-bold text-indigo-600 hover:underline">
                        Upload
                      </Link>
                    )}
                  </div>

                  {studentProfile.portfolioUrl && (
                    <a
                      href={studentProfile.portfolioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 font-semibold flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Personal Portfolio</span>
                      </span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Research Interests Pill Card */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100">
                  Research Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {studentProfile.researchInterests?.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 8 cols: Skills, Bio & Projects Portfolio */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Bio & Technical Skills */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 sm:p-8 space-y-5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Academic Summary
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {studentProfile.bio || 'Undergraduate student and researcher exploring academic opportunities.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Technical Skills & Tooling
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {studentProfile.skills?.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Previous Projects & Lab Work */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    Previous Projects & Research Experience
                  </h3>
                  <span className="text-xs text-slate-400">
                    {studentProfile.projects?.length || 0} projects
                  </span>
                </div>

                <div className="space-y-4">
                  {studentProfile.projects?.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {proj.title}
                        </h4>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700">
                          {proj.technologies}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {proj.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      </div>
    </StudentLayout>
  );
}
