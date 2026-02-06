'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { BarChart3, TrendingUp, Brain, Activity } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface WorkerHealth {
  workerId: string;
  workerName: string;
  riskLevel: string;
  riskScore: number;
  burnoutDebt: number;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [workers, setWorkers] = useState<WorkerHealth[]>([]);
  const [workLogs, setWorkLogs] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [debtData, setDebtData] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [wRes, lRes, aRes] = await Promise.all([
        fetch('/api/burnout?type=all'),
        fetch('/api/worklog?days=14'),
        fetch('/api/assignments?days=14'),
      ]);
      if (wRes.ok) setWorkers(await wRes.json());
      if (lRes.ok) setWorkLogs(await lRes.json());
      if (aRes.ok) setAssignments(await aRes.json());

      // Fetch debt data for each worker
      const debts: any[] = [];
      const workerData = await (await fetch('/api/workers')).json();
      const workerList = workerData.filter((u: any) => u.role === 'worker');
      for (const w of workerList) {
        const dRes = await fetch(`/api/burnout?workerId=${w.id}&type=debt`);
        if (dRes.ok) {
          const d = await dRes.json();
          debts.push({ ...d, workerName: w.name });
        }
      }
      setDebtData(debts);
    } catch {}
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Build chart data ──

  // Work hours trend by day (average across workers)
  const hoursData: Record<string, { date: string; total: number; count: number }> = {};
  workLogs.forEach(l => {
    if (!hoursData[l.date]) hoursData[l.date] = { date: l.date, total: 0, count: 0 };
    hoursData[l.date].total += l.screenTimeHours;
    hoursData[l.date].count += 1;
  });
  const hoursTrend = Object.values(hoursData)
    .map(h => ({ date: h.date.slice(5), avg: Math.round((h.total / h.count) * 10) / 10 }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Difficulty distribution
  const diffCounts = { easy: 0, medium: 0, hard: 0 };
  assignments.forEach(a => { diffCounts[a.difficulty as keyof typeof diffCounts]++; });
  const diffData = [
    { name: 'Easy', count: diffCounts.easy, fill: '#22c55e' },
    { name: 'Medium', count: diffCounts.medium, fill: '#f59e0b' },
    { name: 'Hard', count: diffCounts.hard, fill: '#ef4444' },
  ];

  // Burnout risk trend
  const riskTrend: Record<string, { date: string; highRisk: number; warning: number; safe: number }> = {};
  if (debtData.length > 0) {
    debtData.forEach(d => {
      (d.history || []).forEach((h: any) => {
        if (!riskTrend[h.date]) riskTrend[h.date] = { date: h.date, highRisk: 0, warning: 0, safe: 0 };
        if (h.score > 60) riskTrend[h.date].highRisk++;
        else if (h.score > 30) riskTrend[h.date].warning++;
        else riskTrend[h.date].safe++;
      });
    });
  }
  const riskTrendData = Object.values(riskTrend)
    .map(r => ({ ...r, date: r.date.slice(5) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Burnout debt by worker
  const debtByWorker = debtData.map(d => ({
    name: d.workerName?.split(' ')[0] || 'Worker',
    debt: d.currentDebt || 0,
    fill: (d.currentDebt || 0) > 60 ? '#ef4444' : (d.currentDebt || 0) > 30 ? '#f59e0b' : '#22c55e',
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-400" />
          Analytics Dashboard
        </h1>
        <p className="text-slate-400 text-sm mt-1">14-day workforce analytics and trends</p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Hours Trend */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-400" />
            Average Work Hours Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hoursTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Line type="monotone" dataKey="avg" stroke="#5c7cfa" strokeWidth={2} dot={{ fill: '#5c7cfa', r: 3 }} name="Avg Hours" />
                {/* 8-hour reference line */}
                <Line type="monotone" dataKey={() => 8} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={1} dot={false} name="8h Limit" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Difficulty Distribution */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-400" />
            Difficulty Distribution (14 days)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diffData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Assignments">
                  {diffData.map((entry, i) => (
                    <rect key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Burnout Risk Trend */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-red-400" />
            Burnout Risk Distribution Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="safe" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} name="Safe" />
                <Area type="monotone" dataKey="warning" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name="Warning" />
                <Area type="monotone" dataKey="highRisk" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="High Risk" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Burnout Debt by Worker */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            Burnout Debt by Worker
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={debtByWorker} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} width={60} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="debt" radius={[0, 6, 6, 0]} name="Debt Score">
                  {debtByWorker.map((entry, i) => (
                    <rect key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
