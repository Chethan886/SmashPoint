'use client';

import React, { useState } from 'react';
import { PlayerStats, Session } from '@/lib/types';
import { 
  Trophy, 
  Medal, 
  Search, 
  Flame, 
  Calendar, 
  Globe, 
  Activity,
  Award
} from 'lucide-react';

interface LeaderboardTableProps {
  stats: PlayerStats[];
  sessions: Session[];
  selectedSessionId?: string;
  onSelectSession: (sessionId: string | undefined) => void;
  isLoading?: boolean;
}

export default function LeaderboardTable({
  stats,
  sessions,
  selectedSessionId,
  onSelectSession,
  isLoading = false,
}: LeaderboardTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStats = stats.filter((s) => {
    const q = searchTerm.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.nickname && s.nickname.toLowerCase().includes(q));
  });

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black shadow-lg shadow-amber-500/30 ring-2 ring-amber-300/50">
          <Trophy className="w-4 h-4 fill-slate-950" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-950 font-black shadow-lg shadow-slate-300/20 ring-2 ring-slate-300/50">
          <Medal className="w-4 h-4" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-amber-700 to-amber-600 text-white font-black shadow-lg shadow-amber-700/20 ring-2 ring-amber-600/40">
          <Award className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs">
        #{rank}
      </div>
    );
  };

  const getRowHighlight = (rank: number) => {
    if (rank === 1) {
      return 'bg-gradient-to-r from-amber-500/10 via-slate-900/60 to-slate-900 border-amber-500/40 shadow-sm shadow-amber-500/5';
    }
    if (rank === 2) {
      return 'bg-gradient-to-r from-slate-400/10 via-slate-900/60 to-slate-900 border-slate-400/30';
    }
    if (rank === 3) {
      return 'bg-gradient-to-r from-amber-800/10 via-slate-900/60 to-slate-900 border-amber-800/30';
    }
    return 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/40';
  };

  return (
    <div className="space-y-6">
      {/* Controls Header: Daily vs All-Time Toggle + Session Picker + Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/80 p-4 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-md">
        {/* Toggle Pills */}
        <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start">
          <button
            type="button"
            onClick={() => {
              // Select today's session if available, else first session
              const today = new Date().toISOString().split('T')[0];
              const todaySession = sessions.find((s) => s.session_date === today) || sessions[0];
              onSelectSession(todaySession?.id);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedSessionId
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Daily Session</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectSession(undefined)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              !selectedSessionId
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>All-Time Standings</span>
          </button>
        </div>

        {/* Right side: Session selector if daily + search input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {selectedSessionId && sessions.length > 0 && (
            <select
              value={selectedSessionId}
              onChange={(e) => onSelectSession(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {sessions.map((sess) => (
                <option key={sess.id} value={sess.id}>
                  {sess.session_date} ({sess.location})
                </option>
              ))}
            </select>
          )}

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search player name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-56 pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Podium Highlights for Top 3 */}
      {filteredStats.length >= 3 && !searchTerm && (
        <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-6 pb-2">
          {/* Rank 2 (Silver) */}
          <div className="flex flex-col items-center justify-end">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-slate-400 to-slate-200 p-[2px] shadow-lg shadow-slate-300/10 mb-2">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Medal className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300" />
              </div>
            </div>
            <span className="font-extrabold text-white text-xs sm:text-sm text-center truncate max-w-[90px] sm:max-w-[130px]">
              {filteredStats[1].name}
            </span>
            <span className="text-[11px] text-slate-400 font-mono mt-0.5">
              {filteredStats[1].wins}W - {filteredStats[1].losses}L ({filteredStats[1].win_rate}%)
            </span>
            <div className="mt-2 w-full h-16 sm:h-20 bg-slate-800/60 border-t-2 border-slate-400 rounded-t-xl flex items-center justify-center font-black text-slate-300 text-sm">
              2nd
            </div>
          </div>

          {/* Rank 1 (Gold) */}
          <div className="flex flex-col items-center justify-end -mt-4">
            <div className="relative mb-2">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 p-[2px] shadow-xl shadow-amber-500/20 animate-pulse">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                  <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" />
                </div>
              </div>
              <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shadow-md">
                #1
              </span>
            </div>
            <span className="font-extrabold text-amber-300 text-sm sm:text-base text-center truncate max-w-[100px] sm:max-w-[150px]">
              {filteredStats[0].name}
            </span>
            <span className="text-xs text-amber-400/80 font-mono mt-0.5">
              {filteredStats[0].wins}W - {filteredStats[0].losses}L ({filteredStats[0].win_rate}%)
            </span>
            <div className="mt-2 w-full h-24 sm:h-28 bg-gradient-to-t from-amber-950/40 to-amber-900/20 border-t-2 border-amber-400 rounded-t-xl flex items-center justify-center font-black text-amber-300 text-base">
              Champion
            </div>
          </div>

          {/* Rank 3 (Bronze) */}
          <div className="flex flex-col items-center justify-end">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-800 to-amber-600 p-[2px] shadow-lg shadow-amber-800/10 mb-2">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Award className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
              </div>
            </div>
            <span className="font-extrabold text-white text-xs sm:text-sm text-center truncate max-w-[90px] sm:max-w-[130px]">
              {filteredStats[2].name}
            </span>
            <span className="text-[11px] text-slate-400 font-mono mt-0.5">
              {filteredStats[2].wins}W - {filteredStats[2].losses}L ({filteredStats[2].win_rate}%)
            </span>
            <div className="mt-2 w-full h-12 sm:h-14 bg-slate-800/60 border-t-2 border-amber-700 rounded-t-xl flex items-center justify-center font-black text-amber-600 text-sm">
              3rd
            </div>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-4 sm:px-6 w-16 text-center">Rank</th>
                <th className="py-4 px-4 sm:px-6">Player</th>
                <th className="py-4 px-3 text-center">Played</th>
                <th className="py-4 px-3 text-center">Won</th>
                <th className="py-4 px-3 text-center">Lost</th>
                <th className="py-4 px-4 sm:px-6 min-w-[180px]">Win Rate</th>
                <th className="py-4 px-4 text-right hidden sm:table-cell">Point Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    <Activity className="w-6 h-6 text-emerald-400 animate-spin mx-auto mb-2" />
                    Calculating stats...
                  </td>
                </tr>
              ) : filteredStats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    No stats found. Generate and log matches to see leaderboard standings!
                  </td>
                </tr>
              ) : (
                filteredStats.map((stat, index) => {
                  const rank = index + 1;
                  const pointDiff = (stat.total_points_scored || 0) - (stat.total_points_conceded || 0);

                  return (
                    <tr
                      key={stat.member_id}
                      className={`border-b transition-colors ${getRowHighlight(rank)}`}
                    >
                      {/* Rank */}
                      <td className="py-4 px-4 sm:px-6 text-center">
                        <div className="flex items-center justify-center">
                          {getRankBadge(rank)}
                        </div>
                      </td>

                      {/* Player Info */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-white text-sm sm:text-base flex items-center gap-1.5">
                            {stat.name}
                            {rank === 1 && (
                              <Flame className="w-4 h-4 text-amber-400 inline-block fill-amber-400/30" />
                            )}
                          </span>
                          {stat.nickname && (
                            <span className="text-xs text-slate-400 font-medium">
                              &quot;{stat.nickname}&quot;
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Matches */}
                      <td className="py-4 px-3 text-center font-mono font-bold text-slate-300">
                        {stat.total_matches}
                      </td>

                      {/* Wins */}
                      <td className="py-4 px-3 text-center font-mono font-bold text-emerald-400">
                        {stat.wins}
                      </td>

                      {/* Losses */}
                      <td className="py-4 px-3 text-center font-mono font-bold text-rose-400">
                        {stat.losses}
                      </td>

                      {/* Win Rate Progress Bar */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-white">
                              {stat.win_rate}%
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {stat.wins}/{stat.total_matches}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                stat.win_rate >= 70
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                  : stat.win_rate >= 40
                                  ? 'bg-gradient-to-r from-teal-500 to-amber-400'
                                  : 'bg-gradient-to-r from-amber-500 to-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, stat.win_rate))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Point Diff */}
                      <td className="py-4 px-4 text-right hidden sm:table-cell font-mono text-xs">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-md ${
                            pointDiff > 0
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : pointDiff < 0
                              ? 'text-rose-400 bg-rose-500/10'
                              : 'text-slate-400 bg-slate-800'
                          }`}
                        >
                          {pointDiff > 0 ? `+${pointDiff}` : pointDiff}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
