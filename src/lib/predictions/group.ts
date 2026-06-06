import { format } from "date-fns";

import type { MatchWithPrediction } from "@/lib/predictions/types";

export interface MatchGroup {
  /** Stable key for React + sorting (ISO date + stage). */
  key: string;
  /** Human label, e.g. "Group Stage · Sat 14 Jun". */
  label: string;
  dateLabel: string;
  stage: string;
  /** Earliest kickoff in the group, for ordering. */
  sortKey: number;
  items: MatchWithPrediction[];
}

/**
 * Group matches by (date, stage) and sort chronologically. Within a group,
 * matches are ordered by kickoff time.
 */
export function groupMatches(rows: MatchWithPrediction[]): MatchGroup[] {
  const map = new Map<string, MatchGroup>();

  for (const row of rows) {
    const kickoff = new Date(row.match.kickoff_at);
    const dateLabel = format(kickoff, "EEE d MMM yyyy");
    const stage = row.match.stage ?? "Match";
    const key = `${format(kickoff, "yyyy-MM-dd")}__${stage}`;

    let group = map.get(key);
    if (!group) {
      group = {
        key,
        label: `${stage} · ${dateLabel}`,
        dateLabel,
        stage,
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
