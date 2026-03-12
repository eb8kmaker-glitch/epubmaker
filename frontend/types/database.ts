/**
 * Supabase Database 타입 정의.
 *
 * 사용: createBrowserClient<Database>(), createServerClient<Database>(),
 *      createAdminClient<Database>() 에 제네릭으로 전달하거나,
 *      supabase.from("table") 호출 시 자동 추론용.
 *
 * 패턴: Database['public']['Tables']['users']['Row']
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** public.users.subscription_status */
export type SubscriptionStatus =
  | "free"
  | "active"
  | "canceled"
  | "past_due"
  | "trialing";

/** public.users.subscription_plan */
export type SubscriptionPlan = "free" | "starter" | "pro" | "pay_per_use";

/** @deprecated Use SubscriptionPlan. Kept for backward compatibility. */
export type PlanSlug = SubscriptionPlan;

/** public.conversions.status */
export type ConversionStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

/** public.conversions.input_format */
export type InputFormat = "docx" | "txt";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          lemon_customer_id: string | null;
          subscription_id: string | null;
          subscription_status: SubscriptionStatus;
          subscription_plan: SubscriptionPlan;
          current_period_start: string | null;
          current_period_end: string | null;
          conversion_count: number;
          conversion_reset_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          lemon_customer_id?: string | null;
          subscription_id?: string | null;
          subscription_status?: SubscriptionStatus;
          subscription_plan?: SubscriptionPlan;
          current_period_start?: string | null;
          current_period_end?: string | null;
          conversion_count?: number;
          conversion_reset_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          lemon_customer_id?: string | null;
          subscription_id?: string | null;
          subscription_status?: SubscriptionStatus;
          subscription_plan?: SubscriptionPlan;
          current_period_start?: string | null;
          current_period_end?: string | null;
          conversion_count?: number;
          conversion_reset_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversions: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          original_filename: string;
          original_size_bytes: number;
          input_format: InputFormat;
          output_format: string;
          status: ConversionStatus;
          error_message: string | null;
          storage_path: string | null;
          expires_at: string | null;
          options: Json | null;
          ip_address: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id?: string | null;
          original_filename: string;
          original_size_bytes: number;
          input_format: InputFormat;
          output_format: string;
          status?: ConversionStatus;
          error_message?: string | null;
          storage_path?: string | null;
          expires_at?: string | null;
          options?: Json | null;
          ip_address?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string | null;
          original_filename?: string;
          original_size_bytes?: number;
          input_format?: InputFormat;
          output_format?: string;
          status?: ConversionStatus;
          error_message?: string | null;
          storage_path?: string | null;
          expires_at?: string | null;
          options?: Json | null;
          ip_address?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      subscription_events: {
        Row: {
          id: string;
          user_id: string;
          lemon_event_id: string;
          event_type: string;
          lemon_data: Json | null;
          processed: boolean;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lemon_event_id: string;
          event_type: string;
          lemon_data?: Json | null;
          processed?: boolean;
          error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          lemon_event_id?: string;
          event_type?: string;
          lemon_data?: Json | null;
          processed?: boolean;
          error?: string | null;
          created_at?: string;
        };
      };
      waitlist: {
        Row: {
          id: string;
          email: string;
          source: string | null;
          ip_address: string | null;
          subscribed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          source?: string | null;
          ip_address?: string | null;
          subscribed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          source?: string | null;
          ip_address?: string | null;
          subscribed?: boolean;
          created_at?: string;
        };
      };
      /** Lemon Squeezy webhook 멱등성: event_id 중복 시 재처리 스킵 */
      lemon_webhook_events: {
        Row: { event_id: string; created_at: string };
        Insert: { event_id: string; created_at?: string };
        Update: { event_id?: string; created_at?: string };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      subscription_status: SubscriptionStatus;
      subscription_plan: SubscriptionPlan;
      conversion_status: ConversionStatus;
      input_format: InputFormat;
    };
  };
}

/** 편의용: public.users Row */
export type User = Database["public"]["Tables"]["users"]["Row"];

/** 편의용: public.users Insert */
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];

/** 편의용: public.users Update */
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

/** 편의용: public.conversions Row */
export type Conversion = Database["public"]["Tables"]["conversions"]["Row"];

/** 편의용: public.conversions Insert */
export type ConversionInsert = Database["public"]["Tables"]["conversions"]["Insert"];

/** 편의용: public.conversions Update */
export type ConversionUpdate = Database["public"]["Tables"]["conversions"]["Update"];

/** 편의용: public.subscription_events Row */
export type SubscriptionEvent =
  Database["public"]["Tables"]["subscription_events"]["Row"];

/** 편의용: public.subscription_events Insert */
export type SubscriptionEventInsert =
  Database["public"]["Tables"]["subscription_events"]["Insert"];

/** 편의용: public.subscription_events Update */
export type SubscriptionEventUpdate =
  Database["public"]["Tables"]["subscription_events"]["Update"];

/** 편의용: public.waitlist Row */
export type Waitlist = Database["public"]["Tables"]["waitlist"]["Row"];

/** 편의용: public.waitlist Insert */
export type WaitlistInsert = Database["public"]["Tables"]["waitlist"]["Insert"];

/** 편의용: public.waitlist Update */
export type WaitlistUpdate = Database["public"]["Tables"]["waitlist"]["Update"];
