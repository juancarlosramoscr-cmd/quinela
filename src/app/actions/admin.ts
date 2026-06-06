"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/server";

export interface AdminActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Create a new match (fixture). Admin-only.
 * Writes go through the admin's RLS session — the DB restricts inserts to
 * is_admin profiles, and we also guard here for a clear error message.
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
  const stage = String(formData.get("stage") ?? "").trim();

  if (!homeTeam || !awayTeam) {
    return { ok: false, error: "Home and away teams are required." };
  }
  if (!kickoffLocal) {
    return { ok: false, error: "Kickoff time is required." };
  }

  // datetime-local has no timezone; interpret in the server's locale and store ISO.
  const kickoffDate = new Date(kickoffLocal);
  if (Number.isNaN(kickoffDate.getTime())) {
    return { ok: false, error: "Invalid kickoff time." };
  }

  const supabase = createClient();
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
 * Finalize a match result. Sets home/away score and status='finished', which
 * fires the DB `score_match_predictions` trigger to award points.
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

  const supabase = createClient();
  const { error } = await supabase
    .from("matches")
    .update({
      home_score: homeScore,
      away_score: awayScore,
      status: "finished",
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
