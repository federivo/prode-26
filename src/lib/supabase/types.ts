// Tipos de la base. Reflejan el esquema de supabase/migrations/0001_init.sql.

export type MatchStage =
  | "GROUP"
  | "LAST_32"
  | "LAST_16"
  | "QUARTER_FINAL"
  | "SEMI_FINAL"
  | "THIRD_PLACE"
  | "FINAL";

export type MatchStatus = "SCHEDULED" | "IN_PLAY" | "FINISHED";
export type MatchWinner = "HOME" | "AWAY" | "DRAW";
export type MembershipRole = "admin" | "member";

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  is_app_admin: boolean;
  created_at: string;
}

export type League = {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export type Membership = {
  id: string;
  user_id: string;
  league_id: string;
  role: MembershipRole;
  joined_at: string;
}

export type Match = {
  id: string;
  external_id: number;
  stage: MatchStage;
  home_team: string | null;
  away_team: string | null;
  kickoff: string;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  winner: MatchWinner | null;
  predictions_open: boolean;
  manual_result: boolean;
  updated_at: string;
}

export type Prediction = {
  id: string;
  user_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  points_awarded: number | null;
  created_at: string;
  updated_at: string;
}

export type SyncState = {
  id: boolean;
  last_synced_at: string | null;
}

type Row<T> = T;
type Insert<T> = Partial<T>;
type Update<T> = Partial<T>;

interface TableDef<T> {
  Row: Row<T>;
  Insert: Insert<T>;
  Update: Update<T>;
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<Profile>;
      leagues: TableDef<League>;
      memberships: TableDef<Membership>;
      matches: TableDef<Match>;
      predictions: TableDef<Prediction>;
      sync_state: TableDef<SyncState>;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      match_stage: MatchStage;
      match_status: MatchStatus;
      match_winner: MatchWinner;
      membership_role: MembershipRole;
    };
    CompositeTypes: { [_ in never]: never };
  };
}
