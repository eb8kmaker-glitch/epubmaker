/**
 * Lemon Squeezy API 클라이언트 (서버 전용).
 *
 * 사용 위치: API Route, Server Action 등 서버 전용.
 * 환경변수: LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID,
 *          LEMONSQUEEZY_STARTER_VARIANT_ID, LEMONSQUEEZY_PRO_VARIANT_ID
 */

import {
  lemonSqueezySetup,
  createCheckout as lsCreateCheckout,
  getCustomer,
} from "@lemonsqueezy/lemonsqueezy.js";

const apiKey = process.env.LEMONSQUEEZY_API_KEY;
const storeId = process.env.LEMONSQUEEZY_STORE_ID;
const starterVariantId = process.env.LEMONSQUEEZY_STARTER_VARIANT_ID;
const proVariantId = process.env.LEMONSQUEEZY_PRO_VARIANT_ID;

export const LEMON_STORE_ID = storeId;
export const LEMON_STARTER_VARIANT_ID = starterVariantId;
export const LEMON_PRO_VARIANT_ID = proVariantId;

let initialized = false;

function ensureSetup(): void {
  if (!apiKey) {
    throw new Error("Missing env: LEMONSQUEEZY_API_KEY");
  }
  if (!initialized) {
    lemonSqueezySetup({ apiKey });
    initialized = true;
  }
}

export type CheckoutPlan = "starter" | "pro";

export interface CreateCheckoutParams {
  variantId: string;
  custom: { userId: string; plan: CheckoutPlan };
  redirectUrl?: string;
  email?: string;
}

/**
 * Checkout URL 생성.
 * @returns checkout URL (결제 페이지)
 */
export async function createCheckout(params: CreateCheckoutParams): Promise<{ url: string }> {
  ensureSetup();
  if (!storeId) throw new Error("Missing env: LEMONSQUEEZY_STORE_ID");

  const { data, error, statusCode } = await lsCreateCheckout(
    storeId,
    params.variantId,
    {
      checkoutData: {
        custom: {
          user_id: params.custom.userId,
          plan: params.custom.plan,
        } as Record<string, unknown>,
        email: params.email,
      },
      productOptions: params.redirectUrl
        ? { redirectUrl: params.redirectUrl }
        : undefined,
    }
  );

  if (error) {
    throw new Error(`Lemon Squeezy checkout failed: ${error.message}`);
  }
  if (statusCode && statusCode >= 400) {
    throw new Error(`Lemon Squeezy checkout failed: status ${statusCode}`);
  }

  const url = data?.data?.attributes?.url;
  if (!url || typeof url !== "string") {
    throw new Error("Lemon Squeezy did not return a checkout URL");
  }
  return { url };
}

/**
 * 고객 포털 URL 조회 (구독/결제 수단 관리).
 * @param customerId Lemon Squeezy customer ID (users.lemon_customer_id)
 * @returns customer_portal URL (24시간 유효). 구독 없으면 null.
 */
export async function getCustomerPortalUrl(
  customerId: string
): Promise<{ url: string | null }> {
  ensureSetup();
  const { data, error } = await getCustomer(customerId);
  if (error) {
    throw new Error(`Lemon Squeezy getCustomer failed: ${error.message}`);
  }
  const url = data?.data?.attributes?.urls?.customer_portal ?? null;
  return { url };
}
