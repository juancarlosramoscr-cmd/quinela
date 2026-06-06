// src/lib/api-football.ts
// ─── Integración con API-Football para resultados reales ─────────────────────
// Documentación: https://www.api-football.com/documentation-v3
// Plan gratuito: 100 llamadas/día — suficiente para los días de partido

const BASE_URL = 'https://v3.football.api-sports.io'
const API_KEY = process.env.API_FOOTBALL_KEY!

// ID del Mundial 2026 en API-Football
// Verificar en: GET /leagues?name=FIFA+World+Cup&season=2026
export const WORLD_CUP_2026_LEAGUE_ID = 1  // FIFA World Cup
export const WORLD_CUP_2026_SEASON = 2026

interface ApiFixture {
  fixture: {
    id: number
    date: string
    status: { short: string; long: string }
  }
  teams: {
    home: { id: number; name: string }
    away: { id: number; name: string }
  }
  goals: {
    home: number | null
    away: number | null
  }
  league: { round: string }
}

interface ApiResponse<T> {
  response: T[]
  errors: Record<string, string>
}

async function apiFetch<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'x-apisports-key': API_KEY,
    },
    next: { revalidate: 300 }, // cache 5 minutos
  })

  if (!res.ok) {
    throw new Error(`API-Football error: ${res.status} ${res.statusText}`)
  }

  return res.json() as Promise<T>
}

/**
 * Obtiene todos los partidos de la fase de grupos del Mundial 2026.
 * Llama una vez para cargar el fixture inicial en Supabase.
 */
export async function fetchGroupStageFixtures() {
  const data = await apiFetch<ApiResponse<ApiFixture>>(
    `/fixtures?league=${WORLD_CUP_2026_LEAGUE_ID}&season=${WORLD_CUP_2026_SEASON}&round=Group+Stage`
  )
  return data.response
}

/**
 * Obtiene los partidos de hoy para actualizar marcadores.
 * Ejecutar una vez al día via cron.
 */
export async function fetchTodayFixtures() {
  const today = new Date().toISOString().split('T')[0]
  const data = await apiFetch<ApiResponse<ApiFixture>>(
    `/fixtures?league=${WORLD_CUP_2026_LEAGUE_ID}&season=${WORLD_CUP_2026_SEASON}&date=${today}`
  )
  return data.response
}

/**
 * Obtiene un partido específico por su ID de API-Football.
 */
export async function fetchFixtureById(fixtureId: number) {
  const data = await apiFetch<ApiResponse<ApiFixture>>(
    `/fixtures?id=${fixtureId}`
  )
  return data.response[0] ?? null
}

/**
 * Mapea el status de API-Football al status interno.
 */
export function mapApiStatus(apiStatus: string): 'pending' | 'live' | 'final' {
  const LIVE_STATUSES = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE']
  const FINAL_STATUSES = ['FT', 'AET', 'PEN']

  if (LIVE_STATUSES.includes(apiStatus)) return 'live'
  if (FINAL_STATUSES.includes(apiStatus)) return 'final'
  return 'pending'
}
