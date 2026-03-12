/**
 * Stripe 서버 전용 클라이언트.
 *
 * 사용 위치: API Route, Server Action, Webhook Handler (api/webhooks/stripe 등).
 * 주의: 'use client' 파일에서 import 금지. 서버에서만 사용.
 *
 * Supabase: Stripe 연동 시 결제/구독 정보 저장은 createAdminClient 사용 (API Route/Server Action).
 */

import Stripe from "stripe";

const secret = process.env.STRIPE_SECRET_KEY;
if (!secret) {
  console.warn("[stripe] STRIPE_SECRET_KEY is not set; Stripe APIs will throw.");
}

/**
 * 서버 전용 Stripe 인스턴스.
 * 사용: createCheckoutSession, createPortalSession, webhook signature 검증 등.
 */
export const stripe = new Stripe(secret ?? "", {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
