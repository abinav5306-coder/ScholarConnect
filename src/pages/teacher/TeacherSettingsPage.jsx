import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  CheckCircle2, 
  Mail, 
  BellRing, 
  Users, 
  MessageSquare, 
  ShieldCheck, 
  Save, 
  Loader2 
} from 'lucide-react';
import TeacherLayout from '../../layouts/TeacherLayout';
import { useScholar } from '../../context/ScholarContext';
import { notificationAPI } from '../../services/api';

export default function TeacherSettingsPage() {
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
        console.warn('Could not load faculty preferences from backend, using defaults:', err.message);
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
        setPrefSaveSuccess('Faculty email notification preferences saved successfully in MongoDB Atlas.');
        setTimeout(() => setPrefSaveSuccess(''), 5000);
      } else {
        throw new Error(res?.message || 'Failed to update preferences.');
      }
    } catch (err) {
      setPrefSaveError(err.message || 'Error saving faculty notification preferences.');
      setTimeout(() => setPrefSaveError(''), 6000);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all demo data (opportunities, applications, profiles) to initial default states?')) {
      resetDemoData();
      setResetMessage('Demo data restored to initial defaults.');
      setTimeout(() => setResetMessage(''), 4000);
    }
  };

  return (
    <TeacherLayout>
      <div className="space-y-6 text-left">
        {/* Page Header */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-100 mb-2">
            <Mail className="w-3.5 h-3.5" />
            <span>Faculty Preferences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Faculty Portal Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure automated applicant dossier alerts, candidate communication preferences, and session controls.
          </p>
        </div>

        {/* Global Reset Message */}
        {resetMessage && (
          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span>{resetMessage}</span>
          </div>
        )}

        {/* EMAIL PREFERENCES SECTION */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 sm:p-8 space-y-6 text-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Automated Faculty Email Preferences
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Select which research calls and candidate events dispatch alerts to your faculty inbox.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-100">
                MongoDB Atlas Synced
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
              
              {/* 1. New Applicant Dossier Alerts */}
              <label className="flex items-start justify-between p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 cursor-pointer transition-colors">
                <div className="space-y-0.5 pr-4">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-teal-600" />
                    <span>New Applicant Dossier Alerts</span>
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Receive an immediate email with student credentials, academic year, and interest statements whenever a candidate applies to your research calls.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.applicationStatusEmails}
                  onChange={() => handleTogglePreference('applicationStatusEmails')}
                  className="mt-1 h-4 w-4 rounded accent-teal-600 cursor-pointer shrink-0"
                />
              </label>

              {/* 2. Candidate Messages Alert */}
              <label className="flex items-start justify-between p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 cursor-pointer transition-colors">
                <div className="space-y-0.5 pr-4">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                    <span>Candidate Real-Time Message Alerts</span>
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Receive email notifications when an applicant sends a message while you are logged out. Message contents remain private and secure on ScholarConnect.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.messageEmails}
                  onChange={() => handleTogglePreference('messageEmails')}
                  className="mt-1 h-4 w-4 rounded accent-teal-600 cursor-pointer shrink-0"
                />
              </label>

              {/* 3. Faculty Verification & Opportunity Publishing Status */}
              <label className="flex items-start justify-between p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 cursor-pointer transition-colors">
                <div className="space-y-0.5 pr-4">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>Faculty Verification &amp; Publishing Status</span>
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Receive confirmation emails when your academic institutional credentials and publishing authority are reviewed or approved.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.verificationEmails}
                  onChange={() => handleTogglePreference('verificationEmails')}
                  className="mt-1 h-4 w-4 rounded accent-teal-600 cursor-pointer shrink-0"
                />
              </label>

              {/* 4. Cross-Institutional Research Calls */}
              <label className="flex items-start justify-between p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 cursor-pointer transition-colors">
                <div className="space-y-0.5 pr-4">
                  <span className="font-bold text-slate-900 text-xs block">
                    Cross-Institutional Research &amp; Hackathon Calls
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Receive announcements regarding premier inter-university research challenges and joint funding calls.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.opportunityAnnouncementEmails}
                  onChange={() => handleTogglePreference('opportunityAnnouncementEmails')}
                  className="mt-1 h-4 w-4 rounded accent-teal-600 cursor-pointer shrink-0"
                />
              </label>

              {/* Mandatory Security Notice */}
              <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-100 text-[11px] text-teal-900 flex items-start gap-2">
                <span className="font-bold shrink-0">🔒 Mandatory Security Notice:</span>
                <span>
                  Faculty account authentication OTPs, password changes, and administrator security alerts remain mandatory to maintain platform academic integrity.
                </span>
              </div>

              {/* Save Button */}
              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSavingPrefs || isLoadingPrefs}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSavingPrefs ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to MongoDB...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Faculty Preferences</span>
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
    </TeacherLayout>
  );
}
