"use client";

import { useFormState, useFormStatus } from "react-dom";

import {
  updateDisplayName,
  type ProfileActionState,
} from "@/app/actions/profile";

const initialState: ProfileActionState = { ok: false, message: "" };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

export default function ProfileForm({
  initialName,
}: {
  initialName: string;
}) {
  const [state, formAction] = useFormState(updateDisplayName, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="display_name"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Display name
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          maxLength={40}
          defaultValue={initialName}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
        <p className="mt-1 text-xs text-slate-500">
          This is the name shown on the leaderboard.
        </p>
      </div>

      {state.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={`text-sm ${state.ok ? "text-green-600" : "text-red-600"}`}
        >
          {state.message}
        </p>
      )}

      <SaveButton />
    </form>
  );
}
