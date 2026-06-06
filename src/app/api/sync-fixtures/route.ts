import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-guard";
import { fetchWorldCupFixtures } from "@/lib/football-api";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/sync-fixtures  (admin-only)
 *
 * Fetches World Cup fixtures from API-Football and UPSERTS them into `matches`
 * keyed by `external_id`. We only set scheduling fields here (never overwrite a
 * finished result or scores) so re-running is safe and the seeded mock matches
 * — which have no external_id — are never touched.
 *
 * ⚠️ Uses 1 API request. Free plan: 100/day. Admin-triggered only.
 *
 * Body (optional JSON): { "season": 2022 }  — defaults to current year.
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

  let fixtures;
  try {
    fixtures = await fetchWorldCupFixtures(season);
  } catch (err) {
    return NextResponse.json(
      {
        error: "Football API request failed.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }

  if (fixtures.length === 0) {
    return NextResponse.json({
      ok: true,
      season,
      fetched: 0,
      upserted: 0,
      message:
        "No fixtures returned by the API for this season. Nothing changed (mock matches preserved).",
    });
  }

  const rows = fixtures.map((f) => ({
    external_id: f.externalId,
    home_team: f.homeTeam,
    away_team: f.awayTeam,
    kickoff_at: f.kickoffAt,
    stage: f.stage,
    // status intentionally omitted on insert-default; do NOT overwrite results here.
  }));

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("matches")
    .upsert(rows, { onConflict: "external_id", ignoreDuplicates: false })
    .select("id");

  if (error) {
    return NextResponse.json(
      { error: "Database upsert failed.", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    season,
    fetched: fixtures.length,
    upserted: data?.length ?? 0,
  });
}
