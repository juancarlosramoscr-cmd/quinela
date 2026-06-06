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

/** The instant predictions lock for this match: kickoff - 1h. */
export function lockAt(match: Pick<Match, "kickoff_at">): Date {
  return new Date(new Date(match.kickoff_at).getTime() - LOCK_LEAD_MS);
}

/**
 * Format a ms duration as a compact live countdown,
 * e.g. "1d 03:12:45", "3:12:45", or "12:45". Clamps negatives to "0:00".
 */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (days > 0) return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${minutes}:${pad(seconds)}`;
}
