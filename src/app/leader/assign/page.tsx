'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Users, Brain, AlertTriangle, CheckCircle, ChevronDown,
  ChevronRight, History, Lightbulb, ShieldAlert, Info
} from 'lucide-react';

interface Worker {
  id: string;
  name: string;
  avatar: string;
}

interface Recommendation {
  workerId: string;
  recommendedDifficulty: string;
  reasoning: string;
  factors: string[];
  confidence: string;
}

interface Assignment {
  id: string;
  workerId: string;
  date: string;
  difficulty: string;
  taskTitle: string;
  taskDescription: string;
  wasOverride: boolean;
  overrideReason: string | null;
  recommendedDifficulty: string | null;
}

export default function AssignWorkPage() {
  const { user } = useAuth();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [history, setHistory] = useState<Assignment[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [difficulty, setDifficulty] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const fetchWorkers = useCallback(async () => {
    try {
      const res = await fetch('/api/workers');
      if (res.ok) {
        const data = await res.json();
        setWorkers(data.filter((u: any) => u.role === 'worker'));
      }
    } catch {}
  }, []);

  useEffect(() => { fetchWorkers(); }, [fetchWorkers]);

  const selectWorker = async (workerId: string) => {
    setSelectedWorker(workerId);
    setDifficulty('');
    setTaskTitle('');
    setTaskDesc('');
    setOverrideReason('');
    setSaved(false);

    try {
      const [recRes, histRes] = await Promise.all([
        fetch(`/api/recommendations?workerId=${workerId}`),
        fetch(`/api/assignments?workerId=${workerId}&days=3`),
      ]);
      if (recRes.ok) setRecommendation(await recRes.json());
      if (histRes.ok) setHistory(await histRes.json());
    } catch {}
  };

  const isOverride = recommendation && difficulty && difficulty !== recommendation.recommendedDifficulty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedWorker || !difficulty || !taskTitle) return;
    if (isOverride && !overrideReason.trim()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: selectedWorker,
          assignedBy: user.id,
          date: today,
          difficulty,
          taskTitle,
          taskDescription: taskDesc,
          recommendedDifficulty: recommendation?.recommendedDifficulty || null,
          wasOverride: !!isOverride,
          overrideReason: isOverride ? overrideReason : null,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        // Refresh history
        const histRes = await fetch(`/api/assignments?workerId=${selectedWorker}&days=3`);
        if (histRes.ok) setHistory(await histRes.json());
      }
    } catch {}
    setSaving(false);
  };

  const worker = workers.find(w => w.id === selectedWorker);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-brand-400" />
          Work Assignment
        </h1>
        <p className="text-slate-400 text-sm mt-1">Assign daily work with adaptive recommendations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Worker Selection */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Select Worker</h3>
          <div className="space-y-2">
            {workers.map(w => (
              <button
                key={w.id}
                onClick={() => selectWorker(w.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                  selectedWorker === w.id
                    ? 'bg-brand-600/20 border border-brand-500/30'
                    : 'bg-slate-700/30 hover:bg-slate-700/50 border border-transparent'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                  {w.avatar}
                </div>
                <span className="text-sm text-white">{w.name}</span>
                {selectedWorker === w.id && <ChevronRight size={14} className="ml-auto text-brand-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Assignment Form */}
        <div className="lg:col-span-2 space-y-4">
          {selectedWorker ? (
            <>
              {/* Recommendation Card */}
              {recommendation && (
                <div className={`glass-card p-5 border-l-4 ${
                  recommendation.confidence === 'high' ? 'border-l-green-500' :
                  recommendation.confidence === 'medium' ? 'border-l-amber-500' :
                  'border-l-slate-500'
                }`}>
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-white">System Recommendation</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-semibold ${
                          recommendation.confidence === 'high' ? 'bg-green-500/20 text-green-400' :
                          recommendation.confidence === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {recommendation.confidence} confidence
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 mb-2">
                        Recommended: <strong className={`${
                          recommendation.recommendedDifficulty === 'easy' ? 'text-green-400' :
                          recommendation.recommendedDifficulty === 'medium' ? 'text-amber-400' :
                          'text-red-400'
                        }`}>
                          {recommendation.recommendedDifficulty.charAt(0).toUpperCase() + recommendation.recommendedDifficulty.slice(1)}
                        </strong>
                      </p>
                      <p className="text-xs text-slate-400 mb-2">{recommendation.reasoning}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {recommendation.factors.map((f, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-700/50 text-slate-400 rounded-full">{f}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Assignment Form */}
              <form onSubmit={handleSubmit} className="glass-card p-5 space-y-5">
                <h3 className="text-sm font-semibold text-white">
                  Assign Work for {worker?.name} — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h3>

                {/* Difficulty Selection */}
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-3 block">Difficulty Level</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['easy', 'medium', 'hard'] as const).map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        className={`p-4 rounded-lg border text-center transition-all ${
                          difficulty === d
                            ? d === 'easy' ? 'bg-green-500/20 border-green-500/50 text-green-400' :
                              d === 'medium' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' :
                              'bg-red-500/20 border-red-500/50 text-red-400'
                            : 'border-slate-700 hover:border-slate-600 text-slate-400'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{d === 'easy' ? '🟢' : d === 'medium' ? '🟡' : '🔴'}</span>
                        <span className="text-sm font-semibold capitalize">{d}</span>
                        {recommendation?.recommendedDifficulty === d && (
                          <span className="block text-[10px] mt-1 text-brand-400">Recommended</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Override Warning */}
                {isOverride && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-amber-400 font-medium mb-1">Override Detected</p>
                        <p className="text-xs text-amber-300/70 mb-3">
                          You are overriding the system recommendation ({recommendation?.recommendedDifficulty} → {difficulty}).
                          A mandatory reason is required and will be logged for accountability.
                        </p>
                        <textarea
                          rows={3}
                          value={overrideReason}
                          onChange={e => setOverrideReason(e.target.value)}
                          className="w-full input-dark text-sm"
                          placeholder="Explain why this override is necessary..."
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Task Details */}
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Task Title</label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                    className="w-full input-dark"
                    placeholder="e.g., API Integration Sprint"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Task Description</label>
                  <textarea
                    rows={3}
                    value={taskDesc}
                    onChange={e => setTaskDesc(e.target.value)}
                    className="w-full input-dark resize-none"
                    placeholder="Detailed task description..."
                  />
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={saving || !difficulty || !taskTitle || (!!isOverride && !overrideReason.trim())}
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    <CheckCircle size={16} /> {saving ? 'Assigning...' : 'Assign Work'}
                  </button>
                  {saved && (
                    <span className="text-green-400 text-sm flex items-center gap-1 animate-fade-in">
                      <CheckCircle size={14} /> Assignment saved!
                    </span>
                  )}
                </div>
              </form>

              {/* History */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <History className="w-4 h-4 text-brand-400" />
                  Last 3 Days History — {worker?.name}
                </h3>
                <div className="space-y-2">
                  {history.slice(0, 3).map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                      <div>
                        <span className="text-xs text-slate-500">
                          {new Date(a.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <p className="text-sm text-white">{a.taskTitle}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          a.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
                          a.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {a.difficulty.charAt(0).toUpperCase() + a.difficulty.slice(1)}
                        </span>
                        {a.wasOverride && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded" title={a.overrideReason || ''}>
                            Override
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">No recent assignments</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="glass-card p-12 text-center">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Select a worker to assign work</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
