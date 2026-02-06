import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Survey } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('workerId');

    if (workerId) {
      return NextResponse.json(await db.getSurveysByWorker(workerId));
    }

    // Return all surveys
    return NextResponse.json(await db.getSurveys());
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workerId, weekDate, stressLevel, energyLevel, workLifeBalance, notes } = body;

    if (!workerId || !weekDate || stressLevel == null || energyLevel == null || workLifeBalance == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newSurvey: Survey = {
      id: uuidv4(),
      workerId,
      weekDate,
      stressLevel,
      energyLevel,
      workLifeBalance,
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };

    const saved = await db.addSurvey(newSurvey);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
