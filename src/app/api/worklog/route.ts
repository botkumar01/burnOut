import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { WorkLog } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('workerId');
    const days = parseInt(searchParams.get('days') || '14', 10);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    if (workerId) {
      const logs = await db.getWorkLogsByWorker(workerId);
      return NextResponse.json(logs.filter(log => log.date >= cutoffStr));
    }

    // Return all worklogs (for analytics)
    const allLogs = await db.getWorkLogs();
    return NextResponse.json(allLogs.filter(log => log.date >= cutoffStr));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch work logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      workerId, date, screenTimeHours, tasksCompleted,
      taskDescriptions, breaksTaken, breakDurationMinutes,
      sessionStartTime, sessionEndTime, longestSessionMinutes,
    } = body;

    if (!workerId || !date) {
      return NextResponse.json({ error: 'workerId and date are required' }, { status: 400 });
    }

    const newLog: WorkLog = {
      id: uuidv4(),
      workerId,
      date,
      screenTimeHours: screenTimeHours || 0,
      tasksCompleted: tasksCompleted || 0,
      taskDescriptions: taskDescriptions || [],
      breaksTaken: breaksTaken || 0,
      breakDurationMinutes: breakDurationMinutes || 0,
      sessionStartTime: sessionStartTime || '',
      sessionEndTime: sessionEndTime || '',
      longestSessionMinutes: longestSessionMinutes || 0,
      createdAt: new Date().toISOString(),
    };

    const saved = await db.addWorkLog(newLog);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
