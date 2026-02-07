'use client';

import React from 'react';
import { Video, PhoneOff } from 'lucide-react';

interface HuddleButtonProps {
  isInCall: boolean;
  onToggle: () => void;
}

export function HuddleButton({ isInCall, onToggle }: HuddleButtonProps) {
  if (isInCall) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium transition-colors"
      >
        <PhoneOff size={14} />
        Leave
      </button>
    );
  }

  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600/20 hover:bg-brand-600/30 text-brand-400 border border-brand-500/30 rounded-lg text-xs font-medium transition-colors"
    >
      <Video size={14} />
      Huddle
    </button>
  );
}
