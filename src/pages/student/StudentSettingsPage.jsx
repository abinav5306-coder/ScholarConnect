import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  CheckCircle2, 
  Mail, 
  BellRing, 
  Sparkles, 
  MessageSquare, 
  ShieldCheck, 
  Save, 
  Loader2 
} from 'lucide-react';
import StudentLayout from '../../layouts/StudentLayout';
import { useScholar } from '../../context/ScholarContext';
import { notificationAPI } from '../../services/api';

export default function StudentSettingsPage() {
  const { resetDemoData } = useScholar();
  const [resetMessage, setResetMessage] = useState('');

  // Notification Preferences State
  const [preferences, setPreferences] = useState({
    applicationStatusEmails: true,
    opportunityAnnouncementEmails: true,
    messageEmails: true,
    verificationEmails: true,
  });
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefSaveSuccess, setPrefSaveSuccess] = useState('');
  const [prefSaveError, setPrefSaveError] = useState('');

  // Load preferences from backend on mount
  useEffect(() => {
    async function loadPreferences() {
      setIsLoadingPrefs(true);
      try {
        const res = await notificationAPI.getPreferences();
        if (res && res.success && res.preferences) {
          setPreferences({
            applicationStatusEmails: res.preferences.applicationStatusEmails !== false,
            opportunityAnnouncementEmails: res.preferences.opportunityAnnouncementEmails !== false,
            messageEmails: res.preferences.messageEmails !== false,
            verificationEmails: res.preferences.verificationEmails !== false,
          });
        }
      } catch (err) {
        console.warn('Could not load preferences from backend, using defaults:', err.message);
      } finally {
        setIsLoadingPrefs(false);
      }
    }
    loadPreferences();
  }, []);

  const handleTogglePreference = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setPrefSaveSuccess('');
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setIsSavingPrefs(true);
    setPrefSaveSuccess('');
    setPrefSaveError('');

    try {
      const res = await notificationAPI.updatePreferences(preferences);
      if (res && res.success) {
        setPrefSaveSuccess('Your email notification preferences have been saved successfully in MongoDB Atlas.');
        setTimeout(() => setPrefSaveSuccess(''), 5000);
      } else {
        throw new Error(res?.message || 'Failed to update preferences.');
      }
    } catch (err) {
      setPrefSaveError(err.message || 'Error saving notification preferences.');
      setTimeout(() => setPrefSaveError(''), 6000);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all demo data (opportunities, applications, profiles) to initial default states?')) {
      resetDemoData();
      setResetMessage('Demo data restored to initial factory defaults.');
      setTimeout(() => setResetMessage(''), 4000);
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-6 text-left">
        {/* Page Header */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
            <Mail className="w-3.5 h-3.5" />
            <span>Preferences & Privacy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Account & Application Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your automated email notifications, communication alerts, and session preferences.
          </p>
        </div>

        {/* Global Reset Alert */}
        {resetMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{resetMessage}</span>
          </div>
        )}

        {/* EMAIL NOTIFICATION PREFERENCES SECTION */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 sm:p-8 space-y-6 text-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Automated Email Preferences
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Control which transactional updates are delivered to your registered email address.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                MongoDB Synced
              </span>
            </div>

            {/* Success & Error Feedback */}
            {prefSaveSuccess && (
              <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{prefSaveSuccess}</span>
              </div>
            )}
            {prefSaveError && (
              <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {prefSaveError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSavePreferences} className="mt-5 space-y-3.5">
              
              {/* 1. Application Status Emails */}
              <label className="flex items-start justify-between p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 cursor-pointer transition-colors">
                <div className="space-y-0.5 pr-4">
                  <span className="font-bold text-slate-900 text-xs block">
                    Application Status Notifications
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Receive instant email updates when faculty mentors review, shortlist, select, waitlist, or communicate decisions on your submitted research applications.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.applicationStatusEmails}
                  onChange={() => handleTogglePreference('applicationStatusEmails')}
                  className="mt-1 h-4 w-4 rounded accent-indigo-600 cursor-pointer shrink-0"
                />
              </label>

              {/* 2. Opportunity Announcement Emails */}
              <label className="flex items-start justify-between p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 cursor-pointer transition-colors">
                <div className="space-y-0.5 pr-4">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>New Opportunity Announcement Emails</span>
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Receive tailored email digests when verified faculty mentors post new research projects, internships, or hackathons matching your technical skills and academic department.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.opportunityAnnouncementEmails}
                  onChange={() => handleTogglePreference('opportunityAnnouncementEmails')}
                  className="mt-1 h-4 w-4 rounded accent-indigo-600 cursor-pointer shrink-0"
                />
              </label>

              {/* 3. Real-Time Message Emails */}
              <label className="flex items-start justify-between p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 cursor-pointer transition-colors">
                <div className="space-y-0.5 pr-4">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Real-Time Message Alert Emails</span>
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Receive email notifications when a mentor messages you while you are offline or away from ScholarConnect. For your privacy, message contents are never included in emails.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.messageEmails}
                  onChange={() => handleTogglePreference('messageEmails')}
                  className="mt-1 h-4 w-4 rounded accent-indigo-600 cursor-pointer shrink-0"
                />
              </label>

              {/* 4. Academic Verification Emails */}
              <label className="flex items-start justify-between p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 cursor-pointer transition-colors">
                <div className="space-y-0.5 pr-4">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Academic Identity Verification Emails</span>
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Receive email updates regarding the administrative review of your student ID card and academic verification credentials.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.verificationEmails}
                  onChange={() => handleTogglePreference('verificationEmails')}
                  className="mt-1 h-4 w-4 rounded accent-indigo-600 cursor-pointer shrink-0"
                />
              </label>

              {/* Mandatory Security Notice */}
              <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-[11px] text-indigo-900 flex items-start gap-2">
                <span className="font-bold shrink-0">🔒 Mandatory Security Notice:</span>
                <span>
                  6-digit email OTPs, login verification codes, and critical account security alerts are mandatory to protect your academic identity and cannot be disabled.
                </span>
              </div>

              {/* Save Button */}
              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSavingPrefs || isLoadingPrefs}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSavingPrefs ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to MongoDB...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Email Preferences</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* Demonstration Controls */}
          <div className="space-y-3 pt-6 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
              Demonstration Environment State
            </h3>
            <p className="text-slate-500">
              Restore local demonstration session caches to default sample data if needed.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Demo Data to Defaults</span>
            </button>
          </div>

        </div>
      </div>
    </StudentLayout>
  );
}
