'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MatchWithPlayers, Member, WinningTeam } from '@/lib/types';
import { dataService } from '@/lib/dataService';
import { getBadmintonMatchStatus, isNaturalBadmintonWin } from '@/lib/matchmaking';
import { 
  Trophy, 
  Plus, 
  Minus, 
  RotateCcw, 
  Check, 
  Flame, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Coffee,
  TrendingUp,
  CheckCircle2,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Link from 'next/link';

function ScoreboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMatchId = searchParams.get('matchId');

  const [matches, setMatches] = useState<MatchWithPlayers[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [reopenedMatchIds, setReopenedMatchIds] = useState<Set<string>>(new Set());

  // Touch gesture state for swiping
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [membersData, currentSession] = await Promise.all([
        dataService.getMembers(),
        dataService.getOrCreateTodaySession(),
      ]);

      setMembers(membersData);

      if (currentSession) {
        const rawMatches = await dataService.getMatchesBySession(currentSession.id);
        const memberMap = new Map(membersData.map((m) => [m.id, m]));
        const populated: MatchWithPlayers[] = rawMatches.map((m) => ({
          ...m,
          team_a_player1: memberMap.get(m.team_a_player1_id),
          team_a_player2: memberMap.get(m.team_a_player2_id),
          team_b_player1: memberMap.get(m.team_b_player1_id),
          team_b_player2: memberMap.get(m.team_b_player2_id),
        }));

        setMatches(populated);

        if (initialMatchId) {
          const foundIdx = populated.findIndex((m) => m.id === initialMatchId);
          if (foundIdx !== -1) {
            setCurrentIndex(foundIdx);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load scoreboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentMatch = matches[currentIndex];

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < matches.length - 1) {
      // Swiped left -> Next Match
      goToMatch(currentIndex + 1);
    } else if (isRightSwipe && currentIndex > 0) {
      // Swiped right -> Prev Match
      goToMatch(currentIndex - 1);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const goToMatch = (index: number) => {
    if (index >= 0 && index < matches.length) {
      setCurrentIndex(index);
    }
  };

  const handleAdjustScore = async (team: 'A' | 'B', delta: number) => {
    if (!currentMatch) return;
    const curStatus = getBadmintonMatchStatus(currentMatch.score_team_a, currentMatch.score_team_b, currentMatch.winning_team);
    const isCurrentlyReopened = reopenedMatchIds.has(currentMatch.id);
    if (curStatus.hasWon && !isCurrentlyReopened) return; // Locked: Must click Reopen first!

    const curA = currentMatch.score_team_a;
    const curB = currentMatch.score_team_b;
    const nextA = team === 'A' ? Math.max(0, curA + delta) : curA;
    const nextB = team === 'B' ? Math.max(0, curB + delta) : curB;

    // Use official badminton rules to determine if match was naturally won
    const naturalWin = isNaturalBadmintonWin(nextA, nextB);
    let nextWinner: WinningTeam = 'PENDING';

    if (naturalWin.won && naturalWin.winner) {
      nextWinner = naturalWin.winner;
      setReopenedMatchIds((prev) => {
        const next = new Set(prev);
        next.delete(currentMatch.id);
        return next;
      });
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'],
        });
      } catch {}
    }

    // Optimistic UI update
    setMatches((prev) =>
      prev.map((m) =>
        m.id === currentMatch.id
          ? { ...m, score_team_a: nextA, score_team_b: nextB, winning_team: nextWinner }
          : m
      )
    );

    await dataService.updateMatch(currentMatch.id, {
      score_team_a: nextA,
      score_team_b: nextB,
      winning_team: nextWinner,
    });
  };

  const handleQuickSet = async (targetA: number, targetB: number, winTeam: WinningTeam) => {
    if (!currentMatch || isLocked) return;
    setReopenedMatchIds((prev) => {
      const next = new Set(prev);
      next.delete(currentMatch.id);
      return next;
    });
    setMatches((prev) =>
      prev.map((m) =>
        m.id === currentMatch.id
          ? { ...m, score_team_a: targetA, score_team_b: targetB, winning_team: winTeam }
          : m
      )
    );

    await dataService.updateMatch(currentMatch.id, {
      score_team_a: targetA,
      score_team_b: targetB,
      winning_team: winTeam,
    });
  };

  const handleResetScores = async () => {
    if (!currentMatch || isLocked) return;
    setMatches((prev) =>
      prev.map((m) =>
        m.id === currentMatch.id
          ? { ...m, score_team_a: 0, score_team_b: 0, winning_team: 'PENDING' }
          : m
      )
    );

    await dataService.updateMatch(currentMatch.id, {
      score_team_a: 0,
      score_team_b: 0,
      winning_team: 'PENDING',
    });
  };

  const handleSetWinner = async (chosenWinner: WinningTeam) => {
    if (!currentMatch) return;
    if (chosenWinner === 'PENDING') {
      setReopenedMatchIds((prev) => new Set(prev).add(currentMatch.id));
      setMatches((prev) =>
        prev.map((m) =>
          m.id === currentMatch.id ? { ...m, winning_team: 'PENDING' } : m
        )
      );
      await dataService.updateMatch(currentMatch.id, {
        winning_team: 'PENDING',
      });
      return;
    }

    setReopenedMatchIds((prev) => {
      const next = new Set(prev);
      next.delete(currentMatch.id);
      return next;
    });

    let nextA = currentMatch.score_team_a;
    let nextB = currentMatch.score_team_b;

    // Ensure valid badminton win score when manually marking
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

    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'],
      });
    } catch {}

    setMatches((prev) =>
      prev.map((m) =>
        m.id === currentMatch.id ? { ...m, score_team_a: nextA, score_team_b: nextB, winning_team: chosenWinner } : m
      )
    );

    await dataService.updateMatch(currentMatch.id, {
      score_team_a: nextA,
      score_team_b: nextB,
      winning_team: chosenWinner,
    });
  };

  const handleLogWinnerAndNext = async () => {
    if (!currentMatch) return;
    setIsSaving(true);

    const curStatus = getBadmintonMatchStatus(currentMatch.score_team_a, currentMatch.score_team_b, currentMatch.winning_team);
    let winner: WinningTeam = 'TEAM_A';
    let targetA = currentMatch.score_team_a;
    let targetB = currentMatch.score_team_b;

    if (curStatus.hasWon && curStatus.winner) {
      winner = curStatus.winner;
    } else if (currentMatch.winning_team !== 'PENDING') {
      winner = currentMatch.winning_team;
    } else if (currentMatch.score_team_a > currentMatch.score_team_b) {
      winner = 'TEAM_A';
      if (targetA < 21 || targetA - targetB < 2) {
        targetA = Math.max(21, targetB + 2);
      }
    } else if (currentMatch.score_team_b > currentMatch.score_team_a) {
      winner = 'TEAM_B';
      if (targetB < 21 || targetB - targetA < 2) {
        targetB = Math.max(21, targetA + 2);
      }
    }

    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.5 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'],
      });
    } catch {}

    await dataService.updateMatch(currentMatch.id, {
      score_team_a: targetA,
      score_team_b: targetB,
      winning_team: winner,
    });

    setMatches((prev) =>
      prev.map((m, idx) => (idx === currentIndex ? { ...m, score_team_a: targetA, score_team_b: targetB, winning_team: winner } : m))
    );

    setNotification(`Round ${currentMatch.round_number} winner saved!`);
    setTimeout(() => setNotification(null), 1800);

    setIsSaving(false);

    // Auto slide to next match if available; redirect back to matches page if finished
    if (currentIndex < matches.length - 1) {
      setTimeout(() => {
        goToMatch(currentIndex + 1);
      }, 500);
    } else {
      setTimeout(() => {
        router.push('/matches');
      }, 600);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Loading court scoreboard...
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <Trophy className="w-12 h-12 text-slate-600 mb-3" />
        <h2 className="text-lg font-bold">No Matches Found</h2>
        <p className="text-xs text-slate-400 mt-1 mb-5">
          Generate match rounds first from the Match Generator.
        </p>
        <Link
          href="/matches"
          className="px-5 py-2.5 rounded-xl bg-emerald-600 font-bold text-xs shadow-md"
        >
          Go to Matchmaker
        </Link>
      </div>
    );
  }

  const scoreA = currentMatch.score_team_a;
  const scoreB = currentMatch.score_team_b;
  const matchStatus = getBadmintonMatchStatus(scoreA, scoreB, currentMatch.winning_team);
  const hasTeamAWon = matchStatus.hasWon && matchStatus.winner === 'TEAM_A';
  const hasTeamBWon = matchStatus.hasWon && matchStatus.winner === 'TEAM_B';
  const isMatchReopened = currentMatch ? reopenedMatchIds.has(currentMatch.id) : false;
  const isLocked = matchStatus.hasWon && !isMatchReopened; // Winner locked once won unless explicitly reopened

  // Determine resting players for current match
  const matchPlayerIds = [
    currentMatch.team_a_player1_id,
    currentMatch.team_a_player2_id,
    currentMatch.team_b_player1_id,
    currentMatch.team_b_player2_id,
  ];
  const restingMembers = members.filter(
    (m) => !matchPlayerIds.includes(m.id)
  );

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between text-white p-3 sm:p-5 select-none overflow-y-auto h-[100dvh] w-screen"
    >
      {/* Top Header: Back button + Match Round Carousel Nav */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 flex-shrink-0">
        <Link
          href="/matches"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Matches</span>
        </Link>

        {/* Carousel Round Stepper */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToMatch(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center active:scale-95 text-slate-300"
            aria-label="Previous Match"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center">
            <span className="font-mono font-black text-xs sm:text-sm text-emerald-400">
              Round {currentMatch.round_number}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Match {currentIndex + 1} of {matches.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => goToMatch(currentIndex + 1)}
            disabled={currentIndex === matches.length - 1}
            className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center active:scale-95 text-slate-300"
            aria-label="Next Match"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Swipe Hint Pill */}
        <span className="text-[10px] text-slate-500 font-medium hidden xs:inline">
          Swipe &larr; &rarr;
        </span>
      </div>

      {/* Dynamic Badminton Status Alert Banner */}
      {matchStatus.badgeType === 'won' && (
        <div className="my-1 py-1.5 px-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black flex items-center justify-center gap-1.5 animate-bounce flex-shrink-0">
          <Trophy className="w-3.5 h-3.5 fill-emerald-300" />
          <span>{hasTeamAWon ? 'TEAM A WON!' : 'TEAM B WON!'}</span>
        </div>
      )}

      {matchStatus.badgeType === 'deuce' && (
        <div className="my-1 py-1.5 px-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center justify-center gap-1.5 animate-pulse flex-shrink-0">
          <Flame className="w-3.5 h-3.5 fill-amber-300/40" />
          <span>DEUCE ({scoreA}-{scoreB}) &bull; 2-POINT LEAD NEEDED TO WIN!</span>
        </div>
      )}

      {matchStatus.badgeType === 'match_point' && (
        <div className="my-1 py-1.5 px-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center justify-center gap-1.5 animate-pulse flex-shrink-0">
          <Flame className="w-3.5 h-3.5 fill-amber-300/40" />
          <span>{matchStatus.label.toUpperCase()}!</span>
        </div>
      )}

      {matchStatus.badgeType === 'leading' && (
        <div className="my-1 py-1 px-3 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 flex-shrink-0">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span>{matchStatus.label}</span>
        </div>
      )}

      {/* Reopen Match Banner if Locked */}
      {isLocked && (
        <div className="my-1 flex items-center justify-center flex-shrink-0">
          <button
            type="button"
            onClick={() => handleSetWinner('PENDING')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center gap-2 active:scale-95 transition-all shadow-md animate-pulse"
            title="Click to reopen and unlock scores"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Match Locked &bull; Tap Reopen to Edit Scores</span>
          </button>
        </div>
      )}

      {notification && (
        <div className="my-1 py-1 px-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center animate-fade-in flex-shrink-0">
          {notification}
        </div>
      )}

      {/* Main Scoreboard: 2 Giant Team Zones */}
      <div className="flex-1 my-2 flex flex-col gap-2 sm:gap-3 justify-center max-w-xl mx-auto w-full">
        {/* TEAM A SECTION */}
        <div
          className={`flex-1 flex flex-col justify-between p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all ${
            hasTeamAWon
              ? 'bg-gradient-to-b from-emerald-950/80 to-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-950/40'
              : 'bg-slate-900/70 border-slate-800'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Team A
              </span>
              <div className="flex items-center gap-1.5 font-bold text-xs sm:text-base text-white">
                <span className="truncate">{currentMatch.team_a_player1?.name || 'P1'}</span>
                <span className="text-slate-500">&amp;</span>
                <span className="truncate">{currentMatch.team_a_player2?.name || 'P2'}</span>
              </div>
            </div>

            {hasTeamAWon && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-slate-950 flex items-center gap-1 shadow-sm">
                <Trophy className="w-3 h-3 fill-slate-950" /> Won
              </span>
            )}
            {!hasTeamAWon && matchStatus.state === 'LEADING_A' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Leading (+{scoreA - scoreB})
              </span>
            )}
            {!hasTeamAWon && matchStatus.state === 'MATCH_POINT_A' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                Match Point
              </span>
            )}
            {!hasTeamAWon && matchStatus.state === 'DEUCE' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Deuce
              </span>
            )}
          </div>

          {/* Big Score Stepper with Giant Touch Target */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 my-1">
            <button
              onClick={() => handleAdjustScore('A', -1)}
              disabled={isLocked || scoreA <= 0}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800 active:bg-slate-700 flex items-center justify-center text-white active:scale-90 transition-transform shadow-md ${
                isLocked ? 'opacity-30 cursor-not-allowed' : 'disabled:opacity-20 disabled:cursor-not-allowed'
              }`}
              title={isLocked ? 'Scores locked. Click Reopen to edit.' : 'Decrease score'}
            >
              <Minus className="w-6 h-6 stroke-[3]" />
            </button>

            {/* Giant Score Display (Tap to +1) */}
            <div
              onClick={() => !isLocked && handleAdjustScore('A', 1)}
              className={`flex-1 max-w-[170px] h-20 sm:h-24 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-center select-none transition-all ${
                isLocked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer active:scale-95'
              }`}
              title={isLocked ? 'Scores locked. Click Reopen to edit.' : 'Tap to +1'}
            >
              <div className="flex items-center gap-1.5">
                {isLocked && <Lock className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
                <span className="text-6xl sm:text-7xl font-black font-mono text-emerald-400 tracking-tight">
                  {scoreA}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleAdjustScore('A', 1)}
              disabled={isLocked}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-600 active:bg-emerald-500 flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg shadow-emerald-600/30 ${
                isLocked ? 'opacity-30 cursor-not-allowed active:scale-100' : ''
              }`}
              title={isLocked ? 'Scores locked. Click Reopen to edit.' : 'Increase score'}
            >
              <Plus className="w-7 h-7 stroke-[3]" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-mono">
              Serve: {scoreA % 2 === 0 ? 'Right Court (Even)' : 'Left Court (Odd)'}
            </span>
            <button
              type="button"
              onClick={() => handleSetWinner(hasTeamAWon && isLocked ? 'PENDING' : 'TEAM_A')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                hasTeamAWon && isLocked
                  ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
              }`}
            >
              {hasTeamAWon && isLocked ? '✓ Team A Won (Click to Reopen)' : 'Mark Team A Winner'}
            </button>
          </div>
        </div>

        {/* Court Net Graphic Divider */}
        <div className="flex items-center justify-center py-0.5">
          <div className="h-[1px] bg-slate-800 flex-1" />
          <span className="px-3 text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1">
            🏸 COURT NET
          </span>
          <div className="h-[1px] bg-slate-800 flex-1" />
        </div>

        {/* TEAM B SECTION */}
        <div
          className={`flex-1 flex flex-col justify-between p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all ${
            hasTeamBWon
              ? 'bg-gradient-to-b from-teal-950/80 to-slate-900 border-teal-500/60 shadow-lg shadow-teal-950/40'
              : 'bg-slate-900/70 border-slate-800'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-teal-500/20 text-teal-400 border border-teal-500/30">
                Team B
              </span>
              <div className="flex items-center gap-1.5 font-bold text-xs sm:text-base text-white">
                <span className="truncate">{currentMatch.team_b_player1?.name || 'P3'}</span>
                <span className="text-slate-500">&amp;</span>
                <span className="truncate">{currentMatch.team_b_player2?.name || 'P4'}</span>
              </div>
            </div>

            {hasTeamBWon && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-400 text-slate-950 flex items-center gap-1 shadow-sm">
                <Trophy className="w-3 h-3 fill-slate-950" /> Won
              </span>
            )}
            {!hasTeamBWon && matchStatus.state === 'LEADING_B' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Leading (+{scoreB - scoreA})
              </span>
            )}
            {!hasTeamBWon && matchStatus.state === 'MATCH_POINT_B' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                Match Point
              </span>
            )}
            {!hasTeamBWon && matchStatus.state === 'DEUCE' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Deuce
              </span>
            )}
          </div>

          {/* Big Score Stepper with Giant Touch Target */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 my-1">
            <button
              onClick={() => handleAdjustScore('B', -1)}
              disabled={isLocked || scoreB <= 0}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800 active:bg-slate-700 flex items-center justify-center text-white active:scale-90 transition-transform shadow-md ${
                isLocked ? 'opacity-30 cursor-not-allowed' : 'disabled:opacity-20 disabled:cursor-not-allowed'
              }`}
              title={isLocked ? 'Scores locked. Click Reopen to edit.' : 'Decrease score'}
            >
              <Minus className="w-6 h-6 stroke-[3]" />
            </button>

            {/* Giant Score Display (Tap to +1) */}
            <div
              onClick={() => !isLocked && handleAdjustScore('B', 1)}
              className={`flex-1 max-w-[170px] h-20 sm:h-24 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-center select-none transition-all ${
                isLocked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer active:scale-95'
              }`}
              title={isLocked ? 'Scores locked. Click Reopen to edit.' : 'Tap to +1'}
            >
              <div className="flex items-center gap-1.5">
                {isLocked && <Lock className="w-5 h-5 text-teal-400 flex-shrink-0" />}
                <span className="text-6xl sm:text-7xl font-black font-mono text-teal-400 tracking-tight">
                  {scoreB}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleAdjustScore('B', 1)}
              disabled={isLocked}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-teal-600 active:bg-teal-500 flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg shadow-teal-600/30 ${
                isLocked ? 'opacity-30 cursor-not-allowed active:scale-100' : ''
              }`}
              title={isLocked ? 'Scores locked. Click Reopen to edit.' : 'Increase score'}
            >
              <Plus className="w-7 h-7 stroke-[3]" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-mono">
              Serve: {scoreB % 2 === 0 ? 'Right Court (Even)' : 'Left Court (Odd)'}
            </span>
            <button
              type="button"
              onClick={() => handleSetWinner(hasTeamBWon && isLocked ? 'PENDING' : 'TEAM_B')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                hasTeamBWon && isLocked
                  ? 'text-teal-300 bg-teal-500/20 border border-teal-500/40'
                  : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
              }`}
            >
              {hasTeamBWon && isLocked ? '✓ Team B Won (Click to Reopen)' : 'Mark Team B Winner'}
            </button>
          </div>
        </div>
      </div>

      {/* Resting Players Tag */}
      {restingMembers.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 py-1 flex-shrink-0">
          <Coffee className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-500">Resting:</span>
          <span className="text-slate-300 font-semibold truncate max-w-[240px]">
            {restingMembers.map((m) => m.name).join(', ')}
          </span>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div className="pt-2 border-t border-slate-800/80 max-w-xl mx-auto w-full flex-shrink-0 space-y-2">
        {/* Quick Sets & Reset */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] ${isLocked ? 'text-slate-600' : 'text-slate-500'}`}>Quick:</span>
            <button
              type="button"
              disabled={isLocked}
              onClick={() => handleQuickSet(21, 19, 'TEAM_A')}
              className={`px-2.5 py-1 rounded-lg bg-slate-900 border text-[11px] font-mono transition-all ${
                isLocked
                  ? 'border-slate-800/40 text-slate-600 opacity-20 cursor-not-allowed pointer-events-none'
                  : 'border-slate-800 text-slate-300 hover:text-white active:scale-95'
              }`}
            >
              21-19
            </button>
            <button
              type="button"
              disabled={isLocked}
              onClick={() => handleQuickSet(19, 21, 'TEAM_B')}
              className={`px-2.5 py-1 rounded-lg bg-slate-900 border text-[11px] font-mono transition-all ${
                isLocked
                  ? 'border-slate-800/40 text-slate-600 opacity-20 cursor-not-allowed pointer-events-none'
                  : 'border-slate-800 text-slate-300 hover:text-white active:scale-95'
              }`}
            >
              19-21
            </button>
            <button
              type="button"
              disabled={isLocked}
              onClick={() => handleQuickSet(15, 11, 'TEAM_A')}
              className={`px-2.5 py-1 rounded-lg bg-slate-900 border text-[11px] font-mono transition-all ${
                isLocked
                  ? 'border-slate-800/40 text-slate-600 opacity-20 cursor-not-allowed pointer-events-none'
                  : 'border-slate-800 text-slate-300 hover:text-white active:scale-95'
              }`}
            >
              15-11
            </button>
          </div>

          <button
            type="button"
            disabled={isLocked}
            onClick={handleResetScores}
            className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg transition-all ${
              isLocked
                ? 'text-slate-600 opacity-20 cursor-not-allowed pointer-events-none'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
            }`}
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        {/* Big Primary Action Button */}
        <button
          type="button"
          onClick={handleLogWinnerAndNext}
          disabled={isSaving}
          className="w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-300 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          {isSaving ? (
            <span>Saving Winner...</span>
          ) : (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                {currentIndex < matches.length - 1
                  ? 'Log Winner & Next Match →'
                  : 'Log Winner & Finish Today →'}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function ScoreboardPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          Loading court scoreboard...
        </div>
      }
    >
      <ScoreboardContent />
    </Suspense>
  );
}
