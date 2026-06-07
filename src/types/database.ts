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
      mikvaot: {
        Row: {
          id: number;
          mikveName: string;
          mikveCity: string;
          mikveAddress: string;
          mikvePhone: string | null;
          responsibleWorker: string | null;
          accessability: string | null;
          activityHoursShabat: string | null;
          activityHoursWinter: string | null;
          activityHoursSummer: string | null;
          lat: number;
          lon: number;
        };
        Insert: {
          id?: number;
          mikveName: string;
          mikveCity: string;
          mikveAddress: string;
          mikvePhone?: string | null;
          responsibleWorker?: string | null;
          accessability?: string | null;
          activityHoursShabat?: string | null;
          activityHoursWinter?: string | null;
          activityHoursSummer?: string | null;
          lat: number;
          lon: number;
        };
        Update: {
          id?: number;
          mikveName?: string;
          mikveCity?: string;
          mikveAddress?: string;
          mikvePhone?: string | null;
          responsibleWorker?: string | null;
          accessability?: string | null;
          activityHoursShabat?: string | null;
          activityHoursWinter?: string | null;
          activityHoursSummer?: string | null;
          lat?: number;
          lon?: number;
        };
      };
      scheduled_notifications: {
        Row: {
          id: string;
          user_id: string;
          user_email: string | null;
          scheduled_for: string;
          title: string;
          body: string;
          type: string;
          sent: boolean;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          user_email?: string | null;
          scheduled_for: string;
          title: string;
          body: string;
          type: string;
          sent?: boolean;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          user_email?: string | null;
          scheduled_for?: string;
          title?: string;
          body?: string;
          type?: string;
          sent?: boolean;
          sent_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_mikvaot_in_bounds: {
        Args: {
          p_min_lat: number;
          p_max_lat: number;
          p_min_lon: number;
          p_max_lon: number;
        };
        Returns: Array<{
          id: number;
          mikveName: string;
          mikveCity: string;
          mikveAddress: string;
          mikvePhone: string | null;
          responsibleWorker: string | null;
          accessability: string | null;
          activityHoursShabat: string | null;
          activityHoursWinter: string | null;
          activityHoursSummer: string | null;
          lat: number;
          lon: number;
        }>;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
