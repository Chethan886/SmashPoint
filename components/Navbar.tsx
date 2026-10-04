'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Trophy, 
  Swords, 
  Users, 
  Flame, 
  History as HistoryIcon,
  BarChart2
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Standings', shortLabel: 'Standings', icon: Trophy },
    { href: '/matches', label: 'Match Generator', shortLabel: 'Matches', icon: Swords },
    { href: '/stats', label: 'Player Stats', shortLabel: 'Stats', icon: BarChart2 },
    { href: '/history', label: 'History', shortLabel: 'History', icon: HistoryIcon },
    { href: '/members', label: 'Roster & Members', shortLabel: 'Roster', icon: Users },
  ];

  if (pathname?.startsWith('/scoreboard')) {
    return null;
  }

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/90 border-b border-emerald-500/20 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 p-[1.5px] shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
                <div className="w-full h-full bg-slate-950 rounded-[9px] sm:rounded-[10px] flex items-center justify-center">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 group-hover:text-amber-400 transition-colors" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 text-base sm:text-lg tracking-tight leading-tight">
                  SmashPoint
                </span>
                <span className="text-[9px] sm:text-[11px] font-medium text-slate-400 tracking-wider uppercase">
                  Badminton Tracker
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Fixed Bottom Navigation Bar for Mobile (App-like UX) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 shadow-[0_-4px_24px_rgba(0,0,0,0.6)]">
        <div className="grid grid-cols-5 max-w-md mx-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'text-emerald-400 bg-emerald-500/10 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                <span className="text-[11px] font-medium tracking-tight">
                  {item.shortLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

