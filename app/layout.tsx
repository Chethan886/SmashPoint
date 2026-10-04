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
    <html lang="en" className="dark overscroll-none">
      <body className={`${inter.className} min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950 flex flex-col overscroll-none`}>
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 pb-20 md:pb-6">
          {children}
        </main>
      </body>
    </html>
  );
}
