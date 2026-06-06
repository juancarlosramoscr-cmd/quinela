"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/app/actions/auth";

const NAV_LINKS = [
  { href: "/matches", label: "Matches" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/my-predictions", label: "My Predictions" },
] as const;

/**
 * Authenticated nav cluster. Renders inline on >=sm; collapses into a
 * hamburger-toggled dropdown below sm so Admin / Profile / Sign out stay
 * reachable on phones (fixes the mobile overflow defect).
 */
export default function NavMenu({
  isAdmin,
  displayName,
}: {
  isAdmin: boolean;
  displayName: string | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the menu on navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const links = [
    ...NAV_LINKS,
    ...(isAdmin ? [{ href: "/admin", label: "Admin" } as const] : []),
    { href: "/profile", label: displayName || "Profile" } as const,
  ];

  const linkClass =
    "rounded-md px-2 py-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900";

  return (
    <>
      {/* Desktop / >=sm: inline row */}
      <div className="hidden items-center gap-1 text-sm sm:flex sm:gap-2">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={linkClass}>
            {link.label}
          </Link>
        ))}
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-700 transition-colors hover:bg-slate-100"
          >
            Sign out
          </button>
        </form>
      </div>

      {/* Mobile / <sm: hamburger toggle */}
      <div className="relative sm:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="rounded-md border border-slate-200 p-2 text-slate-700 transition-colors hover:bg-slate-100"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            {open ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>

        {open && (
          <>
            {/* Backdrop to close on outside tap */}
            <button
              type="button"
              aria-hidden
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-10 cursor-default"
            />
            <div
              id="mobile-nav-menu"
              className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
            >
              <div className="flex flex-col gap-1 text-sm">
                {links.map((link) => (
                  <Link key={link.href} href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                ))}
                <form action={signOut} className="mt-1 border-t border-slate-100 pt-2">
                  <button
                    type="submit"
                    className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-left text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
