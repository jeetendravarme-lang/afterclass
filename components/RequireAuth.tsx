'use client';

import type { ReactNode } from 'react';
import { useAuth } from '../lib/auth';

// Gate for private pages: chat, call, gallery, videos, map, birthdays,
// universe, admin. Logged-out visitors only ever see the public home page;
// every private page renders this login prompt instead of its content.
export default function RequireAuth({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  const { user, loading, configured } = useAuth();

  if (loading) {
    return (
      <div className="card p-6 text-center">
        <p className="text-zinc-300">Loading…</p>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="card mx-auto max-w-lg p-6 text-center">
        <h1 className="font-display text-4xl text-gold">{title ?? 'Members Only 🔒'}</h1>
        <p className="mt-2 text-zinc-300">
          Ye feature abhi setup nahi hua hai — Supabase env vars chahiye (README
          dekho).
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="card mx-auto max-w-lg p-6 text-center">
        <h1 className="font-display text-4xl text-gold">{title ?? 'Members Only 🔒'}</h1>
        <p className="mt-2 text-zinc-300">
          Ye page sirf logged-in college members ke liye hai. Login karo, ya
          invite code se sign up karo.
        </p>
        <a href="/auth" className="btn-gold mt-4 inline-block">
          Login / Sign up
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
