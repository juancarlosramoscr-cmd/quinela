# Quinela — World Cup Score Prediction App

Predict exact scorelines for World Cup matches and earn points. Built with
**Next.js 14 (App Router) + Supabase** (magic-link auth, Postgres RLS + triggers).

Scoring: exact score = **3 pts**, correct winner/draw only = **1 pt**, wrong = **0**.
Predictions lock **1 hour before kickoff** (enforced by DB triggers — the server is
the source of truth; the client only mirrors the lock for UX).

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

## How to log in (QA)

Auth is passwordless **magic link** (Supabase `signInWithOtp`). The callback at
`/auth/callback` handles **both** the PKCE `?code=` flow (normal emailed links) and the
`?token_hash=&type=` flow (Admin-API generated links), and honors `next` / `redirect_to`.

Because SMTP isn't configured, QA logs in **without email** via the Supabase Admin API
`generate_link`, which returns an `action_link` (and `email_otp`) without sending mail:

1. Generate a magic link for the test user (server-side, using the service-role key):

   ```bash
   curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/admin/generate_link" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d '{"type":"magiclink","email":"than.cr07@gmail.com",
          "options":{"redirect_to":"http://localhost:3000/auth/callback?next=/matches"}}'
   ```

2. Open the returned `action_link` in the browser. Supabase verifies the token and
   redirects to `/auth/callback`, which establishes the cookie session and lands you on
   `/matches`.

The test user **than.cr07@gmail.com** already exists and is an admin.

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
| `/login`          | Magic-link sign-in                                             |
| `/auth/callback`  | Exchanges the link for a session                               |
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
