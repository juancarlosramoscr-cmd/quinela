"use client";

import { useState } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Email is required.");
      return;
    }

    setStatus("sending");
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    // Rate limiting isn't tied to a specific account, so surfacing it leaks
    // nothing — and showing the success message to a throttled user is
    // misleading (no email actually went out).
    if (error?.status === 429) {
      setStatus("idle");
      setError("Too many requests — please wait a moment and try again.");
      return;
    }

    // Otherwise don't leak whether the account exists: on a real failure we
    // still show the generic success message. (We only surface true
    // client/transport errors.)
    if (error && error.status && error.status >= 500) {
      setStatus("idle");
      setError("Something went wrong. Please try again.");
      return;
    }

    setStatus("sent");
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Reset password</h1>
      <p className="mb-6 text-slate-600">
        Enter your email and we&apos;ll send you a link to set a new password.
      </p>

      {status === "sent" ? (
        <div className="space-y-4">
          <p
            role="status"
            className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            If an account exists for that email, a reset link is on its way.
          </p>
          <p className="text-center text-sm text-slate-600">
            <Link
              href="/login"
              className="font-medium text-slate-900 underline underline-offset-2 hover:text-slate-700"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              disabled={status === "sending"}
              className="w-full rounded-md bg-slate-900 px-4 py-2.5 font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Send reset link"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Remembered it?{" "}
            <Link
              href="/login"
              className="font-medium text-slate-900 underline underline-offset-2 hover:text-slate-700"
            >
              Back to sign in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
