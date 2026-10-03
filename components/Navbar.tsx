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
    { href: '/', label: 'Leaderboard', icon: Trophy },
    { href: '/matches', label: 'Match Generator', icon: Swords },
    { href: '/members', label: 'Roster & Members', icon: Users },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/85 border-b border-emerald-500/20 shadow-lg shadow-emerald-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 p-[2px] shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Flame className="w-5 h-5 text-emerald-400 group-hover:text-amber-400 transition-colors" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 text-lg tracking-tight leading-tight">
                  SmashPoint
                </span>
                <span className="text-[11px] font-medium text-slate-400 tracking-wider uppercase">
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

            {/* Status & Settings Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowModal(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                  supabaseConnected
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 shadow-sm shadow-emerald-500/20'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/50'
                }`}
                title="Click to view database settings"
              >
                <span className={`w-2 h-2 rounded-full ${supabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="hidden sm:inline">
                  {supabaseConnected ? 'Supabase Live' : 'Local Storage Mode'}
                </span>
                <Database className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden border-t border-slate-800/80 bg-slate-950/95 px-4 py-2 flex items-center justify-around">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
                  isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Database Connection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100">
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
                <p className="text-xs text-slate-400">Supabase 100% Free Tier PostgreSQL Integration</p>
              </div>
            </div>

            <div className="p-4 mb-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">Current Status:</span>
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
              <p className="text-slate-400 leading-relaxed">
                The application works seamlessly right now in offline/local storage mode. To sync with your free Supabase database across all devices, paste your Project URL and Anon Public Key below (or place them in <code className="text-emerald-300 font-mono">.env.local</code>).
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:outline-none text-sm text-white placeholder-slate-500 font-mono"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:outline-none text-sm text-white placeholder-slate-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleClearCreds}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium underline"
                >
                  Reset to Local Storage
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all shadow-md shadow-emerald-600/30"
                  >
                    Save & Connect
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
              <span className="text-xs text-slate-500">
                SQL schema is saved in <code className="text-slate-400">supabase/schema.sql</code>. Copy & paste it into Supabase SQL editor to create your tables in 10 seconds.
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
