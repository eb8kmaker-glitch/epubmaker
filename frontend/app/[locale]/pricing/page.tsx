import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Link as I18nLink } from "@/i18n/navigation";
import { createServerClient } from "@/lib/supabase";
import CheckoutButton from "@/app/components/CheckoutButton";

const LEMON_SQUEEZY = {
  starter: "https://epubmaker.lemonsqueezy.com/checkout/buy/bdba77a1-9561-45d2-91ec-6aa3bc205ad5",
  pro: "https://epubmaker.lemonsqueezy.com/checkout/buy/fe7e2d70-5fd1-4445-80c0-93d898f579d7",
  payPerUse: "https://epubmaker.lemonsqueezy.com/checkout/buy/55e55a27-69cc-4ac1-a4ce-03f247c1c620",
} as const;

const PLAN_IDS = ["free", "starter", "pro", "pay", "publisher"] as const;
const PLAN_CONFIG: Record<
  (typeof PLAN_IDS)[number],
  { href: string; featureCount: number; recommended: boolean }
> = {
  free: { href: "/convert", featureCount: 3, recommended: false },
  starter: { href: LEMON_SQUEEZY.starter, featureCount: 4, recommended: true },
  pro: { href: LEMON_SQUEEZY.pro, featureCount: 3, recommended: false },
  pay: { href: LEMON_SQUEEZY.payPerUse, featureCount: 4, recommended: false },
  publisher: { href: "/contact", featureCount: 4, recommended: false },
};

const CHECKOUT_PLANS = new Set(["starter", "pro"]);

export default async function PricingPage() {
  const t = await getTranslations("Pricing");
  const tCommon = await getTranslations("common");

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  const faqItems = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
  ];

  const plans = PLAN_IDS.map((id) => {
    const config = PLAN_CONFIG[id];
    const features = Array.from({ length: config.featureCount }, (_, i) =>
      t(`plans.${id}.feature${i + 1}`)
    );
    return {
      id,
      name: t(`plans.${id}.title`),
      description: t(`plans.${id}.desc`),
      price: t(`plans.${id}.price`),
      cta: t(`plans.${id}.cta`),
      features,
      href: config.href,
      recommended: config.recommended,
    };
  });

  return (
    <div className="min-h-screen bg-[var(--page-bg)] font-sans text-[var(--content)]">
      <section className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-4 text-lg text-[var(--content-muted)]">
            {t("subtitle")}
          </p>
        </div>
      </section>

      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {plans.map((plan) => {
              const highlighted = plan.recommended === true;
              return (
                <div
                  key={plan.id}
                  className={`flex flex-col rounded-[12px] border bg-[var(--card)] p-6 shadow-[var(--shadow-card)] transition-all duration-200 ${
                    highlighted
                      ? "border-[var(--accent)] ring-2 ring-[var(--accent-soft)]"
                      : "border-[var(--border)]"
                  }`}
                >
                  {highlighted && (
                    <span className="mb-2 inline-block w-fit rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent)]">
                      {t("recommended")}
                    </span>
                  )}
                  <h2 className="text-lg font-semibold text-[var(--content)]">
                    {plan.name}
                  </h2>
                  {plan.description && (
                    <p className="mt-1 text-sm text-[var(--content-muted)]">
                      {plan.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tight text-[var(--content)]">
                      {plan.price}
                    </span>
                  </div>
                  <ul className="mt-6 flex-1 space-y-3 text-sm text-[var(--content-muted)]">
                    {plan.features.map((f, i) => (
                      <li key={`${plan.id}-${i}`} className="flex items-start gap-2">
                        <span className="mt-0.5 text-[var(--accent)]">
                          ✓
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {CHECKOUT_PLANS.has(plan.id) ? (
                    <CheckoutButton
                      plan={plan.id as "starter" | "pro"}
                      isLoggedIn={isLoggedIn}
                      fallbackHref={plan.href}
                      className={`mt-8 block w-full rounded-xl py-2.5 text-center text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 ${
                        highlighted
                          ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] focus:ring-[var(--primary)]"
                          : "border border-[var(--border)] bg-[var(--card)] text-[var(--content)] hover:bg-[var(--dropzone-hover)] focus:ring-[var(--primary)]"
                      }`}
                    >
                      {plan.cta}
                    </CheckoutButton>
                  ) : plan.href.startsWith("http") ? (
                    <Link
                      href={plan.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-8 block w-full rounded-xl py-2.5 text-center text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        highlighted
                          ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] focus:ring-[var(--primary)]"
                          : "border border-[var(--border)] bg-[var(--card)] text-[var(--content)] hover:bg-[var(--dropzone-hover)] focus:ring-[var(--primary)]"
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  ) : (
                    <I18nLink
                      href={plan.href as "/convert" | "/contact"}
                      className={`mt-8 block w-full rounded-xl py-2.5 text-center text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        highlighted
                          ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] focus:ring-[var(--primary)]"
                          : "border border-[var(--border)] bg-[var(--card)] text-[var(--content)] hover:bg-[var(--dropzone-hover)] focus:ring-[var(--primary)]"
                      }`}
                    >
                      {plan.cta}
                    </I18nLink>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--card)] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("faq.title")}
          </h2>
          <dl className="mt-12 space-y-8">
            {faqItems.map((item) => (
              <div key={item.q}>
                <dt className="text-base font-medium text-[var(--content)]">
                  {item.q}
                </dt>
                <dd className="mt-2 text-sm text-[var(--content-muted)]">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--primary)] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">
            {t("ctaTitle")}
          </h2>
          <I18nLink
            href="/convert"
            className="mt-6 inline-block rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-[var(--primary)] shadow-sm transition-all duration-200 hover:bg-[var(--dropzone-hover)] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--primary)]"
          >
            {t("ctaButton")}
          </I18nLink>
        </div>
      </section>

      <div className="px-6 py-6">
        <div className="mx-auto max-w-5xl">
          <I18nLink
            href="/"
            className="text-sm font-medium text-[var(--content-muted)] transition-colors duration-200 hover:text-[var(--primary)]"
          >
            {tCommon("backToHome")}
          </I18nLink>
        </div>
      </div>
    </div>
  );
}
