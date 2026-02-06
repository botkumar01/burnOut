'use client';

import React from 'react';
import clsx from 'clsx';

/* -------------------------------------------------------------------------- */
/*  Input                                                                     */
/* -------------------------------------------------------------------------- */

export interface InputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  className?: string;
  disabled?: boolean;
}

export function Input({
  label,
  error,
  icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  name,
  className,
  disabled = false,
}: InputProps) {
  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label
          htmlFor={name}
          className="block text-xs font-medium text-slate-300 mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            {icon}
          </div>
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={clsx(
            'block w-full rounded-lg border bg-slate-700/50 text-sm text-slate-100 placeholder-slate-500',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/60',
            error
              ? 'border-red-500/60'
              : 'border-slate-600 hover:border-slate-500',
            icon ? 'pl-9 pr-3' : 'px-3',
            'py-2',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Textarea                                                                  */
/* -------------------------------------------------------------------------- */

export interface TextareaProps {
  label?: string;
  error?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  name?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
}

export function Textarea({
  label,
  error,
  placeholder,
  value,
  onChange,
  name,
  rows = 4,
  className,
  disabled = false,
}: TextareaProps) {
  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label
          htmlFor={name}
          className="block text-xs font-medium text-slate-300 mb-1.5"
        >
          {label}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={clsx(
          'block w-full rounded-lg border bg-slate-700/50 text-sm text-slate-100 placeholder-slate-500',
          'transition-colors duration-150 resize-y',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/60',
          error
            ? 'border-red-500/60'
            : 'border-slate-600 hover:border-slate-500',
          'px-3 py-2',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
