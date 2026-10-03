import { Member, Match, Session, PlayerStats, WinningTeam } from './types';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

const LOCAL_STORAGE_MEMBERS_KEY = 'badminton_local_members';
const LOCAL_STORAGE_SESSIONS_KEY = 'badminton_local_sessions';
const LOCAL_STORAGE_MATCHES_KEY = 'badminton_local_matches';

const DEFAULT_MEMBERS: Member[] = [
  { id: '11111111-1111-4111-a111-111111111111', name: 'Chethan', nickname: 'Smash Master', avatar_color: '#10b981', created_at: new Date().toISOString() },
  { id: '22222222-2222-4222-a222-222222222222', name: 'Ganja', nickname: 'Drop Specialist', avatar_color: '#3b82f6', created_at: new Date().toISOString() },
  { id: '33333333-3333-4333-a333-333333333333', name: 'Suhas', nickname: 'Net Wizard', avatar_color: '#f59e0b', created_at: new Date().toISOString() },
  { id: '44444444-4444-4444-a444-444444444444', name: 'Gay Prateek', nickname: 'Rocket Serve', avatar_color: '#ec4899', created_at: new Date().toISOString() },
  { id: '55555555-5555-4555-a555-555555555555', name: 'Chandan', nickname: 'Court Beast', avatar_color: '#8b5cf6', created_at: new Date().toISOString() },
  { id: '66666666-6666-4666-a666-666666666666', name: 'Royden', nickname: 'Iron Wall', avatar_color: '#06b6d4', created_at: new Date().toISOString() },
];

function getLocalMembers(): Member[] {
  if (typeof window === 'undefined') return DEFAULT_MEMBERS;
  const raw = localStorage.getItem(LOCAL_STORAGE_MEMBERS_KEY);
  if (!raw) {
    localStorage.setItem(LOCAL_STORAGE_MEMBERS_KEY, JSON.stringify(DEFAULT_MEMBERS));
    return DEFAULT_MEMBERS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_MEMBERS;
  }
}

function saveLocalMembers(members: Member[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_MEMBERS_KEY, JSON.stringify(members));
  }
}

function getLocalSessions(): Session[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalSessions(sessions: Session[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(sessions));
  }
}

function getLocalMatches(): Match[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(LOCAL_STORAGE_MATCHES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalMatches(matches: Match[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_MATCHES_KEY, JSON.stringify(matches));
  }
}

export const dataService = {
  // Check if live Supabase is active
  isLive(): boolean {
    return isSupabaseConfigured();
  },

  // 1. Members
  async getMembers(): Promise<Member[]> {
    if (this.isLive()) {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client.from('members').select('*').order('created_at', { ascending: true });
        if (!error && data) {
          if (data.length === 0) {
            // Seed default members if table is fresh
            await client.from('members').insert(
              DEFAULT_MEMBERS.map(({ name, nickname, avatar_color }) => ({ name, nickname, avatar_color }))
            );
            const { data: refetched } = await client.from('members').select('*').order('created_at', { ascending: true });
            return refetched || [];
          }
          return data as Member[];
        }
      } catch (err) {
        console.warn('Supabase fetch members failed, falling back to local store:', err);
      }
    }
    return getLocalMembers();
  },

  async addMember(name: string, nickname?: string, avatarColor?: string): Promise<Member> {
    const newMember: Member = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mem_${Date.now()}`,
      name: name.trim(),
      nickname: nickname?.trim() || null,
      avatar_color: avatarColor || '#10b981',
      created_at: new Date().toISOString(),
    };

    if (this.isLive()) {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client
          .from('members')
          .insert({ name: newMember.name, nickname: newMember.nickname, avatar_color: newMember.avatar_color })
          .select()
          .single();
        if (!error && data) {
          return data as Member;
        }
      } catch (err) {
        console.warn('Supabase addMember failed, using local store:', err);
      }
    }

    const members = getLocalMembers();
    members.push(newMember);
    saveLocalMembers(members);
    return newMember;
  },

  async updateMember(id: string, updates: { name: string; nickname?: string | null; avatar_color?: string }): Promise<Member> {
    if (this.isLive()) {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client
          .from('members')
          .update({
            name: updates.name.trim(),
            nickname: updates.nickname?.trim() || null,
            avatar_color: updates.avatar_color,
          })
          .eq('id', id)
          .select()
          .single();
        if (!error && data) {
          return data as Member;
        }
      } catch (err) {
        console.warn('Supabase updateMember failed, using local store:', err);
      }
    }

    const members = getLocalMembers();
    const idx = members.findIndex((m) => m.id === id);
    if (idx !== -1) {
      members[idx] = {
        ...members[idx],
        name: updates.name.trim(),
        nickname: updates.nickname?.trim() || null,
        avatar_color: updates.avatar_color || members[idx].avatar_color,
      };
      saveLocalMembers(members);
      return members[idx];
    }
    throw new Error('Member not found');
  },

  async deleteMember(id: string): Promise<boolean> {
    if (this.isLive()) {
      try {
        const client = getSupabaseClient();
        const { error } = await client.from('members').delete().eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase deleteMember failed, using local store:', err);
      }
    }

    const members = getLocalMembers().filter((m) => m.id !== id);
    saveLocalMembers(members);
    return true;
  },

  // 2. Sessions
  async getOrCreateTodaySession(location: string = 'Local Court'): Promise<Session> {
    const today = new Date().toISOString().split('T')[0];

    if (this.isLive()) {
      try {
        const client = getSupabaseClient();
        const { data: existing, error } = await client
          .from('sessions')
          .select('*')
          .eq('session_date', today)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && existing) {
          return existing as Session;
        }

        const { data: created, error: createErr } = await client
          .from('sessions')
          .insert({ session_date: today, location })
          .select()
          .single();

        if (!createErr && created) {
          return created as Session;
        }
      } catch (err) {
        console.warn('Supabase session fetch/create failed, using local store:', err);
      }
    }

    const sessions = getLocalSessions();
    const existing = sessions.find((s) => s.session_date === today);
    if (existing) return existing;

    const newSession: Session = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sess_${Date.now()}`,
      session_date: today,
      location,
      created_at: new Date().toISOString(),
    };
    sessions.unshift(newSession);
    saveLocalSessions(sessions);
    return newSession;
  },

  async getAllSessions(): Promise<Session[]> {
    if (this.isLive()) {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client.from('sessions').select('*').order('session_date', { ascending: false });
        if (!error && data) return data as Session[];
      } catch (err) {
        console.warn('Supabase getAllSessions failed, using local store:', err);
      }
    }
    return getLocalSessions();
  },

  // 3. Matches
  async getMatchesBySession(sessionId: string): Promise<Match[]> {
    if (this.isLive()) {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client
          .from('matches')
          .select('*')
          .eq('session_id', sessionId)
          .order('round_number', { ascending: true });
        if (!error && data) return data as Match[];
      } catch (err) {
        console.warn('Supabase getMatchesBySession failed, using local store:', err);
      }
    }
    return getLocalMatches().filter((m) => m.session_id === sessionId);
  },

  async getAllMatches(): Promise<Match[]> {
    if (this.isLive()) {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client.from('matches').select('*').order('round_number', { ascending: true });
        if (!error && data) return data as Match[];
      } catch (err) {
        console.warn('Supabase getAllMatches failed, using local store:', err);
      }
    }
    return getLocalMatches();
  },

  async createMatches(matchesToCreate: Array<Omit<Match, 'id' | 'created_at'>>): Promise<Match[]> {
    if (this.isLive()) {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client.from('matches').insert(matchesToCreate).select();
        if (!error && data) return data as Match[];
      } catch (err) {
        console.warn('Supabase createMatches failed, using local store:', err);
      }
    }

    const currentMatches = getLocalMatches();
    const newItems: Match[] = matchesToCreate.map((m) => ({
      ...m,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    }));
    currentMatches.push(...newItems);
    saveLocalMatches(currentMatches);
    return newItems;
  },

  async updateMatch(
    matchId: string,
    updates: { score_team_a?: number; score_team_b?: number; winning_team?: WinningTeam }
  ): Promise<Match> {
    if (this.isLive()) {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client.from('matches').update(updates).eq('id', matchId).select().single();
        if (!error && data) return data as Match;
      } catch (err) {
        console.warn('Supabase updateMatch failed, using local store:', err);
      }
    }

    const matches = getLocalMatches();
    const idx = matches.findIndex((m) => m.id === matchId);
    if (idx !== -1) {
      matches[idx] = { ...matches[idx], ...updates };
      saveLocalMatches(matches);
      return matches[idx];
    }
    throw new Error('Match not found');
  },

  async deleteMatch(matchId: string): Promise<boolean> {
    if (this.isLive()) {
      try {
        const client = getSupabaseClient();
        const { error } = await client.from('matches').delete().eq('id', matchId);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase deleteMatch failed, using local store:', err);
      }
    }

    const matches = getLocalMatches().filter((m) => m.id !== matchId);
    saveLocalMatches(matches);
    return true;
  },

  async clearSessionMatches(sessionId: string): Promise<boolean> {
    if (this.isLive()) {
      try {
        const client = getSupabaseClient();
        const { error } = await client.from('matches').delete().eq('session_id', sessionId);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase clearSessionMatches failed, using local store:', err);
      }
    }

    const matches = getLocalMatches().filter((m) => m.session_id !== sessionId);
    saveLocalMatches(matches);
    return true;
  },

  // 4. Leaderboard Statistics
  async getLeaderboard(sessionId?: string): Promise<PlayerStats[]> {
    const members = await this.getMembers();
    const matches = sessionId ? await this.getMatchesBySession(sessionId) : await this.getAllMatches();

    const statsMap: Record<string, PlayerStats> = {};

    members.forEach((m) => {
      statsMap[m.id] = {
        member_id: m.id,
        name: m.name,
        nickname: m.nickname,
        total_matches: 0,
        wins: 0,
        losses: 0,
        win_rate: 0,
        total_points_scored: 0,
        total_points_conceded: 0,
      };
    });

    matches.forEach((match) => {
      if (match.winning_team === 'PENDING') return;

      const teamAPlayers = [match.team_a_player1_id, match.team_a_player2_id];
      const teamBPlayers = [match.team_b_player1_id, match.team_b_player2_id];

      const aWon = match.winning_team === 'TEAM_A';
      const bWon = match.winning_team === 'TEAM_B';

      teamAPlayers.forEach((pid) => {
        if (statsMap[pid]) {
          statsMap[pid].total_matches += 1;
          statsMap[pid].total_points_scored = (statsMap[pid].total_points_scored || 0) + match.score_team_a;
          statsMap[pid].total_points_conceded = (statsMap[pid].total_points_conceded || 0) + match.score_team_b;
          if (aWon) statsMap[pid].wins += 1;
          else if (bWon) statsMap[pid].losses += 1;
        }
      });

      teamBPlayers.forEach((pid) => {
        if (statsMap[pid]) {
          statsMap[pid].total_matches += 1;
          statsMap[pid].total_points_scored = (statsMap[pid].total_points_scored || 0) + match.score_team_b;
          statsMap[pid].total_points_conceded = (statsMap[pid].total_points_conceded || 0) + match.score_team_a;
          if (bWon) statsMap[pid].wins += 1;
          else if (aWon) statsMap[pid].losses += 1;
        }
      });
    });

    // Compute win rates and sort
    const result = Object.values(statsMap).map((stat) => {
      const winRate = stat.total_matches > 0 ? Number(((stat.wins / stat.total_matches) * 100).toFixed(1)) : 0;
      return {
        ...stat,
        win_rate: winRate,
      };
    });

    // Sort by wins DESC, win_rate DESC, point difference DESC
    return result.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.win_rate !== a.win_rate) return b.win_rate - a.win_rate;
      const diffA = (a.total_points_scored || 0) - (a.total_points_conceded || 0);
      const diffB = (b.total_points_scored || 0) - (b.total_points_conceded || 0);
      return diffB - diffA;
    });
  },
};
