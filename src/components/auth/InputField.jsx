import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function InputField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon: Icon,
  error,
  required = false,
  autoComplete,
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

        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`block w-full rounded-xl text-sm transition-all duration-150 py-3 ${
            Icon ? 'pl-10' : 'pl-3.5'
          } pr-4 bg-white text-slate-900 placeholder:text-slate-400 border ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
              : isIndigo
              ? 'border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 hover:border-slate-300'
              : 'border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 hover:border-slate-300'
          } outline-none disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed`}
        />
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
