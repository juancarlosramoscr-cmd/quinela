import type { Match, Prediction } from "@/lib/database.types";

/** A match joined with the current user's prediction (if any). */
export interface MatchWithPrediction {
  match: Match;
  prediction: Prediction | null;
}
