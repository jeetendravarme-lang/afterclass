import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// The client is null until Supabase env vars are set. Every feature that
// needs the backend checks this and shows a clear setup hint instead of
// crashing — the photo/video/song pages work without Supabase.
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true },
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return client;
}

// Tables used by the app (see supabase/schema.sql).
export const TABLES = {
  profiles: 'profiles',
  messages: 'messages',
  reactions: 'reactions',
  connections: 'connections',
  wishes: 'wishes',
  birthdays: 'birthdays',
  places: 'places',
  achievements: 'achievements',
  quizzes: 'quizzes',
  quizQuestions: 'quiz_questions',
  polls: 'polls',
  pollOptions: 'poll_options',
  pollVotes: 'poll_votes',
  challenges: 'challenges',
  capsuleMessages: 'capsule_messages',
  callHistory: 'call_history',
} as const;
