"use client";

/**
 * 플랜별 변환 한도 (월간 또는 일간).
 *
 * 사용 위치: Client Component. useUser()의 profile.plan 과 함께 사용.
 * Supabase: 이 훅은 클라이언트만 사용. 한도 수치는 프론트 상수로 두고,
 *           실제 사용량 조회는 API/Server에서 createServerClient 또는 createAdminClient로 DB 조회.
 */

import type { SubscriptionPlan } from "@/types/database";

/** 플랜별 변환 한도. pay_per_use는 건당 1회(결제 후 즉시 리셋). */
export const CONVERSION_LIMITS: Record<SubscriptionPlan, number> = {
  free: 5,
  starter: 100,
  pro: 999999,
  pay_per_use: 1,
};

export interface UseConversionLimitResult {
  plan: SubscriptionPlan;
  limit: number;
  /** 현재 사용량은 API에서 조회 후 props로 넘기거나 별도 훅으로 fetch */
  usage: number | null;
  remaining: number | null;
  isUnlimited: boolean;
}

/**
 * 플랜별 한도 값 반환.
 * pay_per_use: 구독 아님, conversion_count >= 1 이면 차단(건당 1회).
 * usage는 부모에서 API로 조회한 값을 넘기거나, 별도 useConversionUsage 훅으로 채울 수 있음.
 */
export function useConversionLimit(
  plan: SubscriptionPlan,
  usage: number | null = null
): UseConversionLimitResult {
  const limit = CONVERSION_LIMITS[plan] ?? CONVERSION_LIMITS.free;
  const isUnlimited = limit >= 999999;
  const remaining =
    usage !== null ? Math.max(0, limit - usage) : null;

  return {
    plan,
    limit,
    usage,
    remaining,
    isUnlimited,
  };
}
