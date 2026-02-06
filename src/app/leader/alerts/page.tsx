'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  AlertTriangle, Shield, Clock, CheckCircle, Eye,
  ChevronDown, ChevronUp, FileText, Send
} from 'lucide-react';

interface AlertItem {
  id: string;
  workerId: string;
  type: string;
  severity: string;
  message: string;
  details: string;
  status: string;
  createdAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  tlExplanation: string | null;
  correctiveAction: string | null;
}

export default function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'acknowledged' | 'resolved'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);

  const [explanation, setExplanation] = useState('');
  const [corrective, setCorrective] = useState('');

  const fetchAlerts = useCallback(async () => {
    try {
      const url = filter === 'all' ? '/api/alerts' : `/api/alerts?status=${filter}`;
      const res = await fetch(url);
      if (res.ok) setAlerts(await res.json());
    } catch {}
  }, [filter]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleAcknowledge = async (id: string) => {
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'acknowledge' }),
      });
      fetchAlerts();
    } catch {}
  };

  const handleResolve = async (id: string) => {
    if (!explanation.trim() || !corrective.trim()) return;
    setResolving(id);
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          action: 'resolve',
          explanation: explanation.trim(),
          correctiveAction: corrective.trim(),
        }),
      });
      setExplanation('');
      setCorrective('');
      setExpandedId(null);
      fetchAlerts();
    } catch {}
    setResolving(null);
  };

  const typeIcons: Record<string, string> = {
    'burnout-risk': '🧠',
    'high-screen-time': '🖥️',
    'consecutive-hard': '🔴',
    'no-breaks': '☕',
    'high-stress': '😰',
    'help-signal': '🆘',
    'high-debt': '📊',
  };

  const filteredAlerts = alerts;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            Alert Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Review and resolve burnout alerts with accountability</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
            {alerts.filter(a => a.status === 'pending').length} Pending
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg w-fit">
        {(['all', 'pending', 'acknowledged', 'resolved'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm rounded-md transition-all capitalize ${
              filter === f ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {filteredAlerts.map(alert => (
          <div
            key={alert.id}
            className={`glass-card overflow-hidden transition-all ${
              alert.status === 'pending' ? 'border-l-4 border-l-red-500' :
              alert.status === 'acknowledged' ? 'border-l-4 border-l-amber-500' :
              'border-l-4 border-l-green-500'
            }`}
          >
            <div className="p-5">
              <div className="flex items-start gap-4">
                <span className="text-2xl">{typeIcons[alert.type] || '⚠️'}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-white">{alert.message}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-semibold ${
                      alert.severity === 'high-risk' ? 'bg-red-500/20 text-red-400' :
                      alert.severity === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-semibold ${
                      alert.status === 'pending' ? 'bg-red-500/20 text-red-400' :
                      alert.status === 'acknowledged' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {alert.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{alert.details}</p>
                  <p className="text-xs text-slate-500">
                    <Clock size={10} className="inline mr-1" />
                    {new Date(alert.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {alert.status === 'pending' && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="px-3 py-1.5 text-xs bg-amber-600/80 hover:bg-amber-600 text-white rounded-lg transition-colors"
                    >
                      <Eye size={12} className="inline mr-1" /> Acknowledge
                    </button>
                  )}
                  {alert.status !== 'resolved' && (
                    <button
                      onClick={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
                      className="px-3 py-1.5 text-xs bg-brand-600/80 hover:bg-brand-600 text-white rounded-lg transition-colors flex items-center gap-1"
                    >
                      <FileText size={12} /> Resolve
                      {expandedId === alert.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Resolved Details */}
              {alert.status === 'resolved' && alert.tlExplanation && (
                <div className="mt-4 p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                  <h5 className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1">
                    <CheckCircle size={12} /> TL Resolution
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase mb-1">Explanation</p>
                      <p className="text-xs text-slate-300">{alert.tlExplanation}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase mb-1">Corrective Action</p>
                      <p className="text-xs text-slate-300">{alert.correctiveAction}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">
                    Resolved: {alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              )}
            </div>

            {/* Resolution Form */}
            {expandedId === alert.id && alert.status !== 'resolved' && (
              <div className="border-t border-slate-700/50 p-5 bg-slate-800/50">
                <h5 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brand-400" />
                  Mandatory TL Accountability Response
                </h5>
                <p className="text-xs text-slate-400 mb-4">
                  This response is permanently stored for accountability metrics.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                      Why was the workload high? (Required)
                    </label>
                    <textarea
                      rows={3}
                      value={explanation}
                      onChange={e => setExplanation(e.target.value)}
                      className="w-full input-dark text-sm resize-none"
                      placeholder="Provide a detailed explanation..."
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                      What corrective steps will be taken? (Required)
                    </label>
                    <textarea
                      rows={3}
                      value={corrective}
                      onChange={e => setCorrective(e.target.value)}
                      className="w-full input-dark text-sm resize-none"
                      placeholder="Describe the corrective measures..."
                      required
                    />
                  </div>
                  <button
                    onClick={() => handleResolve(alert.id)}
                    disabled={!explanation.trim() || !corrective.trim() || resolving === alert.id}
                    className="flex items-center gap-2 px-5 py-2 bg-green-600/80 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <Send size={14} /> {resolving === alert.id ? 'Submitting...' : 'Submit & Resolve'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredAlerts.length === 0 && (
          <div className="glass-card p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-500/30 mx-auto mb-3" />
            <p className="text-slate-400">No alerts found</p>
          </div>
        )}
      </div>
    </div>
  );
}
