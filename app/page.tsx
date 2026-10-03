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
  ArrowRight
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
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" /> #1 Player
            </div>
            <div className="text-lg sm:text-xl font-black text-amber-400 truncate mt-0.5">
              {topPlayer ? topPlayer.name : 'TBD'}
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

          <div className="bg-slate-950/60 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-800/80">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3 text-purple-400" /> Session
            </div>
            <div className="text-xs sm:text-sm font-bold text-white truncate mt-1">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Section */}
      <LeaderboardTable
        stats={stats}
        sessions={sessions}
        selectedSessionId={selectedSessionId}
        onSelectSession={handleSelectSession}
        isLoading={isLoading}
      />
    </div>
  );
}
