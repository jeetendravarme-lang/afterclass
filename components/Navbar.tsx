'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth';
import { GROUP_NAME } from '../lib/data';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/videos', label: 'Videos' },
  { href: '/chat', label: 'Group Chat' },
  { href: '/call', label: 'Video Call' },
  { href: '/map', label: 'Who Knows Whom?' },
  { href: '/birthdays', label: 'Birthdays' },
  { href: '/universe', label: 'AFTERCLASS' },
];

const ADMIN_LINK = { href: '/admin', label: 'Admin 👑' };

export default function Navbar() {
  const pathname = usePathname();
  const { user, profile, signOut, configured } = useAuth();

  // Logged-out visitors only see Home — every private page is behind login.
  const visibleLinks = user
    ? [...LINKS, ...(profile?.is_admin ? [ADMIN_LINK] : [])]
    : [LINKS[0]];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="mr-2 flex flex-col leading-none">
          <span className="font-display text-2xl tracking-widest text-gold">
            THE GOLDEN DAYS
          </span>
          <span className="text-[11px] uppercase tracking-[0.25em] text-zinc-400">
            {GROUP_NAME}
          </span>
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-1 overflow-x-auto">
          {visibleLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition ${
                pathname === l.href
                  ? 'bg-gold text-black font-semibold'
                  : 'text-zinc-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {configured && user ? (
            <>
              <span className="hidden text-sm text-zinc-300 sm:inline">
                {profile?.display_name ?? user.email}
                {profile?.is_admin ? ' 👑' : ''}
              </span>
              <button onClick={() => void signOut()} className="btn-ghost">
                Log out
              </button>
            </>
          ) : (
            <Link href="/auth" className="btn-gold">
              Login / Sign up
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
