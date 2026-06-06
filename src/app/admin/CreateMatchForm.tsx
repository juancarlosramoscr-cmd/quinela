"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { createMatch, type AdminActionResult } from "@/app/actions/admin";

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
  const [state, formAction] = useActionState<AdminActionResult | null, FormData>(
    createMatch,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
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
