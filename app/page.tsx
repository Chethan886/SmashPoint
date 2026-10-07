'use client';

import React, { useState, useEffect } from 'react';
import { PlayerStats, Session, Member } from '@/lib/types';
import { dataService } from '@/lib/dataService';
import LeaderboardTable from '@/components/LeaderboardTable';
import { 
  Trophy, 
  Swords, 
  Users, 
  Flame, 
  Calendar, 
  Sparkles,
  ArrowRight,
  Crown,
  Zap
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [matchDates, setMatchDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    initDashboard();
  }, []);

  const initDashboard = async () => {
    try {
      setIsLoading(true);
      const [allSessions, squadMembers, leaderboardData, matchDatesList] = await Promise.all([
        dataService.getAllSessions(),
        dataService.getMembers(),
        dataService.getLeaderboard(undefined),
        dataService.getDatesWithMatches(),
      ]);

      setSessions(allSessions);
      setMembers(squadMembers);
      setSelectedDate(undefined);
      setStats(leaderboardData);
      setMatchDates(matchDatesList);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDate = async (date: string | undefined) => {
    setSelectedDate(date);
    try {
      const data = await dataService.getLeaderboard(date);
      setStats(data);
    } catch (err) {
      console.error('Failed to update leaderboard for date:', err);
    }
  };


  const activeStats = stats.filter((s) => s.total_matches > 0);
  const smashLord = activeStats.length > 0 && activeStats[0].wins > 0 ? activeStats[0] : null;
  const gayLord = activeStats.length > 0 && (activeStats[activeStats.length - 1].losses > 0 || activeStats[activeStats.length - 1].total_matches > 0)
    ? activeStats[activeStats.length - 1] 
    : null;

  const totalCompletedGames = stats.reduce((acc, s) => acc + s.wins, 0);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Compact Mobile-Friendly Hero Card */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-950/40 border border-emerald-500/20 p-4 sm:p-8 shadow-xl backdrop-blur-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1 sm:space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-3 h-3" />
              <span>Smart Rotation &amp; Standings</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              SmashPoint Leaderboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Live tournament rankings, win rates, and fair rest rotation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/matches"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:opacity-95 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Swords className="w-3.5 h-3.5 fill-slate-950" />
              <span>Go to Match Generator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Compact Quick Stats Grid (2x2 on mobile, 4-col on desktop) */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-800/80">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3 h-3 text-emerald-400" /> Squad
            </div>
            <div className="text-lg sm:text-xl font-black text-white font-mono mt-0.5">
              {members.length}
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-800/80">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Smash Lord ⚡
            </div>
            <div className="text-lg sm:text-xl font-black text-amber-400 truncate mt-0.5">
              {smashLord ? smashLord.name : 'No Matches'}
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-pink-500/20 bg-pink-950/10">
            <div className="text-[10px] font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1">
              <Crown className="w-3 h-3 text-pink-400 fill-pink-400" /> The Gay Lord 👑
            </div>
            <div className="text-lg sm:text-xl font-black text-pink-300 truncate mt-0.5">
              {gayLord ? gayLord.name : 'No Matches'}
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-800/80">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3 h-3 text-teal-400" /> Games
            </div>
            <div className="text-lg sm:text-xl font-black text-teal-400 font-mono mt-0.5">
              {totalCompletedGames}
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Section */}
      <LeaderboardTable
        stats={stats}
        sessions={sessions}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        matchDates={matchDates}
        isLoading={isLoading}
      />
    </div>
  );
}
