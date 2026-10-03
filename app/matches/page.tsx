'use client';

import React, { useState, useEffect } from 'react';
import { Member, MatchWithPlayers, Session, WinningTeam } from '@/lib/types';
import { dataService } from '@/lib/dataService';
import MatchCard from '@/components/MatchCard';
import { 
  Swords, 
  Users, 
  CheckSquare, 
  Square, 
  Play, 
  Trophy, 
  AlertCircle, 
  CheckCircle2, 
  Sliders, 
  Zap,
  Plus
} from 'lucide-react';
import Link from 'next/link';

export default function MatchesPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [matches, setMatches] = useState<MatchWithPlayers[]>([]);
  const [generating, setGenerating] = useState<boolean>(false);

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
        await loadSessionMatches(currentSession.id, membersData);
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

      setGenerationSummary(
        `Generated ${newMatches.length} rounds! Max match disparity: ${data.result.fairnessScore} (Balanced)`
      );
      setTimeout(() => setGenerationSummary(null), 6000);
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
    if (confirm("Are you sure you want to clear all matches for today's session?")) {
      await dataService.clearSessionMatches(session.id);
      await loadSessionMatches(session.id, members);
    }
  };

  const P = selectedPlayerIds.length;
  const estimatedMatches =
    generationMode === 'target'
      ? Math.round((P * targetMatches) / 4)
      : totalRoundsInput;
  const restingCount = Math.max(0, P - 4);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Title & Navigation Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <Swords className="w-4 h-4" />
            <span>Optimal Match Generator &amp; Rotation Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Court Matchmaker
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Mathematical fairness: Equal play time, maximum partner diversity, and fair rest rotation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95"
          >
            <Trophy className="w-4 h-4" />
            <span>View Leaderboard</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Left Setup Card, Right Match Card List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Player Selection & Generation Parameters */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Players Card */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Select Present Players</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {selectedPlayerIds.length} / {members.length} Present
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  Select All
                </button>
                <span className="text-slate-600">&bull;</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-xs text-slate-400 hover:text-slate-300"
                >
                  Clear All
                </button>
              </div>

              <Link
                href="/members"
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Manage Roster
              </Link>
            </div>

            {/* Player Checkboxes */}
            {members.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No members found in squad. <Link href="/members" className="text-emerald-400 underline">Add players</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {members.map((member) => {
                  const isSelected = selectedPlayerIds.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleTogglePlayer(member.id)}
                      className={`flex items-center gap-3 p-2.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500/50 shadow-sm shadow-emerald-500/10'
                          : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-white text-xs truncate">
                          {member.name}
                        </div>
                        {member.nickname && (
                          <div className="text-[10px] text-slate-400 truncate">
                            {member.nickname}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedPlayerIds.length < 4 && (
              <div className="mt-4 p-3 rounded-xl bg-amber-950/50 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Select at least 4 players to generate doubles matches.</span>
              </div>
            )}
          </div>

          {/* Rotation & Generator Settings Card */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Rotation Settings</h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Court 1 (Doubles)
              </span>
            </div>

            {/* Mode selection tabs */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setGenerationMode('target')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  generationMode === 'target'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Target Matches / Player
              </button>
              <button
                type="button"
                onClick={() => setGenerationMode('rounds')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  generationMode === 'rounds'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Fixed Total Rounds
              </button>
            </div>

            {generationMode === 'target' ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Matches per Player (K)
                  </label>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {targetMatches} matches
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={1}
                  value={targetMatches}
                  onChange={(e) => setTargetMatches(parseInt(e.target.value) || 1)}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>1 game</span>
                  <span>3 games</span>
                  <span>5 games</span>
                  <span>8 games</span>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Total Rounds to Generate
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={totalRoundsInput}
                  onChange={(e) => setTotalRoundsInput(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {/* Mathematical Rule Insight Box */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Mathematical Prediction
                </span>
                <span className="font-mono text-emerald-400 font-bold">
                  {P >= 4 ? `~${estimatedMatches} Rounds` : '--'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Formula: <span className="font-mono text-slate-300">M = (P × K) / 4</span>. With{' '}
                <span className="font-bold text-white">{P} players</span>, 4 will play each round and{' '}
                <span className="font-bold text-amber-300">{restingCount} will rest</span> with
                equalized rotation cycles.
              </p>
            </div>

            {generationSummary && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold animate-fade-in flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{generationSummary}</span>
              </div>
            )}

            {/* Action Generate Button */}
            <button
              onClick={handleGenerateMatches}
              disabled={selectedPlayerIds.length < 4 || generating}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {generating ? (
                <span>Calculating Optimal Rotations...</span>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Generate Optimal Matches</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Generated Session Matches & Live Scoring */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <span>Today&apos;s Match Rounds</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-emerald-400 font-mono">
                  {matches.length} Games
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Session: {session?.session_date || 'Today'} &bull; {session?.location || 'Local Court'}
              </p>
            </div>

            {matches.length > 0 && (
              <button
                onClick={handleClearSession}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
              >
                Clear All Matches
              </button>
            )}
          </div>

          {matches.length === 0 ? (
            <div className="py-20 text-center bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-md">
              <Swords className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No Matches Generated Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
                Select your present players on the left and click &quot;Generate Optimal Matches&quot; to create balanced doubles rounds.
              </p>
              <button
                onClick={handleGenerateMatches}
                disabled={selectedPlayerIds.length < 4}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
              >
                Generate First Round
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => {
                // Determine resting players for this round
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
