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
};

type AuthState = {
  configured: boolean;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  configured: false,
  user: null,
  profile: null,
  loading: true,
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

  const loadProfile = useCallback(async (u: User) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, email, display_name, nickname, instagram, is_admin')
      .eq('id', u.id)
      .maybeSingle();
    if (data) setProfile(data as Profile);
    else {
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
        .select('id, email, display_name, nickname, instagram, is_admin')
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

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const supabase = getSupabase();
      if (!supabase) return { error: 'Supabase is not configured yet.' };
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      return { error: error ? error.message : null };
    },
    [],
  );

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      configured: isSupabaseConfigured,
      user,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
    }),
    [user, profile, loading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
