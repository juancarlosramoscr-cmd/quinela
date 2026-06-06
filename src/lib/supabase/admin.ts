import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

/**
 * Server-only Supabase client using the SERVICE ROLE key.
 *
 * This BYPASSES Row Level Security — never import it into a Client Component
 * or expose it to the browser. Use it only inside trusted server code (route
 * handlers / server actions) that has already verified the caller is an admin.
 *
 * Used by the fixture/result sync routes so bulk upserts aren't subject to
 * per-row RLS checks. The DB scoring trigger still runs on result writes.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
