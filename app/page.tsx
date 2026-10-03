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
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    initDashboard();
  }, []);

  const initDashboard = async () => {
    try {
      setIsLoading(true);
      const [allSessions, todaySession, squadMembers] = await Promise.all([
        dataService.getAllSessions(),
        dataService.getOrCreateTodaySession(),
        dataService.getMembers(),
      ]);

      setSessions(allSessions.length > 0 ? allSessions : [todaySession]);
      setMembers(squadMembers);

      // Default to today's session
      setSelectedSessionId(todaySession.id);
      const leaderboardData = await dataService.getLeaderboard(todaySession.id);
      setStats(leaderboardData);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSession = async (sessionId: string | undefined) => {
    setSelectedSessionId(sessionId);
    setIsLoading(true);
    try {
      const data = await dataService.getLeaderboard(sessionId);
      setStats(data);
    } finally {
      setIsLoading(false);
    }
  };

  const topPlayer = stats.length > 0 && stats[0].wins > 0 ? stats[0] : null;
  const totalCompletedGames = stats.reduce((acc, s) => acc + s.wins, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 border border-emerald-500/20 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
        {/* Glow ornaments */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Badminton Rotation &amp; Leaderboards</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Badminton Match &amp; Leaderboard Tracker
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Fair rest scheduling, zero duplicate partner bias, live court scorekeeping, and dynamic daily + all-time standings.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <Link
              href="/matches"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Swords className="w-4 h-4 fill-slate-950" />
              <span>Generate Today&apos;s Matches</span>
            </Link>

            <Link
              href="/members"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-colors"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Squad Roster</span>
            </Link>
          </div>
        </div>

        {/* Quick Stats Counter row */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" /> Total Squad
            </div>
            <div className="mt-1 text-2xl font-black text-white font-mono">
              {members.length}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Active players</div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Smash King
            </div>
            <div className="mt-1 text-2xl font-black text-amber-400 truncate">
              {topPlayer ? topPlayer.name : 'TBD'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {topPlayer ? `${topPlayer.win_rate}% Win Rate` : 'No games logged yet'}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-teal-400" /> Finished Games
            </div>
            <div className="mt-1 text-2xl font-black text-teal-400 font-mono">
              {totalCompletedGames}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Wins recorded</div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-400" /> Today&apos;s Session
            </div>
            <div className="mt-1 text-sm font-bold text-white truncate">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Local Court</div>
          </div>
        </div>
      </div>

      {/* Leaderboard Table Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              <span>Tournament Standings</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time rankings based on wins, win rate percentage, and point differentials.
            </p>
          </div>
        </div>

        <LeaderboardTable
          stats={stats}
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          onSelectSession={handleSelectSession}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
