'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Member, MatchWithPlayers, Session, WinningTeam } from '@/lib/types';
import { dataService } from '@/lib/dataService';
import MatchCard from '@/components/MatchCard';
import { getBadmintonMatchStatus } from '@/lib/matchmaking';
import { 
  Swords, 
  Users, 
  Play, 
  AlertCircle, 
  CheckCircle2, 
  Sliders, 
  Plus, 
  Minus, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Archive, 
  History as HistoryIcon, 
  X, 
  Trophy 
} from 'lucide-react';
import Link from 'next/link';
import ToastContainer, { ToastMessage } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';

const STORAGE_KEY_SELECTED_PLAYERS = 'smashpoint_selected_players';

const getStoredSelectedPlayers = (): string[] | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SELECTED_PLAYERS);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    console.warn('Failed to parse selected players from storage', err);
    return null;
  }
};

const persistSelectedPlayers = (ids: string[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_SELECTED_PLAYERS, JSON.stringify(ids));
  } catch (err) {
    console.warn('Failed to persist selected players to storage', err);
  }
};

export default function MatchesPage() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [matches, setMatches] = useState<MatchWithPlayers[]>([]);
  const [generating, setGenerating] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'matches' | 'setup'>('matches');

  // Matchmaking configuration
  const [targetMatches, setTargetMatches] = useState<number>(3);
  const [generationMode, setGenerationMode] = useState<'target' | 'rounds'>('target');
  const [totalRoundsInput, setTotalRoundsInput] = useState<number>(4);
  const [generationSummary, setGenerationSummary] = useState<string | null>(null);

  // Extra rounds & History saving states
  const [showExtraRoundsModal, setShowExtraRoundsModal] = useState<boolean>(false);
  const [extraRoundsCount, setExtraRoundsCount] = useState<number>(2);
  const [isSavingHistory, setIsSavingHistory] = useState<boolean>(false);
  const [savedSuccessNotification, setSavedSuccessNotification] = useState<string | null>(null);

  // Custom Popups & Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showSaveHistoryModal, setShowSaveHistoryModal] = useState<boolean>(false);
  const [showClearModal, setShowClearModal] = useState<boolean>(false);
  const [showRegenerateConfirmModal, setShowRegenerateConfirmModal] = useState<boolean>(false);

  const showToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    setMounted(true);
    initPage();
  }, []);

  const initPage = async () => {
    try {
      const [membersData, currentSession] = await Promise.all([
        dataService.getMembers(),
        dataService.getOrCreateTodaySession(),
      ]);

      setMembers(membersData);
      setSession(currentSession);

      const memberMap = new Map(membersData.map((m) => [m.id, m]));
      const validMemberIdSet = new Set(membersData.map((m) => m.id));
      let playerIdsInMatches: string[] = [];

      if (currentSession) {
        const rawMatches = await dataService.getMatchesBySession(currentSession.id);
        const populated: MatchWithPlayers[] = rawMatches.map((m) => ({
          ...m,
          team_a_player1: memberMap.get(m.team_a_player1_id),
          team_a_player2: memberMap.get(m.team_a_player2_id),
          team_b_player1: memberMap.get(m.team_b_player1_id),
          team_b_player2: memberMap.get(m.team_b_player2_id),
        }));
        setMatches(populated);

        // Record players who actually played in today's matches
        const matchPlayerSet = new Set<string>();
        rawMatches.forEach((m) => {
          if (validMemberIdSet.has(m.team_a_player1_id)) matchPlayerSet.add(m.team_a_player1_id);
          if (validMemberIdSet.has(m.team_a_player2_id)) matchPlayerSet.add(m.team_a_player2_id);
          if (validMemberIdSet.has(m.team_b_player1_id)) matchPlayerSet.add(m.team_b_player1_id);
          if (validMemberIdSet.has(m.team_b_player2_id)) matchPlayerSet.add(m.team_b_player2_id);
        });
        playerIdsInMatches = Array.from(matchPlayerSet);

        // If no matches yet, switch mobile tab to setup
        if (populated.length === 0) {
          setMobileTab('setup');
        } else {
          setMobileTab('matches');
        }
      }

      // Determine initial selected player IDs:
      // 1. First priority: saved user selection in localStorage (filtered to valid current members)
      const stored = getStoredSelectedPlayers();
      let initialIds: string[] = [];

      if (stored !== null) {
        initialIds = stored.filter((id) => validMemberIdSet.has(id));
      } else if (playerIdsInMatches.length >= 4) {
        // 2. Second priority: players who played in today's existing matches
        initialIds = playerIdsInMatches;
      } else {
        // 3. Third priority: default select all members (up to 8)
        initialIds = membersData.slice(0, 8).map((m) => m.id);
      }

      setSelectedPlayerIds(initialIds);
      persistSelectedPlayers(initialIds);
    } catch (err) {
      console.error('Failed to initialize matches page:', err);
    }
  };

  const loadSessionMatches = async (sessionId: string, currentMembers: Member[]) => {
    const rawMatches = await dataService.getMatchesBySession(sessionId);
    const memberMap = new Map(currentMembers.map((m) => [m.id, m]));

    const populated: MatchWithPlayers[] = rawMatches.map((m) => ({
      ...m,
      team_a_player1: memberMap.get(m.team_a_player1_id),
      team_a_player2: memberMap.get(m.team_a_player2_id),
      team_b_player1: memberMap.get(m.team_b_player1_id),
      team_b_player2: memberMap.get(m.team_b_player2_id),
    }));

    setMatches(populated);
  };

  const handleTogglePlayer = (id: string) => {
    setSelectedPlayerIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      persistSelectedPlayers(updated);
      return updated;
    });
  };

  const handleSelectAll = () => {
    const allIds = members.map((m) => m.id);
    setSelectedPlayerIds(allIds);
    persistSelectedPlayers(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedPlayerIds([]);
    persistSelectedPlayers([]);
  };

  const executeGenerateMatches = async () => {
    if (selectedPlayerIds.length < 4) {
      showToast({
        type: 'error',
        title: 'Need 4 Players',
        message: 'Please select at least 4 active players for doubles matches.',
      });
      return;
    }

    try {
      setGenerating(true);

      // 1. Ensure we have an active, valid session
      let currentSession = session;
      if (!currentSession || currentSession.location?.includes('[COMPLETED]') || currentSession.status === 'COMPLETED') {
        currentSession = await dataService.getOrCreateTodaySession();
        setSession(currentSession);
      }

      if (!currentSession) {
        throw new Error("Unable to establish today's match session.");
      }

      // 2. If active session already has matches on the board, clear them first for fresh optimal generation
      if (matches.length > 0) {
        await dataService.clearSessionMatches(currentSession.id);
      }

      const payload = {
        playerIds: selectedPlayerIds,
        targetMatchesPerPlayer: generationMode === 'target' ? targetMatches : undefined,
        totalRounds: generationMode === 'rounds' ? totalRoundsInput : undefined,
        numberOfCourts: 1,
        existingMatches: [], // Fresh optimal schedule starting at Round 1
      };

      const res = await fetch('/api/generate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate schedule.');
      }

      const generated = data.result.matches;

      // Prepare DB match objects
      const newMatches = generated.map((gm: any) => ({
        session_id: currentSession.id,
        round_number: gm.round_number,
        court_number: gm.court_number,
        team_a_player1_id: gm.team_a_player1_id,
        team_a_player2_id: gm.team_a_player2_id,
        team_b_player1_id: gm.team_b_player1_id,
        team_b_player2_id: gm.team_b_player2_id,
        score_team_a: 0,
        score_team_b: 0,
        winning_team: 'PENDING' as WinningTeam,
      }));

      await dataService.createMatches(newMatches);
      await loadSessionMatches(currentSession.id, members);

      setGenerationSummary(`Generated ${newMatches.length} optimal rounds for ${selectedPlayerIds.length} players!`);
      showToast({
        type: 'success',
        title: 'Matches Ready!',
        message: `Successfully generated ${newMatches.length} optimal rounds.`,
      });
      setMobileTab('matches');
      setTimeout(() => setGenerationSummary(null), 4000);
    } catch (err: any) {
      console.error('Error generating matches:', err);
      showToast({
        type: 'error',
        title: 'Generation Failed',
        message: err.message || 'Error generating matches.',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateMatches = () => {
    if (selectedPlayerIds.length < 4) {
      showToast({
        type: 'error',
        title: 'Need 4 Players',
        message: 'Please select at least 4 active players for doubles matches.',
      });
      return;
    }

    // Confirm with the user if matches already exist to avoid accidental replacement
    if (matches.length > 0) {
      setShowRegenerateConfirmModal(true);
      return;
    }

    executeGenerateMatches();
  };

  const handleGenerateExtraRounds = async (count: number) => {
    let currentSession = session;
    if (!currentSession || currentSession.location?.includes('[COMPLETED]') || currentSession.status === 'COMPLETED') {
      currentSession = await dataService.getOrCreateTodaySession();
      setSession(currentSession);
    }
    if (!currentSession) return;

    if (selectedPlayerIds.length < 4) {
      showToast({
        type: 'error',
        title: 'Need 4 Players',
        message: 'Please select at least 4 active players in Present Players to generate extra rounds.',
      });
      return;
    }

    try {
      setGenerating(true);

      const payload = {
        playerIds: selectedPlayerIds,
        totalRounds: count,
        numberOfCourts: 1,
        existingMatches: matches, // Seeds penalty matrix so play counts are strictly balanced & repeat pairs are penalized
      };

      const res = await fetch('/api/generate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate extra rounds.');
      }

      const generated = data.result.matches;
      const newMatches = generated.map((gm: any) => ({
        session_id: currentSession.id,
        round_number: gm.round_number,
        court_number: gm.court_number,
        team_a_player1_id: gm.team_a_player1_id,
        team_a_player2_id: gm.team_a_player2_id,
        team_b_player1_id: gm.team_b_player1_id,
        team_b_player2_id: gm.team_b_player2_id,
        score_team_a: 0,
        score_team_b: 0,
        winning_team: 'PENDING' as WinningTeam,
      }));

      await dataService.createMatches(newMatches);
      await loadSessionMatches(currentSession.id, members);

      setShowExtraRoundsModal(false);
      setGenerationSummary(`Added ${newMatches.length} fair extra rounds starting at Round ${newMatches[0]?.round_number}!`);
      showToast({
        type: 'success',
        title: 'Extra Rounds Added!',
        message: `Added ${newMatches.length} fair extra rounds starting at Round ${newMatches[0]?.round_number}!`,
      });
      setTimeout(() => setGenerationSummary(null), 5000);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Failed to Add Rounds',
        message: err.message || 'Error generating extra rounds.',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenSaveHistoryModal = () => {
    if (matches.length === 0) return;
    const pendingMatches = matches.filter((m) => m.winning_team === 'PENDING');
    if (pendingMatches.length > 0) {
      showToast({
        type: 'error',
        title: 'Matches Incomplete',
        message: `Cannot save to History yet. Please complete all ${matches.length} rounds first (${pendingMatches.length} pending).`,
      });
      return;
    }
    setShowSaveHistoryModal(true);
  };

  const handleConfirmSaveToHistory = async () => {
    if (!session) return;
    const pendingMatches = matches.filter((m) => m.winning_team === 'PENDING');
    if (pendingMatches.length > 0) {
      setShowSaveHistoryModal(false);
      showToast({
        type: 'error',
        title: 'Cannot Save to History',
        message: `All matches must be finished before archiving to History (${pendingMatches.length} pending).`,
      });
      return;
    }

    try {
      setIsSavingHistory(true);
      await dataService.completeSession(session.id);

      // Reinitialize page: will create a fresh new session with empty matches!
      await initPage();
      setShowSaveHistoryModal(false);

      showToast({
        type: 'success',
        title: 'Saved to History!',
        message: "Session successfully saved! Matchboard has been reset for new games.",
        action: {
          label: 'View History',
          href: '/history',
        },
        duration: 6000,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Failed to save session.',
      });
    } finally {
      setIsSavingHistory(false);
    }
  };

  const handleSaveScore = async (
    matchId: string,
    scoreA: number,
    scoreB: number,
    winningTeam: WinningTeam
  ) => {
    // Optimistic UI update: instantly update state so the card unlocks with no delay
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? { ...m, score_team_a: scoreA, score_team_b: scoreB, winning_team: winningTeam }
          : m
      )
    );

    await dataService.updateMatch(matchId, {
      score_team_a: scoreA,
      score_team_b: scoreB,
      winning_team: winningTeam,
    });
    if (session) {
      await loadSessionMatches(session.id, members);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    await dataService.deleteMatch(matchId);
    if (session) {
      await loadSessionMatches(session.id, members);
    }
    showToast({
      type: 'info',
      title: 'Match Removed',
      message: 'Round deleted from session.',
    });
  };

  const handleOpenClearModal = () => {
    setShowClearModal(true);
  };

  const handleConfirmClearSession = async () => {
    if (!session) return;
    try {
      await dataService.clearSessionMatches(session.id);
      await loadSessionMatches(session.id, members);
      setMobileTab('setup');
      setShowClearModal(false);
      showToast({
        type: 'info',
        title: 'Matchboard Cleared',
        message: "All matches for today's session have been cleared.",
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Clear Failed',
        message: err.message || 'Failed to clear matches.',
      });
    }
  };

  const P = selectedPlayerIds.length;
  const estimatedMatches =
    generationMode === 'target'
      ? Math.round((P * targetMatches) / 4)
      : totalRoundsInput;
  const restingCount = Math.max(0, P - 4);
  const allMatchesCompleted = matches.length > 0 && matches.every((m) => m.winning_team !== 'PENDING');

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Success Notification Banner after saving session to history */}
      {savedSuccessNotification && (
        <div className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-bold flex items-center justify-between gap-3 animate-fade-in shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{savedSuccessNotification}</span>
          </div>
          <Link
            href="/history"
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-transform"
          >
            <span>View History</span>
            <HistoryIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Mobile Top Segmented Tab Switcher */}
      <div className="lg:hidden flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow-md">
        <button
          type="button"
          onClick={() => setMobileTab('matches')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'matches'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm font-extrabold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Swords className="w-3.5 h-3.5" />
          <span>Active Games ({matches.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('setup')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'setup'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm font-extrabold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Setup &amp; Squad ({selectedPlayerIds.length})</span>
        </button>
      </div>

      {/* Main Grid Container (Side-by-side on desktop, Tab-driven on mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Player Selection & Settings */}
        <div className={`lg:col-span-5 space-y-4 ${mobileTab === 'setup' ? 'block' : 'hidden lg:block'}`}>
          {/* Active Players Card - Mobile-First Compact Chips */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm sm:text-base">Present Players</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {selectedPlayerIds.length} / {members.length} Present
              </span>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between mb-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  All
                </button>
                <span className="text-slate-600">&bull;</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-slate-400 hover:text-slate-300"
                >
                  None
                </button>
              </div>

              <Link
                href="/members"
                className="text-slate-400 hover:text-white flex items-center gap-1 font-medium"
              >
                <Plus className="w-3 h-3" /> Manage Squad
              </Link>
            </div>

            {/* Player Selection - Compact Tap Chips */}
            {members.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">
                No members found. <Link href="/members" className="text-emerald-400 underline">Add players</Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {members.map((member) => {
                  const isSelected = selectedPlayerIds.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleTogglePlayer(member.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200 shadow-sm shadow-emerald-500/10'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: member.avatar_color || '#10b981' }}
                      />
                      <span className="font-semibold">{member.name}</span>
                      {isSelected ? (
                        <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedPlayerIds.length < 4 && (
              <div className="mt-3 p-2.5 rounded-xl bg-amber-950/50 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Select at least 4 players for doubles.</span>
              </div>
            )}
          </div>

          {/* Rotation & Generator Settings Card */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg backdrop-blur-md space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm sm:text-base">Rotation Settings</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {P >= 4 ? `4 play • ${restingCount} rest/round` : 'Court 1'}
              </span>
            </div>

            {/* Target Matches Stepper */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300">
                  Matches per Player
                </label>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  ~{estimatedMatches} total rounds
                </span>
              </div>

              {/* Stepper with big tap targets */}
              <div className="flex items-center justify-between bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTargetMatches(Math.max(1, targetMatches - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-base font-black text-white font-mono">
                    {targetMatches}
                  </span>
                  <span className="text-[10px] text-slate-400">matches / player</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTargetMatches(Math.min(8, targetMatches + 1))}
                  className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center active:scale-95 transition-transform shadow-md shadow-emerald-600/30"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {generationSummary && (
              <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{generationSummary}</span>
              </div>
            )}

            {/* Generate Action Button */}
            <button
              onClick={handleGenerateMatches}
              disabled={selectedPlayerIds.length < 4 || generating}
              className="w-full py-3 px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {generating ? (
                <span>Generating...</span>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Generate Optimal Matches</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Generated Matches & Live Scoring */}
        <div className={`lg:col-span-7 space-y-3 sm:space-y-4 ${mobileTab === 'matches' ? 'block' : 'hidden lg:block'}`}>
          <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                <span>Today&apos;s Match Rounds</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-emerald-400 font-mono">
                  {matches.length}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                {session?.session_date || 'Today'} &bull; {session?.location?.replace(' [COMPLETED]', '') || 'Local Court'}
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setMobileTab('setup')}
                className="lg:hidden text-xs text-emerald-400 hover:text-emerald-300 font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
              >
                + Squad
              </button>

              {matches.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowExtraRoundsModal(true)}
                    className="text-xs text-emerald-300 hover:text-white font-bold px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 flex items-center gap-1 transition-all active:scale-95"
                    title="Generate additional fair rounds"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Rounds</span>
                  </button>

                  {allMatchesCompleted && (
                    <button
                      type="button"
                      onClick={handleOpenSaveHistoryModal}
                      disabled={isSavingHistory}
                      className="text-xs text-amber-300 hover:text-white font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-600 border border-amber-500/30 flex items-center gap-1 transition-all active:scale-95 animate-fade-in"
                      title="Permanently save current session to History"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Save to History</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleOpenClearModal}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Prominent Session Completion Banner when all rounds finished */}
          {allMatchesCompleted && (
            <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/50 shadow-xl shadow-emerald-950/50 space-y-3 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <Trophy className="w-5 h-5 fill-emerald-400/20" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                    <span>All {matches.length} Rounds Completed!</span>
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    All games have officially concluded. Save this session permanently to History or generate more fair rounds.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleOpenSaveHistoryModal}
                  disabled={isSavingHistory}
                  className="w-full py-2.5 px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:opacity-95 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Archive className="w-4 h-4" />
                  <span>{isSavingHistory ? 'Saving to History...' : 'Permanently Save to History'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowExtraRoundsModal(true)}
                  className="w-full py-2.5 px-4 rounded-xl sm:rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Generate More Rounds</span>
                </button>
              </div>
            </div>
          )}

          {matches.length === 0 ? (
            <div className="py-14 text-center bg-slate-900/40 border border-slate-800 rounded-2xl sm:rounded-3xl p-6 backdrop-blur-md">
              <Swords className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white mb-1">No Matches Generated Yet</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
                Select your present players and tap generate to create fair badminton rotations.
              </p>
              <button
                onClick={() => setMobileTab('setup')}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
              >
                Go to Matchmaker
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => {
                const matchPlayerIds = [
                  match.team_a_player1_id,
                  match.team_a_player2_id,
                  match.team_b_player1_id,
                  match.team_b_player2_id,
                ];
                const restingMembers = members.filter(
                  (m) => selectedPlayerIds.includes(m.id) && !matchPlayerIds.includes(m.id)
                );

                return (
                  <MatchCard
                    key={match.id}
                    match={match}
                    restingMembers={restingMembers}
                    onSaveScore={handleSaveScore}
                    onDeleteMatch={handleDeleteMatch}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Generate More Rounds */}
      {showExtraRoundsModal && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  +
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    Generate More Rounds
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Add extra fair badminton rotations
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExtraRoundsModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-2xl border border-slate-800/80">
              The algorithm evaluates all {matches.length} played rounds to balance player court times, prevent repeat pairs, and ensure fresh opponent matchups starting at <span className="font-mono text-emerald-400 font-bold">Round {matches.length + 1}</span>.
            </p>

            {/* Active Squad Selection for Extra Rounds */}
            <div className="space-y-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Players for Extra Rounds ({selectedPlayerIds.length})</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {selectedPlayerIds.length >= 4 ? 'Ready' : 'Need min 4'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {members.map((member) => {
                  const isSelected = selectedPlayerIds.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleTogglePlayer(member.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-medium transition-all ${
                        isSelected
                          ? 'bg-emerald-950/80 border-emerald-500/70 text-emerald-200 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                      title={isSelected ? 'Included in rotation (tap to exclude)' : 'Excluded from rotation (tap to include)'}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: member.avatar_color || '#10b981' }}
                      />
                      <span className="truncate max-w-[90px]">{member.name}</span>
                      {isSelected ? (
                        <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
              {selectedPlayerIds.length < 4 && (
                <div className="text-[11px] text-rose-400 font-medium pt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Please select at least 4 active players for doubles.</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">
                Number of Extra Rounds to Add:
              </label>

              {/* Stepper */}
              <div className="flex items-center justify-between bg-slate-950 p-2 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setExtraRoundsCount((prev) => Math.max(1, prev - 1))}
                  disabled={extraRoundsCount <= 1}
                  className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center disabled:opacity-30 active:scale-95 text-lg font-bold"
                >
                  −
                </button>

                <div className="text-center font-mono">
                  <span className="text-2xl font-black text-emerald-400">
                    +{extraRoundsCount}
                  </span>
                  <span className="text-[11px] text-slate-400 ml-1.5 font-sans font-medium">
                    {extraRoundsCount === 1 ? 'Round' : 'Rounds'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setExtraRoundsCount((prev) => Math.min(10, prev + 1))}
                  disabled={extraRoundsCount >= 10}
                  className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center disabled:opacity-30 active:scale-95 text-lg font-bold"
                >
                  +
                </button>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-500 font-bold">Presets:</span>
                {[1, 2, 3, 4].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setExtraRoundsCount(cnt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      extraRoundsCount === cnt
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    +{cnt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExtraRoundsModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleGenerateExtraRounds(extraRoundsCount)}
                disabled={generating || selectedPlayerIds.length < 4}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-black text-white shadow-lg shadow-emerald-600/30 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {generating ? 'Generating...' : `Add +${extraRoundsCount} Rounds`}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* In-App Confirmation Modal: Re-generate Matches */}
      <ConfirmModal
        isOpen={showRegenerateConfirmModal}
        onClose={() => setShowRegenerateConfirmModal(false)}
        onConfirm={() => {
          setShowRegenerateConfirmModal(false);
          executeGenerateMatches();
        }}
        title="Re-generate & Replace Matches?"
        description={`You already have ${matches.length} active match rounds on today's board. Re-generating will replace the existing matches and reset scores for the ${selectedPlayerIds.length} selected players. Are you sure you want to proceed?`}
        confirmLabel="Replace & Re-generate"
        cancelLabel="Keep Current Games"
        variant="warning"
        iconType="warning"
        isLoading={generating}
      />

      {/* In-App Confirmation Modal: Save to History */}
      <ConfirmModal
        isOpen={showSaveHistoryModal}
        onClose={() => setShowSaveHistoryModal(false)}
        onConfirm={handleConfirmSaveToHistory}
        title="Permanently Save to History?"
        description="Permanently save this session to History? Today's active matchboard will be securely cleared and reset for new games."
        confirmLabel={isSavingHistory ? 'Saving...' : 'Save & Reset'}
        cancelLabel="Cancel"
        variant="primary"
        iconType="archive"
        isLoading={isSavingHistory}
      />

      {/* In-App Confirmation Modal: Clear Matchboard */}
      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleConfirmClearSession}
        title="Clear All Matches?"
        description="Are you sure you want to clear all matches for today's session? All scores and generated rounds will be wiped out."
        confirmLabel="Clear Matches"
        cancelLabel="Keep Matches"
        variant="danger"
        iconType="danger"
      />
    </div>
  );
}
