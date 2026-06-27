"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

/**
 * Supabase password-reset emails land on the site root with the recovery token
 * in a URL hash fragment (#...&type=recovery). The hash is client-only, so we
 * detect it here: the browser client auto-parses the hash on load and fires
 * PASSWORD_RECOVERY, at which point we route the user to /reset-password.
 *
 * Mounted in the root layout (a server component) via this "use client" island
 * so the listener is always active regardless of which page the link hits.
 */
export default function RecoveryRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // Already on the reset page — let it handle its own session, don't loop.
      if (event === "PASSWORD_RECOVERY" && pathname !== "/reset-password") {
        router.replace("/reset-password");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  return null;
}
