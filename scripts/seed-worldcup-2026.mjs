#!/usr/bin/env node
/**
 * Seed the quinela database with the FIFA World Cup 2026 GROUP STAGE.
 *
 * - Clears all existing predictions + matches, then inserts all 72 group matches.
 * - Teams + EXACT official kickoff times/venues are the real published schedule
 *   (source: ESPN official fixtures; final draw 5 Dec 2025).
 * - Times below are the official ET (US Eastern) kickoffs. June is EDT = UTC-4,
 *   so we convert ET → UTC by ADDING 4 hours, and store as timestamptz. The app
 *   renders kickoffs in each viewer's local time; for the user that's GMT-6
 *   (ET − 2h, e.g. 3 p.m. ET = 1 p.m. GMT-6).
 *
 * Usage:
 *   node scripts/seed-worldcup-2026.mjs           # clear + seed
 *   node scripts/seed-worldcup-2026.mjs --dry     # preview (shows GMT-6), no writes
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes("--dry");

// ── Load env from .env.local ────────────────────────────────────────────────
function loadEnv() {
  const env = {};
  try {
    const raw = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* fall through to process.env */
  }
  return { ...env, ...process.env };
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || SUPABASE_URL.includes("YOUR-PROJECT")) {
  console.error(
    "✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

// In June, US Eastern Time is EDT = UTC-4. ET → UTC means ADD 4 hours.
const ET_TO_UTC_HOURS = 4;

/**
 * Parse an ET clock string like "3 p.m.", "10 p.m.", "12 a.m.", "7:30 p.m."
 * into 24h { h, m }.
 */
function parseET(t) {
  const m = t.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(a\.m\.|p\.m\.)$/i);
  if (!m) throw new Error(`Unparseable ET time: "${t}"`);
  let h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  const pm = /p/i.test(m[3]);
  if (h === 12) h = 0; // 12 a.m. -> 0, 12 p.m. -> 12 (handled by +12 below)
  if (pm) h += 12;
  return { h, m: min };
}

/** Build a UTC ISO timestamp from an ET date + ET clock string. */
function etToUtcISO(date, etTime) {
  const [y, mo, d] = date.split("-").map(Number);
  const { h, m } = parseET(etTime);
  const utcMs = Date.UTC(y, mo - 1, d, h + ET_TO_UTC_HOURS, m);
  return new Date(utcMs).toISOString();
}

// ── Group lookup (real final-draw groups) for tagging each match's stage ────
const GROUP_OF = {};
const GROUPS = {
  A: ["Mexico", "South Africa", "South Korea", "Czechia"],
  B: ["Canada", "Bosnia and Herzegovina", "Qatar", "Switzerland"],
  C: ["Brazil", "Morocco", "Haiti", "Scotland"],
  D: ["United States", "Paraguay", "Australia", "Türkiye"],
  E: ["Germany", "Curaçao", "Ivory Coast", "Ecuador"],
  F: ["Netherlands", "Japan", "Sweden", "Tunisia"],
  G: ["Belgium", "Egypt", "Iran", "New Zealand"],
  H: ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"],
  I: ["France", "Senegal", "Iraq", "Norway"],
  J: ["Argentina", "Algeria", "Austria", "Jordan"],
  K: ["Portugal", "DR Congo", "Uzbekistan", "Colombia"],
  L: ["England", "Croatia", "Ghana", "Panama"],
};
for (const [g, teams] of Object.entries(GROUPS)) {
  for (const t of teams) GROUP_OF[t] = g;
}

// ── The official schedule: [ET date, ET time, home, away, venue] ────────────
// Source: ESPN official 2026 World Cup fixtures (all 72 group matches).
const FIXTURES = [
  ["2026-06-11", "3 p.m.", "Mexico", "South Africa", "Mexico City"],
  ["2026-06-11", "10 p.m.", "South Korea", "Czechia", "Zapopan"],
  ["2026-06-12", "3 p.m.", "Canada", "Bosnia and Herzegovina", "Toronto"],
  ["2026-06-12", "9 p.m.", "United States", "Paraguay", "Inglewood"],
  ["2026-06-13", "3 p.m.", "Qatar", "Switzerland", "Santa Clara"],
  ["2026-06-13", "6 p.m.", "Brazil", "Morocco", "East Rutherford"],
  ["2026-06-13", "9 p.m.", "Haiti", "Scotland", "Foxborough"],
  ["2026-06-14", "12 a.m.", "Australia", "Türkiye", "Vancouver"],
  ["2026-06-14", "1 p.m.", "Germany", "Curaçao", "Houston"],
  ["2026-06-14", "4 p.m.", "Netherlands", "Japan", "Arlington"],
  ["2026-06-14", "7 p.m.", "Ivory Coast", "Ecuador", "Philadelphia"],
  ["2026-06-14", "10 p.m.", "Sweden", "Tunisia", "Guadalupe"],
  ["2026-06-15", "1 p.m.", "Spain", "Cape Verde", "Atlanta"],
  ["2026-06-15", "6 p.m.", "Belgium", "Egypt", "Seattle"],
  ["2026-06-15", "6 p.m.", "Saudi Arabia", "Uruguay", "Miami Gardens"],
  ["2026-06-16", "12 a.m.", "Iran", "New Zealand", "Inglewood"],
  ["2026-06-16", "3 p.m.", "France", "Senegal", "East Rutherford"],
  ["2026-06-16", "6 p.m.", "Iraq", "Norway", "Foxborough"],
  ["2026-06-16", "9 p.m.", "Argentina", "Algeria", "Kansas City"],
  ["2026-06-17", "12 a.m.", "Austria", "Jordan", "Santa Clara"],
  ["2026-06-17", "1 p.m.", "Portugal", "DR Congo", "Houston"],
  ["2026-06-17", "4 p.m.", "England", "Croatia", "Arlington"],
  ["2026-06-17", "7 p.m.", "Ghana", "Panama", "Toronto"],
  ["2026-06-17", "10 p.m.", "Uzbekistan", "Colombia", "Mexico City"],
  ["2026-06-18", "12 p.m.", "Czechia", "South Africa", "Atlanta"],
  ["2026-06-18", "3 p.m.", "Switzerland", "Bosnia and Herzegovina", "Inglewood"],
  ["2026-06-18", "6 p.m.", "Canada", "Qatar", "Vancouver"],
  ["2026-06-18", "11 p.m.", "Mexico", "South Korea", "Zapopan"],
  ["2026-06-19", "3 p.m.", "United States", "Australia", "Seattle"],
  ["2026-06-19", "6 p.m.", "Scotland", "Morocco", "Foxborough"],
  ["2026-06-19", "9 p.m.", "Brazil", "Haiti", "Philadelphia"],
  ["2026-06-20", "12 a.m.", "Türkiye", "Paraguay", "Santa Clara"],
  ["2026-06-20", "1 p.m.", "Netherlands", "Sweden", "Houston"],
  ["2026-06-20", "4 p.m.", "Germany", "Ivory Coast", "Toronto"],
  ["2026-06-20", "8 p.m.", "Ecuador", "Curaçao", "Kansas City"],
  ["2026-06-21", "12 a.m.", "Tunisia", "Japan", "Guadalupe"],
  ["2026-06-21", "12 p.m.", "Spain", "Saudi Arabia", "Atlanta"],
  ["2026-06-21", "3 p.m.", "Belgium", "Iran", "Inglewood"],
  ["2026-06-21", "6 p.m.", "Uruguay", "Cape Verde", "Miami Gardens"],
  ["2026-06-21", "9 p.m.", "New Zealand", "Egypt", "Vancouver"],
  ["2026-06-22", "1 p.m.", "Argentina", "Austria", "Arlington"],
  ["2026-06-22", "5 p.m.", "France", "Iraq", "Philadelphia"],
  ["2026-06-22", "8 p.m.", "Norway", "Senegal", "East Rutherford"],
  ["2026-06-22", "11 p.m.", "Jordan", "Algeria", "Santa Clara"],
  ["2026-06-23", "1 p.m.", "Portugal", "Uzbekistan", "Houston"],
  ["2026-06-23", "4 p.m.", "England", "Ghana", "Foxborough"],
  ["2026-06-23", "7 p.m.", "Panama", "Croatia", "Toronto"],
  ["2026-06-23", "10 p.m.", "Colombia", "DR Congo", "Zapopan"],
  ["2026-06-24", "3 p.m.", "Switzerland", "Canada", "Vancouver"],
  ["2026-06-24", "3 p.m.", "Bosnia and Herzegovina", "Qatar", "Seattle"],
  ["2026-06-24", "6 p.m.", "Scotland", "Brazil", "Miami Gardens"],
  ["2026-06-24", "6 p.m.", "Morocco", "Haiti", "Atlanta"],
  ["2026-06-24", "9 p.m.", "Czechia", "Mexico", "Mexico City"],
  ["2026-06-24", "9 p.m.", "South Africa", "South Korea", "Guadalupe"],
  ["2026-06-25", "4 p.m.", "Ecuador", "Germany", "East Rutherford"],
  ["2026-06-25", "4 p.m.", "Curaçao", "Ivory Coast", "Philadelphia"],
  ["2026-06-25", "7 p.m.", "Japan", "Sweden", "Arlington"],
  ["2026-06-25", "7 p.m.", "Tunisia", "Netherlands", "Kansas City"],
  ["2026-06-25", "10 p.m.", "Türkiye", "United States", "Inglewood"],
  ["2026-06-25", "10 p.m.", "Paraguay", "Australia", "Santa Clara"],
  ["2026-06-26", "3 p.m.", "Norway", "France", "Foxborough"],
  ["2026-06-26", "3 p.m.", "Senegal", "Iraq", "Toronto"],
  ["2026-06-26", "8 p.m.", "Cape Verde", "Saudi Arabia", "Houston"],
  ["2026-06-26", "8 p.m.", "Uruguay", "Spain", "Zapopan"],
  ["2026-06-26", "11 p.m.", "Egypt", "Iran", "Seattle"],
  ["2026-06-26", "11 p.m.", "New Zealand", "Belgium", "Vancouver"],
  ["2026-06-27", "5 p.m.", "Panama", "England", "East Rutherford"],
  ["2026-06-27", "5 p.m.", "Croatia", "Ghana", "Philadelphia"],
  ["2026-06-27", "7:30 p.m.", "Colombia", "Portugal", "Miami Gardens"],
  ["2026-06-27", "7:30 p.m.", "DR Congo", "Uzbekistan", "Atlanta"],
  ["2026-06-27", "10 p.m.", "Algeria", "Austria", "Kansas City"],
  ["2026-06-27", "10 p.m.", "Jordan", "Argentina", "Arlington"],
];

function buildMatches() {
  return FIXTURES.map(([date, etTime, home, away, venue]) => {
    const group = GROUP_OF[home] ?? GROUP_OF[away];
    if (!group) throw new Error(`No group for ${home} / ${away}`);
    return {
      external_id: `WC2026-${date}-${home}-v-${away}`.replace(/\s+/g, "_"),
      home_team: home,
      away_team: away,
      kickoff_at: etToUtcISO(date, etTime),
      // Stage carries the group + venue so the card shows context.
      stage: `Group ${group} · ${venue}`,
      home_score: null,
      away_score: null,
      status: "scheduled",
    };
  }).sort((a, b) => a.kickoff_at.localeCompare(b.kickoff_at));
}

async function main() {
  const matches = buildMatches();
  console.log(`Built ${matches.length} World Cup 2026 group-stage matches.`);

  if (DRY) {
    for (const m of matches) {
      const local = new Date(m.kickoff_at).toLocaleString("en-US", {
        timeZone: "America/Mexico_City",
        dateStyle: "medium",
        timeStyle: "short",
      });
      console.log(
        `${local.padEnd(25)} (GMT-6)  ${m.home_team} vs ${m.away_team}  [${m.stage}]`,
      );
    }
    console.log("\n--dry: no database changes made.");
    return;
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Clearing existing predictions…");
  const delPred = await supabase
    .from("predictions")
    .delete()
    .not("id", "is", null);
  if (delPred.error) throw delPred.error;

  console.log("Clearing existing matches…");
  const delMatch = await supabase.from("matches").delete().not("id", "is", null);
  if (delMatch.error) throw delMatch.error;

  console.log(`Inserting ${matches.length} matches…`);
  const { error: insErr, count } = await supabase
    .from("matches")
    .insert(matches, { count: "exact" });
  if (insErr) throw insErr;

  console.log(`✓ Seeded ${count ?? matches.length} World Cup 2026 group matches.`);
  console.log(
    "Official ET kickoffs stored as UTC; they render in each viewer's local time (GMT-6 for you).",
  );
}

main().catch((e) => {
  console.error("✗ Seed failed:", e.message ?? e);
  process.exit(1);
});
