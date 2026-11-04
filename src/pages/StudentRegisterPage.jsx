import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Building2, 
  BookOpen, 
  GraduationCap, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import InputField from '../components/auth/InputField';
import PasswordInput from '../components/auth/PasswordInput';
import SelectField from '../components/auth/SelectField';
import PrimaryButton from '../components/auth/PrimaryButton';
import InfoModal from '../components/InfoModal';
import OtpVerificationModal from '../components/auth/OtpVerificationModal';
import { authAPI } from '../services/api';

const DEGREE_OPTIONS = [
  'B.E.',
  'B.Tech.',
  'B.Sc.',
  'BCA.',
  'M.E.',
  'M.Tech.',
  'M.Sc.',
  'MCA.',
  'Ph.D.',
  'Other'
];

const ACADEMIC_YEAR_OPTIONS = [
  'First Year',
  'Second Year',
  'Third Year',
  'Fourth Year',
  'Fifth Year',
  'Postgraduate',
  'Research Scholar',
  'Other'
];

const GRADUATION_YEAR_OPTIONS = [
  '2024',
  '2025',
  '2026',
  '2027',
  '2028',
  '2029',
  '2030',
  '2031',
  '2032',
  '2033',
  '2034',
  '2035'
];

export default function StudentRegisterPage() {
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    institution: '',
    department: '',
    degreeProgram: '',
    academicYear: '',
    graduationYear: '',
    agreeTerms: false,
  });

  // Validation & UI State
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'terms' | 'privacy' | null
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');

  // Input change handler
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
    if (statusMessage) {
      setStatusMessage(null);
    }
  };

  // Validation Logic
  const validateForm = () => {
    const newErrors = {};

    // Section A: Personal Information
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter a valid full name (at least 2 characters).';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address (e.g. you@university.edu).';
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

    // Section B: Academic Information
    if (!formData.institution.trim()) {
      newErrors.institution = 'College or University name is required.';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department name is required.';
    }

    if (!formData.degreeProgram) {
      newErrors.degreeProgram = 'Please select your degree program.';
    }

    if (!formData.academicYear) {
      newErrors.academicYear = 'Please select your current academic year.';
    }

    if (formData.graduationYear) {
      const year = parseInt(formData.graduationYear, 10);
      if (isNaN(year) || year < 2024 || year > 2035) {
        newErrors.graduationYear = 'Please provide a valid graduation year (2024-2035).';
      }
    }

    // Section C: Terms Checkbox
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
      // Scroll to the first error field smoothly
      const firstErrorKey = Object.keys(validationErrors)[0];
      const element = document.getElementById(firstErrorKey) || document.getElementById(`student-${firstErrorKey}`);
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
        role: 'student',
        institution: formData.institution.trim(),
        department: formData.department.trim(),
        degree: formData.degreeProgram,
        academicYear: formData.academicYear,
        graduationYear: formData.graduationYear,
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
      role="student"
      variant="centered"
      backLink="/register"
      backText="Back to Role Selection"
      maxWidth="max-w-3xl"
    >
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 sm:p-10 text-left transition-all">
        {/* Navigation pill for mobile */}
        <div className="flex sm:hidden items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
            Student Portal
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
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-3">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Student Registration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create Your Student Account
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1.5 leading-relaxed">
            Start discovering research opportunities and academic collaborations.
          </p>
        </div>

        {/* Informational Message upon valid completion */}
        {statusMessage && (
          <div 
            className="mb-8 p-4 sm:p-5 rounded-2xl bg-indigo-50/90 border border-indigo-200/90 flex items-start gap-3.5 text-xs sm:text-sm text-indigo-950 animate-fadeIn"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-indigo-900 text-sm">
                Registration Form Submitted
              </p>
              <p className="leading-relaxed font-medium text-indigo-800">
                {statusMessage.text}
              </p>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          
          {/* SECTION A: Personal Information */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold">
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
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                icon={User}
                error={errors.fullName}
                required
                autoComplete="name"
                disabled={isLoading}
                accent="indigo"
                className="sm:col-span-2"
              />

              <InputField
                id="email"
                label="Email Address"
                type="email"
                placeholder="you@university.edu"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                icon={Mail}
                error={errors.email}
                required
                autoComplete="email"
                disabled={isLoading}
                accent="indigo"
                className="sm:col-span-2"
                helperText="Use your college or personal email address."
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
                accent="indigo"
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
                accent="indigo"
                helperText="Must match the password above."
              />
            </div>
          </section>

          {/* SECTION B: Academic Information */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold">
                B
              </span>
              <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                Academic Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                id="institution"
                label="College / University"
                placeholder="Enter your institution name"
                value={formData.institution}
                onChange={(e) => handleChange('institution', e.target.value)}
                icon={Building2}
                error={errors.institution}
                required
                disabled={isLoading}
                accent="indigo"
                className="sm:col-span-2"
              />

              <InputField
                id="department"
                label="Department"
                placeholder="e.g. Computer Science and Engineering"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                icon={BookOpen}
                error={errors.department}
                required
                disabled={isLoading}
                accent="indigo"
                className="sm:col-span-2"
              />

              <SelectField
                id="degreeProgram"
                label="Degree Program"
                placeholder="Select degree program"
                options={DEGREE_OPTIONS}
                value={formData.degreeProgram}
                onChange={(e) => handleChange('degreeProgram', e.target.value)}
                icon={GraduationCap}
                error={errors.degreeProgram}
                required
                disabled={isLoading}
                accent="indigo"
              />

              <SelectField
                id="academicYear"
                label="Current Academic Year"
                placeholder="Select academic year"
                options={ACADEMIC_YEAR_OPTIONS}
                value={formData.academicYear}
                onChange={(e) => handleChange('academicYear', e.target.value)}
                icon={Calendar}
                error={errors.academicYear}
                required
                disabled={isLoading}
                accent="indigo"
              />

              <SelectField
                id="graduationYear"
                label="Expected Graduation Year (Optional)"
                placeholder="Select graduation year"
                options={GRADUATION_YEAR_OPTIONS}
                value={formData.graduationYear}
                onChange={(e) => handleChange('graduationYear', e.target.value)}
                icon={Calendar}
                error={errors.graduationYear}
                disabled={isLoading}
                accent="indigo"
                className="sm:col-span-2"
                helperText="Estimated year of program completion."
              />
            </div>
          </section>

          {/* SECTION C: Account Agreement */}
          <section className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold">
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
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                />
                <label htmlFor="agreeTerms" className="text-xs sm:text-sm text-slate-700 leading-normal select-none">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setActiveModal('terms')}
                    className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-sm"
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => setActiveModal('privacy')}
                    className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-sm"
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
              id="student-register-submit"
              type="submit"
              loading={isLoading}
              loadingText="Creating Student Account..."
              accent="indigo"
            >
              Create Student Account
            </PrimaryButton>

            {/* Navigation back to Student Login */}
            <div className="text-center pt-2">
              <p className="text-xs sm:text-sm text-slate-600">
                Already have an account?{' '}
                <Link
                  to="/login/student"
                  className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1"
                >
                  Student Login
                </Link>
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-100">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>Identity verification will be activated in the next development phase.</span>
            </div>
          </div>
        </form>
      </div>

      {/* Terms of Service Modal */}
      <InfoModal
        isOpen={activeModal === 'terms'}
        onClose={() => setActiveModal(null)}
        title="Terms of Service"
        message={`Welcome to ScholarConnect. By registering for a student account, you agree to:

1. Academic Honesty: Provide accurate academic information regarding your enrollment, degree program, and institutional affiliation.
2. Collaboration Code: Treat mentors, faculty researchers, and student peers with mutual respect in all collaborative research forums.
3. Intellectual Property: Respect research confidentiality, non-disclosure agreements, and project ownership rules set by research labs.
4. Portal Security: Keep your account credentials confidential and report any unauthorized access promptly.`}
        type="info"
      />

      {/* Privacy Policy Modal */}
      <InfoModal
        isOpen={activeModal === 'privacy'}
        onClose={() => setActiveModal(null)}
        title="Privacy Policy"
        message={`ScholarConnect is committed to protecting your academic privacy:

1. Data Usage: Your personal details and academic credentials are used exclusively to match you with verified research opportunities and academic mentors.
2. No Credential Sharing: We never sell student data or share passwords. Passwords are never stored in browser client storage.
3. Institutional Verification: In the upcoming release, university identity validation will confirm active student status through official academic verification protocols.`}
        type="info"
      />

      {/* Email OTP Verification Modal */}
      <OtpVerificationModal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        email={otpEmail}
        role="student"
      />
    </AuthLayout>
  );
}
