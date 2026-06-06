/**
 * Prediction lock rules — client-side MIRROR of the DB triggers for UX only.
 * The Postgres trigger `enforce_prediction_lock` is the source of truth.
 *
 * Rule: a prediction is editable only when
 *   now < kickoff_at - 1 hour  AND  match.status !== 'finished'.
 */

export const LOCK_LEAD_MS = 60 * 60 * 1000; // 1 hour

export interface MatchLockInput {
  kickoff_at: string; // ISO timestamptz
  status: "scheduled" | "finished";
}

/** The instant at which predictions lock: kickoff - 1h. */
export function lockAt(kickoffAt: string): Date {
  return new Date(new Date(kickoffAt).getTime() - LOCK_LEAD_MS);
}

/**
 * Whether the match is locked at the given moment (default: now).
 * Locked when finished, or when we're within 1h of kickoff (or past it).
 */
export function isLocked(match: MatchLockInput, now: Date = new Date()): boolean {
  if (match.status === "finished") return true;
  return now.getTime() >= lockAt(match.kickoff_at).getTime();
}

/** Milliseconds remaining until lock. Clamped to >= 0. 0 means already locked. */
export function msUntilLock(kickoffAt: string, now: Date = new Date()): number {
  return Math.max(0, lockAt(kickoffAt).getTime() - now.getTime());
}

/** Format a ms duration as a compact live countdown, e.g. "1d 03:12:45" or "12:45". */
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
