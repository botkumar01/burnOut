'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Heart, Send, CheckCircle, TrendingUp, TrendingDown, Minus, History, Star, BarChart3 } from 'lucide-react';

interface SurveyEntry {
  id: string;
  weekDate: string;
  stressLevel: number;
  energyLevel: number;
  workLifeBalance: number;
  notes: string;
}

const ratingLabels: Record<string, string[]> = {
  stress: ['Very Low', 'Low', 'Moderate', 'High', 'Very High'],
  energy: ['Exhausted', 'Low', 'Moderate', 'Good', 'Excellent'],
  balance: ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'],
};

// Compute trend by comparing avg of recent N surveys vs avg of the preceding M surveys
function computeTrend(
  surveys: SurveyEntry[],
  getter: (s: SurveyEntry) => number,
  invert: boolean,
  recentCount = 2,
  olderCount = 4
): { trend: 'better' | 'worse' | 'stable'; recentAvg: number; olderAvg: number; change: number } {
  const sorted = [...surveys].sort((a, b) => b.weekDate.localeCompare(a.weekDate));
  const recent = sorted.slice(0, recentCount);
  const older = sorted.slice(recentCount, recentCount + olderCount);

  if (recent.length === 0) return { trend: 'stable', recentAvg: 0, olderAvg: 0, change: 0 };

  const recentAvg = recent.reduce((sum, s) => sum + getter(s), 0) / recent.length;

  if (older.length === 0) return { trend: 'stable', recentAvg: Math.round(recentAvg * 10) / 10, olderAvg: 0, change: 0 };

  const olderAvg = older.reduce((sum, s) => sum + getter(s), 0) / older.length;
  const diff = recentAvg - olderAvg;
  const threshold = 0.3; // need at least 0.3 change to call it a trend

  let trend: 'better' | 'worse' | 'stable' = 'stable';
  if (Math.abs(diff) >= threshold) {
    if (invert) {
      trend = diff < 0 ? 'better' : 'worse'; // for stress, lower is better
    } else {
      trend = diff > 0 ? 'better' : 'worse'; // for energy/balance, higher is better
    }
  }

  const changePct = olderAvg > 0 ? Math.round((diff / olderAvg) * 100) : 0;

  return {
    trend,
    recentAvg: Math.round(recentAvg * 10) / 10,
    olderAvg: Math.round(olderAvg * 10) / 10,
    change: changePct,
  };
}

// Compute a composite wellness score (0-100)
// wellness = ((5 - stress) + energy + balance) / 12 * 100
function wellnessScore(stress: number, energy: number, balance: number): number {
  return Math.round(((5 - stress) + energy + balance) / 12 * 100);
}

export default function SurveyPage() {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState<SurveyEntry[]>([]);
  const [tab, setTab] = useState<'submit' | 'history'>('submit');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [stressLevel, setStressLevel] = useState(0);
  const [energyLevel, setEnergyLevel] = useState(0);
  const [workLifeBalance, setWorkLifeBalance] = useState(0);
  const [notes, setNotes] = useState('');

  const fetchSurveys = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/surveys?workerId=${user.id}`);
      if (res.ok) setSurveys(await res.json());
    } catch {}
  }, [user]);

  useEffect(() => { fetchSurveys(); }, [fetchSurveys]);

  const today = new Date();
  const isFriday = today.getDay() === 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !stressLevel || !energyLevel || !workLifeBalance) return;
    setSaving(true);
    try {
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: user.id,
          weekDate: today.toISOString().split('T')[0],
          stressLevel,
          energyLevel,
          workLifeBalance,
          notes,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setStressLevel(0);
        setEnergyLevel(0);
        setWorkLifeBalance(0);
        setNotes('');
        fetchSurveys();
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {}
    setSaving(false);
  };

  const RatingSelector = ({ label, type, value, onChange }: { label: string; type: string; value: number; onChange: (v: number) => void }) => (
    <div>
      <label className="text-sm font-medium text-slate-300 mb-3 block">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={`flex-1 py-3 px-2 rounded-lg border text-center transition-all duration-200 ${
              value === i
                ? type === 'stress'
                  ? i >= 4 ? 'bg-red-500/20 border-red-500/50 text-red-400' : i >= 3 ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-green-500/20 border-green-500/50 text-green-400'
                  : i >= 4 ? 'bg-green-500/20 border-green-500/50 text-green-400' : i >= 3 ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-red-500/20 border-red-500/50 text-red-400'
                : 'border-slate-700 hover:border-slate-600 text-slate-400'
            }`}
          >
            <span className="text-lg font-bold block">{i}</span>
            <span className="text-[10px] mt-0.5 block">{ratingLabels[type]?.[i - 1]}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // Compute trends: avg of last 2 weeks vs avg of preceding 4 weeks
  const stressTrend = computeTrend(surveys, s => s.stressLevel, true);
  const energyTrend = computeTrend(surveys, s => s.energyLevel, false);
  const balanceTrend = computeTrend(surveys, s => s.workLifeBalance, false);

  // Wellness score trend
  const sorted = [...surveys].sort((a, b) => b.weekDate.localeCompare(a.weekDate));
  const recentWellness = sorted.slice(0, 2);
  const olderWellness = sorted.slice(2, 6);
  const recentWellnessAvg = recentWellness.length > 0
    ? Math.round(recentWellness.reduce((sum, s) => sum + wellnessScore(s.stressLevel, s.energyLevel, s.workLifeBalance), 0) / recentWellness.length)
    : 0;
  const olderWellnessAvg = olderWellness.length > 0
    ? Math.round(olderWellness.reduce((sum, s) => sum + wellnessScore(s.stressLevel, s.energyLevel, s.workLifeBalance), 0) / olderWellness.length)
    : 0;
  const wellnessDiff = recentWellnessAvg - olderWellnessAvg;

  const trendIcon = (trend: 'better' | 'worse' | 'stable') =>
    trend === 'better' ? <TrendingUp className="w-4 h-4 text-green-400" /> :
    trend === 'worse' ? <TrendingDown className="w-4 h-4 text-red-400" /> :
    <Minus className="w-4 h-4 text-slate-400" />;

  const trendColor = (trend: 'better' | 'worse' | 'stable') =>
    trend === 'better' ? 'text-green-400' : trend === 'worse' ? 'text-red-400' : 'text-slate-400';

  const trendLabel = (trend: 'better' | 'worse' | 'stable') =>
    trend === 'better' ? 'Improving' : trend === 'worse' ? 'Declining' : 'Stable';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Heart className="w-6 h-6 text-pink-400" />
          Weekly Wellness Survey
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {isFriday ? 'It\'s Friday! Please complete your weekly wellness check.' : 'Surveys are submitted every Friday. You can still submit now.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg w-fit">
        <button onClick={() => setTab('submit')} className={`px-4 py-2 text-sm rounded-md transition-all ${tab === 'submit' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}>
          Submit Survey
        </button>
        <button onClick={() => setTab('history')} className={`px-4 py-2 text-sm rounded-md transition-all ${tab === 'history' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}>
          <History size={14} className="inline mr-1" /> History & Trends
        </button>
      </div>

      {tab === 'submit' ? (
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-8">
          {saved ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Survey Submitted!</h3>
              <p className="text-slate-400">Thank you for sharing. Your wellbeing matters to us.</p>
            </div>
          ) : (
            <>
              <RatingSelector label="Stress Level" type="stress" value={stressLevel} onChange={setStressLevel} />
              <RatingSelector label="Energy Level" type="energy" value={energyLevel} onChange={setEnergyLevel} />
              <RatingSelector label="Work-Life Balance" type="balance" value={workLifeBalance} onChange={setWorkLifeBalance} />

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Additional Notes (optional)</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full input-dark resize-none"
                  placeholder="Anything you'd like to share about your week..."
                />
              </div>

              <button
                type="submit"
                disabled={saving || !stressLevel || !energyLevel || !workLifeBalance}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <Send size={16} /> {saving ? 'Submitting...' : 'Submit Survey'}
              </button>
            </>
          )}
        </form>
      ) : (
        <div className="space-y-4">
          {/* Wellness Score */}
          {surveys.length >= 2 && (
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-brand-400" />
                <h3 className="text-sm font-semibold text-white">Wellness Score</h3>
                <span className="text-[10px] text-slate-500 ml-auto">Last 2 weeks vs prior 4 weeks</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className={`text-4xl font-bold ${recentWellnessAvg >= 60 ? 'text-green-400' : recentWellnessAvg >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                    {recentWellnessAvg}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">out of 100</p>
                </div>
                {olderWellness.length > 0 && (
                  <div className="flex-1">
                    <div className={`flex items-center gap-1.5 ${wellnessDiff > 0 ? 'text-green-400' : wellnessDiff < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                      {wellnessDiff > 0 ? <TrendingUp className="w-4 h-4" /> : wellnessDiff < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                      <span className="text-sm font-medium">
                        {wellnessDiff > 0 ? '+' : ''}{wellnessDiff} pts
                      </span>
                      <span className="text-xs">
                        {wellnessDiff > 3 ? 'Improving' : wellnessDiff < -3 ? 'Declining' : 'Stable'}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-4 text-[10px] text-slate-500">
                      <span>Recent 2 wks: {recentWellnessAvg}</span>
                      <span>Prior 4 wks: {olderWellnessAvg}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${recentWellnessAvg >= 60 ? 'bg-green-500' : recentWellnessAvg >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${recentWellnessAvg}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Per-Metric Trends */}
          {surveys.length >= 2 && (
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-semibold text-white">Metric Trends</h3>
                <span className="text-[10px] text-slate-500 ml-auto">Avg last 2 weeks vs prior 4 weeks</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Stress', data: stressTrend, color: 'amber' },
                  { label: 'Energy', data: energyTrend, color: 'cyan' },
                  { label: 'Balance', data: balanceTrend, color: 'green' },
                ].map(({ label, data, color }) => (
                  <div key={label} className="p-4 rounded-lg bg-slate-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-400">{label}</p>
                      {trendIcon(data.trend)}
                    </div>
                    <p className={`text-2xl font-bold text-${color}-400`}>{data.recentAvg}<span className="text-sm text-slate-500">/5</span></p>
                    {data.olderAvg > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className={`text-xs font-medium ${trendColor(data.trend)}`}>
                          {trendLabel(data.trend)}
                          {data.change !== 0 && ` (${data.change > 0 ? '+' : ''}${data.change}%)`}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          was {data.olderAvg}/5
                        </p>
                      </div>
                    )}
                    {data.olderAvg === 0 && (
                      <p className="text-[10px] text-slate-500 mt-2">Need more data for comparison</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {surveys.length > 0 && surveys.length < 2 && (
            <div className="glass-card p-5 text-center">
              <p className="text-sm text-slate-400">Submit at least 2 surveys to see wellness trends</p>
            </div>
          )}

          {/* Survey History */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Survey History</h3>
            <div className="space-y-3">
              {sorted.map(s => (
                <div key={s.id} className="p-4 rounded-lg bg-slate-700/30 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-white">
                      Week of {new Date(s.weekDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      wellnessScore(s.stressLevel, s.energyLevel, s.workLifeBalance) >= 60
                        ? 'bg-green-500/10 text-green-400'
                        : wellnessScore(s.stressLevel, s.energyLevel, s.workLifeBalance) >= 40
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-red-500/10 text-red-400'
                    }`}>
                      Score: {wellnessScore(s.stressLevel, s.energyLevel, s.workLifeBalance)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Stress</p>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} size={14} className={i <= s.stressLevel ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Energy</p>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} size={14} className={i <= s.energyLevel ? 'text-cyan-400 fill-cyan-400' : 'text-slate-600'} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Balance</p>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} size={14} className={i <= s.workLifeBalance ? 'text-green-400 fill-green-400' : 'text-slate-600'} />
                        ))}
                      </div>
                    </div>
                  </div>
                  {s.notes && <p className="text-xs text-slate-400 mt-2 italic">&ldquo;{s.notes}&rdquo;</p>}
                </div>
              ))}
              {surveys.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">No surveys submitted yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
