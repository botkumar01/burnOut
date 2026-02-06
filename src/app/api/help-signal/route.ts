import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { HelpSignal } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('workerId');

    if (workerId) {
      return NextResponse.json(await db.getHelpSignalsByWorker(workerId));
    }

    return NextResponse.json(await db.getHelpSignals());
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch help signals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workerId, message } = body;

    if (!workerId || !message) {
      return NextResponse.json({ error: 'workerId and message are required' }, { status: 400 });
    }

    const worker = await db.getUser(workerId);
    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    const newSignal: HelpSignal = {
      id: uuidv4(),
      workerId,
      message,
      timestamp: new Date().toISOString(),
      readByLeader: false,
      readAt: null,
    };

    const savedSignal = await db.addHelpSignal(newSignal);

    // Create alert for TL
    await db.addAlert({
      workerId,
      type: 'help-signal',
      severity: 'high-risk',
      message: `${worker.name} sent a silent help signal`,
      details: `Worker pressed the "I feel overloaded" button. Immediate attention required.`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      acknowledgedAt: null,
      resolvedAt: null,
      tlExplanation: null,
      correctiveAction: null,
    });

    return NextResponse.json(savedSignal, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
