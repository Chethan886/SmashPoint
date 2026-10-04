'use client';

import React, { useState, useEffect } from 'react';
import { SessionHistoryItem } from '@/lib/types';
import { dataService } from '@/lib/dataService';
import { 
  History, 
  Calendar, 
  MapPin, 
  Trophy, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  CheckCircle2, 
  Flame, 
  ArrowRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function HistoryPage() {
  const [historyItems, setHistoryItems] = useState<SessionHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedSessionIds, setExpandedSessionIds] = useState<Set<string>>(new Set());
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const items = await dataService.getHistorySessions();
      setHistoryItems(items);
      // Auto-expand the most recent session if available
      if (items.length > 0) {
        setExpandedSessionIds(new Set([items[0].session.id]));
      }
    } catch (err) {
      console.error('Failed to load match history:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (sessionId: string) => {
    setExpandedSessionIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await dataService.deleteSession(sessionId);
      setHistoryItems((prev) => prev.filter((item) => item.session.id !== sessionId));
      setDeleteConfirmationId(null);
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-400" />
            <span>Match History</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Archived sessions, final match scorecards, and historical rotation records.
          </p>
        </div>

        <Link
          href="/matches"
          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
        >
          <span>Matchboard</span>
          <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
        </Link>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading historical sessions...</p>
        </div>
      ) : historyItems.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-md">
          <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h2 className="text-base font-bold text-white mb-1">No Past Sessions in History</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
            When all match rounds in a session are completed, tap &quot;Save Session to History&quot; on the matches page to permanently archive them here.
          </p>
          <Link
            href="/matches"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 active:scale-95 transition-all inline-flex items-center gap-1.5"
          >
            <span>Go to Active Games</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {historyItems.map((item, idx) => {
            const { session, matches, totalRounds, completedRounds, topWinners } = item;
            const isExpanded = expandedSessionIds.has(session.id);
            const isConfirmingDelete = deleteConfirmationId === session.id;

            return (
              <div
                key={session.id}
                className="rounded-2xl sm:rounded-3xl bg-slate-900/70 border border-slate-800 overflow-hidden shadow-md backdrop-blur-sm transition-all duration-200 hover:border-slate-700/80"
              >
                {/* Session Card Header */}
                <div
                  onClick={() => toggleExpand(session.id)}
                  className="p-4 sm:p-5 cursor-pointer select-none flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40 hover:bg-slate-950/70 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {idx === 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 shadow-sm shadow-emerald-500/30">
                          <Sparkles className="w-3 h-3" />
                          Latest Session
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                        <Calendar className="w-3 h-3" />
                        {session.session_date}
                      </span>

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold text-slate-400 bg-slate-900 border border-slate-800">
                        <MapPin className="w-2.5 h-2.5 text-slate-500" />
                        {session.location?.replace(' [COMPLETED]', '') || 'Local Court'}
                      </span>

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Completed ({completedRounds}/{totalRounds})
                      </span>
                    </div>

                    {/* Top Winners Pills */}
                    {topWinners.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-amber-400" /> MVP:
                        </span>
                        {topWinners.slice(0, 3).map((w, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-200 bg-slate-900/90 px-2 py-0.5 rounded-lg border border-slate-800"
                          >
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: w.color || '#10b981' }}
                            />
                            <span>{w.name}</span>
                            <span className="text-amber-400 font-mono font-black text-[10px]">
                              {w.wins}W
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions & Expand Chevron */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {isConfirmingDelete ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 bg-rose-950/80 p-1 rounded-xl border border-rose-800/80"
                      >
                        <button
                          type="button"
                          onClick={() => handleDeleteSession(session.id)}
                          className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold active:scale-95"
                        >
                          Confirm Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmationId(null)}
                          className="px-2 py-1 rounded-lg text-slate-400 hover:text-white text-[10px]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmationId(session.id);
                        }}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-bold"
                    >
                      <span className="text-[11px] hidden sm:inline">
                        {isExpanded ? 'Hide' : 'View'} Rounds
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-emerald-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Matches List */}
                {isExpanded && (
                  <div className="p-3 sm:p-5 border-t border-slate-800/80 space-y-2.5 bg-slate-950/20">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                      All {matches.length} Match Rounds Played
                    </div>

                    <div className="grid gap-2">
                      {matches.map((match) => {
                        const hasTeamAWon = match.winning_team === 'TEAM_A';
                        const hasTeamBWon = match.winning_team === 'TEAM_B';

                        return (
                          <div
                            key={match.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 sm:p-3 rounded-xl bg-slate-900/60 border border-slate-800/80"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-xs px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                R{match.round_number}
                              </span>

                              {match.winning_team !== 'PENDING' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                                  {hasTeamAWon ? 'Team A Won' : 'Team B Won'}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] text-slate-500 bg-slate-800">
                                  Incomplete
                                </span>
                              )}
                            </div>

                            {/* Scoreboard line */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 flex-1 text-xs">
                              {/* Team A */}
                              <div
                                className={`flex items-center gap-1 truncate max-w-[150px] ${
                                  hasTeamAWon ? 'text-emerald-300 font-extrabold' : 'text-slate-300'
                                }`}
                              >
                                <span className="truncate">
                                  {match.team_a_player1?.name} &amp; {match.team_a_player2?.name}
                                </span>
                                {hasTeamAWon && (
                                  <Trophy className="w-3 h-3 text-amber-400 flex-shrink-0 fill-amber-400/20" />
                                )}
                              </div>

                              {/* Final Score */}
                              <span className="font-mono font-black px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-white text-xs tracking-tight">
                                {match.score_team_a} - {match.score_team_b}
                              </span>

                              {/* Team B */}
                              <div
                                className={`flex items-center gap-1 truncate max-w-[150px] justify-end ${
                                  hasTeamBWon ? 'text-teal-300 font-extrabold' : 'text-slate-300'
                                }`}
                              >
                                {hasTeamBWon && (
                                  <Trophy className="w-3 h-3 text-amber-400 flex-shrink-0 fill-amber-400/20" />
                                )}
                                <span className="truncate">
                                  {match.team_b_player1?.name} &amp; {match.team_b_player2?.name}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
