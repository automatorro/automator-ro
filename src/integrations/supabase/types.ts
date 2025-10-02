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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      course_materials: {
        Row: {
          approval_status: string | null
          approved_content: string | null
          content: string | null
          course_id: string
          created_at: string
          download_url: string | null
          edited_at: string | null
          file_path: string | null
          file_size: number | null
          id: string
          material_type: string
          status: string
          step_order: number
          title: string
          updated_at: string
        }
        Insert: {
          approval_status?: string | null
          approved_content?: string | null
          content?: string | null
          course_id: string
          created_at?: string
          download_url?: string | null
          edited_at?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          material_type: string
          status?: string
          step_order: number
          title: string
          updated_at?: string
        }
        Update: {
          approval_status?: string | null
          approved_content?: string | null
          content?: string | null
          course_id?: string
          created_at?: string
          download_url?: string | null
          edited_at?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          material_type?: string
          status?: string
          step_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          duration: string
          environment: string
          id: string
          language: string
          level: string
          status: string
          subject: string
          title: string
          tone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration: string
          environment: string
          id?: string
          language?: string
          level: string
          status?: string
          subject: string
          title: string
          tone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: string
          environment?: string
          id?: string
          language?: string
          level?: string
          status?: string
          subject?: string
          title?: string
          tone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generation_pipelines: {
        Row: {
          course_id: string
          created_at: string
          current_material_id: string | null
          current_step: number | null
          error_message: string | null
          id: string
          progress_percent: number | null
          status: string
          step_data: Json | null
          total_steps: number | null
          updated_at: string
          waiting_for_approval: boolean | null
        }
        Insert: {
          course_id: string
          created_at?: string
          current_material_id?: string | null
          current_step?: number | null
          error_message?: string | null
          id?: string
          progress_percent?: number | null
          status?: string
          step_data?: Json | null
          total_steps?: number | null
          updated_at?: string
          waiting_for_approval?: boolean | null
        }
        Update: {
          course_id?: string
          created_at?: string
          current_material_id?: string | null
          current_step?: number | null
          error_message?: string | null
          id?: string
          progress_percent?: number | null
          status?: string
          step_data?: Json | null
          total_steps?: number | null
          updated_at?: string
          waiting_for_approval?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "generation_pipelines_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_pipelines_current_material_id_fkey"
            columns: ["current_material_id"]
            isOneToOne: false
            referencedRelation: "course_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_steps: {
        Row: {
          ai_prompt_template: string
          created_at: string
          dependencies: string[] | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          material_type: string
          step_name: string
          step_order: number
        }
        Insert: {
          ai_prompt_template: string
          created_at?: string
          dependencies?: string[] | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          material_type: string
          step_name: string
          step_order: number
        }
        Update: {
          ai_prompt_template?: string
          created_at?: string
          dependencies?: string[] | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          material_type?: string
          step_name?: string
          step_order?: number
        }
        Relationships: []
      }
      jobs: {
        Row: {
          completedAt: string | null
          createdAt: string | null
          currentStep: number | null
          downloadExpiry: string | null
          downloadUrl: string | null
          error: string | null
          id: string
          metadata: Json | null
          progressPercent: number | null
          status: Database["public"]["Enums"]["job_status"] | null
          statusMessage: string | null
          stepName: string | null
          totalSteps: number | null
          updatedAt: string | null
          userId: string
        }
        Insert: {
          completedAt?: string | null
          createdAt?: string | null
          currentStep?: number | null
          downloadExpiry?: string | null
          downloadUrl?: string | null
          error?: string | null
          id?: string
          metadata?: Json | null
          progressPercent?: number | null
          status?: Database["public"]["Enums"]["job_status"] | null
          statusMessage?: string | null
          stepName?: string | null
          totalSteps?: number | null
          updatedAt?: string | null
          userId: string
        }
        Update: {
          completedAt?: string | null
          createdAt?: string | null
          currentStep?: number | null
          downloadExpiry?: string | null
          downloadUrl?: string | null
          error?: string | null
          id?: string
          metadata?: Json | null
          progressPercent?: number | null
          status?: Database["public"]["Enums"]["job_status"] | null
          statusMessage?: string | null
          stepName?: string | null
          totalSteps?: number | null
          updatedAt?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      material_versions: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          material_id: string
          version_number: number
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          material_id: string
          version_number?: number
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          material_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "material_versions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "course_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          content: string | null
          createdAt: string | null
          downloadExpiry: string | null
          downloadUrl: string | null
          file_size: number | null
          format: string
          id: string
          jobId: string
          name: string
          stepNumber: number | null
          storage_path: string | null
          type: string
        }
        Insert: {
          content?: string | null
          createdAt?: string | null
          downloadExpiry?: string | null
          downloadUrl?: string | null
          file_size?: number | null
          format: string
          id?: string
          jobId: string
          name: string
          stepNumber?: number | null
          storage_path?: string | null
          type: string
        }
        Update: {
          content?: string | null
          createdAt?: string | null
          downloadExpiry?: string | null
          downloadUrl?: string | null
          file_size?: number | null
          format?: string
          id?: string
          jobId?: string
          name?: string
          stepNumber?: number | null
          storage_path?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_jobId_fkey"
            columns: ["jobId"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          created_at: string | null
          customer_id: string
          deleted_at: string | null
          id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          deleted_at?: string | null
          id?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          deleted_at?: string | null
          id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stripe_orders: {
        Row: {
          amount_subtotal: number
          amount_total: number
          checkout_session_id: string
          created_at: string | null
          currency: string
          customer_id: string
          deleted_at: string | null
          id: number
          payment_intent_id: string
          payment_status: string
          status: Database["public"]["Enums"]["stripe_order_status"]
          updated_at: string | null
        }
        Insert: {
          amount_subtotal: number
          amount_total: number
          checkout_session_id: string
          created_at?: string | null
          currency: string
          customer_id: string
          deleted_at?: string | null
          id?: number
          payment_intent_id: string
          payment_status: string
          status?: Database["public"]["Enums"]["stripe_order_status"]
          updated_at?: string | null
        }
        Update: {
          amount_subtotal?: number
          amount_total?: number
          checkout_session_id?: string
          created_at?: string | null
          currency?: string
          customer_id?: string
          deleted_at?: string | null
          id?: number
          payment_intent_id?: string
          payment_status?: string
          status?: Database["public"]["Enums"]["stripe_order_status"]
          updated_at?: string | null
        }
        Relationships: []
      }
      stripe_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: number | null
          current_period_start: number | null
          customer_id: string
          deleted_at: string | null
          id: number
          payment_method_brand: string | null
          payment_method_last4: string | null
          price_id: string | null
          status: Database["public"]["Enums"]["stripe_subscription_status"]
          subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: number | null
          current_period_start?: number | null
          customer_id: string
          deleted_at?: string | null
          id?: number
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          price_id?: string | null
          status: Database["public"]["Enums"]["stripe_subscription_status"]
          subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: number | null
          current_period_start?: number | null
          customer_id?: string
          deleted_at?: string | null
          id?: number
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          price_id?: string | null
          status?: Database["public"]["Enums"]["stripe_subscription_status"]
          subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          createdAt: string | null
          email: string
          generationsRemaining: number | null
          id: string
          planType: Database["public"]["Enums"]["plan_type"] | null
          stripeCustomerId: string | null
          stripeSubscriptionId: string | null
          subscriptionRenewalDate: string | null
          subscriptionStartDate: string | null
          trial_ends_at: string | null
          trial_used: boolean | null
        }
        Insert: {
          createdAt?: string | null
          email: string
          generationsRemaining?: number | null
          id: string
          planType?: Database["public"]["Enums"]["plan_type"] | null
          stripeCustomerId?: string | null
          stripeSubscriptionId?: string | null
          subscriptionRenewalDate?: string | null
          subscriptionStartDate?: string | null
          trial_ends_at?: string | null
          trial_used?: boolean | null
        }
        Update: {
          createdAt?: string | null
          email?: string
          generationsRemaining?: number | null
          id?: string
          planType?: Database["public"]["Enums"]["plan_type"] | null
          stripeCustomerId?: string | null
          stripeSubscriptionId?: string | null
          subscriptionRenewalDate?: string | null
          subscriptionStartDate?: string | null
          trial_ends_at?: string | null
          trial_used?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_subscription_limits: {
        Args: { p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      job_status: "pending" | "processing" | "completed" | "failed"
      plan_type: "free" | "basic" | "pro" | "enterprise"
      stripe_order_status: "pending" | "completed" | "canceled"
      stripe_subscription_status:
        | "not_started"
        | "incomplete"
        | "incomplete_expired"
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "paused"
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
      job_status: ["pending", "processing", "completed", "failed"],
      plan_type: ["free", "basic", "pro", "enterprise"],
      stripe_order_status: ["pending", "completed", "canceled"],
      stripe_subscription_status: [
        "not_started",
        "incomplete",
        "incomplete_expired",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "paused",
      ],
    },
  },
} as const
