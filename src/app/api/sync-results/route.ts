import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { fetchFinishedFixtures, mapStatus } from "@/lib/football-api";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/sync-results  (admin-only)
 *
 * Fetches FINISHED World Cup fixtures from API-Football and writes their final
 * scores to matching `matches` rows (by external_id), setting status='finished'.
 * Setting status to 'finished' fires the DB `score_match_predictions` trigger,
 * which awards points — so the leaderboard updates automatically.
 *
 * Idempotent: we skip rows already 'finished' with the same score, so we never
 * needlessly re-trigger scoring. Only rows that already exist (synced fixtures)
 * are updated; unknown external_ids are reported as skipped, never inserted, so
 * a partial API response cannot create half-formed matches.
 *
 * ⚠️ Uses 1 API request. Free plan: 100/day. Admin-triggered only.
 *
 * Body (optional JSON): { "season": 2022 } — defaults to current year.
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Not signed in." : "Admins only." },
      { status: guard.status },
    );
  }

  let season = new Date().getFullYear();
  try {
    const body = await request.json();
    if (body && typeof body.season === "number") season = body.season;
  } catch {
    // No / invalid body — use the default season.
  }

  let finished;
  try {
    finished = await fetchFinishedFixtures(season);
  } catch (err) {
    return NextResponse.json(
      {
        error: "Football API request failed.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }

  if (finished.length === 0) {
    return NextResponse.json({
      ok: true,
      season,
      fetched: 0,
      updated: 0,
      skipped: 0,
      message: "No finished fixtures returned. Nothing changed.",
    });
  }

  const supabase = createAdminClient();

  // Load existing matches for the external_ids we care about so we only update
  // known rows and can skip ones already finalized with identical scores.
  const externalIds = finished.map((f) => f.externalId);
  const { data: existing, error: loadError } = await supabase
    .from("matches")
    .select("id, external_id, home_score, away_score, status")
    .in("external_id", externalIds);

  if (loadError) {
    return NextResponse.json(
      { error: "Failed to load matches.", detail: loadError.message },
      { status: 500 },
    );
  }

  const byExternalId = new Map(
    (existing ?? [])
      .filter((m) => m.external_id != null)
      .map((m) => [m.external_id as string, m]),
  );

  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const fixture of finished) {
    // Defensive: ensure scores are present and it really maps to 'finished'.
    if (
      fixture.homeScore == null ||
      fixture.awayScore == null ||
      mapStatus(fixture.statusShort) !== "finished"
    ) {
      skipped += 1;
      continue;
    }

    const match = byExternalId.get(fixture.externalId);
    if (!match) {
      // Unknown fixture — never insert from results sync (avoids partial rows).
      skipped += 1;
      continue;
    }

    const alreadyFinal =
      match.status === "finished" &&
      match.home_score === fixture.homeScore &&
      match.away_score === fixture.awayScore;
    if (alreadyFinal) {
      skipped += 1;
      continue;
    }

    const { error: updateError } = await supabase
      .from("matches")
      .update({
        home_score: fixture.homeScore,
        away_score: fixture.awayScore,
        status: "finished",
      })
      .eq("id", match.id);

    if (updateError) {
      errors.push(`${fixture.externalId}: ${updateError.message}`);
    } else {
      updated += 1;
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    season,
    fetched: finished.length,
    updated,
    skipped,
    ...(errors.length > 0 ? { errors } : {}),
  });
}
