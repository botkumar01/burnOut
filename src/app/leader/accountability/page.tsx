'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { UserCheck, Shield, AlertTriangle, TrendingDown, Scale, BarChart3, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AccountabilityData {
  leaderId: string;
  fairnessScore: number;
  consecutiveHardAssignments: { workerId: string; workerName: string; count: number }[];
  overrideCount: number;
  totalAssignments: number;
  ignoredRecommendations: number;
  unresolvedAlerts: number;
  history: { date: string; score: number }[];
}

export default function AccountabilityPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AccountabilityData | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/accountability?leaderId=${user.id}`);
      if (res.ok) setData(await res.json());
    } catch {}
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!data) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const fairnessColor = data.fairnessScore >= 70 ? 'green' : data.fairnessScore >= 40 ? 'amber' : 'red';
  const overrideRate = data.totalAssignments > 0 ? Math.round((data.overrideCount / data.totalAssignments) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-brand-400" />
          TL Accountability Index
        </h1>
        <p className="text-slate-400 text-sm mt-1">Internal workload fairness and accountability metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 text-center">
          <Scale className="w-6 h-6 mx-auto mb-2 text-brand-400" />
          <p className="text-xs text-slate-400 mb-1">Fairness Score</p>
          <p className={`text-3xl font-bold ${
            fairnessColor === 'green' ? 'text-green-400' :
            fairnessColor === 'amber' ? 'text-amber-400' : 'text-red-400'
          }`}>{data.fairnessScore}</p>
          <p className="text-[10px] text-slate-500 mt-1">out of 100</p>
        </div>

        <div className="glass-card p-5 text-center">
          <FileText className="w-6 h-6 mx-auto mb-2 text-amber-400" />
          <p className="text-xs text-slate-400 mb-1">Override Rate</p>
          <p className={`text-3xl font-bold ${overrideRate > 30 ? 'text-red-400' : overrideRate > 15 ? 'text-amber-400' : 'text-green-400'}`}>
            {overrideRate}%
          </p>
          <p className="text-[10px] text-slate-500 mt-1">{data.overrideCount} / {data.totalAssignments}</p>
        </div>

        <div className="glass-card p-5 text-center">
          <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-red-400" />
          <p className="text-xs text-slate-400 mb-1">Unresolved Alerts</p>
          <p className={`text-3xl font-bold ${data.unresolvedAlerts > 3 ? 'text-red-400' : data.unresolvedAlerts > 0 ? 'text-amber-400' : 'text-green-400'}`}>
            {data.unresolvedAlerts}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">require action</p>
        </div>

        <div className="glass-card p-5 text-center">
          <TrendingDown className="w-6 h-6 mx-auto mb-2 text-purple-400" />
          <p className="text-xs text-slate-400 mb-1">Ignored Recs</p>
          <p className={`text-3xl font-bold ${data.ignoredRecommendations > 5 ? 'text-red-400' : data.ignoredRecommendations > 2 ? 'text-amber-400' : 'text-green-400'}`}>
            {data.ignoredRecommendations}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">recommendations</p>
        </div>
      </div>

      {/* Fairness Trend */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-brand-400" />
          Fairness Score Trend (14 days)
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.history.map(h => ({ ...h, date: h.date.slice(5) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} />
              <Line type="monotone" dataKey="score" stroke="#5c7cfa" strokeWidth={2} dot={{ fill: '#5c7cfa', r: 3 }} name="Fairness Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Consecutive Hard Assignments */}
      {data.consecutiveHardAssignments.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-400" />
            Consecutive Hard Assignment Tracking
          </h3>
          <div className="space-y-2">
            {data.consecutiveHardAssignments.map(c => (
              <div key={c.workerId} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                <span className="text-sm text-white">{c.workerName}</span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {Array.from({ length: c.count }, (_, i) => (
                      <div key={i} className="w-6 h-6 rounded bg-red-500/30 flex items-center justify-center">
                        <span className="text-[10px] text-red-400 font-bold">H</span>
                      </div>
                    ))}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    c.count >= 3 ? 'bg-red-500/20 text-red-400' :
                    c.count >= 2 ? 'bg-amber-500/20 text-amber-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {c.count} days
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="glass-card p-5 bg-brand-500/5 border-brand-500/20">
        <h3 className="text-sm font-semibold text-brand-300 mb-2">About the Accountability Index</h3>
        <ul className="text-xs text-slate-400 space-y-1.5">
          <li>• <strong>Fairness Score</strong> measures equitable workload distribution across team members</li>
          <li>• <strong>Override Rate</strong> tracks how often system recommendations are overridden</li>
          <li>• <strong>Every override</strong> requires a mandatory logged reason for transparency</li>
          <li>• <strong>Unresolved alerts</strong> lower the accountability score over time</li>
          <li>• This index is for internal governance — it is not visible publicly</li>
        </ul>
      </div>
    </div>
  );
}
