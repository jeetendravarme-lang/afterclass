'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';

export default function AuthPage() {
  const { configured, user, profile, signIn, signUp, signOut } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setMsg('');
    const res =
      mode === 'login'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, displayName.trim() || email.split('@')[0]);
    setBusy(false);
    if (res.error) {
      setMsg(res.error);
    } else {
      setMsg(
        mode === 'signup'
          ? 'Account ban gaya! Agar email confirmation on hai to apna inbox check karo, phir login karo.'
          : 'Welcome back! 🎉',
      );
      if (mode === 'login') router.push('/chat');
    }
  };

  if (!configured) {
    return (
      <div className="card mx-auto max-w-lg p-6 text-center">
        <h1 className="font-display text-4xl text-gold">Login / Sign up</h1>
        <p className="mt-3 text-zinc-300">
          Auth ke liye Supabase chahiye. <code>.env.local</code> mein{' '}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> aur <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{' '}
          daalo (README dekho), phir dobara deploy karo.
        </p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="card mx-auto max-w-lg p-6 text-center">
        <h1 className="font-display text-4xl text-gold">
          Hi, {profile?.display_name ?? user.email} 👋
        </h1>
        <p className="mt-2 text-zinc-300">
          Tum logged in ho{profile?.is_admin ? ' — tum Admin ho 👑 (pehla account)' : ''}.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <a href="/chat" className="btn-gold">
            Group Chat →
          </a>
          <button onClick={() => void signOut()} className="btn-ghost">
            Log out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card mx-auto max-w-lg p-6">
      <h1 className="text-center font-display text-4xl text-gold">
        {mode === 'login' ? 'Welcome Back 👋' : 'Join The Gang 🎉'}
      </h1>
      <p className="mt-1 text-center text-sm text-zinc-400">
        Sirf college friends — login karke group chat aur calls join karo.
        {mode === 'signup' ? ' Pehla account Admin banta hai.' : ''}
      </p>
      <div className="mt-5 space-y-3">
        {mode === 'signup' && (
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display name (e.g. Jeetendra)"
            className="input w-full"
          />
        )}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          autoComplete="email"
          className="input w-full"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 6 characters)"
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          className="input w-full"
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit();
          }}
        />
        <button onClick={() => void submit()} disabled={busy} className="btn-gold w-full disabled:opacity-50">
          {busy ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}
        </button>
        {msg && <p className="text-center text-sm text-zinc-300">{msg}</p>}
        <p className="text-center text-sm">
          {mode === 'login' ? (
            <>
              Naya account?{' '}
              <button onClick={() => setMode('signup')} className="font-semibold text-gold-light underline">
                Sign up karo
              </button>
            </>
          ) : (
            <>
              Account hai?{' '}
              <button onClick={() => setMode('login')} className="font-semibold text-gold-light underline">
                Login karo
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
