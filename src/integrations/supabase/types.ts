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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          code: string
          created_at: string
          expires_at: string | null
          full_name: string
          id: string
          is_online: boolean
          notes: string | null
          package_id: string | null
          password: string
          phone: string | null
          sector_id: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["customer_status"]
          tower_id: string | null
          updated_at: string
          username: string
        }
        Insert: {
          address?: string | null
          code?: string
          created_at?: string
          expires_at?: string | null
          full_name: string
          id?: string
          is_online?: boolean
          notes?: string | null
          package_id?: string | null
          password: string
          phone?: string | null
          sector_id?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["customer_status"]
          tower_id?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          expires_at?: string | null
          full_name?: string
          id?: string
          is_online?: boolean
          notes?: string | null
          package_id?: string | null
          password?: string
          phone?: string | null
          sector_id?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["customer_status"]
          tower_id?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_tower_id_fkey"
            columns: ["tower_id"]
            isOneToOne: false
            referencedRelation: "towers"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          name: string
          notes: string | null
          tower_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          name: string
          notes?: string | null
          tower_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          name?: string
          notes?: string | null
          tower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_tower_id_fkey"
            columns: ["tower_id"]
            isOneToOne: false
            referencedRelation: "towers"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string
          data_limit_gb: number | null
          id: string
          name: string
          package_type: Database["public"]["Enums"]["package_type"]
          price: number
          speed: string | null
          updated_at: string
          validity_days: number
        }
        Insert: {
          created_at?: string
          data_limit_gb?: number | null
          id?: string
          name: string
          package_type?: Database["public"]["Enums"]["package_type"]
          price?: number
          speed?: string | null
          updated_at?: string
          validity_days?: number
        }
        Update: {
          created_at?: string
          data_limit_gb?: number | null
          id?: string
          name?: string
          package_type?: Database["public"]["Enums"]["package_type"]
          price?: number
          speed?: string | null
          updated_at?: string
          validity_days?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      recharges: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          expires_at: string
          id: string
          note: string | null
          package_id: string | null
          performed_by: string | null
          starts_at: string
          validity_days: number
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id: string
          expires_at: string
          id?: string
          note?: string | null
          package_id?: string | null
          performed_by?: string | null
          starts_at?: string
          validity_days: number
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          expires_at?: string
          id?: string
          note?: string | null
          package_id?: string | null
          performed_by?: string | null
          starts_at?: string
          validity_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "recharges_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recharges_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      sectors: {
        Row: {
          created_at: string
          id: string
          name: string
          tower_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          tower_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          tower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sectors_tower_id_fkey"
            columns: ["tower_id"]
            isOneToOne: false
            referencedRelation: "towers"
            referencedColumns: ["id"]
          },
        ]
      }
      towers: {
        Row: {
          created_at: string
          id: string
          location: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
      complaints: {
        Row: {
          id: string
          customer_id: string | null
          subject: string
          description: string | null
          priority: "low" | "medium" | "high" | "urgent"
          status: "open" | "inProgress" | "resolved" | "closed"
          assigned_to: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id?: string | null
          subject: string
          description?: string | null
          priority?: "low" | "medium" | "high" | "urgent"
          status?: "open" | "inProgress" | "resolved" | "closed"
          assigned_to?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string | null
          subject?: string
          description?: string | null
          priority?: "low" | "medium" | "high" | "urgent"
          status?: "open" | "inProgress" | "resolved" | "closed"
          assigned_to?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          title: string
          message: string | null
          type: "info" | "warning" | "success" | "error"
          is_read: boolean
          user_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          message?: string | null
          type?: "info" | "warning" | "success" | "error"
          is_read?: boolean
          user_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          message?: string | null
          type?: "info" | "warning" | "success" | "error"
          is_read?: boolean
          user_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          id: string
          customer_id: string | null
          invoice_number: number | null
          amount: number
          status: "unpaid" | "paid" | "overdue"
          due_date: string | null
          notes: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id?: string | null
          invoice_number?: number | null
          amount?: number
          status?: "unpaid" | "paid" | "overdue"
          due_date?: string | null
          notes?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string | null
          invoice_number?: number | null
          amount?: number
          status?: "unpaid" | "paid" | "overdue"
          due_date?: string | null
          notes?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          id: string
          customer_id: string | null
          invoice_id: string | null
          amount: number
          method: "cash" | "bank" | "online"
          reference: string | null
          notes: string | null
          received_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id?: string | null
          invoice_id?: string | null
          amount?: number
          method?: "cash" | "bank" | "online"
          reference?: string | null
          notes?: string | null
          received_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string | null
          invoice_id?: string | null
          amount?: number
          method?: "cash" | "bank" | "online"
          reference?: string | null
          notes?: string | null
          received_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      routers: {
        Row: {
          id: string
          name: string
          ip_address: string | null
          model: string | null
          api_port: number | null
          username: string | null
          password: string | null
          location: string | null
          is_online: boolean
          client_count: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          ip_address?: string | null
          model?: string | null
          api_port?: number | null
          username?: string | null
          password?: string | null
          location?: string | null
          is_online?: boolean
          client_count?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          ip_address?: string | null
          model?: string | null
          api_port?: number | null
          username?: string | null
          password?: string | null
          location?: string | null
          is_online?: boolean
          client_count?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      hotspot_cards: {
        Row: {
          id: string
          code: string
          profile: string | null
          validity_days: number
          bandwidth_limit: string | null
          status: "unused" | "active" | "expired" | "revoked"
          router_id: string | null
          used_by: string | null
          used_at: string | null
          expires_at: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          profile?: string | null
          validity_days?: number
          bandwidth_limit?: string | null
          status?: "unused" | "active" | "expired" | "revoked"
          router_id?: string | null
          used_by?: string | null
          used_at?: string | null
          expires_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          profile?: string | null
          validity_days?: number
          bandwidth_limit?: string | null
          status?: "unused" | "active" | "expired" | "revoked"
          router_id?: string | null
          used_by?: string | null
          used_at?: string | null
          expires_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotspot_cards_router_id_fkey"
            columns: ["router_id"]
            isOneToOne: false
            referencedRelation: "routers"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          id: number
          company_name: string
          company_email: string | null
          company_phone: string | null
          currency: string
          timezone: string
          invoice_prefix: string
          invoice_due_days: number
          tax_rate: number
          default_network_profile: string | null
          smtp_host: string | null
          smtp_port: number | null
          smtp_user: string | null
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          company_name?: string
          company_email?: string | null
          company_phone?: string | null
          currency?: string
          timezone?: string
          invoice_prefix?: string
          invoice_due_days?: number
          tax_rate?: number
          default_network_profile?: string | null
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          company_name?: string
          company_email?: string | null
          company_phone?: string | null
          currency?: string
          timezone?: string
          invoice_prefix?: string
          invoice_due_days?: number
          tax_rate?: number
          default_network_profile?: string | null
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          logo_url?: string | null
          updated_at?: string
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
      app_role: "admin" | "recharge" | "viewer"
      customer_status: "active" | "suspended" | "expired" | "pending"
      package_type: "quota" | "unlimited"
      service_type: "pppoe" | "hotspot"
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
      app_role: ["admin", "recharge", "viewer"],
      customer_status: ["active", "suspended", "expired", "pending"],
      package_type: ["quota", "unlimited"],
      service_type: ["pppoe", "hotspot"],
    },
  },
} as const
