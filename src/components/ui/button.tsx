'use client';

import React from 'react';
import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#5c7cfa] hover:bg-[#4c6ce0] text-white shadow-sm shadow-indigo-500/20',
  secondary:
    'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600',
  danger:
    'bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-500/20',
  ghost:
    'bg-transparent hover:bg-slate-700/60 text-slate-300 hover:text-slate-100',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'text-xs px-2.5 py-1.5 rounded-md gap-1',
  md: 'text-sm px-4 py-2 rounded-lg gap-1.5',
  lg: 'text-base px-5 py-2.5 rounded-lg gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className,
  disabled = false,
  onClick,
  type = 'button',
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'inline-flex items-center justify-center font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-1 focus:ring-offset-slate-900',
        variantStyles[variant],
        sizeStyles[size],
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
    >
      {children}
    </button>
  );
}
