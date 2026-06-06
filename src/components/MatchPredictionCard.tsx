"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

import { createClient } from "@/lib/supabase/client";
import {
  formatCountdown,
  isMatchLocked,
  lockAt,
  msUntilLock,
} from "@/lib/lock";
import type { Match, Prediction } from "@/lib/database.types";

interface Props {
  match: Match;
  prediction: Prediction | null;
  /** Current user's id, used to write the prediction row. */
  userId: string;
}

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved" }
  | { status: "error"; message: string };

export default function MatchPredictionCard({
  match,
  prediction,
  userId,
}: Props) {
  // Controlled inputs. Empty string => not yet entered.
  const [home, setHome] = useState<string>(
    prediction ? String(prediction.home_score) : "",
  );
  const [away, setAway] = useState<string>(
    prediction ? String(prediction.away_score) : "",
  );
  const [saved, setSaved] = useState<Prediction | null>(prediction);
  const [save, setSave] = useState<SaveState>({ status: "idle" });

  // Live clock: recompute lock state + countdown every second.
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const nowMs = now.getTime();
  const locked = useMemo(() => isMatchLocked(match, nowMs), [match, nowMs]);
  const remainingMs = useMemo(
    () => msUntilLock(match, nowMs),
    [match, nowMs],
  );

  const kickoff = useMemo(() => new Date(match.kickoff_at), [match.kickoff_at]);
  const lockMoment = useMemo(() => lockAt(match), [match]);

  const supabase = useMemo(() => createClient(), []);

  const onSave = useCallback(async () => {
    setSave({ status: "saving" });

    const h = Number(home);
    const a = Number(away);
    if (
      home === "" ||
      away === "" ||
      !Number.isInteger(h) ||
      !Number.isInteger(a) ||
      h < 0 ||
      a < 0
    ) {
      setSave({
        status: "error",
        message: "Enter a whole number (0 or more) for each team.",
      });
      return;
    }

    // Upsert on the unique (user_id, match_id) constraint. The DB trigger
    // enforces the lock; if a race occurs we surface its error below.
    const { data, error } = await supabase
      .from("predictions")
      .upsert(
        {
          user_id: userId,
          match_id: match.id,
          home_score: h,
          away_score: a,
        },
        { onConflict: "user_id,match_id" },
      )
      .select()
      .single();

    if (error) {
      setSave({
        status: "error",
        message: friendlyError(error.message),
      });
      return;
    }

    setSaved(data as Prediction);
    setSave({ status: "saved" });
  }, [home, away, supabase, userId, match.id]);

  const isFinished = match.status === "finished";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {/* Header: teams + stage */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {match.stage ?? "Match"}
        </div>
        {locked ? (
          <span className="inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
            {isFinished ? "Finished" : "Locked"}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
            Open
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="flex-1 text-right text-sm font-semibold text-gray-900">
          {match.home_team}
        </span>
        <span className="text-xs text-gray-400">vs</span>
        <span className="flex-1 text-left text-sm font-semibold text-gray-900">
          {match.away_team}
        </span>
      </div>

      {/* Kickoff time: local absolute */}
      <div className="mt-1 text-center text-xs text-gray-500">
        <time dateTime={match.kickoff_at}>
          {format(kickoff, "EEE d MMM, HH:mm")}
        </time>
      </div>

      {/* Final score when finished */}
      {isFinished &&
        match.home_score !== null &&
        match.away_score !== null && (
          <div className="mt-2 text-center text-sm font-bold text-gray-900">
            Full time {match.home_score} – {match.away_score}
          </div>
        )}

      {/* Score inputs / read-only saved prediction */}
      <div className="mt-3">
        {locked ? (
          <ReadOnlyPrediction prediction={saved} />
        ) : (
          <>
            <div className="flex items-center justify-center gap-2">
              <ScoreInput
                label={`${match.home_team} score`}
                value={home}
                onChange={(v) => {
                  setHome(v);
                  setSave({ status: "idle" });
                }}
              />
              <span className="text-lg font-bold text-gray-400">–</span>
              <ScoreInput
                label={`${match.away_team} score`}
                value={away}
                onChange={(v) => {
                  setAway(v);
                  setSave({ status: "idle" });
                }}
              />
            </div>

            <button
              type="button"
              onClick={onSave}
              disabled={save.status === "saving"}
              className="mt-3 w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {save.status === "saving"
                ? "Saving…"
                : saved
                  ? "Update prediction"
                  : "Save prediction"}
            </button>
          </>
        )}
      </div>

      {/* Live countdown to lock */}
      {!locked && (
        <p className="mt-2 text-center text-xs text-gray-500">
          Locks in{" "}
          <span className="font-mono font-semibold text-gray-700">
            {formatCountdown(remainingMs)}
          </span>{" "}
          <span className="text-gray-400">
            (at {format(lockMoment, "HH:mm")})
          </span>
        </p>
      )}

      {/* Save feedback */}
      {save.status === "saved" && (
        <p className="mt-2 text-center text-xs font-medium text-green-600">
          Prediction saved.
        </p>
      )}
      {save.status === "error" && (
        <p
          className="mt-2 text-center text-xs font-medium text-red-600"
          role="alert"
        >
          {save.message}
        </p>
      )}
    </div>
  );
}

function ScoreInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      step={1}
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-14 rounded-md border border-gray-300 px-2 py-1.5 text-center text-lg font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    />
  );
}

function ReadOnlyPrediction({ prediction }: { prediction: Prediction | null }) {
  if (!prediction) {
    return (
      <p className="text-center text-sm italic text-gray-400">
        No prediction made.
      </p>
    );
  }
  return (
    <div className="text-center">
      <div className="text-xs text-gray-500">Your prediction</div>
      <div className="text-lg font-bold text-gray-900">
        {prediction.home_score} – {prediction.away_score}
      </div>
    </div>
  );
}

/** Turn raw Postgres/RLS errors into something a user can act on. */
function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("locked") || m.includes("lock")) {
    return "This match just locked — predictions can no longer be changed.";
  }
  if (m.includes("row-level security") || m.includes("policy")) {
    return "You're not allowed to save this prediction. Please sign in again.";
  }
  return message || "Something went wrong saving your prediction.";
}
