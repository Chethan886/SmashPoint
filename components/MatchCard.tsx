'use client';

import React, { useState } from 'react';
import { MatchWithPlayers, Member, WinningTeam } from '@/lib/types';
import { 
  Trophy, 
  Trash2, 
  Coffee, 
  Clock, 
  CheckCircle2, 
  Edit3,
  Plus,
  Minus
} from 'lucide-react';

interface MatchCardProps {
  match: MatchWithPlayers;
  restingMembers?: Member[];
  onSaveScore: (matchId: string, scoreA: number, scoreB: number, winningTeam: WinningTeam) => Promise<void>;
  onDeleteMatch?: (matchId: string) => Promise<void>;
  onOpenScoreboard: (match: MatchWithPlayers) => void;
}

export default function MatchCard({
  match,
  restingMembers = [],
  onSaveScore,
  onDeleteMatch,
  onOpenScoreboard,
}: MatchCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const isCompleted = match.winning_team === 'TEAM_A' || match.winning_team === 'TEAM_B';
  const teamAWon = match.winning_team === 'TEAM_A';
  const teamBWon = match.winning_team === 'TEAM_B';

  const handleQuickAddScore = async (e: React.MouseEvent, team: 'A' | 'B', delta: number) => {
    e.stopPropagation();
    const nextA = team === 'A' ? Math.max(0, match.score_team_a + delta) : match.score_team_a;
    const nextB = team === 'B' ? Math.max(0, match.score_team_b + delta) : match.score_team_b;
    let winner: WinningTeam = match.winning_team;
    if (nextA > nextB) winner = 'TEAM_A';
    else if (nextB > nextA) winner = 'TEAM_B';
    await onSaveScore(match.id, nextA, nextB, winner);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDeleteMatch) return;
    if (confirm(`Delete Round ${match.round_number}?`)) {
      setIsDeleting(true);
      try {
        await onDeleteMatch(match.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 transition-all duration-200 shadow-md backdrop-blur-sm">
      {/* Top Status Header */}
      <div className="px-3.5 py-2 sm:px-5 sm:py-2.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between gap-2 text-xs rounded-t-2xl sm:rounded-t-3xl">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="font-extrabold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] sm:text-xs">
            R{match.round_number}
          </span>
          <span className="text-slate-400 font-medium text-[11px] sm:text-xs">
            Court {match.court_number || 1}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] sm:text-[11px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              {teamAWon ? 'Team A Won' : 'Team B Won'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] sm:text-[11px]">
              <Clock className="w-2.5 h-2.5 text-amber-400" />
              In Progress
            </span>
          )}

          {onDeleteMatch && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
              title="Delete Match"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Compact Sports-Style Match Rows */}
      <div className="p-3 sm:p-4 space-y-2">
        {/* Team A Row */}
        <div
          className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all ${
            teamAWon
              ? 'bg-emerald-950/40 border-emerald-500/50 shadow-inner shadow-emerald-500/10'
              : 'bg-slate-950/50 border-slate-800/80'
          }`}
        >
          {/* Players */}
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <div className="flex -space-x-1 flex-shrink-0">
              <span
                className="w-3 h-3 rounded-full border border-slate-900"
                style={{ backgroundColor: match.team_a_player1?.avatar_color || '#10b981' }}
              />
              <span
                className="w-3 h-3 rounded-full border border-slate-900"
                style={{ backgroundColor: match.team_a_player2?.avatar_color || '#3b82f6' }}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-white text-xs sm:text-sm truncate">
                  {match.team_a_player1?.name || 'P1'} &amp; {match.team_a_player2?.name || 'P2'}
                </span>
                {teamAWon && (
                  <Trophy className="w-3.5 h-3.5 text-amber-400 inline-block flex-shrink-0 fill-amber-400/20" />
                )}
              </div>
              <span className="text-[10px] text-emerald-400/80 font-medium">Team A</span>
            </div>
          </div>

          {/* Quick Score Stepper */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={(e) => handleQuickAddScore(e, 'A', -1)}
              disabled={match.score_team_a <= 0}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-800 active:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xs"
            >
              <Minus className="w-3 h-3" />
            </button>

            <span className={`w-9 text-center font-mono font-black text-lg sm:text-xl ${teamAWon ? 'text-emerald-400' : 'text-white'}`}>
              {match.score_team_a}
            </span>

            <button
              type="button"
              onClick={(e) => handleQuickAddScore(e, 'A', 1)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-600 active:bg-emerald-500 text-white flex items-center justify-center text-xs shadow-sm shadow-emerald-600/30"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Team B Row */}
        <div
          className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all ${
            teamBWon
              ? 'bg-teal-950/40 border-teal-500/50 shadow-inner shadow-teal-500/10'
              : 'bg-slate-950/50 border-slate-800/80'
          }`}
        >
          {/* Players */}
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <div className="flex -space-x-1 flex-shrink-0">
              <span
                className="w-3 h-3 rounded-full border border-slate-900"
                style={{ backgroundColor: match.team_b_player1?.avatar_color || '#f59e0b' }}
              />
              <span
                className="w-3 h-3 rounded-full border border-slate-900"
                style={{ backgroundColor: match.team_b_player2?.avatar_color || '#ec4899' }}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-white text-xs sm:text-sm truncate">
                  {match.team_b_player1?.name || 'P3'} &amp; {match.team_b_player2?.name || 'P4'}
                </span>
                {teamBWon && (
                  <Trophy className="w-3.5 h-3.5 text-amber-400 inline-block flex-shrink-0 fill-amber-400/20" />
                )}
              </div>
              <span className="text-[10px] text-teal-400/80 font-medium">Team B</span>
            </div>
          </div>

          {/* Quick Score Stepper */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={(e) => handleQuickAddScore(e, 'B', -1)}
              disabled={match.score_team_b <= 0}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-800 active:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xs"
            >
              <Minus className="w-3 h-3" />
            </button>

            <span className={`w-9 text-center font-mono font-black text-lg sm:text-xl ${teamBWon ? 'text-teal-400' : 'text-white'}`}>
              {match.score_team_b}
            </span>

            <button
              type="button"
              onClick={(e) => handleQuickAddScore(e, 'B', 1)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-teal-600 active:bg-teal-500 text-white flex items-center justify-center text-xs shadow-sm shadow-teal-600/30"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card Footer: Resting Players & Action */}
        <div className="pt-1.5 flex items-center justify-between text-xs gap-2">
          {restingMembers.length > 0 ? (
            <div className="flex items-center gap-1 text-slate-400 text-[11px] truncate">
              <Coffee className="w-3 h-3 text-amber-400 flex-shrink-0" />
              <span className="text-slate-500">Rest:</span>
              <span className="text-slate-300 font-medium truncate">
                {restingMembers.map((m) => m.name).join(', ')}
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-500">All players active</span>
          )}

          <button
            type="button"
            onClick={() => onOpenScoreboard(match)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-600 border border-emerald-500/30 transition-colors flex items-center gap-1.5 flex-shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Scoreboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
