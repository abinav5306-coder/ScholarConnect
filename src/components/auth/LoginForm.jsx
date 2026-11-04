import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ShieldCheck, Lock, CheckCircle2, HelpCircle, ArrowLeft } from 'lucide-react';
import InputField from './InputField';
import PasswordInput from './PasswordInput';
import PrimaryButton from './PrimaryButton';
import InfoModal from '../InfoModal';
import OtpVerificationModal from './OtpVerificationModal';
import { authAPI } from '../../services/api';

export default function LoginForm({
  role = 'student',
  heading,
  subtitle,
  emailLabel,
  emailPlaceholder,
  buttonText,
  infoBannerText,
  securityNote,
}) {
  const navigate = useNavigate();
  const isIndigo = role === 'student';
  const accent = isIndigo ? 'indigo' : 'teal';

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Status & Validation State
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Modals / Info State
  const [activeModal, setActiveModal] = useState(null); // 'forgot' | 'trouble' | null
  const [showTroubleInline, setShowTroubleInline] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');

  // Email format validator
  const validateEmail = (val) => {
    if (!val || !val.trim()) {
      return 'Email address is required.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) {
      return 'Please enter a valid academic or institutional email address.';
    }
    return null;
  };

  // Password validator
  const validatePassword = (val) => {
    if (!val) {
      return 'Password is required.';
    }
    return null;
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: null }));
    }
    if (statusMessage) {
      setStatusMessage(null);
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: null }));
    }
    if (statusMessage) {
      setStatusMessage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset status message
    setStatusMessage(null);

    // Validate fields
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    if (emailErr || passwordErr) {
      setErrors({
        email: emailErr,
        password: passwordErr,
      });
      return;
    }

    // Clear any previous errors
    setErrors({});
    setIsLoading(true);

    try {
      const res = await authAPI.login({
        email: email.trim(),
        password,
        role,
      });

      setIsLoading(false);
      if (res.token) {
        localStorage.setItem('scholarconnect_token', res.token);
        localStorage.setItem('scholarconnect_user', JSON.stringify(res.user));
        const targetRole = res.user?.role || role;
        if (targetRole === 'admin') {
          navigate('/admin/verifications');
        } else if (targetRole === 'teacher') {
          navigate('/teacher/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      }
    } catch (err) {
      setIsLoading(false);
      // Check if account needs OTP verification
      if (err.data?.requireOtp) {
        setOtpEmail(err.data.email || email.trim());
        setOtpModalOpen(true);
        setStatusMessage({
          type: 'info',
          text: err.data.message || 'Your email address must be verified. A verification code has been dispatched to your email.',
        });
        return;
      }

      setStatusMessage({
        type: 'error',
        text: err.message || 'Invalid credentials or account issue.',
      });
    }
  };

  const handleForgotPasswordClick = (e) => {
    e.preventDefault();
    setActiveModal('forgot');
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 sm:p-8 text-left transition-all">
      {/* Mobile-only Logo and Back link */}
      <div className="flex lg:hidden items-center justify-between pb-5 mb-5 border-b border-slate-100">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
          {role === 'student' ? 'Student Portal' : 'Teacher Portal'}
        </span>
        <Link
          to="/login"
          className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Switch Portal</span>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {heading}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {subtitle}
        </p>
      </div>

      {/* Optional Information Banner (e.g. Teacher Verification Notice) */}
      {infoBannerText && (
        <div className="mb-6 p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/80 flex items-start gap-3 text-xs text-teal-800">
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed font-medium">{infoBannerText}</span>
        </div>
      )}

      {/* Status Message (e.g., submission notification) */}
      {statusMessage && (
        <div 
          className="mb-6 p-4 rounded-xl bg-indigo-50/90 border border-indigo-200/90 flex items-start gap-3 text-xs sm:text-sm text-indigo-900 animate-fadeIn"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed font-medium">
            {statusMessage.text}
          </div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <InputField
          id={`${role}-email`}
          label={emailLabel}
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder={emailPlaceholder}
          icon={Mail}
          error={errors.email}
          required
          autoComplete="email"
          disabled={isLoading}
          accent={accent}
        />

        <PasswordInput
          id={`${role}-password`}
          label="Password"
          value={password}
          onChange={handlePasswordChange}
          placeholder="Enter your password"
          error={errors.password}
          required
          autoComplete="current-password"
          disabled={isLoading}
          accent={accent}
        />

        {/* Remember me and Forgot Password */}
        <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              id={`${role}-remember-me`}
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
              className={`w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-colors ${
                isIndigo ? 'accent-indigo-600' : 'accent-teal-600'
              }`}
            />
            <span className="text-slate-600 font-medium">Remember me</span>
          </label>

          <button
            type="button"
            onClick={handleForgotPasswordClick}
            className={`font-semibold hover:underline focus:outline-none focus-visible:ring-2 rounded-sm ${
              isIndigo ? 'text-indigo-600 focus-visible:ring-indigo-600' : 'text-teal-600 focus-visible:ring-teal-600'
            }`}
          >
            Forgot password?
          </button>
        </div>

        {/* Primary Submit Button */}
        <div className="pt-2">
          <PrimaryButton
            id={`${role}-submit-button`}
            type="submit"
            loading={isLoading}
            accent={accent}
          >
            {buttonText}
          </PrimaryButton>
        </div>

        {/* Register navigation link */}
        <div className="text-center pt-1">
          <p className="text-xs sm:text-sm text-slate-600">
            Don't have an account?{' '}
            <Link
              to={isIndigo ? '/register/student' : '/register/teacher'}
              className={`font-semibold hover:underline inline-flex items-center gap-1 ${
                isIndigo ? 'text-indigo-600 hover:text-indigo-800' : 'text-teal-600 hover:text-teal-800'
              }`}
            >
              {isIndigo ? 'Register as Student' : 'Register as Teacher'}
            </Link>
          </p>
        </div>

        {/* Having trouble signing in? */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => setShowTroubleInline((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors font-medium focus:outline-none focus-visible:underline"
            aria-expanded={showTroubleInline}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Having trouble signing in?</span>
          </button>

          {showTroubleInline && (
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 text-left space-y-1.5 animate-fadeIn">
              <p className="font-semibold text-slate-800">Assistance for Academic Accounts:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                <li>Make sure to use your university email address (`.edu` or institutional domain).</li>
                <li>Single Sign-On (SSO) integration will be activated in the next platform release.</li>
                <li>For credential questions, please contact your university's ScholarConnect liaison.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Security Info Note */}
        {securityNote && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Lock className="w-3.5 h-3.5" />
            <span>{securityNote}</span>
          </div>
        )}
      </form>

      {/* Forgot Password Modal */}
      <InfoModal
        isOpen={activeModal === 'forgot'}
        onClose={() => setActiveModal(null)}
        title="Password Recovery"
        message={`Password recovery and automated credential reset are currently undergoing security auditing and will be enabled in the upcoming release.\n\nIn the meantime, your university department administrator or academic coordinator can assist with credential management.`}
        type="info"
      />

      {/* Email OTP Verification Modal */}
      <OtpVerificationModal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        email={otpEmail}
        role={role}
        onSuccess={(authData) => {
          const targetRole = authData.user?.role || role;
          if (targetRole === 'admin') {
            navigate('/admin/verifications');
          } else if (targetRole === 'teacher') {
            navigate('/teacher/dashboard');
          } else {
            navigate('/student/dashboard');
          }
        }}
      />
    </div>
  );
}
