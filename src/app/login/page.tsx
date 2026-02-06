'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Shield, Brain, Users, ArrowRight, Zap, Heart, Eye } from 'lucide-react';

const demoUsers = [
  { id: 'tl-001', name: 'Priya Sharma', role: 'leader' as const, avatar: 'PS', desc: 'Team Leader – Full dashboard access' },
  { id: 'w-001', name: 'Arjun Mehta', role: 'worker' as const, avatar: 'AM', desc: 'Worker – High burnout risk (demo)' },
  { id: 'w-002', name: 'Sneha Patel', role: 'worker' as const, avatar: 'SP', desc: 'Worker – Moderate workload' },
  { id: 'w-003', name: 'Rahul Verma', role: 'worker' as const, avatar: 'RV', desc: 'Worker – Warning status' },
  { id: 'w-004', name: 'Kavya Nair', role: 'worker' as const, avatar: 'KN', desc: 'Worker – Healthy & balanced' },
  { id: 'w-005', name: 'Deepak Singh', role: 'worker' as const, avatar: 'DS', desc: 'Worker – Standard workload' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleLogin = async (userId: string, role: string) => {
    setLoading(userId);
    setError('');
    try {
      await login(userId);
      router.push(role === 'leader' ? '/leader/dashboard' : '/worker/dashboard');
    } catch {
      setError('Login failed. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/40 via-slate-900 to-cyan-900/20" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-brand-500/25">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">BurnoutShield</h1>
              <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">by Solutioners</p>
            </div>
          </div>

          {/* Main Title */}
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-500/10 border border-brand-500/20 rounded-full mb-6">
              <Zap className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-xs font-medium text-brand-300 tracking-wide uppercase">Emerging Power Theme</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              Workplace Burnout &<br />
              <span className="bg-gradient-to-r from-brand-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Early Warning System
              </span>
            </h2>

            <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-2xl">
              Ethical workload management powered by human cognitive awareness.
              Protect your team&apos;s wellbeing with real-time burnout detection,
              adaptive recommendations, and accountability-first design.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 mb-10">
              {[
                { icon: Brain, label: 'Burnout Detection Engine' },
                { icon: Heart, label: 'Privacy-First Design' },
                { icon: Eye, label: 'Human-in-the-Loop' },
                { icon: Users, label: 'TL Accountability' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700/50 rounded-lg">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-300">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Login Section */}
      <div className="flex-1 max-w-6xl mx-auto px-6 pb-16 w-full">
        <h3 className="text-lg font-semibold text-white mb-2">Select a demo account to continue</h3>
        <p className="text-sm text-slate-400 mb-6">Choose a role to explore the full system capabilities</p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {demoUsers.map((u) => (
            <button
              key={u.id}
              onClick={() => handleLogin(u.id, u.role)}
              disabled={loading !== null}
              className="group relative bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 text-left
                         hover:bg-slate-800 hover:border-slate-600/50 transition-all duration-300
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white
                  ${u.role === 'leader'
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                    : 'bg-gradient-to-br from-brand-500 to-purple-500'
                  }`}
                >
                  {u.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white text-sm">{u.name}</span>
                    {loading === u.id && (
                      <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{u.desc}</p>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full
                    ${u.role === 'leader' ? 'bg-amber-500/20 text-amber-400' : 'bg-brand-500/20 text-brand-400'}`}
                  >
                    {u.role === 'leader' ? 'Team Leader' : 'Worker'}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-slate-500">
          <span>&copy; 2025 Solutioners. Ethical AI for Human Wellbeing.</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            System Online
          </span>
        </div>
      </footer>
    </div>
  );
}
