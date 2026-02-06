// ─── Adaptive Workload Recommendation Engine ───

import { db } from './db';
import { Difficulty, WorkloadRecommendation } from './types';
import { analyzeWorkerRisk } from './burnout-engine';

export async function getWorkloadRecommendation(workerId: string): Promise<WorkloadRecommendation> {
  const assignments = (await db.getAssignmentsByWorker(workerId)).slice(0, 7);
  const surveys = await db.getSurveysByWorker(workerId);
  const debt = await db.getBurnoutDebt(workerId);
  const { riskLevel, score, factors } = await analyzeWorkerRisk(workerId);

  const recentDifficulties = assignments.slice(0, 5).map(a => a.difficulty);
  const latestDifficulty = recentDifficulties[0] as Difficulty | undefined;
  const latestSurvey = surveys[0];

  const reasoningParts: string[] = [];
  const factorsList: string[] = [];

  let recommended: Difficulty = 'medium';

  // ──────────────────────────────────────────────
  // TIER 1: Critical overrides → force easy
  // These are non-negotiable safety guardrails.
  // ──────────────────────────────────────────────

  const criticalReasons: string[] = [];

  if (factors.helpSignalSent) {
    criticalReasons.push('Worker sent a help signal recently');
    factorsList.push('Recent help signal');
  }

  if (riskLevel === 'high-risk') {
    criticalReasons.push(`burnout risk is HIGH (score: ${score}/100)`);
    factorsList.push('High risk level');
  }

  if (latestSurvey && latestSurvey.stressLevel >= 4) {
    criticalReasons.push(`self-reported stress is high (${latestSurvey.stressLevel}/5)`);
    factorsList.push('High stress reported');
  }

  if (latestSurvey && latestSurvey.energyLevel <= 2) {
    criticalReasons.push(`self-reported energy is low (${latestSurvey.energyLevel}/5)`);
    factorsList.push('Low energy reported');
  }

  if (factors.consecutiveHardDays >= 3) {
    criticalReasons.push(`${factors.consecutiveHardDays} consecutive hard assignments`);
    factorsList.push(`${factors.consecutiveHardDays} consecutive hard days`);
  }

  if (debt && debt.currentDebt > 70) {
    criticalReasons.push(`burnout debt is critical (${debt.currentDebt}/100)`);
    factorsList.push('Critical burnout debt');
  }

  if (criticalReasons.length > 0) {
    recommended = 'easy';
    reasoningParts.push(`Easy workload required: ${criticalReasons.join('; ')}. Recovery is the priority.`);
  }

  // ──────────────────────────────────────────────
  // TIER 2: Warning-level adjustments → cap at easy or medium
  // Worker is not critical but showing signs of strain.
  // ──────────────────────────────────────────────

  else if (riskLevel === 'warning') {
    if (factors.consecutiveHardDays >= 2 || (latestSurvey && latestSurvey.stressLevel >= 3)) {
      recommended = 'easy';
      reasoningParts.push(`Worker is at WARNING risk level (score: ${score}/100) with elevated stress indicators. Light workload advised.`);
      factorsList.push('Warning risk + stress indicators');
    } else {
      recommended = 'medium';
      reasoningParts.push(`Worker is at WARNING risk level (score: ${score}/100). Capping at medium to prevent escalation.`);
      factorsList.push('Warning risk level');
    }
  }

  // ──────────────────────────────────────────────
  // TIER 3: Safe risk level → adaptive pattern-based logic
  // Worker is healthy. Use recent history to recommend progression.
  // ──────────────────────────────────────────────

  else {
    const moderateDebt = debt && debt.currentDebt > 40;
    const surveyStress = latestSurvey ? latestSurvey.stressLevel : 2;
    const surveyEnergy = latestSurvey ? latestSurvey.energyLevel : 3;
    const surveyBalance = latestSurvey ? latestSurvey.workLifeBalance : 3;

    // Count recent difficulty distribution (last 5 assignments)
    const recent5 = recentDifficulties.slice(0, 5);
    const hardCount = recent5.filter(d => d === 'hard').length;
    const easyCount = recent5.filter(d => d === 'easy').length;

    if (factors.consecutiveHardDays >= 2) {
      // 2 consecutive hard days at safe level → step down
      recommended = 'easy';
      reasoningParts.push(`${factors.consecutiveHardDays} consecutive hard assignments. A recovery day will prevent burnout debt accumulation.`);
      factorsList.push('Consecutive hard recovery');
    } else if (moderateDebt && latestDifficulty === 'hard') {
      // Moderate debt + just did hard → step down
      recommended = 'easy';
      reasoningParts.push(`Previous assignment was hard and burnout debt is elevated (${debt!.currentDebt}/100). Stepping down to allow recovery.`);
      factorsList.push('Post-hard debt recovery');
    } else if (moderateDebt) {
      // Moderate debt → cap at medium
      recommended = 'medium';
      reasoningParts.push(`Burnout debt is moderately elevated (${debt!.currentDebt}/100). Maintaining medium workload.`);
      factorsList.push('Moderate burnout debt');
    } else if (factors.screenTimeExcess && latestDifficulty === 'hard') {
      // Screen time high + just did hard → step down
      recommended = 'medium';
      reasoningParts.push('Previous was hard and average screen time exceeds 8 hours. Stepping down to medium.');
      factorsList.push('Screen time + hard recovery');
    } else if (latestDifficulty === 'hard') {
      // Just did hard, conditions are good → medium (not another hard back-to-back)
      recommended = 'medium';
      reasoningParts.push('Previous assignment was hard. Alternating to medium for sustainable pacing.');
      factorsList.push('Hard → Medium balance');
    } else if (latestDifficulty === 'easy') {
      // Just did easy → step up
      if (surveyStress <= 2 && surveyEnergy >= 4 && surveyBalance >= 4 && easyCount >= 2) {
        // Very healthy + multiple easy days → can go to hard
        recommended = 'hard';
        reasoningParts.push('Worker shows low stress, high energy, and good work-life balance after multiple easy days. Ready for a challenge.');
        factorsList.push('Strong health + easy streak → challenge');
      } else {
        recommended = 'medium';
        reasoningParts.push('Previous was easy. Stepping up to medium for balanced progression.');
        factorsList.push('Easy → Medium progression');
      }
    } else {
      // Latest was medium (or no history)
      if (surveyStress <= 2 && surveyEnergy >= 4 && (!debt || debt.currentDebt < 20) && hardCount <= 1) {
        // Excellent health indicators, low debt, not too many recent hards → recommend hard
        recommended = 'hard';
        reasoningParts.push(`Worker is performing well — low stress (${surveyStress}/5), high energy (${surveyEnergy}/5), minimal burnout debt. Can handle a hard assignment.`);
        factorsList.push('Excellent health indicators');
      } else if (surveyStress >= 3 || surveyEnergy <= 3) {
        // Moderate stress or mediocre energy → stay medium or step down
        if (factors.screenTimeExcess) {
          recommended = 'easy';
          reasoningParts.push('Moderate stress with excess screen time. Stepping down to easy.');
          factorsList.push('Moderate stress + screen time');
        } else {
          recommended = 'medium';
          reasoningParts.push('Moderate wellness indicators. Maintaining medium workload.');
          factorsList.push('Moderate wellness');
        }
      } else {
        // Normal conditions → medium
        recommended = 'medium';
        reasoningParts.push('Conditions are normal. Medium workload maintains a healthy rhythm.');
        factorsList.push('Balanced conditions');
      }
    }
  }

  // ─── Default reasoning (shouldn't happen, but just in case) ───
  if (reasoningParts.length === 0) {
    reasoningParts.push('Standard workload recommended based on current conditions.');
    factorsList.push('Normal conditions');
  }

  // ─── Confidence ───
  let confidence: 'high' | 'medium' | 'low' = 'medium';
  // High confidence when multiple signals agree or critical override
  if (criticalReasons.length >= 2) confidence = 'high';
  else if (factorsList.length >= 3) confidence = 'high';
  // Low confidence when we have little data
  if (assignments.length < 3 || surveys.length === 0) confidence = 'low';

  return {
    workerId,
    recommendedDifficulty: recommended,
    reasoning: reasoningParts.join(' '),
    factors: factorsList,
    confidence,
  };
}
