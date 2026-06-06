import { createClient } from "@/lib/supabase/server";
import type { LeaderboardRow } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Leaderboard — Quinela",
};

/** A leaderboard row with non-null numeric fields and a computed rank. */
interface RankedRow {
  rank: number;
  user_id: string;
  display_name: string;
  total_points: number;
  exact_count: number;
  winner_count: number;
  predictions_made: number;
}

/**
 * Ranks rows by total_points desc, then exact_count desc (tie-break).
 * Equal (points, exact) share the same rank (standard competition ranking).
 */
function rankRows(rows: LeaderboardRow[]): RankedRow[] {
  const normalized = rows
    .filter((r) => r.user_id != null)
    .map((r) => ({
      user_id: r.user_id as string,
      display_name: r.display_name ?? "Anonymous",
      total_points: r.total_points ?? 0,
      exact_count: r.exact_count ?? 0,
      winner_count: r.winner_count ?? 0,
      predictions_made: r.predictions_made ?? 0,
    }))
    .sort((a, b) => {
      if (b.total_points !== a.total_points)
        return b.total_points - a.total_points;
      if (b.exact_count !== a.exact_count) return b.exact_count - a.exact_count;
      return a.display_name.localeCompare(b.display_name);
    });

  const ranked: RankedRow[] = [];
  let lastRank = 0;
  let lastPoints: number | null = null;
  let lastExact: number | null = null;

  normalized.forEach((row, index) => {
    const tiedWithPrev =
      row.total_points === lastPoints && row.exact_count === lastExact;
    const rank = tiedWithPrev ? lastRank : index + 1;
    lastRank = rank;
    lastPoints = row.total_points;
    lastExact = row.exact_count;
    ranked.push({ rank, ...row });
  });

  return ranked;
}

function rankBadge(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "";
}

export default async function LeaderboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("leaderboard")
    .select(
      "user_id, display_name, total_points, exact_count, winner_count, predictions_made",
    );

  const rows = rankRows((data as LeaderboardRow[] | null) ?? []);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Leaderboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Exact score = 3 pts · correct outcome = 1 pt. Ties broken by exact-score
          count.
        </p>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Couldn&apos;t load the leaderboard. Please try again.
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
          No predictions scored yet. Once matches finish, points appear here.
        </div>
      ) : (
        <>
          {/* Mobile (< sm): stacked cards — no horizontal clipping, every stat
              is visible without scrolling. */}
          <ul className="space-y-2 sm:hidden">
            {rows.map((row) => {
              const isCurrentUser = user?.id === row.user_id;
              return (
                <li
                  key={row.user_id}
                  className={`rounded-lg border p-3 ${
                    isCurrentUser
                      ? "border-amber-200 bg-amber-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="shrink-0 tabular-nums text-slate-700">
                        {rankBadge(row.rank)}
                        {row.rank}
                      </span>
                      <span className="truncate font-medium text-slate-900">
                        {row.display_name}
                      </span>
                      {isCurrentUser && (
                        <span className="shrink-0 rounded bg-amber-200 px-1.5 py-0.5 text-xs font-semibold text-amber-800">
                          You
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-right">
                      <span className="text-lg font-bold tabular-nums text-slate-900">
                        {row.total_points}
                      </span>
                      <span className="ml-1 text-xs text-slate-500">pts</span>
                    </span>
                  </div>
                  <dl className="mt-2 grid grid-cols-3 gap-2 border-t border-slate-100 pt-2 text-center text-xs">
                    <div>
                      <dt className="text-slate-500">Exact</dt>
                      <dd className="font-semibold tabular-nums text-slate-700">
                        {row.exact_count}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Outcome</dt>
                      <dd className="font-semibold tabular-nums text-slate-700">
                        {row.winner_count}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Predictions</dt>
                      <dd className="font-semibold tabular-nums text-slate-700">
                        {row.predictions_made}
                      </dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>

          {/* sm and up: full table. */}
          <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white sm:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Player</th>
                  <th className="px-4 py-3 text-right font-semibold">Points</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    <span title="Exact-score predictions (3 pts each)">
                      Exact
                    </span>
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    <span title="Correct-outcome-only predictions (1 pt each)">
                      Outcome
                    </span>
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Predictions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isCurrentUser = user?.id === row.user_id;
                  return (
                    <tr
                      key={row.user_id}
                      className={`border-b border-slate-100 last:border-0 ${
                        isCurrentUser
                          ? "bg-amber-50 font-medium"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-700">
                        <span className="mr-1">{rankBadge(row.rank)}</span>
                        {row.rank}
                      </td>
                      <td className="px-4 py-3 text-slate-900">
                        {row.display_name}
                        {isCurrentUser && (
                          <span className="ml-2 rounded bg-amber-200 px-1.5 py-0.5 text-xs font-semibold text-amber-800">
                            You
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                        {row.total_points}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                        {row.exact_count}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                        {row.winner_count}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                        {row.predictions_made}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
