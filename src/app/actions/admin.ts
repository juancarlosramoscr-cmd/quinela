"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AdminActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Resolve a naive `datetime-local` string (e.g. "2026-07-10T18:00", no zone)
 * into an absolute instant using the admin browser's UTC offset in minutes
 * (Date.getTimezoneOffset semantics: positive when local is behind UTC).
 *
 * The wall-clock components are read directly from the string (not via
 * `new Date(naive)`, which would re-interpret them in the *server's* zone), then
 * shifted by the offset to get true UTC. If the offset is absent or malformed,
 * we fall back to server-local parsing so a JS-disabled or non-browser submit
 * still produces a value (matching the previous behaviour).
 */
function resolveKickoff(naive: string, offsetRaw: string): Date | null {
  const m = naive.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );
  const offset = Number(offsetRaw);
  if (!m || offsetRaw === "" || !Number.isFinite(offset)) {
    // No usable offset — fall back to interpreting in the server's zone.
    const fallback = new Date(naive);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  const [, y, mo, d, h, mi, s] = m;
  // Date.UTC treats the components as UTC; adding the offset (local-behind-UTC
  // is positive) converts the admin's wall clock to the correct instant.
  const utcMs =
    Date.UTC(+y, +mo - 1, +d, +h, +mi, s ? +s : 0) + offset * 60_000;
  const date = new Date(utcMs);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Create a new match (fixture). Admin-only.
 *
 * Authorization is enforced HERE by requireAdmin() (which reads
 * profiles.is_admin server-side); the actual write then goes through the
 * service-role client, mirroring the sync routes. We deliberately do NOT use
 * the authenticated SSR client for these writes: the matches RLS policy calls
 * a SQL function `is_admin()` that lacks EXECUTE for the `authenticated` role,
 * so policy-checked writes fail with 42501 "permission denied for function
 * is_admin". Using the service role (already gated by requireAdmin) is safe and
 * unblocks admin match management without a DB migration. See task #7.
 */
export async function createMatch(
  _prev: AdminActionResult | null,
  formData: FormData,
): Promise<AdminActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return {
      ok: false,
      error: guard.status === 401 ? "Not signed in." : "Admins only.",
    };
  }

  const homeTeam = String(formData.get("home_team") ?? "").trim();
  const awayTeam = String(formData.get("away_team") ?? "").trim();
  const kickoffLocal = String(formData.get("kickoff_at") ?? "").trim();
  const offsetRaw = String(formData.get("kickoff_offset_minutes") ?? "").trim();
  const stage = String(formData.get("stage") ?? "").trim();

  if (!homeTeam || !awayTeam) {
    return { ok: false, error: "Home and away teams are required." };
  }
  if (!kickoffLocal) {
    return { ok: false, error: "Kickoff time is required." };
  }

  // datetime-local has no timezone. The client stamps the admin's browser UTC
  // offset (Date.getTimezoneOffset semantics: minutes, positive when local is
  // behind UTC) for the entered datetime, so we resolve the instant against the
  // admin's clock instead of the server's. Fall back to server-local parsing
  // only if the offset is missing (e.g. JS disabled / non-browser submit).
  const kickoffDate = resolveKickoff(kickoffLocal, offsetRaw);
  if (!kickoffDate || Number.isNaN(kickoffDate.getTime())) {
    return { ok: false, error: "Invalid kickoff time." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("matches").insert({
    home_team: homeTeam,
    away_team: awayTeam,
    kickoff_at: kickoffDate.toISOString(),
    stage: stage || null,
    status: "scheduled",
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/matches");
  return { ok: true };
}

/**
 * Rename the home/away teams of a match. Admin-only.
 *
 * Useful for fixing typos or replacing placeholder names (e.g. "Winner Group A")
 * once a fixture is confirmed. Editing only the team names does not touch scores
 * or status, so existing predictions stay valid. Refuses finished matches to
 * keep the historical record intact.
 *
 * Same authorization model as createMatch: requireAdmin() gates the call, then
 * the write uses the service-role client (avoids the matches RLS is_admin()
 * EXECUTE-grant gap).
 */
export async function updateMatchTeams(
  _prev: AdminActionResult | null,
  formData: FormData,
): Promise<AdminActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return {
      ok: false,
      error: guard.status === 401 ? "Not signed in." : "Admins only.",
    };
  }

  const matchId = String(formData.get("match_id") ?? "").trim();
  const homeTeam = String(formData.get("home_team") ?? "").trim();
  const awayTeam = String(formData.get("away_team") ?? "").trim();

  if (!matchId) return { ok: false, error: "Missing match id." };
  if (!homeTeam || !awayTeam) {
    return { ok: false, error: "Home and away teams are required." };
  }

  const supabase = createAdminClient();

  // Guard against editing a finished match (its result is part of the record).
  const { data: match, error: fetchError } = await supabase
    .from("matches")
    .select("status")
    .eq("id", matchId)
    .single();

  if (fetchError) return { ok: false, error: fetchError.message };
  if (!match) return { ok: false, error: "Match not found." };
  if (match.status === "finished") {
    return { ok: false, error: "Can't rename teams on a finished match." };
  }

  const { error } = await supabase
    .from("matches")
    .update({ home_team: homeTeam, away_team: awayTeam })
    .eq("id", matchId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/matches");
  return { ok: true };
}

/**
 * Finalize a match result. Sets home/away score and status='finished', which
 * fires the DB `score_match_predictions` trigger to award points.
 *
 * Same authorization model as createMatch: requireAdmin() gates the call, then
 * the write uses the service-role client (avoids the matches RLS is_admin()
 * EXECUTE-grant gap). The scoring trigger runs regardless of which role writes.
 */
export async function finalizeMatch(
  _prev: AdminActionResult | null,
  formData: FormData,
): Promise<AdminActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return {
      ok: false,
      error: guard.status === 401 ? "Not signed in." : "Admins only.",
    };
  }

  const matchId = String(formData.get("match_id") ?? "").trim();
  const homeRaw = String(formData.get("home_score") ?? "").trim();
  const awayRaw = String(formData.get("away_score") ?? "").trim();
  const penaltyRaw = String(formData.get("penalty_winner") ?? "").trim();

  if (!matchId) return { ok: false, error: "Missing match id." };

  const homeScore = Number(homeRaw);
  const awayScore = Number(awayRaw);
  if (
    homeRaw === "" ||
    awayRaw === "" ||
    !Number.isInteger(homeScore) ||
    !Number.isInteger(awayScore) ||
    homeScore < 0 ||
    awayScore < 0
  ) {
    return { ok: false, error: "Scores must be non-negative whole numbers." };
  }

  // A penalty winner only makes sense on a level full-time score (the regulation
  // result is still a draw for scoring). Persist the tag only then; otherwise
  // force null so correcting a result away from a draw can't leave a stale tag.
  // The DB CHECK constraint also guards the allowed values.
  const isDraw = homeScore === awayScore;
  const penaltyWinner =
    isDraw && (penaltyRaw === "home" || penaltyRaw === "away")
      ? penaltyRaw
      : null;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("matches")
    .update({
      home_score: homeScore,
      away_score: awayScore,
      status: "finished",
      penalty_winner: penaltyWinner,
    })
    .eq("id", matchId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/matches");
  revalidatePath("/leaderboard");
  return { ok: true };
}
