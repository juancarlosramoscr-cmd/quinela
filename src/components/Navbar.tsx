import Link from "next/link";

import { signOut } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";

const NAV_LINKS = [
  { href: "/matches", label: "Matches" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/my-predictions", label: "My Predictions" },
] as const;

/**
 * App-wide navigation. Server component: reads the session and (if signed in)
 * the user's profile so the Admin link only renders for admins.
 */
export default async function Navbar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  let displayName: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, is_admin")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.is_admin ?? false;
    displayName = profile?.display_name ?? null;
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <span aria-hidden className="text-xl">⚽</span>
          <span>Quinela</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-1 text-sm sm:gap-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-2 py-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className="rounded-md px-2 py-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                Admin
              </Link>
            )}
            <Link
              href="/profile"
              className="rounded-md px-2 py-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              title="Edit profile"
            >
              {displayName || "Profile"}
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-700 transition-colors hover:bg-slate-100"
              >
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-slate-700"
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
