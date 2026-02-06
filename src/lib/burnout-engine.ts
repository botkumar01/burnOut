// ─── Burnout Early Warning Engine ───
// Rule-based + Score-based burnout detection system

import { db } from './db';
import { Alert, RiskLevel } from './types';

interface RiskFactors {
  screenTimeExcess: boolean;
  consecutiveHardDays: number;
  longSessionsNoBreaks: boolean;
  highStressScore: boolean;
  helpSignalSent: boolean;
  highBurnoutDebt: boolean;
  lowEnergyScore: boolean;
  poorWorkLifeBalance: boolean;
}

export async function analyzeWorkerRisk(workerId: string): Promise<{
  riskLevel: RiskLevel;
  score: number;
  factors: RiskFactors;
  alerts: Omit<Alert, 'id'>[];
}> {
  const logs = (await db.getWorkLogsByWorker(workerId)).slice(0, 7); // last 7 logs
  const assignments = (await db.getAssignmentsByWorker(workerId)).slice(0, 7);
  const surveys = (await db.getSurveysByWorker(workerId)).slice(0, 4);
  const helpSignals = await db.getHelpSignalsByWorker(workerId);
  const debt = await db.getBurnoutDebt(workerId);

  let riskScore = 0;
  const newAlerts: Omit<Alert, 'id'>[] = [];

  // ─── Factor 1: Screen Time > 8 hours ───
  const recentLogs = logs.slice(0, 3);
  const avgScreenTime = recentLogs.length > 0
    ? recentLogs.reduce((sum, l) => sum + l.screenTimeHours, 0) / recentLogs.length
    : 0;
  const screenTimeExcess = avgScreenTime > 8;
  if (screenTimeExcess) {
    riskScore += 20;
  }

  // ─── Factor 2: Consecutive Hard Days ───
  let consecutiveHardDays = 0;
  for (const a of assignments) {
    if (a.difficulty === 'hard') consecutiveHardDays++;
    else break;
  }
  if (consecutiveHardDays >= 2) {
    riskScore += consecutiveHardDays * 10;
    if (consecutiveHardDays >= 2) {
      newAlerts.push({
        workerId,
        type: 'consecutive-hard',
        severity: consecutiveHardDays >= 3 ? 'high-risk' : 'warning',
        message: `Worker assigned Hard difficulty for ${consecutiveHardDays} consecutive days`,
        details: `Consecutive hard assignments detected. Burnout risk escalating.`,
        status: 'pending',
        createdAt: new Date().toISOString(),
        acknowledgedAt: null,
        resolvedAt: null,
        tlExplanation: null,
        correctiveAction: null,
      });
    }
  }

  // ─── Factor 3: Long Sessions Without Breaks ───
  const longSessionsNoBreaks = recentLogs.some(
    l => l.longestSessionMinutes > 120 && l.breaksTaken < 2
  );
  if (longSessionsNoBreaks) {
    riskScore += 15;
  }

  // ─── Factor 4: High Stress Survey Scores ───
  const latestSurvey = surveys[0];
  const highStressScore = latestSurvey ? latestSurvey.stressLevel >= 4 : false;
  if (highStressScore) {
    riskScore += 20;
  }

  // ─── Factor 5: Low Energy Score ───
  const lowEnergyScore = latestSurvey ? latestSurvey.energyLevel <= 2 : false;
  if (lowEnergyScore) {
    riskScore += 10;
  }

  // ─── Factor 6: Poor Work-Life Balance ───
  const poorWorkLifeBalance = latestSurvey ? latestSurvey.workLifeBalance <= 2 : false;
  if (poorWorkLifeBalance) {
    riskScore += 10;
  }

  // ─── Factor 7: Silent Help Signal ───
  const recentHelp = helpSignals.filter(h => {
    const ts = new Date(h.timestamp).getTime();
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    return ts > threeDaysAgo;
  });
  const helpSignalSent = recentHelp.length > 0;
  if (helpSignalSent) {
    riskScore += 25;
  }

  // ─── Factor 8: High Burnout Debt ───
  const highBurnoutDebt = debt ? debt.currentDebt > 60 : false;
  if (highBurnoutDebt) {
    riskScore += 15;
  }

  // ─── Determine Risk Level ───
  const score = Math.min(100, riskScore);
  let riskLevel: RiskLevel;
  if (score >= 50) riskLevel = 'high-risk';
  else if (score >= 25) riskLevel = 'warning';
  else riskLevel = 'safe';

  return {
    riskLevel,
    score,
    factors: {
      screenTimeExcess,
      consecutiveHardDays,
      longSessionsNoBreaks,
      highStressScore,
      helpSignalSent,
      highBurnoutDebt,
      lowEnergyScore,
      poorWorkLifeBalance,
    },
    alerts: newAlerts,
  };
}

export async function getWorkerHealthStatus(workerId: string) {
  const user = await db.getUser(workerId);
  if (!user) return null;

  const { riskLevel, score, factors } = await analyzeWorkerRisk(workerId);
  const debt = await db.getBurnoutDebt(workerId);
  const surveys = await db.getSurveysByWorker(workerId);
  const assignments = (await db.getAssignmentsByWorker(workerId)).slice(0, 5);
  const activeAlerts = (await db.getAlertsByWorker(workerId)).filter(a => a.status === 'pending').length;
  const helpSignals = await db.getHelpSignalsByWorker(workerId);

  return {
    workerId,
    workerName: user.name,
    riskLevel,
    riskScore: score,
    burnoutDebt: debt?.currentDebt || 0,
    avgStress: surveys.length > 0
      ? Math.round((surveys.slice(0, 4).reduce((s, sv) => s + sv.stressLevel, 0) / Math.min(4, surveys.length)) * 10) / 10
      : 0,
    avgEnergy: surveys.length > 0
      ? Math.round((surveys.slice(0, 4).reduce((s, sv) => s + sv.energyLevel, 0) / Math.min(4, surveys.length)) * 10) / 10
      : 0,
    recentDifficulties: assignments.map(a => a.difficulty),
    activeAlerts,
    lastHelpSignal: helpSignals.length > 0 ? helpSignals[helpSignals.length - 1].timestamp : null,
    factors,
  };
}

export async function computeTLAccountabilityIndex(leaderId: string) {
  const allAssignments = (await db.getAssignments()).filter(a => a.assignedBy === leaderId);
  const workers = await db.getUsersByRole('worker');
  const pendingAlerts = await db.getPendingAlerts();

  // Track consecutive hard per worker
  const consecutiveHardAssignments: { workerId: string; workerName: string; count: number }[] = [];
  for (const w of workers) {
    const workerAssignments = allAssignments
      .filter(a => a.workerId === w.id)
      .sort((a, b) => b.date.localeCompare(a.date));
    let count = 0;
    for (const a of workerAssignments) {
      if (a.difficulty === 'hard') count++;
      else break;
    }
    if (count > 0) {
      consecutiveHardAssignments.push({ workerId: w.id, workerName: w.name, count });
    }
  }

  // Override metrics
  const overrideCount = allAssignments.filter(a => a.wasOverride).length;
  const totalAssignments = allAssignments.length;
  const ignoredRecommendations = allAssignments.filter(
    a => a.recommendedDifficulty && a.difficulty !== a.recommendedDifficulty && !a.wasOverride
  ).length;

  // Compute fairness score (100 = perfectly fair)
  let fairnessScore = 100;
  const maxConsecutive = Math.max(...consecutiveHardAssignments.map(c => c.count), 0);
  fairnessScore -= maxConsecutive * 10;
  fairnessScore -= (overrideCount / Math.max(1, totalAssignments)) * 30;
  fairnessScore -= pendingAlerts.length * 5;
  fairnessScore = Math.max(0, Math.min(100, Math.round(fairnessScore)));

  // Generate history (last 14 days)
  const history: { date: string; score: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayAssignments = allAssignments.filter(a => a.date === dateStr);
    const hardCount = dayAssignments.filter(a => a.difficulty === 'hard').length;
    const dayScore = Math.max(0, 100 - hardCount * 15 - (dayAssignments.filter(a => a.wasOverride).length * 10));
    history.push({ date: dateStr, score: dayScore });
  }

  return {
    leaderId,
    fairnessScore,
    consecutiveHardAssignments,
    overrideCount,
    totalAssignments,
    ignoredRecommendations,
    unresolvedAlerts: pendingAlerts.length,
    history,
  };
}
