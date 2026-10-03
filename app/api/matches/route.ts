import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/dataService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    const matches = sessionId
      ? await dataService.getMatchesBySession(sessionId)
      : await dataService.getAllMatches();

    return NextResponse.json({ success: true, matches });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch matches';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { matches } = body;

    if (!matches || !Array.isArray(matches) || matches.length === 0) {
      return NextResponse.json({ error: 'No matches provided' }, { status: 400 });
    }

    const created = await dataService.createMatches(matches);
    return NextResponse.json({ success: true, matches: created });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create matches';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { matchId, score_team_a, score_team_b, winning_team } = body;

    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
    }

    const updated = await dataService.updateMatch(matchId, {
      score_team_a,
      score_team_b,
      winning_team,
    });

    return NextResponse.json({ success: true, match: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update match';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get('matchId');
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      await dataService.clearSessionMatches(sessionId);
      return NextResponse.json({ success: true, message: 'Session matches cleared' });
    }

    if (matchId) {
      await dataService.deleteMatch(matchId);
      return NextResponse.json({ success: true, message: 'Match deleted' });
    }

    return NextResponse.json({ error: 'Missing matchId or sessionId' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
