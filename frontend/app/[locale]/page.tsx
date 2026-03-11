import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import HeroEmailSignup from "@/app/components/HeroEmailSignup";

export default async function HomePage() {
  const t = await getTranslations("Home");
  const tPlans = await getTranslations("Home.plans");

  const features = [
    { titleKey: "docxTxt" as const, descKey: "docxTxtDesc" as const },
    { titleKey: "toc" as const, descKey: "tocDesc" as const },
    { titleKey: "cover" as const, descKey: "coverDesc" as const },
    { titleKey: "css" as const, descKey: "cssDesc" as const },
    { titleKey: "metadata" as const, descKey: "metadataDesc" as const },
  ];

  const plans = [
    { nameKey: "free" as const, priceKey: "freePrice" as const, features: ["freeFeature"] as const },
    {
      nameKey: "starter" as const,
      priceKey: "starterPrice" as const,
      features: ["starterFeature1", "starterFeature2"] as const,
    },
    {
      nameKey: "pro" as const,
      priceKey: "proPrice" as const,
      features: ["proFeature1", "proFeature2"] as const,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--page-bg)] font-sans text-[var(--content)]">
      <section className="border-b border-[var(--guide-border)] bg-[var(--accent-soft)]/30 px-4 py-3 text-center">
        <p className="text-sm font-medium text-[var(--content)]">
          {t("beta")}
        </p>
      </section>

      <section className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--content)] sm:text-4xl md:text-5xl">
            {t("hero.title")}
          </h1>
          <p className="mt-4 text-lg text-[var(--content-muted)] sm:text-xl">
            {t("hero.subtitle")}
          </p>
          <Link
            href="/convert"
            className="mt-8 inline-block rounded-xl bg-[var(--primary)] px-6 py-3 text-base font-medium text-white shadow-sm transition-all duration-200 ease-in-out hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
          >
            {t("hero.cta")}
          </Link>
          <div className="mt-12">
            <HeroEmailSignup />
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-[var(--content)] sm:text-3xl">
            {t("howItWorks.title")}
          </h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-lg font-semibold text-[var(--accent)] transition-all duration-200">
                1
              </span>
              <h3 className="mt-4 font-medium text-[var(--content)]">{t("howItWorks.step1Title")}</h3>
              <p className="mt-2 text-sm text-[var(--content-muted)]">
                {t("howItWorks.step1Desc")}
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-lg font-semibold text-[var(--accent)] transition-all duration-200">
                2
              </span>
              <h3 className="mt-4 font-medium text-[var(--content)]">{t("howItWorks.step2Title")}</h3>
              <p className="mt-2 text-sm text-[var(--content-muted)]">
                {t("howItWorks.step2Desc")}
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-lg font-semibold text-[var(--accent)] transition-all duration-200">
                3
              </span>
              <h3 className="mt-4 font-medium text-[var(--content)]">{t("howItWorks.step3Title")}</h3>
              <p className="mt-2 text-sm text-[var(--content-muted)]">
                {t("howItWorks.step3Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--card)] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-[var(--content)] sm:text-3xl">
            {t("features.title")}
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.titleKey}
                className="rounded-[12px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)] transition-all duration-200"
              >
                <h3 className="font-medium text-[var(--content)]">
                  {t(`features.${f.titleKey}`)}
                </h3>
                <p className="mt-2 text-sm text-[var(--content-muted)]">
                  {t(`features.${f.descKey}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-[var(--content)] sm:text-3xl">
            {tPlans("title")}
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.nameKey}
                className="rounded-[12px] border border-[var(--border)] bg-[var(--card)] p-6 text-center shadow-[var(--shadow-card)] transition-all duration-200"
              >
                <h3 className="text-lg font-semibold text-[var(--content)]">
                  {tPlans(plan.nameKey)}
                </h3>
                <p className="mt-2 text-xl font-bold tracking-tight text-[var(--content)]">
                  {tPlans(plan.priceKey)}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-[var(--content-muted)]">
                  {plan.features.map((key) => (
                    <li key={key}>{tPlans(key)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <p className="text-sm text-[var(--content-muted)]">
              {tPlans("moreOptions")}
            </p>
            <Link
              href="/pricing"
              className="mt-4 inline-block rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-2.5 text-sm font-medium text-[var(--content)] shadow-sm transition-all duration-200 ease-in-out hover:bg-[var(--dropzone-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
            >
              {tPlans("viewPricing")}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--primary)] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-lg font-medium text-white sm:text-xl">
            {t("cta.text")}
          </p>
          <Link
            href="/convert"
            className="mt-6 inline-block rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-[var(--primary)] shadow-sm transition-all duration-200 ease-in-out hover:bg-[var(--dropzone-hover)] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--primary)]"
          >
            {t("cta.button")}
          </Link>
        </div>
      </section>
    </div>
  );
}
