import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export default function BrandLogo({
  showTagline = true,
  size = 'default',
  to = '/login',
  className = '',
  accentColor = 'indigo'
}) {
  const isLarge = size === 'large';
  const isSmall = size === 'small';

  const iconContainerClass = accentColor === 'teal'
    ? 'bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-teal-700/20'
    : 'bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-indigo-700/20';

  const content = (
    <div className={`flex items-center gap-3 group select-none ${className}`}>
      <div
        className={`relative flex items-center justify-center rounded-xl shadow-md transition-transform duration-200 group-hover:scale-105 ${iconContainerClass} ${isLarge ? 'w-11 h-11' : isSmall ? 'w-8 h-8' : 'w-9 h-9'
          }`}
      >
        <GraduationCap
          className={isLarge ? 'w-6 h-6' : isSmall ? 'w-4 h-4' : 'w-5 h-5'}
          strokeWidth={2.2}
        />
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${accentColor === 'teal' ? 'bg-teal-400' : 'bg-indigo-400'}`}></span>
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${accentColor === 'teal' ? 'bg-teal-300' : 'bg-indigo-300'}`}></span>
        </span>
      </div>

      <div className="flex flex-col text-left">
        <span
          className={`font-bold tracking-tight text-slate-900 transition-colors ${isLarge ? 'text-2xl' : isSmall ? 'text-base' : 'text-lg'
            }`}
        >
          Scholar<span className={accentColor === 'teal' ? 'text-teal-600' : 'text-indigo-600'}>Connect</span>
        </span>keep
        {showTagline && (
          <span className="text-xs font-medium text-slate-500 tracking-wide">
            Connecting Talent. Advancing Research.
          </span>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
        aria-label="ScholarConnect Home"
      >
        {content}
      </Link>
    );
  }

  return content;
}
