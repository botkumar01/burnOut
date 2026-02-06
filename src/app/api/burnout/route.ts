import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getWorkerHealthStatus } from '@/lib/burnout-engine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('workerId');
    const type = searchParams.get('type');

    // GET /api/burnout?type=all → all worker health statuses (array)
    if (type === 'all') {
      const workers = await db.getUsersByRole('worker');
      const healthStatuses = await Promise.all(
        workers.map((w) => getWorkerHealthStatus(w.id))
      );
      return NextResponse.json(healthStatuses.filter((status) => status !== null));
    }

    // GET /api/burnout?workerId=xxx&type=debt → burnout debt for a worker
    if (workerId && type === 'debt') {
      const debt = await db.getBurnoutDebt(workerId);
      if (!debt) {
        return NextResponse.json({ currentDebt: 0, trend: 'stable', history: [] });
      }
      return NextResponse.json(debt);
    }

    // GET /api/burnout?workerId=xxx → single worker health status
    if (workerId) {
      const health = await getWorkerHealthStatus(workerId);
      if (!health) {
        return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
      }
      return NextResponse.json(health);
    }

    // Default: return all health statuses
    const workers = await db.getUsersByRole('worker');
    const healthStatuses = await Promise.all(
      workers.map((w) => getWorkerHealthStatus(w.id))
    );
    return NextResponse.json(healthStatuses.filter((status) => status !== null));
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch burnout data' },
      { status: 500 }
    );
  }
}
