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
  X,
  Users,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ScoreTrackerProps {
  match: MatchWithPlayers;
  onSaveScore: (matchId: string, scoreA: number, scoreB: number, winningTeam: WinningTeam) => Promise<void>;
  onClose: () => void;
}

export default function ScoreTracker({ match, onSaveScore, onClose }: ScoreTrackerProps) {
  const [scoreA, setScoreA] = useState<number>(match.score_team_a || 0);
  const [scoreB, setScoreB] = useState<number>(match.score_team_b || 0);
  const [winner, setWinner] = useState<WinningTeam>(match.winning_team || 'PENDING');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const triggerVictoryConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'],
      });
    } catch {
      // fallback
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
      setTimeout(onClose, 500);
    } finally {
      setIsSaving(false);
    }
  };

  const isMatchPoint = (scoreA >= 20 || scoreB >= 20) && Math.abs(scoreA - scoreB) >= 1;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 w-screen h-[100dvh] flex flex-col justify-between text-white p-3 sm:p-6 overflow-y-auto">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            Round {match.round_number}
          </span>
          <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300">
            Court {match.court_number || 1}
          </span>
          {isMatchPoint && (
            <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
              <Flame className="w-3.5 h-3.5" /> Match Point!
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors active:scale-95"
          aria-label="Close scoreboard"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Scoreboard: 2 Giant Team Zones */}
      <div className="flex-1 my-3 sm:my-4 flex flex-col gap-3 justify-center max-w-2xl mx-auto w-full">
        {/* TEAM A SECTION */}
        <div
          className={`flex-1 flex flex-col justify-between p-4 sm:p-5 rounded-3xl border transition-all ${
            winner === 'TEAM_A'
              ? 'bg-gradient-to-b from-emerald-950/70 to-slate-900 border-emerald-500/60 shadow-xl shadow-emerald-950/40'
              : 'bg-slate-900/70 border-slate-800'
          }`}
        >
          {/* Team A Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Team A
              </span>
              <div className="flex items-center gap-1.5 font-bold text-sm sm:text-base text-white">
                <span className="truncate">{match.team_a_player1?.name || 'P1'}</span>
                <span className="text-slate-500">&amp;</span>
                <span className="truncate">{match.team_a_player2?.name || 'P2'}</span>
              </div>
            </div>

            {winner === 'TEAM_A' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-slate-950 flex items-center gap-1 shadow-sm">
                <Trophy className="w-3 h-3 fill-slate-950" /> Winner
              </span>
            )}
          </div>

          {/* Big Score & Stepper Controls */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 my-2">
            <button
              onClick={() => handleAdjust('A', -1)}
              disabled={scoreA <= 0}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800/90 active:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center text-white active:scale-90 transition-transform shadow-md"
            >
              <Minus className="w-6 h-6 stroke-[3]" />
            </button>

            {/* Giant Score Tap Area */}
            <div
              onClick={() => handleAdjust('A', 1)}
              className="flex-1 max-w-[180px] h-20 sm:h-24 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-center cursor-pointer select-none active:scale-95 transition-transform"
              title="Tap to add point"
            >
              <span className="text-5xl sm:text-6xl font-black font-mono text-emerald-400 tracking-tight">
                {scoreA}
              </span>
            </div>

            <button
              onClick={() => handleAdjust('A', 1)}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-600 active:bg-emerald-500 flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg shadow-emerald-600/30"
            >
              <Plus className="w-7 h-7 stroke-[3]" />
            </button>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setWinner('TEAM_A')}
              className={`text-xs px-3 py-1 rounded-xl font-bold transition-colors ${
                winner === 'TEAM_A'
                  ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
              }`}
            >
              {winner === 'TEAM_A' ? '✓ Winner Selected' : 'Mark Team A Winner'}
            </button>
          </div>
        </div>

        {/* Court Net Divider */}
        <div className="flex items-center justify-center py-0.5">
          <div className="h-[1px] bg-slate-800 flex-1" />
          <span className="px-3 text-[10px] font-black uppercase text-slate-500 tracking-widest">
            🏸 COURT NET
          </span>
          <div className="h-[1px] bg-slate-800 flex-1" />
        </div>

        {/* TEAM B SECTION */}
        <div
          className={`flex-1 flex flex-col justify-between p-4 sm:p-5 rounded-3xl border transition-all ${
            winner === 'TEAM_B'
              ? 'bg-gradient-to-b from-teal-950/70 to-slate-900 border-teal-500/60 shadow-xl shadow-teal-950/40'
              : 'bg-slate-900/70 border-slate-800'
          }`}
        >
          {/* Team B Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-teal-500/20 text-teal-400 border border-teal-500/30">
                Team B
              </span>
              <div className="flex items-center gap-1.5 font-bold text-sm sm:text-base text-white">
                <span className="truncate">{match.team_b_player1?.name || 'P3'}</span>
                <span className="text-slate-500">&amp;</span>
                <span className="truncate">{match.team_b_player2?.name || 'P4'}</span>
              </div>
            </div>

            {winner === 'TEAM_B' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-400 text-slate-950 flex items-center gap-1 shadow-sm">
                <Trophy className="w-3 h-3 fill-slate-950" /> Winner
              </span>
            )}
          </div>

          {/* Big Score & Stepper Controls */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 my-2">
            <button
              onClick={() => handleAdjust('B', -1)}
              disabled={scoreB <= 0}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800/90 active:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center text-white active:scale-90 transition-transform shadow-md"
            >
              <Minus className="w-6 h-6 stroke-[3]" />
            </button>

            {/* Giant Score Tap Area */}
            <div
              onClick={() => handleAdjust('B', 1)}
              className="flex-1 max-w-[180px] h-20 sm:h-24 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-center cursor-pointer select-none active:scale-95 transition-transform"
              title="Tap to add point"
            >
              <span className="text-5xl sm:text-6xl font-black font-mono text-teal-400 tracking-tight">
                {scoreB}
              </span>
            </div>

            <button
              onClick={() => handleAdjust('B', 1)}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-teal-600 active:bg-teal-500 flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg shadow-teal-600/30"
            >
              <Plus className="w-7 h-7 stroke-[3]" />
            </button>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setWinner('TEAM_B')}
              className={`text-xs px-3 py-1 rounded-xl font-bold transition-colors ${
                winner === 'TEAM_B'
                  ? 'text-teal-300 bg-teal-500/20 border border-teal-500/40'
                  : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
              }`}
            >
              {winner === 'TEAM_B' ? '✓ Winner Selected' : 'Mark Team B Winner'}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="pt-2 sm:pt-3 border-t border-slate-800/80 max-w-2xl mx-auto w-full flex-shrink-0 space-y-2.5 pb-safe">
        {/* Quick Sets & Reset */}
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-medium">Quick Sets:</span>
            <button
              type="button"
              onClick={() => handleSetQuickScore(21, 19, 'TEAM_A')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-mono text-slate-300 active:scale-95 transition-transform"
            >
              21-19
            </button>
            <button
              type="button"
              onClick={() => handleSetQuickScore(19, 21, 'TEAM_B')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-mono text-slate-300 active:scale-95 transition-transform"
            >
              19-21
            </button>
            <button
              type="button"
              onClick={() => handleSetQuickScore(15, 11, 'TEAM_A')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-mono text-slate-300 active:scale-95 transition-transform"
            >
              15-11
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetScores}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-900 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        {/* Big Primary Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleConfirmWinner('PENDING')}
            disabled={isSaving}
            className="py-3 px-3 rounded-2xl text-xs font-bold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 active:scale-95 transition-all text-center"
          >
            Save In-Progress
          </button>

          <button
            type="button"
            onClick={() => handleConfirmWinner()}
            disabled={isSaving}
            className="py-3 px-4 rounded-2xl text-xs font-black text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-300 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            {isSaving ? (
              <span>Saving...</span>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Log Winner &amp; Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
