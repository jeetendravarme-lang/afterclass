-- ============================================================================
-- THE GOLDEN DAYS — Supabase schema
-- Run this in the Supabase Dashboard -> SQL Editor (paste + Run).
-- Safe to re-run: objects are created IF NOT EXISTS where possible.
-- ============================================================================

-- ---------- helpers ----------
create extension if not exists pgcrypto;

-- ---------- profiles ----------
-- One row per auth user. The FIRST account ever created becomes admin
-- (handled in lib/auth.tsx); the owner can also set it manually:
--   update public.profiles set is_admin = true where email = 'you@example.com';
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text not null,
  nickname text,
  instagram text,
  is_admin boolean not null default false,
  -- Set by the admin from /admin. Blocked users are signed out app-wide
  -- (lib/auth.tsx) and cannot insert messages/reactions (see policies below).
  is_blocked boolean not null default false,
  created_at timestamptz not null default now()
);
-- Safe re-run: add the column if this schema ran before the security update.
alter table public.profiles add column if not exists is_blocked boolean not null default false;
alter table public.profiles enable row level security;
drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles for select using (auth.role() = 'authenticated');
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);
drop policy if exists "profiles update by admin" on public.profiles;
create policy "profiles update by admin" on public.profiles for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

-- ---------- rooms (group chats + 1:1 DMs) ----------
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('group', 'dm')),
  members jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);
alter table public.rooms enable row level security;
drop policy if exists "rooms readable by auth" on public.rooms;
create policy "rooms readable by auth" on public.rooms for select using (auth.role() = 'authenticated');
drop policy if exists "rooms insert by auth" on public.rooms;
create policy "rooms insert by auth" on public.rooms for insert with check (auth.role() = 'authenticated');

-- ---------- messages ----------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room text not null default 'main',
  sender_id uuid references auth.users (id),
  sender_name text not null,
  body text not null default '',
  reply_to uuid references public.messages (id) on delete set null,
  media_url text,
  media_type text,
  pinned boolean not null default false,
  edited_at timestamptz,
  deleted boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
drop policy if exists "messages readable by auth" on public.messages;
create policy "messages readable by auth" on public.messages for select using (auth.role() = 'authenticated');
drop policy if exists "messages insert by auth" on public.messages;
create policy "messages insert by auth" on public.messages for insert with check (
  auth.role() = 'authenticated'
  and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_blocked)
);
drop policy if exists "messages update own or admin" on public.messages;
create policy "messages update own or admin" on public.messages for update using (
  auth.uid() = sender_id
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

-- ---------- reactions ----------
create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);
alter table public.reactions enable row level security;
drop policy if exists "reactions readable by auth" on public.reactions;
create policy "reactions readable by auth" on public.reactions for select using (auth.role() = 'authenticated');
drop policy if exists "reactions insert own" on public.reactions;
create policy "reactions insert own" on public.reactions for insert with check (
  auth.uid() = user_id
  and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_blocked)
);
drop policy if exists "reactions delete own" on public.reactions;
create policy "reactions delete own" on public.reactions for delete using (auth.uid() = user_id);

-- ---------- read_state (read receipts) ----------
create table if not exists public.read_state (
  room text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (room, user_id)
);
alter table public.read_state enable row level security;
drop policy if exists "read_state readable by auth" on public.read_state;
create policy "read_state readable by auth" on public.read_state for select using (auth.role() = 'authenticated');
drop policy if exists "read_state upsert own" on public.read_state;
create policy "read_state upsert own" on public.read_state for insert with check (auth.uid() = user_id);
drop policy if exists "read_state update own" on public.read_state;
create policy "read_state update own" on public.read_state for update using (auth.uid() = user_id);

-- ---------- connections (Who Knows Whom? — voluntary only) ----------
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  user_a text not null,
  user_b text not null,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (user_a, user_b),
  check (user_a < user_b)
);
alter table public.connections enable row level security;
drop policy if exists "connections readable" on public.connections;
create policy "connections readable" on public.connections for select using (auth.role() = 'authenticated');
drop policy if exists "connections insert by auth" on public.connections;
create policy "connections insert by auth" on public.connections for insert with check (auth.role() = 'authenticated');
drop policy if exists "connections delete by auth" on public.connections;
create policy "connections delete by auth" on public.connections for delete using (auth.role() = 'authenticated');

-- ---------- wishes ----------
create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  friend_name text not null,
  author text not null,
  message text not null,
  created_at timestamptz not null default now()
);
alter table public.wishes enable row level security;
drop policy if exists "wishes readable" on public.wishes;
create policy "wishes readable" on public.wishes for select using (auth.role() = 'authenticated');
drop policy if exists "wishes insert by auth" on public.wishes;
create policy "wishes insert by auth" on public.wishes for insert with check (auth.role() = 'authenticated');

-- ---------- birthdays (day + month only; NO dates are pre-filled) ----------
create table if not exists public.birthdays (
  id uuid primary key default gen_random_uuid(),
  friend_name text not null unique,
  month int not null check (month between 1 and 12),
  day int not null check (day between 1 and 31),
  updated_by uuid references auth.users (id),
  updated_at timestamptz not null default now()
);
alter table public.birthdays enable row level security;
drop policy if exists "birthdays readable" on public.birthdays;
create policy "birthdays readable" on public.birthdays for select using (auth.role() = 'authenticated');
drop policy if exists "birthdays upsert by auth" on public.birthdays;
create policy "birthdays upsert by auth" on public.birthdays for insert with check (auth.role() = 'authenticated');
drop policy if exists "birthdays update by auth" on public.birthdays;
create policy "birthdays update by auth" on public.birthdays for update using (auth.role() = 'authenticated');

-- ---------- places (Memory Map) ----------
create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lat double precision not null,
  lng double precision not null,
  photo_url text,
  added_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);
alter table public.places enable row level security;
drop policy if exists "places readable" on public.places;
create policy "places readable" on public.places for select using (auth.role() = 'authenticated');
drop policy if exists "places insert by auth" on public.places;
create policy "places insert by auth" on public.places for insert with check (auth.role() = 'authenticated');

-- ---------- achievements ----------
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  title text not null,
  detail text,
  created_at timestamptz not null default now()
);
alter table public.achievements enable row level security;
drop policy if exists "achievements readable" on public.achievements;
create policy "achievements readable" on public.achievements for select using (auth.role() = 'authenticated');
drop policy if exists "achievements insert own" on public.achievements;
create policy "achievements insert own" on public.achievements for insert with check (auth.uid() = user_id);

-- ---------- quizzes ----------
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);
create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  question text not null,
  options jsonb not null default '[]'::jsonb,
  answer int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
drop policy if exists "quizzes readable" on public.quizzes;
create policy "quizzes readable" on public.quizzes for select using (auth.role() = 'authenticated');
drop policy if exists "quizzes insert by auth" on public.quizzes;
create policy "quizzes insert by auth" on public.quizzes for insert with check (auth.role() = 'authenticated');
drop policy if exists "quiz_questions readable" on public.quiz_questions;
create policy "quiz_questions readable" on public.quiz_questions for select using (auth.role() = 'authenticated');
drop policy if exists "quiz_questions insert by auth" on public.quiz_questions;
create policy "quiz_questions insert by auth" on public.quiz_questions for insert with check (auth.role() = 'authenticated');

-- ---------- polls ----------
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);
create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls (id) on delete cascade,
  label text not null,
  votes int not null default 0
);
create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls (id) on delete cascade,
  option_id uuid not null references public.poll_options (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id, user_id)
);
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
drop policy if exists "polls readable" on public.polls;
create policy "polls readable" on public.polls for select using (auth.role() = 'authenticated');
drop policy if exists "polls insert by auth" on public.polls;
create policy "polls insert by auth" on public.polls for insert with check (auth.role() = 'authenticated');
drop policy if exists "poll_options readable" on public.poll_options;
create policy "poll_options readable" on public.poll_options for select using (auth.role() = 'authenticated');
drop policy if exists "poll_options insert by auth" on public.poll_options;
create policy "poll_options insert by auth" on public.poll_options for insert with check (auth.role() = 'authenticated');
drop policy if exists "poll_votes readable by auth" on public.poll_votes;
create policy "poll_votes readable by auth" on public.poll_votes for select using (auth.role() = 'authenticated');
drop policy if exists "poll_votes insert own" on public.poll_votes;
create policy "poll_votes insert own" on public.poll_votes for insert with check (auth.uid() = user_id);

-- Vote counter (called after inserting a poll_votes row).
create or replace function public.increment_poll_vote(opt_id uuid)
returns void
language sql
security definer
as $$
  update public.poll_options set votes = votes + 1 where id = opt_id;
$$;

-- ---------- challenges ----------
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  detail text,
  created_by uuid references auth.users (id),
  done_by uuid[] not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.challenges enable row level security;
drop policy if exists "challenges readable" on public.challenges;
create policy "challenges readable" on public.challenges for select using (auth.role() = 'authenticated');
drop policy if exists "challenges insert by auth" on public.challenges;
create policy "challenges insert by auth" on public.challenges for insert with check (auth.role() = 'authenticated');
drop policy if exists "challenges update by auth" on public.challenges;
create policy "challenges update by auth" on public.challenges for update using (auth.role() = 'authenticated');

-- ---------- time capsule (sealed until unlock_date) ----------
create table if not exists public.capsule_messages (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  body text not null,
  unlock_date date not null,
  created_at timestamptz not null default now()
);
alter table public.capsule_messages enable row level security;
drop policy if exists "capsule readable" on public.capsule_messages;
create policy "capsule readable" on public.capsule_messages for select using (auth.role() = 'authenticated');
drop policy if exists "capsule insert by auth" on public.capsule_messages;
create policy "capsule insert by auth" on public.capsule_messages for insert with check (auth.role() = 'authenticated');

-- Public view: body is NULL until the unlock date — the server never leaks it.
create or replace view public.capsule_messages_public as
select
  id,
  author,
  case when unlock_date <= current_date then body else null end as body,
  (unlock_date > current_date) as locked,
  unlock_date,
  created_at
from public.capsule_messages;

-- ---------- call history ----------
create table if not exists public.call_history (
  id uuid primary key default gen_random_uuid(),
  room text not null,
  caller text not null,
  participants jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds int
);
alter table public.call_history enable row level security;
drop policy if exists "call_history readable by auth" on public.call_history;
create policy "call_history readable by auth" on public.call_history for select using (auth.role() = 'authenticated');
drop policy if exists "call_history insert by auth" on public.call_history;
create policy "call_history insert by auth" on public.call_history for insert with check (auth.role() = 'authenticated');
drop policy if exists "call_history update own" on public.call_history;
create policy "call_history update own" on public.call_history for update using (auth.role() = 'authenticated');

-- ---------- realtime ----------
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.reactions;
alter publication supabase_realtime add table public.connections;
alter publication supabase_realtime add table public.read_state;

-- ---------- storage buckets (public read, auth-only upload) ----------
insert into storage.buckets (id, name, public)
values ('chat-media', 'chat-media', true), ('gallery', 'gallery', true)
on conflict (id) do nothing;

drop policy if exists "public read chat-media" on storage.objects;
create policy "public read chat-media" on storage.objects
  for select using (bucket_id = 'chat-media' and auth.role() = 'authenticated');
drop policy if exists "auth upload chat-media" on storage.objects;
create policy "auth upload chat-media" on storage.objects
  for insert with check (bucket_id = 'chat-media' and auth.role() = 'authenticated');

drop policy if exists "public read gallery" on storage.objects;
create policy "public read gallery" on storage.objects
  for select using (bucket_id = 'gallery' and auth.role() = 'authenticated');
drop policy if exists "auth upload gallery" on storage.objects;
create policy "auth upload gallery" on storage.objects
  for insert with check (bucket_id = 'gallery' and auth.role() = 'authenticated');
