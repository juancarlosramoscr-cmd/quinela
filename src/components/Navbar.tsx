import Link from "next/link";

import NavMenu from "@/components/NavMenu";
import { createClient } from "@/lib/supabase/server";

/**
 * App-wide navigation. Server component: reads the session and (if signed in)
 * the user's profile so the Admin link only renders for admins. The interactive
 * authenticated cluster (with responsive hamburger menu) lives in NavMenu.
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
          <NavMenu isAdmin={isAdmin} displayName={displayName} />
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
