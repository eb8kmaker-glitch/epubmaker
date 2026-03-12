/**
 * Stripe Webhook: 결제/구독 이벤트 처리.
 *
 * Supabase: createAdminClient() — RLS 우회하여 profiles 업데이트 (stripe_subscription_id, plan 등).
 * Stripe: stripe.webhooks.constructEvent() 로 서명 검증 후 이벤트별 처리.
 *
 * 주의: 클라이언트에서 사용하지 않음. Stripe Dashboard에서 Webhook URL만 설정.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    if (!STRIPE_WEBHOOK_SECRET) {
      console.error("[webhooks/stripe] STRIPE_WEBHOOK_SECRET is not set");
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 500 }
      );
    }

    const body = await request.text();
    const sig = request.headers.get("stripe-signature");
    if (!sig) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error("[webhooks/stripe] Signature verification failed", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { error: insertError } = await supabase
      .from("lemon_webhook_events")
      .insert({ event_id: event.id });
    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ received: true });
      }
      console.error("[webhooks/stripe] lemon_webhook_events insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to record event" },
        { status: 500 }
      );
    }

    switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      const subscriptionId = session.subscription as string | null;
      if (!userId || !subscriptionId) break;

      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = sub.items.data[0]?.price.id;
      const planSlug = priceIdToPlanSlug(priceId);

      await supabase
        .from("profiles")
        .update({
          stripe_subscription_id: subscriptionId,
          plan: planSlug,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();
      if (!profile) break;

      if (event.type === "customer.subscription.deleted") {
        await supabase
          .from("profiles")
          .update({
            stripe_subscription_id: null,
            plan: "free",
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id);
      } else {
        const priceId = sub.items.data[0]?.price.id;
        const planSlug = priceIdToPlanSlug(priceId);
        await supabase
          .from("profiles")
          .update({
            plan: planSlug,
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id);
      }
      break;
    }
    default:
      // ignore other events
      break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhooks/stripe] Unexpected error", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

function priceIdToPlanSlug(priceId: string | undefined): "free" | "starter" | "pro" | "pay" | "publisher" {
  if (!priceId) return "free";
  if (priceId === process.env.STRIPE_PRICE_STARTER) return "starter";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  return "free";
}
