'use client';

import React from 'react';
import clsx from 'clsx';

export type AvatarSize = 'sm' | 'md' | 'lg';
export type AvatarStatus = 'online' | 'away' | 'busy';

export interface AvatarProps {
  initials: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  className?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
};

const statusDotSize: Record<AvatarSize, string> = {
  sm: 'w-2 h-2 border',
  md: 'w-2.5 h-2.5 border-[1.5px]',
  lg: 'w-3 h-3 border-2',
};

const statusColors: Record<AvatarStatus, string> = {
  online: 'bg-green-500',
  away: 'bg-amber-500',
  busy: 'bg-red-500',
};

/**
 * Deterministic background colour based on the first character of the initials.
 */
const letterColors: string[] = [
  'bg-indigo-600',
  'bg-violet-600',
  'bg-blue-600',
  'bg-cyan-600',
  'bg-teal-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-orange-600',
  'bg-rose-600',
  'bg-pink-600',
  'bg-fuchsia-600',
  'bg-sky-600',
];

function getColorFromLetter(letter: string): string {
  const code = letter.toUpperCase().charCodeAt(0);
  return letterColors[code % letterColors.length];
}

export function Avatar({ initials, size = 'md', status, className }: AvatarProps) {
  const displayInitials = initials.slice(0, 2).toUpperCase();
  const bgColor = getColorFromLetter(displayInitials.charAt(0) || 'A');

  return (
    <div className={clsx('relative inline-flex flex-shrink-0', className)}>
      <div
        className={clsx(
          'inline-flex items-center justify-center rounded-full font-semibold text-white select-none',
          bgColor,
          sizeStyles[size]
        )}
        aria-label={displayInitials}
      >
        {displayInitials}
      </div>

      {status && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full border-slate-800',
            statusDotSize[size],
            statusColors[status]
          )}
        />
      )}
    </div>
  );
}
