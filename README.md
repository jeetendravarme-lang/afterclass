# THE GOLDEN DAYS — The Last Bench Legends

A production-ready, deployable college friends website for Jeetendra and his
4 BCA friends (Aman “Genz”, Balveer “Ballu”, Arjun “Thakur Sahab”, Yash
“Editor”) — Bundelkhand University, Jhansi.

Built with **Next.js 15 (App Router) + React 19 + Tailwind CSS**, **Supabase**
(Auth, Postgres, Realtime, Storage) and **LiveKit** (video/voice calling).
Deploy it on **Vercel** and share one public link — friends open it on their
phones from anywhere, sign up, and chat / video-call together.

> Privacy rule (hard): the site NEVER shows NIMCET, CGPA or any future
> goal/career plan. No content is invented — achievements, quizzes, polls,
> challenges, birthday dates, trip locations and stats all start empty and
> are added by users on the site.

---

## Features

| Area | What works |
| --- | --- |
| Home | Hero, dedication, Meet The Gang (with Instagram logo + ID), Chhichhore poster, When We Were Together, gallery/video previews, Dosti playlist |
| Gallery | 12 bundled real photos + uploads (Supabase Storage), album filter, lightbox |
| Videos | 5 bundled videos with real-frame thumbnails + cinematic lightbox player |
| Songs | “Fikar Not” then “Yeh Dosti Hum Nahi Todenge” (YouTube embeds, tap to play) |
| Group Chat | Real-time (Supabase Realtime): messaging, photo sharing, reply, edit, delete, emoji reactions, typing indicator, read receipts, pinned messages, search, media gallery, unread badge, online presence, multiple group chats + 1:1 DMs |
| Video Call | 1:1 + group video calls, meeting rooms, camera on/off, mic mute/unmute, screen sharing, accept/join, call timer, participant list, in-call chat, call history, live-rooms list, group-chat call announcements |
| Who Knows Whom? | Friendship map — ONLY voluntarily added connections (nothing inferred) |
| Memory Map | Bundelkhand University pin only; users add more pins + photos (OpenStreetMap, no key needed) |
| Birthdays | Countdown, confetti + animated greeting on the day, friends’ wishes, birthday photo collection (dates start empty) |
| Friendship Meter | Counts only from real database rows; “—” where there is no data |
| AFTERCLASS Universe | MY WORLD (profiles, albums, achievements) · OUR WORLD (photos, memories, friendship tree) · PLAYGROUND (Memory Match game, user-made quizzes, voting polls, challenges) · TIME CAPSULE (throwbacks + sealed future messages — server never leaks the text before the unlock date) |
| Auth | Email + password (Supabase Auth). First account created = Admin (can delete any message) |

---

## 1. Run locally

```bash
cd afterclass-app
cp .env.local.example .env.local   # fill in the keys (steps 2 and 3)
npm install
npm run dev                        # http://localhost:3000
npm run build                      # production build check
```

## 2. Supabase setup (free) — required for auth, chat and all saved data

1. Go to **https://supabase.com/dashboard** → **New project** (free tier).
   Pick a name (e.g. `afterclass`), a database password, and the closest region.
2. Wait for the project to finish provisioning (1–2 min).
3. Open the **SQL Editor** → **New query** → paste the whole file
   `supabase/schema.sql` from this repo → **Run**. This creates all tables,
   row-level-security policies, the Realtime publication, the sealed capsule
   view, the poll-vote function and the two public Storage buckets
   (`chat-media`, `gallery`).
4. Go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (server-side only —
     never put it in a `NEXT_PUBLIC_` variable or in frontend code)
5. **Authentication → Providers → Email**: make sure Email is enabled.
   (Optional: turn OFF “Confirm email” while testing so friends can log in
   immediately; turn it back on for production.)
6. Paste the three values into `.env.local`.

> First account = Admin: the first person who signs up becomes the admin
> (can delete any message). The owner can also set it manually in SQL:
> `update public.profiles set is_admin = true where email = 'you@example.com';`

## 3. LiveKit setup (free) — required for video / voice calling

1. Go to **https://cloud.livekit.io** → sign up (free tier) → **New project**.
2. In the project, open **Settings → Keys** and copy:
   - **LiveKit URL** (looks like `wss://your-project-xxxx.livekit.cloud`)
     → `LIVEKIT_URL`
   - **API key** → `LIVEKIT_API_KEY`
   - **API secret** → `LIVEKIT_API_SECRET`
3. Paste them into `.env.local` (and into Vercel env vars in step 4).
4. How it works: the browser never sees the key/secret. When a user joins a
   call, the app calls `POST /api/livekit-token`, which mints a short-lived
   (2-hour) JWT on the server and returns only that token + the LiveKit URL.

Without LiveKit keys, the Video Call page shows a clean **“Setup Needed”**
state and everything else in the app keeps working normally.

## 4. Deploy on Vercel (public link friends can open)

1. Push this folder to a GitHub repo (it is already a complete Next.js app).
2. Go to **https://vercel.com/new** → **Import** the repo.
3. Framework preset: **Next.js** (auto-detected). Root directory: the repo
   root (or `afterclass-app` if the repo contains more than this app).
4. In **Environment Variables**, add all six values from `.env.local`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `LIVEKIT_URL`, `LIVEKIT_API_KEY`,
   `LIVEKIT_API_SECRET`.
5. **Deploy**. Vercel gives you a public URL like
   `https://afterclass-app.vercel.app` — share that link with friends.
6. Every future `git push` redeploys automatically.

## 5. How friends join

1. Open the Vercel link on the phone → **Login / Sign up** → create an
   account with email + password.
2. **Group Chat** → main group “last-bench-legends” is open to all signed-in
   members. Create more groups or start a 1:1 DM from the same page.
3. **Video Call** → join the main room, or type a room name and share it —
   anyone typing the same room name joins the same call.
4. **Birthdays / Map / Universe** — add dates, places, connections, quizzes
   and polls from inside the app. Nothing is pre-filled.

## Media notes

- **Bundled photos (12):** the 5 portraits + 7 group photos verified from the
  user’s files, in `public/photos/`. The original site had more photos; only
  these 12 could be verified, so only these are bundled. Friends can upload
  the rest from the Gallery page (saved to Supabase Storage).
- **Bundled videos (5):** `public/videos/` — gang dance (0:20), birthday cake
  (0:19), gang clip (0:05), classroom candid (0:04), auditorium dance (0:17).
  Total ≈ 49 MB. For a lean production deploy, upload the videos to the
  Supabase `gallery` bucket instead and update `lib/data.ts` `VIDEOS` to
  point at the Storage URLs.
- **Songs** are YouTube embeds (no files needed).

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | Public anon key (safe in browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | Server-only admin key — NEVER expose |
| `LIVEKIT_URL` | LiveKit Cloud → Settings → Keys | `wss://…livekit.cloud` |
| `LIVEKIT_API_KEY` | LiveKit Cloud → Settings → Keys | Server-only |
| `LIVEKIT_API_SECRET` | LiveKit Cloud → Settings → Keys | Server-only — NEVER expose |

## Troubleshooting

- **Chat / login says “Supabase is not configured”** — `.env.local` is
  missing or the Vercel env vars are not set. Redeploy after adding them.
- **“Setup Needed” on Video Call** — LiveKit keys are missing. Follow step 3.
- **Realtime messages don’t arrive** — make sure `supabase/schema.sql`
  ran fully (it adds the tables to the Realtime publication).
- **Camera/mic blocked** — the browser asks for permission on join. If it
  was denied, allow it from the address-bar lock icon and rejoin, or join
  with “without camera/mic”.
- **Email confirmation loop** — turn off “Confirm email” in Supabase Auth
  settings while testing.

## Project structure

```
afterclass-app/
  app/                  # Next.js App Router pages + LiveKit token API route
    page.tsx            # Home
    gallery/ videos/ auth/ chat/ call/ map/ birthdays/ universe/
    api/livekit-token/  # server-side LiveKit JWT minting
  components/           # FriendCard, Gallery, VideoPlayer, SongPlayer,
                        # ChatBox, CallRoom, FriendshipMap, MemoryMap,
                        # BirthdaySection, Navbar, InstagramIcon
  lib/                  # data (friends/photos/videos/songs), supabase client,
                        # livekit config, auth provider, confetti helper
  public/photos/        # bundled real photos (12 + poster)
  public/videos/        # bundled real videos (5)
  supabase/schema.sql   # full database schema + RLS + realtime
  .env.local.example    # env var template (no real secrets)
```
