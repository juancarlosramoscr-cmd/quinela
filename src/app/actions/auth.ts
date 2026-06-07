"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export interface AuthActionState {
  error: string | null;
}

/** Only allow same-origin relative redirect targets (open-redirect guard). */
function safeRedirect(target: FormDataEntryValue | null): string {
  const t = typeof target === "string" ? target : "";
  return t.startsWith("/") ? t : "/matches";
}

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

/** Server action: sign in with email + password. */
export async function signIn(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const { email, password } = readCredentials(formData);
  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Supabase returns a generic "Invalid login credentials" for bad email or
    // password — surface it as-is (don't leak which field was wrong).
    return { error: error.message };
  }

  redirect(safeRedirect(formData.get("redirectTo")));
}

/** Server action: create an account with email + password, then sign in. */
export async function signUp(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const { email, password } = readCredentials(formData);
  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  // With email confirmation disabled, signUp returns an active session and the
  // handle_new_user trigger creates the profile row. If confirmation were on,
  // there'd be no session yet — handle that gracefully.
  if (!data.session) {
    return {
      error:
        "Account created. Please check your email to confirm before signing in.",
    };
  }

  redirect(safeRedirect(formData.get("redirectTo")));
}

/** Server action: sign the current user out and send them to /login. */
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
