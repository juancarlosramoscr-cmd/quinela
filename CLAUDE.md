# Quinela — World Cup Score Prediction App

A web app where users register with email + password, predict exact scorelines for
World Cup matches, and earn points. Built with **Next.js 14 (App Router) + Supabase**.

## Domain rules (the heart of the app — already enforced in the DB)

- A prediction may be created/edited **only when `now < kickoff_at - 1 hour`** AND the
  match is not `finished`. Otherwise it is **locked**.
- Scoring when a match finishes:
  - Exact score → **3 points**
  - Correct winner/draw outcome only → **1 point**
  - Wrong → **0 points**
- These rules are enforced by Postgres triggers (lock + scoring) and RLS — they are
  **proven by tests**. The client mirrors the lock for UX but the server is the source
  of truth. **Do not duplicate scoring logic on the client as the authority.**

## Backend (Supabase project `quinela`, ref `esatdtijjmcaaousjime`)

Schema is ALREADY APPLIED and tested. Do not recreate it. Tables:

- `profiles(id uuid PK = auth.users.id, display_name, is_admin bool, created_at)`
  - auto-created on signup by trigger `handle_new_user`
- `matches(id, external_id unique, home_team, away_team, kickoff_at timestamptz, stage,
  home_score, away_score, status ['scheduled'|'finished'], created_at)`
- `predictions(id, user_id→profiles, match_id→matches, home_score, away_score,
  points [null until scored], created_at, updated_at, UNIQUE(user_id, match_id))`
- view `leaderboard(user_id, display_name, total_points, exact_count, winner_count,
  predictions_made)`

RLS summary:
- Authenticated users read all profiles & matches.
- Users insert/update **only their own** predictions; cannot delete; cannot edit after lock.
- Other users' predictions are hidden until that match locks (anti-copy).
- Only `is_admin` users insert/update/delete matches (set fixtures & results).

Triggers:
- `enforce_prediction_lock` (before insert/update on predictions) — enforces the 1h /
  finished lock. **Skips rows where predicted scores are unchanged** so the scoring
  trigger can write `points` without self-blocking.
- `score_match_predictions` (after update on matches when finished) — computes points.

## Environment (`.env.local`, gitignored)

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `FOOTBALL_API_KEY` (API-Football, **Free plan: 100 req/day** — never call per page load),
  `FOOTBALL_API_HOST=v3.football.api-sports.io` (header `x-apisports-key`)

See `.env.example` for the template.

## Auth

Supabase email + password. Server actions in `src/app/actions/auth.ts`:
`signIn` (`signInWithPassword`), `signUp` (`auth.signUp`, profile auto-created by the
`handle_new_user` trigger), and `signOut`. The `/login` page has a sign in / sign up
toggle. Use `@supabase/ssr` for cookie-based sessions + middleware session refresh.

Email confirmation is **disabled** in the Supabase project, so signup yields an
immediate session. (If it were enabled, `signUp` returns no session and the UI shows a
"confirm your email" message — but that path needs working SMTP.) There is no
`/auth/callback` route — password auth doesn't use email links.

## Making a test admin

```sql
update profiles set is_admin = true
where id = (select id from auth.users where email = 'YOUR_EMAIL');
```

## Run

```bash
npm install
npm run dev   # http://localhost:3000
```

## Seeded test data (for QA)

Mock fixtures exist in `matches`, including:
- `England vs Netherlands` kickoff ~90min out → **open** for prediction
- `Italy vs Croatia` kickoff ~30min out → **locked** (<1h)
- `Japan 2–1 Korea`, `Uruguay 0–0 Colombia` → **finished** (for scoring checks)

## Definition of done

Both QA roles confirm: every feature works, zero defects, zero console errors/warnings
(incl. hydration & React key warnings). QA-UI's P1 recommendations addressed.
