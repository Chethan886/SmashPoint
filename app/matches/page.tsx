'use client';

import React, { useState, useEffect } from 'react';
import { Member, MatchWithPlayers, Session, WinningTeam } from '@/lib/types';
import { dataService } from '@/lib/dataService';
import MatchCard from '@/components/MatchCard';
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
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function MatchesPage() {
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

  useEffect(() => {
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

      // Default select all members (up to 8 if many exist, or all)
      setSelectedPlayerIds(membersData.slice(0, 8).map((m) => m.id));

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

        // If no matches yet, switch mobile tab to setup
        if (populated.length === 0) {
          setMobileTab('setup');
        } else {
          setMobileTab('matches');
        }
      }
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
    if (selectedPlayerIds.includes(id)) {
      setSelectedPlayerIds(selectedPlayerIds.filter((p) => p !== id));
    } else {
      setSelectedPlayerIds([...selectedPlayerIds, id]);
    }
  };

  const handleSelectAll = () => {
    setSelectedPlayerIds(members.map((m) => m.id));
  };

  const handleDeselectAll = () => {
    setSelectedPlayerIds([]);
  };

  const handleGenerateMatches = async () => {
    if (selectedPlayerIds.length < 4) {
      alert('Please select at least 4 active players for doubles matches.');
      return;
    }
    if (!session) return;

    try {
      setGenerating(true);

      const payload = {
        playerIds: selectedPlayerIds,
        targetMatchesPerPlayer: generationMode === 'target' ? targetMatches : undefined,
        totalRounds: generationMode === 'rounds' ? totalRoundsInput : undefined,
        numberOfCourts: 1,
        existingMatches: matches,
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
        session_id: session.id,
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
      await loadSessionMatches(session.id, members);

      setGenerationSummary(`Generated ${newMatches.length} optimal rounds!`);
      setMobileTab('matches');
      setTimeout(() => setGenerationSummary(null), 4000);
    } catch (err: any) {
      alert('Error generating matches: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveScore = async (
    matchId: string,
    scoreA: number,
    scoreB: number,
    winningTeam: WinningTeam
  ) => {
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
  };

  const handleClearSession = async () => {
    if (!session) return;
    if (confirm("Clear all matches for today's session?")) {
      await dataService.clearSessionMatches(session.id);
      await loadSessionMatches(session.id, members);
      setMobileTab('setup');
    }
  };

  const P = selectedPlayerIds.length;
  const estimatedMatches =
    generationMode === 'target'
      ? Math.round((P * targetMatches) / 4)
      : totalRoundsInput;
  const restingCount = Math.max(0, P - 4);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
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
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                <span>Today&apos;s Match Rounds</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-emerald-400 font-mono">
                  {matches.length}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                {session?.session_date || 'Today'} &bull; {session?.location || 'Local Court'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileTab('setup')}
                className="lg:hidden text-xs text-emerald-400 hover:text-emerald-300 font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
              >
                + Add / Edit
              </button>

              {matches.length > 0 && (
                <button
                  onClick={handleClearSession}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

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
    </div>
  );
}
