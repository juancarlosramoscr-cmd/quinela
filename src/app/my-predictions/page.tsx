import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import type { Match, Prediction } from "@/lib/database.types";

export const metadata = {
  title: "My Predictions — Quinela",
};

export const dynamic = "force-dynamic";

/** predictions joined with their match (Supabase nested select). */
type Row = Prediction & { matches: Match | null };

export default async function MyPredictionsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/my-predictions");

  const { data, error } = await supabase
    .from("predictions")
    .select("*, matches(*)")
    .eq("user_id", user.id);

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
      >
        Couldn&apos;t load your predictions: {error.message}
      </div>
    );
  }

  const rows = ((data ?? []) as Row[])
    .filter((r) => r.matches !== null)
    // Most recent kickoff first.
    .sort(
      (a, b) =>
        new Date(b.matches!.kickoff_at).getTime() -
        new Date(a.matches!.kickoff_at).getTime(),
    );

  const totalPoints = rows.reduce((sum, r) => sum + (r.points ?? 0), 0);

  return (
    <div>
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Predictions</h1>
          <p className="mt-1 text-sm text-slate-500">
            Exact score = 3 pts · Correct result = 1 pt · Wrong = 0.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Total points
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalPoints}</div>
        </div>
      </header>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          You haven&apos;t made any predictions yet.{" "}
          <Link
            href="/matches"
            className="font-medium text-slate-900 underline underline-offset-2 hover:text-slate-700"
          >
            Pick some matches →
          </Link>
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">Match</th>
                <th className="px-4 py-3 font-semibold">Kickoff</th>
                <th className="px-4 py-3 text-center font-semibold">
                  Your pick
                </th>
                <th className="px-4 py-3 text-center font-semibold">
                  Final
                </th>
                <th className="px-4 py-3 text-center font-semibold">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const m = r.matches!;
                const finished = m.status === "finished";
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {m.home_team}{" "}
                      <span className="text-slate-400">vs</span>{" "}
                      {m.away_team}
                      {m.stage && (
                        <span className="ml-2 text-xs text-slate-400">
                          {m.stage}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {format(new Date(m.kickoff_at), "d MMM, HH:mm")}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-900">
                      {r.home_score} – {r.away_score}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700">
                      {finished && m.home_score !== null && m.away_score !== null
                        ? `${m.home_score} – ${m.away_score}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <PointsBadge points={r.points} finished={finished} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PointsBadge({
  points,
  finished,
}: {
  points: number | null;
  finished: boolean;
}) {
  // Not yet scored.
  if (!finished || points === null) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
        Pending
      </span>
    );
  }

  const styles =
    points === 3
      ? "bg-green-100 text-green-700"
      : points === 1
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";

  const label =
    points === 3 ? "3 · Exact" : points === 1 ? "1 · Result" : "0";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles}`}
    >
      {label}
    </span>
  );
}
