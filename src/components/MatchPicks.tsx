"use client";

import { useCallback, useState } from "react";

import { createClient } from "@/lib/supabase/client";

interface PickRow {
  user_id: string;
  home_score: number;
  away_score: number;
  points: number | null;
  display_name: string;
}

/** Shape returned by the embedded PostgREST select. */
interface RawPickRow {
  user_id: string;
  home_score: number;
  away_score: number;
  points: number | null;
  profiles: { display_name: string | null } | null;
}

/**
 * Collapsible "see all picks" for a match. Only rendered by the card once the
 * match is LOCKED — and the DB's RLS independently only returns other users'
 * predictions for locked matches, so this is copy-proof even if the gate here
 * were bypassed. Predictions are fetched lazily on first expand.
 */
export default function MatchPicks({
  matchId,
  currentUserId,
  finished,
  adminPreview = false,
}: {
  matchId: string;
  currentUserId: string;
  /** When true, the match is over → show the points each pick earned. */
  finished: boolean;
  /** True when an admin is viewing picks on a still-open match (oversight). */
  adminPreview?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<PickRow[] | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  const load = useCallback(async () => {
    setState("loading");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("predictions")
      .select("user_id, home_score, away_score, points, profiles(display_name)")
      .eq("match_id", matchId);

    if (error) {
      setState("error");
      return;
    }

    const mapped: PickRow[] = ((data ?? []) as unknown as RawPickRow[]).map(
      (r) => ({
        user_id: r.user_id,
        home_score: r.home_score,
        away_score: r.away_score,
        points: r.points,
        display_name: r.profiles?.display_name ?? "Anonymous",
      }),
    );
    // Sort: highest points first (once scored), then by name.
    mapped.sort((a, b) => {
      const pa = a.points ?? -1;
      const pb = b.points ?? -1;
      if (pb !== pa) return pb - pa;
      return a.display_name.localeCompare(b.display_name);
    });
    setRows(mapped);
    setState("idle");
  }, [matchId]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && rows === null && state !== "loading") void load();
  }

  function pointsBadge(points: number | null) {
    if (!finished || points === null) return null;
    const styles =
      points === 3
        ? "bg-green-100 text-green-700"
        : points === 1
          ? "bg-amber-100 text-amber-700"
          : "bg-slate-100 text-slate-500";
    const label = points === 3 ? "Exact +3" : points === 1 ? "Outcome +1" : "0";
    return (
      <span
        className={`ml-2 inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles}`}
      >
        {label}
      </span>
    );
  }

  return (
    <div className="mt-3 border-t border-slate-100 pt-2">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-xs font-medium text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1"
      >
        <span>
          {open ? "Hide all picks" : "See all picks"}
          {adminPreview && (
            <span className="ml-1 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              Admin
            </span>
          )}
        </span>
        <span aria-hidden className="text-slate-400">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="mt-2">
          {state === "loading" && (
            <p className="text-xs text-slate-400">Loading picks…</p>
          )}
          {state === "error" && (
            <p className="text-xs text-red-600" role="alert">
              Couldn&apos;t load picks. Try again.
            </p>
          )}
          {state === "idle" && rows && rows.length === 0 && (
            <p className="text-xs text-slate-400">No predictions for this match.</p>
          )}
          {state === "idle" && rows && rows.length > 0 && (
            <ul className="space-y-1">
              {rows.map((r) => (
                <li
                  key={r.user_id}
                  className={`flex items-center justify-between rounded px-2 py-1 text-xs ${
                    r.user_id === currentUserId
                      ? "bg-amber-50 font-semibold text-slate-900"
                      : "text-slate-700"
                  }`}
                >
                  <span className="truncate">
                    {r.display_name}
                    {r.user_id === currentUserId && (
                      <span className="ml-1 text-amber-600">(you)</span>
                    )}
                  </span>
                  <span className="flex items-center">
                    <span className="font-mono tabular-nums text-slate-900">
                      {r.home_score}–{r.away_score}
                    </span>
                    {pointsBadge(r.points)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
