// ─── Core Types for Burnout Shield ───

export type Role = 'worker' | 'leader';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type RiskLevel = 'safe' | 'warning' | 'high-risk';
export type AlertStatus = 'pending' | 'acknowledged' | 'resolved';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  teamId: string;
  createdAt: string;
}

export interface WorkLog {
  id: string;
  workerId: string;
  date: string; // YYYY-MM-DD
  screenTimeHours: number;
  tasksCompleted: number;
  taskDescriptions: string[];
  breaksTaken: number;
  breakDurationMinutes: number;
  sessionStartTime: string;
  sessionEndTime: string;
  longestSessionMinutes: number;
  createdAt: string;
}

export interface Assignment {
  id: string;
  workerId: string;
  assignedBy: string; // leader ID
  date: string; // YYYY-MM-DD
  difficulty: Difficulty;
  taskTitle: string;
  taskDescription: string;
  recommendedDifficulty: Difficulty | null;
  wasOverride: boolean;
  overrideReason: string | null;
  createdAt: string;
}

export interface Survey {
  id: string;
  workerId: string;
  weekDate: string; // Friday date YYYY-MM-DD
  stressLevel: number; // 1-5
  energyLevel: number; // 1-5
  workLifeBalance: number; // 1-5
  notes: string;
  createdAt: string;
}

export interface HelpSignal {
  id: string;
  workerId: string;
  message: string;
  timestamp: string;
  readByLeader: boolean;
  readAt: string | null;
}

export interface Alert {
  id: string;
  workerId: string;
  type: 'burnout-risk' | 'high-screen-time' | 'consecutive-hard' | 'no-breaks' | 'high-stress' | 'help-signal' | 'high-debt';
  severity: RiskLevel;
  message: string;
  details: string;
  status: AlertStatus;
  createdAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  tlExplanation: string | null;
  correctiveAction: string | null;
}

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  timestamp: string;
  readBy: string[];
}

export interface Channel {
  id: string;
  name: string;
  type: 'direct' | 'team' | 'announcement';
  participants: string[];
  createdAt: string;
  lastMessageAt: string;
}

// ─── Computed / Derived Types ───

export interface BurnoutDebtScore {
  workerId: string;
  currentDebt: number; // 0-100
  trend: 'increasing' | 'decreasing' | 'stable';
  history: { date: string; score: number }[];
  lastUpdated: string;
}

export interface WorkerHealthStatus {
  workerId: string;
  workerName: string;
  riskLevel: RiskLevel;
  burnoutDebt: number;
  avgStress: number;
  avgEnergy: number;
  recentDifficulties: Difficulty[];
  activeAlerts: number;
  lastHelpSignal: string | null;
}

export interface TLAccountabilityIndex {
  leaderId: string;
  fairnessScore: number; // 0-100
  consecutiveHardAssignments: { workerId: string; count: number }[];
  overrideCount: number;
  totalAssignments: number;
  ignoredRecommendations: number;
  unresolvedAlerts: number;
  history: { date: string; score: number }[];
}

export interface WorkloadRecommendation {
  workerId: string;
  recommendedDifficulty: Difficulty;
  reasoning: string;
  factors: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface TimerSession {
  startTime: number;
  elapsed: number;
  isRunning: boolean;
  breaks: { start: number; end: number | null }[];
}
