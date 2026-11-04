import React from 'react';
import { Loader2 } from 'lucide-react';

export default function PrimaryButton({
  children,
  onClick,
  type = 'submit',
  disabled = false,
  loading = false,
  loadingText = 'Signing in...',
  accent = 'indigo',
  className = '',
  id,
}) {
  const isIndigo = accent === 'indigo';

  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading ? 'true' : 'false'}
      className={`relative w-full py-3.5 px-5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 disabled:opacity-60 disabled:cursor-not-allowed ${
        isIndigo
          ? 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-sm hover:shadow-md focus-visible:ring-indigo-600 active:scale-[0.99]'
          : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm hover:shadow-md focus-visible:ring-teal-600 active:scale-[0.99]'
      } ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
