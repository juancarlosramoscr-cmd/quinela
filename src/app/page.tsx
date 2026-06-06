import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-2xl py-10 text-center">
      <div className="mb-4 text-5xl" aria-hidden>
        ⚽
      </div>
      <h1 className="mb-3 text-3xl font-bold text-slate-900 sm:text-4xl">
        Quinela — World Cup
      </h1>
      <p className="mb-8 text-balance text-lg text-slate-600">
        Predict the exact scoreline of every World Cup match. Exact score earns 3
        points, getting the winner right earns 1. Lock in your picks before
        kickoff and climb the leaderboard.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {user ? (
          <>
            <Link
              href="/matches"
              className="rounded-md bg-slate-900 px-5 py-2.5 font-medium text-white transition-colors hover:bg-slate-700"
            >
              View matches
            </Link>
            <Link
              href="/leaderboard"
              className="rounded-md border border-slate-300 px-5 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              Leaderboard
            </Link>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-md bg-slate-900 px-5 py-2.5 font-medium text-white transition-colors hover:bg-slate-700"
          >
            Sign in to play
          </Link>
        )}
      </div>

      <div className="mt-12 grid gap-4 text-left sm:grid-cols-3">
        {[
          { t: "Exact score", d: "3 points", e: "🎯" },
          { t: "Right outcome", d: "1 point", e: "✅" },
          { t: "Wrong", d: "0 points", e: "❌" },
        ].map((c) => (
          <div
            key={c.t}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="text-2xl" aria-hidden>
              {c.e}
            </div>
            <div className="mt-1 font-semibold text-slate-900">{c.t}</div>
            <div className="text-sm text-slate-500">{c.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
