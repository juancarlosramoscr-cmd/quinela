import { format } from "date-fns";

import type { MatchWithPrediction } from "@/lib/predictions/types";

export interface MatchGroup {
  /** Stable key for React + sorting (ISO date, yyyy-MM-dd). */
  key: string;
  /** Section heading — the date, e.g. "Sat 14 Jun 2026". The per-match stage
   *  is shown on each card's own header, so the section is grouped by date only. */
  label: string;
  /** Earliest kickoff in the group, for ordering. */
  sortKey: number;
  items: MatchWithPrediction[];
}

/**
 * Group matches by DATE and sort chronologically. Within a group, matches are
 * ordered by kickoff time. Grouping by date (not date+stage) keeps each day's
 * matches together so the responsive card grid fills the row; the stage badge
 * lives on each card.
 */
export function groupMatches(rows: MatchWithPrediction[]): MatchGroup[] {
  const map = new Map<string, MatchGroup>();

  for (const row of rows) {
    const kickoff = new Date(row.match.kickoff_at);
    const key = format(kickoff, "yyyy-MM-dd");

    let group = map.get(key);
    if (!group) {
      group = {
        key,
        label: format(kickoff, "EEE d MMM yyyy"),
        sortKey: kickoff.getTime(),
        items: [],
      };
      map.set(key, group);
    }
    group.items.push(row);
    group.sortKey = Math.min(group.sortKey, kickoff.getTime());
  }

  const groups = Array.from(map.values());
  for (const g of groups) {
    g.items.sort(
      (a, b) =>
        new Date(a.match.kickoff_at).getTime() -
        new Date(b.match.kickoff_at).getTime(),
    );
  }
  groups.sort((a, b) => a.sortKey - b.sortKey);
  return groups;
}
