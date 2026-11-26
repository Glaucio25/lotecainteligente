export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      contests: {
        Row: {
          bet_end: string | null
          bet_start: string | null
          draw_date: string | null
          estimated_prize: number | null
          games_end: string | null
          games_start: string | null
          number: number
          official_published: boolean
          results_official: boolean
          status: string
          updated_at: string
        }
        Insert: {
          bet_end?: string | null
          bet_start?: string | null
          draw_date?: string | null
          estimated_prize?: number | null
          games_end?: string | null
          games_start?: string | null
          number: number
          official_published?: boolean
          results_official?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          bet_end?: string | null
          bet_start?: string | null
          draw_date?: string | null
          estimated_prize?: number | null
          games_end?: string | null
          games_start?: string | null
          number?: number
          official_published?: boolean
          results_official?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      loteca_games: {
        Row: {
          away_full: string | null
          away_logo: string | null
          away_name: string
          away_score: number | null
          away_team_id: string | null
          clock: string | null
          contest: number
          events: Json
          game_date: string | null
          home_full: string | null
          home_logo: string | null
          home_name: string
          home_score: number | null
          home_team_id: string | null
          kickoff: string | null
          league_name: string | null
          live_updated_at: string | null
          match_note: string | null
          match_status: string
          official_away_goals: number | null
          official_home_goals: number | null
          official_result: string | null
          period: number | null
          seq: number
          source: string | null
          source_event_id: string | null
          source_league: string | null
          state: string | null
          status_detail: string | null
          updated_at: string
          venue: string | null
        }
        Insert: {
          away_full?: string | null
          away_logo?: string | null
          away_name: string
          away_score?: number | null
          away_team_id?: string | null
          clock?: string | null
          contest: number
          events?: Json
          game_date?: string | null
          home_full?: string | null
          home_logo?: string | null
          home_name: string
          home_score?: number | null
          home_team_id?: string | null
          kickoff?: string | null
          league_name?: string | null
          live_updated_at?: string | null
          match_note?: string | null
          match_status?: string
          official_away_goals?: number | null
          official_home_goals?: number | null
          official_result?: string | null
          period?: number | null
          seq: number
          source?: string | null
          source_event_id?: string | null
          source_league?: string | null
          state?: string | null
          status_detail?: string | null
          updated_at?: string
          venue?: string | null
        }
        Update: {
          away_full?: string | null
          away_logo?: string | null
          away_name?: string
          away_score?: number | null
          away_team_id?: string | null
          clock?: string | null
          contest?: number
          events?: Json
          game_date?: string | null
          home_full?: string | null
          home_logo?: string | null
          home_name?: string
          home_score?: number | null
          home_team_id?: string | null
          kickoff?: string | null
          league_name?: string | null
          live_updated_at?: string | null
          match_note?: string | null
          match_status?: string
          official_away_goals?: number | null
          official_home_goals?: number | null
          official_result?: string | null
          period?: number | null
          seq?: number
          source?: string | null
          source_event_id?: string | null
          source_league?: string | null
          state?: string | null
          status_detail?: string | null
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loteca_games_contest_fkey"
            columns: ["contest"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["number"]
          },
        ]
      }
      predictions: {
        Row: {
          complete: boolean
          confidence: string
          contest: number
          explanation: string | null
          factors: Json
          generated_at: string
          kickoff: string | null
          lambda_away: number | null
          lambda_home: number | null
          model_version: string
          p1: number
          p2: number
          pick: string
          px: number
          seq: number
          top_pick: string
        }
        Insert: {
          complete?: boolean
          confidence: string
          contest: number
          explanation?: string | null
          factors?: Json
          generated_at?: string
          kickoff?: string | null
          lambda_away?: number | null
          lambda_home?: number | null
          model_version: string
          p1: number
          p2: number
          pick: string
          px: number
          seq: number
          top_pick: string
        }
        Update: {
          complete?: boolean
          confidence?: string
          contest?: number
          explanation?: string | null
          factors?: Json
          generated_at?: string
          kickoff?: string | null
          lambda_away?: number | null
          lambda_home?: number | null
          model_version?: string
          p1?: number
          p2?: number
          pick?: string
          px?: number
          seq?: number
          top_pick?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_contest_seq_fkey"
            columns: ["contest", "seq"]
            isOneToOne: true
            referencedRelation: "loteca_games"
            referencedColumns: ["contest", "seq"]
          },
        ]
      }
      sync_log: {
        Row: {
          created_at: string
          id: number
          message: string | null
          ok: boolean
          source: string
        }
        Insert: {
          created_at?: string
          id?: number
          message?: string | null
          ok: boolean
          source: string
        }
        Update: {
          created_at?: string
          id?: number
          message?: string | null
          ok?: boolean
          source?: string
        }
        Relationships: []
      }
      sync_state: {
        Row: {
          key: string
          last_error: string | null
          last_ok: string | null
          last_run: string | null
          requests_day: string | null
          requests_today: number
        }
        Insert: {
          key: string
          last_error?: string | null
          last_ok?: string | null
          last_run?: string | null
          requests_day?: string | null
          requests_today?: number
        }
        Update: {
          key?: string
          last_error?: string | null
          last_ok?: string | null
          last_run?: string | null
          requests_day?: string | null
          requests_today?: number
        }
        Relationships: []
      }
      user_tickets: {
        Row: {
          combinations: number
          contest: number
          cost: number
          created_at: string
          device_id: string
          doubles: number
          id: string
          picks: Json
          strategy: string
          triples: number
        }
        Insert: {
          combinations: number
          contest: number
          cost: number
          created_at?: string
          device_id: string
          doubles: number
          id?: string
          picks: Json
          strategy: string
          triples: number
        }
        Update: {
          combinations?: number
          contest?: number
          cost?: number
          created_at?: string
          device_id?: string
          doubles?: number
          id?: string
          picks?: Json
          strategy?: string
          triples?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      try_claim_sync: {
        Args: { _key: string; _min_seconds: number }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
