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
      apartments: {
        Row: {
          airbnb_ical_url: string | null
          booking_ical_url: string | null
          cleaner_token: string
          created_at: string
          id: string
          last_sync_error: string | null
          last_synced_at: string | null
          name: string
          owner_id: string
        }
        Insert: {
          airbnb_ical_url?: string | null
          booking_ical_url?: string | null
          cleaner_token?: string
          created_at?: string
          id?: string
          last_sync_error?: string | null
          last_synced_at?: string | null
          name?: string
          owner_id: string
        }
        Update: {
          airbnb_ical_url?: string | null
          booking_ical_url?: string | null
          cleaner_token?: string
          created_at?: string
          id?: string
          last_sync_error?: string | null
          last_synced_at?: string | null
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      reservation_splits: {
        Row: {
          adults: number | null
          comment: string | null
          created_at: string
          guest_name: string | null
          id: string
          is_blocked: boolean | null
          kids_ages: number[]
          reservation_id: string
          start_date: string
        }
        Insert: {
          adults?: number | null
          comment?: string | null
          created_at?: string
          guest_name?: string | null
          id?: string
          is_blocked?: boolean | null
          kids_ages?: number[]
          reservation_id: string
          start_date: string
        }
        Update: {
          adults?: number | null
          comment?: string | null
          created_at?: string
          guest_name?: string | null
          id?: string
          is_blocked?: boolean | null
          kids_ages?: number[]
          reservation_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_splits_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          adults: number | null
          apartment_id: string
          check_in: string
          check_out: string
          comment: string | null
          created_at: string
          external_uid: string
          first_part_blocked: boolean | null
          guest_name: string | null
          id: string
          is_blocked: boolean
          kids_ages: number[]
          owner_check_in: string | null
          owner_check_out: string | null
          owner_kind: string | null
          owner_source: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          adults?: number | null
          apartment_id: string
          check_in: string
          check_out: string
          comment?: string | null
          created_at?: string
          external_uid: string
          first_part_blocked?: boolean | null
          guest_name?: string | null
          id?: string
          is_blocked?: boolean
          kids_ages?: number[]
          owner_check_in?: string | null
          owner_check_out?: string | null
          owner_kind?: string | null
          owner_source?: string | null
          source: string
          status?: string
          updated_at?: string
        }
        Update: {
          adults?: number | null
          apartment_id?: string
          check_in?: string
          check_out?: string
          comment?: string | null
          created_at?: string
          external_uid?: string
          first_part_blocked?: boolean | null
          guest_name?: string | null
          id?: string
          is_blocked?: boolean
          kids_ages?: number[]
          owner_check_in?: string | null
          owner_check_out?: string | null
          owner_kind?: string | null
          owner_source?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_calendar_feed: {
        Args: {
          p_apartment_id: string
          p_events: Json
          p_source: string
          p_url: string
        }
        Returns: undefined
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
