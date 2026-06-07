import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { groupMatches } from "@/lib/predictions/group";
import type { MatchWithPrediction } from "@/lib/predictions/types";
import type { Match, Prediction } from "@/lib/database.types";
import MatchPredictionCard from "@/components/MatchPredictionCard";

export const metadata = {
  title: "Matches — Quinela",
};

// Always fetch fresh data (kickoff times & results change).
export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware protects this route, but guard defensively.
  if (!user) redirect("/login?redirectTo=/matches");

  // Fetch matches, the current user's predictions, and their admin flag in parallel.
  const [matchesRes, predictionsRes, profileRes] = await Promise.all([
    supabase
      .from("matches")
      .select("*")
      .order("kickoff_at", { ascending: true }),
    supabase.from("predictions").select("*").eq("user_id", user.id),
    supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
  ]);

  const isAdmin = profileRes.data?.is_admin === true;

  if (matchesRes.error) {
    return (
      <ErrorState message={`Couldn't load matches: ${matchesRes.error.message}`} />
    );
  }

  const matches = (matchesRes.data ?? []) as Match[];
  const predictions = (predictionsRes.data ?? []) as Prediction[];

  const predictionByMatch = new Map<string, Prediction>(
    predictions.map((p) => [p.match_id, p]),
  );

  const rows: MatchWithPrediction[] = matches.map((match) => ({
    match,
    prediction: predictionByMatch.get(match.id) ?? null,
  }));

  const groups = groupMatches(rows);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Matches</h1>
        <p className="mt-1 text-sm text-slate-500">
          Predict the exact scoreline. Predictions lock 1 hour before kickoff.
        </p>
      </header>

      {groups.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          No matches scheduled yet. Check back soon.
        </p>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
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
                    userId={user.id}
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

function ErrorState({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
    >
      {message}
    </div>
  );
}
