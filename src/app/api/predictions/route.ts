// src/app/api/predictions/route.ts
// ─── Guardar y bloquear una predicción ───────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase'
import { isMatchLocked } from '@/lib/scoring'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { user_id, match_id, predicted_home, predicted_away } = body

  if (!user_id || !match_id || predicted_home === undefined || predicted_away === undefined) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const supabase = createAdminSupabase()

  // 1. Verificar que el partido sigue pendiente y no ha empezado
  const { data: match } = await supabase
    .from('matches')
    .select('status, match_date')
    .eq('id', match_id)
    .single()

  if (!match || match.status !== 'pending' || isMatchLocked(match.match_date)) {
    return NextResponse.json({ error: 'El partido ya no acepta predicciones' }, { status: 409 })
  }

  // 2. Verificar que no hay predicción ya bloqueada para este partido/usuario
  const { data: existing } = await supabase
    .from('predictions')
    .select('id, locked')
    .eq('user_id', user_id)
    .eq('match_id', match_id)
    .single()

  if (existing?.locked) {
    return NextResponse.json({ error: 'La predicción ya está bloqueada' }, { status: 409 })
  }

  // 3. Upsert — crear o actualizar (bloqueada)
  const { data, error } = await supabase
    .from('predictions')
    .upsert({
      id: existing?.id,
      user_id,
      match_id,
      predicted_home,
      predicted_away,
      locked: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,match_id' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, prediction: data })
}
