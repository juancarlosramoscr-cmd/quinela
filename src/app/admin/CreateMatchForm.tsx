"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { createMatch, type AdminActionResult } from "@/app/actions/admin";

/**
 * Compute the browser's UTC offset (in minutes, matching Date.getTimezoneOffset:
 * positive when local is behind UTC) for the specific wall-clock datetime the
 * admin typed. We evaluate the offset *for that date* rather than "now" so a
 * kickoff on the other side of a DST boundary still gets the right offset.
 * Returns null if the input can't be parsed.
 */
function localOffsetMinutes(naiveDatetime: string): number | null {
  const asLocal = new Date(naiveDatetime);
  if (Number.isNaN(asLocal.getTime())) return null;
  return asLocal.getTimezoneOffset();
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Creating…" : "Create match"}
    </button>
  );
}

export default function CreateMatchForm() {
  const [state, formAction] = useFormState<AdminActionResult | null, FormData>(
    createMatch,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const offsetRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  // The datetime-local input carries no timezone; stamp the browser's UTC offset
  // for the entered datetime into a hidden field just before submit, so the
  // server resolves the instant against the admin's clock rather than its own.
  const stampOffset = () => {
    const kickoff = formRef.current?.elements.namedItem(
      "kickoff_at",
    ) as HTMLInputElement | null;
    const offset =
      kickoff?.value != null ? localOffsetMinutes(kickoff.value) : null;
    if (offsetRef.current) {
      offsetRef.current.value = offset != null ? String(offset) : "";
    }
  };

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={stampOffset}
      className="space-y-4"
    >
      <input
        ref={offsetRef}
        type="hidden"
        name="kickoff_offset_minutes"
        defaultValue=""
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">
            Home team
          </span>
          <input
            name="home_team"
            type="text"
            required
            placeholder="England"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">
            Away team
          </span>
          <input
            name="away_team"
            type="text"
            required
            placeholder="Netherlands"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">
            Kickoff (your local time)
          </span>
          <input
            name="kickoff_at"
            type="datetime-local"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">
            Stage <span className="font-normal text-slate-400">(optional)</span>
          </span>
          <input
            name="stage"
            type="text"
            placeholder="Group Stage"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton />
        {state?.ok && (
          <span className="text-sm text-green-600">Match created.</span>
        )}
        {state && !state.ok && state.error && (
          <span className="text-sm text-red-600">{state.error}</span>
        )}
      </div>
    </form>
  );
}
