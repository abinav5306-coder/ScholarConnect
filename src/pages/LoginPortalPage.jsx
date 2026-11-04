import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Microscope, UserPlus } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import LoginSelectionCard from '../components/LoginSelectionCard';

const CURRENT_YEAR = new Date().getFullYear();

export default function LoginPortalPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-indigo-100 selection:text-indigo-900">
      {/* Minimal Header */}
      <header className="w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <BrandLogo showTagline={true} size="default" to="/login" />
          <div className="flex items-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-indigo-700 hover:text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200/70 px-3.5 py-1.5 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <UserPlus className="w-4 h-4 text-indigo-600" />
              <span>Register</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Section */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl w-full mx-auto text-center space-y-10">
          
          {/* Hero Section */}
          <div className="space-y-3 max-w-2xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Welcome to ScholarConnect
            </h1>
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
              Your next research collaboration starts here. Choose your portal to continue.
            </p>
          </div>

          {/* Two Large Portal Cards Side by Side on Desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto items-stretch">
            {/* Student Card */}
            <LoginSelectionCard
              role="student"
              icon={GraduationCap}
              title="I'm a Student"
              description="Discover research opportunities, showcase your skills, and collaborate with academic mentors across universities."
              features={[
                'Explore Research',
                'Showcase Projects',
                'Track Applications'
              ]}
              buttonText="Student Login"
              targetPath="/login/student"
              accent="indigo"
            />

            {/* Teacher / Researcher Card */}
            <LoginSelectionCard
              role="teacher"
              icon={Microscope}
              title="I'm a Teacher / Researcher"
              description="Publish research opportunities, discover talented students, and build your next research team."
              features={[
                'Publish Opportunities',
                'Discover Talent',
                'Build Research Teams'
              ]}
              buttonText="Teacher Login"
              targetPath="/login/teacher"
              accent="teal"
            />
          </div>

          {/* Trust Banner / Academic Network Note */}
          <div className="pt-2 flex flex-col items-center gap-4">
            <p className="text-sm text-slate-600">
              New to ScholarConnect?{' '}
              <Link 
                to="/register" 
                className="font-semibold text-indigo-700 hover:text-indigo-800 hover:underline inline-flex items-center gap-1"
              >
                Create an account
              </Link>
            </p>

            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs text-xs text-slate-500">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span>Direct academic collaboration across accredited colleges and research universities</span>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/80 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 text-center sm:text-left">
          <p className="font-medium text-slate-600">Built for the next generation of researchers.</p>
          <div className="flex items-center gap-4">
            <Link to="/admin/login" className="text-slate-400 hover:text-slate-700 hover:underline">
              Admin Portal
            </Link>
            <p>© {CURRENT_YEAR} ScholarConnect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
