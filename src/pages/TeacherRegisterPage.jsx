import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Building2, 
  BookOpen, 
  Award, 
  Globe, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowLeft,
  AlertCircle,
  Microscope
} from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import InputField from '../components/auth/InputField';
import PasswordInput from '../components/auth/PasswordInput';
import SelectField from '../components/auth/SelectField';
import TagInput from '../components/auth/TagInput';
import PrimaryButton from '../components/auth/PrimaryButton';
import InfoModal from '../components/InfoModal';
import OtpVerificationModal from '../components/auth/OtpVerificationModal';
import { authAPI } from '../services/api';

const DESIGNATION_OPTIONS = [
  'Assistant Professor',
  'Associate Professor',
  'Professor',
  'Lecturer',
  'Research Scholar',
  'Research Scientist',
  'Other'
];

const SUGGESTED_INTERESTS = [
  'Artificial Intelligence',
  'Machine Learning',
  'Data Science',
  'Cybersecurity',
  'Web Development',
  'Robotics',
  'Internet of Things',
  'Computer Vision',
  'Renewable Energy',
  'Biotechnology',
  'Social Innovation'
];

export default function TeacherRegisterPage() {
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    institution: '',
    department: '',
    designation: '',
    researchInterests: [],
    profileUrl: '',
    agreeTerms: false,
  });

  // Validation & UI State
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'terms' | 'privacy' | null
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');

  // Change handler
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
    if (statusMessage) {
      setStatusMessage(null);
    }
  };

  // Validation logic
  const validateForm = () => {
    const newErrors = {};

    // Section A: Personal Information
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter a valid full name.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Institutional email address is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid institutional email address.';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmation password is required.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    // Section B: Professional Information
    if (!formData.institution.trim()) {
      newErrors.institution = 'College or University name is required.';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department name is required.';
    }

    if (!formData.designation) {
      newErrors.designation = 'Please select your academic designation.';
    }

    if (!formData.researchInterests || formData.researchInterests.length === 0) {
      newErrors.researchInterests = 'Please select or add at least one research interest.';
    }

    if (formData.profileUrl && formData.profileUrl.trim()) {
      try {
        const url = new URL(formData.profileUrl.trim());
        if (!['http:', 'https:'].includes(url.protocol)) {
          newErrors.profileUrl = 'Profile URL must begin with http:// or https://.';
        }
      } catch {
        newErrors.profileUrl = 'Please enter a valid URL (e.g. https://institution.edu/faculty/profile).';
      }
    }

    // Section C: Terms
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the Terms of Service and Privacy Policy to continue.';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage(null);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Smooth scroll to first error
      const firstErrorKey = Object.keys(validationErrors)[0];
      const element = document.getElementById(firstErrorKey) || document.getElementById(`teacher-${firstErrorKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const payload = {
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: 'teacher',
        institution: formData.institution.trim(),
        department: formData.department.trim(),
        designation: formData.designation,
        researchInterests: formData.researchInterests,
        profileUrl: formData.profileUrl?.trim(),
      };

      const res = await authAPI.register(payload);

      setIsLoading(false);
      if (res.requireOtp) {
        setOtpEmail(formData.email.trim());
        setOtpModalOpen(true);
      } else {
        setStatusMessage({
          type: 'success',
          text: 'Registration successful! You may now sign in.',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setIsLoading(false);
      const msg = err.message || 'Registration failed. Please verify your details.';
      setStatusMessage({
        type: 'error',
        text: msg,
      });
      if (err.status === 409) {
        setErrors({ email: 'An account with this email address already exists.' });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <AuthLayout
      role="teacher"
      variant="centered"
      backLink="/register"
      backText="Back to Role Selection"
      maxWidth="max-w-3xl"
    >
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 sm:p-10 text-left transition-all">
        {/* Navigation pill for mobile */}
        <div className="flex sm:hidden items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
            Faculty & Researcher Portal
          </span>
          <Link
            to="/register"
            className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Role Selection</span>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-100 mb-3">
            <Microscope className="w-3.5 h-3.5 text-teal-600" />
            <span>Faculty & Researcher Registration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Join as a Teacher / Researcher
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1.5 leading-relaxed">
            Connect with talented students and start building your research team.
          </p>
        </div>

        {/* Verification Notice Banner */}
        <div className="mb-8 p-3.5 sm:p-4 rounded-xl bg-teal-50/70 border border-teal-200/80 flex items-start gap-3 text-xs sm:text-sm text-teal-900">
          <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed font-medium">
            Teacher and researcher accounts undergo academic affiliation verification prior to opportunity publication to preserve institutional research integrity.
          </div>
        </div>

        {/* Informational Message upon valid completion */}
        {statusMessage && (
          <div 
            className="mb-8 p-4 sm:p-5 rounded-2xl bg-teal-50/90 border border-teal-200/90 flex items-start gap-3.5 text-xs sm:text-sm text-teal-950 animate-fadeIn"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-teal-900 text-sm">
                Registration Form Submitted
              </p>
              <p className="leading-relaxed font-medium text-teal-800">
                {statusMessage.text}
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          
          {/* SECTION A: Personal Information */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold">
                A
              </span>
              <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                Personal Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                id="fullName"
                label="Full Name"
                placeholder="e.g. Dr. Jane Smith / Prof. Robert Davis"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                icon={User}
                error={errors.fullName}
                required
                autoComplete="name"
                disabled={isLoading}
                accent="teal"
                className="sm:col-span-2"
              />

              <InputField
                id="email"
                label="Institutional Email Address"
                type="email"
                placeholder="name@institution.edu"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                icon={Mail}
                error={errors.email}
                required
                autoComplete="email"
                disabled={isLoading}
                accent="teal"
                className="sm:col-span-2"
                helperText="Please use your official university or lab email address."
              />

              <PasswordInput
                id="password"
                label="Password"
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                error={errors.password}
                required
                autoComplete="new-password"
                disabled={isLoading}
                accent="teal"
                helperText="Minimum 8 characters."
              />

              <PasswordInput
                id="confirmPassword"
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                error={errors.confirmPassword}
                required
                autoComplete="new-password"
                disabled={isLoading}
                accent="teal"
                helperText="Must match the password above."
              />
            </div>
          </section>

          {/* SECTION B: Professional Information */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold">
                B
              </span>
              <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                Professional Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                id="institution"
                label="College / University"
                placeholder="Enter your university or research institution"
                value={formData.institution}
                onChange={(e) => handleChange('institution', e.target.value)}
                icon={Building2}
                error={errors.institution}
                required
                disabled={isLoading}
                accent="teal"
                className="sm:col-span-2"
              />

              <InputField
                id="department"
                label="Department"
                placeholder="e.g. Department of Electrical Engineering"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                icon={BookOpen}
                error={errors.department}
                required
                disabled={isLoading}
                accent="teal"
                className="sm:col-span-2"
              />

              <SelectField
                id="designation"
                label="Academic Designation"
                placeholder="Select academic designation"
                options={DESIGNATION_OPTIONS}
                value={formData.designation}
                onChange={(e) => handleChange('designation', e.target.value)}
                icon={Award}
                error={errors.designation}
                required
                disabled={isLoading}
                accent="teal"
                className="sm:col-span-2"
              />

              <TagInput
                id="researchInterests"
                label="Research Interests"
                tags={formData.researchInterests}
                onChange={(tags) => handleChange('researchInterests', tags)}
                suggestedTags={SUGGESTED_INTERESTS}
                placeholder="Add research topic (e.g. Machine Learning) and press Enter"
                error={errors.researchInterests}
                required
                disabled={isLoading}
                accent="teal"
                className="sm:col-span-2"
                helperText="Add keywords representing your lab's active research domains."
              />

              <InputField
                id="profileUrl"
                label="Institutional Profile URL (Optional)"
                placeholder="https://university.edu/faculty/your-profile"
                value={formData.profileUrl}
                onChange={(e) => handleChange('profileUrl', e.target.value)}
                icon={Globe}
                error={errors.profileUrl}
                disabled={isLoading}
                accent="teal"
                className="sm:col-span-2"
                helperText="Link to your departmental faculty page or research lab profile."
              />
            </div>
          </section>

          {/* SECTION C: Account Agreement */}
          <section className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold">
                C
              </span>
              <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                Account Agreement
              </h2>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <input
                  id="agreeTerms"
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => handleChange('agreeTerms', e.target.checked)}
                  disabled={isLoading}
                  aria-invalid={errors.agreeTerms ? 'true' : 'false'}
                  aria-describedby={errors.agreeTerms ? 'agreeTerms-error' : undefined}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 accent-teal-600 cursor-pointer"
                />
                <label htmlFor="agreeTerms" className="text-xs sm:text-sm text-slate-700 leading-normal select-none">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setActiveModal('terms')}
                    className="font-semibold text-teal-600 hover:text-teal-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-sm"
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => setActiveModal('privacy')}
                    className="font-semibold text-teal-600 hover:text-teal-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-sm"
                  >
                    Privacy Policy
                  </button>
                  . <span className="text-rose-500">*</span>
                </label>
              </div>

              {errors.agreeTerms && (
                <p 
                  id="agreeTerms-error" 
                  className="flex items-center gap-1.5 text-xs text-rose-600 font-medium animate-fadeIn pl-7"
                  role="alert"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.agreeTerms}</span>
                </p>
              )}
            </div>
          </section>

          {/* Submit Action */}
          <div className="pt-4 space-y-4">
            <PrimaryButton
              id="teacher-register-submit"
              type="submit"
              loading={isLoading}
              loadingText="Creating Teacher Account..."
              accent="teal"
            >
              Create Teacher Account
            </PrimaryButton>

            {/* Navigation back to Teacher Login */}
            <div className="text-center pt-2">
              <p className="text-xs sm:text-sm text-slate-600">
                Already have an account?{' '}
                <Link
                  to="/login/teacher"
                  className="font-semibold text-teal-600 hover:text-teal-800 hover:underline inline-flex items-center gap-1"
                >
                  Teacher Login
                </Link>
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-100">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Academic affiliation verification will be activated in the next development phase.</span>
            </div>
          </div>
        </form>
      </div>

      {/* Terms of Service Modal */}
      <InfoModal
        isOpen={activeModal === 'terms'}
        onClose={() => setActiveModal(null)}
        title="Faculty & Researcher Terms of Service"
        message={`Welcome to ScholarConnect. By registering as a Faculty Mentor or Researcher, you agree to:

1. Institutional Integrity: Represent your research lab, department, and university credentials accurately.
2. Fair Mentorship: Offer equitable learning, research experience, and credit to participating students.
3. Opportunity Authenticity: Post legitimate academic research projects, grants, or collaborative study openings.
4. Data Confidentiality: Comply with research ethics board policies, institutional privacy guidelines, and non-disclosure standards.`}
        type="info"
      />

      {/* Privacy Policy Modal */}
      <InfoModal
        isOpen={activeModal === 'privacy'}
        onClose={() => setActiveModal(null)}
        title="Faculty Privacy Policy"
        message={`ScholarConnect is dedicated to protecting faculty and institutional research information:

1. Verification Usage: Institutional email addresses and profile links are used solely for identity verification with your university.
2. Safe Communication: Direct contact between students and faculty is channeled through verified platform mechanisms.
3. No Commercial Exploitation: Research interests and contact information will never be shared with commercial third parties.`}
        type="info"
      />

      {/* Email OTP Verification Modal */}
      <OtpVerificationModal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        email={otpEmail}
        role="teacher"
      />
    </AuthLayout>
  );
}
