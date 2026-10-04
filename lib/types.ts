export type WinningTeam = 'TEAM_A' | 'TEAM_B' | 'PENDING';

export interface Member {
  id: string;
  name: string;
  nickname?: string | null;
  created_at?: string;
  avatar_color?: string;
  avatar_url?: string | null;
}

export interface Session {
  id: string;
  session_date: string; // YYYY-MM-DD
  location: string;
  created_at?: string;
  status?: 'ACTIVE' | 'COMPLETED';
}

export interface SessionHistoryItem {
  session: Session;
  matches: MatchWithPlayers[];
  totalRounds: number;
  completedRounds: number;
  topWinners: Array<{ name: string; wins: number; color?: string }>;
}

export interface Match {
  id: string;
  session_id: string;
  round_number: number;
  court_number?: number;
  team_a_player1_id: string;
  team_a_player2_id: string;
  team_b_player1_id: string;
  team_b_player2_id: string;
  score_team_a: number;
  score_team_b: number;
  winning_team: WinningTeam;
  created_at?: string;
}

export interface MatchWithPlayers extends Match {
  team_a_player1?: Member;
  team_a_player2?: Member;
  team_b_player1?: Member;
  team_b_player2?: Member;
  session?: Session;
}

export interface PlayerStats {
  member_id: string;
  name: string;
  nickname?: string | null;
  avatar_color?: string;
  avatar_url?: string | null;
  total_matches: number;
  wins: number;
  losses: number;
  win_rate: number; // percentage e.g. 66.7
  total_points_scored?: number;
  total_points_conceded?: number;
}

export interface MatchmakingRequest {
  playerIds: string[];
  targetMatchesPerPlayer?: number;
  totalRounds?: number;
  numberOfCourts?: number;
  existingMatches?: Match[];
}

export interface GeneratedMatch {
  round_number: number;
  court_number: number;
  team_a_player1_id: string;
  team_a_player2_id: string;
  team_b_player1_id: string;
  team_b_player2_id: string;
  resting_player_ids: string[];
  penalty_score?: number;
}

export interface MatchmakingResult {
  totalMatches: number;
  matches: GeneratedMatch[];
  playerMatchCounts: Record<string, number>;
  playerPairCounts: Record<string, number>;
  fairnessScore: number;
}

export interface PartnerStats {
  partnerId: string;
  partnerName: string;
  partnerNickname?: string | null;
  partnerAvatarColor?: string;
  partnerAvatarUrl?: string | null;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  pointsScored: number;
  pointsConceded: number;
  pointDiff: number;
}

export interface OpponentStats {
  opponentId: string;
  opponentName: string;
  opponentNickname?: string | null;
  opponentAvatarColor?: string;
  opponentAvatarUrl?: string | null;
  matchesPlayed: number;
  winsAgainst: number;
  lossesAgainst: number;
  winRate: number;
  pointsScored: number;
  pointsConceded: number;
  pointDiff: number;
}

export interface PlayerDeepStats {
  member: Member;
  summary: {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
    gayRate: number;
    totalPointsScored: number;
    totalPointsConceded: number;
    pointDiff: number;
    avgPointsScored: number;
    avgPointsConceded: number;
    currentStreak: { type: 'WIN' | 'LOSS' | 'NONE'; count: number };
    longestWinStreak: number;
    longestLossStreak: number;
    recentForm: Array<'W' | 'L'>;
  };
  partnerships: {
    all: PartnerStats[];
    bestPartner: PartnerStats | null;
    mostFrequentPartner: PartnerStats | null;
    worstPartner: PartnerStats | null;
  };
  opponents: {
    all: OpponentStats[];
    favoriteOpponent: OpponentStats | null;
    toughestNemesis: OpponentStats | null;
  };
  recentMatches: Array<{
    match: Match;
    sessionDate: string;
    partner: Member | null;
    opponents: [Member | null, Member | null];
    isWin: boolean;
    myScore: number;
    opponentScore: number;
  }>;
}

