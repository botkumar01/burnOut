import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Assignment } from '@/lib/types';
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
      const assignments = await db.getAssignmentsByWorker(workerId);
      return NextResponse.json(assignments.filter(a => a.date >= cutoffStr));
    }

    // Return all assignments
    const all = await db.getAssignments();
    return NextResponse.json(all.filter(a => a.date >= cutoffStr));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      workerId, assignedBy, date, difficulty, taskTitle,
      taskDescription, recommendedDifficulty, wasOverride, overrideReason,
    } = body;

    if (!workerId || !assignedBy || !date || !difficulty || !taskTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newAssignment: Assignment = {
      id: uuidv4(),
      workerId,
      assignedBy,
      date,
      difficulty,
      taskTitle,
      taskDescription: taskDescription || '',
      recommendedDifficulty: recommendedDifficulty || null,
      wasOverride: wasOverride || false,
      overrideReason: overrideReason || null,
      createdAt: new Date().toISOString(),
    };

    const saved = await db.addAssignment(newAssignment);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
