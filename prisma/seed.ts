import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Helpers ───
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

async function main() {
  // Clear existing data in dependency order
  await prisma.messageRead.deleteMany();
  await prisma.message.deleteMany();
  await prisma.channelParticipant.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.burnoutDebtHistory.deleteMany();
  await prisma.burnoutDebtScore.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.helpSignal.deleteMany();
  await prisma.survey.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.workLog.deleteMany();
  await prisma.user.deleteMany();

  // ─── USERS ───
  const users = [
    { id: 'tl-001', name: 'Priya Sharma', email: 'priya@solutioners.io', role: 'leader' as const, avatar: 'PS', teamId: 'team-alpha', createdAt: new Date('2025-01-01T00:00:00Z') },
    { id: 'w-001', name: 'Arjun Mehta', email: 'arjun@solutioners.io', role: 'worker' as const, avatar: 'AM', teamId: 'team-alpha', createdAt: new Date('2025-01-01T00:00:00Z') },
    { id: 'w-002', name: 'Sneha Patel', email: 'sneha@solutioners.io', role: 'worker' as const, avatar: 'SP', teamId: 'team-alpha', createdAt: new Date('2025-01-01T00:00:00Z') },
    { id: 'w-003', name: 'Rahul Verma', email: 'rahul@solutioners.io', role: 'worker' as const, avatar: 'RV', teamId: 'team-alpha', createdAt: new Date('2025-01-01T00:00:00Z') },
    { id: 'w-004', name: 'Kavya Nair', email: 'kavya@solutioners.io', role: 'worker' as const, avatar: 'KN', teamId: 'team-alpha', createdAt: new Date('2025-01-01T00:00:00Z') },
    { id: 'w-005', name: 'Deepak Singh', email: 'deepak@solutioners.io', role: 'worker' as const, avatar: 'DS', teamId: 'team-alpha', createdAt: new Date('2025-01-01T00:00:00Z') },
  ];

  for (const u of users) {
    await prisma.user.create({ data: u });
  }

  const workerIds = ['w-001', 'w-002', 'w-003', 'w-004', 'w-005'];

  // ─── WORK LOGS (last 14 days) ───
  // Use a seeded random for reproducibility
  let seed = 42;
  function seededRandom(): number {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  interface WorkLogSeed {
    id: string;
    workerId: string;
    date: string;
    screenTimeHours: number;
    tasksCompleted: number;
    taskDescriptions: string[];
    breaksTaken: number;
    breakDurationMinutes: number;
    sessionStartTime: string;
    sessionEndTime: string;
    longestSessionMinutes: number;
    createdAt: Date;
  }

  const workLogs: WorkLogSeed[] = [];

  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    for (const wId of workerIds) {
      const dateStr = daysAgo(dayOffset);
      const dayOfWeek = new Date(dateStr).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      let screenTime = 6 + seededRandom() * 4;
      let longestSession = 60 + seededRandom() * 120;
      let breaks = Math.floor(seededRandom() * 5);

      if (wId === 'w-001') {
        screenTime = 8 + seededRandom() * 3;
        longestSession = 120 + seededRandom() * 60;
        breaks = Math.floor(seededRandom() * 2);
      }
      if (wId === 'w-004') {
        screenTime = 5 + seededRandom() * 2;
        longestSession = 50 + seededRandom() * 40;
        breaks = 3 + Math.floor(seededRandom() * 3);
      }

      workLogs.push({
        id: `wl-${wId}-${dayOffset}`,
        workerId: wId,
        date: dateStr,
        screenTimeHours: Math.round(screenTime * 10) / 10,
        tasksCompleted: Math.floor(2 + seededRandom() * 6),
        taskDescriptions: ['Feature development', 'Code review', 'Bug fixes'],
        breaksTaken: breaks,
        breakDurationMinutes: breaks * (10 + Math.floor(seededRandom() * 10)),
        sessionStartTime: '09:00',
        sessionEndTime: `${17 + Math.floor(screenTime - 8)}:${Math.floor(seededRandom() * 60).toString().padStart(2, '0')}`,
        longestSessionMinutes: Math.round(longestSession),
        createdAt: new Date(daysAgoISO(dayOffset)),
      });
    }
  }

  for (const log of workLogs) {
    await prisma.workLog.create({ data: log });
  }

  // ─── ASSIGNMENTS (last 14 days) ───
  const difficulties = ['easy', 'medium', 'hard'] as const;

  interface AssignmentSeed {
    id: string;
    workerId: string;
    assignedBy: string;
    date: string;
    difficulty: 'easy' | 'medium' | 'hard';
    taskTitle: string;
    taskDescription: string;
    recommendedDifficulty: 'easy' | 'medium' | 'hard' | null;
    wasOverride: boolean;
    overrideReason: string | null;
    createdAt: Date;
  }

  const assignments: AssignmentSeed[] = [];

  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    for (const wId of workerIds) {
      const dateStr = daysAgo(dayOffset);
      const dayOfWeek = new Date(dateStr).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      let diff: 'easy' | 'medium' | 'hard';
      let wasOverride = false;
      let overrideReason: string | null = null;

      if (wId === 'w-001') {
        diff = dayOffset < 4 ? 'hard' : difficulties[Math.floor(seededRandom() * 3)];
        if (dayOffset < 3) {
          wasOverride = true;
          overrideReason = 'Critical sprint deadline - client delivery';
        }
      } else if (wId === 'w-004') {
        diff = 'easy';
      } else {
        diff = difficulties[Math.floor(seededRandom() * 3)];
      }

      const recDiff = diff === 'hard' ? 'medium' : diff === 'easy' ? 'medium' : 'easy';

      assignments.push({
        id: `asgn-${wId}-${dayOffset}`,
        workerId: wId,
        assignedBy: 'tl-001',
        date: dateStr,
        difficulty: diff,
        taskTitle: `Sprint Task - Day ${14 - dayOffset}`,
        taskDescription: `Assigned ${diff} difficulty task for the day`,
        recommendedDifficulty: recDiff,
        wasOverride,
        overrideReason,
        createdAt: new Date(daysAgoISO(dayOffset)),
      });
    }
  }

  for (const a of assignments) {
    await prisma.assignment.create({ data: a });
  }

  // ─── SURVEYS (last 4 Fridays) ───
  for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
    const fridayOffset = weekOffset * 7 + ((new Date().getDay() + 2) % 7);
    for (const wId of workerIds) {
      let stress = 2 + Math.floor(seededRandom() * 2);
      let energy = 3 + Math.floor(seededRandom() * 2);
      let balance = 3 + Math.floor(seededRandom() * 2);

      if (wId === 'w-001') {
        stress = Math.min(5, 3 + weekOffset);
        energy = Math.max(1, 3 - weekOffset);
        balance = Math.max(1, 3 - weekOffset);
      }
      if (wId === 'w-004') {
        stress = 1 + Math.floor(seededRandom() * 1);
        energy = 4 + Math.floor(seededRandom() * 1);
        balance = 4 + Math.floor(seededRandom() * 1);
      }

      await prisma.survey.create({
        data: {
          id: `surv-${wId}-${weekOffset}`,
          workerId: wId,
          weekDate: daysAgo(fridayOffset),
          stressLevel: Math.min(5, Math.max(1, stress)),
          energyLevel: Math.min(5, Math.max(1, energy)),
          workLifeBalance: Math.min(5, Math.max(1, balance)),
          notes: wId === 'w-001' && weekOffset === 0 ? 'Feeling exhausted, too many deadlines' : '',
          createdAt: new Date(daysAgoISO(fridayOffset)),
        },
      });
    }
  }

  // ─── HELP SIGNALS ───
  await prisma.helpSignal.create({
    data: {
      id: 'hs-001',
      workerId: 'w-001',
      message: 'I feel overloaded',
      timestamp: new Date(daysAgoISO(1)),
      readByLeader: false,
      readAt: null,
    },
  });

  // ─── ALERTS ───
  await prisma.alert.create({
    data: {
      id: 'alert-001',
      workerId: 'w-001',
      type: 'consecutive_hard',
      severity: 'high_risk',
      message: 'Arjun Mehta has been assigned Hard difficulty for 3 consecutive days',
      details: 'Consecutive hard assignments detected. Worker may be at risk of burnout.',
      status: 'pending',
      createdAt: new Date(daysAgoISO(0)),
    },
  });

  await prisma.alert.create({
    data: {
      id: 'alert-002',
      workerId: 'w-001',
      type: 'high_screen_time',
      severity: 'warning',
      message: 'Arjun Mehta averaged 9.5+ hours screen time this week',
      details: 'Screen time consistently exceeds 8 hours. Risk of fatigue and burnout.',
      status: 'pending',
      createdAt: new Date(daysAgoISO(1)),
    },
  });

  await prisma.alert.create({
    data: {
      id: 'alert-003',
      workerId: 'w-001',
      type: 'help_signal',
      severity: 'high_risk',
      message: 'Arjun Mehta sent a silent help signal',
      details: 'Worker pressed the "I feel overloaded" button. Immediate attention required.',
      status: 'pending',
      createdAt: new Date(daysAgoISO(1)),
    },
  });

  await prisma.alert.create({
    data: {
      id: 'alert-004',
      workerId: 'w-003',
      type: 'no_breaks',
      severity: 'warning',
      message: 'Rahul Verma worked 3+ hours without a break today',
      details: 'Long session without breaks detected. Recommend enforcing break schedule.',
      status: 'acknowledged',
      createdAt: new Date(daysAgoISO(2)),
      acknowledgedAt: new Date(daysAgoISO(2)),
      tlExplanation: 'Rahul was in a deep focus coding session. Will ensure breaks tomorrow.',
      correctiveAction: 'Scheduled mandatory 15-min break reminders.',
    },
  });

  // ─── CHANNELS ───
  const allUserIds = ['tl-001', 'w-001', 'w-002', 'w-003', 'w-004', 'w-005'];

  await prisma.channel.create({
    data: {
      id: 'ch-team-alpha',
      name: 'Team Alpha',
      type: 'team',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      lastMessageAt: new Date(daysAgoISO(0)),
      participants: {
        create: allUserIds.map(uid => ({ userId: uid })),
      },
    },
  });

  await prisma.channel.create({
    data: {
      id: 'ch-announcements',
      name: 'Announcements',
      type: 'announcement',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      lastMessageAt: new Date(daysAgoISO(1)),
      participants: {
        create: allUserIds.map(uid => ({ userId: uid })),
      },
    },
  });

  await prisma.channel.create({
    data: {
      id: 'ch-dm-tl-w001',
      name: 'Priya ↔ Arjun',
      type: 'direct',
      createdAt: new Date('2025-01-15T00:00:00Z'),
      lastMessageAt: new Date(daysAgoISO(0)),
      participants: {
        create: [{ userId: 'tl-001' }, { userId: 'w-001' }],
      },
    },
  });

  await prisma.channel.create({
    data: {
      id: 'ch-dm-tl-w002',
      name: 'Priya ↔ Sneha',
      type: 'direct',
      createdAt: new Date('2025-01-15T00:00:00Z'),
      lastMessageAt: new Date(daysAgoISO(2)),
      participants: {
        create: [{ userId: 'tl-001' }, { userId: 'w-002' }],
      },
    },
  });

  // ─── MESSAGES ───
  await prisma.message.create({
    data: {
      id: 'msg-001',
      channelId: 'ch-team-alpha',
      senderId: 'tl-001',
      content: 'Good morning team! Please update your daily work logs by EOD.',
      timestamp: new Date(daysAgoISO(0)),
      readBy: { create: [{ userId: 'tl-001' }] },
    },
  });

  await prisma.message.create({
    data: {
      id: 'msg-002',
      channelId: 'ch-team-alpha',
      senderId: 'w-002',
      content: 'Will do! Working on the API integration today.',
      timestamp: new Date(daysAgoISO(0)),
      readBy: { create: [{ userId: 'w-002' }, { userId: 'tl-001' }] },
    },
  });

  await prisma.message.create({
    data: {
      id: 'msg-003',
      channelId: 'ch-announcements',
      senderId: 'tl-001',
      content: 'Reminder: Friday wellness survey is due this week. Please take 2 minutes to fill it out.',
      timestamp: new Date(daysAgoISO(1)),
      readBy: { create: [{ userId: 'tl-001' }, { userId: 'w-002' }, { userId: 'w-004' }] },
    },
  });

  await prisma.message.create({
    data: {
      id: 'msg-004',
      channelId: 'ch-dm-tl-w001',
      senderId: 'tl-001',
      content: 'Hi Arjun, I noticed your hours have been high lately. How are you doing?',
      timestamp: new Date(daysAgoISO(0)),
      readBy: { create: [{ userId: 'tl-001' }] },
    },
  });

  await prisma.message.create({
    data: {
      id: 'msg-005',
      channelId: 'ch-dm-tl-w001',
      senderId: 'w-001',
      content: 'Thanks for checking in. I have been feeling a bit overwhelmed with the sprint deadlines.',
      timestamp: new Date(daysAgoISO(0)),
      readBy: { create: [{ userId: 'w-001' }] },
    },
  });

  // ─── BURNOUT DEBT SCORES ───
  for (const wId of workerIds) {
    const history: { date: string; score: number }[] = [];
    let score = wId === 'w-001' ? 35 : wId === 'w-003' ? 20 : 10;

    for (let i = 13; i >= 0; i--) {
      const dateStr = daysAgo(i);
      const dayOfWeek = new Date(dateStr).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        score = Math.max(0, score - 5);
        continue;
      }

      const asgn = assignments.find(a => a.workerId === wId && a.date === dateStr);
      if (asgn) {
        if (asgn.difficulty === 'hard') score = Math.min(100, score + 8);
        else if (asgn.difficulty === 'medium') score = Math.min(100, score + 3);
        else score = Math.max(0, score - 5);
      }

      const log = workLogs.find(l => l.workerId === wId && l.date === dateStr);
      if (log) {
        if (log.screenTimeHours > 9) score = Math.min(100, score + 5);
        if (log.breaksTaken >= 3) score = Math.max(0, score - 3);
        if (log.longestSessionMinutes > 120) score = Math.min(100, score + 4);
      }

      history.push({ date: dateStr, score: Math.round(score) });
    }

    const trend = wId === 'w-001' ? 'increasing' : wId === 'w-004' ? 'decreasing' : 'stable';

    await prisma.burnoutDebtScore.create({
      data: {
        workerId: wId,
        currentDebt: Math.round(score),
        trend: trend as 'increasing' | 'decreasing' | 'stable',
        lastUpdated: new Date(),
        history: {
          create: history.map(h => ({
            date: h.date,
            score: h.score,
          })),
        },
      },
    });
  }

  console.log('Seed data inserted successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
