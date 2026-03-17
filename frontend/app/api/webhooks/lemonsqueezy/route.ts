/**
 * Lemon Squeezy Webhook.
 *
 * x-signature: HMAC-SHA256(rawBody, LEMONSQUEEZY_WEBHOOK_SECRET) hex와 일치 검증.
 * lemon_webhook_events에 event_id 삽입으로 멱등성 체크(23505 unique violation 시 이미 처리된 이벤트로 200 반환).
 * Supabase: createAdminClient(service_role) 사용.
 */

import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase";
import type { SubscriptionPlan } from "@/types/database";

const WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
const STARTER_VARIANT_ID = process.env.LEMONSQUEEZY_STARTER_VARIANT_ID;
const PRO_VARIANT_ID = process.env.LEMONSQUEEZY_PRO_VARIANT_ID;
const PAY_PER_USE_VARIANT_ID = process.env.LEMONSQUEEZY_PAY_PER_USE_VARIANT_ID;

function variantIdToPlan(variantId: number | string): SubscriptionPlan {
  const v = String(variantId);
  if (v === STARTER_VARIANT_ID) return "starter";
  if (v === PRO_VARIANT_ID) return "pro";
  if (PAY_PER_USE_VARIANT_ID && v === PAY_PER_USE_VARIANT_ID) return "pay_per_use";
  return "free";
}

/** order_created에서 pay_per_use(일회성 결제) 여부 판별 */
function isPayPerUseOrder(
  attrs: Record<string, unknown>,
  customData: Record<string, string>
): boolean {
  const variantId = attrs.variant_id != null ? String(attrs.variant_id) : null;
  if (PAY_PER_USE_VARIANT_ID && variantId === PAY_PER_USE_VARIANT_ID) return true;
  const variantName = (attrs.variant_name as string) ?? "";
  const vn = variantName.toLowerCase();
  if (vn === "pay_per_use" || vn === "pay-per-use") return true;
  const plan = (customData.plan ?? "").toLowerCase();
  if (plan === "pay_per_use" || plan === "pay-per-use") return true;
  return false;
}

function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET || !signature) return false;
  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  const digest = hmac.update(rawBody, "utf8").digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(signature, "hex"));
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-signature");
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: {
    meta?: { event_name?: string; custom_data?: Record<string, unknown> };
    data?: {
      id?: string;
      type?: string;
      attributes?: Record<string, unknown>;
    };
  };
  try {
    payload = JSON.parse(rawBody) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = payload.meta?.event_name;
  if (!eventName) {
    return NextResponse.json({ error: "Missing event_name" }, { status: 400 });
  }

  const lemonEventId = crypto.createHash("sha256").update(rawBody).digest("hex");
  const supabase = createAdminClient();

  const { error: idemError } = await supabase
    .from("lemon_webhook_events")
    .insert({ event_id: lemonEventId });
  if (idemError) {
    if (idemError.code === "23505") {
      return NextResponse.json({ received: true });
    }
    Sentry.captureException(idemError);
    console.error("[webhooks/lemonsqueezy] lemon_webhook_events insert error:", idemError);
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }

  const customData = (payload.meta?.custom_data ?? {}) as Record<string, string>;
  let userId: string | null = customData.user_id ?? customData.userId ?? null;
  const planFromCustom = (customData.plan as SubscriptionPlan) ?? "free";

  const data = payload.data;
  const attrs = data?.attributes ?? {};
  const subscriptionId = data?.id != null ? String(data.id) : null;

  if (!userId && subscriptionId) {
    const { data: u } = await supabase
      .from("users")
      .select("id")
      .eq("subscription_id", subscriptionId)
      .single();
    userId = u?.id ?? null;
  }

  const { data: eventRow, error: insertErr } = await supabase
    .from("subscription_events")
    .insert({
      user_id: userId ?? "",
      lemon_event_id: lemonEventId,
      event_type: eventName,
      lemon_data: payload as unknown as Record<string, unknown>,
      processed: false,
    })
    .select("id")
    .single();
  if (insertErr) {
    console.error("[webhooks/lemonsqueezy] insert event", insertErr);
    return NextResponse.json({ error: "Failed to store event" }, { status: 500 });
  }

  try {
    const targetUserId = userId;

    if (targetUserId) {
      const now = new Date().toISOString();
      const renewsAt = attrs.renews_at as string | undefined;
      const endsAt = attrs.ends_at as string | undefined;
      const variantId = attrs.variant_id as number | string | undefined;

      switch (eventName) {
        case "order_created": {
          if (isPayPerUseOrder(attrs, customData)) {
            await supabase
              .from("users")
              .update({
                subscription_plan: "pay_per_use",
                subscription_status: "active",
                conversion_count: 0,
                updated_at: now,
              })
              .eq("id", targetUserId);
          } else {
            await supabase
              .from("users")
              .update({
                subscription_status: "active",
                subscription_plan: planFromCustom,
                updated_at: now,
              })
              .eq("id", targetUserId);
          }
          break;
        }
        case "subscription_created": {
          const plan = variantId != null ? variantIdToPlan(variantId) : planFromCustom;
          await supabase
            .from("users")
            .update({
              subscription_id: subscriptionId,
              subscription_status: "active",
              subscription_plan: plan,
              current_period_end: renewsAt ?? null,
              updated_at: now,
            })
            .eq("id", targetUserId);
          break;
        }
        case "subscription_payment_success": {
          await supabase
            .from("users")
            .update({
              current_period_end: renewsAt ?? null,
              updated_at: now,
            })
            .eq("id", targetUserId);
          break;
        }
        case "subscription_payment_failed": {
          await supabase
            .from("users")
            .update({
              subscription_status: "past_due",
              updated_at: now,
            })
            .eq("id", targetUserId);
          break;
        }
        case "subscription_expired":
        case "subscription_cancelled": {
          await supabase
            .from("users")
            .update({
              subscription_status: "canceled",
              subscription_plan: "free",
              subscription_id: null,
              current_period_end: null,
              updated_at: now,
            })
            .eq("id", targetUserId);
          break;
        }
        case "subscription_updated": {
          const plan = variantId != null ? variantIdToPlan(variantId) : planFromCustom;
          await supabase
            .from("users")
            .update({
              subscription_plan: plan,
              current_period_end: renewsAt ?? undefined,
              subscription_status: (attrs.status as string) === "cancelled" ? "canceled" : "active",
              updated_at: now,
            })
            .eq("id", targetUserId);
          break;
        }
        default:
          break;
      }
    }

    await supabase
      .from("subscription_events")
      .update({ processed: true })
      .eq("id", eventRow.id);
  } catch (e) {
    Sentry.captureException(e);
    console.error("[webhooks/lemonsqueezy]", eventName, e);
    await supabase
      .from("subscription_events")
      .update({ error: e instanceof Error ? e.message : "unknown" })
      .eq("id", eventRow.id);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
