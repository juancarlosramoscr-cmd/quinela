// src/lib/scoring.ts
// ─── Sistema de puntuación — fácil de modificar ──────────────────────────────

import { SCORING } from '@/types'

export interface ScoreResult {
  points: number
  reason: 'exact' | 'correct_result' | 'wrong' | 'pending'
}

/**
 * Calcula los puntos de una predicción dado el resultado real.
 * Modifica SCORING en src/types/index.ts para cambiar los valores.
 */
export function calculatePoints(
  predictedHome: number,
  predictedAway: number,
  realHome: number | null,
  realAway: number | null
): ScoreResult {
  // Partido no terminado
  if (realHome === null || realAway === null) {
    return { points: 0, reason: 'pending' }
  }

  // Marcador exacto
  if (predictedHome === realHome && predictedAway === realAway) {
    return { points: SCORING.EXACT_SCORE, reason: 'exact' }
  }

  // Mismo resultado (ganador o empate)
  const predictedResult = Math.sign(predictedHome - predictedAway)
  const realResult = Math.sign(realHome - realAway)
  if (predictedResult === realResult) {
    return { points: SCORING.CORRECT_RESULT, reason: 'correct_result' }
  }

  return { points: SCORING.WRONG, reason: 'wrong' }
}

/**
 * Recalcula todos los puntos de un usuario para el leaderboard.
 */
export function calculateTotalPoints(
  predictions: Array<{
    predicted_home: number
    predicted_away: number
    match: { home_score: number | null; away_score: number | null }
  }>
) {
  let total = 0
  let exactCount = 0
  let correctCount = 0

  for (const p of predictions) {
    const result = calculatePoints(
      p.predicted_home,
      p.predicted_away,
      p.match.home_score,
      p.match.away_score
    )
    total += result.points
    if (result.reason === 'exact') exactCount++
    if (result.reason === 'correct_result') correctCount++
  }

  return { total, exactCount, correctCount }
}

/**
 * Verifica si un partido debe bloquearse (ya empezó o terminó).
 */
export function isMatchLocked(matchDate: string): boolean {
  return new Date(matchDate) <= new Date()
}

export const POINT_LABELS: Record<ScoreResult['reason'], string> = {
  exact: '¡Exacto! +3',
  correct_result: 'Resultado correcto +1',
  wrong: 'Sin acierto',
  pending: 'Pendiente',
}
