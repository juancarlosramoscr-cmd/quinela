/**
 * Typed wrapper around API-Football (api-sports.io).
 *
 * Host: v3.football.api-sports.io
 * Auth header: x-apisports-key: <FOOTBALL_API_KEY>
 *
 * ⚠️ FREE PLAN: 100 requests/day. NEVER call these functions on page loads —
 * only from explicit admin-triggered sync routes. The wrapper is intentionally
 * defensive: malformed / empty / partial responses resolve to empty arrays so a
 * bad upstream response can never wipe out the seeded mock matches.
 *
 * Server-only: imports nothing browser-safe and reads process.env at call time.
 */

const DEFAULT_HOST = "v3.football.api-sports.io";

// FIFA World Cup league id in API-Football is 1.
export const WORLD_CUP_LEAGUE_ID = 1;

export interface FootballFixture {
  /** API-Football fixture id (string-ified for our `external_id`). */
  externalId: string;
  homeTeam: string;
  awayTeam: string;
  /** ISO 8601 kickoff timestamp. */
  kickoffAt: string;
  /** Round/stage label, e.g. "Group Stage - 1" or "Final". */
  stage: string | null;
  /** Short status code from the API, e.g. "NS", "FT", "1H". */
  statusShort: string;
  /** Final/current scores, null when not yet available. */
  homeScore: number | null;
  awayScore: number | null;
}

interface ApiFixtureResponse {
  fixture?: {
    id?: number;
    date?: string;
    status?: { short?: string | null } | null;
  } | null;
  league?: { round?: string | null } | null;
  teams?: {
    home?: { name?: string | null } | null;
    away?: { name?: string | null } | null;
  } | null;
  goals?: { home?: number | null; away?: number | null } | null;
}

interface ApiEnvelope<T> {
  response?: T[] | null;
  errors?: unknown;
  results?: number;
}

/** API status codes that mean the match has finished (full time). */
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);

/** Maps an API short status to our DB enum, or null if not yet finished. */
export function mapStatus(short: string | null | undefined): "finished" | null {
  if (!short) return null;
  return FINISHED_STATUSES.has(short) ? "finished" : null;
}

function getConfig() {
  const apiKey = process.env.FOOTBALL_API_KEY;
  const host = process.env.FOOTBALL_API_HOST || DEFAULT_HOST;
  if (!apiKey) {
    throw new Error(
      "FOOTBALL_API_KEY is not set — cannot call the Football API.",
    );
  }
  return { apiKey, host };
}

/** Low-level GET against the API. Throws on network / non-2xx errors. */
async function apiGet<T>(
  path: string,
  params: Record<string, string | number>,
): Promise<ApiEnvelope<T>> {
  const { apiKey, host } = getConfig();
  const url = new URL(`https://${host}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const res = await fetch(url, {
    headers: { "x-apisports-key": apiKey },
    // Never cache — but we also never call this on page loads.
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Football API ${path} responded ${res.status} ${res.statusText}: ${body.slice(0, 200)}`,
    );
  }

  return (await res.json()) as ApiEnvelope<T>;
}

/** Normalizes one raw API fixture; returns null if it lacks required fields. */
function normalizeFixture(raw: ApiFixtureResponse): FootballFixture | null {
  const id = raw.fixture?.id;
  const date = raw.fixture?.date;
  const home = raw.teams?.home?.name;
  const away = raw.teams?.away?.name;

  // Require the fields we actually persist; skip incomplete rows defensively.
  if (id == null || !date || !home || !away) return null;

  return {
    externalId: String(id),
    homeTeam: home,
    awayTeam: away,
    kickoffAt: date,
    stage: raw.league?.round ?? null,
    statusShort: raw.fixture?.status?.short ?? "NS",
    homeScore: raw.goals?.home ?? null,
    awayScore: raw.goals?.away ?? null,
  };
}

/**
 * Fetch fixtures for a league + season. Returns a normalized, filtered list.
 * Returns [] (never throws on shape) when the response is empty/partial.
 */
export async function fetchWorldCupFixtures(
  season: number,
  leagueId: number = WORLD_CUP_LEAGUE_ID,
): Promise<FootballFixture[]> {
  const env = await apiGet<ApiFixtureResponse>("fixtures", {
    league: leagueId,
    season,
  });

  const response = Array.isArray(env.response) ? env.response : [];
  return response
    .map(normalizeFixture)
    .filter((f): f is FootballFixture => f !== null);
}

/**
 * Fetch only finished fixtures for a league + season (status=FT-AET-PEN).
 * Defensive: returns [] on empty/partial responses.
 */
export async function fetchFinishedFixtures(
  season: number,
  leagueId: number = WORLD_CUP_LEAGUE_ID,
): Promise<FootballFixture[]> {
  const env = await apiGet<ApiFixtureResponse>("fixtures", {
    league: leagueId,
    season,
    status: "FT-AET-PEN",
  });

  const response = Array.isArray(env.response) ? env.response : [];
  return response
    .map(normalizeFixture)
    .filter((f): f is FootballFixture => f !== null)
    .filter((f) => mapStatus(f.statusShort) === "finished");
}
