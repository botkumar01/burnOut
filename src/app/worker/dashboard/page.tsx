'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Clock, Brain, Zap, TrendingUp, AlertTriangle, Heart,
  Timer, Coffee, Play, Pause, Square, Bell, Shield,
  Activity, BarChart3, ChevronRight
} from 'lucide-react';

interface HealthData {
  riskLevel: string;
  riskScore: number;
  burnoutDebt: number;
  avgStress: number;
  avgEnergy: number;
  recentDifficulties: string[];
  activeAlerts: number;
  factors: Record<string, boolean | number>;
}

interface DebtData {
  currentDebt: number;
  trend: string;
  history: { date: string; score: number }[];
}

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [debt, setDebt] = useState<DebtData | null>(null);
  const [helpSent, setHelpSent] = useState(false);
  const [helpLoading, setHelpLoading] = useState(false);
  const [showHelpConfirm, setShowHelpConfirm] = useState(false);

  // ── Timer State ──
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [onBreak, setOnBreak] = useState(false);
  const [breakReminder, setBreakReminder] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const BREAK_INTERVAL = 90 * 60; // 90 minutes in seconds

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [hRes, dRes] = await Promise.all([
        fetch(`/api/burnout?workerId=${user.id}`),
        fetch(`/api/burnout?workerId=${user.id}&type=debt`),
      ]);
      if (hRes.ok) setHealth(await hRes.json());
      if (dRes.ok) setDebt(await dRes.json());
    } catch {}
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Timer Logic ──
  useEffect(() => {
    if (timerRunning && !onBreak) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          const next = prev + 1;
          if (next > 0 && next % BREAK_INTERVAL === 0) {
            setBreakReminder(true);
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning, onBreak]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleHelpSignal = async () => {
    if (!user) return;
    setHelpLoading(true);
    try {
      const res = await fetch('/api/help-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId: user.id, message: 'I feel overloaded' }),
      });
      if (res.ok) {
        setHelpSent(true);
        setShowHelpConfirm(false);
        setTimeout(() => setHelpSent(false), 5000);
      }
    } catch {}
    setHelpLoading(false);
  };

  const riskColor = health?.riskLevel === 'high-risk' ? 'red' : health?.riskLevel === 'warning' ? 'amber' : 'green';
  const riskEmoji = health?.riskLevel === 'high-risk' ? '🔴' : health?.riskLevel === 'warning' ? '🟡' : '🟢';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-slate-400 text-sm mt-1">Here&apos;s your wellness overview for today</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Today</p>
          <p className="text-sm text-slate-300">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Break Reminder Modal */}
      {breakReminder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setBreakReminder(false)}>
          <div className="bg-slate-800 border border-amber-500/30 rounded-2xl p-8 max-w-md mx-4 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coffee className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Time for a Break!</h3>
            <p className="text-slate-400 mb-6">You&apos;ve been working for 90 minutes. Taking short breaks improves focus and prevents burnout.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setOnBreak(true); setBreakReminder(false); }}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
              >
                Take a Break
              </button>
              <button
                onClick={() => setBreakReminder(false)}
                className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Signal Confirmation */}
      {showHelpConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowHelpConfirm(false)}>
          <div className="bg-slate-800 border border-red-500/30 rounded-2xl p-8 max-w-md mx-4 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Send Help Signal?</h3>
            <p className="text-slate-400 mb-2">This will send a <strong className="text-slate-300">private</strong> alert to your Team Leader only.</p>
            <p className="text-xs text-slate-500 mb-6">No one else will see this. Your privacy is protected.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleHelpSignal}
                disabled={helpLoading}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {helpLoading ? 'Sending...' : 'Yes, Send Signal'}
              </button>
              <button
                onClick={() => setShowHelpConfirm(false)}
                className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Risk Status */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Risk Status</span>
            <span className="text-lg">{riskEmoji}</span>
          </div>
          <p className={`text-2xl font-bold ${riskColor === 'red' ? 'text-red-400' : riskColor === 'amber' ? 'text-amber-400' : 'text-green-400'}`}>
            {health?.riskLevel === 'high-risk' ? 'High Risk' : health?.riskLevel === 'warning' ? 'Warning' : 'Safe'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Score: {health?.riskScore || 0}/100</p>
        </div>

        {/* Burnout Debt */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Burnout Debt</span>
            <Brain className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-2xl font-bold text-white">{debt?.currentDebt || 0}<span className="text-sm text-slate-500">/100</span></p>
          <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                (debt?.currentDebt || 0) > 60 ? 'bg-red-500' : (debt?.currentDebt || 0) > 30 ? 'bg-amber-500' : 'bg-green-500'
              }`}
              style={{ width: `${debt?.currentDebt || 0}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1.5 capitalize">Trend: {debt?.trend || 'stable'}</p>
        </div>

        {/* Stress Level */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Avg Stress</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">{health?.avgStress || 0}<span className="text-sm text-slate-500">/5</span></p>
          <div className="flex gap-1 mt-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`h-2 flex-1 rounded-full ${i <= (health?.avgStress || 0) ? 'bg-amber-500' : 'bg-slate-700'}`} />
            ))}
          </div>
        </div>

        {/* Energy Level */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Avg Energy</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white">{health?.avgEnergy || 0}<span className="text-sm text-slate-500">/5</span></p>
          <div className="flex gap-1 mt-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`h-2 flex-1 rounded-full ${i <= (health?.avgEnergy || 0) ? 'bg-cyan-500' : 'bg-slate-700'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Middle Row: Timer + Help Signal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Work Session Timer */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Timer className="w-5 h-5 text-brand-400" />
              Work Session Timer
            </h3>
            {onBreak && (
              <span className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full animate-pulse">
                On Break
              </span>
            )}
          </div>

          <div className="text-center py-8">
            <p className="text-6xl font-mono font-bold text-white tracking-wider mb-2">
              {formatTime(timerSeconds)}
            </p>
            <p className="text-sm text-slate-400">
              {onBreak ? 'Break time — relax and recharge' : timerRunning ? 'Session in progress' : 'Ready to start'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Break reminder every 90 minutes
            </p>
          </div>

          <div className="flex justify-center gap-3">
            {!timerRunning && !onBreak && (
              <button onClick={() => setTimerRunning(true)} className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
                <Play size={16} /> Start Session
              </button>
            )}
            {timerRunning && !onBreak && (
              <>
                <button onClick={() => setOnBreak(true)} className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors">
                  <Coffee size={16} /> Take Break
                </button>
                <button onClick={() => { setTimerRunning(false); }} className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition-colors">
                  <Pause size={16} /> Pause
                </button>
                <button onClick={() => { setTimerRunning(false); setTimerSeconds(0); }} className="flex items-center gap-2 px-6 py-2.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg font-medium transition-colors">
                  <Square size={16} /> Stop
                </button>
              </>
            )}
            {onBreak && (
              <button onClick={() => setOnBreak(false)} className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors">
                <Play size={16} /> Resume Work
              </button>
            )}
          </div>
        </div>

        {/* Silent Help Signal */}
        <div className="glass-card p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-red-400" />
            Silent Help Signal
          </h3>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            If you&apos;re feeling overwhelmed, send a private signal to your Team Leader. This is completely confidential — only your TL will see it.
          </p>

          <div className="flex-1 flex items-center justify-center">
            {helpSent ? (
              <div className="text-center">
                <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-7 h-7 text-green-400" />
                </div>
                <p className="text-green-400 font-medium text-sm">Signal sent privately</p>
                <p className="text-xs text-slate-500 mt-1">Your TL has been notified</p>
              </div>
            ) : (
              <button
                onClick={() => setShowHelpConfirm(true)}
                className="w-full py-4 bg-red-600/20 hover:bg-red-600/30 border-2 border-dashed border-red-500/40 hover:border-red-500/60 rounded-xl text-red-400 font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              >
                <AlertTriangle size={18} />
                I feel overloaded
              </button>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <div className="w-3 h-3 bg-green-500/30 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            </div>
            Private & encrypted — only TL sees this
          </div>
        </div>
      </div>

      {/* Recent Assignments & Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Difficulty History */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-400" />
            Recent Workload
          </h3>
          <div className="space-y-2">
            {(health?.recentDifficulties || []).slice(0, 5).map((d, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-700/30">
                <span className="text-xs text-slate-500 w-16">{i === 0 ? 'Today' : `${i}d ago`}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  d === 'hard' ? 'bg-red-500/20 text-red-400' :
                  d === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </span>
              </div>
            ))}
            {(!health?.recentDifficulties || health.recentDifficulties.length === 0) && (
              <p className="text-sm text-slate-500 py-4 text-center">No recent assignments</p>
            )}
          </div>
        </div>

        {/* Burnout Debt Trend */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-400" />
            Burnout Debt Trend (14 days)
          </h3>
          <div className="flex items-end gap-1 h-32">
            {(debt?.history || []).slice(-14).map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                <div
                  className={`w-full rounded-t transition-all duration-300 ${
                    h.score > 60 ? 'bg-red-500/60' : h.score > 30 ? 'bg-amber-500/60' : 'bg-green-500/60'
                  }`}
                  style={{ height: `${Math.max(4, h.score)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-slate-500">14 days ago</span>
            <span className="text-[10px] text-slate-500">Today</span>
          </div>
        </div>
      </div>

      {/* Risk Factors */}
      {health && health.riskLevel !== 'safe' && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Active Risk Factors
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {health.factors.screenTimeExcess && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <Clock className="w-4 h-4 text-red-400 mb-1" />
                <p className="text-xs text-red-300">High Screen Time</p>
              </div>
            )}
            {(health.factors.consecutiveHardDays as number) >= 2 && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <TrendingUp className="w-4 h-4 text-red-400 mb-1" />
                <p className="text-xs text-red-300">{health.factors.consecutiveHardDays} Hard Days</p>
              </div>
            )}
            {health.factors.longSessionsNoBreaks && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Coffee className="w-4 h-4 text-amber-400 mb-1" />
                <p className="text-xs text-amber-300">Missing Breaks</p>
              </div>
            )}
            {health.factors.highStressScore && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Activity className="w-4 h-4 text-amber-400 mb-1" />
                <p className="text-xs text-amber-300">High Stress</p>
              </div>
            )}
            {health.factors.highBurnoutDebt && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <Brain className="w-4 h-4 text-red-400 mb-1" />
                <p className="text-xs text-red-300">High Debt</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
