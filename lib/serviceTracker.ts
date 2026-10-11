export interface ServiceCourtPosition {
  player: { id: string; name: string } | null;
  court: 'RIGHT' | 'LEFT';
  isServer: boolean;
  isReceiver: boolean;
}

export interface MatchServiceSnapshot {
  teamALeftPlayerId: string;
  teamARightPlayerId: string;
  teamBLeftPlayerId: string;
  teamBRightPlayerId: string;
  servingTeam: 'A' | 'B';
  serverPlayerId: string;
  receiverPlayerId: string;
}

export interface MatchServiceState {
  teamALeftPlayerId: string;
  teamARightPlayerId: string;
  teamBLeftPlayerId: string;
  teamBRightPlayerId: string;
  servingTeam: 'A' | 'B';
  serverPlayerId: string;
  receiverPlayerId: string;
  isConfigured?: boolean;
  isLocked?: boolean;
  history?: MatchServiceSnapshot[];
}

export interface ServiceCalculationResult {
  servingTeam: 'A' | 'B';
  servingCourt: 'RIGHT' | 'LEFT';
  server: { id: string; name: string } | null;
  receiver: { id: string; name: string } | null;
  teamA: {
    left: ServiceCourtPosition;
    right: ServiceCourtPosition;
  };
  teamB: {
    left: ServiceCourtPosition;
    right: ServiceCourtPosition;
  };
}

/**
 * Initializes a new MatchServiceState at 0-0.
 */
export function createInitialServiceState(params: {
  teamAPlayer1Id: string;
  teamAPlayer2Id: string;
  teamBPlayer1Id: string;
  teamBPlayer2Id: string;
  firstServingTeam: 'A' | 'B';
  teamARightPlayerId: string;
  teamBRightPlayerId: string;
}): MatchServiceState {
  const {
    teamAPlayer1Id,
    teamAPlayer2Id,
    teamBPlayer1Id,
    teamBPlayer2Id,
    firstServingTeam,
    teamARightPlayerId,
    teamBRightPlayerId,
  } = params;

  const teamALeftPlayerId =
    teamARightPlayerId === teamAPlayer1Id ? teamAPlayer2Id : teamAPlayer1Id;
  const teamBLeftPlayerId =
    teamBRightPlayerId === teamBPlayer1Id ? teamBPlayer2Id : teamBPlayer1Id;

  const serverPlayerId =
    firstServingTeam === 'A' ? teamARightPlayerId : teamBRightPlayerId;
  const receiverPlayerId =
    firstServingTeam === 'A' ? teamBRightPlayerId : teamARightPlayerId;

  return {
    teamALeftPlayerId,
    teamARightPlayerId,
    teamBLeftPlayerId,
    teamBRightPlayerId,
    servingTeam: firstServingTeam,
    serverPlayerId,
    receiverPlayerId,
    isConfigured: true,
    isLocked: true,
    history: [],
  };
}

/**
 * Applies a point scored according to official BWF doubles rules:
 * 1. When Serving Side Wins Point:
 *    - Serving pair swaps courts (left <-> right)
 *    - Same server serves again from the opposite court
 *    - Receivers DO NOT swap courts
 *    - The other player on the receiving side receives the next serve (cross-court)
 * 2. When Receiving Side Wins Point:
 *    - Nobody swaps courts
 *    - Receiving side gains serve
 *    - Server is the player on winning side standing in court matching their new score (even = Right, odd = Left)
 *    - Receiver is cross-court (diagonal)
 */
export function applyPointScored(
  currentState: MatchServiceState,
  winningTeam: 'A' | 'B',
  newScoreA: number,
  newScoreB: number
): MatchServiceState {
  const snapshot: MatchServiceSnapshot = {
    teamALeftPlayerId: currentState.teamALeftPlayerId,
    teamARightPlayerId: currentState.teamARightPlayerId,
    teamBLeftPlayerId: currentState.teamBLeftPlayerId,
    teamBRightPlayerId: currentState.teamBRightPlayerId,
    servingTeam: currentState.servingTeam,
    serverPlayerId: currentState.serverPlayerId,
    receiverPlayerId: currentState.receiverPlayerId,
  };

  const newHistory = [...(currentState.history || []), snapshot];

  let nextALeft = currentState.teamALeftPlayerId;
  let nextARight = currentState.teamARightPlayerId;
  let nextBLeft = currentState.teamBLeftPlayerId;
  let nextBRight = currentState.teamBRightPlayerId;

  let nextServingTeam = currentState.servingTeam;
  let nextServerId = currentState.serverPlayerId;
  let nextReceiverId = currentState.receiverPlayerId;

  if (winningTeam === currentState.servingTeam) {
    // 1. Serving side won:
    // Serving pair swaps courts
    if (winningTeam === 'A') {
      nextALeft = currentState.teamARightPlayerId;
      nextARight = currentState.teamALeftPlayerId;
    } else {
      nextBLeft = currentState.teamBRightPlayerId;
      nextBRight = currentState.teamBLeftPlayerId;
    }

    // Same server serves again
    nextServerId = currentState.serverPlayerId;

    // Receivers stay in original courts
    // Receiver is cross-court from server's new court
    const serverCourt =
      winningTeam === 'A'
        ? nextARight === nextServerId
          ? 'RIGHT'
          : 'LEFT'
        : nextBRight === nextServerId
        ? 'RIGHT'
        : 'LEFT';

    if (winningTeam === 'A') {
      nextReceiverId = serverCourt === 'RIGHT' ? nextBRight : nextBLeft;
    } else {
      nextReceiverId = serverCourt === 'RIGHT' ? nextARight : nextALeft;
    }
  } else {
    // 2. Receiving side won (service break):
    // Nobody swaps courts
    nextServingTeam = winningTeam;
    const score = winningTeam === 'A' ? newScoreA : newScoreB;
    const requiredCourt: 'RIGHT' | 'LEFT' = score % 2 === 0 ? 'RIGHT' : 'LEFT';

    if (winningTeam === 'A') {
      nextServerId = requiredCourt === 'RIGHT' ? nextARight : nextALeft;
      nextReceiverId = requiredCourt === 'RIGHT' ? nextBRight : nextBLeft;
    } else {
      nextServerId = requiredCourt === 'RIGHT' ? nextBRight : nextBLeft;
      nextReceiverId = requiredCourt === 'RIGHT' ? nextARight : nextALeft;
    }
  }

  return {
    teamALeftPlayerId: nextALeft,
    teamARightPlayerId: nextARight,
    teamBLeftPlayerId: nextBLeft,
    teamBRightPlayerId: nextBRight,
    servingTeam: nextServingTeam,
    serverPlayerId: nextServerId,
    receiverPlayerId: nextReceiverId,
    isConfigured: true,
    isLocked: currentState.isLocked ?? true,
    history: newHistory,
  };
}

/**
 * Reverts to previous service court state on point undo.
 */
export function applyPointUndone(currentState: MatchServiceState): MatchServiceState {
  if (!currentState.history || currentState.history.length === 0) {
    return currentState;
  }
  const previous = currentState.history[currentState.history.length - 1];
  const newHistory = currentState.history.slice(0, -1);
  return {
    ...previous,
    isConfigured: currentState.isConfigured,
    isLocked: currentState.isLocked,
    history: newHistory,
  };
}

/**
 * Calculates current player court positions and roles for display.
 */
export function calculateServiceAndCourts(
  match: {
    team_a_player1?: { id: string; name: string } | null;
    team_a_player2?: { id: string; name: string } | null;
    team_b_player1?: { id: string; name: string } | null;
    team_b_player2?: { id: string; name: string } | null;
  },
  serviceState: MatchServiceState
): ServiceCalculationResult {
  const pA1 = match.team_a_player1 || null;
  const pA2 = match.team_a_player2 || null;
  const pB1 = match.team_b_player1 || null;
  const pB2 = match.team_b_player2 || null;

  const playerMap = new Map<string, { id: string; name: string }>();
  if (pA1) playerMap.set(pA1.id, pA1);
  if (pA2) playerMap.set(pA2.id, pA2);
  if (pB1) playerMap.set(pB1.id, pB1);
  if (pB2) playerMap.set(pB2.id, pB2);

  const teamAPlayerLeft = playerMap.get(serviceState.teamALeftPlayerId) || pA1;
  const teamAPlayerRight = playerMap.get(serviceState.teamARightPlayerId) || pA2;
  const teamBPlayerLeft = playerMap.get(serviceState.teamBLeftPlayerId) || pB1;
  const teamBPlayerRight = playerMap.get(serviceState.teamBRightPlayerId) || pB2;

  const server = playerMap.get(serviceState.serverPlayerId) || null;
  const receiver = playerMap.get(serviceState.receiverPlayerId) || null;

  const servingCourt: 'RIGHT' | 'LEFT' =
    serviceState.servingTeam === 'A'
      ? teamAPlayerRight?.id === server?.id
        ? 'RIGHT'
        : 'LEFT'
      : teamBPlayerRight?.id === server?.id
      ? 'RIGHT'
      : 'LEFT';

  return {
    servingTeam: serviceState.servingTeam,
    servingCourt,
    server,
    receiver,
    teamA: {
      left: {
        player: teamAPlayerLeft,
        court: 'LEFT',
        isServer: !!server && server.id === teamAPlayerLeft?.id,
        isReceiver: !!receiver && receiver.id === teamAPlayerLeft?.id,
      },
      right: {
        player: teamAPlayerRight,
        court: 'RIGHT',
        isServer: !!server && server.id === teamAPlayerRight?.id,
        isReceiver: !!receiver && receiver.id === teamAPlayerRight?.id,
      },
    },
    teamB: {
      left: {
        player: teamBPlayerLeft,
        court: 'LEFT',
        isServer: !!server && server.id === teamBPlayerLeft?.id,
        isReceiver: !!receiver && receiver.id === teamBPlayerLeft?.id,
      },
      right: {
        player: teamBPlayerRight,
        court: 'RIGHT',
        isServer: !!server && server.id === teamBPlayerRight?.id,
        isReceiver: !!receiver && receiver.id === teamBPlayerRight?.id,
      },
    },
  };
}

export function getSavedServiceState(matchId: string): MatchServiceState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`smashpoint_service_${matchId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.isConfigured || parsed.teamARightPlayerId)) {
        return parsed;
      }
    }
  } catch {}
  return null;
}

export function isMatchServiceConfigured(matchId: string): boolean {
  const saved = getSavedServiceState(matchId);
  return !!saved && !!saved.isConfigured;
}

export function saveServiceState(matchId: string, state: MatchServiceState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`smashpoint_service_${matchId}`, JSON.stringify(state));
  } catch {}
}
