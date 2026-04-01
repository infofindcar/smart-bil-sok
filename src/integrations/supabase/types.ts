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
      app_config: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      car_makes: {
        Row: {
          country_of_origin: string | null
          make: string
          notes: string | null
          roadside_assistance_years: number
          warranty_km: number
          warranty_years: number
        }
        Insert: {
          country_of_origin?: string | null
          make: string
          notes?: string | null
          roadside_assistance_years?: number
          warranty_km?: number
          warranty_years?: number
        }
        Update: {
          country_of_origin?: string | null
          make?: string
          notes?: string | null
          roadside_assistance_years?: number
          warranty_km?: number
          warranty_years?: number
        }
        Relationships: []
      }
      car_models: {
        Row: {
          annual_tax_sek: number | null
          body_type: string | null
          boot_space_liters: number | null
          co2_g_per_km: number | null
          created_at: string | null
          drivetrain_default: string | null
          electric_range_km: number | null
          enriched_at: string | null
          estimated_annual_service_sek: number | null
          estimated_monthly_insurance_high: number | null
          estimated_monthly_insurance_low: number | null
          euro_ncap_stars: number | null
          euro_ncap_year: number | null
          fuel_consumption_l100km: number | null
          id: number
          make: string
          max_towing_kg: number | null
          model: string
          ncap_source: string | null
          reliability_notes: string | null
          seats: number | null
          typical_hp_max: number | null
          typical_hp_min: number | null
          zero_to_hundred_sec: number | null
        }
        Insert: {
          annual_tax_sek?: number | null
          body_type?: string | null
          boot_space_liters?: number | null
          co2_g_per_km?: number | null
          created_at?: string | null
          drivetrain_default?: string | null
          electric_range_km?: number | null
          enriched_at?: string | null
          estimated_annual_service_sek?: number | null
          estimated_monthly_insurance_high?: number | null
          estimated_monthly_insurance_low?: number | null
          euro_ncap_stars?: number | null
          euro_ncap_year?: number | null
          fuel_consumption_l100km?: number | null
          id?: never
          make: string
          max_towing_kg?: number | null
          model: string
          ncap_source?: string | null
          reliability_notes?: string | null
          seats?: number | null
          typical_hp_max?: number | null
          typical_hp_min?: number | null
          zero_to_hundred_sec?: number | null
        }
        Update: {
          annual_tax_sek?: number | null
          body_type?: string | null
          boot_space_liters?: number | null
          co2_g_per_km?: number | null
          created_at?: string | null
          drivetrain_default?: string | null
          electric_range_km?: number | null
          enriched_at?: string | null
          estimated_annual_service_sek?: number | null
          estimated_monthly_insurance_high?: number | null
          estimated_monthly_insurance_low?: number | null
          euro_ncap_stars?: number | null
          euro_ncap_year?: number | null
          fuel_consumption_l100km?: number | null
          id?: never
          make?: string
          max_towing_kg?: number | null
          model?: string
          ncap_source?: string | null
          reliability_notes?: string | null
          seats?: number | null
          typical_hp_max?: number | null
          typical_hp_min?: number | null
          zero_to_hundred_sec?: number | null
        }
        Relationships: []
      }
      dealers: {
        Row: {
          created_at: string | null
          dealer_name: string
          dealer_url: string | null
          email: string | null
          id: string
          is_active: boolean | null
          phone: string | null
        }
        Insert: {
          created_at?: string | null
          dealer_name: string
          dealer_url?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
        }
        Update: {
          created_at?: string | null
          dealer_name?: string
          dealer_url?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          car_id: number | null
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          dealer_email: string | null
          dealer_name: string | null
          id: string
          message: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          car_id?: number | null
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          dealer_email?: string | null
          dealer_name?: string | null
          id?: string
          message?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          car_id?: number | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          dealer_email?: string | null
          dealer_name?: string | null
          id?: string
          message?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "Lovable"
            referencedColumns: ["id"]
          },
        ]
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
