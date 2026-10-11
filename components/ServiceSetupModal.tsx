'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MatchWithPlayers } from '@/lib/types';
import { 
  MatchServiceState, 
  createInitialServiceState, 
  getSavedServiceState 
} from '@/lib/serviceTracker';
import { X, Check } from 'lucide-react';

interface ServiceSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: MatchWithPlayers;
  onSave: (state: MatchServiceState) => void;
  title?: string;
  description?: string;
}

export default function ServiceSetupModal({
  isOpen,
  onClose,
  match,
  onSave,
  title = 'Track Server & Receiver',
  description = 'Set initial server & receiver to eliminate game chaos',
}: ServiceSetupModalProps) {
  const [mounted, setMounted] = useState<boolean>(false);
  const [setupServingTeam, setSetupServingTeam] = useState<'A' | 'B'>('A');
  const [setupTeamARightId, setSetupTeamARightId] = useState<string>('');
  const [setupTeamBRightId, setSetupTeamBRightId] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && match) {
      const saved = getSavedServiceState(match.id);
      const defaultA =
        saved?.teamARightPlayerId &&
        (saved.teamARightPlayerId === match.team_a_player1_id ||
          saved.teamARightPlayerId === match.team_a_player2_id)
          ? saved.teamARightPlayerId
          : match.team_a_player1_id || '';
      const defaultB =
        saved?.teamBRightPlayerId &&
        (saved.teamBRightPlayerId === match.team_b_player1_id ||
          saved.teamBRightPlayerId === match.team_b_player2_id)
          ? saved.teamBRightPlayerId
          : match.team_b_player1_id || '';

      setSetupServingTeam(saved?.servingTeam || 'A');
      setSetupTeamARightId(defaultA);
      setSetupTeamBRightId(defaultB);
    }
  }, [isOpen, match?.id]);

  if (!isOpen || !match || !mounted) return null;

  const handleSave = () => {
    const teamARight = setupTeamARightId || match.team_a_player1_id || '';
    const teamBRight = setupTeamBRightId || match.team_b_player1_id || '';
    const newState = createInitialServiceState({
      teamAPlayer1Id: match.team_a_player1_id,
      teamAPlayer2Id: match.team_a_player2_id,
      teamBPlayer1Id: match.team_b_player1_id,
      teamBPlayer2Id: match.team_b_player2_id,
      firstServingTeam: setupServingTeam,
      teamARightPlayerId: teamARight,
      teamBRightPlayerId: teamBRight,
    });
    onSave(newState);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl flex flex-col max-h-[88dvh] overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 pb-3 border-b border-slate-800 flex items-center justify-between flex-shrink-0 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🏸</span>
            <div>
              <h3 className="text-sm font-extrabold text-white">{title}</h3>
              <p className="text-[11px] text-slate-400">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Step 1: Who serves first? */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400">
              1. Which team serves first?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSetupServingTeam('A')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  setupServingTeam === 'A'
                    ? 'bg-emerald-500/20 border-emerald-500/60 ring-2 ring-emerald-500/40 text-emerald-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-emerald-400">Team A</span>
                  {setupServingTeam === 'A' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="text-xs font-black truncate mt-0.5">
                  {match.team_a_player1?.name} &amp; {match.team_a_player2?.name}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSetupServingTeam('B')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  setupServingTeam === 'B'
                    ? 'bg-teal-500/20 border-teal-500/60 ring-2 ring-teal-500/40 text-teal-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-teal-400">Team B</span>
                  {setupServingTeam === 'B' && <Check className="w-3.5 h-3.5 text-teal-400" />}
                </div>
                <div className="text-xs font-black truncate mt-0.5">
                  {match.team_b_player1?.name} &amp; {match.team_b_player2?.name}
                </div>
              </button>
            </div>
          </div>

          {/* Step 2: Team A Right Court Player */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400">
              2. Team A — Who starts on Right Court? {setupServingTeam === 'A' ? '(First Server)' : '(First Receiver)'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[match.team_a_player1, match.team_a_player2].filter(Boolean).map((p) => (
                <button
                  key={p!.id}
                  type="button"
                  onClick={() => setSetupTeamARightId(p!.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all truncate flex items-center justify-center gap-1.5 ${
                    setupTeamARightId === p!.id
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950 ring-2 ring-emerald-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {setupTeamARightId === p!.id && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  <span className="truncate">{p!.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Team B Right Court Player */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400">
              3. Team B — Who starts on Right Court? {setupServingTeam === 'B' ? '(First Server)' : '(First Receiver)'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[match.team_b_player1, match.team_b_player2].filter(Boolean).map((p) => (
                <button
                  key={p!.id}
                  type="button"
                  onClick={() => setSetupTeamBRightId(p!.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all truncate flex items-center justify-center gap-1.5 ${
                    setupTeamBRightId === p!.id
                      ? 'bg-teal-600 text-white border-teal-400 shadow-md shadow-teal-950 ring-2 ring-teal-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {setupTeamBRightId === p!.id && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  <span className="truncate">{p!.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Sticky Footer - Always visible! */}
        <div className="p-4 sm:p-5 pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5 bg-slate-900 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Save &amp; Track Service</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
