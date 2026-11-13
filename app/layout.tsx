import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/auth';
import Navbar from '../components/Navbar';

export const metadata: Metadata = {
  title: 'THE GOLDEN DAYS — The Last Bench Legends',
  description:
    'College friends memories website: photos, videos, songs, group chat and video calls for The Last Bench Legends, Bundelkhand University, Jhansi.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink font-body text-zinc-100 antialiased">
        <AuthProvider>
          <Navbar />
          <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6">{children}</main>
          <footer className="border-t border-white/10 py-6 text-center text-xs text-zinc-500">
            THE GOLDEN DAYS • The Last Bench Legends • BCA Memories • Forever ❤️
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
