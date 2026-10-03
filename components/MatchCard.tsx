'use client';

import React, { useState } from 'react';
import { MatchWithPlayers, Member, WinningTeam } from '@/lib/types';
import { 
  Trophy, 
  Trash2, 
  Coffee, 
  Clock, 
  CheckCircle2, 
  Edit3
} from 'lucide-react';
import ScoreTracker from './ScoreTracker';

interface MatchCardProps {
  match: MatchWithPlayers;
  restingMembers?: Member[];
  onSaveScore: (matchId: string, scoreA: number, scoreB: number, winningTeam: WinningTeam) => Promise<void>;
  onDeleteMatch?: (matchId: string) => Promise<void>;
}

export default function MatchCard({
  match,
  restingMembers = [],
  onSaveScore,
  onDeleteMatch,
}: MatchCardProps) {
  const [isScoringOpen, setIsScoringOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isCompleted = match.winning_team === 'TEAM_A' || match.winning_team === 'TEAM_B';
  const teamAWon = match.winning_team === 'TEAM_A';
  const teamBWon = match.winning_team === 'TEAM_B';

  const handleDelete = async () => {
    if (!onDeleteMatch) return;
    if (confirm(`Are you sure you want to delete Round ${match.round_number}?`)) {
      setIsDeleting(true);
      try {
        await onDeleteMatch(match.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="group relative rounded-2xl sm:rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-300 shadow-lg overflow-hidden backdrop-blur-sm">
      {/* Top Banner Status Bar */}
      <div className="px-4 py-2.5 sm:px-6 bg-slate-950/70 border-b border-slate-800/70 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Round {match.round_number}
          </span>
          <span className="text-slate-400 font-medium hidden sm:inline">
            Court {match.court_number || 1}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {teamAWon ? 'Team A Won' : 'Team B Won'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px]">
              <Clock className="w-3 h-3 text-amber-400" />
              In Progress
            </span>
          )}

          {onDeleteMatch && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
              title="Delete Match"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Matchup Container */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Team A */}
          <div
            className={`sm:col-span-5 p-3.5 rounded-2xl border transition-all ${
              teamAWon
                ? 'bg-emerald-950/30 border-emerald-500/40 shadow-inner shadow-emerald-500/10'
                : 'bg-slate-950/40 border-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                Team A
              </span>
              {teamAWon && (
                <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> Winner
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: match.team_a_player1?.avatar_color || '#10b981' }}
                />
                <span className="font-semibold text-white text-sm truncate">
                  {match.team_a_player1?.name || 'Player 1'}
                </span>
                {match.team_a_player1?.nickname && (
                  <span className="text-xs text-slate-400 truncate hidden sm:inline">
                    ({match.team_a_player1.nickname})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: match.team_a_player2?.avatar_color || '#3b82f6' }}
                />
                <span className="font-semibold text-white text-sm truncate">
                  {match.team_a_player2?.name || 'Player 2'}
                </span>
                {match.team_a_player2?.nickname && (
                  <span className="text-xs text-slate-400 truncate hidden sm:inline">
                    ({match.team_a_player2.nickname})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Score display & VS */}
          <div className="sm:col-span-2 flex flex-col items-center justify-center py-1 sm:py-0">
            <div className="flex items-center gap-2 text-2xl sm:text-3xl font-black font-mono tracking-tight">
              <span className={teamAWon ? 'text-emerald-400 font-extrabold' : 'text-slate-300'}>
                {match.score_team_a}
              </span>
              <span className="text-slate-600 text-lg font-normal">:</span>
              <span className={teamBWon ? 'text-teal-400 font-extrabold' : 'text-slate-300'}>
                {match.score_team_b}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              VS
            </span>
          </div>

          {/* Team B */}
          <div
            className={`sm:col-span-5 p-3.5 rounded-2xl border transition-all ${
              teamBWon
                ? 'bg-teal-950/30 border-teal-500/40 shadow-inner shadow-teal-500/10'
                : 'bg-slate-950/40 border-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">
                Team B
              </span>
              {teamBWon && (
                <span className="text-[11px] font-bold text-teal-300 flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> Winner
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: match.team_b_player1?.avatar_color || '#f59e0b' }}
                />
                <span className="font-semibold text-white text-sm truncate">
                  {match.team_b_player1?.name || 'Player 3'}
                </span>
                {match.team_b_player1?.nickname && (
                  <span className="text-xs text-slate-400 truncate hidden sm:inline">
                    ({match.team_b_player1.nickname})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: match.team_b_player2?.avatar_color || '#ec4899' }}
                />
                <span className="font-semibold text-white text-sm truncate">
                  {match.team_b_player2?.name || 'Player 4'}
                </span>
                {match.team_b_player2?.nickname && (
                  <span className="text-xs text-slate-400 truncate hidden sm:inline">
                    ({match.team_b_player2.nickname})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Resting players pill if any */}
        {restingMembers.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center flex-wrap gap-2 text-xs">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Coffee className="w-3.5 h-3.5 text-amber-400" /> Resting this round:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {restingMembers.map((m) => (
                <span
                  key={m.id}
                  className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 text-[11px]"
                >
                  {m.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={() => setIsScoringOpen(!isScoringOpen)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/30 transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isScoringOpen ? 'Hide Score Tracker' : isCompleted ? 'Edit Score & Winner' : 'Track Live Score'}</span>
          </button>
        </div>
      </div>

      {/* Embedded Live Score Tracker Drawer */}
      {isScoringOpen && (
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950/80 animate-fade-in">
          <ScoreTracker
            match={match}
            onSaveScore={async (id, a, b, winner) => {
              await onSaveScore(id, a, b, winner);
              setIsScoringOpen(false);
            }}
            onClose={() => setIsScoringOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
