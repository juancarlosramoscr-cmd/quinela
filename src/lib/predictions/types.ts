/**
 * Domain shapes used by the predictions UI. These mirror the DB schema
 * (see CLAUDE.md). We keep them local & minimal so prediction components
 * compile independently of the generated `Database` type, and stay readable.
 */

export type MatchStatus = "scheduled" | "finished";

export interface Match {
  id: string;
  external_id: string | null;
  home_team: string;
  away_team: string;
  kickoff_at: string; // ISO timestamptz
  stage: string;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus;
  created_at: string;
}

export interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  points: number | null; // null until the match is scored
  created_at: string;
  updated_at: string;
}

/** A match joined with the current user's prediction (if any). */
export interface MatchWithPrediction {
  match: Match;
  prediction: Prediction | null;
}
