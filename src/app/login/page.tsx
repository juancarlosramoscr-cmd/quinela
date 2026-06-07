"use client";

import { Suspense, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";

import { signIn, signUp, type AuthActionState } from "@/app/actions/auth";

const initialState: AuthActionState = { error: null };

function SubmitButton({ mode }: { mode: "signin" | "signup" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-slate-900 px-4 py-2.5 font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending
        ? mode === "signin"
          ? "Signing in…"
          : "Creating account…"
        : mode === "signin"
          ? "Sign in"
          : "Create account"}
    </button>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/matches";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction] = useFormState(action, initialState);

  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">
        {mode === "signin" ? "Sign in" : "Create your account"}
      </h1>
      <p className="mb-6 text-slate-600">
        {mode === "signin"
          ? "Sign in with your email and password."
          : "Join the quinela — pick scores and climb the leaderboard."}
      </p>

      {/* key={mode} resets useFormState's error when switching modes */}
      <form key={mode} action={formAction} className="space-y-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />

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
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
            placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}

        <SubmitButton mode={mode} />
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        {mode === "signin" ? (
          <>
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="font-medium text-slate-900 underline underline-offset-2 hover:text-slate-700"
            >
              Create one
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="font-medium text-slate-900 underline underline-offset-2 hover:text-slate-700"
            >
              Sign in
            </button>
          </>
        )}
      </p>
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
