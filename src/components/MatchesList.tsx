"use client";

import { useEffect, useState } from "react";

import MatchPredictionCard from "@/components/MatchPredictionCard";
import type { MatchGroup } from "@/lib/predictions/group";

const HIDE_FINISHED_KEY = "quinela:hide-finished-matches";

interface MatchesListProps {
  groups: MatchGroup[];
  userId: string;
  isAdmin: boolean;
}

/**
 * Client wrapper that renders the date-grouped match cards and a persistent
 * "hide finished matches" toggle. The preference is stored per-browser in
 * localStorage — it's a pure view preference, so it never touches the DB.
 *
 * The toggle initializes to `false` on the server to avoid a hydration
 * mismatch, then syncs from localStorage in an effect after mount.
 */
export default function MatchesList({
  groups,
  userId,
  isAdmin,
}: MatchesListProps) {
  const [hideFinished, setHideFinished] = useState(false);

  // Sync from localStorage after mount (server render can't read it).
  useEffect(() => {
    try {
      setHideFinished(localStorage.getItem(HIDE_FINISHED_KEY) === "true");
    } catch {
      // localStorage unavailable (private mode / disabled) — keep default.
    }
  }, []);

  function toggleHideFinished(next: boolean) {
    setHideFinished(next);
    try {
      localStorage.setItem(HIDE_FINISHED_KEY, String(next));
    } catch {
      // Best-effort persistence; the in-memory toggle still works.
    }
  }

  // Drop finished matches (and any date group left empty) when hiding.
  const visibleGroups = hideFinished
    ? groups
        .map((group) => ({
          ...group,
          items: group.items.filter(
            ({ match }) => match.status !== "finished",
          ),
        }))
        .filter((group) => group.items.length > 0)
    : groups;

  const hasFinished = groups.some((group) =>
    group.items.some(({ match }) => match.status === "finished"),
  );

  return (
    <div>
      {hasFinished && (
        <label className="mb-6 inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={hideFinished}
            onChange={(e) => toggleHideFinished(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
          />
          Hide finished matches
        </label>
      )}

      {visibleGroups.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          {hideFinished
            ? "All matches are finished. Uncheck “Hide finished matches” to see them."
            : "No matches scheduled yet. Check back soon."}
        </p>
      ) : (
        <div className="space-y-8">
          {visibleGroups.map((group) => (
            <section key={group.key}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                {group.label}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map(({ match, prediction }) => (
                  <MatchPredictionCard
                    key={match.id}
                    match={match}
                    prediction={prediction}
                    userId={userId}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
