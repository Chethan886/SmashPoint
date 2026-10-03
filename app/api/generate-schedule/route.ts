import { NextRequest, NextResponse } from 'next/server';
import { generateSchedule } from '@/lib/matchmaking';
import { MatchmakingRequest } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body: MatchmakingRequest = await req.json();

    if (!body.playerIds || !Array.isArray(body.playerIds) || body.playerIds.length < 4) {
      return NextResponse.json(
        { error: 'At least 4 players are required to generate badminton doubles matches.' },
        { status: 400 }
      );
    }

    const result = generateSchedule({
      playerIds: body.playerIds,
      targetMatchesPerPlayer: body.targetMatchesPerPlayer ? Number(body.targetMatchesPerPlayer) : undefined,
      totalRounds: body.totalRounds ? Number(body.totalRounds) : undefined,
      numberOfCourts: body.numberOfCourts ? Number(body.numberOfCourts) : 1,
      existingMatches: body.existingMatches || [],
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: unknown) {
    console.error('Error generating match schedule:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate schedule.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
