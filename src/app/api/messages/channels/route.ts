import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Channel } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      const user = await db.getUser(userId);
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      const channels = await db.getChannelsByUser(userId);
      return NextResponse.json(channels);
    }

    const channels = await db.getChannels();
    return NextResponse.json(channels);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, type, participants } = body;

    if (!name || !type || !participants || !Array.isArray(participants) || participants.length === 0) {
      return NextResponse.json(
        { error: 'name, type, and participants (non-empty array) are required' },
        { status: 400 }
      );
    }

    const validTypes = ['direct', 'team', 'announcement'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'type must be one of: direct, team, announcement' },
        { status: 400 }
      );
    }

    // Validate all participants exist
    for (const participantId of participants) {
      const user = await db.getUser(participantId);
      if (!user) {
        return NextResponse.json(
          { error: `Participant not found: ${participantId}` },
          { status: 404 }
        );
      }
    }

    const newChannel: Channel = {
      id: uuidv4(),
      name,
      type,
      participants,
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
    };

    const saved = await db.addChannel(newChannel);
    return NextResponse.json({ channel: saved }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
