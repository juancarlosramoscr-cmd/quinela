// src/lib/supabase.ts
// ─── Clientes Supabase para browser y server ─────────────────────────────────

import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente para componentes del browser (Client Components)
export function createBrowserSupabase() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Cliente con service role para Server Actions / API Routes
// ⚠️  NUNCA exponer SUPABASE_SERVICE_ROLE_KEY en el cliente
export function createAdminSupabase() {
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Cliente anon para Server Components
export function createServerSupabase() {
  return createClient(supabaseUrl, supabaseAnonKey)
}
