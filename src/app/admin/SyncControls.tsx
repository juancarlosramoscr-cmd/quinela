"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SyncKind = "fixtures" | "results";

interface SyncState {
  loading: SyncKind | null;
  message: string | null;
  error: boolean;
}

export default function SyncControls() {
  const router = useRouter();
  const [state, setState] = useState<SyncState>({
    loading: null,
    message: null,
    error: false,
  });

  async function runSync(kind: SyncKind) {
    setState({ loading: kind, message: null, error: false });
    try {
      const res = await fetch(`/api/sync-${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      if (!res.ok) {
        setState({
          loading: null,
          error: true,
          message:
            data?.error ??
            `Sync failed (${res.status}). Check the API key and try again.`,
        });
        return;
      }

      const summary =
        kind === "fixtures"
          ? `Fixtures synced — fetched ${data.fetched}, upserted ${data.upserted}.`
          : `Results synced — fetched ${data.fetched}, updated ${data.updated}, skipped ${data.skipped}.`;

      setState({
        loading: null,
        error: false,
        message: data.message ? `${summary} ${data.message}` : summary,
      });

      // Refresh the server component so updated matches/points show.
      router.refresh();
    } catch (err) {
      setState({
        loading: null,
        error: true,
        message:
          err instanceof Error ? err.message : "Network error during sync.",
      });
    }
  }

  const busy = state.loading !== null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => runSync("fixtures")}
          disabled={busy}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state.loading === "fixtures" ? "Syncing fixtures…" : "Sync fixtures"}
        </button>
        <button
          type="button"
          onClick={() => runSync("results")}
          disabled={busy}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state.loading === "results" ? "Syncing results…" : "Sync results"}
        </button>
      </div>

      {state.message && (
        <p
          className={`text-sm ${state.error ? "text-red-600" : "text-green-600"}`}
          role="status"
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
