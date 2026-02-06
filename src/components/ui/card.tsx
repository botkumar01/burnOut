'use client';

import React from 'react';
import clsx from 'clsx';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
}

export function Card({
  children,
  className,
  title,
  subtitle,
  headerAction,
}: CardProps) {
  const hasHeader = title || subtitle || headerAction;

  return (
    <div
      className={clsx(
        'bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl',
        className
      )}
    >
      {hasHeader && (
        <div className="flex items-start justify-between px-5 pt-5 pb-0">
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="text-sm font-semibold text-slate-100 truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-400 truncate">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && (
            <div className="ml-3 flex-shrink-0">{headerAction}</div>
          )}
        </div>
      )}
      <div className={clsx(hasHeader ? 'px-5 pb-5 pt-3' : 'p-5')}>
        {children}
      </div>
    </div>
  );
}
