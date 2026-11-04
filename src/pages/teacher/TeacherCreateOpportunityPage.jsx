import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  PlusCircle, 
  CheckCircle2, 
  ArrowLeft, 
  X, 
  Save, 
  Send,
  ShieldAlert
} from 'lucide-react';
import TeacherLayout from '../../layouts/TeacherLayout';
import { useScholar } from '../../context/ScholarContext';

const CATEGORY_OPTIONS = [
  'Research Project',
  'Internship',
  'Hackathon',
  'Startup Opportunity',
  'Research Assistantship',
  'Workshops & Conferences',
  'Conference',
  'Innovation Challenge',
  'Open Source Projects',
  'Academic Collaborations',
];

const SUGGESTED_SKILLS = [
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
  'PyTorch',
  'Docker',
  'MATLAB',
];

const ACADEMIC_YEARS = [
  'First Year',
  'Second Year',
  'Third Year',
  'Fourth Year',
  'Postgraduate',
  'Research Scholar',
];

const DEGREE_OPTIONS = [
  'BE',
  'BTech',
  'BSc',
  'BCA',
  'ME',
  'MTech',
  'MSc',
  'MCA',
  'PhD',
  'All Degrees',
];

const WORK_MODES = ['Online', 'Offline', 'Hybrid'];
const PARTICIPATION_TYPES = ['Individual', 'Team'];

export default function TeacherCreateOpportunityPage() {
  const { teacherProfile, createOpportunity } = useScholar();
  const navigate = useNavigate();
  const isVerified = teacherProfile.verificationStatus === 'Verified';

  // Form State
  const [formData, setFormData] = useState({
    // Section A: Basic Info
    title: '',
    category: 'Research Project',
    shortDescription: '',
    detailedDescription: '',
    researchObjectives: '',

    // Section B: Skills & Eligibility
    skills: ['Python', 'Machine Learning'],
    eligibilityYears: ['Second Year', 'Third Year', 'Fourth Year'],
    eligibleDegrees: ['BTech', 'BE', 'MTech'],
    eligibleDepartments: 'Computer Science, Electrical Engineering, Data Science',
    positions: 3,
    participationType: 'Individual',

    // Section C: Opportunity Details
    institution: teacherProfile.institution || 'ABC University',
    department: teacherProfile.department || 'Department of Computer Science',
    duration: '4 Months',
    workMode: 'Hybrid',
    deadline: '',
    startDate: '',
    benefits: 'Certificate of Research, Conference co-authorship consideration, lab stipend of ₹10,000/month.',
    instructions: 'Submit your GitHub profile, academic transcript, and relevant project links.',
  });

  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Handle simple change
  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Add skill tag
  const handleAddSkill = (e) => {
    e?.preventDefault();
    const trimmed = skillInput.trim();
    if (trimmed && !formData.skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  // Toggle year
  const handleToggleYear = (year) => {
    setFormData((prev) => {
      const exists = prev.eligibilityYears.includes(year);
      return {
        ...prev,
        eligibilityYears: exists
          ? prev.eligibilityYears.filter((y) => y !== year)
          : [...prev.eligibilityYears, year],
      };
    });
  };

  // Toggle degree
  const handleToggleDegree = (deg) => {
    setFormData((prev) => {
      if (deg === 'All Degrees') {
        return { ...prev, eligibleDegrees: ['All Degrees'] };
      }
      const filtered = prev.eligibleDegrees.filter((d) => d !== 'All Degrees');
      const exists = filtered.includes(deg);
      return {
        ...prev,
        eligibleDegrees: exists
          ? filtered.filter((d) => d !== deg)
          : [...filtered, deg],
      };
    });
  };

  // Validation
  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Opportunity title is required.';
    if (!formData.category) errs.category = 'Opportunity category is required.';
    if (!formData.shortDescription.trim()) errs.shortDescription = 'Short summary description is required.';
    if (!formData.detailedDescription.trim()) errs.detailedDescription = 'Detailed description is required.';
    if (!formData.researchObjectives.trim()) errs.researchObjectives = 'Research objectives are required.';
    if (formData.skills.length === 0) errs.skills = 'Please add at least one required skill tag.';
    if (formData.eligibilityYears.length === 0) errs.eligibilityYears = 'Please select at least one eligible academic year.';
    if (!formData.institution.trim()) errs.institution = 'Institution name is required.';
    if (!formData.deadline) errs.deadline = 'Application deadline is required.';
    if (formData.positions < 1) errs.positions = 'Please specify at least 1 position.';
    return errs;
  };

  // Submit & Publish
  const handlePublish = (e, isDraft = false) => {
    e.preventDefault();
    setSuccessMessage('');

    if (!isDraft && !isVerified) {
      setErrors({
        general: 'Opportunity publishing is restricted to verified faculty members. Please complete verification in your Faculty Profile.',
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0 && !isDraft) {
      setErrors(validationErrors);
      // Scroll to first error
      window.scrollTo({ top: 150, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      createOpportunity({
        ...formData,
        status: isDraft ? 'Draft' : 'Accepting Applications',
        teacherName: teacherProfile.fullName,
        teacherEmail: teacherProfile.email,
      });

      setIsSubmitting(false);
      setSuccessMessage('Opportunity Published Successfully! It is now visible across both portals.');

      // Smooth scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Navigate to My Opportunities after 1.8s
      setTimeout(() => {
        navigate('/teacher/my-opportunities');
      }, 1600);
    }, 700);
  };

  return (
    <TeacherLayout>
      <div className="space-y-6 text-left max-w-4xl mx-auto">
        
        {/* Navigation Breadcrumb / Header */}
        <div className="flex items-center justify-between">
          <Link
            to="/teacher/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Teacher Dashboard</span>
          </Link>
          <span className="text-xs text-slate-400">Step 1 of 1 • Opportunity Publishing</span>
        </div>

        {/* Title Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 sm:p-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
            <PlusCircle className="w-3.5 h-3.5 text-teal-600" />
            <span>Faculty Opportunity Creator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Publish a Research or Project Opportunity
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Publish research assistantships, hackathon calls, and lab projects. Published records are automatically synchronized and visible to students in their <strong>Explore Opportunities</strong> section.
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 sm:p-5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950 text-sm font-semibold flex items-start gap-3 animate-fadeIn shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-teal-900">{successMessage}</p>
              <p className="text-xs text-teal-700 font-normal mt-0.5">
                Redirecting to your My Opportunities page...
              </p>
            </div>
          </div>
        )}

        {/* Verification Warning Alert */}
        {!isVerified && (
          <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn shadow-xs">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  Faculty Identity Verification Required
                </h3>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  Only verified faculty mentors and researchers are authorized to publish opportunities to students. Your current verification status is <span className="font-bold uppercase text-amber-900">{teacherProfile.verificationStatus || 'Not Submitted'}</span>.
                </p>
              </div>
            </div>
            <Link
              to="/teacher/profile"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 self-start sm:self-auto shadow-xs transition-colors"
            >
              Verify in Faculty Profile
            </Link>
          </div>
        )}

        {errors.general && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {errors.general}
          </div>
        )}

        {/* The 4-Section Form */}
        <form onSubmit={(e) => handlePublish(e, false)} noValidate className="space-y-8">
          
          {/* ======================================================== */}
          {/* SECTION A: BASIC INFORMATION                             */}
          {/* ======================================================== */}
          <section className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-teal-100 text-teal-800 text-xs font-bold">
                A
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                  Basic Information
                </h2>
                <p className="text-xs text-slate-400">Core identity and description of your academic call</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Opportunity Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g. AI-Based Healthcare Prediction System / Autonomous Underwater Vehicle Lab"
                  className={`w-full text-xs sm:text-sm rounded-xl border p-3 outline-none ${
                    errors.title ? 'border-rose-400' : 'border-slate-200 focus:border-teal-600'
                  }`}
                />
                {errors.title && <p className="text-xs text-rose-600 mt-1">{errors.title}</p>}
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Opportunity Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-teal-600 p-3 outline-none bg-white font-medium"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Short Description (Summary snippet for cards) *
                </label>
                <textarea
                  rows={2}
                  value={formData.shortDescription}
                  onChange={(e) => handleChange('shortDescription', e.target.value)}
                  placeholder="A concise 1-2 sentence overview of the project..."
                  className={`w-full text-xs rounded-xl border p-3 outline-none leading-relaxed ${
                    errors.shortDescription ? 'border-rose-400' : 'border-slate-200 focus:border-teal-600'
                  }`}
                />
                {errors.shortDescription && (
                  <p className="text-xs text-rose-600 mt-1">{errors.shortDescription}</p>
                )}
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detailed Description (Full project scope, background, methodology) *
                </label>
                <textarea
                  rows={4}
                  value={formData.detailedDescription}
                  onChange={(e) => handleChange('detailedDescription', e.target.value)}
                  placeholder="Provide complete context, research methodology, tools, and expectations..."
                  className={`w-full text-xs rounded-xl border p-3 outline-none leading-relaxed ${
                    errors.detailedDescription ? 'border-rose-400' : 'border-slate-200 focus:border-teal-600'
                  }`}
                />
                {errors.detailedDescription && (
                  <p className="text-xs text-rose-600 mt-1">{errors.detailedDescription}</p>
                )}
              </div>

              {/* Research Objectives */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Research Objectives / Project Goals *
                </label>
                <textarea
                  rows={3}
                  value={formData.researchObjectives}
                  onChange={(e) => handleChange('researchObjectives', e.target.value)}
                  placeholder="List specific milestones: 1. Dataset curation, 2. Model training, 3. Paper submission..."
                  className={`w-full text-xs rounded-xl border p-3 outline-none leading-relaxed ${
                    errors.researchObjectives ? 'border-rose-400' : 'border-slate-200 focus:border-teal-600'
                  }`}
                />
                {errors.researchObjectives && (
                  <p className="text-xs text-rose-600 mt-1">{errors.researchObjectives}</p>
                )}
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* SECTION B: SKILLS AND ELIGIBILITY                        */}
          {/* ======================================================== */}
          <section className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-teal-100 text-teal-800 text-xs font-bold">
                B
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                  Skills & Academic Eligibility
                </h2>
                <p className="text-xs text-slate-400">Target qualifications and student prerequisites</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Required Skills Tag Input */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Required Skills (Selected: {formData.skills.length}) *
                </label>

                {/* Selected Tags list */}
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[46px] items-center">
                  {formData.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="p-0.5 hover:bg-teal-200/60 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add Custom Skill Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder="Type skill (e.g. Computer Vision) and press Enter"
                    className="flex-1 text-xs rounded-xl border border-slate-200 focus:border-teal-600 p-2.5 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold"
                  >
                    Add Skill
                  </button>
                </div>

                {/* Suggested Quick Add Tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 font-semibold mr-1">Suggestions:</span>
                  {SUGGESTED_SKILLS.map((s) => {
                    const isSelected = formData.skills.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          if (isSelected) handleRemoveSkill(s);
                          else setFormData((prev) => ({ ...prev, skills: [...prev.skills, s] }));
                        }}
                        className={`text-[11px] px-2 py-0.5 rounded-md border transition-all ${
                          isSelected
                            ? 'bg-teal-700 text-white border-teal-700'
                            : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{s}
                      </button>
                    );
                  })}
                </div>
                {errors.skills && <p className="text-xs text-rose-600 mt-1">{errors.skills}</p>}
              </div>

              {/* Eligible Academic Years Checkboxes */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Eligible Academic Years *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ACADEMIC_YEARS.map((year) => {
                    const checked = formData.eligibilityYears.includes(year);
                    return (
                      <label
                        key={year}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                          checked
                            ? 'bg-teal-50/80 border-teal-300 text-teal-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleYear(year)}
                          className="rounded accent-teal-600"
                        />
                        <span>{year}</span>
                      </label>
                    );
                  })}
                </div>
                {errors.eligibilityYears && (
                  <p className="text-xs text-rose-600 mt-1">{errors.eligibilityYears}</p>
                )}
              </div>

              {/* Eligible Degrees Multi-select */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Eligible Degree Programs
                </label>
                <div className="flex flex-wrap gap-2">
                  {DEGREE_OPTIONS.map((deg) => {
                    const checked = formData.eligibleDegrees.includes(deg);
                    return (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => handleToggleDegree(deg)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          checked
                            ? 'bg-teal-700 text-white border-teal-700'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {checked ? '✓ ' : ''}{deg}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Eligible Departments & Headcount */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Eligible Departments
                  </label>
                  <input
                    type="text"
                    value={formData.eligibleDepartments}
                    onChange={(e) => handleChange('eligibleDepartments', e.target.value)}
                    placeholder="e.g. Computer Science, Robotics, Electrical Engineering"
                    className="w-full text-xs rounded-xl border border-slate-200 focus:border-teal-600 p-2.5 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Number of Students Required *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.positions}
                    onChange={(e) => handleChange('positions', parseInt(e.target.value, 10) || 1)}
                    className="w-full text-xs rounded-xl border border-slate-200 focus:border-teal-600 p-2.5 outline-none font-bold"
                  />
                </div>
              </div>

              {/* Individual or Team Participation */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Participation Format
                </label>
                <div className="flex items-center gap-4 text-xs">
                  {PARTICIPATION_TYPES.map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="participationType"
                        value={type}
                        checked={formData.participationType === type}
                        onChange={() => handleChange('participationType', type)}
                        className="accent-teal-600"
                      />
                      <span>{type} Participation</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </section>

          {/* ======================================================== */}
          {/* SECTION C: OPPORTUNITY DETAILS                           */}
          {/* ======================================================== */}
          <section className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-teal-100 text-teal-800 text-xs font-bold">
                C
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                  Opportunity Logistics & Dates
                </h2>
                <p className="text-xs text-slate-400">Host university, duration, dates, and benefits</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institution Name *
                </label>
                <input
                  type="text"
                  value={formData.institution}
                  onChange={(e) => handleChange('institution', e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 focus:border-teal-600 p-2.5 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department / Laboratory
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 focus:border-teal-600 p-2.5 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Duration
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  placeholder="e.g. 6 Months / 12 Weeks"
                  className="w-full text-xs rounded-xl border border-slate-200 focus:border-teal-600 p-2.5 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Mode
                </label>
                <select
                  value={formData.workMode}
                  onChange={(e) => handleChange('workMode', e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 focus:border-teal-600 p-2.5 outline-none font-medium bg-white"
                >
                  {WORK_MODES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Application Deadline *
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleChange('deadline', e.target.value)}
                  className={`w-full text-xs rounded-xl border p-2.5 outline-none font-medium ${
                    errors.deadline ? 'border-rose-400' : 'border-slate-200 focus:border-teal-600'
                  }`}
                />
                {errors.deadline && <p className="text-xs text-rose-600 mt-1">{errors.deadline}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 focus:border-teal-600 p-2.5 outline-none font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Benefits / Stipend / Outcomes (Optional)
                </label>
                <input
                  type="text"
                  value={formData.benefits}
                  onChange={(e) => handleChange('benefits', e.target.value)}
                  placeholder="e.g. Co-authorship, stipend of ₹8,000/month, recommendation letter"
                  className="w-full text-xs rounded-xl border border-slate-200 focus:border-teal-600 p-2.5 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Additional Application Instructions
                </label>
                <textarea
                  rows={2}
                  value={formData.instructions}
                  onChange={(e) => handleChange('instructions', e.target.value)}
                  placeholder="Instructions for applicants regarding what documents or links to include..."
                  className="w-full text-xs rounded-xl border border-slate-200 focus:border-teal-600 p-2.5 outline-none leading-relaxed"
                />
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* SECTION D: PUBLISH ACTIONS                               */}
          {/* ======================================================== */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              <span className="font-semibold text-slate-800 block">Cross-Portal Synchronization</span>
              Once published, students can immediately discover, search, and apply for this opportunity.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={(e) => handlePublish(e, true)}
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save as Draft</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !isVerified}
                title={!isVerified ? 'Only verified faculty can publish opportunities' : ''}
                className="flex-1 sm:flex-initial px-7 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Publishing...' : 'Publish Opportunity'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </TeacherLayout>
  );
}
