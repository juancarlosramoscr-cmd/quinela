# QA-Functional Test Plan — Quinela

Owner: qa-functional. Branch: build/quinela-app. Drive real browser via `browse` (Browserbase) against http://localhost:3000.
**Run full pass only when team-lead signals build is feature-complete.** Capture console on EVERY page.

## Live test data (verified via REST 2026-06-06 ~17:45 UTC)

| Match | id | State | Use for |
|---|---|---|---|
| Brazil vs USA | 636b5991-15c0-4b39-b43c-834c99cb4c1a | **OPEN** (3d out) | stable submit/edit/persist; admin-finish live scoring |
| England vs Netherlands | b61200f3-a888-42c3-9175-c37a685b40e4 | OPEN→locks 17:52 UTC | open test (may lock during run) |
| Italy vs Croatia | 75a86938-7750-4c3e-9d3e-e4015ec5e3b0 | **LOCKED** (<1h, kickoff ~17:52) | lock UX + server reject |
| Japan 2–1 Korea | bd89d91f-a15f-4798-8722-1f716799753a | **FINISHED** | scoring (exact=3 / winner=1 / wrong=0) |
| Uruguay 0–0 Colombia | 43d8ad2a-9d7b-4dd2-b8ab-9395259fd371 | **FINISHED** | scoring (draw) |

> Italy/Eng-NL kickoffs are dynamic relative to "now". Re-verify lock state at run time with the REST snippet below.
> No profiles/predictions seeded yet — leaderboard empty until QA creates users + predictions.

## Test matrix

### A. Auth (eng-foundation)
- A1 Unauth user hitting `/`, `/predictions`, `/my-predictions`, `/leaderboard`, `/admin` → redirected to `/login`.
- A2 Magic-link: enter email → "check your email" confirmation; `/auth/callback` exchanges code → session.
- A3 Authenticated nav shell shows user; sign-out clears session → back to `/login`.
- A4 Session persists across reload (cookie via @supabase/ssr middleware).

### B. Predictions (eng-predictions)
- B1 OPEN match (Brazil vs USA): submit score → persists on reload.
- B2 Edit while open: change score → persists. No duplicate row (UNIQUE user_id,match_id).
- B3 LOCKED match (Italy vs Croatia <1h): inputs disabled, save blocked, countdown/locked indicator shown.
- B4 FINISHED match: locked, no edit.
- B5 **Server lock-bypass**: with a real user JWT, direct REST update of a prediction after deadline → rejected by trigger (expect 4xx / error). Client lock is UX only.
- B6 Anti-copy: other users' predictions hidden until match locks.

### C. Scoring (eng-leaderboard / triggers)
- C1 Predict exact on a finished match → 3 pts. Winner-only → 1 pt. Wrong → 0 pts. Draw correct → 1 pt; exact draw → 3 pts.
- C2 Live: predict on Brazil vs USA (OPEN) → admin enters result/finishes → points appear on my-predictions + leaderboard without manual recompute.
- C3 points NULL until match finished.

### D. Leaderboard (eng-leaderboard)
- D1 total_points, exact_count, winner_count, predictions_made correct per user.
- D2 Ranking order correct; current user highlighted.

### E. Admin (eng-leaderboard)
- E1 Non-admin blocked from `/admin` + sync API routes (403/redirect, server-enforced not just hidden).
- E2 Admin can create a match (fixture).
- E3 Admin enters result + marks finished → scores predictions (ties to C2).
- E4 Football sync route: admin-only; does not call API per page load.

### F. Console (all pages)
- No uncaught errors, no React key warnings, no hydration warnings, no 4xx/5xx in normal flows. All = defects.

## Login for QA — Admin generate_link (REAL auth flow, no app bypass)
Test user `than.cr07@gmail.com` ALREADY EXISTS + profile auto-created + **is_admin=true** (lead set it).
Use it directly for admin tests. Links/OTPs expire → generate FRESH at run time.
```bash
SVC=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.local | cut -d= -f2-)
URL=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | cut -d= -f2-)
curl -s -X POST "$URL/auth/v1/admin/generate_link" \
  -H "apikey: $SVC" -H "Authorization: Bearer $SVC" -H "Content-Type: application/json" \
  -d '{"type":"magiclink","email":"than.cr07@gmail.com","redirect_to":"http://localhost:3000/auth/callback"}'
```
Two login paths from the response:
1. Navigate browser to `action_link` → lands on /auth/callback → session established. (redirect_to in body forces localhost callback.)
2. OR app /login: enter email → call verifyOtp with `email_otp` (token, type 'email'/'magiclink').

For admin-GUARD test (non-admin blocked): generate_link a 2nd email e.g. `qa-nonadmin@example.com`,
log in as them, confirm /admin redirects + sync API returns 403.
NOTE: handle_new_user trigger PROVEN (profile auto-created on signup).

## Useful REST snippets (service role — QA verification only, bypasses RLS)
```bash
SRK=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.local | cut -d= -f2)
URL=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | cut -d= -f2)
# current matches + lock states
curl -s "$URL/rest/v1/matches?select=*&order=kickoff_at" -H "apikey: $SRK" -H "Authorization: Bearer $SRK"
# predictions w/ points
curl -s "$URL/rest/v1/predictions?select=*" -H "apikey: $SRK" -H "Authorization: Bearer $SRK"
# leaderboard view
curl -s "$URL/rest/v1/leaderboard?select=*" -H "apikey: $SRK" -H "Authorization: Bearer $SRK"
# make admin by email
curl -s -X PATCH "$URL/rest/v1/profiles?id=eq.<USER_ID>" -H "apikey: $SRK" -H "Authorization: Bearer $SRK" \
  -H "Content-Type: application/json" -d '{"is_admin":true}'
```

## Defect protocol
SendMessage to owning engineer (eng-foundation=auth/shell, eng-predictions=predictions/lock,
eng-leaderboard=leaderboard/admin/sync) + TaskCreate per defect. Re-test after fix.
Coordinate with qa-ui to avoid duplicate reports (UI/UX = qa-ui; functional/data/console = me).
