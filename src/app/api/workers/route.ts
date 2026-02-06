import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getWorkerHealthStatus } from '@/lib/burnout-engine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const healthStatus = await getWorkerHealthStatus(id);
      if (!healthStatus) {
        return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
      }
      return NextResponse.json(healthStatus);
    }

    // Return all users (workers + leaders)
    const users = await db.getUsers();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch workers' }, { status: 500 });
  }
}
