"use client";

import { useState } from "react";
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

  // Track the entered scores so the penalty-winner selector only appears on a
  // level score (a penalty result is still a draw — see CLAUDE.md). The server
  // independently ignores the tag unless the score is level.
  const [home, setHome] = useState<string>(
    match.home_score?.toString() ?? "",
  );
  const [away, setAway] = useState<string>(
    match.away_score?.toString() ?? "",
  );
  const isDraw = home !== "" && away !== "" && home === away;

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
        {isFinished && match.penalty_winner && (
          <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
            {(match.penalty_winner === "home"
              ? match.home_team
              : match.away_team) + " won on penalties"}
          </span>
        )}
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
            value={home}
            onChange={(e) => setHome(e.target.value)}
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
            value={away}
            onChange={(e) => setAway(e.target.value)}
            className="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </label>
        {/* Penalty winner only applies to a level score. The field is always
            present in the DOM (defaulting to "" = no shootout) but is disabled
            and visually hidden unless the entered scores are equal; the server
            ignores it for non-draws regardless. */}
        <label className={`text-xs ${isDraw ? "" : "hidden"}`}>
          <span className="mb-1 block font-medium text-slate-600">
            Won on penalties
          </span>
          <select
            name="penalty_winner"
            disabled={!isDraw}
            defaultValue={match.penalty_winner ?? ""}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value="">— no shootout (true draw)</option>
            <option value="home">{match.home_team}</option>
            <option value="away">{match.away_team}</option>
          </select>
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
