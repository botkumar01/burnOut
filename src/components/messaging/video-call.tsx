'use client';

import React, { useState, useEffect } from 'react';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { Loader2 } from 'lucide-react';

interface VideoCallProps {
  channelId: string;
  channelName: string;
  userName: string;
  userId: string;
  onLeave: () => void;
}

export function VideoCall({ channelId, channelName, userName, userId, onLeave }: VideoCallProps) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchToken() {
      try {
        const res = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomName: channelId,
            participantName: userName,
            participantId: userId,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to get token');
        }

        const { token } = await res.json();
        if (!cancelled) setToken(token);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to connect');
      }
    }

    fetchToken();
    return () => { cancelled = true; };
  }, [channelId, userName, userId]);

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex items-center justify-between">
        <p className="text-sm text-red-400">Failed to join call: {error}</p>
        <button
          onClick={onLeave}
          className="text-xs px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition-colors"
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
        <p className="text-sm text-slate-400">Joining huddle in {channelName}...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-slate-700/50" data-lk-theme="default">
      <LiveKitRoom
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        token={token}
        connect={true}
        video={true}
        audio={true}
        onDisconnected={onLeave}
        style={{ height: '400px' }}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}
