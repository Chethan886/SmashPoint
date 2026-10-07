'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { PlayerStats, Session } from '@/lib/types';
import { dataService } from '@/lib/dataService';
import { 
  Trophy, 
  Medal, 
  Search, 
  Flame, 
  Calendar, 
  Globe, 
  Activity,
  Award,
  Crown,
  Zap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface LeaderboardTableProps {
  stats: PlayerStats[];
  sessions: Session[];
  selectedDate?: string;
  onSelectDate?: (date: string | undefined) => void;
  selectedSessionId?: string;
  onSelectSession?: (sessionId: string | undefined) => void;
  matchDates?: string[];
  isLoading?: boolean;
}

export default function LeaderboardTable({
  stats,
  sessions,
  selectedDate,
  onSelectDate,
  selectedSessionId,
  onSelectSession,
  matchDates: propMatchDates,
  isLoading = false,
}: LeaderboardTableProps) {
  // Swappable Tab: First is 'The Gay Lord', then 'The Smash Lord'
  const [activeTab, setActiveTab] = useState<'gay_lord' | 'smash_lord'>('gay_lord');
  const [searchTerm, setSearchTerm] = useState('');

  // Active date (selectedDate or mapped from selectedSessionId)
  const currentDate = selectedDate !== undefined 
    ? selectedDate 
    : (selectedSessionId ? sessions.find(s => s.id === selectedSessionId)?.session_date : undefined);

  // Match dates state & fast lookup
  const [matchDates, setMatchDates] = useState<string[]>(propMatchDates || []);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const mobileModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const initialYear = currentDate ? parseInt(currentDate.split('-')[0], 10) : new Date().getFullYear();
  const initialMonth = currentDate ? parseInt(currentDate.split('-')[1], 10) - 1 : new Date().getMonth();
  const [viewYear, setViewYear] = useState<number>(initialYear);
  const [viewMonth, setViewMonth] = useState<number>(initialMonth);

  useEffect(() => {
    if (propMatchDates && propMatchDates.length > 0) {
      setMatchDates(propMatchDates);
    } else {
      dataService.getDatesWithMatches().then((dates) => {
        setMatchDates(dates);
      });
    }
  }, [propMatchDates]);

  useEffect(() => {
    if (currentDate && /^\d{4}-\d{2}-\d{2}$/.test(currentDate)) {
      const [y, m] = currentDate.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }, [currentDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (calendarRef.current && calendarRef.current.contains(target)) {
        return;
      }
      if (mobileModalRef.current && mobileModalRef.current.contains(target)) {
        return;
      }
      setIsCalendarOpen(false);
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const matchDatesSet = useMemo(() => new Set(matchDates), [matchDates]);
  const todayStr = new Date().toISOString().split('T')[0];

  const getDateKey = (day: number) => {
    const m = (viewMonth + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    return `${viewYear}-${m}-${d}`;
  };

  const handleDateChange = (date: string | undefined) => {
    if (onSelectDate) {
      onSelectDate(date);
    } else if (onSelectSession) {
      if (!date) {
        onSelectSession(undefined);
      } else {
        const sess = sessions.find((s) => s.session_date === date);
        onSelectSession(sess?.id || date);
      }
    }
  };

  // Distinguish active players (played at least 1 match) vs inactive
  const activePlayers = stats.filter((s) => s.total_matches > 0);
  const inactivePlayers = stats.filter((s) => s.total_matches === 0);
  const hasMatches = activePlayers.length > 0;

  // 1. The Smash Lord: Top player (standard sort: most wins, best win rate, highest point diff)
  // Only crowned if they actually won a match on this date
  const smashLord = hasMatches && activePlayers[0].wins > 0 ? activePlayers[0] : null;

  // 2. The Gay Lord: Person at the bottom of the tournament takes this crown!
  // Sorted by Gay Percentage (losses / total_matches DESC), most losses, worst point diff
  const gayLordOrderedActive = React.useMemo(() => {
    return [...activePlayers].sort((a, b) => {
      const gayRateA = a.total_matches > 0 ? (a.losses / a.total_matches) * 100 : 0;
      const gayRateB = b.total_matches > 0 ? (b.losses / b.total_matches) * 100 : 0;
      if (gayRateB !== gayRateA) return gayRateB - gayRateA;
      if (b.losses !== a.losses) return b.losses - a.losses;
      const diffA = (a.total_points_scored || 0) - (a.total_points_conceded || 0);
      const diffB = (b.total_points_scored || 0) - (b.total_points_conceded || 0);
      return diffA - diffB; // worse point diff comes first
    });
  }, [activePlayers]);

  const gayLord = hasMatches && gayLordOrderedActive.length > 0 
    ? gayLordOrderedActive[0] 
    : null;

  // Prepared ordered list depending on the active tab:
  // For 'smash_lord': Top-down order (winners first)
  // For 'gay_lord': Gay Lord order (highest Gay % first, taking the Gay Lord crown!)
  // If viewing a daily session, only display players who actually played that day
  const orderedStats = React.useMemo(() => {
    if (!hasMatches) return [];
    if (activeTab === 'smash_lord') {
      return currentDate ? activePlayers : [...activePlayers, ...inactivePlayers];
    } else {
      return currentDate ? gayLordOrderedActive : [...gayLordOrderedActive, ...inactivePlayers];
    }
  }, [activeTab, hasMatches, currentDate, activePlayers, inactivePlayers, gayLordOrderedActive]);

  const filteredStats = orderedStats.filter((s) => {
    const q = searchTerm.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.nickname && s.nickname.toLowerCase().includes(q));
  });

  const getRankBadge = (rank: number, isGayLord: boolean) => {
    if (rank === 1) {
      if (isGayLord) {
        return (
          <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-purple-600 text-white font-black shadow-md shadow-pink-500/30 ring-1 ring-pink-300/50">
            <Crown className="w-4 h-4 fill-white" />
          </div>
        );
      }
      return (
        <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black shadow-md shadow-amber-500/20 ring-1 ring-amber-300/50">
          <Trophy className="w-3.5 h-3.5 fill-slate-950" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-950 font-black shadow-md shadow-slate-300/20 ring-1 ring-slate-300/50">
          <Medal className="w-3.5 h-3.5" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-amber-800 to-amber-600 text-white font-black shadow-md shadow-amber-700/20 ring-1 ring-amber-600/40">
          <Award className="w-3.5 h-3.5" />
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-slate-800/80 text-slate-400 font-bold text-xs">
        #{rank}
      </div>
    );
  };

  const getRowHighlight = (rank: number, isGayLord: boolean) => {
    if (rank === 1) {
      if (isGayLord) {
        return 'bg-gradient-to-r from-pink-500/15 via-purple-950/40 to-slate-900 border-pink-500/50 shadow-sm shadow-pink-500/10';
      }
      return 'bg-gradient-to-r from-amber-500/10 via-slate-900/60 to-slate-900 border-amber-500/40';
    }
    if (rank === 2) {
      return isGayLord
        ? 'bg-gradient-to-r from-purple-500/10 via-slate-900/60 to-slate-900 border-purple-500/30'
        : 'bg-gradient-to-r from-slate-400/10 via-slate-900/60 to-slate-900 border-slate-400/30';
    }
    if (rank === 3) {
      return isGayLord
        ? 'bg-gradient-to-r from-fuchsia-950/20 via-slate-900/60 to-slate-900 border-fuchsia-800/30'
        : 'bg-gradient-to-r from-amber-800/10 via-slate-900/60 to-slate-900 border-amber-800/30';
    }
    return 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/40';
  };

  const isGayLordTab = activeTab === 'gay_lord';

  // Helper for Gay percentage (opposite of win percentage)
  const getGayRate = (s: PlayerStats) => {
    return s.total_matches > 0 ? Number(((s.losses / s.total_matches) * 100).toFixed(1)) : 0;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. SWAPPABLE TABS: The Gay Lord vs The Smash Lord */}
      <div className="relative p-1.5 bg-slate-950/90 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-xl backdrop-blur-xl">
        <div className="grid grid-cols-2 gap-1.5">
          {/* Tab 1: The Gay Lord (First Tab - Person at bottom takes crown) */}
          <button
            type="button"
            onClick={() => setActiveTab('gay_lord')}
            className={`relative flex items-center justify-center gap-1.5 sm:gap-2.5 py-3 px-3 sm:px-6 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-300 ${
              isGayLordTab
                ? 'bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 text-white shadow-lg shadow-pink-500/30 ring-1 ring-pink-400/50 scale-[1.01]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/70'
            }`}
          >
            <Crown className={`w-4 h-4 sm:w-5 sm:h-5 ${isGayLordTab ? 'fill-white animate-pulse' : 'text-pink-400'}`} />
            <span className="truncate tracking-tight">The Gay Lord</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider hidden xs:inline-block ${
              isGayLordTab ? 'bg-white/20 text-white' : 'bg-slate-800/80 text-pink-300/80'
            }`}>
              👑 Bottom Crown
            </span>
          </button>

          {/* Tab 2: The Smash Lord (Second Tab - The Winner) */}
          <button
            type="button"
            onClick={() => setActiveTab('smash_lord')}
            className={`relative flex items-center justify-center gap-1.5 sm:gap-2.5 py-3 px-3 sm:px-6 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-300 ${
              !isGayLordTab
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-500 text-slate-950 shadow-lg shadow-amber-500/30 ring-1 ring-amber-300/50 scale-[1.01]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/70'
            }`}
          >
            <Zap className={`w-4 h-4 sm:w-5 sm:h-5 ${!isGayLordTab ? 'fill-slate-950' : 'text-amber-400'}`} />
            <span className="truncate tracking-tight">The Smash Lord</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider hidden xs:inline-block ${
              !isGayLordTab ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800/80 text-amber-300/80'
            }`}>
              ⚡ Winner
            </span>
          </button>
        </div>
      </div>

      {/* 2. CROWN SPOTLIGHT HERO BANNER - Centered Big Picture with all details below */}
      {hasMatches && isGayLordTab && gayLord && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-pink-950/40 via-purple-950/25 to-slate-950 border border-pink-500/30 p-6 sm:p-8 shadow-2xl shadow-pink-500/10 backdrop-blur-xl">
          {/* Ambient Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* 1. Big Picture at the Center */}
            <div className="relative group mb-4">
              <Link
                href={`/stats?player=${gayLord.member_id}`}
                className="block transition-transform hover:scale-105 active:scale-95 duration-200"
                title={`View ${gayLord.name}'s deep stats`}
              >
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-tr from-pink-500 via-fuchsia-400 to-purple-500 p-[3px] shadow-2xl shadow-pink-500/40 group-hover:shadow-pink-500/60 ring-4 ring-pink-500/20 transition-all duration-300">
                  <div className="w-full h-full bg-slate-950 rounded-[21px] flex items-center justify-center overflow-hidden">
                    {gayLord.avatar_url ? (
                      <img
                        src={gayLord.avatar_url}
                        alt={gayLord.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <span className="text-4xl sm:text-5xl">👑</span>
                    )}
                  </div>
                </div>
              </Link>
              {/* Badge under picture */}
              <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg ring-2 ring-pink-300/40 uppercase tracking-wider whitespace-nowrap">
                💅 BOTTOM
              </span>
            </div>

            {/* 2. Reigning Title Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm mt-1 mb-2">
              <Crown className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
              <span>Reigning Gay Lord of the Court</span>
            </div>

            {/* 3. Player Name & Nickname */}
            <h3 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2 justify-center flex-wrap">
              <Link
                href={`/stats?player=${gayLord.member_id}`}
                className="hover:text-pink-300 transition-colors hover:underline underline-offset-4 decoration-pink-500"
                title={`View ${gayLord.name}'s deep stats`}
              >
                {gayLord.name}
              </Link>
              {gayLord.nickname && (
                <span className="text-sm sm:text-base text-pink-300/80 font-normal">
                  &quot;{gayLord.nickname}&quot;
                </span>
              )}
            </h3>

            {/* 4. Subtitle / Motto */}
            <p className="text-xs sm:text-sm text-pink-200/80 max-w-sm sm:max-w-md mx-auto mt-1">
              Person at the bottom proudly takes the wooden crown! 💅 👑
            </p>

            {/* 5. Stats Row (Losses | Wins | Gay %) */}
            <div className="flex items-center gap-4 sm:gap-8 bg-slate-950/85 px-6 py-3 rounded-2xl border border-pink-500/25 text-xs font-mono shadow-inner mt-4">
              <div className="text-center px-2">
                <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold tracking-wider">Losses</div>
                <div className="font-extrabold text-pink-400 text-base sm:text-xl">{gayLord.losses}</div>
              </div>
              <div className="h-7 w-px bg-slate-800" />
              <div className="text-center px-2">
                <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold tracking-wider">Wins</div>
                <div className="font-extrabold text-slate-400 text-base sm:text-xl">{gayLord.wins}</div>
              </div>
              <div className="h-7 w-px bg-slate-800" />
              <div className="text-center px-2">
                <div className="text-[10px] text-pink-300 uppercase font-sans font-semibold tracking-wider">Gay %</div>
                <div className="font-extrabold text-pink-400 text-base sm:text-xl">{getGayRate(gayLord)}%</div>
              </div>
            </div>

            {/* 6. Link to Deep Stats */}
            <Link
              href={`/stats?player=${gayLord.member_id}`}
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-pink-400 hover:text-pink-300 hover:underline underline-offset-4 transition-all"
            >
              <span>View Player Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {hasMatches && !isGayLordTab && smashLord && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-amber-950/40 via-yellow-950/25 to-slate-950 border border-amber-500/30 p-6 sm:p-8 shadow-2xl shadow-amber-500/10 backdrop-blur-xl">
          {/* Ambient Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* 1. Big Picture at the Center */}
            <div className="relative group mb-4">
              <Link
                href={`/stats?player=${smashLord.member_id}`}
                className="block transition-transform hover:scale-105 active:scale-95 duration-200"
                title={`View ${smashLord.name}'s deep stats`}
              >
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-emerald-400 p-[3px] shadow-2xl shadow-amber-500/40 group-hover:shadow-amber-500/60 ring-4 ring-amber-500/20 transition-all duration-300">
                  <div className="w-full h-full bg-slate-950 rounded-[21px] flex items-center justify-center overflow-hidden">
                    {smashLord.avatar_url ? (
                      <img
                        src={smashLord.avatar_url}
                        alt={smashLord.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <span className="text-4xl sm:text-5xl">⚡</span>
                    )}
                  </div>
                </div>
              </Link>
              {/* Badge under picture */}
              <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-lg ring-2 ring-amber-300/60 uppercase tracking-wider whitespace-nowrap">
                ⚡ #1 WINNER
              </span>
            </div>

            {/* 2. Reigning Title Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm mt-1 mb-2">
              <Trophy className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Supreme Smash Lord of the Court</span>
            </div>

            {/* 3. Player Name & Nickname */}
            <h3 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2 justify-center flex-wrap">
              <Link
                href={`/stats?player=${smashLord.member_id}`}
                className="hover:text-amber-300 transition-colors hover:underline underline-offset-4 decoration-amber-500"
                title={`View ${smashLord.name}'s deep stats`}
              >
                {smashLord.name}
              </Link>
              {smashLord.nickname && (
                <span className="text-sm sm:text-base text-amber-300/80 font-normal">
                  &quot;{smashLord.nickname}&quot;
                </span>
              )}
            </h3>

            {/* 4. Subtitle / Motto */}
            <p className="text-xs sm:text-sm text-amber-200/80 max-w-sm sm:max-w-md mx-auto mt-1">
              Undisputed tournament champion ruling the court with fire and smashes! 🔥 ⚡
            </p>

            {/* 5. Stats Row (Wins | Losses | Win Rate) */}
            <div className="flex items-center gap-4 sm:gap-8 bg-slate-950/85 px-6 py-3 rounded-2xl border border-amber-500/25 text-xs font-mono shadow-inner mt-4">
              <div className="text-center px-2">
                <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold tracking-wider">Wins</div>
                <div className="font-extrabold text-emerald-400 text-base sm:text-xl">{smashLord.wins}</div>
              </div>
              <div className="h-7 w-px bg-slate-800" />
              <div className="text-center px-2">
                <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold tracking-wider">Losses</div>
                <div className="font-extrabold text-rose-400 text-base sm:text-xl">{smashLord.losses}</div>
              </div>
              <div className="h-7 w-px bg-slate-800" />
              <div className="text-center px-2">
                <div className="text-[10px] text-amber-300 uppercase font-sans font-semibold tracking-wider">Win Rate</div>
                <div className="font-extrabold text-amber-400 text-base sm:text-xl">{smashLord.win_rate}%</div>
              </div>
            </div>

            {/* 6. Link to Deep Stats */}
            <Link
              href={`/stats?player=${smashLord.member_id}`}
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline underline-offset-4 transition-all"
            >
              <span>View Player Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 3. Controls: Daily vs All-Time Toggle + Calendar Date Picker + Search */}
      <div className={`relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/80 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-lg backdrop-blur-md ${isCalendarOpen ? 'z-40' : 'z-10'}`}>
        {/* Toggle Pills - Full width on mobile: All-Time first, then Daily */}
        <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl sm:rounded-2xl border border-slate-800 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleDateChange(undefined)}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${
              !currentDate
                ? isGayLordTab 
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-sm'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>All-Time</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              const defaultDailyDate = matchDates.includes(today)
                ? today
                : (matchDates.length > 0 ? matchDates[matchDates.length - 1] : today);
              handleDateChange(defaultDailyDate);
            }}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${
              currentDate
                ? isGayLordTab 
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-sm'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily</span>
          </button>
        </div>

        {/* Right side: Interactive Calendar Popover with green match highlights + search input */}
        <div className="flex items-center gap-2">
          {currentDate && (
            <div className={`relative flex-1 sm:flex-none ${isCalendarOpen ? 'z-50' : ''}`} ref={calendarRef}>
              <button
                type="button"
                onClick={() => setIsCalendarOpen((prev) => !prev)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border text-xs font-semibold shadow-sm transition-all w-full sm:w-auto justify-between sm:justify-start ${
                  isCalendarOpen
                    ? isGayLordTab 
                      ? 'border-pink-500 ring-2 ring-pink-500/20 text-white' 
                      : 'border-emerald-500 ring-2 ring-emerald-500/20 text-white'
                    : 'border-slate-800 text-slate-200 hover:border-slate-700'
                }`}
                title="Open calendar to view match dates"
              >
                <div className="flex items-center gap-1.5">
                  <Calendar className={`w-3.5 h-3.5 shrink-0 ${isGayLordTab ? 'text-pink-400' : 'text-emerald-400'}`} />
                  <span>
                    {new Date(currentDate + 'T00:00:00').toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {matchDatesSet.has(currentDate) && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Match Day
                    </span>
                  )}
                  <ChevronDown
                    className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                      isCalendarOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {/* On Desktop: Anchored Dropdown (sm:block) with high z-index */}
              {isCalendarOpen && (
                <div
                  className="hidden sm:block absolute top-full mt-2 right-0 z-[100] w-80 p-3.5 rounded-2xl bg-[#090d16] border border-slate-700 shadow-2xl shadow-black ring-1 ring-slate-700/60"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Month & Year Navigation Header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <button
                      type="button"
                      onClick={prevMonth}
                      className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Previous month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="text-xs sm:text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
                      <span>{monthNames[viewMonth]}</span>
                      <span className="text-slate-400 font-mono">{viewYear}</span>
                    </div>

                    <button
                      type="button"
                      onClick={nextMonth}
                      className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Next month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Day of Week Labels */}
                  <div className="grid grid-cols-7 gap-1 mb-1 text-center">
                    {daysOfWeek.map((day) => (
                      <div key={day} className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider py-0.5">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Day Grid with Green Color on Match Dates */}
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => {
                      const prevDay = daysInPrevMonth - firstDayOfWeek + i + 1;
                      return (
                        <div
                          key={`prev-${i}`}
                          className="h-8 flex items-center justify-center text-[11px] text-slate-600 select-none font-medium"
                        >
                          {prevDay}
                        </div>
                      );
                    })}

                    {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
                      const day = i + 1;
                      const dateKey = getDateKey(day);
                      const hasMatch = matchDatesSet.has(dateKey);
                      const isSelected = currentDate === dateKey;
                      const isToday = todayStr === dateKey;

                      let dayClasses = 'relative h-8 flex flex-col items-center justify-center rounded-xl text-xs font-semibold transition-all ';

                      if (isSelected) {
                        if (hasMatch) {
                          dayClasses += 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/40 ring-2 ring-emerald-300';
                        } else {
                          dayClasses += isGayLordTab
                            ? 'bg-pink-600 text-white font-black shadow-md shadow-pink-500/30 ring-2 ring-pink-300'
                            : 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-500/30 ring-2 ring-emerald-300';
                        }
                      } else if (hasMatch) {
                        dayClasses += 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/60 hover:bg-emerald-900/90 shadow-sm shadow-emerald-500/20 font-extrabold';
                      } else {
                        dayClasses += 'text-slate-300 hover:text-white hover:bg-slate-800/90';
                      }

                      return (
                        <button
                          key={dateKey}
                          type="button"
                          onClick={() => {
                            handleDateChange(dateKey);
                            setIsCalendarOpen(false);
                          }}
                          className={dayClasses}
                          title={hasMatch ? `Match held on ${dateKey}` : `No matches on ${dateKey}`}
                        >
                          <span className="leading-none">{day}</span>
                          {hasMatch && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                                isSelected ? 'bg-slate-950' : 'bg-emerald-400 shadow-sm shadow-emerald-400'
                              }`}
                            />
                          )}
                          {!hasMatch && isToday && (
                            <span className="w-1 h-1 rounded-full bg-slate-500 mt-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Calendar Footer: Color Legend & Quick Jump */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px]">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                        <span>Match held</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[10px]">
                        <span className="w-2 h-2 rounded-full bg-slate-600" />
                        <span>No match</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        handleDateChange(todayStr);
                        setIsCalendarOpen(false);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 hover:text-white border border-slate-700 transition-all"
                    >
                      Today
                    </button>
                  </div>
                </div>
              )}

              {/* On Mobile: Portaled directly to document.body with z-[99999] so NOTHING can ever appear on top */}
              {isCalendarOpen && mounted && typeof document !== 'undefined' && createPortal(
                <div className="sm:hidden">
                  {/* Backdrop for Mobile */}
                  <div
                    className="fixed inset-0 z-[99998] bg-black/85 backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCalendarOpen(false);
                    }}
                  />

                  {/* Centered Modal on Mobile */}
                  <div
                    ref={mobileModalRef}
                    className="fixed inset-x-3 top-1/2 -translate-y-1/2 z-[99999] max-w-[340px] mx-auto p-4 rounded-3xl bg-[#090d16] border border-slate-700 shadow-2xl shadow-black ring-1 ring-slate-700/80"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Month & Year Navigation Header */}
                    <div className="flex items-center justify-between mb-3 px-1">
                      <button
                        type="button"
                        onClick={prevMonth}
                        className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Previous month"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <div className="text-xs sm:text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
                        <span>{monthNames[viewMonth]}</span>
                        <span className="text-slate-400 font-mono">{viewYear}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={nextMonth}
                          className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Next month"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsCalendarOpen(false)}
                          className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors ml-1"
                          title="Close calendar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Day of Week Labels */}
                    <div className="grid grid-cols-7 gap-1 mb-1 text-center">
                      {daysOfWeek.map((day) => (
                        <div key={day} className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider py-0.5">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Day Grid with Green Color on Match Dates */}
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: firstDayOfWeek }).map((_, i) => {
                        const prevDay = daysInPrevMonth - firstDayOfWeek + i + 1;
                        return (
                          <div
                            key={`prev-${i}`}
                            className="h-8 flex items-center justify-center text-[11px] text-slate-600 select-none font-medium"
                          >
                            {prevDay}
                          </div>
                        );
                      })}

                      {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
                        const day = i + 1;
                        const dateKey = getDateKey(day);
                        const hasMatch = matchDatesSet.has(dateKey);
                        const isSelected = currentDate === dateKey;
                        const isToday = todayStr === dateKey;

                        let dayClasses = 'relative h-8 flex flex-col items-center justify-center rounded-xl text-xs font-semibold transition-all ';

                        if (isSelected) {
                          if (hasMatch) {
                            dayClasses += 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/40 ring-2 ring-emerald-300';
                          } else {
                            dayClasses += isGayLordTab
                              ? 'bg-pink-600 text-white font-black shadow-md shadow-pink-500/30 ring-2 ring-pink-300'
                              : 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-500/30 ring-2 ring-emerald-300';
                          }
                        } else if (hasMatch) {
                          dayClasses += 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/60 hover:bg-emerald-900/90 shadow-sm shadow-emerald-500/20 font-extrabold';
                        } else {
                          dayClasses += 'text-slate-300 hover:text-white hover:bg-slate-800/90';
                        }

                        return (
                          <button
                            key={dateKey}
                            type="button"
                            onClick={() => {
                              handleDateChange(dateKey);
                              setIsCalendarOpen(false);
                            }}
                            className={dayClasses}
                            title={hasMatch ? `Match held on ${dateKey}` : `No matches on ${dateKey}`}
                          >
                            <span className="leading-none">{day}</span>
                            {hasMatch && (
                              <span
                                className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                                  isSelected ? 'bg-slate-950' : 'bg-emerald-400 shadow-sm shadow-emerald-400'
                                }`}
                              />
                            )}
                            {!hasMatch && isToday && (
                              <span className="w-1 h-1 rounded-full bg-slate-500 mt-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Calendar Footer: Color Legend & Quick Jump */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px]">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                          <span>Match held</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[10px]">
                          <span className="w-2 h-2 rounded-full bg-slate-600" />
                          <span>No match</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            handleDateChange(todayStr);
                            setIsCalendarOpen(false);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 hover:text-white border border-slate-700 transition-all"
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsCalendarOpen(false)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-400 hover:text-white border border-slate-700 transition-all"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                </div>,
                document.body
              )}
            </div>
          )}

          <div className="relative flex-1 sm:flex-none">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search player..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full sm:w-44 pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none ${
                isGayLordTab ? 'focus:border-pink-500' : 'focus:border-amber-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Empty State when no matches were played on this day */}
      {!hasMatches && !isLoading ? (
        <div className="py-14 sm:py-20 px-4 text-center rounded-3xl bg-slate-900/50 border border-slate-800 shadow-xl backdrop-blur-xl animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mx-auto mb-3.5 text-slate-400 shadow-inner">
            <Calendar className={`w-7 h-7 ${isGayLordTab ? 'text-pink-400' : 'text-emerald-400'}`} />
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-white mb-1.5">
            No matches on {currentDate ? new Date(currentDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'this day'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-6">
            {currentDate 
              ? 'No badminton games were played on this date. Select another date from the calendar or switch to All-Time tournament standings.'
              : 'No completed games recorded yet. Generate matches to view standings!'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {currentDate && (
              <button
                type="button"
                onClick={() => handleDateChange(undefined)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all border border-slate-700 shadow-sm"
              >
                View All-Time Standings
              </button>
            )}
            <Link
              href="/matches"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white transition-all shadow-md shadow-emerald-600/30 active:scale-95"
            >
              Go to Match Generator →
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* 4. PODIUM HIGHLIGHTS (Top 3 for Active Tab) */}
          {hasMatches && filteredStats.length >= 3 && !searchTerm && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3 pb-1 max-w-lg mx-auto">
              {/* Rank 2 */}
              <div className="flex flex-col items-center justify-end">
                <Link
                  href={`/stats?player=${filteredStats[1].member_id}`}
                  className="group/p2 flex flex-col items-center"
                  title={`View ${filteredStats[1].name}'s deep stats`}
                >
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-slate-400 to-slate-200 p-[1.5px] shadow-sm mb-1.5 group-hover/p2:ring-2 group-hover/p2:ring-slate-300 transition-all">
                    <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                      {filteredStats[1].avatar_url ? (
                        <img src={filteredStats[1].avatar_url} alt={filteredStats[1].name} className="w-full h-full object-cover" />
                      ) : (
                        <Medal className="w-5 h-5 sm:w-7 sm:h-7 text-slate-300" />
                      )}
                    </div>
                  </div>
                  <span className="font-extrabold text-white text-xs text-center truncate max-w-[90px] group-hover/p2:text-slate-200 transition-colors">
                    {filteredStats[1].name}
                  </span>
                </Link>
                <span className={`text-[10px] font-mono ${isGayLordTab ? 'text-pink-300 font-semibold' : 'text-slate-400'}`}>
                  {isGayLordTab 
                    ? `${filteredStats[1].losses}L-${filteredStats[1].wins}W (${getGayRate(filteredStats[1])}%)`
                    : `${filteredStats[1].wins}W-${filteredStats[1].losses}L (${filteredStats[1].win_rate}%)`
                  }
                </span>
                <div className="mt-1.5 w-full h-10 sm:h-16 bg-slate-800/60 border-t-2 border-slate-400 rounded-t-lg flex items-center justify-center font-black text-slate-300 text-xs">
                  2nd
                </div>
              </div>

              {/* Rank 1 (Crown) */}
              <div className="flex flex-col items-center justify-end -mt-3">
                <Link
                  href={`/stats?player=${filteredStats[0].member_id}`}
                  className="group/p1 flex flex-col items-center"
                  title={`View ${filteredStats[0].name}'s deep stats`}
                >
                  <div className="relative mb-1.5">
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl p-[2px] shadow-md transition-all group-hover/p1:scale-105 ${
                      isGayLordTab
                        ? 'bg-gradient-to-tr from-pink-500 via-fuchsia-400 to-purple-600 shadow-pink-500/30'
                        : 'bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 shadow-amber-500/30'
                    }`}>
                      <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                        {filteredStats[0].avatar_url ? (
                          <img src={filteredStats[0].avatar_url} alt={filteredStats[0].name} className="w-full h-full object-cover" />
                        ) : isGayLordTab ? (
                          <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-pink-400 fill-pink-400" />
                        ) : (
                          <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />
                        )}
                      </div>
                    </div>
                    <span className={`absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-black shadow ${
                      isGayLordTab ? 'bg-pink-500 text-white' : 'bg-amber-400 text-slate-950'
                    }`}>
                      #1
                    </span>
                  </div>
                  <span className={`font-extrabold text-xs sm:text-sm text-center truncate max-w-[100px] transition-colors ${
                    isGayLordTab ? 'text-pink-300 group-hover/p1:text-pink-200' : 'text-amber-300 group-hover/p1:text-amber-200'
                  }`}>
                    {filteredStats[0].name}
                  </span>
                </Link>
                <span className={`text-[10px] font-mono ${
                  isGayLordTab ? 'text-pink-400 font-semibold' : 'text-amber-400/80'
                }`}>
                  {isGayLordTab 
                    ? `${filteredStats[0].losses}L-${filteredStats[0].wins}W (${getGayRate(filteredStats[0])}%)`
                    : `${filteredStats[0].wins}W-${filteredStats[0].losses}L (${filteredStats[0].win_rate}%)`
                  }
                </span>
                <div className={`mt-1.5 w-full h-14 sm:h-20 border-t-2 rounded-t-lg flex items-center justify-center font-black text-xs sm:text-sm ${
                  isGayLordTab
                    ? 'bg-gradient-to-t from-pink-950/60 to-purple-900/30 border-pink-400 text-pink-300'
                    : 'bg-gradient-to-t from-amber-950/40 to-amber-900/20 border-amber-400 text-amber-300'
                }`}>
                  {isGayLordTab ? '👑 Gay Lord' : '👑 Smash Lord'}
                </div>
              </div>

              {/* Rank 3 */}
              <div className="flex flex-col items-center justify-end">
                <Link
                  href={`/stats?player=${filteredStats[2].member_id}`}
                  className="group/p3 flex flex-col items-center"
                  title={`View ${filteredStats[2].name}'s deep stats`}
                >
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-800 to-amber-600 p-[1.5px] shadow-sm mb-1.5 group-hover/p3:ring-2 group-hover/p3:ring-amber-500 transition-all">
                    <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                      {filteredStats[2].avatar_url ? (
                        <img src={filteredStats[2].avatar_url} alt={filteredStats[2].name} className="w-full h-full object-cover" />
                      ) : (
                        <Award className="w-5 h-5 sm:w-7 sm:h-7 text-amber-600" />
                      )}
                    </div>
                  </div>
                  <span className="font-extrabold text-white text-xs text-center truncate max-w-[90px] group-hover/p3:text-amber-200 transition-colors">
                    {filteredStats[2].name}
                  </span>
                </Link>
                <span className={`text-[10px] font-mono ${isGayLordTab ? 'text-pink-300 font-semibold' : 'text-slate-400'}`}>
                  {isGayLordTab 
                    ? `${filteredStats[2].losses}L-${filteredStats[2].wins}W (${getGayRate(filteredStats[2])}%)`
                    : `${filteredStats[2].wins}W-${filteredStats[2].losses}L (${filteredStats[2].win_rate}%)`
                  }
                </span>
                <div className="mt-1.5 w-full h-8 sm:h-12 bg-slate-800/60 border-t-2 border-amber-700 rounded-t-lg flex items-center justify-center font-black text-amber-600 text-xs">
                  3rd
                </div>
              </div>
            </div>
          )}

          {/* 5. Main Table (Optimized for Mobile with no awkward horizontal scrolling) */}
          <div className={`rounded-2xl sm:rounded-3xl border bg-slate-900/50 backdrop-blur-xl overflow-hidden shadow-xl ${
            isGayLordTab ? 'border-pink-500/20' : 'border-slate-800'
          }`}>
            <div className="w-full">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[10px] sm:text-xs uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-2 sm:px-4 w-10 sm:w-16 text-center">
                      {isGayLordTab ? 'GL #' : '#'}
                    </th>
                    <th className="py-3 px-2 sm:px-4">Player</th>
                    <th className="py-3 px-2 text-center">
                      {isGayLordTab ? 'L - W' : 'W - L'}
                    </th>
                    <th className="py-3 px-2 sm:px-4 min-w-[90px] sm:min-w-[160px]">
                      {isGayLordTab ? 'Gay %' : 'Win %'}
                    </th>
                    <th className="py-3 px-3 text-right hidden sm:table-cell">Diff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400 text-xs">
                        <Activity className={`w-5 h-5 animate-spin mx-auto mb-2 ${
                          isGayLordTab ? 'text-pink-400' : 'text-emerald-400'
                        }`} />
                        Calculating standings...
                      </td>
                    </tr>
                  ) : filteredStats.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400 text-xs">
                        No matches found.
                      </td>
                    </tr>
                  ) : (
                    filteredStats.map((stat, index) => {
                      const rank = index + 1;
                      const pointDiff = (stat.total_points_scored || 0) - (stat.total_points_conceded || 0);
                      const gayRate = getGayRate(stat);

                      return (
                        <tr
                          key={stat.member_id}
                          className={`border-b transition-colors ${getRowHighlight(rank, isGayLordTab)}`}
                        >
                          {/* Rank */}
                          <td className="py-3 px-2 sm:px-4 text-center">
                            <div className="flex items-center justify-center">
                              {getRankBadge(rank, isGayLordTab)}
                            </div>
                          </td>

                          {/* Player Info with Profile Picture */}
                          <td className="py-3 px-2 sm:px-4">
                            <Link
                              href={`/stats?player=${stat.member_id}`}
                              className="flex items-center gap-2 sm:gap-2.5 group/player"
                              title={`View ${stat.name}'s deep stats`}
                            >
                              {stat.avatar_url ? (
                                <img
                                  src={stat.avatar_url}
                                  alt={stat.name}
                                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 ring-1 ${
                                    isGayLordTab ? 'ring-pink-500/40 group-hover/player:ring-pink-400' : 'ring-emerald-500/40 group-hover/player:ring-emerald-400'
                                  } transition-all`}
                                />
                              ) : (
                                <div
                                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm transition-transform group-hover/player:scale-110"
                                  style={{ backgroundColor: stat.avatar_color || '#10b981' }}
                                >
                                  {stat.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="flex flex-col min-w-0">
                                <span className={`font-extrabold text-xs sm:text-sm flex items-center gap-1.5 truncate transition-colors ${
                                  isGayLordTab ? 'group-hover/player:text-pink-300' : 'group-hover/player:text-emerald-300'
                                } text-white`}>
                                  <span className="truncate">{stat.name}</span>
                                  {rank === 1 && (
                                    isGayLordTab ? (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9px] font-black bg-pink-500/20 text-pink-300 border border-pink-500/40 shrink-0">
                                        👑 Gay Lord
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                                        ⚡ Smash Lord
                                      </span>
                                    )
                                  )}
                                </span>
                                {stat.nickname && (
                                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                    &quot;{stat.nickname}&quot;
                                  </span>
                                )}
                              </div>
                            </Link>
                          </td>

                          {/* Score: L - W for Gay Lord, W - L for Smash Lord */}
                          <td className="py-3 px-2 text-center font-mono font-bold text-xs sm:text-sm">
                            {isGayLordTab ? (
                              <>
                                <span className="text-pink-400">{stat.losses}</span>
                                <span className="text-slate-600 mx-0.5">-</span>
                                <span className="text-slate-400">{stat.wins}</span>
                              </>
                            ) : (
                              <>
                                <span className="text-emerald-400">{stat.wins}</span>
                                <span className="text-slate-600 mx-0.5">-</span>
                                <span className="text-rose-400">{stat.losses}</span>
                              </>
                            )}
                          </td>

                          {/* Percentage Progress Bar: Gay % vs Win % */}
                          <td className="py-3 px-2 sm:px-4">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] sm:text-xs">
                                <span className={`font-mono font-bold ${isGayLordTab ? 'text-pink-300' : 'text-white'}`}>
                                  {isGayLordTab ? `${gayRate}%` : `${stat.win_rate}%`}
                                </span>
                              </div>
                              <div className="w-full h-1.5 sm:h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isGayLordTab
                                      ? gayRate >= 70
                                        ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500'
                                        : gayRate >= 40
                                        ? 'bg-gradient-to-r from-pink-500 to-purple-400'
                                        : 'bg-gradient-to-r from-indigo-500 to-purple-400'
                                      : stat.win_rate >= 70
                                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                      : stat.win_rate >= 40
                                      ? 'bg-gradient-to-r from-teal-500 to-amber-400'
                                      : 'bg-gradient-to-r from-amber-500 to-rose-500'
                                  }`}
                                  style={{ width: `${Math.min(100, Math.max(0, isGayLordTab ? gayRate : stat.win_rate))}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Point Diff */}
                          <td className="py-3 px-3 text-right hidden sm:table-cell font-mono text-xs">
                            <span
                              className={`font-bold px-1.5 py-0.5 rounded ${
                                pointDiff > 0
                                  ? 'text-emerald-400 bg-emerald-500/10'
                                  : pointDiff < 0
                                  ? 'text-rose-400 bg-rose-500/10'
                                  : 'text-slate-400 bg-slate-800'
                              }`}
                            >
                              {pointDiff > 0 ? `+${pointDiff}` : pointDiff}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

