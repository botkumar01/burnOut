'use client';

import React from 'react';
import clsx from 'clsx';

export type ProgressColor = 'safe' | 'warning' | 'danger' | 'brand';
export type ProgressSize = 'sm' | 'md';

export interface ProgressBarProps {
  value: number;
  color?: ProgressColor;
  label?: string;
  showValue?: boolean;
  size?: ProgressSize;
  className?: string;
}

const colorStyles: Record<ProgressColor, string> = {
  safe: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  brand: 'bg-[#5c7cfa]',
};

const trackSizeStyles: Record<ProgressSize, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
};

export function ProgressBar({
  value,
  color = 'brand',
  label,
  showValue = false,
  size = 'md',
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={clsx('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-xs font-medium text-slate-300">{label}</span>
          )}
          {showValue && (
            <span className="text-xs font-medium text-slate-400">
              {Math.round(clamped)}%
            </span>
          )}
        </div>
      )}
      <div
        className={clsx(
          'w-full rounded-full bg-slate-700/60 overflow-hidden',
          trackSizeStyles[size]
        )}
      >
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-500 ease-out',
            colorStyles[color]
          )}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        />
      </div>
    </div>
  );
}
