'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ClipboardList, Clock, Coffee, CheckCircle, Monitor, Save, History } from 'lucide-react';

interface WorkLogEntry {
  id: string;
  date: string;
  screenTimeHours: number;
  tasksCompleted: number;
  taskDescriptions: string[];
  breaksTaken: number;
  breakDurationMinutes: number;
  sessionStartTime: string;
  sessionEndTime: string;
  longestSessionMinutes: number;
}

export default function WorkLogPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WorkLogEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<'log' | 'history'>('log');

  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    screenTimeHours: '',
    tasksCompleted: '',
    taskDescriptions: '',
    breaksTaken: '',
    breakDurationMinutes: '',
    sessionStartTime: '09:00',
    sessionEndTime: '17:00',
    longestSessionMinutes: '',
  });

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/worklog?workerId=${user.id}&days=14`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch {}
  }, [user]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch('/api/worklog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: user.id,
          date: today,
          screenTimeHours: parseFloat(form.screenTimeHours) || 0,
          tasksCompleted: parseInt(form.tasksCompleted) || 0,
          taskDescriptions: form.taskDescriptions.split('\n').filter(Boolean),
          breaksTaken: parseInt(form.breaksTaken) || 0,
          breakDurationMinutes: parseInt(form.breakDurationMinutes) || 0,
          sessionStartTime: form.sessionStartTime,
          sessionEndTime: form.sessionEndTime,
          longestSessionMinutes: parseInt(form.longestSessionMinutes) || 0,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        fetchLogs();
      }
    } catch {}
    setSaving(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-brand-400" />
          Daily Work Log
        </h1>
        <p className="text-slate-400 text-sm mt-1">Log your daily work activity for today ({new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })})</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg w-fit">
        <button onClick={() => setTab('log')} className={`px-4 py-2 text-sm rounded-md transition-all ${tab === 'log' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}>
          Today&apos;s Log
        </button>
        <button onClick={() => setTab('history')} className={`px-4 py-2 text-sm rounded-md transition-all ${tab === 'history' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}>
          <History size={14} className="inline mr-1" /> History
        </button>
      </div>

      {tab === 'log' ? (
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Screen Time */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Monitor size={14} /> Screen Time (hours)
              </label>
              <input
                type="number" step="0.5" min="0" max="24"
                value={form.screenTimeHours}
                onChange={e => setForm(f => ({ ...f, screenTimeHours: e.target.value }))}
                className="w-full input-dark"
                placeholder="e.g., 7.5"
                required
              />
            </div>

            {/* Tasks Completed */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <CheckCircle size={14} /> Tasks Completed
              </label>
              <input
                type="number" min="0"
                value={form.tasksCompleted}
                onChange={e => setForm(f => ({ ...f, tasksCompleted: e.target.value }))}
                className="w-full input-dark"
                placeholder="e.g., 5"
                required
              />
            </div>

            {/* Session Start */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Clock size={14} /> Session Start
              </label>
              <input
                type="time"
                value={form.sessionStartTime}
                onChange={e => setForm(f => ({ ...f, sessionStartTime: e.target.value }))}
                className="w-full input-dark"
                required
              />
            </div>

            {/* Session End */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Clock size={14} /> Session End
              </label>
              <input
                type="time"
                value={form.sessionEndTime}
                onChange={e => setForm(f => ({ ...f, sessionEndTime: e.target.value }))}
                className="w-full input-dark"
                required
              />
            </div>

            {/* Breaks Taken */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Coffee size={14} /> Breaks Taken
              </label>
              <input
                type="number" min="0"
                value={form.breaksTaken}
                onChange={e => setForm(f => ({ ...f, breaksTaken: e.target.value }))}
                className="w-full input-dark"
                placeholder="e.g., 3"
                required
              />
            </div>

            {/* Break Duration */}
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Total Break Duration (min)</label>
              <input
                type="number" min="0"
                value={form.breakDurationMinutes}
                onChange={e => setForm(f => ({ ...f, breakDurationMinutes: e.target.value }))}
                className="w-full input-dark"
                placeholder="e.g., 45"
                required
              />
            </div>

            {/* Longest Session */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-300 mb-2 block">Longest Continuous Session (min)</label>
              <input
                type="number" min="0"
                value={form.longestSessionMinutes}
                onChange={e => setForm(f => ({ ...f, longestSessionMinutes: e.target.value }))}
                className="w-full input-dark"
                placeholder="e.g., 90"
                required
              />
            </div>
          </div>

          {/* Task Descriptions */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">Task Descriptions (one per line)</label>
            <textarea
              rows={4}
              value={form.taskDescriptions}
              onChange={e => setForm(f => ({ ...f, taskDescriptions: e.target.value }))}
              className="w-full input-dark resize-none"
              placeholder="Feature development&#10;Code review&#10;Bug fixes"
            />
          </div>

          <div className="flex items-center gap-4">
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
              <Save size={16} /> {saving ? 'Saving...' : 'Save Log'}
            </button>
            {saved && (
              <span className="text-green-400 text-sm flex items-center gap-1 animate-fade-in">
                <CheckCircle size={14} /> Saved successfully!
              </span>
            )}
          </div>
        </form>
      ) : (
        /* History Tab */
        <div className="glass-card p-6">
          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="p-4 rounded-lg bg-slate-700/30 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">
                    {new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    log.screenTimeHours > 9 ? 'bg-red-500/20 text-red-400' :
                    log.screenTimeHours > 8 ? 'bg-amber-500/20 text-amber-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {log.screenTimeHours}h screen time
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4 text-xs text-slate-400">
                  <div><span className="text-slate-500">Tasks:</span> {log.tasksCompleted}</div>
                  <div><span className="text-slate-500">Breaks:</span> {log.breaksTaken}</div>
                  <div><span className="text-slate-500">Break min:</span> {log.breakDurationMinutes}</div>
                  <div><span className="text-slate-500">Longest:</span> {log.longestSessionMinutes}m</div>
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-8">No work logs yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
