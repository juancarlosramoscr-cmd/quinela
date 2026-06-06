import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/database.types";

/** Routes that require an authenticated session. */
const PROTECTED_PREFIXES = [
  "/matches",
  "/leaderboard",
  "/my-predictions",
  "/admin",
  "/profile",
];

/**
 * Refreshes the Supabase session on every request and enforces route
 * protection. Returns a NextResponse that carries refreshed auth cookies.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: getUser() revalidates the token with Supabase. Do not run code
  // between createServerClient and getUser, or sessions may randomly drop.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Already authenticated users shouldn't see the login form — bounce them to
  // the app (honoring ?redirectTo if present).
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    const redirectTo = url.searchParams.get("redirectTo");
    url.pathname = redirectTo?.startsWith("/") ? redirectTo : "/matches";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
