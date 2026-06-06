import { createClient } from "@/lib/supabase/server";

export interface AdminContext {
  userId: string;
}

/**
 * Verifies the current request comes from an authenticated admin.
 *
 * Returns `{ ok: true, userId }` for admins, or `{ ok: false, status }` with
 * an HTTP-ish status hint (401 unauthenticated / 403 not admin) for callers
 * (route handlers) to translate into responses. Server-side source of truth:
 * RLS already restricts match writes to admins, but we check here too so the
 * UI/route can fail fast and clearly.
 */
export async function requireAdmin():
  | Promise<{ ok: true; userId: string }>
  | Promise<{ ok: false; status: 401 | 403 }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, status: 401 };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return { ok: false, status: 403 };

  return { ok: true, userId: user.id };
}
