"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  // Track whether a (recovery) session is available. The browser client
  // auto-detects the recovery hash on load and fires PASSWORD_RECOVERY; we also
  // check getSession in case the event already fired before this mounted.
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) setHasSession(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasSession(true);
      }
    });

    // If neither getSession nor the event has resolved a session shortly after
    // mount, treat it as "no recovery session" so we can show the fallback.
    const timer = setTimeout(() => {
      if (active) setHasSession((prev) => (prev === null ? false : prev));
    }, 1500);

    return () => {
      active = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setStatus("saving");
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("idle");
      setError(error.message);
      return;
    }

    setStatus("done");
    // Give the user a moment to read the confirmation, then send them into the app.
    setTimeout(() => router.replace("/matches"), 1500);
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">
        Set a new password
      </h1>

      {status === "done" ? (
        <p
          role="status"
          className="mt-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          Your password has been updated. Redirecting you to the app…
        </p>
      ) : hasSession === false ? (
        <div className="space-y-4">
          <p className="text-slate-600">
            This reset link is invalid or has expired.
          </p>
          <p className="text-center text-sm text-slate-600">
            <Link
              href="/forgot-password"
              className="font-medium text-slate-900 underline underline-offset-2 hover:text-slate-700"
            >
              Request a new reset link
            </Link>
          </p>
        </div>
      ) : (
        <>
          <p className="mb-6 text-slate-600">
            Choose a new password for your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>

            <div>
              <label
                htmlFor="confirm"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Confirm new password
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "saving" || hasSession === null}
              className="w-full rounded-md bg-slate-900 px-4 py-2.5 font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "saving" ? "Saving…" : "Update password"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
