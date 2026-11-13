import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

// Server-only helpers. This file uses the service-role key, so it must ONLY
// be imported from server code (API routes). Never import it from a client
// component — the key would end up in the browser bundle.

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Identify the caller of an API route from its Authorization header.
// Returns the Supabase user, or null when there is no valid session.
export async function getAuthedUser(req: Request): Promise<User | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!url || !anonKey || !token) return null;
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

// Is this user blocked? (Admins set profiles.is_blocked from /admin.)
export async function isUserBlocked(userId: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (!admin) return false;
  const { data } = await admin
    .from('profiles')
    .select('is_blocked')
    .eq('id', userId)
    .maybeSingle();
  return (data as { is_blocked?: boolean } | null)?.is_blocked === true;
}
