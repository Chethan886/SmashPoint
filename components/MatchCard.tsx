'use client';

import React, { useState, useMemo } from 'react';
import { Match, MatchWithPlayers, Member, WinningTeam } from '@/lib/types';
import { getBadmintonMatchStatus, isNaturalBadmintonWin } from '@/lib/matchmaking';
import { calculateMatchOdds, MatchOdds } from '@/lib/winProbability';
import { 
  Trophy, 
  Trash2, 
  Coffee, 
  Clock, 
  CheckCircle2, 
  Edit3,
  Plus,
  Minus,
  Flame,
  TrendingUp,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Lock,
  X
} from 'lucide-react';
import Link from 'next/link';

interface MatchCardProps {
  match: MatchWithPlayers;
  restingMembers?: Member[];
  allMatches?: Match[];
  members?: Member[];
  onSaveScore: (matchId: string, scoreA: number, scoreB: number, winningTeam: WinningTeam) => Promise<void>;
  onDeleteMatch?: (matchId: string) => Promise<void>;
}

export default function MatchCard({
  match,
  restingMembers = [],
  allMatches,
  members,
  onSaveScore,
  onDeleteMatch,
}: MatchCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMarkWinner, setShowMarkWinner] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReopened, setIsReopened] = useState(false);

  // Dynamic Gay Rate odds calculation based on past matches
  const odds: MatchOdds | null = useMemo(() => {
    if (!allMatches || !members) return null;
    return calculateMatchOdds(match, allMatches, members);
  }, [match, allMatches, members]);

  // Real-time badminton match status
  const status = getBadmintonMatchStatus(match.score_team_a, match.score_team_b, match.winning_team);
  const hasTeamAWon = status.hasWon && status.winner === 'TEAM_A';
  const hasTeamBWon = status.hasWon && status.winner === 'TEAM_B';
  const isLocked = status.hasWon && !isReopened; // Winner locked once won unless explicitly reopened

  const handleQuickAddScore = async (e: React.MouseEvent, team: 'A' | 'B', delta: number) => {
    e.stopPropagation();
    if (isLocked) return; // Locked: must click Reopen first

    const nextA = team === 'A' ? Math.max(0, match.score_team_a + delta) : match.score_team_a;
    const nextB = team === 'B' ? Math.max(0, match.score_team_b + delta) : match.score_team_b;

    // Check if score satisfies natural badminton win (21+ points with 2 lead, or 30 max)
    const naturalWin = isNaturalBadmintonWin(nextA, nextB);
    let winner: WinningTeam = 'PENDING';

    if (naturalWin.won && naturalWin.winner) {
      winner = naturalWin.winner;
      setIsReopened(false);
      setIsExpanded(false); // Automatically lock and minimize on victory!
    } else {
      setIsReopened(false);
    }

    await onSaveScore(match.id, nextA, nextB, winner);
  };

  const handleMarkWinner = async (chosenWinner: WinningTeam) => {
    setShowMarkWinner(false);
    if (chosenWinner === 'PENDING') {
      setIsReopened(true);
      setIsExpanded(true); // Keep open after reopening so user can edit scores
      await onSaveScore(match.id, match.score_team_a, match.score_team_b, 'PENDING');
      return;
    }

    setIsReopened(false);

    let nextA = match.score_team_a;
    let nextB = match.score_team_b;

    // When explicitly marking a winner, ensure the match has an official winning badminton score (>=21 with 2-point lead)
    if (chosenWinner === 'TEAM_A') {
      if (nextA < 21 || nextA - nextB < 2) {
        nextA = Math.max(21, nextB + 2);
        if (nextA > 30) nextA = 30;
      }
    } else if (chosenWinner === 'TEAM_B') {
      if (nextB < 21 || nextB - nextA < 2) {
        nextB = Math.max(21, nextA + 2);
        if (nextB > 30) nextB = 30;
      }
    }

    await onSaveScore(match.id, nextA, nextB, chosenWinner);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDeleteMatch) return;
    setIsDeleting(true);
    try {
      await onDeleteMatch(match.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Minimized Compact Card for Completed Matches
  if (status.hasWon && !isExpanded) {
    return (
      <div className="rounded-2xl sm:rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all p-3 sm:p-3.5 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-extrabold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] sm:text-xs flex-shrink-0">
              R{match.round_number}
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] sm:text-[11px] flex-shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              {hasTeamAWon ? 'Team A Won' : 'Team B Won'}
            </span>

            <div className="min-w-0 flex-1 flex items-center gap-1.5 text-xs text-slate-300 truncate font-semibold">
              <span className={`truncate ${hasTeamAWon ? 'text-emerald-300 font-bold' : 'text-slate-400'}`}>
                {match.team_a_player1?.name} &amp; {match.team_a_player2?.name}
              </span>
              <span className="font-mono font-black text-white px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] flex-shrink-0">
                {match.score_team_a} - {match.score_team_b}
              </span>
              <span className={`truncate ${hasTeamBWon ? 'text-teal-300 font-bold' : 'text-slate-400'}`}>
                {match.team_b_player1?.name} &amp; {match.team_b_player2?.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Arrow button to maximize */}
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 text-xs font-bold active:scale-95 transition-all border border-slate-700"
              title="Maximize Match Details"
            >
              <span className="hidden sm:inline text-[11px]">Details</span>
              <ChevronDown className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Dynamic Match State Pill (Won / Deuce / Match Point / Leading / Tied) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {status.badgeType === 'won' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] sm:text-[11px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              {hasTeamAWon ? 'Team A Won' : 'Team B Won'}
            </span>
          )}

          {status.badgeType === 'deuce' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] sm:text-[11px] animate-pulse">
              <Flame className="w-3 h-3 text-amber-400" />
              {status.label}
            </span>
          )}

          {status.badgeType === 'match_point' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] sm:text-[11px] animate-pulse">
              <Flame className="w-3 h-3 text-amber-400" />
              {status.label}
            </span>
          )}

          {status.badgeType === 'leading' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 text-[10px] sm:text-[11px]">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              {status.label}
            </span>
          )}

          {status.badgeType === 'tied' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-300 border border-slate-700 text-[10px] sm:text-[11px]">
              <Clock className="w-2.5 h-2.5 text-slate-400" />
              {status.label}
            </span>
          )}

          {status.hasWon && (
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800/80 border border-slate-700/80 transition-colors"
              title="Minimize Match"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          )}

          {onDeleteMatch && (
            showDeleteConfirm ? (
              <div className="flex items-center gap-1 bg-rose-950/90 border border-rose-500/50 rounded-xl px-2 py-0.5 animate-scale-up">
                <span className="text-[10px] text-rose-300 font-bold">Delete R{match.round_number}?</span>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="p-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] active:scale-95"
                  title="Confirm Delete"
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(false);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-white text-[10px]"
                  title="Cancel"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                disabled={isDeleting}
                className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                title="Delete Match"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )
          )}
        </div>
      </div>

      {/* Compact Sports-Style Match Rows */}
      <div className="p-3 sm:p-4 space-y-2">
        {/* Team A Row */}
        <div
          className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all ${
            hasTeamAWon
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
                {hasTeamAWon && (
                  <Trophy className="w-3.5 h-3.5 text-amber-400 inline-block flex-shrink-0 fill-amber-400/20" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[10px] text-emerald-400/80 font-medium">Team A</span>
                {odds && (
                  <span 
                    className="inline-flex items-center gap-1 text-[10px] text-pink-300 font-extrabold bg-pink-500/15 px-1.5 py-0.5 rounded-md border border-pink-500/30 shadow-sm"
                    title={`Individual Gay Rates: ${odds.players.a1?.name || 'P1'} (${odds.players.a1?.gayRate}%), ${odds.players.a2?.name || 'P2'} (${odds.players.a2?.gayRate}%)`}
                  >
                    <span className="text-[11px] leading-none">💅</span>
                    <span>Gay Rate: {odds.teamAGayRate}%</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Score Stepper */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={(e) => handleQuickAddScore(e, 'A', -1)}
              disabled={isLocked || match.score_team_a <= 0}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-800 active:bg-slate-700 text-slate-300 flex items-center justify-center text-xs transition-opacity ${
                isLocked ? 'opacity-30 cursor-not-allowed' : 'disabled:opacity-30 disabled:cursor-not-allowed'
              }`}
              title={isLocked ? 'Scores locked because match has won. Click Reopen to edit.' : 'Decrease score'}
            >
              <Minus className="w-3 h-3" />
            </button>

            <div className="flex items-center justify-center gap-0.5 w-10">
              {isLocked && <Lock className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />}
              <span className={`text-center font-mono font-black text-lg sm:text-xl ${hasTeamAWon ? 'text-emerald-400' : 'text-white'}`}>
                {match.score_team_a}
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => handleQuickAddScore(e, 'A', 1)}
              disabled={isLocked}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-600 active:bg-emerald-500 text-white flex items-center justify-center text-xs shadow-sm shadow-emerald-600/30 transition-opacity ${
                isLocked ? 'opacity-30 cursor-not-allowed' : ''
              }`}
              title={isLocked ? 'Scores locked because match has won. Click Reopen to edit.' : 'Increase score'}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Gay Meter Bar */}
        {odds && (
          <div className="px-1 py-0.5 flex items-center justify-between gap-2 text-[9px]">
            <span className="font-extrabold uppercase text-pink-400/90 flex items-center gap-1 tracking-wider">
              <span className="text-[11px] leading-none">💅</span>
              Gay Meter
            </span>
            <div className="flex-1 max-w-[120px] sm:max-w-[160px] h-1.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800/80">
              <div
                className="h-full bg-gradient-to-r from-pink-600 to-rose-400 transition-all duration-500"
                style={{ width: `${odds.teamAGayRate}%` }}
                title={`Team A: ${odds.teamAGayRate}%`}
              />
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${odds.teamBGayRate}%` }}
                title={`Team B: ${odds.teamBGayRate}%`}
              />
            </div>
            <span className="font-mono text-slate-400 font-bold">
              {odds.teamAGayRate}% vs {odds.teamBGayRate}%
            </span>
          </div>
        )}

        {/* Team B Row */}
        <div
          className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all ${
            hasTeamBWon
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
                {hasTeamBWon && (
                  <Trophy className="w-3.5 h-3.5 text-amber-400 inline-block flex-shrink-0 fill-amber-400/20" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[10px] text-teal-400/80 font-medium">Team B</span>
                {odds && (
                  <span 
                    className="inline-flex items-center gap-1 text-[10px] text-pink-300 font-extrabold bg-pink-500/15 px-1.5 py-0.5 rounded-md border border-pink-500/30 shadow-sm"
                    title={`Individual Gay Rates: ${odds.players.b1?.name || 'P3'} (${odds.players.b1?.gayRate}%), ${odds.players.b2?.name || 'P4'} (${odds.players.b2?.gayRate}%)`}
                  >
                    <span className="text-[11px] leading-none">💅</span>
                    <span>Gay Rate: {odds.teamBGayRate}%</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Score Stepper */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={(e) => handleQuickAddScore(e, 'B', -1)}
              disabled={isLocked || match.score_team_b <= 0}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-800 active:bg-slate-700 text-slate-300 flex items-center justify-center text-xs transition-opacity ${
                isLocked ? 'opacity-30 cursor-not-allowed' : 'disabled:opacity-30 disabled:cursor-not-allowed'
              }`}
              title={isLocked ? 'Scores locked because match has won. Click Reopen to edit.' : 'Decrease score'}
            >
              <Minus className="w-3 h-3" />
            </button>

            <div className="flex items-center justify-center gap-0.5 w-10">
              {isLocked && <Lock className="w-2.5 h-2.5 text-teal-400 flex-shrink-0" />}
              <span className={`text-center font-mono font-black text-lg sm:text-xl ${hasTeamBWon ? 'text-teal-400' : 'text-white'}`}>
                {match.score_team_b}
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => handleQuickAddScore(e, 'B', 1)}
              disabled={isLocked}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-teal-600 active:bg-teal-500 text-white flex items-center justify-center text-xs shadow-sm shadow-teal-600/30 transition-opacity ${
                isLocked ? 'opacity-30 cursor-not-allowed' : ''
              }`}
              title={isLocked ? 'Scores locked because match has won. Click Reopen to edit.' : 'Increase score'}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card Footer: Resting, Mark Winner button, and Scoreboard Link */}
        <div className="pt-1.5 flex items-center justify-between text-xs gap-2 flex-wrap">
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

          <div className="flex items-center gap-1.5">
            {/* Small Button to Mark and Save a Winner */}
            {isLocked ? (
              <button
                type="button"
                onClick={() => handleMarkWinner('PENDING')}
                className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                title="Reopen match to unlock and edit scores"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reopen Match</span>
              </button>
            ) : (
              <div className="relative">
                {showMarkWinner ? (
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-700 shadow-lg">
                    <button
                      type="button"
                      onClick={() => handleMarkWinner('TEAM_A')}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95"
                    >
                      A Won
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMarkWinner('TEAM_B')}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-teal-600 text-white hover:bg-teal-500 active:scale-95"
                    >
                      B Won
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMarkWinner(false)}
                      className="text-slate-500 hover:text-slate-300 px-1 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowMarkWinner(true)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-amber-400 hover:text-white bg-amber-500/10 hover:bg-amber-600/30 border border-amber-500/30 transition-colors flex items-center gap-1"
                  >
                    <Trophy className="w-3 h-3" />
                    <span>Mark Winner</span>
                  </button>
                )}
              </div>
            )}

            {/* Scoreboard Link */}
            <Link
              href={`/scoreboard?matchId=${match.id}`}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-600/30 border border-emerald-500/30 transition-colors flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              <span>Scoreboard</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
