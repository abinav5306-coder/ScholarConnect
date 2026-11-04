import React, { useState, useEffect, useRef } from 'react';
import { Mail, Clock, RefreshCw, AlertCircle, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { authAPI } from '../../services/api';

/**
 * OtpVerificationModal
 * Modal to enter 6-digit email OTP during registration or unverified login.
 */
export default function OtpVerificationModal({
  isOpen,
  onClose,
  email,
  role = 'student',
  onSuccess,
}) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // 5-minute countdown (300 seconds)
  const [timeLeft, setTimeLeft] = useState(300);
  // 60-second resend cooldown
  const [resendCooldown, setResendCooldown] = useState(60);

  const inputRefs = useRef([]);

  // Reset & start timers when modal opens
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setError('');
      setSuccessMsg('');
      setTimeLeft(300);
      setResendCooldown(60);

      // Auto-focus first input
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 100);
    }
  }, [isOpen]);

  // Expiry timer effect
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  // Resend cooldown timer effect
  useEffect(() => {
    if (!isOpen || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, resendCooldown]);

  if (!isOpen) return null;

  // Format time mm:ss
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setError('');

    // Advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 filled
    if (value && index === 5 && newDigits.every((d) => d !== '')) {
      handleVerify(newDigits.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const arr = pasteData.split('');
      setDigits(arr);
      setError('');
      handleVerify(pasteData);
    }
  };

  const handleVerify = async (codeToVerify) => {
    const otpCode = codeToVerify || digits.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authAPI.verifyOtp({
        email,
        otp: otpCode,
        purpose: 'email_verification',
      });

      if (res.token) {
        localStorage.setItem('scholarconnect_token', res.token);
        localStorage.setItem('scholarconnect_user', JSON.stringify(res.user));
      }

      setSuccessMsg('Email successfully verified! Redirecting to dashboard...');
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(res);
        } else {
          const targetRole = res.user?.role || role;
          window.location.href = targetRole === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
        }
      }, 1200);
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setError('');
    try {
      await authAPI.resendOtp({ email, purpose: 'email_verification' });
      setResendCooldown(60);
      setTimeLeft(300);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setSuccessMsg('A new verification code has been dispatched to your email.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to resend verification code. Please wait and try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-6 sm:p-8 text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Icon Header */}
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
          <Mail className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Academic Security Verification</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          Verify Your Email
        </h2>

        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          We have dispatched a 6-digit verification code to:
        </p>
        <p className="text-xs sm:text-sm font-bold text-indigo-700 mt-0.5 truncate max-w-xs mx-auto">
          {email}
        </p>

        {/* 6 Digit Inputs */}
        <div className="mt-6 flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              disabled={loading || timeLeft <= 0}
              className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-extrabold rounded-2xl border transition-all outline-none ${
                digit
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-100'
                  : 'border-slate-300 bg-slate-50/70 text-slate-800 hover:border-slate-400 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-100'
              } ${timeLeft <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          ))}
        </div>

        {/* Timers Row */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 px-2">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Code expires in:</span>
            <strong className={`font-mono ${timeLeft < 60 ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
              {formatTime(timeLeft)}
            </strong>
          </span>

          {resendCooldown > 0 ? (
            <span className="text-[11px] text-slate-400">
              Resend in {resendCooldown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
              <span>Resend OTP</span>
            </button>
          )}
        </div>

        {/* Error / Feedback alerts */}
        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-left animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 text-left animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => handleVerify()}
            disabled={loading || timeLeft <= 0 || digits.some((d) => d === '')}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verifying Code...</span>
              </>
            ) : (
              <span>Verify & Continue</span>
            )}
          </button>
        </div>

        <p className="text-[11px] text-slate-400 mt-4">
          Didn't receive an email? Check your spam/junk folder or request a new code above.
        </p>
      </div>
    </div>
  );
}
