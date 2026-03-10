/**
 * Types עבור Supabase Database
 */

export interface Database {
  public: {
    Tables: {
      users_profile: {
        Row: {
          id: string;
          email: string;
          halachic_method: string;
          or_zarua: boolean;
          yom_31: boolean;
          maat_leat: boolean;
          latitude: number;
          longitude: number;
          timezone: string;
          location_name: string | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          halachic_method: string;
          or_zarua?: boolean;
          yom_31?: boolean;
          maat_leat?: boolean;
          latitude: number;
          longitude: number;
          timezone?: string;
          location_name?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          halachic_method?: string;
          or_zarua?: boolean;
          yom_31?: boolean;
          maat_leat?: boolean;
          latitude?: number;
          longitude?: number;
          timezone?: string;
          location_name?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      veset_events: {
        Row: {
          id: string;
          user_id: string;
          event_date: string;
          event_time: string | null;
          onah: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_date: string;
          event_time?: string | null;
          onah: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_date?: string;
          event_time?: string | null;
          onah?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      hefsek_tahara: {
        Row: {
          id: string;
          user_id: string;
          veset_event_id: string;
          hefsek_date: string;
          hefsek_time: string | null;
          onah: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          veset_event_id: string;
          hefsek_date: string;
          hefsek_time?: string | null;
          onah: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          veset_event_id?: string;
          hefsek_date?: string;
          hefsek_time?: string | null;
          onah?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      calculated_dates: {
        Row: {
          id: string;
          user_id: string;
          calc_date: string;
          hebrew_date: string;
          status: string;
          onah: string;
          veset_types: string[] | null;
          clean_day_number: number | null;
          reason: string;
          calculated_at: string;
          valid_until: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          calc_date: string;
          hebrew_date: string;
          status: string;
          onah: string;
          veset_types?: string[] | null;
          clean_day_number?: number | null;
          reason: string;
          calculated_at?: string;
          valid_until?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          calc_date?: string;
          hebrew_date?: string;
          status?: string;
          onah?: string;
          veset_types?: string[] | null;
          clean_day_number?: number | null;
          reason?: string;
          calculated_at?: string;
          valid_until?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
