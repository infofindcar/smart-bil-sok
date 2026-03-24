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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_name: string
          id: string
          page_path: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_name: string
          id?: string
          page_path?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_name?: string
          id?: string
          page_path?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      Lovable: {
        Row: {
          body_type: string | null
          city: string | null
          color: string | null
          created_at: string | null
          dealer_name: string | null
          dealer_url: string | null
          drivetrain: string | null
          fuel_type: string | null
          horsepower: number | null
          id: number
          image_thumb_url: string | null
          is_active: boolean | null
          last_seen_at: string | null
          listing_url: string | null
          make: string | null
          mileage: number | null
          model: string | null
          model_clean: string | null
          model_raw: string | null
          orginal_url: string | null
          price: number | null
          regnr: string | null
          source: string | null
          source_listing_id: string | null
          transmission: string | null
          year: number | null
        }
        Insert: {
          body_type?: string | null
          city?: string | null
          color?: string | null
          created_at?: string | null
          dealer_name?: string | null
          dealer_url?: string | null
          drivetrain?: string | null
          fuel_type?: string | null
          horsepower?: number | null
          id?: number
          image_thumb_url?: string | null
          is_active?: boolean | null
          last_seen_at?: string | null
          listing_url?: string | null
          make?: string | null
          mileage?: number | null
          model?: string | null
          model_clean?: string | null
          model_raw?: string | null
          orginal_url?: string | null
          price?: number | null
          regnr?: string | null
          source?: string | null
          source_listing_id?: string | null
          transmission?: string | null
          year?: number | null
        }
        Update: {
          body_type?: string | null
          city?: string | null
          color?: string | null
          created_at?: string | null
          dealer_name?: string | null
          dealer_url?: string | null
          drivetrain?: string | null
          fuel_type?: string | null
          horsepower?: number | null
          id?: number
          image_thumb_url?: string | null
          is_active?: boolean | null
          last_seen_at?: string | null
          listing_url?: string | null
          make?: string | null
          mileage?: number | null
          model?: string | null
          model_clean?: string | null
          model_raw?: string | null
          orginal_url?: string | null
          price?: number | null
          regnr?: string | null
          source?: string | null
          source_listing_id?: string | null
          transmission?: string | null
          year?: number | null
        }
        Relationships: []
      }
      "ny find car": {
        Row: {
          body_type: string | null
          city: string | null
          color: string | null
          drivetrain: string | null
          fuel_type: string | null
          id: number | null
          image_thumb_url: string | null
          listing_url: string | null
          make: string | null
          mileage: number | null
          model: string | null
          model_clean: string | null
          model_raw: string | null
          price: number | null
          source: string | null
          year: number | null
        }
        Insert: {
          body_type?: string | null
          city?: string | null
          color?: string | null
          drivetrain?: string | null
          fuel_type?: string | null
          id?: number | null
          image_thumb_url?: string | null
          listing_url?: string | null
          make?: string | null
          mileage?: number | null
          model?: string | null
          model_clean?: string | null
          model_raw?: string | null
          price?: number | null
          source?: string | null
          year?: number | null
        }
        Update: {
          body_type?: string | null
          city?: string | null
          color?: string | null
          drivetrain?: string | null
          fuel_type?: string | null
          id?: number | null
          image_thumb_url?: string | null
          listing_url?: string | null
          make?: string | null
          mileage?: number | null
          model?: string | null
          model_clean?: string | null
          model_raw?: string | null
          price?: number | null
          source?: string | null
          year?: number | null
        }
        Relationships: []
      }
      car_makes: {
        Row: {
          make: string
          warranty_years: number
          warranty_km: number
          roadside_assistance_years: number
          country_of_origin: string | null
          notes: string | null
        }
        Insert: {
          make: string
          warranty_years?: number
          warranty_km?: number
          roadside_assistance_years?: number
          country_of_origin?: string | null
          notes?: string | null
        }
        Update: {
          make?: string
          warranty_years?: number
          warranty_km?: number
          roadside_assistance_years?: number
          country_of_origin?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      car_models: {
        Row: {
          id: number
          make: string
          model: string
          body_type: string | null
          boot_space_liters: number | null
          max_towing_kg: number | null
          seats: number | null
          typical_hp_min: number | null
          typical_hp_max: number | null
          zero_to_hundred_sec: number | null
          drivetrain_default: string | null
          fuel_consumption_l100km: number | null
          electric_range_km: number | null
          co2_g_per_km: number | null
          euro_ncap_stars: number | null
          euro_ncap_year: number | null
          ncap_source: string | null
          reliability_notes: string | null
          enriched_at: string | null
        }
        Insert: {
          id?: number
          make: string
          model: string
          body_type?: string | null
          boot_space_liters?: number | null
          max_towing_kg?: number | null
          seats?: number | null
          typical_hp_min?: number | null
          typical_hp_max?: number | null
          zero_to_hundred_sec?: number | null
          drivetrain_default?: string | null
          fuel_consumption_l100km?: number | null
          electric_range_km?: number | null
          co2_g_per_km?: number | null
          euro_ncap_stars?: number | null
          euro_ncap_year?: number | null
          ncap_source?: string | null
          reliability_notes?: string | null
          enriched_at?: string | null
        }
        Update: {
          id?: number
          make?: string
          model?: string
          body_type?: string | null
          boot_space_liters?: number | null
          max_towing_kg?: number | null
          seats?: number | null
          typical_hp_min?: number | null
          typical_hp_max?: number | null
          zero_to_hundred_sec?: number | null
          drivetrain_default?: string | null
          fuel_consumption_l100km?: number | null
          electric_range_km?: number | null
          co2_g_per_km?: number | null
          euro_ncap_stars?: number | null
          euro_ncap_year?: number | null
          ncap_source?: string | null
          reliability_notes?: string | null
          enriched_at?: string | null
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          batches_completed: number | null
          batches_total: number | null
          cars_inserted: number | null
          cars_skipped: number | null
          cars_updated: number | null
          completed_at: string | null
          credits_estimated: number | null
          error_message: string | null
          id: string
          started_at: string
          status: string | null
        }
        Insert: {
          batches_completed?: number | null
          batches_total?: number | null
          cars_inserted?: number | null
          cars_skipped?: number | null
          cars_updated?: number | null
          completed_at?: string | null
          credits_estimated?: number | null
          error_message?: string | null
          id?: string
          started_at?: string
          status?: string | null
        }
        Update: {
          batches_completed?: number | null
          batches_total?: number | null
          cars_inserted?: number | null
          cars_skipped?: number | null
          cars_updated?: number | null
          completed_at?: string | null
          credits_estimated?: number | null
          error_message?: string | null
          id?: string
          started_at?: string
          status?: string | null
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
