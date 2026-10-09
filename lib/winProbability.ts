import { Match, MatchWithPlayers, Member } from './types';

export interface PlayerPerformance {
  playerId: string;
  name: string;
  nickname?: string | null;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number; // 0 - 100 (%)
  gayRate: number; // 0 - 100 (%) = losses / totalMatches
  avgPointDiff: number;
}

export interface MatchOdds {
  teamAWinProb: number; // 0 - 100 (%)
  teamBWinProb: number; // 0 - 100 (%)
  teamAGayRate: number; // 0 - 100 (%) predicted loss probability in this match
  teamBGayRate: number; // 0 - 100 (%) predicted loss probability in this match
  historicalTeamAWinRate: number; // Average past win rate of Team A players
  historicalTeamBWinRate: number; // Average past win rate of Team B players
  historicalTeamAGayRate: number; // Average past loss/gay rate of Team A players
  historicalTeamBGayRate: number; // Average past loss/gay rate of Team B players
  totalMatchesEvaluated: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'NEW';
  headToHead: {
    teamAWins: number;
    teamBWins: number;
    totalEncounters: number;
  };
  synergy: {
    duoAPlayed: number;
    duoAWins: number;
    duoBPlayed: number;
    duoBWins: number;
  };
  players: {
    a1?: PlayerPerformance;
    a2?: PlayerPerformance;
    b1?: PlayerPerformance;
    b2?: PlayerPerformance;
  };
}

/**
 * Calculates win probability and gay rate for Team A vs Team B based on past matches.
 */
export function calculateMatchOdds(
  match: MatchWithPlayers,
  allMatches: Match[],
  members: Member[]
): MatchOdds {
  const memberMap = new Map<string, Member>(members.map((m) => [m.id, m]));

  const pA1 = match.team_a_player1_id;
  const pA2 = match.team_a_player2_id;
  const pB1 = match.team_b_player1_id;
  const pB2 = match.team_b_player2_id;

  const teamAPlayerIds = new Set([pA1, pA2]);
  const teamBPlayerIds = new Set([pB1, pB2]);

  // Filter completed matches (exclude current match if it is in the list)
  const completedMatches = allMatches.filter(
    (m) => m.winning_team !== 'PENDING' && m.id !== match.id
  );

  // 1. Build individual player stats
  interface RawStat {
    matches: number;
    wins: number;
    losses: number;
    scored: number;
    conceded: number;
  }

  const statsMap: Record<string, RawStat> = {};
  const initStat = (id: string) => {
    if (!statsMap[id]) {
      statsMap[id] = { matches: 0, wins: 0, losses: 0, scored: 0, conceded: 0 };
    }
  };

  [pA1, pA2, pB1, pB2].forEach(initStat);

  // Synergy & H2H tracking
  let duoAPlayed = 0;
  let duoAWins = 0;
  let duoBPlayed = 0;
  let duoBWins = 0;

  let h2hAWins = 0;
  let h2hBWins = 0;

  completedMatches.forEach((m) => {
    const isTeamAWon = m.winning_team === 'TEAM_A';
    const isTeamBWon = m.winning_team === 'TEAM_B';

    const mTeamA = [m.team_a_player1_id, m.team_a_player2_id];
    const mTeamB = [m.team_b_player1_id, m.team_b_player2_id];

    // Track Team A individual stats
    mTeamA.forEach((pid) => {
      if (statsMap[pid]) {
        statsMap[pid].matches += 1;
        statsMap[pid].scored += m.score_team_a;
        statsMap[pid].conceded += m.score_team_b;
        if (isTeamAWon) statsMap[pid].wins += 1;
        else if (isTeamBWon) statsMap[pid].losses += 1;
      }
    });

    // Track Team B individual stats
    mTeamB.forEach((pid) => {
      if (statsMap[pid]) {
        statsMap[pid].matches += 1;
        statsMap[pid].scored += m.score_team_b;
        statsMap[pid].conceded += m.score_team_a;
        if (isTeamBWon) statsMap[pid].wins += 1;
        else if (isTeamAWon) statsMap[pid].losses += 1;
      }
    });

    // Duo A synergy (did pA1 & pA2 play together as teammates?)
    const duoAInTeamA = mTeamA.includes(pA1) && mTeamA.includes(pA2);
    const duoAInTeamB = mTeamB.includes(pA1) && mTeamB.includes(pA2);
    if (duoAInTeamA) {
      duoAPlayed += 1;
      if (isTeamAWon) duoAWins += 1;
    } else if (duoAInTeamB) {
      duoAPlayed += 1;
      if (isTeamBWon) duoAWins += 1;
    }

    // Duo B synergy (did pB1 & pB2 play together as teammates?)
    const duoBInTeamA = mTeamA.includes(pB1) && mTeamA.includes(pB2);
    const duoBInTeamB = mTeamB.includes(pB1) && mTeamB.includes(pB2);
    if (duoBInTeamA) {
      duoBPlayed += 1;
      if (isTeamAWon) duoBWins += 1;
    } else if (duoBInTeamB) {
      duoBPlayed += 1;
      if (isTeamBWon) duoBWins += 1;
    }

    // Head-to-Head: Did any Team A player face any Team B player?
    const aPlayersInMatchA = mTeamA.filter((id) => teamAPlayerIds.has(id)).length;
    const bPlayersInMatchB = mTeamB.filter((id) => teamBPlayerIds.has(id)).length;
    const aPlayersInMatchB = mTeamB.filter((id) => teamAPlayerIds.has(id)).length;
    const bPlayersInMatchA = mTeamA.filter((id) => teamBPlayerIds.has(id)).length;

    if (aPlayersInMatchA > 0 && bPlayersInMatchB > 0) {
      if (isTeamAWon) h2hAWins += 1;
      else if (isTeamBWon) h2hBWins += 1;
    } else if (aPlayersInMatchB > 0 && bPlayersInMatchA > 0) {
      if (isTeamBWon) h2hAWins += 1;
      else if (isTeamAWon) h2hBWins += 1;
    }
  });

  const getPlayerPerf = (id: string): PlayerPerformance => {
    const raw = statsMap[id] || { matches: 0, wins: 0, losses: 0, scored: 0, conceded: 0 };
    const member = memberMap.get(id);
    const winRate = raw.matches > 0 ? Number(((raw.wins / raw.matches) * 100).toFixed(1)) : 50;
    const gayRate = raw.matches > 0 ? Number(((raw.losses / raw.matches) * 100).toFixed(1)) : 50;
    const avgPointDiff = raw.matches > 0 ? Number(((raw.scored - raw.conceded) / raw.matches).toFixed(1)) : 0;

    return {
      playerId: id,
      name: member?.name || 'Player',
      nickname: member?.nickname,
      totalMatches: raw.matches,
      wins: raw.wins,
      losses: raw.losses,
      winRate,
      gayRate,
      avgPointDiff,
    };
  };

  const perfA1 = getPlayerPerf(pA1);
  const perfA2 = getPlayerPerf(pA2);
  const perfB1 = getPlayerPerf(pB1);
  const perfB2 = getPlayerPerf(pB2);

  // 2. Bayesian smoothed rating for each player (Laplace smoothing with prior 0.50)
  // R = (wins + 1) / (matches + 2)
  const smoothRate = (perf: PlayerPerformance) => (perf.wins + 1.2) / (perf.totalMatches + 2.4);

  const rateA1 = smoothRate(perfA1);
  const rateA2 = smoothRate(perfA2);
  const rateB1 = smoothRate(perfB1);
  const rateB2 = smoothRate(perfB2);

  const baseStrengthA = (rateA1 + rateA2) / 2;
  const baseStrengthB = (rateB1 + rateB2) / 2;

  // 3. Synergy modifier (duo history)
  let synergyA = 0;
  if (duoAPlayed >= 2) {
    const duoAWinRate = duoAWins / duoAPlayed;
    synergyA = (duoAWinRate - 0.5) * 0.15; // up to +/- 7.5%
  }

  let synergyB = 0;
  if (duoBPlayed >= 2) {
    const duoBWinRate = duoBWins / duoBPlayed;
    synergyB = (duoBWinRate - 0.5) * 0.15;
  }

  // 4. Head-to-Head modifier
  let h2hModifier = 0;
  const totalH2H = h2hAWins + h2hBWins;
  if (totalH2H >= 2) {
    const h2hRate = h2hAWins / totalH2H;
    h2hModifier = (h2hRate - 0.5) * 0.18; // up to +/- 9%
  }

  // 5. Point Differential modifier
  const teamAPointDiff = (perfA1.avgPointDiff + perfA2.avgPointDiff) / 2;
  const teamBPointDiff = (perfB1.avgPointDiff + perfB2.avgPointDiff) / 2;
  const pointDiffModifier = Math.max(-0.06, Math.min(0.06, (teamAPointDiff - teamBPointDiff) * 0.01));

  // 6. Net Differential and Logistic Win Probability
  const netDiff = (baseStrengthA - baseStrengthB) + (synergyA - synergyB) + h2hModifier + pointDiffModifier;

  // Sigmoid formula: P_A = 1 / (1 + e^(-k * netDiff))
  const k = 5.2;
  const rawProbA = 1 / (1 + Math.exp(-k * netDiff));

  // Clamp between 12% and 88% to maintain exciting odds
  const clampedProbA = Math.max(0.12, Math.min(0.88, rawProbA));
  const teamAWinProb = Math.round(clampedProbA * 100);
  const teamBWinProb = 100 - teamAWinProb;

  // Gay Rate for this match is the probability of defeat (taking the bottom)
  const teamAGayRate = teamBWinProb;
  const teamBGayRate = teamAWinProb;

  // Historical averages
  const historicalTeamAWinRate = Number(((perfA1.winRate + perfA2.winRate) / 2).toFixed(1));
  const historicalTeamBWinRate = Number(((perfB1.winRate + perfB2.winRate) / 2).toFixed(1));
  const historicalTeamAGayRate = Number(((perfA1.gayRate + perfA2.gayRate) / 2).toFixed(1));
  const historicalTeamBGayRate = Number(((perfB1.gayRate + perfB2.gayRate) / 2).toFixed(1));

  // Confidence estimation
  const totalRelevantMatches = perfA1.totalMatches + perfA2.totalMatches + perfB1.totalMatches + perfB2.totalMatches;
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'NEW' = 'LOW';
  if (totalRelevantMatches >= 24) confidence = 'HIGH';
  else if (totalRelevantMatches >= 10) confidence = 'MEDIUM';
  else if (totalRelevantMatches >= 4) confidence = 'LOW';
  else confidence = 'NEW';

  return {
    teamAWinProb,
    teamBWinProb,
    teamAGayRate,
    teamBGayRate,
    historicalTeamAWinRate,
    historicalTeamBWinRate,
    historicalTeamAGayRate,
    historicalTeamBGayRate,
    totalMatchesEvaluated: completedMatches.length,
    confidence,
    headToHead: {
      teamAWins: h2hAWins,
      teamBWins: h2hBWins,
      totalEncounters: totalH2H,
    },
    synergy: {
      duoAPlayed,
      duoAWins,
      duoBPlayed,
      duoBWins,
    },
    players: {
      a1: perfA1,
      a2: perfA2,
      b1: perfB1,
      b2: perfB2,
    },
  };
}
