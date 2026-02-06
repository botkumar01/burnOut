import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getWorkloadRecommendation } from '@/lib/recommendations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('workerId');

    if (!workerId) {
      return NextResponse.json(
        { error: 'workerId query parameter is required' },
        { status: 400 }
      );
    }

    const worker = await db.getUser(workerId);
    if (!worker) {
      return NextResponse.json(
        { error: 'Worker not found' },
        { status: 404 }
      );
    }

    const recommendation = await getWorkloadRecommendation(workerId);
    return NextResponse.json(recommendation);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate recommendation' },
      { status: 500 }
    );
  }
}
