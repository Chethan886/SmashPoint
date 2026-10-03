'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Trophy, 
  Swords, 
  Users, 
  Database, 
  CheckCircle2, 
  AlertCircle,
  X,
  Flame
} from 'lucide-react';
import { isSupabaseConfigured, saveCustomSupabaseCredentials, clearCustomSupabaseCredentials, getSupabaseCredentials } from '@/lib/supabaseClient';

export default function Navbar() {
  const pathname = usePathname();
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>('');
  const [keyInput, setKeyInput] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    setSupabaseConnected(isSupabaseConfigured());
    const creds = getSupabaseCredentials();
    if (creds.url && !creds.url.includes('placeholder')) {
      setUrlInput(creds.url);
      setKeyInput(creds.key);
    }
  }, []);

  const handleSaveCreds = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || !keyInput.trim()) {
      setNotification('Please enter both Supabase URL and Anon Key');
      return;
    }
    saveCustomSupabaseCredentials(urlInput.trim(), keyInput.trim());
    setSupabaseConnected(true);
    setNotification('Supabase credentials saved successfully!');
    setTimeout(() => {
      setShowModal(false);
      setNotification(null);
      window.location.reload();
    }, 1200);
  };

  const handleClearCreds = () => {
    clearCustomSupabaseCredentials();
    setUrlInput('');
    setKeyInput('');
    setSupabaseConnected(false);
    setNotification('Cleared custom credentials.');
    setTimeout(() => {
      setShowModal(false);
      setNotification(null);
      window.location.reload();
    }, 1000);
  };

  const navLinks = [
    { href: '/', label: 'Standings', shortLabel: 'Standings', icon: Trophy },
    { href: '/matches', label: 'Match Generator', shortLabel: 'Matches', icon: Swords },
    { href: '/members', label: 'Roster & Members', shortLabel: 'Roster', icon: Users },
  ];

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

            {/* Database Status Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowModal(true)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                  supabaseConnected
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 shadow-sm shadow-emerald-500/20'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/50'
                }`}
                title="Click to view database settings"
              >
                <span className={`w-2 h-2 rounded-full ${supabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="hidden xs:inline sm:inline">
                  {supabaseConnected ? 'Supabase' : 'Local'}
                </span>
                <Database className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-80" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Fixed Bottom Navigation Bar for Mobile (App-like UX) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 shadow-[0_-4px_24px_rgba(0,0,0,0.6)]">
        <div className="grid grid-cols-3 max-w-md mx-auto">
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

      {/* Database Connection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Database Settings</h3>
                <p className="text-xs text-slate-400">Supabase Free PostgreSQL Cloud Sync</p>
              </div>
            </div>

            <div className="p-3.5 mb-5 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">Status:</span>
                {supabaseConnected ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> Connected to Supabase
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                    <AlertCircle className="w-4 h-4" /> Local Storage Active (100% operational)
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Matches and members are saved locally. Connect your free Supabase database to sync stats across all phones on the court.
              </p>
            </div>

            {notification && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-medium">
                {notification}
              </div>
            )}

            <form onSubmit={handleSaveCreds} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  placeholder="https://your-project-id.supabase.co"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:outline-none text-xs text-white placeholder-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Supabase Anon Public API Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:outline-none text-xs text-white placeholder-slate-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleClearCreds}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium underline"
                >
                  Reset Local
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 shadow-md shadow-emerald-600/30"
                  >
                    Save &amp; Connect
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
