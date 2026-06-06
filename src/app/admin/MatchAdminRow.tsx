"use client";

import { useFormState, useFormStatus } from "react-dom";

import { finalizeMatch, type AdminActionResult } from "@/app/actions/admin";
import type { Match } from "@/lib/database.types";

function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function SaveButton({ finished }: { finished: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending
        ? "Saving…"
        : finished
          ? "Update result"
          : "Finalize result"}
    </button>
  );
}

export default function MatchAdminRow({ match }: { match: Match }) {
  const [state, formAction] = useFormState<AdminActionResult | null, FormData>(
    finalizeMatch,
    null,
  );
  const isFinished = match.status === "finished";

  return (
    <li className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-medium text-slate-900">
            {match.home_team} <span className="text-slate-400">vs</span>{" "}
            {match.away_team}
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            {match.stage ? `${match.stage} · ` : ""}
            {formatKickoff(match.kickoff_at)}
            {match.external_id && (
              <span className="ml-2 text-slate-400">
                #{match.external_id}
              </span>
            )}
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isFinished
              ? "bg-green-100 text-green-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {isFinished
            ? `Finished ${match.home_score}–${match.away_score}`
            : "Scheduled"}
        </span>
      </div>

      <form
        action={formAction}
        className="mt-3 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-3"
      >
        <input type="hidden" name="match_id" value={match.id} />
        <label className="text-xs">
          <span className="mb-1 block font-medium text-slate-600">
            {match.home_team} score
          </span>
          <input
            name="home_score"
            type="number"
            min={0}
            required
            defaultValue={match.home_score ?? ""}
            className="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </label>
        <label className="text-xs">
          <span className="mb-1 block font-medium text-slate-600">
            {match.away_team} score
          </span>
          <input
            name="away_score"
            type="number"
            min={0}
            required
            defaultValue={match.away_score ?? ""}
            className="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </label>
        <SaveButton finished={isFinished} />
        {state?.ok && (
          <span className="text-sm text-green-600">Saved — points awarded.</span>
        )}
        {state && !state.ok && state.error && (
          <span className="text-sm text-red-600">{state.error}</span>
        )}
      </form>
    </li>
  );
}
