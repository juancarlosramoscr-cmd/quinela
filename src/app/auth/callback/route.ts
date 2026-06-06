import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

/**
 * Magic-link callback. Handles BOTH auth flows so it works for normal
 * signInWithOtp emails *and* links produced by the Admin API generate_link
 * (which QA uses to log in without SMTP):
 *
 *  1. PKCE flow  → arrives with `?code=...`         → exchangeCodeForSession
 *  2. Token-hash → arrives with `?token_hash=&type=` → verifyOtp
 *
 * On success we forward to `next` (or `redirect_to`), defaulting to /matches.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Honor either `next` (our login page) or `redirect_to` (Supabase action_link).
  const next =
    searchParams.get("next") || searchParams.get("redirect_to") || "/matches";
  // Guard against open-redirects: only allow same-origin relative paths.
  const safeNext = next.startsWith("/") ? next : "/matches";

  const supabase = createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  // No usable params or verification failed — back to login with an error flag.
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
