import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { computeTLAccountabilityIndex } from '@/lib/burnout-engine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leaderId = searchParams.get('leaderId');

    if (!leaderId) {
      return NextResponse.json(
        { error: 'leaderId query parameter is required' },
        { status: 400 }
      );
    }

    const leader = await db.getUser(leaderId);
    if (!leader) {
      return NextResponse.json(
        { error: 'Leader not found' },
        { status: 404 }
      );
    }

    if (leader.role !== 'leader') {
      return NextResponse.json(
        { error: 'User is not a team leader' },
        { status: 400 }
      );
    }

    const accountabilityIndex = await computeTLAccountabilityIndex(leaderId);
    return NextResponse.json(accountabilityIndex);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to compute accountability index' },
      { status: 500 }
    );
  }
}
