/**
 * Supabase client factory for Next.js App Router.
 *
 * 사용처별 클라이언트:
 * - Client Component / 브라우저 훅 → createBrowserClient()
 * - Server Component, Route Handler, Server Action → createServerClient()
 * - API Route, Server Action (RLS 우회 필요 시) → createAdminClient()
 *
 * 환경변수:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - SUPABASE_SERVICE_ROLE_KEY (서버 전용, createAdminClient)
 */

import { createBrowserClient as createBrowserClientSSR } from "@supabase/ssr";
import { createServerClient as createServerClientSSR } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * 클라이언트 전용 Supabase 인스턴스.
 *
 * 사용 위치: Client Component ("use client"), 브라우저 전용 훅/유틸
 * 주의: 서버 컴포넌트, API Route, Server Action, 미들웨어에서는 사용 금지.
 *       서버에서는 createServerClient 또는 createAdminClient 사용.
 */
export function createBrowserClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing env: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  return createBrowserClientSSR(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

/**
 * 서버 전용 Supabase 인스턴스 (anon key, 쿠키 기반 세션).
 *
 * 사용 위치: Server Component, Route Handler, Server Action
 * 주의: cookies() 사용으로 반드시 서버 컨텍스트에서만 호출.
 *       Next.js 15+ 에서는 cookies()가 비동기이므로 호출부는 async 유지.
 */
export async function createServerClient(): Promise<SupabaseClient> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing env: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return createServerClientSSR(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component 등에서 setAll 호출 시 무시 (미들웨어에서 갱신)
        }
      },
    },
  });
}

/**
 * 서버 전용 Admin 클라이언트 (service_role key).
 *
 * 사용 위치: API Route, Server Action, 백그라운드 작업 등 서버 전용 코드
 * 주의: 절대 클라이언트 번들에 포함되면 안 됨. 'use client' 파일에서 import 금지.
 *       RLS를 우회하므로 신뢰할 수 있는 서버 로직에서만 사용.
 */
export function createAdminClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
