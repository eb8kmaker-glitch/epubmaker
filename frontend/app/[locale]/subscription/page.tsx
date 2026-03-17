/**
 * 구독 관리 페이지.
 * 미들웨어에서 로그인 필수로 보호됨.
 * users 테이블의 구독 정보 표시 + Lemon Squeezy 포털/플랜 변경 링크.
 */

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerClient } from "@/lib/supabase";
import { Link } from "@/i18n/navigation";
import ManageSubscriptionButton from "@/app/components/ManageSubscriptionButton";

type Props = { params: Promise<{ locale: string }> };

const planLabels: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  pay_per_use: "Pay per use",
};

export default async function SubscriptionPage({ params }: Props) {
  const { locale } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: userRow } = await supabase
    .from("users")
    .select("subscription_plan, subscription_status, current_period_end, lemon_customer_id")
    .eq("id", user.id)
    .single();

  const t = await getTranslations("Subscription");
  const plan = (userRow?.subscription_plan as string) ?? "free";
  const status = (userRow?.subscription_status as string) ?? "free";
  const currentPeriodEnd = userRow?.current_period_end ?? null;
  const hasPortalAccess = !!userRow?.lemon_customer_id && typeof userRow.lemon_customer_id === "string";

  const statusLabel =
    status === "past_due"
      ? t("statusPastDue")
      : status === "canceled"
        ? t("statusCanceled")
        : status === "trialing"
          ? t("statusTrialing")
          : status === "active"
            ? t("statusActive")
            : t("statusFree");

  const badgeClass =
    status === "active"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
      : status === "canceled" || status === "free"
        ? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
        : status === "past_due"
          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
          : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";

  return (
    <div className="min-h-screen bg-[var(--page-bg)] font-sans">
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="mb-2 text-2xl font-semibold text-[var(--content)]">
          {t("title")}
        </h1>
        <p className="mb-8 text-[var(--content-muted)]">
          {t("subtitle")}
        </p>

        {/* Current plan card */}
        <section className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 text-lg font-medium text-[var(--content)]">
            {t("currentPlan")}
          </h2>
          <div className="space-y-3">
            <p className="text-sm text-[var(--content-muted)]">
              {t("status")}:{" "}
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}>
                {statusLabel}
              </span>
            </p>
            <p className="text-sm text-[var(--content)]">
              {planLabels[plan] ?? plan}
            </p>
            {currentPeriodEnd && (
              <p className="text-sm text-[var(--content-muted)]">
                {t("nextBillingDate")}:{" "}
                {new Date(currentPeriodEnd).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </div>
        </section>

        {/* Portal or no plan */}
        <section className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 text-lg font-medium text-[var(--content)]">
            {t("managePortal")}
          </h2>
          {hasPortalAccess ? (
            <ManageSubscriptionButton
              label={t("managePortalButton")}
              noSubscriptionLabel={t("noSubscription")}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--content)] hover:bg-[var(--card)] disabled:opacity-60"
            />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[var(--content-muted)]">
                {t("noPlan")}
              </p>
              <Link
                href="/pricing"
                className="inline-block rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                {t("viewPricing")}
              </Link>
            </div>
          )}
        </section>

        {/* Change plan */}
        <div className="flex flex-wrap gap-4">
          <Link
            href="/pricing"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--content)] hover:bg-[var(--card)]"
          >
            {t("changePlan")}
          </Link>
        </div>
      </main>
    </div>
  );
}
