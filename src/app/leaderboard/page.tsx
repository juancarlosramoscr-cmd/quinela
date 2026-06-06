// src/app/leaderboard/page.tsx
import Navbar from '@/components/layout/Navbar'
import LeaderboardTop10 from '@/components/ui/LeaderboardTop10'
import { createServerSupabase } from '@/lib/supabase'
import type { LeaderboardEntry } from '@/types'

// Revalidar cada 5 minutos
export const revalidate = 300

async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = createServerSupabase()

  // Calculamos el leaderboard dinámicamente desde predictions
  const { data, error } = await supabase
    .from('predictions')
    .select(`
      user_id,
      predicted_home,
      predicted_away,
      points,
      locked,
      users ( name, nickname, avatar_icon, color ),
      matches ( home_score, away_score, status )
    `)
    .eq('locked', true)

  if (error || !data) return []

  // Agrupar por usuario
  const userMap = new Map<string, LeaderboardEntry>()

  for (const pred of data) {
    const user = pred.users as any
    const match = pred.matches as any
    if (!user) continue

    if (!userMap.has(pred.user_id)) {
      userMap.set(pred.user_id, {
        user_id: pred.user_id,
        name: user.name,
        nickname: user.nickname,
        avatar_icon: user.avatar_icon,
        color: user.color,
        total_points: 0,
        exact_count: 0,
        correct_count: 0,
        played_count: 0,
      })
    }

    const entry = userMap.get(pred.user_id)!
    if (match?.status === 'final' && pred.points !== null) {
      entry.total_points += pred.points
      if (pred.points === 3) entry.exact_count++
      if (pred.points === 1) entry.correct_count++
      entry.played_count++
    }
  }

  return Array.from(userMap.values())
    .sort((a, b) => b.total_points - a.total_points || b.exact_count - a.exact_count)
}

export default async function LeaderboardPage() {
  const entries = await getLeaderboard()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-pitch-900 page-enter">

        {/* Header */}
        <div className="bg-pitch-800 border-b border-white/6 px-5 py-5 flex items-center gap-4">
          <span className="text-3xl">🏆</span>
          <div>
            <h1 className="font-bebas text-[24px] tracking-widest text-gold">RANKING FAMILIAR</h1>
            <p className="text-[11px] text-[#B8B0A0] uppercase tracking-wider">
              {entries.length} participante{entries.length !== 1 ? 's' : ''} · Actualizado automáticamente
            </p>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-5">
            <span className="text-5xl mb-4">⏳</span>
            <h2 className="font-bebas text-xl tracking-widest text-[#B8B0A0] mb-2">SIN DATOS AÚN</h2>
            <p className="text-[#7A7060] text-sm">
              El ranking aparece cuando haya predicciones confirmadas y resultados reales.
            </p>
          </div>
        ) : (
          <LeaderboardTop10 entries={entries} />
        )}

        {/* Scoring legend */}
        <div className="max-w-md mx-auto px-5 py-6">
          <div className="bg-pitch-800 border border-white/6 rounded-lg p-4">
            <h3 className="font-bebas tracking-widest text-[14px] text-gold mb-3">SISTEMA DE PUNTOS</h3>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between">
                <span className="text-[#B8B0A0]">⭐ Marcador exacto</span>
                <span className="text-green-400 font-bold">+3 puntos</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#B8B0A0]">✓ Resultado correcto</span>
                <span className="text-gold font-bold">+1 punto</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#B8B0A0]">✗ Sin acierto</span>
                <span className="text-[#7A7060] font-bold">0 puntos</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
