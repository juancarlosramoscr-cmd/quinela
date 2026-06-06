// ─── Database types (espejo de Supabase) ─────────────────────────────────────

export type AvatarIcon =
  | '🏆' | '⚽' | '🥅' | '👟' | '🏳️' | '⭐' | '👑' | '🥊'

export interface User {
  id: string
  name: string
  nickname: string | null
  avatar_icon: AvatarIcon
  color: string
  created_at: string
}

export interface Team {
  id: string
  name: string
  flag: string        // emoji de bandera, ej: "🇦🇷"
  flag_code: string   // código ISO, ej: "ar" (para flagcdn.com)
  group_id: string
  fifa_code: string   // ej: "ARG"
}

export type MatchStatus = 'pending' | 'live' | 'final'

export interface Match {
  id: string
  group_id: string
  home_team_id: string
  away_team_id: string
  match_date: string  // ISO string
  home_score: number | null
  away_score: number | null
  status: MatchStatus
  external_api_id: number | null
  // joins
  home_team?: Team
  away_team?: Team
}

export interface Prediction {
  id: string
  user_id: string
  match_id: string
  predicted_home: number
  predicted_away: number
  points: number | null
  locked: boolean
  created_at: string
  updated_at: string
  // join
  match?: Match
}

export interface LeaderboardEntry {
  user_id: string
  name: string
  nickname: string | null
  avatar_icon: AvatarIcon
  color: string
  total_points: number
  exact_count: number
  correct_count: number
  played_count: number
}

// ─── Scoring config ──────────────────────────────────────────────────────────
export const SCORING = {
  EXACT_SCORE: 3,      // Marcador exacto (ej: 2-1 predicho, 2-1 real)
  CORRECT_RESULT: 1,   // Solo ganador/empate (ej: 2-0 predicho, 3-0 real)
  WRONG: 0,            // Sin acierto
} as const

// ─── Group stage data ─────────────────────────────────────────────────────────
export const GROUP_IDS = ['A','B','C','D','E','F','G','H','I','J','K','L'] as const
export type GroupId = typeof GROUP_IDS[number]
