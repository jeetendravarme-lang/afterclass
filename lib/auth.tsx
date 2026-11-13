'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from './supabase';

export type Profile = {
  id: string;
  email: string | null;
  display_name: string;
  nickname: string | null;
  instagram: string | null;
  is_admin: boolean;
  is_blocked: boolean;
};

type AuthState = {
  configured: boolean;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  // True when the signed-in account was blocked by the admin.
  blocked: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    inviteCode: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  configured: false,
  user: null,
  profile: null,
  loading: true,
  blocked: false,
  signIn: async () => ({ error: 'Supabase is not configured yet.' }),
  signUp: async () => ({ error: 'Supabase is not configured yet.' }),
  signOut: async () => {},
});

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);

  const loadProfile = useCallback(async (u: User) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, email, display_name, nickname, instagram, is_admin, is_blocked')
      .eq('id', u.id)
      .maybeSingle();
    const row = data as Profile | null;
    if (row) {
      if (row.is_blocked) {
        // Blocked by the admin — sign out immediately, app-wide.
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setBlocked(true);
        return;
      }
      setBlocked(false);
      setProfile(row);
    } else {
      // First login before the profile row exists — create it. The first
      // account ever created becomes admin (see supabase/schema.sql).
      const { data: count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });
      const isFirst = (count ?? 0) === 0;
      const displayName =
        (u.user_metadata?.display_name as string) ||
        (u.email ? u.email.split('@')[0] : 'Friend');
      const { data: created } = await supabase
        .from('profiles')
        .insert({
          id: u.id,
          email: u.email ?? null,
          display_name: displayName,
          is_admin: isFirst,
        })
        .select('id, email, display_name, nickname, instagram, is_admin, is_blocked')
        .single();
      if (created) setProfile(created as Profile);
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) void loadProfile(u);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) void loadProfile(u);
      else setProfile(null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'Supabase is not configured yet.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }, []);

  // Signup goes through /api/signup only: the invite code is verified
  // server-side against the INVITE_CODE env var. There is no direct
  // supabase.auth.signUp call from the browser anywhere in the app.
  const signUp = useCallback(
    async (email: string, password: string, displayName: string, inviteCode: string) => {
      if (!isSupabaseConfigured) return { error: 'Supabase is not configured yet.' };
      try {
        const res = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, displayName, inviteCode }),
        });
        const out = (await res.json()) as { ok?: boolean; error?: string };
        if (!out.ok) return { error: out.error ?? 'Signup failed.' };
        return { error: null };
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'Signup failed.' };
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setBlocked(false);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      configured: isSupabaseConfigured,
      user,
      profile,
      loading,
      blocked,
      signIn,
      signUp,
      signOut,
    }),
    [user, profile, loading, blocked, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
