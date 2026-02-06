'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  MessageSquare,
  AlertTriangle,
  Users,
  FileText,
  Shield,
  LogOut,
  Brain,
  Clock,
  Heart,
  UserCheck,
  Activity,
} from 'lucide-react';

const workerNav = [
  { href: '/worker/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/worker/log', label: 'Daily Work Log', icon: ClipboardList },
  { href: '/worker/survey', label: 'Wellness Survey', icon: Heart },
  { href: '/worker/messages', label: 'Messages', icon: MessageSquare },
];

const leaderNav = [
  { href: '/leader/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leader/assign', label: 'Work Assignment', icon: Users },
  { href: '/leader/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/leader/alerts', label: 'Alerts', icon: AlertTriangle },
  { href: '/leader/surveys', label: 'Survey Monitor', icon: Activity },
  { href: '/leader/accountability', label: 'Accountability', icon: UserCheck },
  { href: '/leader/messages', label: 'Messages', icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  const navItems = user.role === 'leader' ? leaderNav : workerNav;

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-slate-800/95 backdrop-blur-sm border-r border-slate-700/50 flex flex-col z-40">
      {/* Logo */}
      <div className="p-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">BurnoutShield</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">by Solutioners</p>
          </div>
        </div>
      </div>

      {/* Role Badge */}
      <div className="px-5 pt-4 pb-2">
        <span className={clsx(
          'text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded-full',
          user.role === 'leader'
            ? 'bg-amber-500/20 text-amber-400'
            : 'bg-brand-500/20 text-brand-400'
        )}>
          {user.role === 'leader' ? 'Team Leader' : 'Worker'}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              )}
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
            {user.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
