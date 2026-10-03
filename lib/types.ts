export type WinningTeam = 'TEAM_A' | 'TEAM_B' | 'PENDING';

export interface Member {
  id: string;
  name: string;
  nickname?: string | null;
  created_at?: string;
  avatar_color?: string;
}

export interface Session {
  id: string;
  session_date: string; // YYYY-MM-DD
  location: string;
  created_at?: string;
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
