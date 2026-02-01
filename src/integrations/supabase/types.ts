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
      categories: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_content: {
        Row: {
          blocks: Json
          created_at: string
          id: string
          is_published: boolean
          page_slug: string
          published_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          blocks?: Json
          created_at?: string
          id?: string
          is_published?: boolean
          page_slug: string
          published_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          blocks?: Json
          created_at?: string
          id?: string
          is_published?: boolean
          page_slug?: string
          published_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_versions: {
        Row: {
          blocks: Json
          created_at: string
          id: string
          notes: string | null
          page_id: string
          version_number: number
        }
        Insert: {
          blocks: Json
          created_at?: string
          id?: string
          notes?: string | null
          page_id: string
          version_number: number
        }
        Update: {
          blocks?: Json
          created_at?: string
          id?: string
          notes?: string | null
          page_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "page_versions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "page_content"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          attendance_status: string
          id: string
          notes: string | null
          notified_at: string | null
          participant_email: string
          participant_name: string
          participant_phone: string | null
          registered_at: string
          status: string
          training_id: string
          user_id: string | null
        }
        Insert: {
          attendance_status?: string
          id?: string
          notes?: string | null
          notified_at?: string | null
          participant_email: string
          participant_name: string
          participant_phone?: string | null
          registered_at?: string
          status?: string
          training_id: string
          user_id?: string | null
        }
        Update: {
          attendance_status?: string
          id?: string
          notes?: string | null
          notified_at?: string | null
          participant_email?: string
          participant_name?: string
          participant_phone?: string | null
          registered_at?: string
          status?: string
          training_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registrations_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          created_at: string
          external_link: string | null
          file_path: string | null
          file_url: string | null
          id: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_link?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_link?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_attachments: {
        Row: {
          file_type: string
          file_url: string
          id: string
          name: string
          training_id: string
          uploaded_at: string
        }
        Insert: {
          file_type: string
          file_url: string
          id?: string
          name: string
          training_id: string
          uploaded_at?: string
        }
        Update: {
          file_type?: string
          file_url?: string
          id?: string
          name?: string
          training_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_attachments_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      training_updates: {
        Row: {
          id: string
          message: string
          new_value: string | null
          previous_value: string | null
          timestamp: string
          training_id: string | null
          training_name: string
          type: string
        }
        Insert: {
          id?: string
          message: string
          new_value?: string | null
          previous_value?: string | null
          timestamp?: string
          training_id?: string | null
          training_name: string
          type: string
        }
        Update: {
          id?: string
          message?: string
          new_value?: string | null
          previous_value?: string | null
          timestamp?: string
          training_id?: string | null
          training_name?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_updates_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      trainings: {
        Row: {
          available_slots: number
          category_id: string | null
          created_at: string
          date: string
          description: string
          display_order: number | null
          duration: string | null
          end_date: string | null
          external_link: string | null
          hero_image: string | null
          id: string
          is_featured: boolean
          is_recommended: boolean
          is_registration_open: boolean
          location: string | null
          max_registrations: number
          name: string
          registration_method: string
          short_description: string | null
          speakers: string | null
          status: string
          target_audience: string | null
          time_from: string | null
          time_to: string | null
          updated_at: string
        }
        Insert: {
          available_slots?: number
          category_id?: string | null
          created_at?: string
          date: string
          description?: string
          display_order?: number | null
          duration?: string | null
          end_date?: string | null
          external_link?: string | null
          hero_image?: string | null
          id?: string
          is_featured?: boolean
          is_recommended?: boolean
          is_registration_open?: boolean
          location?: string | null
          max_registrations?: number
          name: string
          registration_method?: string
          short_description?: string | null
          speakers?: string | null
          status?: string
          target_audience?: string | null
          time_from?: string | null
          time_to?: string | null
          updated_at?: string
        }
        Update: {
          available_slots?: number
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string
          display_order?: number | null
          duration?: string | null
          end_date?: string | null
          external_link?: string | null
          hero_image?: string | null
          id?: string
          is_featured?: boolean
          is_recommended?: boolean
          is_registration_open?: boolean
          location?: string | null
          max_registrations?: number
          name?: string
          registration_method?: string
          short_description?: string | null
          speakers?: string | null
          status?: string
          target_audience?: string | null
          time_from?: string | null
          time_to?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
