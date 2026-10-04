'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Member, PlayerDeepStats, PartnerStats, OpponentStats } from '@/lib/types';
import { dataService } from '@/lib/dataService';
import Link from 'next/link';
import { 
  Trophy, 
  Flame, 
  Users, 
  TrendingUp, 
  Swords, 
  Crown, 
  Zap, 
  ShieldAlert, 
  HeartHandshake, 
  Activity, 
  Search, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  Target,
  Skull,
  Award,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

function PlayerStatsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [deepStats, setDeepStats] = useState<PlayerDeepStats | null>(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [playerSearch, setPlayerSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'partners' | 'opponents' | 'matches'>('partners');

  // Load all members first
  useEffect(() => {
    async function loadMembers() {
      try {
        setIsLoadingMembers(true);
        const allMembers = await dataService.getMembers();
        setMembers(allMembers);

        // Check if query param specifies a player
        const queryPlayerId = searchParams.get('player');
        if (queryPlayerId && allMembers.some((m) => m.id === queryPlayerId)) {
          setSelectedMemberId(queryPlayerId);
        } else if (allMembers.length > 0) {
          // Default to first member
          setSelectedMemberId(allMembers[0].id);
        }
      } catch (err) {
        console.error('Failed to load squad members:', err);
      } finally {
        setIsLoadingMembers(false);
      }
    }
    loadMembers();
  }, [searchParams]);

  // Load deep statistics whenever selectedMemberId changes
  useEffect(() => {
    if (!selectedMemberId) return;

    async function loadPlayerStats() {
      try {
        setIsLoadingStats(true);
        const stats = await dataService.getPlayerDeepStats(selectedMemberId!);
        setDeepStats(stats);
      } catch (err) {
        console.error('Failed to load player deep stats:', err);
      } finally {
        setIsLoadingStats(false);
      }
    }
    loadPlayerStats();
  }, [selectedMemberId]);

  const handleSelectPlayer = (id: string) => {
    setSelectedMemberId(id);
    router.replace(`/stats?player=${id}`, { scroll: false });
  };

  const filteredMembers = useMemo(() => {
    const q = playerSearch.toLowerCase().trim();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.nickname && m.nickname.toLowerCase().includes(q))
    );
  }, [members, playerSearch]);

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  // Helper for Synergy Rating
  const getSynergyBadge = (winRate: number, matches: number) => {
    if (matches === 0) return { label: 'Untested', color: 'bg-slate-800 text-slate-400 border-slate-700' };
    if (winRate >= 75) return { label: '⚡ Unstoppable Synergy', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    if (winRate >= 50) return { label: '✨ Balanced Duo', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' };
    return { label: '💔 High Friction', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
  };

  if (isLoadingMembers) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-semibold tracking-wide">Loading Player Analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-950/40 border border-emerald-500/20 p-4 sm:p-7 shadow-xl backdrop-blur-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-3 h-3" />
              <span>In-Depth Chemistry &amp; Rivalry</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Player Deep Analytics
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Explore partnership win rates, best duos, nemesis matchups, and form streaks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all border border-slate-700 shadow-sm"
            >
              ← Back to Standings
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Player Selector Carousel & Quick Search */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Select Squad Member ({members.length})</span>
          </div>

          <div className="relative w-44 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search player..."
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Player Switcher Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
          {filteredMembers.map((m) => {
            const isSelected = m.id === selectedMemberId;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectPlayer(m.id)}
                className={`group flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400/50 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                    : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <div className="w-7 h-7 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center shrink-0 border border-white/10">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt={m.name} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-[10px] font-black text-white"
                      style={{ backgroundColor: m.avatar_color || '#10b981' }}
                    >
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <div className="leading-tight truncate max-w-[110px]">{m.name}</div>
                  {m.nickname && (
                    <div className={`text-[10px] font-normal truncate max-w-[110px] ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                      {m.nickname}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {isLoadingStats || !deepStats ? (
        <div className="py-20 text-center rounded-3xl bg-slate-900/50 border border-slate-800 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 text-emerald-400">
            <Activity className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-sm font-bold text-white">Crunching player records &amp; chemistry stats...</p>
        </div>
      ) : (
        <>
          {/* 3. Player Spotlight Hero Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
              {/* Player Avatar & Identity */}
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 text-center sm:text-left">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl p-[2px] bg-gradient-to-tr from-emerald-500 via-teal-400 to-amber-400 shadow-xl shadow-emerald-500/20">
                    <div className="w-full h-full bg-slate-950 rounded-[22px] overflow-hidden flex items-center justify-center">
                      {deepStats.member.avatar_url ? (
                        <img src={deepStats.member.avatar_url} alt={deepStats.member.name} className="w-full h-full object-cover" />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-3xl font-black text-white"
                          style={{ backgroundColor: deepStats.member.avatar_color || '#10b981' }}
                        >
                          {deepStats.member.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Status Badge */}
                  <div className="absolute -bottom-2 -right-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900 border border-emerald-500/50 shadow-md">
                    {deepStats.summary.winRate >= 60 ? (
                      <span className="text-amber-400 flex items-center gap-1">⚡ Smash Pro</span>
                    ) : deepStats.summary.gayRate >= 60 ? (
                      <span className="text-pink-400 flex items-center gap-1">💅 Gay Contender</span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">🏸 Player</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    <span>Squad Profile</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center justify-center sm:justify-start gap-2">
                    <span>{deepStats.member.name}</span>
                    {deepStats.member.nickname && (
                      <span className="text-base font-normal text-emerald-400/80">
                        &quot;{deepStats.member.nickname}&quot;
                      </span>
                    )}
                  </h2>
                  <div className="text-xs text-slate-400 flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-0.5">
                    <span>Matches: <strong className="text-white">{deepStats.summary.totalMatches}</strong></span>
                    <span>•</span>
                    <span>Points Conceded / Scored: <strong className="text-white">{deepStats.summary.totalPointsScored}</strong> / <strong className="text-slate-400">{deepStats.summary.totalPointsConceded}</strong></span>
                  </div>

                  {/* Recent Form Pills */}
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 pt-2">
                    <span className="text-[11px] font-bold text-slate-400 mr-1">Recent Form:</span>
                    {deepStats.summary.recentForm.length === 0 ? (
                      <span className="text-[11px] text-slate-500 font-medium">No matches played</span>
                    ) : (
                      deepStats.summary.recentForm.map((result, idx) => (
                        <span
                          key={idx}
                          className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm ${
                            result === 'W'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                          }`}
                          title={result === 'W' ? 'Win' : 'Loss'}
                        >
                          {result}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto">
                {/* Win Rate */}
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[95px]">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Win Rate</div>
                  <div className="text-xl font-black text-emerald-400 mt-0.5">{deepStats.summary.winRate}%</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {deepStats.summary.wins}W - {deepStats.summary.losses}L
                  </div>
                </div>

                {/* Gay % */}
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-pink-500/20 text-center min-w-[95px]">
                  <div className="text-[10px] uppercase font-bold text-pink-400">Gay %</div>
                  <div className="text-xl font-black text-pink-300 mt-0.5">{deepStats.summary.gayRate}%</div>
                  <div className="text-[10px] text-pink-400/60 font-mono mt-0.5">
                    {deepStats.summary.losses} Losses
                  </div>
                </div>

                {/* Point Diff */}
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[95px]">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Point +/-</div>
                  <div className={`text-xl font-black mt-0.5 ${deepStats.summary.pointDiff >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                    {deepStats.summary.pointDiff >= 0 ? `+${deepStats.summary.pointDiff}` : deepStats.summary.pointDiff}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Avg {deepStats.summary.avgPointsScored} pts
                  </div>
                </div>

                {/* Streak */}
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[95px]">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Streak</div>
                  <div className="text-xl font-black mt-0.5">
                    {deepStats.summary.currentStreak.type === 'WIN' ? (
                      <span className="text-amber-400 flex items-center justify-center gap-1">
                        🔥 {deepStats.summary.currentStreak.count}W
                      </span>
                    ) : deepStats.summary.currentStreak.type === 'LOSS' ? (
                      <span className="text-rose-400 flex items-center justify-center gap-1">
                        ❄️ {deepStats.summary.currentStreak.count}L
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Best: {deepStats.summary.longestWinStreak}W
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. KEY CHEMISTRY INSIGHTS (Best Partner, Frequent Duo, Nemesis) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Spotlight 1: Best Partner (The Golden Duo) */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 p-4 shadow-lg backdrop-blur-md flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <Trophy className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                    <span>The Golden Duo 🏆</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400">Highest Win Rate</span>
                </div>

                {deepStats.partnerships.bestPartner ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-950 border border-emerald-400/40 shrink-0 flex items-center justify-center shadow-md">
                      {deepStats.partnerships.bestPartner.partnerAvatarUrl ? (
                        <img
                          src={deepStats.partnerships.bestPartner.partnerAvatarUrl}
                          alt={deepStats.partnerships.bestPartner.partnerName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-sm font-black text-white"
                          style={{ backgroundColor: deepStats.partnerships.bestPartner.partnerAvatarColor || '#10b981' }}
                        >
                          {deepStats.partnerships.bestPartner.partnerName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold text-white truncate">
                        {deepStats.partnerships.bestPartner.partnerName}
                      </h4>
                      {deepStats.partnerships.bestPartner.partnerNickname && (
                        <p className="text-[11px] text-emerald-300/80 truncate">
                          &quot;{deepStats.partnerships.bestPartner.partnerNickname}&quot;
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Won together: <strong className="text-emerald-400">{deepStats.partnerships.bestPartner.wins} of {deepStats.partnerships.bestPartner.matchesPlayed}</strong> games
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-3">No partnership data recorded yet.</p>
                )}
              </div>

              {deepStats.partnerships.bestPartner && (
                <div className="mt-3 pt-2.5 border-t border-emerald-500/20 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Partnership Win Rate:</span>
                  <span className="font-black text-emerald-400 text-sm">
                    {deepStats.partnerships.bestPartner.winRate}%
                  </span>
                </div>
              )}
            </div>

            {/* Spotlight 2: Most Frequent Partner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/30 p-4 shadow-lg backdrop-blur-md flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    <HeartHandshake className="w-3 h-3 text-teal-400" />
                    <span>Court Companion 🤝</span>
                  </span>
                  <span className="text-[10px] font-bold text-teal-400">Most Matches</span>
                </div>

                {deepStats.partnerships.mostFrequentPartner ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-950 border border-teal-400/40 shrink-0 flex items-center justify-center shadow-md">
                      {deepStats.partnerships.mostFrequentPartner.partnerAvatarUrl ? (
                        <img
                          src={deepStats.partnerships.mostFrequentPartner.partnerAvatarUrl}
                          alt={deepStats.partnerships.mostFrequentPartner.partnerName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-sm font-black text-white"
                          style={{ backgroundColor: deepStats.partnerships.mostFrequentPartner.partnerAvatarColor || '#14b8a6' }}
                        >
                          {deepStats.partnerships.mostFrequentPartner.partnerName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold text-white truncate">
                        {deepStats.partnerships.mostFrequentPartner.partnerName}
                      </h4>
                      {deepStats.partnerships.mostFrequentPartner.partnerNickname && (
                        <p className="text-[11px] text-teal-300/80 truncate">
                          &quot;{deepStats.partnerships.mostFrequentPartner.partnerNickname}&quot;
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Shared court: <strong className="text-white">{deepStats.partnerships.mostFrequentPartner.matchesPlayed}</strong> times
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-3">No shared games recorded yet.</p>
                )}
              </div>

              {deepStats.partnerships.mostFrequentPartner && (
                <div className="mt-3 pt-2.5 border-t border-teal-500/20 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Record Together:</span>
                  <span className="font-black text-teal-300 text-sm font-mono">
                    {deepStats.partnerships.mostFrequentPartner.wins}W - {deepStats.partnerships.mostFrequentPartner.losses}L ({deepStats.partnerships.mostFrequentPartner.winRate}%)
                  </span>
                </div>
              )}
            </div>

            {/* Spotlight 3: Toughest Chemistry */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-950/30 via-slate-900 to-slate-900 border border-pink-500/30 p-4 shadow-lg backdrop-blur-md flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/40">
                    <ShieldAlert className="w-3 h-3 text-pink-400" />
                    <span>Toughest Duo 💔</span>
                  </span>
                  <span className="text-[10px] font-bold text-pink-400">Lowest Win Rate</span>
                </div>

                {deepStats.partnerships.worstPartner ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-950 border border-pink-400/40 shrink-0 flex items-center justify-center shadow-md">
                      {deepStats.partnerships.worstPartner.partnerAvatarUrl ? (
                        <img
                          src={deepStats.partnerships.worstPartner.partnerAvatarUrl}
                          alt={deepStats.partnerships.worstPartner.partnerName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-sm font-black text-white"
                          style={{ backgroundColor: deepStats.partnerships.worstPartner.partnerAvatarColor || '#ec4899' }}
                        >
                          {deepStats.partnerships.worstPartner.partnerName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold text-white truncate">
                        {deepStats.partnerships.worstPartner.partnerName}
                      </h4>
                      {deepStats.partnerships.worstPartner.partnerNickname && (
                        <p className="text-[11px] text-pink-300/80 truncate">
                          &quot;{deepStats.partnerships.worstPartner.partnerNickname}&quot;
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Lost together: <strong className="text-pink-400">{deepStats.partnerships.worstPartner.losses} of {deepStats.partnerships.worstPartner.matchesPlayed}</strong> games
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-3">No losses with teammates recorded.</p>
                )}
              </div>

              {deepStats.partnerships.worstPartner && (
                <div className="mt-3 pt-2.5 border-t border-pink-500/20 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Win Rate:</span>
                  <span className="font-black text-pink-400 text-sm">
                    {deepStats.partnerships.worstPartner.winRate}%
                  </span>
                </div>
              )}
            </div>

            {/* Spotlight 4: Arch Nemesis */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-950/30 via-slate-900 to-slate-900 border border-rose-500/30 p-4 shadow-lg backdrop-blur-md flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <Skull className="w-3 h-3 text-rose-400" />
                    <span>Arch Nemesis 😈</span>
                  </span>
                  <span className="text-[10px] font-bold text-rose-400">Most Losses vs</span>
                </div>

                {deepStats.opponents.toughestNemesis ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-950 border border-rose-400/40 shrink-0 flex items-center justify-center shadow-md">
                      {deepStats.opponents.toughestNemesis.opponentAvatarUrl ? (
                        <img
                          src={deepStats.opponents.toughestNemesis.opponentAvatarUrl}
                          alt={deepStats.opponents.toughestNemesis.opponentName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-sm font-black text-white"
                          style={{ backgroundColor: deepStats.opponents.toughestNemesis.opponentAvatarColor || '#f43f5e' }}
                        >
                          {deepStats.opponents.toughestNemesis.opponentName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold text-white truncate">
                        {deepStats.opponents.toughestNemesis.opponentName}
                      </h4>
                      {deepStats.opponents.toughestNemesis.opponentNickname && (
                        <p className="text-[11px] text-rose-300/80 truncate">
                          &quot;{deepStats.opponents.toughestNemesis.opponentNickname}&quot;
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Defeated by them: <strong className="text-rose-400">{deepStats.opponents.toughestNemesis.lossesAgainst}</strong> times
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-3">Undefeated across all opponents!</p>
                )}
              </div>

              {deepStats.opponents.toughestNemesis && (
                <div className="mt-3 pt-2.5 border-t border-rose-500/20 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Win Rate vs Them:</span>
                  <span className="font-black text-rose-400 text-sm">
                    {deepStats.opponents.toughestNemesis.winRate}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 5. DETAILED ANALYTICS TABS */}
          <div className="space-y-4">
            {/* Tab Selectors */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800 w-full sm:w-auto inline-flex overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('partners')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'partners'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Duo Chemistry ({deepStats.partnerships.all.length} Teammates)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('opponents')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'opponents'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Head-to-Head Rivals ({deepStats.opponents.all.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('matches')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'matches'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Match Log ({deepStats.recentMatches.length})</span>
              </button>
            </div>

            {/* TAB 1: DUO CHEMISTRY TABLE */}
            {activeTab === 'partners' && (
              <div className="bg-slate-900/80 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-xl overflow-hidden backdrop-blur-md">
                <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <HeartHandshake className="w-4 h-4 text-emerald-400" />
                      <span>Full Partnership Chemistry Breakdown</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Ranked by highest win rate and matches won together when paired as a doubles team.
                    </p>
                  </div>
                </div>

                {deepStats.partnerships.all.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No completed doubles matches recorded with teammates yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800 tracking-wider">
                          <th className="py-3 px-4">Partner</th>
                          <th className="py-3 px-3 text-center">Matches</th>
                          <th className="py-3 px-3 text-center">Record (W - L)</th>
                          <th className="py-3 px-4">Win Rate %</th>
                          <th className="py-3 px-3 text-center hidden sm:table-cell">Point Diff</th>
                          <th className="py-3 px-4 text-right">Synergy Rating</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {deepStats.partnerships.all.map((p, idx) => {
                          const badge = getSynergyBadge(p.winRate, p.matchesPlayed);
                          return (
                            <tr key={p.partnerId} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-700/80 flex items-center justify-center">
                                    {p.partnerAvatarUrl ? (
                                      <img src={p.partnerAvatarUrl} alt={p.partnerName} className="w-full h-full object-cover" />
                                    ) : (
                                      <div
                                        className="w-full h-full flex items-center justify-center text-xs font-black text-white"
                                        style={{ backgroundColor: p.partnerAvatarColor || '#10b981' }}
                                      >
                                        {p.partnerName.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-extrabold text-white flex items-center gap-1.5">
                                      <span>{p.partnerName}</span>
                                      {idx === 0 && p.wins > 0 && (
                                        <span className="text-[10px] text-amber-400 font-bold">⭐ Best Duo</span>
                                      )}
                                    </div>
                                    {p.partnerNickname && (
                                      <div className="text-[10px] text-slate-500 font-normal">
                                        &quot;{p.partnerNickname}&quot;
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center font-bold text-white font-mono">
                                {p.matchesPlayed}
                              </td>
                              <td className="py-3 px-3 text-center font-mono">
                                <span className="font-extrabold text-emerald-400">{p.wins}W</span>
                                <span className="text-slate-500 mx-1">-</span>
                                <span className="font-extrabold text-rose-400">{p.losses}L</span>
                              </td>
                              <td className="py-3 px-4 min-w-[130px]">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[11px] font-mono">
                                    <span className="font-extrabold text-white">{p.winRate}%</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        p.winRate >= 70
                                          ? 'bg-emerald-500'
                                          : p.winRate >= 50
                                          ? 'bg-teal-400'
                                          : 'bg-rose-500'
                                      }`}
                                      style={{ width: `${p.winRate}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center font-mono hidden sm:table-cell">
                                <span className={p.pointDiff >= 0 ? 'text-teal-400 font-bold' : 'text-rose-400 font-bold'}>
                                  {p.pointDiff >= 0 ? `+${p.pointDiff}` : p.pointDiff}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${badge.color}`}>
                                  {badge.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: HEAD-TO-HEAD RIVALS TABLE */}
            {activeTab === 'opponents' && (
              <div className="bg-slate-900/80 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-xl overflow-hidden backdrop-blur-md">
                <div className="p-4 sm:p-5 border-b border-slate-800">
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <Swords className="w-4 h-4 text-emerald-400" />
                    <span>Head-to-Head Opponent Record</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Track win rates and points scored against every player on the opposing side of the net.
                  </p>
                </div>

                {deepStats.opponents.all.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No matches against opponents recorded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800 tracking-wider">
                          <th className="py-3 px-4">Opponent</th>
                          <th className="py-3 px-3 text-center">Matches</th>
                          <th className="py-3 px-3 text-center">Record vs Them</th>
                          <th className="py-3 px-4">Win % vs Them</th>
                          <th className="py-3 px-3 text-center hidden sm:table-cell">Point Diff</th>
                          <th className="py-3 px-4 text-right">Matchup Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {deepStats.opponents.all.map((op) => {
                          const isKryptonite = op.lossesAgainst > op.winsAgainst;
                          const isDominant = op.winsAgainst > op.lossesAgainst;
                          return (
                            <tr key={op.opponentId} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-700/80 flex items-center justify-center">
                                    {op.opponentAvatarUrl ? (
                                      <img src={op.opponentAvatarUrl} alt={op.opponentName} className="w-full h-full object-cover" />
                                    ) : (
                                      <div
                                        className="w-full h-full flex items-center justify-center text-xs font-black text-white"
                                        style={{ backgroundColor: op.opponentAvatarColor || '#10b981' }}
                                      >
                                        {op.opponentName.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-extrabold text-white">{op.opponentName}</div>
                                    {op.opponentNickname && (
                                      <div className="text-[10px] text-slate-500 font-normal">
                                        &quot;{op.opponentNickname}&quot;
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center font-bold text-white font-mono">
                                {op.matchesPlayed}
                              </td>
                              <td className="py-3 px-3 text-center font-mono">
                                <span className="font-extrabold text-emerald-400">{op.winsAgainst}W</span>
                                <span className="text-slate-500 mx-1">-</span>
                                <span className="font-extrabold text-rose-400">{op.lossesAgainst}L</span>
                              </td>
                              <td className="py-3 px-4 min-w-[130px]">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[11px] font-mono">
                                    <span className="font-extrabold text-white">{op.winRate}%</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        op.winRate >= 60
                                          ? 'bg-emerald-500'
                                          : op.winRate >= 40
                                          ? 'bg-amber-400'
                                          : 'bg-rose-500'
                                      }`}
                                      style={{ width: `${op.winRate}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center font-mono hidden sm:table-cell">
                                <span className={op.pointDiff >= 0 ? 'text-teal-400 font-bold' : 'text-rose-400 font-bold'}>
                                  {op.pointDiff >= 0 ? `+${op.pointDiff}` : op.pointDiff}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                {isDominant ? (
                                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                    🎯 Dominant
                                  </span>
                                ) : isKryptonite ? (
                                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                    😈 Kryptonite
                                  </span>
                                ) : (
                                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-800 text-slate-300 border border-slate-700">
                                    ⚖️ Even Rivalry
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: MATCH HISTORY LOG */}
            {activeTab === 'matches' && (
              <div className="bg-slate-900/80 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-xl overflow-hidden backdrop-blur-md">
                <div className="p-4 sm:p-5 border-b border-slate-800">
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Complete Match Log for {deepStats.member.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Latest to oldest matches, showing teammate pair, opponents, and score outcomes.
                  </p>
                </div>

                {deepStats.recentMatches.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No completed games found for this player.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/70">
                    {deepStats.recentMatches.map((mLog) => (
                      <div
                        key={mLog.match.id}
                        className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Match Info */}
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 ${
                              mLog.isWin
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {mLog.isWin ? 'VICTORY' : 'DEFEAT'}
                          </span>

                          <div>
                            <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                              <span>Round {mLog.match.round_number}</span>
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-400 font-normal">
                                {mLog.sessionDate ? new Date(mLog.sessionDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Tournament Game'}
                              </span>
                            </div>

                            {/* Teams Lineup */}
                            <div className="text-[11px] text-slate-300 flex flex-wrap items-center gap-1 mt-0.5">
                              <span className="font-semibold text-emerald-400">You</span>
                              <span>&amp;</span>
                              <span className="font-bold text-white">{mLog.partner ? mLog.partner.name : 'Unknown Partner'}</span>
                              <span className="text-slate-500 mx-1">vs</span>
                              <span className="text-slate-400">
                                {mLog.opponents[0]?.name || 'Opponent 1'} &amp; {mLog.opponents[1]?.name || 'Opponent 2'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Final Score */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <div className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs font-extrabold flex items-center gap-1.5">
                            <span className={mLog.isWin ? 'text-emerald-400' : 'text-slate-400'}>{mLog.myScore}</span>
                            <span className="text-slate-600">-</span>
                            <span className={!mLog.isWin ? 'text-rose-400' : 'text-slate-400'}>{mLog.opponentScore}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function PlayerStatsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-semibold tracking-wide">Loading Player Analytics...</p>
        </div>
      }
    >
      <PlayerStatsContent />
    </Suspense>
  );
}
