import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Match } from "@/lib/database.types";

import CreateMatchForm from "./CreateMatchForm";
import MatchAdminRow from "./MatchAdminRow";
import SyncControls from "./SyncControls";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Quinela",
};

export default async function AdminPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Server-side guard: redirect non-authenticated and non-admins.
  if (!user) redirect("/login?redirectTo=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/");

  const { data: matchesData } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff_at", { ascending: true });

  const matches = (matchesData as Match[] | null) ?? [];
  const upcoming = matches.filter((m) => m.status !== "finished");
  const finished = matches.filter((m) => m.status === "finished");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Admin</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage fixtures and results. Finalizing a match awards points
          automatically.
        </p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">
          Football API sync
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Pull World Cup fixtures and results from API-Football.{" "}
          <strong className="text-slate-700">
            Free plan: 100 requests/day
          </strong>{" "}
          — each button uses one request, so use sparingly.
        </p>
        <SyncControls />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Create match
        </h2>
        <CreateMatchForm />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Upcoming &amp; live ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
            No upcoming matches.
          </p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((match) => (
              <MatchAdminRow key={match.id} match={match} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Finished ({finished.length})
        </h2>
        {finished.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
            No finished matches yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {finished.map((match) => (
              <MatchAdminRow key={match.id} match={match} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
