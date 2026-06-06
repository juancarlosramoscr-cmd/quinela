// src/app/api/sync-results/route.ts
// ─── Cron job para sincronizar resultados reales desde API-Football ───────────
// En Vercel: configurar en vercel.json o en el dashboard de Cron Jobs
// Ejecutar cada 5 min en días de partido: "*/5 * * * *"
// Protegido con CRON_SECRET para que no lo llame cualquiera

import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase'
import { fetchTodayFixtures, mapApiStatus } from '@/lib/api-football'
import { calculatePoints } from '@/lib/scoring'

export async function GET(req: NextRequest) {
  // 1. Verificar el secret
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminSupabase()
  const updated: string[] = []

  try {
    // 2. Obtener partidos de hoy desde API-Football
    const fixtures = await fetchTodayFixtures()

    for (const fixture of fixtures) {
      const apiId    = fixture.fixture.id
      const apiStatus = mapApiStatus(fixture.fixture.status.short)
      const homeScore = fixture.goals.home
      const awayScore = fixture.goals.away

      // 3. Buscar el partido en nuestra DB por external_api_id
      const { data: match } = await supabase
        .from('matches')
        .select('id, status')
        .eq('external_api_id', apiId)
        .single()

      if (!match) continue

      // 4. Actualizar marcador y status
      await supabase
        .from('matches')
        .update({ home_score: homeScore, away_score: awayScore, status: apiStatus })
        .eq('id', match.id)

      // 5. Si el partido terminó, calcular puntos de todas las predicciones
      if (apiStatus === 'final' && homeScore !== null && awayScore !== null) {
        const { data: predictions } = await supabase
          .from('predictions')
          .select('id, predicted_home, predicted_away')
          .eq('match_id', match.id)

        for (const pred of predictions ?? []) {
          const result = calculatePoints(pred.predicted_home, pred.predicted_away, homeScore, awayScore)
          await supabase
            .from('predictions')
            .update({ points: result.points })
            .eq('id', pred.id)
        }

        updated.push(`match:${match.id} (${homeScore}-${awayScore})`)
      }
    }

    return NextResponse.json({ ok: true, updated })
  } catch (err) {
    console.error('[sync-results] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
