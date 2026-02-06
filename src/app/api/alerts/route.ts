import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('workerId');
    const status = searchParams.get('status');

    let alerts = await db.getAlerts();

    if (workerId) {
      alerts = alerts.filter(a => a.workerId === workerId);
    }

    if (status) {
      alerts = alerts.filter(a => a.status === status);
    }

    return NextResponse.json(alerts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, explanation, correctiveAction } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'id and action are required' }, { status: 400 });
    }

    if (action === 'acknowledge') {
      const alert = await db.acknowledgeAlert(id);
      if (!alert) return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
      return NextResponse.json(alert);
    }

    if (action === 'resolve') {
      if (!explanation || !correctiveAction) {
        return NextResponse.json({ error: 'explanation and correctiveAction are required' }, { status: 400 });
      }
      const alert = await db.resolveAlert(id, explanation, correctiveAction);
      if (!alert) return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
      return NextResponse.json(alert);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
