'use client';

import React, { useState } from 'react';
import { MatchWithPlayers, WinningTeam } from '@/lib/types';
import { 
  Trophy, 
  Plus, 
  Minus, 
  RotateCcw, 
  Check, 
  Flame, 
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ScoreTrackerProps {
  match: MatchWithPlayers;
  onSaveScore: (matchId: string, scoreA: number, scoreB: number, winningTeam: WinningTeam) => Promise<void>;
  onClose?: () => void;
}

export default function ScoreTracker({ match, onSaveScore, onClose }: ScoreTrackerProps) {
  const [scoreA, setScoreA] = useState<number>(match.score_team_a || 0);
  const [scoreB, setScoreB] = useState<number>(match.score_team_b || 0);
  const [winner, setWinner] = useState<WinningTeam>(match.winning_team || 'PENDING');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const triggerVictoryConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'],
      });
    } catch (e) {
      // Confetti fallback
    }
  };

  const handleAdjust = (team: 'A' | 'B', delta: number) => {
    if (team === 'A') {
      const next = Math.max(0, scoreA + delta);
      setScoreA(next);
      if (next > scoreB) setWinner('TEAM_A');
      else if (next < scoreB) setWinner('TEAM_B');
    } else {
      const next = Math.max(0, scoreB + delta);
      setScoreB(next);
      if (next > scoreA) setWinner('TEAM_B');
      else if (next < scoreA) setWinner('TEAM_A');
    }
  };

  const handleSetQuickScore = (targetA: number, targetB: number, winTeam: WinningTeam) => {
    setScoreA(targetA);
    setScoreB(targetB);
    setWinner(winTeam);
  };

  const handleResetScores = () => {
    setScoreA(0);
    setScoreB(0);
    setWinner('PENDING');
  };

  const handleConfirmWinner = async (chosenWinner?: WinningTeam) => {
    setIsSaving(true);
    const finalWinner = chosenWinner || (scoreA > scoreB ? 'TEAM_A' : scoreB > scoreA ? 'TEAM_B' : winner);
    
    if (finalWinner !== 'PENDING') {
      triggerVictoryConfetti();
    }

    try {
      await onSaveScore(match.id, scoreA, scoreB, finalWinner);
      if (onClose) {
        setTimeout(onClose, 600);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const isMatchPoint = (scoreA >= 20 || scoreB >= 20) && Math.abs(scoreA - scoreB) >= 1;

  return (
    <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute -top-16 -left-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            Round {match.round_number}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
            Court {match.court_number || 1}
          </span>
          {isMatchPoint && (
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
              <Flame className="w-3.5 h-3.5" /> Match Point!
            </span>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        )}
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative">
        {/* VS divider for large screens */}
        <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950 border border-slate-700 items-center justify-center text-xs font-black text-slate-400 z-10 shadow-lg">
          VS
        </div>

        {/* TEAM A */}
        <div
          className={`p-5 rounded-2xl border transition-all duration-300 ${
            winner === 'TEAM_A'
              ? 'bg-gradient-to-b from-emerald-950/60 to-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-900/30'
              : 'bg-slate-950/70 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Team A
            </span>
            {winner === 'TEAM_A' && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <Trophy className="w-3 h-3" /> Winner
              </span>
            )}
          </div>

          {/* Players */}
          <div className="space-y-1.5 mb-5">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: match.team_a_player1?.avatar_color || '#10b981' }}
              />
              <span className="font-bold text-white text-base">
                {match.team_a_player1?.name || 'Player 1'}
              </span>
              {match.team_a_player1?.nickname && (
                <span className="text-xs text-slate-400">({match.team_a_player1.nickname})</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: match.team_a_player2?.avatar_color || '#3b82f6' }}
              />
              <span className="font-bold text-white text-base">
                {match.team_a_player2?.name || 'Player 2'}
              </span>
              {match.team_a_player2?.nickname && (
                <span className="text-xs text-slate-400">({match.team_a_player2.nickname})</span>
              )}
            </div>
          </div>

          {/* Score Counter */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => handleAdjust('A', -1)}
              disabled={scoreA <= 0}
              className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-200 hover:text-white transition-transform active:scale-95 shadow-md"
            >
              <Minus className="w-5 h-5" />
            </button>

            <input
              type="number"
              min={0}
              value={scoreA}
              onChange={(e) => setScoreA(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-24 h-16 text-center text-4xl font-extrabold font-mono bg-slate-950/80 rounded-2xl border border-slate-700 focus:border-emerald-500 text-white focus:outline-none"
            />

            <button
              onClick={() => handleAdjust('A', 1)}
              className="w-12 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white transition-transform active:scale-95 shadow-lg shadow-emerald-600/30"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setWinner('TEAM_A')}
              className={`w-full py-2 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                winner === 'TEAM_A'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-emerald-500/50 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              {winner === 'TEAM_A' ? 'Marked as Winner' : 'Mark Team A as Winner'}
            </button>
          </div>
        </div>

        {/* TEAM B */}
        <div
          className={`p-5 rounded-2xl border transition-all duration-300 ${
            winner === 'TEAM_B'
              ? 'bg-gradient-to-b from-teal-950/60 to-slate-900 border-teal-500/60 shadow-lg shadow-teal-900/30'
              : 'bg-slate-950/70 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Team B
            </span>
            {winner === 'TEAM_B' && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center gap-1">
                <Trophy className="w-3 h-3" /> Winner
              </span>
            )}
          </div>

          {/* Players */}
          <div className="space-y-1.5 mb-5">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: match.team_b_player1?.avatar_color || '#f59e0b' }}
              />
              <span className="font-bold text-white text-base">
                {match.team_b_player1?.name || 'Player 3'}
              </span>
              {match.team_b_player1?.nickname && (
                <span className="text-xs text-slate-400">({match.team_b_player1.nickname})</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: match.team_b_player2?.avatar_color || '#ec4899' }}
              />
              <span className="font-bold text-white text-base">
                {match.team_b_player2?.name || 'Player 4'}
              </span>
              {match.team_b_player2?.nickname && (
                <span className="text-xs text-slate-400">({match.team_b_player2.nickname})</span>
              )}
            </div>
          </div>

          {/* Score Counter */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => handleAdjust('B', -1)}
              disabled={scoreB <= 0}
              className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-200 hover:text-white transition-transform active:scale-95 shadow-md"
            >
              <Minus className="w-5 h-5" />
            </button>

            <input
              type="number"
              min={0}
              value={scoreB}
              onChange={(e) => setScoreB(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-24 h-16 text-center text-4xl font-extrabold font-mono bg-slate-950/80 rounded-2xl border border-slate-700 focus:border-teal-500 text-white focus:outline-none"
            />

            <button
              onClick={() => handleAdjust('B', 1)}
              className="w-12 h-12 rounded-2xl bg-teal-600 hover:bg-teal-500 flex items-center justify-center text-white transition-transform active:scale-95 shadow-lg shadow-teal-600/30"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setWinner('TEAM_B')}
              className={`w-full py-2 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                winner === 'TEAM_B'
                  ? 'bg-teal-500 text-slate-950 border-teal-400 font-extrabold'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-teal-500/50 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              {winner === 'TEAM_B' ? 'Marked as Winner' : 'Mark Team B as Winner'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Presets & Controls */}
      <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Quick Sets:</span>
          <button
            type="button"
            onClick={() => handleSetQuickScore(21, 19, 'TEAM_A')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
          >
            21-19
          </button>
          <button
            type="button"
            onClick={() => handleSetQuickScore(19, 21, 'TEAM_B')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
          >
            19-21
          </button>
          <button
            type="button"
            onClick={() => handleSetQuickScore(15, 11, 'TEAM_A')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
          >
            15-11
          </button>
          <button
            type="button"
            onClick={handleResetScores}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
            title="Reset scores"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Log Winner / Save Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleConfirmWinner('PENDING')}
            disabled={isSaving}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Save as In-Progress
          </button>
          <button
            onClick={() => handleConfirmWinner()}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 hover:opacity-95 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            {isSaving ? (
              <span>Saving...</span>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Log Winner & Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
