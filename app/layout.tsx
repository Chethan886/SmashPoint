import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SmashPoint | Badminton Match & Tournament Tracker',
  description: 'Dynamic Badminton Match & Tournament Generator with fair rest rotations, partner diversity, live scoring, and leaderboards.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950 flex flex-col`}>
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          {children}
        </main>
        <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>
              🏸 <span className="font-semibold text-slate-400">SmashPoint</span> &bull; Fair Rotation &amp; Tournament Matchmaker
            </p>
            <p className="text-slate-500">
              Next.js 14 &bull; Tailwind CSS &bull; Supabase PostgreSQL Free Tier
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
