import { 
  Member, 
  Match, 
  MatchWithPlayers, 
  Session, 
  SessionHistoryItem, 
  PlayerStats, 
  WinningTeam,
  PartnerStats,
  OpponentStats,
  PlayerDeepStats
} from './types';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

const LOCAL_STORAGE_MEMBERS_KEY = 'badminton_local_members';
const LOCAL_STORAGE_SESSIONS_KEY = 'badminton_local_sessions';
const LOCAL_STORAGE_MATCHES_KEY = 'badminton_local_matches';
const LOCAL_STORAGE_COMPLETED_SESSIONS_KEY = 'badminton_completed_sessions_ids';
const LOCAL_STORAGE_AVATARS_KEY = 'badminton_member_avatars';

function getLocalAvatarUrls(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem(LOCAL_STORAGE_AVATARS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveLocalAvatarUrl(memberId: string, url: string | null) {
  if (typeof window !== 'undefined') {
    const map = getLocalAvatarUrls();
    if (url) {
      map[memberId] = url;
    } else {
      delete map[memberId];
    }
    localStorage.setItem(LOCAL_STORAGE_AVATARS_KEY, JSON.stringify(map));
  }
}

function getCompletedSessionIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const raw = localStorage.getItem(LOCAL_STORAGE_COMPLETED_SESSIONS_KEY);
  if (!raw) return new Set();
  try {
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function addCompletedSessionId(id: string) {
  if (typeof window !== 'undefined') {
    const set = getCompletedSessionIds();
    set.add(id);
    localStorage.setItem(LOCAL_STORAGE_COMPLETED_SESSIONS_KEY, JSON.stringify(Array.from(set)));
  }
}

const DATA_VERSION_KEY = 'badminton_data_version';
const CURRENT_DATA_VERSION = '2026-10-03-real-v1';

function checkDataVersionMigration() {
  if (typeof window === 'undefined') return;
  const version = localStorage.getItem(DATA_VERSION_KEY);
  if (version !== CURRENT_DATA_VERSION) {
    // Clear out old mock sessions and matches so yesterday's real match data takes precedence
    localStorage.removeItem(LOCAL_STORAGE_SESSIONS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_MATCHES_KEY);
    localStorage.removeItem(LOCAL_STORAGE_COMPLETED_SESSIONS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_MEMBERS_KEY);
    localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
  }
}

const DEFAULT_MEMBERS: Member[] = [
  { id: 'ee7c5536-ffa3-479d-8fcf-8e824ee15731', name: 'Chethan', nickname: 'Smash Master', avatar_color: '#10b981', created_at: '2026-10-03T11:35:21.678Z' },
  { id: 'b01cf49f-fdab-4b14-801b-d3b5a3b9f990', name: 'Ganja', nickname: 'Drop Specialist', avatar_color: '#3b82f6', created_at: '2026-10-03T11:35:21.678Z' },
  { id: '3564eb2c-33dd-4fa3-987a-6f322e5e1835', name: 'Suhas', nickname: 'Net Wizard', avatar_color: '#f59e0b', created_at: '2026-10-03T11:35:21.678Z' },
  { id: 'a6081e2b-b2d7-4cd1-98c0-b516b18ed164', name: 'Gay Prateek', nickname: 'Rocket Serve', avatar_color: '#ec4899', created_at: '2026-10-03T11:35:21.678Z' },
  { id: '6f151239-eeff-4830-b412-588a3a5984d1', name: 'Chandan', nickname: 'Court Beast', avatar_color: '#8b5cf6', created_at: '2026-10-03T11:35:21.678Z' },
  { id: 'f3928f2c-30aa-40aa-b664-403305462f2c', name: 'Royden', nickname: 'Iron Wall', avatar_color: '#06b6d4', created_at: '2026-10-03T11:35:21.678Z' },
];

const DEFAULT_SESSIONS: Session[] = [
  {
    id: 'c1234567-0000-0000-0000-202610030000',
    session_date: '2026-10-03',
    location: 'Smash O Station / Court [COMPLETED]',
    status: 'COMPLETED',
    created_at: '2026-10-03T11:35:37.000Z'
  }
];

const DEFAULT_MATCHES: Match[] = [
  {
    id: 'm-20261003-r1',
    session_id: 'c1234567-0000-0000-0000-202610030000',
    round_number: 1,
    team_a_player1_id: 'ee7c5536-ffa3-479d-8fcf-8e824ee15731', // Chethan
    team_a_player2_id: 'b01cf49f-fdab-4b14-801b-d3b5a3b9f990', // Ganja
    team_b_player1_id: '3564eb2c-33dd-4fa3-987a-6f322e5e1835', // Suhas
    team_b_player2_id: 'a6081e2b-b2d7-4cd1-98c0-b516b18ed164', // Gay Prateek
    score_team_a: 21,
    score_team_b: 15,
    winning_team: 'TEAM_A',
    created_at: '2026-10-03T12:00:00.000Z'
  },
  {
    id: 'm-20261003-r2',
    session_id: 'c1234567-0000-0000-0000-202610030000',
    round_number: 2,
    team_a_player1_id: '6f151239-eeff-4830-b412-588a3a5984d1', // Chandan
    team_a_player2_id: 'f3928f2c-30aa-40aa-b664-403305462f2c', // Royden
    team_b_player1_id: 'ee7c5536-ffa3-479d-8fcf-8e824ee15731', // Chethan
    team_b_player2_id: '3564eb2c-33dd-4fa3-987a-6f322e5e1835', // Suhas
    score_team_a: 15,
    score_team_b: 21,
    winning_team: 'TEAM_B',
    created_at: '2026-10-03T12:15:00.000Z'
  },
  {
    id: 'm-20261003-r3',
    session_id: 'c1234567-0000-0000-0000-202610030000',
    round_number: 3,
    team_a_player1_id: 'b01cf49f-fdab-4b14-801b-d3b5a3b9f990', // Ganja
    team_a_player2_id: 'a6081e2b-b2d7-4cd1-98c0-b516b18ed164', // Gay Prateek
    team_b_player1_id: '6f151239-eeff-4830-b412-588a3a5984d1', // Chandan
    team_b_player2_id: 'ee7c5536-ffa3-479d-8fcf-8e824ee15731', // Chethan
    score_team_a: 15,
    score_team_b: 21,
    winning_team: 'TEAM_B',
    created_at: '2026-10-03T12:30:00.000Z'
  },
  {
    id: 'm-20261003-r4',
    session_id: 'c1234567-0000-0000-0000-202610030000',
    round_number: 4,
    team_a_player1_id: '3564eb2c-33dd-4fa3-987a-6f322e5e1835', // Suhas
    team_a_player2_id: 'f3928f2c-30aa-40aa-b664-403305462f2c', // Royden
    team_b_player1_id: 'b01cf49f-fdab-4b14-801b-d3b5a3b9f990', // Ganja
    team_b_player2_id: '6f151239-eeff-4830-b412-588a3a5984d1', // Chandan
    score_team_a: 21,
    score_team_b: 15,
    winning_team: 'TEAM_A',
    created_at: '2026-10-03T12:45:00.000Z'
  },
  {
    id: 'm-20261003-r5',
    session_id: 'c1234567-0000-0000-0000-202610030000',
    round_number: 5,
    team_a_player1_id: 'a6081e2b-b2d7-4cd1-98c0-b516b18ed164', // Gay Prateek
    team_a_player2_id: 'ee7c5536-ffa3-479d-8fcf-8e824ee15731', // Chethan
    team_b_player1_id: '3564eb2c-33dd-4fa3-987a-6f322e5e1835', // Suhas
    team_b_player2_id: 'f3928f2c-30aa-40aa-b664-403305462f2c', // Royden
    score_team_a: 15,
    score_team_b: 21,
    winning_team: 'TEAM_B',
    created_at: '2026-10-03T13:00:00.000Z'
  },
  {
    id: 'm-20261003-r6',
    session_id: 'c1234567-0000-0000-0000-202610030000',
    round_number: 6,
    team_a_player1_id: 'f3928f2c-30aa-40aa-b664-403305462f2c', // Royden
    team_a_player2_id: 'a6081e2b-b2d7-4cd1-98c0-b516b18ed164', // Gay Prateek
    team_b_player1_id: 'b01cf49f-fdab-4b14-801b-d3b5a3b9f990', // Ganja
    team_b_player2_id: '6f151239-eeff-4830-b412-588a3a5984d1', // Chandan
    score_team_a: 15,
    score_team_b: 21,
    winning_team: 'TEAM_B',
    created_at: '2026-10-03T13:15:00.000Z'
  },
  {
    id: 'm-20261003-r7',
    session_id: 'c1234567-0000-0000-0000-202610030000',
    round_number: 7,
    team_a_player1_id: 'ee7c5536-ffa3-479d-8fcf-8e824ee15731', // Chethan
    team_a_player2_id: 'f3928f2c-30aa-40aa-b664-403305462f2c', // Royden
    team_b_player1_id: 'a6081e2b-b2d7-4cd1-98c0-b516b18ed164', // Gay Prateek
    team_b_player2_id: '6f151239-eeff-4830-b412-588a3a5984d1', // Chandan
    score_team_a: 21,
    score_team_b: 15,
    winning_team: 'TEAM_A',
    created_at: '2026-10-03T13:30:00.000Z'
  },
  {
    id: 'm-20261003-r8',
    session_id: 'c1234567-0000-0000-0000-202610030000',
    round_number: 8,
    team_a_player1_id: 'b01cf49f-fdab-4b14-801b-d3b5a3b9f990', // Ganja
    team_a_player2_id: '3564eb2c-33dd-4fa3-987a-6f322e5e1835', // Suhas
    team_b_player1_id: 'a6081e2b-b2d7-4cd1-98c0-b516b18ed164', // Gay Prateek
    team_b_player2_id: 'f3928f2c-30aa-40aa-b664-403305462f2c', // Royden
    score_team_a: 21,
    score_team_b: 15,
    winning_team: 'TEAM_A',
    created_at: '2026-10-03T13:45:00.000Z'
  },
  {
    id: 'm-20261003-r9',
    session_id: 'c1234567-0000-0000-0000-202610030000',
    round_number: 9,
    team_a_player1_id: 'ee7c5536-ffa3-479d-8fcf-8e824ee15731', // Chethan
    team_a_player2_id: 'b01cf49f-fdab-4b14-801b-d3b5a3b9f990', // Ganja
    team_b_player1_id: '3564eb2c-33dd-4fa3-987a-6f322e5e1835', // Suhas
    team_b_player2_id: '6f151239-eeff-4830-b412-588a3a5984d1', // Chandan
    score_team_a: 21,
    score_team_b: 15,
    winning_team: 'TEAM_A',
    created_at: '2026-10-03T14:00:00.000Z'
  },
  {
    id: 'm-20261003-r10',
    session_id: 'c1234567-0000-0000-0000-202610030000',
    round_number: 10,
    team_a_player1_id: '3564eb2c-33dd-4fa3-987a-6f322e5e1835', // Suhas
    team_a_player2_id: 'f3928f2c-30aa-40aa-b664-403305462f2c', // Royden
    team_b_player1_id: '6f151239-eeff-4830-b412-588a3a5984d1', // Chandan
    team_b_player2_id: 'b01cf49f-fdab-4b14-801b-d3b5a3b9f990', // Ganja
    score_team_a: 15,
    score_team_b: 21,
    winning_team: 'TEAM_B',
    created_at: '2026-10-03T14:15:00.000Z'
  }
];

function getLocalMembers(): Member[] {
  checkDataVersionMigration();
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
  checkDataVersionMigration();
  if (typeof window === 'undefined') return DEFAULT_SESSIONS;
  const raw = localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY);
  if (!raw) {
    localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(DEFAULT_SESSIONS));
    return DEFAULT_SESSIONS;
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed.length > 0 ? parsed : DEFAULT_SESSIONS;
  } catch {
    return DEFAULT_SESSIONS;
  }
}

function saveLocalSessions(sessions: Session[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(sessions));
  }
}

function getLocalMatches(): Match[] {
  checkDataVersionMigration();
  if (typeof window === 'undefined') return DEFAULT_MATCHES;
  const raw = localStorage.getItem(LOCAL_STORAGE_MATCHES_KEY);
  if (!raw) {
    localStorage.setItem(LOCAL_STORAGE_MATCHES_KEY, JSON.stringify(DEFAULT_MATCHES));
    return DEFAULT_MATCHES;
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed.length > 0 ? parsed : DEFAULT_MATCHES;
  } catch {
    return DEFAULT_MATCHES;
  }
}

function saveLocalMatches(matches: Match[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_MATCHES_KEY, JSON.stringify(matches));
  }
}

// =========================================================
// High-Performance In-Memory Cache & Request Deduplication
// Completely removes redundant Supabase calls and delivers sub-50ms instant UI responses.
// =========================================================
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL_MS = 60 * 1000; // 60 seconds fresh TTL
const memoryCache = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();

export function getCachedData<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCachedData<T>(key: string, data: T) {
  memoryCache.set(key, { data, timestamp: Date.now() });
}

export function invalidateDataCache(keyPattern?: string) {
  if (!keyPattern) {
    memoryCache.clear();
  } else {
    for (const k of Array.from(memoryCache.keys())) {
      if (k.includes(keyPattern)) {
        memoryCache.delete(k);
      }
    }
  }
}

async function dedupe<T>(key: string, fetcher: () => Promise<T>, forceRefresh = false): Promise<T> {
  if (!forceRefresh) {
    const cached = getCachedData<T>(key);
    if (cached !== null) return cached;
  } else {
    memoryCache.delete(key);
  }

  const existingPromise = inFlightRequests.get(key);
  if (existingPromise) {
    return existingPromise as Promise<T>;
  }

  const requestPromise = (async () => {
    try {
      const res = await fetcher();
      setCachedData(key, res);
      return res;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, requestPromise);
  return requestPromise;
}

export const dataService = {
  // Check if live Supabase is active
  isLive(): boolean {
    return isSupabaseConfigured();
  },

  // Manual cache invalidation
  clearCache(): void {
    invalidateDataCache();
  },

  // 1. Members
  async getMembers(forceRefresh = false): Promise<Member[]> {
    return dedupe('members', async () => {
      const localAvatars = getLocalAvatarUrls();

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
              return (refetched || []).map((m: any) => ({
                ...m,
                avatar_url: m.avatar_url || localAvatars[m.id] || null,
              }));
            }
            return data.map((m: any) => ({
              ...m,
              avatar_url: m.avatar_url || localAvatars[m.id] || null,
            })) as Member[];
          }
        } catch (err) {
          console.warn('Supabase fetch members failed, falling back to local store:', err);
        }
      }
      return getLocalMembers().map((m) => ({
        ...m,
        avatar_url: m.avatar_url || localAvatars[m.id] || null,
      }));
    }, forceRefresh);
  },

  async addMember(name: string, nickname?: string, avatarColor?: string, avatarUrl?: string | null): Promise<Member> {
    const newMember: Member = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mem_${Date.now()}`,
      name: name.trim(),
      nickname: nickname?.trim() || null,
      avatar_color: avatarColor || '#10b981',
      avatar_url: avatarUrl || null,
      created_at: new Date().toISOString(),
    };

    if (avatarUrl) {
      saveLocalAvatarUrl(newMember.id, avatarUrl);
    }

    if (this.isLive()) {
      try {
        const client = getSupabaseClient();
        // First attempt with avatar_url
        let inserted: Member | null = null;
        try {
          const res = await client
            .from('members')
            .insert({ name: newMember.name, nickname: newMember.nickname, avatar_color: newMember.avatar_color, avatar_url: newMember.avatar_url })
            .select()
            .single();
          if (!res.error && res.data) inserted = res.data as Member;
        } catch {
          // Fallback if avatar_url column does not exist in Supabase table
        }

        if (!inserted) {
          const res = await client
            .from('members')
            .insert({ name: newMember.name, nickname: newMember.nickname, avatar_color: newMember.avatar_color })
            .select()
            .single();
          if (!res.error && res.data) {
            inserted = { ...(res.data as Member), avatar_url: newMember.avatar_url };
          }
        }

        if (inserted) {
          invalidateDataCache('member');
          invalidateDataCache('leaderboard');
          invalidateDataCache('stats');
          return { ...inserted, avatar_url: newMember.avatar_url };
        }
      } catch (err) {
        console.warn('Supabase addMember failed, using local store:', err);
      }
    }

    const members = getLocalMembers();
    members.push(newMember);
    saveLocalMembers(members);
    invalidateDataCache('member');
    invalidateDataCache('leaderboard');
    invalidateDataCache('stats');
    return newMember;
  },

  async updateMember(
    id: string, 
    updates: { name: string; nickname?: string | null; avatar_color?: string; avatar_url?: string | null }
  ): Promise<Member> {
    if (updates.avatar_url !== undefined) {
      saveLocalAvatarUrl(id, updates.avatar_url);
    }

    if (this.isLive()) {
      try {
        const client = getSupabaseClient();
        let updated: Member | null = null;
        // Attempt update with avatar_url
        try {
          const res = await client
            .from('members')
            .update({
              name: updates.name.trim(),
              nickname: updates.nickname?.trim() || null,
              avatar_color: updates.avatar_color,
              avatar_url: updates.avatar_url,
            })
            .eq('id', id)
            .select()
            .single();
          if (!res.error && res.data) updated = res.data as Member;
        } catch {
          // Fallback if avatar_url column does not exist
        }

        if (!updated) {
          const res = await client
            .from('members')
            .update({
              name: updates.name.trim(),
              nickname: updates.nickname?.trim() || null,
              avatar_color: updates.avatar_color,
            })
            .eq('id', id)
            .select()
            .single();
          if (!res.error && res.data) {
            updated = { ...(res.data as Member), avatar_url: updates.avatar_url };
          }
        }

        if (updated) {
          invalidateDataCache('member');
          invalidateDataCache('leaderboard');
          invalidateDataCache('stats');
          return { ...updated, avatar_url: updates.avatar_url !== undefined ? updates.avatar_url : updated.avatar_url };
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
        avatar_url: updates.avatar_url !== undefined ? updates.avatar_url : members[idx].avatar_url,
      };
      saveLocalMembers(members);
      invalidateDataCache('member');
      invalidateDataCache('leaderboard');
      invalidateDataCache('stats');
      return members[idx];
    }
    throw new Error('Member not found');
  },

  async deleteMember(id: string): Promise<boolean> {
    if (this.isLive()) {
      try {
        const client = getSupabaseClient();
        const { error } = await client.from('members').delete().eq('id', id);
        if (!error) {
          invalidateDataCache('member');
          invalidateDataCache('leaderboard');
          invalidateDataCache('stats');
          return true;
        }
      } catch (err) {
        console.warn('Supabase deleteMember failed, using local store:', err);
      }
    }

    const members = getLocalMembers().filter((m) => m.id !== id);
    saveLocalMembers(members);
    invalidateDataCache('member');
    invalidateDataCache('leaderboard');
    invalidateDataCache('stats');
    return true;
  },

  // 2. Sessions
  async getOrCreateTodaySession(location: string = 'Local Court'): Promise<Session> {
    const today = new Date().toISOString().split('T')[0];
    const completedIds = getCompletedSessionIds();

    if (this.isLive()) {
      try {
        const client = getSupabaseClient();
        const { data: existingList, error } = await client
          .from('sessions')
          .select('*')
          .eq('session_date', today)
          .order('created_at', { ascending: false });

        if (!error && existingList && existingList.length > 0) {
          // Look for an active session (not marked completed)
          const activeSession = existingList.find((s: any) => 
            s.status !== 'COMPLETED' && 
            !completedIds.has(s.id) && 
            !s.location?.includes('[COMPLETED]')
          );

          if (activeSession) {
            return activeSession as Session;
          }
        }

        // If all today's sessions are completed, create a fresh active session
        // First try inserting with status: 'ACTIVE', fallback to standard insert if status column does not exist
        let createdSession: Session | null = null;
        const resWithStatus = await client
          .from('sessions')
          .insert({ session_date: today, location, status: 'ACTIVE' })
          .select()
          .single();

        if (!resWithStatus.error && resWithStatus.data) {
          createdSession = resWithStatus.data as Session;
        } else {
          const resStandard = await client
            .from('sessions')
            .insert({ session_date: today, location })
            .select()
            .single();

          if (!resStandard.error && resStandard.data) {
            createdSession = resStandard.data as Session;
          }
        }

        if (createdSession) {
          invalidateDataCache('session');
          return createdSession;
        }
      } catch (err) {
        console.warn('Supabase session fetch/create failed, using local store:', err);
      }
    }

    const sessions = getLocalSessions();
    const active = sessions.find(
      (s) => s.session_date === today && 
             s.status !== 'COMPLETED' && 
             !completedIds.has(s.id) && 
             !s.location?.includes('[COMPLETED]')
    );
    if (active) return active;

    const newSession: Session = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sess_${Date.now()}`,
      session_date: today,
      location,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    };
    sessions.unshift(newSession);
    saveLocalSessions(sessions);
    invalidateDataCache('session');
    return newSession;
  },

  async completeSession(sessionId: string): Promise<boolean> {
    const sessionMatches = await this.getMatchesBySession(sessionId);
    if (sessionMatches.length === 0 || sessionMatches.some((m) => m.winning_team === 'PENDING')) {
      throw new Error('All matches must be completed before saving this session to History.');
    }

    addCompletedSessionId(sessionId);

    if (this.isLive()) {
      try {
        const client = getSupabaseClient();
        // Try updating status
        await client
          .from('sessions')
          .update({ status: 'COMPLETED' })
          .eq('id', sessionId);

        // Also update location marker to guarantee completed state across any schema
        await client
          .from('sessions')
          .update({ location: 'Local Court [COMPLETED]' })
          .eq('id', sessionId);
      } catch (err) {
        console.warn('Supabase completeSession failed, using local store:', err);
      }
    }

    const sessions = getLocalSessions();
    const idx = sessions.findIndex((s) => s.id === sessionId);
    if (idx !== -1) {
      sessions[idx] = { 
        ...sessions[idx], 
        status: 'COMPLETED',
        location: `${(sessions[idx].location || 'Local Court').replace(' [COMPLETED]', '')} [COMPLETED]` 
      };
      saveLocalSessions(sessions);
    }
    invalidateDataCache();
    return true;
  },

  async deleteSession(sessionId: string): Promise<boolean> {
    if (this.isLive()) {
      try {
        const client = getSupabaseClient();
        await client.from('sessions').delete().eq('id', sessionId);
      } catch (err) {
        console.warn('Supabase deleteSession failed, using local store:', err);
      }
    }

    const sessions = getLocalSessions().filter((s) => s.id !== sessionId);
    saveLocalSessions(sessions);
    const matches = getLocalMatches().filter((m) => m.session_id !== sessionId);
    saveLocalMatches(matches);
    invalidateDataCache();
    return true;
  },

  async getAllSessions(forceRefresh = false): Promise<Session[]> {
    return dedupe('sessions', async () => {
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
    }, forceRefresh);
  },

  async getHistorySessions(forceRefresh = false): Promise<SessionHistoryItem[]> {
    return dedupe('history_sessions', async () => {
      const [allSessions, allMembers, allMatches] = await Promise.all([
        this.getAllSessions(),
        this.getMembers(),
        this.getAllMatches(),
      ]);

    const memberMap = new Map(allMembers.map((m) => [m.id, m]));
    const completedIds = getCompletedSessionIds();

    const matchesBySession = new Map<string, Match[]>();
    for (const match of allMatches) {
      const list = matchesBySession.get(match.session_id) || [];
      list.push(match);
      matchesBySession.set(match.session_id, list);
    }

    const historyItems: SessionHistoryItem[] = [];

    for (const session of allSessions) {
      const rawMatches = matchesBySession.get(session.id) || [];
      if (rawMatches.length === 0) continue;

      const completedRounds = rawMatches.filter((m) => m.winning_team !== 'PENDING').length;
      if (completedRounds === 0) continue;

      const isCompleted = session.status === 'COMPLETED' || 
                          completedIds.has(session.id) || 
                          session.location?.includes('[COMPLETED]') || 
                          (rawMatches.length > 0 && completedRounds === rawMatches.length);

      const populatedMatches: MatchWithPlayers[] = rawMatches
        .sort((a, b) => a.round_number - b.round_number)
        .map((m) => ({
          ...m,
          team_a_player1: memberMap.get(m.team_a_player1_id),
          team_a_player2: memberMap.get(m.team_a_player2_id),
          team_b_player1: memberMap.get(m.team_b_player1_id),
          team_b_player2: memberMap.get(m.team_b_player2_id),
          session,
        }));

      // Top performers
      const winsCount: Record<string, number> = {};
      for (const m of rawMatches) {
        if (m.winning_team === 'TEAM_A') {
          winsCount[m.team_a_player1_id] = (winsCount[m.team_a_player1_id] || 0) + 1;
          winsCount[m.team_a_player2_id] = (winsCount[m.team_a_player2_id] || 0) + 1;
        } else if (m.winning_team === 'TEAM_B') {
          winsCount[m.team_b_player1_id] = (winsCount[m.team_b_player1_id] || 0) + 1;
          winsCount[m.team_b_player2_id] = (winsCount[m.team_b_player2_id] || 0) + 1;
        }
      }

      const topWinners = Object.entries(winsCount)
        .map(([id, wins]) => ({
          name: memberMap.get(id)?.name || 'Unknown',
          color: memberMap.get(id)?.avatar_color,
          wins,
        }))
        .sort((a, b) => b.wins - a.wins);

      historyItems.push({
        session: {
          ...session,
          status: isCompleted ? 'COMPLETED' : 'ACTIVE',
        },
        matches: populatedMatches,
        totalRounds: rawMatches.length,
        completedRounds,
        topWinners,
      });
    }

    return historyItems.sort((a, b) => {
      const latestMatchA = a.matches.reduce((max, m) => {
        const t = new Date(m.created_at || 0).getTime();
        return t > max ? t : max;
      }, 0);
      const timeA = latestMatchA > 0 ? latestMatchA : new Date(a.session.created_at || a.session.session_date).getTime();

      const latestMatchB = b.matches.reduce((max, m) => {
        const t = new Date(m.created_at || 0).getTime();
        return t > max ? t : max;
      }, 0);
      const timeB = latestMatchB > 0 ? latestMatchB : new Date(b.session.created_at || b.session.session_date).getTime();

      return timeB - timeA;
    });
    }, forceRefresh);
  },

  // 3. Matches
  async getMatchesBySession(sessionId: string, forceRefresh = false): Promise<Match[]> {
    return dedupe(`matches_session_${sessionId}`, async () => {
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
    }, forceRefresh);
  },

  async getAllMatches(forceRefresh = false): Promise<Match[]> {
    return dedupe('matches_all', async () => {
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
    }, forceRefresh);
  },

  async createMatches(matchesToCreate: Array<Omit<Match, 'id' | 'created_at'>>): Promise<Match[]> {
    invalidateDataCache();
    if (this.isLive()) {
      try {
        const client = getSupabaseClient();
        const { data, error } = await client.from('matches').insert(matchesToCreate).select();
        if (error) {
          console.error('Supabase createMatches error:', error);
          throw error;
        }
        if (data) return data as Match[];
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
    invalidateDataCache();
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
    invalidateDataCache();
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
    invalidateDataCache();
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
  async getLeaderboard(sessionIdOrDate?: string, forceRefresh = false): Promise<PlayerStats[]> {
    const cacheKey = `leaderboard_${sessionIdOrDate || 'all'}`;
    return dedupe(cacheKey, async () => {
      const members = await this.getMembers();
      let matches: Match[] = [];

      if (!sessionIdOrDate) {
        matches = await this.getAllMatches();
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(sessionIdOrDate)) {
        // It's a calendar date (YYYY-MM-DD)
        const allSessions = await this.getAllSessions();
        const sessionsOnDate = new Set(
          allSessions.filter((s) => s.session_date === sessionIdOrDate).map((s) => s.id)
        );
        const allMatches = await this.getAllMatches();
        matches = allMatches.filter(
          (m) => sessionsOnDate.has(m.session_id) || (m.created_at && m.created_at.startsWith(sessionIdOrDate))
        );
      } else {
        matches = await this.getMatchesBySession(sessionIdOrDate);
      }

      const statsMap: Record<string, PlayerStats> = {};

      members.forEach((m) => {
        statsMap[m.id] = {
          member_id: m.id,
          name: m.name,
          nickname: m.nickname,
          avatar_color: m.avatar_color,
          avatar_url: m.avatar_url,
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
    }, forceRefresh);
  },

  // 5. Calendar Match Dates (dates where matches were held)
  async getDatesWithMatches(forceRefresh = false): Promise<string[]> {
    return dedupe('dates_with_matches', async () => {
      const [sessions, matches] = await Promise.all([
        this.getAllSessions(),
        this.getAllMatches(),
      ]);

      const sessionDateMap = new Map<string, string>();
      for (const s of sessions) {
        if (s.session_date) {
          sessionDateMap.set(s.id, s.session_date);
        }
      }

      const dates = new Set<string>();

      // 1. Matches played / recorded
      for (const m of matches) {
        const d = sessionDateMap.get(m.session_id) || (m.created_at ? m.created_at.split('T')[0] : null);
        if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
          dates.add(d);
        }
      }

      // 2. Sessions that have matches or completed status
      for (const s of sessions) {
        if (s.session_date && /^\d{4}-\d{2}-\d{2}$/.test(s.session_date)) {
          const hasMatches = matches.some((m) => m.session_id === s.id);
          if (hasMatches || s.status === 'COMPLETED' || s.location?.includes('[COMPLETED]')) {
            dates.add(s.session_date);
          }
        }
      }

      return Array.from(dates).sort();
    }, forceRefresh);
  },

  // 6. Deep Player Statistics (Chemistry, Duos, Opponents & Streaks)
  async getPlayerDeepStats(memberId: string, forceRefresh = false): Promise<PlayerDeepStats | null> {
    const cacheKey = `player_deep_stats_${memberId}`;
    return dedupe(cacheKey, async () => {
      const [allMembers, allSessions, allMatches] = await Promise.all([
        this.getMembers(),
        this.getAllSessions(),
        this.getAllMatches(),
      ]);

    const member = allMembers.find((m) => m.id === memberId);
    if (!member) return null;

    const memberMap = new Map(allMembers.map((m) => [m.id, m]));
    const sessionMap = new Map(allSessions.map((s) => [s.id, s]));

    // Completed matches that involve this player
    const finishedMatches = allMatches.filter(
      (m) =>
        m.winning_team !== 'PENDING' &&
        (m.team_a_player1_id === memberId ||
          m.team_a_player2_id === memberId ||
          m.team_b_player1_id === memberId ||
          m.team_b_player2_id === memberId)
    );

    // Sort chronologically (oldest to newest) to compute streaks & form correctly
    finishedMatches.sort((a, b) => {
      const sessA = sessionMap.get(a.session_id);
      const sessB = sessionMap.get(b.session_id);
      const dateA = a.created_at || (sessA?.session_date ? `${sessA.session_date}T00:00:00` : '1970-01-01');
      const dateB = b.created_at || (sessB?.session_date ? `${sessB.session_date}T00:00:00` : '1970-01-01');
      const timeDiff = new Date(dateA).getTime() - new Date(dateB).getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.round_number - b.round_number;
    });

    let totalWins = 0;
    let totalLosses = 0;
    let totalPointsScored = 0;
    let totalPointsConceded = 0;

    const partnerMap: Record<string, {
      played: number;
      wins: number;
      losses: number;
      scored: number;
      conceded: number;
    }> = {};

    const opponentMap: Record<string, {
      played: number;
      wins: number;
      losses: number;
      scored: number;
      conceded: number;
    }> = {};

    const matchHistoryLogs: PlayerDeepStats['recentMatches'] = [];
    const outcomes: Array<'W' | 'L'> = [];

    finishedMatches.forEach((m) => {
      const isTeamA = m.team_a_player1_id === memberId || m.team_a_player2_id === memberId;
      const won = (isTeamA && m.winning_team === 'TEAM_A') || (!isTeamA && m.winning_team === 'TEAM_B');

      if (won) totalWins++;
      else totalLosses++;

      const myScore = isTeamA ? m.score_team_a : m.score_team_b;
      const oppScore = isTeamA ? m.score_team_b : m.score_team_a;
      totalPointsScored += myScore;
      totalPointsConceded += oppScore;

      outcomes.push(won ? 'W' : 'L');

      const partnerId = isTeamA
        ? (m.team_a_player1_id === memberId ? m.team_a_player2_id : m.team_a_player1_id)
        : (m.team_b_player1_id === memberId ? m.team_b_player2_id : m.team_b_player1_id);

      const opponentIds = isTeamA
        ? [m.team_b_player1_id, m.team_b_player2_id]
        : [m.team_a_player1_id, m.team_a_player2_id];

      // Track partner
      if (partnerId) {
        if (!partnerMap[partnerId]) {
          partnerMap[partnerId] = { played: 0, wins: 0, losses: 0, scored: 0, conceded: 0 };
        }
        partnerMap[partnerId].played++;
        if (won) partnerMap[partnerId].wins++;
        else partnerMap[partnerId].losses++;
        partnerMap[partnerId].scored += myScore;
        partnerMap[partnerId].conceded += oppScore;
      }

      // Track opponents
      opponentIds.forEach((oppId) => {
        if (oppId) {
          if (!opponentMap[oppId]) {
            opponentMap[oppId] = { played: 0, wins: 0, losses: 0, scored: 0, conceded: 0 };
          }
          opponentMap[oppId].played++;
          if (won) opponentMap[oppId].wins++;
          else opponentMap[oppId].losses++;
          opponentMap[oppId].scored += myScore;
          opponentMap[oppId].conceded += oppScore;
        }
      });

      const sess = sessionMap.get(m.session_id);
      matchHistoryLogs.push({
        match: m,
        sessionDate: sess?.session_date || (m.created_at ? m.created_at.split('T')[0] : 'Unknown'),
        partner: partnerId ? memberMap.get(partnerId) || null : null,
        opponents: [
          opponentIds[0] ? memberMap.get(opponentIds[0]) || null : null,
          opponentIds[1] ? memberMap.get(opponentIds[1]) || null : null,
        ],
        isWin: won,
        myScore,
        opponentScore: oppScore,
      });
    });

    const totalMatches = totalWins + totalLosses;
    const winRate = totalMatches > 0 ? Number(((totalWins / totalMatches) * 100).toFixed(1)) : 0;
    const gayRate = totalMatches > 0 ? Number(((totalLosses / totalMatches) * 100).toFixed(1)) : 0;
    const pointDiff = totalPointsScored - totalPointsConceded;
    const avgPointsScored = totalMatches > 0 ? Number((totalPointsScored / totalMatches).toFixed(1)) : 0;
    const avgPointsConceded = totalMatches > 0 ? Number((totalPointsConceded / totalMatches).toFixed(1)) : 0;

    // Streaks
    let currentStreakType: 'WIN' | 'LOSS' | 'NONE' = 'NONE';
    let currentStreakCount = 0;
    if (outcomes.length > 0) {
      const lastOutcome = outcomes[outcomes.length - 1];
      currentStreakType = lastOutcome === 'W' ? 'WIN' : 'LOSS';
      for (let i = outcomes.length - 1; i >= 0; i--) {
        if (outcomes[i] === lastOutcome) {
          currentStreakCount++;
        } else {
          break;
        }
      }
    }

    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let tempWin = 0;
    let tempLoss = 0;
    for (const o of outcomes) {
      if (o === 'W') {
        tempWin++;
        tempLoss = 0;
        if (tempWin > longestWinStreak) longestWinStreak = tempWin;
      } else {
        tempLoss++;
        tempWin = 0;
        if (tempLoss > longestLossStreak) longestLossStreak = tempLoss;
      }
    }

    // Recent form (last 5 matches)
    const recentForm = outcomes.slice(-5);

    // Build partnership stats
    const allPartners: PartnerStats[] = Object.entries(partnerMap).map(([pId, data]) => {
      const pMember = memberMap.get(pId);
      const wRate = data.played > 0 ? Number(((data.wins / data.played) * 100).toFixed(1)) : 0;
      return {
        partnerId: pId,
        partnerName: pMember?.name || 'Unknown',
        partnerNickname: pMember?.nickname || null,
        partnerAvatarColor: pMember?.avatar_color,
        partnerAvatarUrl: pMember?.avatar_url,
        matchesPlayed: data.played,
        wins: data.wins,
        losses: data.losses,
        winRate: wRate,
        pointsScored: data.scored,
        pointsConceded: data.conceded,
        pointDiff: data.scored - data.conceded,
      };
    });

    // Sort partners: by win rate DESC, then wins DESC
    allPartners.sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.matchesPlayed - a.matchesPlayed;
    });

    const bestPartner = allPartners.length > 0 ? allPartners[0] : null;

    // Most frequent partner
    const mostFrequentPartner = [...allPartners].sort((a, b) => b.matchesPlayed - a.matchesPlayed)[0] || null;

    // Worst partner (lowest win rate, most losses)
    const worstPartner = [...allPartners].sort((a, b) => {
      if (a.winRate !== b.winRate) return a.winRate - b.winRate;
      return b.losses - a.losses;
    })[0] || null;

    // Build opponent stats
    const allOpponents: OpponentStats[] = Object.entries(opponentMap).map(([opId, data]) => {
      const opMember = memberMap.get(opId);
      const wRate = data.played > 0 ? Number(((data.wins / data.played) * 100).toFixed(1)) : 0;
      return {
        opponentId: opId,
        opponentName: opMember?.name || 'Unknown',
        opponentNickname: opMember?.nickname || null,
        opponentAvatarColor: opMember?.avatar_color,
        opponentAvatarUrl: opMember?.avatar_url,
        matchesPlayed: data.played,
        winsAgainst: data.wins,
        lossesAgainst: data.losses,
        winRate: wRate,
        pointsScored: data.scored,
        pointsConceded: data.conceded,
        pointDiff: data.scored - data.conceded,
      };
    });

    // Favorite opponent: highest win rate against
    allOpponents.sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.winsAgainst !== a.winsAgainst) return b.winsAgainst - a.winsAgainst;
      return b.matchesPlayed - a.matchesPlayed;
    });
    const favoriteOpponent = allOpponents.length > 0 ? allOpponents[0] : null;

    // Toughest nemesis: most losses against, lowest win rate
    const toughestNemesis = [...allOpponents].sort((a, b) => {
      if (b.lossesAgainst !== a.lossesAgainst) return b.lossesAgainst - a.lossesAgainst;
      return a.winRate - b.winRate;
    })[0] || null;

    // Sort recent matches newest first
    matchHistoryLogs.reverse();

    return {
      member,
      summary: {
        totalMatches,
        wins: totalWins,
        losses: totalLosses,
        winRate,
        gayRate,
        totalPointsScored,
        totalPointsConceded,
        pointDiff,
        avgPointsScored,
        avgPointsConceded,
        currentStreak: { type: currentStreakType, count: currentStreakCount },
        longestWinStreak,
        longestLossStreak,
        recentForm,
      },
      partnerships: {
        all: allPartners,
        bestPartner,
        mostFrequentPartner,
        worstPartner,
      },
      opponents: {
        all: allOpponents,
        favoriteOpponent,
        toughestNemesis,
      },
      recentMatches: matchHistoryLogs,
    };
    }, forceRefresh);
  },
};


