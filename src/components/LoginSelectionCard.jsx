import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginSelectionCard({
  role = 'student',
  icon: Icon,
  title,
  description,
  features = [],
  buttonText,
  targetPath,
  accent = 'indigo', // 'indigo' or 'teal'
  badgeText,
}) {
  const navigate = useNavigate();
  const isIndigo = accent === 'indigo';

  const handleCardClick = () => {
    navigate(targetPath);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(targetPath);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label={`${title} portal option`}
      tabIndex={0}
      className={`group relative flex flex-col justify-between p-8 sm:p-10 bg-white rounded-2xl border transition-all duration-300 cursor-pointer text-left focus:outline-none focus-visible:ring-2 ${
        isIndigo
          ? 'border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-card-hover focus-visible:ring-indigo-600'
          : 'border-slate-200 hover:border-teal-300 shadow-sm hover:shadow-card-hover-teal focus-visible:ring-teal-600'
      } hover:-translate-y-1.5`}
    >
      {/* Top ambient color glow on hover */}
      <div 
        className={`absolute inset-x-0 top-0 h-1.5 rounded-t-2xl transition-all duration-300 ${
          isIndigo 
            ? 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 opacity-0 group-hover:opacity-100' 
            : 'bg-gradient-to-r from-teal-500 via-teal-600 to-teal-700 opacity-0 group-hover:opacity-100'
        }`} 
      />

      <div>
        {/* Top Header with Icon and Badge */}
        <div className="flex items-start justify-between mb-6">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-sm ${
              isIndigo
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/80 group-hover:bg-indigo-600 group-hover:text-white'
                : 'bg-teal-50 text-teal-700 border border-teal-100/80 group-hover:bg-teal-600 group-hover:text-white'
            }`}
          >
            {Icon && <Icon className="w-7 h-7 transition-colors duration-300" strokeWidth={2} />}
          </div>
          
          <span 
            className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${
              isIndigo 
                ? 'bg-indigo-50/70 text-indigo-700 border-indigo-100' 
                : 'bg-teal-50/70 text-teal-700 border-teal-100'
            }`}
          >
            {badgeText || (role === 'student' ? 'Undergraduate & Grad' : 'Faculty & Labs')}
          </span>
        </div>

        {/* Title & Description */}
        <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight group-hover:text-slate-950">
          {title}
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed mb-8">
          {description}
        </p>

        {/* Feature Badges */}
        <div className="space-y-2.5 mb-8 pt-4 border-t border-slate-100">
          <div className="text-xs font-medium text-slate-600 uppercase tracking-wider mb-2">
            Portal Capabilities
          </div>
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2.5 text-sm text-slate-700">
              <CheckCircle2 
                className={`w-4 h-4 shrink-0 ${isIndigo ? 'text-indigo-600' : 'text-teal-600'}`} 
                strokeWidth={2.5}
              />
              <span className="font-medium text-slate-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(targetPath);
          }}
          className={`w-full py-3.5 px-5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 ${
            isIndigo
              ? 'bg-indigo-700 text-white hover:bg-indigo-800 shadow-sm hover:shadow focus-visible:ring-indigo-600'
              : 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm hover:shadow focus-visible:ring-teal-600'
          }`}
          aria-label={`Continue to ${title}`}
        >
          <span>{buttonText}</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
