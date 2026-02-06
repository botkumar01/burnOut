'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Users, AlertTriangle, Shield, Brain, Activity, TrendingUp,
  Eye, Bell, ChevronRight, Clock, Zap, Heart
} from 'lucide-react';
import Link from 'next/link';

interface WorkerHealth {
  workerId: string;
  workerName: string;
  riskLevel: string;
  riskScore: number;
  burnoutDebt: number;
  avgStress: number;
  avgEnergy: number;
  recentDifficulties: string[];
  activeAlerts: number;
  lastHelpSignal: string | null;
}

export default function LeaderDashboard() {
  const { user } = useAuth();
  const [workers, setWorkers] = useState<WorkerHealth[]>([]);
  const [pendingAlerts, setPendingAlerts] = useState(0);
  const [helpSignals, setHelpSignals] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [wRes, aRes, hRes] = await Promise.all([
        fetch('/api/burnout?type=all'),
        fetch('/api/alerts?status=pending'),
        fetch('/api/help-signal'),
      ]);
      if (wRes.ok) setWorkers(await wRes.json());
      if (aRes.ok) { const d = await aRes.json(); setPendingAlerts(Array.isArray(d) ? d.length : 0); }
      if (hRes.ok) {
        const signals = await hRes.json();
        setHelpSignals(signals.filter((s: any) => !s.readByLeader));
      }
    } catch {}
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const safeCount = workers.filter(w => w.riskLevel === 'safe').length;
  const warningCount = workers.filter(w => w.riskLevel === 'warning').length;
  const highRiskCount = workers.filter(w => w.riskLevel === 'high-risk').length;
  const avgDebt = workers.length > 0 ? Math.round(workers.reduce((s, w) => s + w.burnoutDebt, 0) / workers.length) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Leader Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Workforce wellness overview for {user?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          {helpSignals.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg animate-pulse">
              <Shield className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400 font-medium">{helpSignals.length} Help Signal{helpSignals.length > 1 ? 's' : ''}</span>
            </div>
          )}
          {pendingAlerts > 0 && (
            <Link href="/leader/alerts" className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition-colors">
              <Bell className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-amber-400 font-medium">{pendingAlerts} Pending Alert{pendingAlerts > 1 ? 's' : ''}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-brand-400" />
            <span className="text-xs text-slate-400">Total Workers</span>
          </div>
          <p className="text-3xl font-bold text-white">{workers.length}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-xs text-slate-400">Safe</span>
          </div>
          <p className="text-3xl font-bold text-green-400">{safeCount}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-xs text-slate-400">Warning</span>
          </div>
          <p className="text-3xl font-bold text-amber-400">{warningCount}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-xs text-slate-400">High Risk</span>
          </div>
          <p className="text-3xl font-bold text-red-400">{highRiskCount}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-slate-400">Avg Debt</span>
          </div>
          <p className="text-3xl font-bold text-white">{avgDebt}</p>
        </div>
      </div>

      {/* Help Signals Alert */}
      {helpSignals.length > 0 && (
        <div className="glass-card border-red-500/30 p-5">
          <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            PRIVATE: Unread Help Signals
          </h3>
          <div className="space-y-2">
            {helpSignals.map((s: any) => {
              const worker = workers.find(w => w.workerId === s.workerId);
              return (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                      <Heart className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{worker?.workerName || 'Worker'}</p>
                      <p className="text-xs text-red-400">&ldquo;{s.message}&rdquo; — {new Date(s.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className="text-xs text-red-400 bg-red-500/20 px-2 py-1 rounded-full">Needs Attention</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Worker List */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-400" />
            Workforce Health Overview
          </h3>
          <Link href="/leader/assign" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
            Assign Work <ChevronRight size={12} />
          </Link>
        </div>

        <div className="space-y-2">
          {workers
            .sort((a, b) => {
              const order = { 'high-risk': 0, 'warning': 1, 'safe': 2 };
              return (order[a.riskLevel as keyof typeof order] ?? 2) - (order[b.riskLevel as keyof typeof order] ?? 2);
            })
            .map(w => (
            <div key={w.workerId} className="flex items-center gap-4 p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 border border-slate-700/50 transition-all">
              {/* Status Dot */}
              <div className="relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                  w.riskLevel === 'high-risk' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                  w.riskLevel === 'warning' ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
                  'bg-gradient-to-br from-green-500 to-green-600'
                }`}>
                  {w.workerName.split(' ').map(n => n[0]).join('')}
                </div>
                {w.lastHelpSignal && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-[8px] text-white">!</span>
                  </div>
                )}
              </div>

              {/* Name & Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white">{w.workerName}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                    w.riskLevel === 'high-risk' ? 'bg-red-500/20 text-red-400' :
                    w.riskLevel === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {w.riskLevel === 'high-risk' ? '🔴 High Risk' : w.riskLevel === 'warning' ? '🟡 Warning' : '🟢 Safe'}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Brain size={10} /> Debt: {w.burnoutDebt}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Activity size={10} /> Stress: {w.avgStress}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Zap size={10} /> Energy: {w.avgEnergy}
                  </span>
                  {w.activeAlerts > 0 && (
                    <span className="text-xs text-red-400 flex items-center gap-1">
                      <AlertTriangle size={10} /> {w.activeAlerts} alerts
                    </span>
                  )}
                </div>
              </div>

              {/* Recent Difficulties */}
              <div className="flex gap-1">
                {w.recentDifficulties.slice(0, 3).map((d, i) => (
                  <span key={i} className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold ${
                    d === 'hard' ? 'bg-red-500/20 text-red-400' :
                    d === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {d[0].toUpperCase()}
                  </span>
                ))}
              </div>

              {/* Risk Score Bar */}
              <div className="w-20">
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                  <span>Risk</span>
                  <span>{w.riskScore}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${
                    w.riskScore >= 50 ? 'bg-red-500' : w.riskScore >= 25 ? 'bg-amber-500' : 'bg-green-500'
                  }`} style={{ width: `${w.riskScore}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
