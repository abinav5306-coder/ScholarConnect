import React, { useState } from 'react';
import { Plus, X, Tag, AlertCircle, Sparkles } from 'lucide-react';

export default function TagInput({
  id = 'research-interests',
  label = 'Research Interests',
  tags = [],
  onChange,
  suggestedTags = [],
  placeholder = 'Add a research area and press Enter',
  error,
  required = false,
  disabled = false,
  accent = 'teal',
  className = '',
  helperText,
}) {
  const [inputValue, setInputValue] = useState('');
  const isIndigo = accent === 'indigo';

  const handleAddTag = (tagToAdd) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed) return;
    
    // Check if tag already exists (case-insensitive)
    const exists = tags.some((t) => t.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      onChange([...tags, trimmed]);
    }
    setInputValue('');
  };

  const handleRemoveTag = (tagToRemove) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(inputValue);
    } else if (e.key === ',' || e.key === ';') {
      e.preventDefault();
      handleAddTag(inputValue);
    }
  };

  return (
    <div className={`space-y-2 text-left ${className}`}>
      <div className="flex items-center justify-between">
        <label 
          htmlFor={id} 
          className="block text-xs font-semibold text-slate-700 tracking-wide"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <span className="text-[11px] text-slate-400 font-medium">
          {tags.length} selected
        </span>
      </div>

      {/* Selected Tags Display */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 min-h-[46px] items-center">
          {tags.map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center gap-1.5 py-1 pl-2.5 pr-1.5 rounded-lg text-xs font-medium transition-all ${
                isIndigo
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'bg-teal-50 text-teal-800 border border-teal-200'
              }`}
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                disabled={disabled}
                aria-label={`Remove interest: ${tag}`}
                className={`p-0.5 rounded-md hover:bg-black/10 transition-colors focus:outline-none focus-visible:ring-1 ${
                  isIndigo ? 'focus-visible:ring-indigo-600' : 'focus-visible:ring-teal-600'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Custom Tag Input + Add Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 rounded-xl shadow-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Tag className="h-4 w-4" strokeWidth={2} />
          </div>
          <input
            id={id}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${id}-error` : undefined}
            className={`block w-full rounded-xl text-sm transition-all duration-150 py-3 pl-10 pr-3.5 bg-white text-slate-900 placeholder:text-slate-400 border ${
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                : isIndigo
                ? 'border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 hover:border-slate-300'
                : 'border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 hover:border-slate-300'
            } outline-none disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed`}
          />
        </div>

        <button
          type="button"
          onClick={() => handleAddTag(inputValue)}
          disabled={disabled || !inputValue.trim()}
          className={`shrink-0 px-4 py-3 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all duration-150 focus:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            isIndigo
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-600'
              : 'bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-teal-600'
          }`}
          aria-label="Add custom research interest"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span>Add</span>
        </button>
      </div>

      {/* Suggested Tags Quick-Add */}
      {suggestedTags.length > 0 && (
        <div className="pt-1.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Suggested Research Areas</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedTags.map((suggested) => {
              const isSelected = tags.some((t) => t.toLowerCase() === suggested.toLowerCase());
              return (
                <button
                  key={suggested}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      handleRemoveTag(suggested);
                    } else {
                      handleAddTag(suggested);
                    }
                  }}
                  disabled={disabled}
                  className={`text-xs py-1 px-2.5 rounded-lg border transition-all text-left ${
                    isSelected
                      ? isIndigo
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                  aria-pressed={isSelected}
                >
                  <span className="inline-flex items-center gap-1">
                    {isSelected ? '✓ ' : '+ '}
                    {suggested}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

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
