#!/usr/bin/env node
/**
 * Seed the quinela database with the FIFA World Cup 2026 GROUP STAGE.
 *
 * - Clears all existing predictions + matches, then inserts all 72 group matches.
 * - Teams are the REAL final-draw groups (drawn 5 Dec 2025).
 * - The group-stage runs 11–27 Jun 2026. Each group's 6 matches are spread across
 *   that window; kickoff times are defined in the user's LOCAL timezone (GMT-6,
 *   "America/Mexico_City" / Central) and converted to UTC for storage (the
 *   kickoff_at column is timestamptz; the app renders in each viewer's local time).
 *
 * Usage:
 *   node scripts/seed-worldcup-2026.mjs           # clear + seed
 *   node scripts/seed-worldcup-2026.mjs --dry     # print what it would do, no writes
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

// ── Timezone: GMT-6 (no DST; matches the user's stated offset) ──────────────
// Mexico abolished DST in 2022, so Central Mexico is a fixed UTC-6 year-round.
const TZ_OFFSET_HOURS = -6;

/**
 * Build a UTC ISO timestamp from a local (GMT-6) date + time.
 * @param {string} date  "YYYY-MM-DD" in local GMT-6
 * @param {string} time  "HH:MM" 24h in local GMT-6
 */
function localToUtcISO(date, time) {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  // Local GMT-6 → UTC means ADDING 6 hours.
  const utcMs = Date.UTC(y, mo - 1, d, h - TZ_OFFSET_HOURS, mi);
  return new Date(utcMs).toISOString();
}

// ── The 12 real groups from the 2026 final draw ─────────────────────────────
// Order within each group = seeded position 1..4 (used by the fixture pattern).
const GROUPS = {
  A: ["Mexico", "South Africa", "South Korea", "Czechia"],
  B: ["Canada", "Bosnia & Herzegovina", "Qatar", "Switzerland"],
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

// Canonical FIFA group round-robin order (by seeded position, 1-indexed):
//   MD1: 1v2, 3v4   MD2: 1v3, 4v2   MD3: 4v1, 2v3
const FIXTURE_PATTERN = [
  { md: 1, home: 1, away: 2 },
  { md: 1, home: 3, away: 4 },
  { md: 2, home: 1, away: 3 },
  { md: 2, home: 4, away: 2 },
  { md: 3, home: 4, away: 1 },
  { md: 3, home: 2, away: 3 },
];

// Group-stage matchday date windows (local GMT-6 dates), 11–27 Jun 2026.
// Each group gets one date per matchday, staggered across groups so the
// schedule fills the window (4 kickoff slots/day in GMT-6).
const MATCHDAY_DATES = {
  // groups A–L → [MD1 date, MD2 date, MD3 date]
  A: ["2026-06-11", "2026-06-18", "2026-06-24"],
  B: ["2026-06-12", "2026-06-18", "2026-06-24"],
  C: ["2026-06-13", "2026-06-19", "2026-06-25"],
  D: ["2026-06-12", "2026-06-19", "2026-06-25"],
  E: ["2026-06-13", "2026-06-20", "2026-06-26"],
  F: ["2026-06-14", "2026-06-20", "2026-06-26"],
  G: ["2026-06-14", "2026-06-21", "2026-06-26"],
  H: ["2026-06-15", "2026-06-21", "2026-06-25"],
  I: ["2026-06-15", "2026-06-22", "2026-06-24"],
  J: ["2026-06-16", "2026-06-22", "2026-06-25"],
  K: ["2026-06-16", "2026-06-23", "2026-06-27"],
  L: ["2026-06-17", "2026-06-23", "2026-06-27"],
};

// Kickoff time slots (local GMT-6). The two matches on a group's matchday get
// two of these; we alternate so a group's games don't always clash.
const SLOTS = ["10:00", "13:00", "16:00", "19:00"];

function buildMatches() {
  const rows = [];
  const groupLetters = Object.keys(GROUPS);

  for (const g of groupLetters) {
    const teams = GROUPS[g];
    const dates = MATCHDAY_DATES[g];
    // Track how many matches placed per matchday for this group to pick a slot.
    const perMdCount = { 1: 0, 2: 0, 3: 0 };

    for (const fx of FIXTURE_PATTERN) {
      const date = dates[fx.md - 1];
      // two matches per matchday → slots offset by group index for variety
      const slotBase = (groupLetters.indexOf(g) + perMdCount[fx.md]) % SLOTS.length;
      const time = SLOTS[slotBase];
      perMdCount[fx.md] += 1;

      rows.push({
        external_id: `WC2026-${g}-MD${fx.md}-${fx.home}v${fx.away}`,
        home_team: teams[fx.home - 1],
        away_team: teams[fx.away - 1],
        kickoff_at: localToUtcISO(date, time),
        stage: `Group ${g}`,
        home_score: null,
        away_score: null,
        status: "scheduled",
      });
    }
  }

  // Sort chronologically for nice output.
  rows.sort((a, b) => a.kickoff_at.localeCompare(b.kickoff_at));
  return rows;
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
        `${m.stage.padEnd(8)} ${local.padEnd(24)} (GMT-6)  ${m.home_team} vs ${m.away_team}`,
      );
    }
    console.log("\n--dry: no database changes made.");
    return;
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1) Clear predictions first (FK), then matches.
  console.log("Clearing existing predictions…");
  const delPred = await supabase
    .from("predictions")
    .delete()
    .not("id", "is", null);
  if (delPred.error) throw delPred.error;

  console.log("Clearing existing matches…");
  const delMatch = await supabase.from("matches").delete().not("id", "is", null);
  if (delMatch.error) throw delMatch.error;

  // 2) Insert the new fixtures.
  console.log(`Inserting ${matches.length} matches…`);
  const { error: insErr, count } = await supabase
    .from("matches")
    .insert(matches, { count: "exact" });
  if (insErr) throw insErr;

  console.log(`✓ Seeded ${count ?? matches.length} World Cup 2026 group matches.`);
  console.log(
    "Kickoff times stored as UTC (timestamptz); they render in each viewer's local time.",
  );
}

main().catch((e) => {
  console.error("✗ Seed failed:", e.message ?? e);
  process.exit(1);
});
