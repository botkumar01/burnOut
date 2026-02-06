// ─── Database Access Layer ───
// Mirrors store.ts interface but uses Prisma. All methods return Promises.

import { prisma } from './prisma';
import type {
  User, WorkLog, Assignment, Survey, HelpSignal, Alert, Message, Channel, BurnoutDebtScore,
} from './types';
import type { AlertType, Severity, AlertStatus as PrismaAlertStatus } from '@prisma/client';

// ─── Enum Mapping (DB underscores ↔ App hyphens) ───

const alertTypeToApp: Record<AlertType, Alert['type']> = {
  burnout_risk: 'burnout-risk',
  high_screen_time: 'high-screen-time',
  consecutive_hard: 'consecutive-hard',
  no_breaks: 'no-breaks',
  high_stress: 'high-stress',
  help_signal: 'help-signal',
  high_debt: 'high-debt',
};

const alertTypeToDb: Record<Alert['type'], AlertType> = {
  'burnout-risk': 'burnout_risk',
  'high-screen-time': 'high_screen_time',
  'consecutive-hard': 'consecutive_hard',
  'no-breaks': 'no_breaks',
  'high-stress': 'high_stress',
  'help-signal': 'help_signal',
  'high-debt': 'high_debt',
};

const severityToApp: Record<Severity, Alert['severity']> = {
  safe: 'safe',
  warning: 'warning',
  high_risk: 'high-risk',
};

const severityToDb: Record<Alert['severity'], Severity> = {
  'safe': 'safe',
  'warning': 'warning',
  'high-risk': 'high_risk',
};

const alertStatusToApp: Record<PrismaAlertStatus, Alert['status']> = {
  pending: 'pending',
  acknowledged: 'acknowledged',
  resolved: 'resolved',
};

// ─── Row Mappers ───

function mapUser(row: { id: string; name: string; email: string; role: string; avatar: string; teamId: string; createdAt: Date }): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as User['role'],
    avatar: row.avatar,
    teamId: row.teamId,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapWorkLog(row: {
  id: string; workerId: string; date: string; screenTimeHours: number; tasksCompleted: number;
  taskDescriptions: string[]; breaksTaken: number; breakDurationMinutes: number;
  sessionStartTime: string; sessionEndTime: string; longestSessionMinutes: number; createdAt: Date;
}): WorkLog {
  return {
    id: row.id,
    workerId: row.workerId,
    date: row.date,
    screenTimeHours: row.screenTimeHours,
    tasksCompleted: row.tasksCompleted,
    taskDescriptions: row.taskDescriptions,
    breaksTaken: row.breaksTaken,
    breakDurationMinutes: row.breakDurationMinutes,
    sessionStartTime: row.sessionStartTime,
    sessionEndTime: row.sessionEndTime,
    longestSessionMinutes: row.longestSessionMinutes,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapAssignment(row: {
  id: string; workerId: string; assignedBy: string; date: string; difficulty: string;
  taskTitle: string; taskDescription: string; recommendedDifficulty: string | null;
  wasOverride: boolean; overrideReason: string | null; createdAt: Date;
}): Assignment {
  return {
    id: row.id,
    workerId: row.workerId,
    assignedBy: row.assignedBy,
    date: row.date,
    difficulty: row.difficulty as Assignment['difficulty'],
    taskTitle: row.taskTitle,
    taskDescription: row.taskDescription,
    recommendedDifficulty: row.recommendedDifficulty as Assignment['recommendedDifficulty'],
    wasOverride: row.wasOverride,
    overrideReason: row.overrideReason,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapSurvey(row: {
  id: string; workerId: string; weekDate: string; stressLevel: number;
  energyLevel: number; workLifeBalance: number; notes: string; createdAt: Date;
}): Survey {
  return {
    id: row.id,
    workerId: row.workerId,
    weekDate: row.weekDate,
    stressLevel: row.stressLevel,
    energyLevel: row.energyLevel,
    workLifeBalance: row.workLifeBalance,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapHelpSignal(row: {
  id: string; workerId: string; message: string; timestamp: Date;
  readByLeader: boolean; readAt: Date | null;
}): HelpSignal {
  return {
    id: row.id,
    workerId: row.workerId,
    message: row.message,
    timestamp: row.timestamp.toISOString(),
    readByLeader: row.readByLeader,
    readAt: row.readAt ? row.readAt.toISOString() : null,
  };
}

function mapAlert(row: {
  id: string; workerId: string; type: AlertType; severity: Severity; message: string;
  details: string; status: PrismaAlertStatus; createdAt: Date; acknowledgedAt: Date | null;
  resolvedAt: Date | null; tlExplanation: string | null; correctiveAction: string | null;
}): Alert {
  return {
    id: row.id,
    workerId: row.workerId,
    type: alertTypeToApp[row.type],
    severity: severityToApp[row.severity],
    message: row.message,
    details: row.details,
    status: alertStatusToApp[row.status],
    createdAt: row.createdAt.toISOString(),
    acknowledgedAt: row.acknowledgedAt ? row.acknowledgedAt.toISOString() : null,
    resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
    tlExplanation: row.tlExplanation,
    correctiveAction: row.correctiveAction,
  };
}

function mapChannel(row: {
  id: string; name: string; type: string; createdAt: Date; lastMessageAt: Date;
  participants: { userId: string }[];
}): Channel {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Channel['type'],
    participants: row.participants.map(p => p.userId),
    createdAt: row.createdAt.toISOString(),
    lastMessageAt: row.lastMessageAt.toISOString(),
  };
}

function mapMessage(row: {
  id: string; channelId: string; senderId: string; content: string; timestamp: Date;
  readBy: { userId: string }[];
}): Message {
  return {
    id: row.id,
    channelId: row.channelId,
    senderId: row.senderId,
    content: row.content,
    timestamp: row.timestamp.toISOString(),
    readBy: row.readBy.map(r => r.userId),
  };
}

function mapBurnoutDebt(row: {
  workerId: string; currentDebt: number; trend: string; lastUpdated: Date;
  history: { date: string; score: number }[];
}): BurnoutDebtScore {
  return {
    workerId: row.workerId,
    currentDebt: row.currentDebt,
    trend: row.trend as BurnoutDebtScore['trend'],
    history: row.history.map(h => ({ date: h.date, score: h.score })),
    lastUpdated: row.lastUpdated.toISOString(),
  };
}

// ─── Database Access Object ───

export const db = {
  // ─── Users ───
  getUsers: async (): Promise<User[]> => {
    const rows = await prisma.user.findMany();
    return rows.map(mapUser);
  },

  getUser: async (id: string): Promise<User | null> => {
    const row = await prisma.user.findUnique({ where: { id } });
    return row ? mapUser(row) : null;
  },

  getUsersByRole: async (role: 'worker' | 'leader'): Promise<User[]> => {
    const rows = await prisma.user.findMany({ where: { role } });
    return rows.map(mapUser);
  },

  getUsersByTeam: async (teamId: string): Promise<User[]> => {
    const rows = await prisma.user.findMany({ where: { teamId } });
    return rows.map(mapUser);
  },

  // ─── Work Logs ───
  getWorkLogs: async (): Promise<WorkLog[]> => {
    const rows = await prisma.workLog.findMany();
    return rows.map(mapWorkLog);
  },

  getWorkLogsByWorker: async (workerId: string): Promise<WorkLog[]> => {
    const rows = await prisma.workLog.findMany({
      where: { workerId },
      orderBy: { date: 'desc' },
    });
    return rows.map(mapWorkLog);
  },

  getWorkLogByDate: async (workerId: string, date: string): Promise<WorkLog | null> => {
    const row = await prisma.workLog.findUnique({
      where: { workerId_date: { workerId, date } },
    });
    return row ? mapWorkLog(row) : null;
  },

  addWorkLog: async (log: WorkLog): Promise<WorkLog> => {
    const row = await prisma.workLog.create({
      data: {
        id: log.id,
        workerId: log.workerId,
        date: log.date,
        screenTimeHours: log.screenTimeHours,
        tasksCompleted: log.tasksCompleted,
        taskDescriptions: log.taskDescriptions,
        breaksTaken: log.breaksTaken,
        breakDurationMinutes: log.breakDurationMinutes,
        sessionStartTime: log.sessionStartTime,
        sessionEndTime: log.sessionEndTime,
        longestSessionMinutes: log.longestSessionMinutes,
        createdAt: new Date(log.createdAt),
      },
    });
    return mapWorkLog(row);
  },

  // ─── Assignments ───
  getAssignments: async (): Promise<Assignment[]> => {
    const rows = await prisma.assignment.findMany();
    return rows.map(mapAssignment);
  },

  getAssignmentsByWorker: async (workerId: string): Promise<Assignment[]> => {
    const rows = await prisma.assignment.findMany({
      where: { workerId },
      orderBy: { date: 'desc' },
    });
    return rows.map(mapAssignment);
  },

  getAssignmentByDate: async (workerId: string, date: string): Promise<Assignment | null> => {
    const row = await prisma.assignment.findUnique({
      where: { workerId_date: { workerId, date } },
    });
    return row ? mapAssignment(row) : null;
  },

  addAssignment: async (a: Assignment): Promise<Assignment> => {
    const row = await prisma.assignment.create({
      data: {
        id: a.id,
        workerId: a.workerId,
        assignedBy: a.assignedBy,
        date: a.date,
        difficulty: a.difficulty,
        taskTitle: a.taskTitle,
        taskDescription: a.taskDescription,
        recommendedDifficulty: a.recommendedDifficulty,
        wasOverride: a.wasOverride,
        overrideReason: a.overrideReason,
        createdAt: new Date(a.createdAt),
      },
    });
    return mapAssignment(row);
  },

  // ─── Surveys ───
  getSurveys: async (): Promise<Survey[]> => {
    const rows = await prisma.survey.findMany();
    return rows.map(mapSurvey);
  },

  getSurveysByWorker: async (workerId: string): Promise<Survey[]> => {
    const rows = await prisma.survey.findMany({
      where: { workerId },
      orderBy: { weekDate: 'desc' },
    });
    return rows.map(mapSurvey);
  },

  addSurvey: async (s: Survey): Promise<Survey> => {
    const row = await prisma.survey.create({
      data: {
        id: s.id,
        workerId: s.workerId,
        weekDate: s.weekDate,
        stressLevel: s.stressLevel,
        energyLevel: s.energyLevel,
        workLifeBalance: s.workLifeBalance,
        notes: s.notes,
        createdAt: new Date(s.createdAt),
      },
    });
    return mapSurvey(row);
  },

  // ─── Help Signals ───
  getHelpSignals: async (): Promise<HelpSignal[]> => {
    const rows = await prisma.helpSignal.findMany();
    return rows.map(mapHelpSignal);
  },

  getHelpSignalsByWorker: async (workerId: string): Promise<HelpSignal[]> => {
    const rows = await prisma.helpSignal.findMany({ where: { workerId } });
    return rows.map(mapHelpSignal);
  },

  addHelpSignal: async (h: HelpSignal): Promise<HelpSignal> => {
    const row = await prisma.helpSignal.create({
      data: {
        id: h.id,
        workerId: h.workerId,
        message: h.message,
        timestamp: new Date(h.timestamp),
        readByLeader: h.readByLeader,
        readAt: h.readAt ? new Date(h.readAt) : null,
      },
    });
    return mapHelpSignal(row);
  },

  markHelpSignalRead: async (id: string): Promise<HelpSignal | null> => {
    try {
      const row = await prisma.helpSignal.update({
        where: { id },
        data: { readByLeader: true, readAt: new Date() },
      });
      return mapHelpSignal(row);
    } catch {
      return null;
    }
  },

  // ─── Alerts ───
  getAlerts: async (): Promise<Alert[]> => {
    const rows = await prisma.alert.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(mapAlert);
  },

  getAlertsByWorker: async (workerId: string): Promise<Alert[]> => {
    const rows = await prisma.alert.findMany({ where: { workerId } });
    return rows.map(mapAlert);
  },

  getPendingAlerts: async (): Promise<Alert[]> => {
    const rows = await prisma.alert.findMany({ where: { status: 'pending' } });
    return rows.map(mapAlert);
  },

  addAlert: async (a: Omit<Alert, 'id'>): Promise<Alert> => {
    const row = await prisma.alert.create({
      data: {
        workerId: a.workerId,
        type: alertTypeToDb[a.type],
        severity: severityToDb[a.severity],
        message: a.message,
        details: a.details,
        status: a.status as PrismaAlertStatus,
        createdAt: new Date(a.createdAt),
        acknowledgedAt: a.acknowledgedAt ? new Date(a.acknowledgedAt) : null,
        resolvedAt: a.resolvedAt ? new Date(a.resolvedAt) : null,
        tlExplanation: a.tlExplanation,
        correctiveAction: a.correctiveAction,
      },
    });
    return mapAlert(row);
  },

  resolveAlert: async (id: string, explanation: string, corrective: string): Promise<Alert | null> => {
    try {
      const row = await prisma.alert.update({
        where: { id },
        data: {
          status: 'resolved',
          resolvedAt: new Date(),
          tlExplanation: explanation,
          correctiveAction: corrective,
        },
      });
      return mapAlert(row);
    } catch {
      return null;
    }
  },

  acknowledgeAlert: async (id: string): Promise<Alert | null> => {
    try {
      const row = await prisma.alert.update({
        where: { id },
        data: { status: 'acknowledged', acknowledgedAt: new Date() },
      });
      return mapAlert(row);
    } catch {
      return null;
    }
  },

  // ─── Channels & Messages ───
  getChannels: async (): Promise<Channel[]> => {
    const rows = await prisma.channel.findMany({
      include: { participants: true },
    });
    return rows.map(mapChannel);
  },

  getChannelsByUser: async (userId: string): Promise<Channel[]> => {
    const rows = await prisma.channel.findMany({
      where: { participants: { some: { userId } } },
      include: { participants: true },
    });
    return rows.map(mapChannel);
  },

  getChannel: async (id: string): Promise<Channel | null> => {
    const row = await prisma.channel.findUnique({
      where: { id },
      include: { participants: true },
    });
    return row ? mapChannel(row) : null;
  },

  getMessages: async (channelId: string): Promise<Message[]> => {
    const rows = await prisma.message.findMany({
      where: { channelId },
      include: { readBy: true },
      orderBy: { timestamp: 'asc' },
    });
    return rows.map(mapMessage);
  },

  addMessage: async (m: Omit<Message, 'id'>): Promise<Message> => {
    const row = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          channelId: m.channelId,
          senderId: m.senderId,
          content: m.content,
          timestamp: new Date(m.timestamp),
          readBy: {
            create: m.readBy.map(uid => ({ userId: uid })),
          },
        },
        include: { readBy: true },
      });
      await tx.channel.update({
        where: { id: m.channelId },
        data: { lastMessageAt: new Date(m.timestamp) },
      });
      return msg;
    });
    return mapMessage(row);
  },

  addChannel: async (c: Channel): Promise<Channel> => {
    const row = await prisma.channel.create({
      data: {
        id: c.id,
        name: c.name,
        type: c.type as 'direct' | 'team' | 'announcement',
        createdAt: new Date(c.createdAt),
        lastMessageAt: new Date(c.lastMessageAt),
        participants: {
          create: c.participants.map(uid => ({ userId: uid })),
        },
      },
      include: { participants: true },
    });
    return mapChannel(row);
  },

  // ─── Burnout Debt ───
  getBurnoutDebts: async (): Promise<BurnoutDebtScore[]> => {
    const rows = await prisma.burnoutDebtScore.findMany({
      include: { history: { orderBy: { date: 'asc' } } },
    });
    return rows.map(mapBurnoutDebt);
  },

  getBurnoutDebt: async (workerId: string): Promise<BurnoutDebtScore | null> => {
    const row = await prisma.burnoutDebtScore.findUnique({
      where: { workerId },
      include: { history: { orderBy: { date: 'asc' } } },
    });
    return row ? mapBurnoutDebt(row) : null;
  },

  updateBurnoutDebt: async (workerId: string, delta: number): Promise<BurnoutDebtScore | null> => {
    const existing = await prisma.burnoutDebtScore.findUnique({
      where: { workerId },
      include: { history: { orderBy: { date: 'asc' } } },
    });
    if (!existing) return null;

    const newDebt = Math.max(0, Math.min(100, existing.currentDebt + delta));
    const today = new Date().toISOString().split('T')[0];
    const trend = delta > 0 ? 'increasing' : delta < 0 ? 'decreasing' : 'stable';

    // Upsert today's history entry
    await prisma.burnoutDebtHistory.upsert({
      where: { workerId_date: { workerId, date: today } },
      update: { score: newDebt },
      create: { workerId, date: today, score: newDebt },
    });

    const row = await prisma.burnoutDebtScore.update({
      where: { workerId },
      data: {
        currentDebt: newDebt,
        trend: trend as 'increasing' | 'decreasing' | 'stable',
        lastUpdated: new Date(),
      },
      include: { history: { orderBy: { date: 'asc' } } },
    });

    return mapBurnoutDebt(row);
  },
};
