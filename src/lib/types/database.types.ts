export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_invites: {
        Row: {
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by_admin_id: string;
          office_id: string;
          status: Database["public"]["Enums"]["admin_invite_status"];
        };
        Insert: {
          created_at?: string;
          email: string;
          expires_at?: string;
          id?: string;
          invited_by_admin_id: string;
          office_id: string;
          status?: Database["public"]["Enums"]["admin_invite_status"];
        };
        Update: {
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by_admin_id?: string;
          office_id?: string;
          status?: Database["public"]["Enums"]["admin_invite_status"];
        };
        Relationships: [
          {
            foreignKeyName: "admin_invites_invited_by_admin_id_fkey";
            columns: ["invited_by_admin_id"];
            isOneToOne: false;
            referencedRelation: "admins";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "admin_invites_office_id_fkey";
            columns: ["office_id"];
            isOneToOne: false;
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
        ];
      };
      admins: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          is_active: boolean;
          name: string;
          office_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          is_active?: boolean;
          name: string;
          office_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          office_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admins_office_id_fkey";
            columns: ["office_id"];
            isOneToOne: false;
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
        ];
      };
      appointment_field_values: {
        Row: {
          appointment_id: string;
          custom_field_id: string;
          id: string;
          value: string | null;
        };
        Insert: {
          appointment_id: string;
          custom_field_id: string;
          id?: string;
          value?: string | null;
        };
        Update: {
          appointment_id?: string;
          custom_field_id?: string;
          id?: string;
          value?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "appointment_field_values_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointment_field_values_custom_field_id_fkey";
            columns: ["custom_field_id"];
            isOneToOne: false;
            referencedRelation: "custom_fields";
            referencedColumns: ["id"];
          },
        ];
      };
      appointments: {
        Row: {
          cancel_token: string;
          client_id: string;
          created_at: string;
          email_sent: boolean;
          id: string;
          notes: string | null;
          office_id: string;
          practitioner_id: string;
          processing_at: string | null;
          reschedule_token: string;
          slot_id: string;
          status: Database["public"]["Enums"]["appointment_status"];
          updated_at: string;
        };
        Insert: {
          cancel_token?: string;
          client_id: string;
          created_at?: string;
          email_sent?: boolean;
          id?: string;
          notes?: string | null;
          office_id: string;
          practitioner_id: string;
          processing_at?: string | null;
          reschedule_token?: string;
          slot_id: string;
          status?: Database["public"]["Enums"]["appointment_status"];
          updated_at?: string;
        };
        Update: {
          cancel_token?: string;
          client_id?: string;
          created_at?: string;
          email_sent?: boolean;
          id?: string;
          notes?: string | null;
          office_id?: string;
          practitioner_id?: string;
          processing_at?: string | null;
          reschedule_token?: string;
          slot_id?: string;
          status?: Database["public"]["Enums"]["appointment_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_office_id_fkey";
            columns: ["office_id"];
            isOneToOne: false;
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_practitioner_id_fkey";
            columns: ["practitioner_id"];
            isOneToOne: false;
            referencedRelation: "practitioners";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_slot_id_fkey";
            columns: ["slot_id"];
            isOneToOne: false;
            referencedRelation: "slots";
            referencedColumns: ["id"];
          },
        ];
      };
      client_field_values: {
        Row: {
          client_id: string;
          custom_field_id: string;
          id: string;
          value: string | null;
        };
        Insert: {
          client_id: string;
          custom_field_id: string;
          id?: string;
          value?: string | null;
        };
        Update: {
          client_id?: string;
          custom_field_id?: string;
          id?: string;
          value?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "client_field_values_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_field_values_custom_field_id_fkey";
            columns: ["custom_field_id"];
            isOneToOne: false;
            referencedRelation: "custom_fields";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          no_show_count: number;
          office_id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          no_show_count?: number;
          office_id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          no_show_count?: number;
          office_id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clients_office_id_fkey";
            columns: ["office_id"];
            isOneToOne: false;
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
        ];
      };
      custom_fields: {
        Row: {
          field_type: Database["public"]["Enums"]["custom_field_type"];
          id: string;
          is_active: boolean;
          is_required: boolean;
          label: string;
          office_id: string;
          options: Json | null;
          sort_order: number;
        };
        Insert: {
          field_type?: Database["public"]["Enums"]["custom_field_type"];
          id?: string;
          is_active?: boolean;
          is_required?: boolean;
          label: string;
          office_id: string;
          options?: Json | null;
          sort_order?: number;
        };
        Update: {
          field_type?: Database["public"]["Enums"]["custom_field_type"];
          id?: string;
          is_active?: boolean;
          is_required?: boolean;
          label?: string;
          office_id?: string;
          options?: Json | null;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "custom_fields_office_id_fkey";
            columns: ["office_id"];
            isOneToOne: false;
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
        ];
      };
      offices: {
        Row: {
          booking_timeout_minutes: number;
          brand_color: string | null;
          cancellation_cutoff_minutes: number;
          created_at: string;
          default_slot_minutes: number;
          id: string;
          logo_url: string | null;
          name: string;
          reminder_minutes_before: number;
          slug: string;
          welcome_message: string | null;
        };
        Insert: {
          booking_timeout_minutes?: number;
          brand_color?: string | null;
          cancellation_cutoff_minutes?: number;
          created_at?: string;
          default_slot_minutes?: number;
          id?: string;
          logo_url?: string | null;
          name: string;
          reminder_minutes_before?: number;
          slug: string;
          welcome_message?: string | null;
        };
        Update: {
          booking_timeout_minutes?: number;
          brand_color?: string | null;
          cancellation_cutoff_minutes?: number;
          created_at?: string;
          default_slot_minutes?: number;
          id?: string;
          logo_url?: string | null;
          name?: string;
          reminder_minutes_before?: number;
          slug?: string;
          welcome_message?: string | null;
        };
        Relationships: [];
      };
      practitioners: {
        Row: {
          bio: string | null;
          created_at: string;
          email: string | null;
          id: string;
          is_active: boolean;
          name: string;
          office_id: string;
        };
        Insert: {
          bio?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          office_id: string;
        };
        Update: {
          bio?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          office_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "practitioners_office_id_fkey";
            columns: ["office_id"];
            isOneToOne: false;
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
        ];
      };
      slot_types: {
        Row: {
          created_at: string;
          duration_minutes: number;
          id: string;
          is_active: boolean;
          name: string;
          office_id: string;
        };
        Insert: {
          created_at?: string;
          duration_minutes: number;
          id?: string;
          is_active?: boolean;
          name: string;
          office_id: string;
        };
        Update: {
          created_at?: string;
          duration_minutes?: number;
          id?: string;
          is_active?: boolean;
          name?: string;
          office_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "slot_types_office_id_fkey";
            columns: ["office_id"];
            isOneToOne: false;
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
        ];
      };
      slots: {
        Row: {
          created_at: string;
          ends_at: string;
          id: string;
          office_id: string;
          practitioner_id: string;
          slot_type_id: string | null;
          starts_at: string;
          status: Database["public"]["Enums"]["slot_status"];
        };
        Insert: {
          created_at?: string;
          ends_at: string;
          id?: string;
          office_id: string;
          practitioner_id: string;
          slot_type_id?: string | null;
          starts_at: string;
          status?: Database["public"]["Enums"]["slot_status"];
        };
        Update: {
          created_at?: string;
          ends_at?: string;
          id?: string;
          office_id?: string;
          practitioner_id?: string;
          slot_type_id?: string | null;
          starts_at?: string;
          status?: Database["public"]["Enums"]["slot_status"];
        };
        Relationships: [
          {
            foreignKeyName: "slots_office_id_fkey";
            columns: ["office_id"];
            isOneToOne: false;
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "slots_practitioner_id_fkey";
            columns: ["practitioner_id"];
            isOneToOne: false;
            referencedRelation: "practitioners";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "slots_slot_type_id_fkey";
            columns: ["slot_type_id"];
            isOneToOne: false;
            referencedRelation: "slot_types";
            referencedColumns: ["id"];
          },
        ];
      };
      template_slots: {
        Row: {
          day_of_week: Database["public"]["Enums"]["day_of_week"] | null;
          end_time: string;
          id: string;
          slot_type_id: string | null;
          start_time: string;
          template_id: string;
        };
        Insert: {
          day_of_week?: Database["public"]["Enums"]["day_of_week"] | null;
          end_time: string;
          id?: string;
          slot_type_id?: string | null;
          start_time: string;
          template_id: string;
        };
        Update: {
          day_of_week?: Database["public"]["Enums"]["day_of_week"] | null;
          end_time?: string;
          id?: string;
          slot_type_id?: string | null;
          start_time?: string;
          template_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "template_slots_slot_type_id_fkey";
            columns: ["slot_type_id"];
            isOneToOne: false;
            referencedRelation: "slot_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "template_slots_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "templates";
            referencedColumns: ["id"];
          },
        ];
      };
      templates: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          office_id: string;
          type: Database["public"]["Enums"]["template_type"];
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          office_id: string;
          type: Database["public"]["Enums"]["template_type"];
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          office_id?: string;
          type?: Database["public"]["Enums"]["template_type"];
        };
        Relationships: [
          {
            foreignKeyName: "templates_office_id_fkey";
            columns: ["office_id"];
            isOneToOne: false;
            referencedRelation: "offices";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_template_conflicts: {
        Args: {
          p_ends_at: string[];
          p_practitioner_id: string;
          p_starts_at: string[];
        };
        Returns: {
          conflict_ends_at: string;
          conflict_starts_at: string;
          conflict_status: Database["public"]["Enums"]["slot_status"];
        }[];
      };
      claim_stale_pending_appointments: {
        Args: { p_lock_seconds?: number };
        Returns: string[];
      };
      create_office_and_first_admin: {
        Args: {
          p_admin_email: string;
          p_admin_name: string;
          p_admin_user_id: string;
          p_office_name: string;
          p_office_slug: string;
        };
        Returns: undefined;
      };
      my_office_id: { Args: never; Returns: string };
    };
    Enums: {
      admin_invite_status: "pending" | "accepted" | "expired";
      appointment_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show";
      custom_field_type: "text" | "number" | "date" | "boolean" | "select";
      day_of_week: "0" | "1" | "2" | "3" | "4" | "5" | "6";
      slot_status: "available" | "pending" | "booked";
      template_type: "daily" | "weekly";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      admin_invite_status: ["pending", "accepted", "expired"],
      appointment_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      custom_field_type: ["text", "number", "date", "boolean", "select"],
      day_of_week: ["0", "1", "2", "3", "4", "5", "6"],
      slot_status: ["available", "pending", "booked"],
      template_type: ["daily", "weekly"],
    },
  },
} as const;

export type Office = Tables<"offices">;
export type Admin = Tables<"admins">;
export type AdminInvite = Tables<"admin_invites">;
export type Practitioner = Tables<"practitioners">;
export type SlotType = Tables<"slot_types">;
export type Template = Tables<"templates">;
export type TemplateSlot = Tables<"template_slots">;
export type Slot = Tables<"slots">;
export type CustomField = Tables<"custom_fields">;
export type Client = Tables<"clients">;
export type Appointment = Tables<"appointments">;
