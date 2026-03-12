"use client";

/**
 * Supabase auth 세션 + public.users 행을 합쳐 현재 유저 정보를 반환하는 훅.
 * RLS가 적용된 anon key(createBrowserClient)만 사용.
 *
 * 반환: { user: User | null, isLoading, error }
 * - user: types/database.ts 의 User (public.users Row). 미로그인 시 null.
 */

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";
import type { User } from "@/types/database";

export interface UseUserResult {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient();

  useEffect(() => {
    let mounted = true;

    async function fetchUser() {
      setError(null);
      try {
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError) {
          if (mounted) setError(authError.message);
          if (mounted) setUser(null);
          return;
        }
        if (!authUser) {
          if (mounted) setUser(null);
          return;
        }
        const { data: row, error: rowError } = await supabase
          .from("users")
          .select(
            "id, email, full_name, avatar_url, lemon_customer_id, subscription_id, subscription_status, subscription_plan, current_period_start, current_period_end, conversion_count, conversion_reset_at, created_at, updated_at"
          )
          .eq("id", authUser.id)
          .single();
        if (rowError || !row) {
          if (mounted) setUser(null);
          if (mounted && rowError) setError(rowError.message);
          return;
        }
        if (mounted) setUser(row as User);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      if (mounted) {
        setIsLoading(true);
        fetchUser();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, isLoading, error };
}
