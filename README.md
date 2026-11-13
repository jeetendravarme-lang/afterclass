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
| Auth | Email + password (Supabase Auth). First account created = Admin. Signup needs a private invite code (`INVITE_CODE` env var, checked server-side) — no open registration |
| Admin | `/admin` — Admin can block/unblock or permanently remove any member, and delete any message from Group Chat |
| Security | Private content (chat, uploads, wishes, birthdays, polls, capsule, profiles) is visible only to logged-in members (RLS + login gates). Blocked users are signed out app-wide and cannot post. No secrets in code — everything comes from env vars |

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
6. **Turn OFF open registration** (defense in depth): **Authentication →
   Configuration → “Allow new users to sign up” → OFF.** With it off, the
   only way to create an account is the invite-code signup API
   (`POST /api/signup`), which checks `INVITE_CODE` server-side.
7. Paste the three values into `.env.local`.

> First account = Admin: the first person who signs up becomes the admin
> (can delete any message, block/unblock and remove members from `/admin`).
> The owner can also set it manually in SQL:
> `update public.profiles set is_admin = true where email = 'you@example.com';`

## 2b. Invite code (required for signup)

- Pick a strong random code and set it as the **`INVITE_CODE`** env var
  (Vercel → Environment Variables, and `.env.local` for local runs).
  Example: `openssl rand -hex 8`.
- **Share the code privately with the 5 friends only** — anyone with the
  code can create an account. The code is checked server-side in
  `app/api/signup` (timing-safe compare) and never appears in frontend
  code or in this repo.
- To rotate the code, change the env var and redeploy — old codes stop
  working immediately, existing accounts are not affected.

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
4. In **Environment Variables**, add all seven values from `.env.local`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `LIVEKIT_URL`, `LIVEKIT_API_KEY`,
   `LIVEKIT_API_SECRET`, `INVITE_CODE`.
5. **Deploy**. Vercel gives you a public URL like
   `https://afterclass-app.vercel.app` — share that link with friends.
6. Every future `git push` redeploys automatically.

## 5. How friends join

1. Open the Vercel link on the phone → **Login / Sign up** → create an
   account with email + password + the **invite code** (ask Jeetendra for it).
   Without the code, no account can be created.
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
| `INVITE_CODE` | Chosen by the owner (strong random value) | Signup invite code — server-only, NEVER expose or commit a real value |

## Security model

- **Invite-only signup.** `POST /api/signup` verifies the invite code
  server-side (timing-safe compare against `INVITE_CODE`) and creates the
  user with the service-role key. There is no direct `supabase.auth.signUp`
  call from the browser anywhere in the app. Turn OFF “Allow new users to
  sign up” in the Supabase dashboard as well (step 2.6).
- **Login-only private content.** Chat, call, gallery, videos, map,
  birthdays, universe and admin pages render a login prompt for logged-out
  visitors (`components/RequireAuth.tsx`); the navbar hides private links
  until login. The home page stays public.
- **Row-level security.** Every private table (messages, rooms, reactions,
  profiles, connections, wishes, birthdays, places, achievements, quizzes,
  polls, challenges, capsule, call history, poll votes) is readable only by
  authenticated users. Storage buckets are auth-only for reads and uploads.
- **Admin powers.** First account = admin. From `/admin` the admin can
  block/unblock any member (blocked users are signed out app-wide and
  cannot post) or permanently remove an account (server route
  `POST /api/admin/remove-user`, service-role key, caller verified as admin
  from their session token). In Group Chat the admin can delete any message
  (RLS: update own or admin).
- **Call tokens.** `POST /api/livekit-token` requires a valid Supabase
  session (Authorization header) and only mints a token for the caller’s
  own user id; blocked users get 403. LiveKit keys never leave the server.
- **Secrets.** All keys/codes come from env vars only. Nothing secret is
  hardcoded anywhere in the repo — check with `grep -ri "sk-\|secret" --include="*.ts" --include="*.tsx" app components lib` before deploying.
- **Known residual:** files in the public Storage buckets are reachable by
  direct URL if someone already knows the exact URL (unpredictable UUID
  paths). All discovery paths (chat, gallery lists, DB reads) are
  login-gated, so an outsider cannot find those URLs through the app. For
  full signed-URL protection, make the buckets private and serve media via
  `createSignedUrl` — a future hardening step, not needed for launch.

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
  app/                  # Next.js App Router pages + server API routes
    page.tsx            # Home (public)
    gallery/ videos/ auth/ chat/ call/ map/ birthdays/ universe/ admin/
    api/livekit-token/  # server-side LiveKit JWT minting (auth-checked)
    api/signup/         # invite-code signup (server-side only)
    api/admin/remove-user/  # admin-only account removal
  components/           # FriendCard, Gallery, VideoPlayer, SongPlayer,
                        # ChatBox, CallRoom, FriendshipMap, MemoryMap,
                        # BirthdaySection, Navbar, InstagramIcon, RequireAuth
  lib/                  # data (friends/photos/videos/songs), supabase client,
                        # supabase-server (service-role, server-only),
                        # livekit config, auth provider, confetti helper
  public/photos/        # bundled real photos (12 + poster)
  public/videos/        # bundled real videos (5)
  supabase/schema.sql   # full database schema + RLS + realtime
  .env.local.example    # env var template (no real secrets)
```
