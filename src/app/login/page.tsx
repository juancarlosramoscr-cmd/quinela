"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/matches";
  const callbackError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(
    callbackError
      ? "That magic link was invalid or expired. Request a new one."
      : null,
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const supabase = createClient();
    const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      redirectTo,
    )}`;

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    });

    if (otpError) {
      setError(otpError.message);
      setStatus("error");
      return;
    }
    setStatus("sent");
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Sign in</h1>
      <p className="mb-6 text-slate-600">
        We&apos;ll email you a magic link — no password needed.
      </p>

      {status === "sent" ? (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800"
        >
          <p className="font-medium">Check your email</p>
          <p className="mt-1 text-sm">
            We sent a magic link to <strong>{email}</strong>. Open it on this
            device to finish signing in.
          </p>
        </div>
      ) : (
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
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
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
            disabled={status === "loading"}
            className="w-full rounded-md bg-slate-900 px-4 py-2.5 font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "loading" ? "Sending…" : "Send magic link"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md py-10" />}>
      <LoginForm />
    </Suspense>
  );
}
