import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Microscope, Sparkles, LogIn, ShieldCheck } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import LoginSelectionCard from '../components/LoginSelectionCard';

const CURRENT_YEAR = new Date().getFullYear();

export default function RegisterPortalPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <BrandLogo showTagline={true} size="default" to="/register" />
          
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-700 bg-slate-100/80 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 px-3.5 py-1.5 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <LogIn className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
              <span>Already have an account? Sign in</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Section */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl w-full mx-auto text-center space-y-10">
          
          {/* Hero Section */}
          <div className="space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Begin Your Academic Journey</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Join ScholarConnect
            </h1>
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
              Connect with researchers, discover opportunities, and build meaningful academic collaborations.
            </p>
          </div>

          {/* Two Large Portal Cards Side by Side on Desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto items-stretch">
            {/* Student Card */}
            <LoginSelectionCard
              role="student"
              icon={GraduationCap}
              title="Join as a Student"
              description="Discover research opportunities, showcase your skills, and connect with academic mentors across universities."
              features={[
                'Discover research opportunities',
                'Showcase your skills & projects',
                'Connect with academic mentors'
              ]}
              buttonText="Register as Student"
              targetPath="/register/student"
              accent="indigo"
              badgeText="Student Registration"
            />

            {/* Teacher / Researcher Card */}
            <LoginSelectionCard
              role="teacher"
              icon={Microscope}
              title="Join as a Teacher / Researcher"
              description="Publish research opportunities, discover talented students, and build your research team."
              features={[
                'Publish research opportunities',
                'Discover talented students',
                'Build your research team'
              ]}
              buttonText="Register as Teacher"
              targetPath="/register/teacher"
              accent="teal"
              badgeText="Faculty & Researcher"
            />
          </div>

          {/* Secondary Sign-in Link & Trust Banner */}
          <div className="pt-2 flex flex-col items-center gap-4">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="font-semibold text-indigo-700 hover:text-indigo-800 hover:underline inline-flex items-center gap-1"
              >
                Sign in to your portal
              </Link>
            </p>

            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Direct academic collaboration across accredited colleges and research universities</span>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/80 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 text-center sm:text-left">
          <p className="font-medium text-slate-600">Built for the next generation of researchers.</p>
          <p>© {CURRENT_YEAR} ScholarConnect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
