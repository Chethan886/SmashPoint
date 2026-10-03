import { GeneratedMatch, MatchmakingRequest, MatchmakingResult } from './types';

function getPairKey(id1: string, id2: string): string {
  return [id1, id2].sort().join('___');
}

/**
 * Calculates optimal match combinations and rounds using weighted penalty scoring:
 * - Rest Optimization: Players with fewest matches are prioritized.
 * - Pairing Score Matrix: W_pair = 100 * (times paired together)
 * - Opponent Score Matrix: W_vs = 10 * (times faced each other)
 * - Play-count variance penalty: 500 * (difference from current min matches)
 */
export function generateSchedule(params: MatchmakingRequest): MatchmakingResult {
  const { playerIds, targetMatchesPerPlayer, totalRounds, numberOfCourts: _numberOfCourts = 1, existingMatches = [] } = params;

  if (playerIds.length < 4) {
    throw new Error('At least 4 players are required to generate doubles matches.');
  }

  const P = playerIds.length;
  // Calculate total rounds to generate
  let roundsToGenerate = 0;
  if (totalRounds && totalRounds > 0) {
    roundsToGenerate = totalRounds;
  } else if (targetMatchesPerPlayer && targetMatchesPerPlayer > 0) {
    // M = (P * K) / 4
    roundsToGenerate = Math.max(1, Math.round((P * targetMatchesPerPlayer) / 4));
  } else {
    // Default: roughly 3 matches per player
    roundsToGenerate = Math.max(1, Math.round((P * 3) / 4));
  }

  // Tracking state
  const matchCounts: Record<string, number> = {};
  const pairCounts: Record<string, number> = {};
  const vsCounts: Record<string, number> = {};
  const lastRoundPlayed: Record<string, number> = {};

  // Initialize
  playerIds.forEach((id) => {
    matchCounts[id] = 0;
    lastRoundPlayed[id] = -1;
  });

  // Seed with existing matches if provided
  existingMatches.forEach((m) => {
    const participants = [m.team_a_player1_id, m.team_a_player2_id, m.team_b_player1_id, m.team_b_player2_id];
    participants.forEach((pid) => {
      if (matchCounts[pid] !== undefined) {
        matchCounts[pid] = (matchCounts[pid] || 0) + 1;
      }
    });

    // Pairings
    const pairA = getPairKey(m.team_a_player1_id, m.team_a_player2_id);
    const pairB = getPairKey(m.team_b_player1_id, m.team_b_player2_id);
    pairCounts[pairA] = (pairCounts[pairA] || 0) + 1;
    pairCounts[pairB] = (pairCounts[pairB] || 0) + 1;

    // Opponents
    [m.team_a_player1_id, m.team_a_player2_id].forEach((ta) => {
      [m.team_b_player1_id, m.team_b_player2_id].forEach((tb) => {
        const vsKey = getPairKey(ta, tb);
        vsCounts[vsKey] = (vsCounts[vsKey] || 0) + 1;
      });
    });
  });

  const generatedMatches: GeneratedMatch[] = [];
  const startRoundNumber = existingMatches.length > 0
    ? Math.max(...existingMatches.map((m) => m.round_number)) + 1
    : 1;

  // Generate round-by-round
  for (let r = 0; r < roundsToGenerate; r++) {
    const currentRoundNum = startRoundNumber + r;

    // Sort players by:
    // 1. match counts ascending (fewest matches played today)
    // 2. lastRoundPlayed ascending (fair rest spacing)
    // 3. small deterministic random tie-break
    const sortedCandidates = [...playerIds].sort((a, b) => {
      const diff = (matchCounts[a] || 0) - (matchCounts[b] || 0);
      if (diff !== 0) return diff;
      return (lastRoundPlayed[a] || 0) - (lastRoundPlayed[b] || 0);
    });

    // Select candidate pools for 4 players
    // If pool is larger than 4, take top N candidates (e.g. up to 6 candidates with lowest match counts)
    const minMatches = Math.min(...playerIds.map((id) => matchCounts[id] || 0));
    const candidatePool = sortedCandidates.slice(0, Math.min(sortedCandidates.length, Math.max(4, 7)));

    // Generate combinations of 4 players from candidatePool
    const candidate4Combinations = getCombinations(candidatePool, 4);

    let bestScore = Infinity;
    let bestMatch: {
      teamA: [string, string];
      teamB: [string, string];
      resting: string[];
      penalty: number;
    } | null = null;

    for (const fourPlayers of candidate4Combinations) {
      // Resting players for this round
      const resting = playerIds.filter((id) => !fourPlayers.includes(id));

      // There are 3 possible 2v2 pairings for 4 players [p0, p1, p2, p3]
      const [p0, p1, p2, p3] = fourPlayers;
      const arrangements: Array<{ teamA: [string, string]; teamB: [string, string] }> = [
        { teamA: [p0, p1], teamB: [p2, p3] },
        { teamA: [p0, p2], teamB: [p1, p3] },
        { teamA: [p0, p3], teamB: [p1, p2] },
      ];

      for (const arr of arrangements) {
        const { teamA, teamB } = arr;

        // 1. Pairing penalties (100x times paired)
        const pairKeyA = getPairKey(teamA[0], teamA[1]);
        const pairKeyB = getPairKey(teamB[0], teamB[1]);
        const pairPenalty =
          100 * (pairCounts[pairKeyA] || 0) +
          100 * (pairCounts[pairKeyB] || 0);

        // 2. Opponent penalties (10x times faced)
        let vsPenalty = 0;
        for (const ta of teamA) {
          for (const tb of teamB) {
            const vsKey = getPairKey(ta, tb);
            vsPenalty += 10 * (vsCounts[vsKey] || 0);
          }
        }

        // 3. Play count variance penalty (to strictly balance match counts)
        let playCountPenalty = 0;
        fourPlayers.forEach((pid) => {
          const excess = (matchCounts[pid] || 0) - minMatches;
          playCountPenalty += excess * 500;
        });

        // 4. Consecutive play penalty: slightly prefer players who rested last round if counts are equal
        let consecutivePenalty = 0;
        fourPlayers.forEach((pid) => {
          if (lastRoundPlayed[pid] === currentRoundNum - 1) {
            consecutivePenalty += 5;
          }
        });

        const totalPenalty = pairPenalty + vsPenalty + playCountPenalty + consecutivePenalty;

        if (totalPenalty < bestScore) {
          bestScore = totalPenalty;
          bestMatch = {
            teamA,
            teamB,
            resting,
            penalty: totalPenalty,
          };
        }
      }
    }

    if (bestMatch) {
      const { teamA, teamB, resting, penalty } = bestMatch;

      // Update state
      [...teamA, ...teamB].forEach((pid) => {
        matchCounts[pid] = (matchCounts[pid] || 0) + 1;
        lastRoundPlayed[pid] = currentRoundNum;
      });

      const pairKeyA = getPairKey(teamA[0], teamA[1]);
      const pairKeyB = getPairKey(teamB[0], teamB[1]);
      pairCounts[pairKeyA] = (pairCounts[pairKeyA] || 0) + 1;
      pairCounts[pairKeyB] = (pairCounts[pairKeyB] || 0) + 1;

      for (const ta of teamA) {
        for (const tb of teamB) {
          const vsKey = getPairKey(ta, tb);
          vsCounts[vsKey] = (vsCounts[vsKey] || 0) + 1;
        }
      }

      generatedMatches.push({
        round_number: currentRoundNum,
        court_number: 1,
        team_a_player1_id: teamA[0],
        team_a_player2_id: teamA[1],
        team_b_player1_id: teamB[0],
        team_b_player2_id: teamB[1],
        resting_player_ids: resting,
        penalty_score: penalty,
      });
    }
  }

  // Calculate fairness metrics
  const counts = Object.values(matchCounts);
  const minMatches = Math.min(...counts);
  const maxMatches = Math.max(...counts);
  const fairnessScore = maxMatches - minMatches; // 0 or 1 means ideal fair distribution

  return {
    totalMatches: generatedMatches.length,
    matches: generatedMatches,
    playerMatchCounts: matchCounts,
    playerPairCounts: pairCounts,
    fairnessScore,
  };
}

// Combinations helper (n choose k)
function getCombinations<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];

  function helper(start: number, combo: T[]) {
    if (combo.length === size) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < array.length; i++) {
      combo.push(array[i]);
      helper(i + 1, combo);
      combo.pop();
    }
  }

  helper(0, []);
  return result;
}
