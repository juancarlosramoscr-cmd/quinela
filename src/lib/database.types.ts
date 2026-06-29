/**
 * Hand-written types for the Quinela Supabase schema (project esatdtijjmcaaousjime).
 * The schema is already applied & tested; keep this in sync with CLAUDE.md.
 */

export type MatchStatus = "scheduled" | "finished";

/** Which side won a penalty shootout. Display-only tag; does not affect scoring. */
export type PenaltyWinner = "home" | "away";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          is_admin?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          external_id: string | null;
          home_team: string;
          away_team: string;
          kickoff_at: string;
          stage: string | null;
          home_score: number | null;
          away_score: number | null;
          status: MatchStatus;
          /** Penalty-shootout winner tag ('home'|'away') or null. Display-only;
           *  does not affect scoring — a level full-time score is still a draw. */
          penalty_winner: PenaltyWinner | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          external_id?: string | null;
          home_team: string;
          away_team: string;
          kickoff_at: string;
          stage?: string | null;
          home_score?: number | null;
          away_score?: number | null;
          status?: MatchStatus;
          penalty_winner?: PenaltyWinner | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          external_id?: string | null;
          home_team?: string;
          away_team?: string;
          kickoff_at?: string;
          stage?: string | null;
          home_score?: number | null;
          away_score?: number | null;
          status?: MatchStatus;
          penalty_winner?: PenaltyWinner | null;
          created_at?: string;
        };
        Relationships: [];
      };
      predictions: {
        Row: {
          id: string;
          user_id: string;
          match_id: string;
          home_score: number;
          away_score: number;
          points: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          match_id: string;
          home_score: number;
          away_score: number;
          points?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          match_id?: string;
          home_score?: number;
          away_score?: number;
          points?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "predictions_match_id_fkey";
            columns: ["match_id"];
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "predictions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      leaderboard: {
        Row: {
          user_id: string | null;
          display_name: string | null;
          total_points: number | null;
          exact_count: number | null;
          winner_count: number | null;
          predictions_made: number | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      match_status: MatchStatus;
    };
  };
}

// Convenience row aliases used across the app.
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Match = Database["public"]["Tables"]["matches"]["Row"];
export type Prediction = Database["public"]["Tables"]["predictions"]["Row"];
export type LeaderboardRow = Database["public"]["Views"]["leaderboard"]["Row"];
