# Quinela — World Cup Score Prediction App

Predict exact scorelines for World Cup matches and earn points. Built with
**Next.js 14 (App Router) + Supabase** (email + password auth, Postgres RLS + triggers).

Scoring: exact score = **3 pts**, correct outcome only = **1 pt**, wrong = **0**.
Predictions lock **1 hour before kickoff** (enforced by DB triggers — the server is
the source of truth; the client only mirrors the lock for UX).

A draw counts as an "outcome" like any win. So if a match finishes **1–1**:
predicting **1–1** scores **3** (exact); predicting any other draw (e.g. **0–0**,
**2–2**) scores **1** (right that it's a draw, wrong score); predicting a win for
either side scores **0**. (Implemented with `sign(home − away)`: −1 / 0 / +1.)

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values (already provided for this project)
npm run dev                  # http://localhost:3000
```

Required env vars (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only — admin sync routes)
- `FOOTBALL_API_KEY`, `FOOTBALL_API_HOST=v3.football.api-sports.io`
  (API-Football Free plan = 100 req/day — only called from admin sync routes, never on page load)

## Verify the build

```bash
npx tsc --noEmit   # type-check
npm run build      # production build
```

## Deploy to production (Vercel)

Standard Next.js app — Vercel auto-detects the framework, so no build config is
needed. Two things matter: the environment variables and Supabase's URL config.

1. **Import the repo.** Go to <https://vercel.com/new>, sign in with GitHub, find the
   `quinela` repo, and click **Import**. Keep the auto-detected Next.js settings
   (Build Command `next build`). Don't deploy yet — add env vars first.

2. **Add Environment Variables** (apply to Production, Preview, and Development):

   | Name | Notes |
   | ---- | ----- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | **secret** — server-only (admin sync routes). Never prefix with `NEXT_PUBLIC_`. |
   | `FOOTBALL_API_KEY` | API-Football key |
   | `FOOTBALL_API_HOST` | `v3.football.api-sports.io` |

   Use the same values as your local `.env.local`.

3. **Deploy.** Click **Deploy**. Vercel runs `next build` and gives you a URL like
   `https://quinela-xxxx.vercel.app` (~1–2 min).

4. **Point Supabase Auth at the deployed URL** (required, or login won't work). In the
   Supabase dashboard → **Authentication → URL Configuration**:
   - **Site URL** → your Vercel URL (e.g. `https://quinela-xxxx.vercel.app`)
   - **Redirect URLs** → add `https://quinela-xxxx.vercel.app/**`

5. **Email confirmation.** For self-signup to log users in immediately, keep
   **Authentication → Sign In / Providers → Email → "Confirm email"** turned **off**.
   (If you turn it on, configure custom SMTP — Supabase's built-in email is rate-limited
   and won't deliver reliably in production.)

6. **Verify.** Open the URL → create an account or sign in → you should land on
   `/matches` with the World Cup fixtures. Check `/leaderboard` and (as an admin)
   `/admin`.

Notes:
- The seed script (`scripts/seed-worldcup-2026.mjs`) is **not** part of deployment — run
  it locally against the database. Vercel only builds and serves the app.
- Every push to `main` triggers a production deploy; pull requests get preview URLs.
- The Football API is only called from admin sync routes (never on page load), so
  production traffic stays well within the free tier's daily limit.

## How to log in

Auth is **email + password** (Supabase `signInWithPassword` / `signUp`). The `/login`
page has a sign in / sign up toggle. Email confirmation is **disabled** in the Supabase
project, so a new signup logs in immediately (no confirmation email needed).

- **New account:** open `/login`, choose "Create one", enter an email + password (min 6
  chars). You're signed in and redirected to `/matches`. The `handle_new_user` trigger
  creates your profile automatically.
- **Existing admin test user:** **than.cr07@gmail.com** / **quinela123** (already an admin).

### Making a user admin

```sql
update profiles set is_admin = true
where id = (select id from auth.users where email = 'YOUR_EMAIL');
```

Admins see the **Admin** nav link and can create fixtures / enter results and run the
Football API syncs.

## Routes

| Route             | Purpose                                                        |
| ----------------- | -------------------------------------------------------------- |
| `/`               | Landing page                                                   |
| `/login`          | Email + password sign in / sign up                             |
| `/matches`        | Upcoming/locked/finished matches; enter predictions            |
| `/my-predictions` | Your predictions and points                                    |
| `/leaderboard`    | Ranked standings                                               |
| `/profile`        | Edit display name (shown on leaderboard)                       |
| `/admin`          | Admin-only: manage fixtures, enter results, trigger API syncs  |

Protected routes (`/matches`, `/leaderboard`, `/my-predictions`, `/admin`, `/profile`)
redirect to `/login` when there's no session (enforced in middleware).

## Architecture notes

- Supabase clients: `@/lib/supabase/client` (browser), `@/lib/supabase/server` (server,
  cookie-based), `@/lib/supabase/middleware` + `src/middleware.ts` (session refresh +
  route protection), `@/lib/supabase/admin` (service-role, server-only).
- DB types: `@/lib/database.types` (`Database`, plus `Profile` / `Match` / `Prediction`
  / `LeaderboardRow`).
- Lock helpers (UX mirror of the DB rule): `@/lib/lock`.
- **Do not** duplicate scoring logic on the client as the authority — Postgres triggers
  compute points.
