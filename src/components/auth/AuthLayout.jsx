import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Sparkles, Users, Award, ShieldCheck, Microscope, GraduationCap } from 'lucide-react';
import BrandLogo from '../BrandLogo';

const CURRENT_YEAR = new Date().getFullYear();

export default function AuthLayout({
  role = 'student', // 'student' or 'teacher'
  headline,
  description,
  benefits = [],
  children,
  variant = 'split', // 'split' or 'centered'
  backLink = '/login',
  backText = 'Back to Login Portal',
  maxWidth = 'max-w-2xl',
}) {
  const isIndigo = role === 'student';
  const accentColor = isIndigo ? 'indigo' : 'teal';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navbar / Header */}
      <header className="w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <BrandLogo accentColor={accentColor} to="/login" />
          
          <Link
            to={backLink}
            className={`inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100 focus:outline-none focus-visible:ring-2 ${
              isIndigo ? 'focus-visible:ring-indigo-600' : 'focus-visible:ring-teal-600'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{backText}</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      {variant === 'centered' ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center justify-center">
          <div className={`w-full ${maxWidth}`}>
            {children}
          </div>
        </main>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center">
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Branding Panel (Academic identity & benefits) */}
          <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between pr-4 xl:pr-10">
            <div className="space-y-6 text-left">
              
              {/* Role pill badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border shadow-2xs">
                {isIndigo ? (
                  <span className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50/80 border-indigo-100">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                    Student & Scholar Gateway
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-teal-700 bg-teal-50/80 border-teal-100">
                    <Microscope className="w-3.5 h-3.5 text-teal-600" />
                    Faculty & Researcher Gateway
                  </span>
                )}
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl xl:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {headline}
              </h1>

              {/* Sub-description */}
              <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                {description}
              </p>

              {/* 3 Key Benefits */}
              <div className="pt-2 space-y-3.5">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div 
                      className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        isIndigo 
                          ? 'bg-indigo-100 text-indigo-700' 
                          : 'bg-teal-100 text-teal-700'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>

              {/* Floating Academic Collaboration Visual Cards */}
              <div className="pt-6 relative">
                <div className="relative rounded-2xl p-5 border border-slate-200/90 bg-white/90 backdrop-blur-xs shadow-card space-y-3 max-w-lg">
                  {isIndigo ? (
                    <>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                        <span className="flex items-center gap-1.5 font-semibold text-indigo-700">
                          <Sparkles className="w-3.5 h-3.5" />
                          Featured Cross-University Project
                        </span>
                        <span className="px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                          Accepting Students
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Quantum Information & Bio-Molecular Simulation Lab
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Lead Mentor: Prof. David Vance • MIT & Stanford Joint Research
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="px-2 py-0.5 text-[11px] rounded-md bg-slate-100 text-slate-600 font-medium">
                          Quantum Computing
                        </span>
                        <span className="px-2 py-0.5 text-[11px] rounded-md bg-slate-100 text-slate-600 font-medium">
                          Python / Qiskit
                        </span>
                        <span className="px-2 py-0.5 text-[11px] rounded-md bg-indigo-50 text-indigo-700 font-medium">
                          Fellowship Stipend
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                        <span className="flex items-center gap-1.5 font-semibold text-teal-700">
                          <Users className="w-3.5 h-3.5" />
                          Faculty Opportunity Manager
                        </span>
                        <span className="px-2 py-0.5 text-[11px] font-medium bg-teal-50 text-teal-700 rounded-full border border-teal-200">
                          3 Active Openings
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Neural Interfaces & Soft Robotics Lab
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          14 Student Inquiries • 5 University Candidates Shortlisted
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="px-2 py-0.5 text-[11px] rounded-md bg-slate-100 text-slate-600 font-medium">
                          Peer-Reviewed
                        </span>
                        <span className="px-2 py-0.5 text-[11px] rounded-md bg-slate-100 text-slate-600 font-medium">
                          Interdisciplinary
                        </span>
                        <span className="px-2 py-0.5 text-[11px] rounded-md bg-teal-50 text-teal-700 font-medium">
                          Institutional Grant
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Sub-badge card floating underneath */}
                <div className="mt-3 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs text-slate-600 max-w-sm">
                  {isIndigo ? (
                    <>
                      <Award className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Co-authored papers & verified mentor recommendations</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>Verified faculty credentials across 180+ partner institutions</span>
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Right Column / Login Form Area */}
          <div className="w-full lg:col-span-6 xl:col-span-5 flex justify-center">
            <div className="w-full max-w-md">
              {children}
            </div>
          </div>

        </div>
      </main>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/80 bg-white py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>Built for the next generation of researchers.</p>
          <p>© {CURRENT_YEAR} ScholarConnect Academic Systems. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
