import React from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

export default function SelectField({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  icon: Icon,
  error,
  required = false,
  disabled = false,
  accent = 'indigo',
  className = '',
  helperText,
}) {
  const isIndigo = accent === 'indigo';

  return (
    <div className={`space-y-1.5 text-left ${className}`}>
      <div className="flex items-center justify-between">
        <label 
          htmlFor={id} 
          className="block text-xs font-semibold text-slate-700 tracking-wide"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      </div>

      <div className="relative rounded-xl shadow-xs">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Icon className="h-4 w-4" strokeWidth={2} />
          </div>
        )}

        <select
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`block w-full rounded-xl text-sm transition-all duration-150 py-3 ${
            Icon ? 'pl-10' : 'pl-3.5'
          } pr-10 bg-white text-slate-900 border appearance-none cursor-pointer ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
              : isIndigo
              ? 'border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 hover:border-slate-300'
              : 'border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 hover:border-slate-300'
          } outline-none disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
            !value ? 'text-slate-400' : 'text-slate-900'
          }`}
        >
          <option value="" disabled className="text-slate-400">
            {placeholder}
          </option>
          {options.map((opt) => {
            const optVal = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={optVal} value={optVal} className="text-slate-900">
                {optLabel}
              </option>
            );
          })}
        </select>

        {/* Custom Dropdown Chevron */}
        <div className="pointer-events-none absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400">
          <ChevronDown className="h-4 w-4" strokeWidth={2} />
        </div>
      </div>

      {error ? (
        <p 
          id={`${id}-error`} 
          className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-1 animate-fadeIn"
          role="alert"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}
