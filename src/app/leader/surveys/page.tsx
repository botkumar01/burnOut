'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Activity, TrendingUp, TrendingDown, Minus, AlertTriangle, Star } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Worker { id: string; name: string; avatar: string; }

interface Survey {
  id: string;
  workerId: string;
  weekDate: string;
  stressLevel: number;
  energyLevel: number;
  workLifeBalance: number;
  notes: string;
}

// Compute wellness score (0-100): higher is better
function wellnessScore(stress: number, energy: number, balance: number): number {
  return Math.round(((5 - stress) + energy + balance) / 12 * 100);
}

// Compare avg of last 2 weeks vs prior 4 weeks for a given metric
function metricTrend(
  surveys: Survey[],
  getter: (s: Survey) => number,
  invert: boolean
): { trend: 'better' | 'worse' | 'stable'; recentAvg: number; olderAvg: number } {
  const sorted = [...surveys].sort((a, b) => b.weekDate.localeCompare(a.weekDate));
  const recent = sorted.slice(0, 2);
  const older = sorted.slice(2, 6);
  if (recent.length === 0 || older.length === 0) {
    return { trend: 'stable', recentAvg: recent.length > 0 ? Math.round(recent.reduce((s, x) => s + getter(x), 0) / recent.length * 10) / 10 : 0, olderAvg: 0 };
  }
  const recentAvg = recent.reduce((s, x) => s + getter(x), 0) / recent.length;
  const olderAvg = older.reduce((s, x) => s + getter(x), 0) / older.length;
  const diff = recentAvg - olderAvg;
  const threshold = 0.3;
  let trend: 'better' | 'worse' | 'stable' = 'stable';
  if (Math.abs(diff) >= threshold) {
    trend = invert ? (diff < 0 ? 'better' : 'worse') : (diff > 0 ? 'better' : 'worse');
  }
  return { trend, recentAvg: Math.round(recentAvg * 10) / 10, olderAvg: Math.round(olderAvg * 10) / 10 };
}

export default function SurveyMonitorPage() {
  const { user } = useAuth();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [allSurveys, setAllSurveys] = useState<Survey[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<string>('all');

  const fetchData = useCallback(async () => {
    try {
      const [wRes, sRes] = await Promise.all([
        fetch('/api/workers'),
        fetch('/api/surveys'),
      ]);
      if (wRes.ok) {
        const data = await wRes.json();
        setWorkers(data.filter((u: any) => u.role === 'worker'));
      }
      if (sRes.ok) setAllSurveys(await sRes.json());
    } catch {}
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = selectedWorker === 'all'
    ? allSurveys
    : allSurveys.filter(s => s.workerId === selectedWorker);

  // Build chart data grouped by week
  const weeklyData: Record<string, any> = {};
  filtered.forEach(s => {
    const wk = s.weekDate;
    if (!weeklyData[wk]) weeklyData[wk] = { week: wk.slice(5), stress: 0, energy: 0, balance: 0, count: 0 };
    weeklyData[wk].stress += s.stressLevel;
    weeklyData[wk].energy += s.energyLevel;
    weeklyData[wk].balance += s.workLifeBalance;
    weeklyData[wk].count += 1;
  });
  const chartData = Object.values(weeklyData)
    .map((w: any) => ({
      week: w.week,
      stress: Math.round((w.stress / w.count) * 10) / 10,
      energy: Math.round((w.energy / w.count) * 10) / 10,
      balance: Math.round((w.balance / w.count) * 10) / 10,
    }))
    .sort((a: any, b: any) => a.week.localeCompare(b.week));

  // Identify workers with concerning trends (2-week avg vs prior 4-week avg)
  const workerTrends = workers.map(w => {
    const wSurveys = allSurveys.filter(s => s.workerId === w.id).sort((a, b) => b.weekDate.localeCompare(a.weekDate));
    const stressTr = metricTrend(wSurveys, s => s.stressLevel, true);
    const energyTr = metricTrend(wSurveys, s => s.energyLevel, false);
    const balanceTr = metricTrend(wSurveys, s => s.workLifeBalance, false);

    // Wellness score trend
    const recent = wSurveys.slice(0, 2);
    const older = wSurveys.slice(2, 6);
    const recentWellness = recent.length > 0
      ? Math.round(recent.reduce((sum, s) => sum + wellnessScore(s.stressLevel, s.energyLevel, s.workLifeBalance), 0) / recent.length)
      : null;
    const olderWellness = older.length > 0
      ? Math.round(older.reduce((sum, s) => sum + wellnessScore(s.stressLevel, s.energyLevel, s.workLifeBalance), 0) / older.length)
      : null;

    const declining = stressTr.trend === 'worse' || energyTr.trend === 'worse' || balanceTr.trend === 'worse';
    const improving = stressTr.trend === 'better' && energyTr.trend !== 'worse' && balanceTr.trend !== 'worse';

    return {
      worker: w,
      stress: stressTr,
      energy: energyTr,
      balance: balanceTr,
      recentWellness,
      olderWellness,
      declining,
      improving,
      surveyCount: wSurveys.length,
    };
  });

  const decliningWorkers = workerTrends.filter(wt => wt.declining && wt.surveyCount >= 3);
  const improvingWorkers = workerTrends.filter(wt => wt.improving && wt.surveyCount >= 3);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-pink-400" />
          Survey Monitoring
        </h1>
        <p className="text-slate-400 text-sm mt-1">Track weekly wellness trends across the team (2-week vs prior 4-week averages)</p>
      </div>

      {/* Declining Wellness Alert */}
      {decliningWorkers.length > 0 && (
        <div className="glass-card p-4 border-l-4 border-l-red-500">
          <h3 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Declining Wellness Detected
          </h3>
          <p className="text-xs text-slate-400 mb-2">These workers show worsening metrics over the last 2 weeks compared to their prior 4-week average:</p>
          <div className="flex flex-wrap gap-2">
            {decliningWorkers.map(wt => (
              <span key={wt.worker.id} className="text-xs px-2.5 py-1.5 bg-red-500/10 text-red-300 rounded-full border border-red-500/20 flex items-center gap-1.5">
                {wt.worker.name}
                {wt.stress.trend === 'worse' && <span className="text-[9px] bg-red-500/20 px-1 rounded">Stress {'\u2191'}</span>}
                {wt.energy.trend === 'worse' && <span className="text-[9px] bg-red-500/20 px-1 rounded">Energy {'\u2193'}</span>}
                {wt.balance.trend === 'worse' && <span className="text-[9px] bg-red-500/20 px-1 rounded">Balance {'\u2193'}</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Improving Workers */}
      {improvingWorkers.length > 0 && (
        <div className="glass-card p-4 border-l-4 border-l-green-500">
          <h3 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Improving Wellness
          </h3>
          <div className="flex flex-wrap gap-2">
            {improvingWorkers.map(wt => (
              <span key={wt.worker.id} className="text-xs px-2.5 py-1 bg-green-500/10 text-green-300 rounded-full border border-green-500/20">
                {wt.worker.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Worker Wellness Summary */}
      {workerTrends.some(wt => wt.surveyCount >= 2) && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Per-Worker Wellness (Last 2 Weeks vs Prior 4 Weeks)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {workerTrends.filter(wt => wt.surveyCount >= 2).map(wt => (
              <div key={wt.worker.id} className={`p-4 rounded-lg border ${
                wt.declining ? 'bg-red-500/5 border-red-500/20' : wt.improving ? 'bg-green-500/5 border-green-500/20' : 'bg-slate-700/30 border-slate-700/50'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                    {wt.worker.avatar}
                  </div>
                  <span className="text-sm font-medium text-white">{wt.worker.name}</span>
                  {wt.recentWellness !== null && (
                    <span className={`text-[10px] ml-auto px-1.5 py-0.5 rounded ${
                      wt.recentWellness >= 60 ? 'bg-green-500/10 text-green-400' : wt.recentWellness >= 40 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {wt.recentWellness}/100
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Stress', data: wt.stress },
                    { label: 'Energy', data: wt.energy },
                    { label: 'Balance', data: wt.balance },
                  ].map(({ label, data }) => (
                    <div key={label}>
                      <p className="text-[10px] text-slate-500">{label}</p>
                      <p className="text-sm font-bold text-white">{data.recentAvg}</p>
                      <div className="flex items-center justify-center gap-0.5">
                        {data.trend === 'better' ? <TrendingUp className="w-3 h-3 text-green-400" /> :
                         data.trend === 'worse' ? <TrendingDown className="w-3 h-3 text-red-400" /> :
                         <Minus className="w-3 h-3 text-slate-500" />}
                        <span className={`text-[9px] ${data.trend === 'better' ? 'text-green-400' : data.trend === 'worse' ? 'text-red-400' : 'text-slate-500'}`}>
                          {data.olderAvg > 0 ? `was ${data.olderAvg}` : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedWorker('all')}
          className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
            selectedWorker === 'all' ? 'bg-brand-600 text-white' : 'bg-slate-700/50 text-slate-400 hover:text-white'
          }`}
        >
          All Workers
        </button>
        {workers.map(w => (
          <button
            key={w.id}
            onClick={() => setSelectedWorker(w.id)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
              selectedWorker === w.id ? 'bg-brand-600 text-white' : 'bg-slate-700/50 text-slate-400 hover:text-white'
            }`}
          >
            {w.name}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Weekly Trends</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="week" stroke="#64748b" fontSize={11} />
              <YAxis domain={[0, 5]} stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} />
              <Legend />
              <Line type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={2} name="Stress" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="energy" stroke="#06b6d4" strokeWidth={2} name="Energy" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="balance" stroke="#22c55e" strokeWidth={2} name="Balance" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Individual Surveys */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Survey Responses</h3>
        <div className="space-y-2">
          {filtered.sort((a, b) => b.weekDate.localeCompare(a.weekDate)).slice(0, 20).map(s => {
            const w = workers.find(w => w.id === s.workerId);
            return (
              <div key={s.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-700/30">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                  {w?.avatar || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{w?.name || 'Worker'}</p>
                  <p className="text-xs text-slate-500">{new Date(s.weekDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
                <div className="flex gap-6 text-center">
                  <div>
                    <p className="text-[10px] text-slate-500">Stress</p>
                    <p className={`text-sm font-bold ${s.stressLevel >= 4 ? 'text-red-400' : s.stressLevel >= 3 ? 'text-amber-400' : 'text-green-400'}`}>{s.stressLevel}/5</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Energy</p>
                    <p className={`text-sm font-bold ${s.energyLevel <= 2 ? 'text-red-400' : s.energyLevel <= 3 ? 'text-amber-400' : 'text-green-400'}`}>{s.energyLevel}/5</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Balance</p>
                    <p className={`text-sm font-bold ${s.workLifeBalance <= 2 ? 'text-red-400' : s.workLifeBalance <= 3 ? 'text-amber-400' : 'text-green-400'}`}>{s.workLifeBalance}/5</p>
                  </div>
                </div>
                {s.notes && (
                  <p className="text-xs text-slate-400 italic max-w-xs truncate" title={s.notes}>&ldquo;{s.notes}&rdquo;</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
