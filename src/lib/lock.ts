import type { Match } from "@/lib/database.types";

/** Predictions lock 1 hour before kickoff. */
export const LOCK_LEAD_MS = 60 * 60 * 1000;

/**
 * Client-side mirror of the DB lock rule: a prediction may be created/edited
 * only when `now < kickoff_at - 1h` AND the match is not finished.
 *
 * The server (Postgres trigger + RLS) is the source of truth; this is for UX.
 */
export function isMatchLocked(
  match: Pick<Match, "kickoff_at" | "status">,
  now: number = Date.now(),
): boolean {
  if (match.status === "finished") return true;
  const lockAt = new Date(match.kickoff_at).getTime() - LOCK_LEAD_MS;
  return now >= lockAt;
}

/** Milliseconds until the prediction lock (negative once locked). */
export function msUntilLock(
  match: Pick<Match, "kickoff_at">,
  now: number = Date.now(),
): number {
  return new Date(match.kickoff_at).getTime() - LOCK_LEAD_MS - now;
}
