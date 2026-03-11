import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

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
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-center dark:border-emerald-800 dark:bg-emerald-950/50">
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
          {t("beta")}
        </p>
      </section>

      <section className="border-b border-zinc-200 bg-white px-6 py-20 dark:border-zinc-800 dark:bg-zinc-900/50 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {t("hero.title")}
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 sm:text-xl">
            {t("hero.subtitle")}
          </p>
          <Link
            href="/convert"
            className="mt-8 inline-block rounded-lg bg-emerald-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
          >
            {t("hero.cta")}
          </Link>
        </div>
      </section>

      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("howItWorks.title")}
          </h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-lg font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                1
              </span>
              <h3 className="mt-4 font-medium">{t("howItWorks.step1Title")}</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {t("howItWorks.step1Desc")}
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-lg font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                2
              </span>
              <h3 className="mt-4 font-medium">{t("howItWorks.step2Title")}</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {t("howItWorks.step2Desc")}
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-lg font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                3
              </span>
              <h3 className="mt-4 font-medium">{t("howItWorks.step3Title")}</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {t("howItWorks.step3Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-white px-6 py-16 dark:border-zinc-800 dark:bg-zinc-900/30 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("features.title")}
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.titleKey}
                className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-700 dark:bg-zinc-800/30"
              >
                <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                  {t(`features.${f.titleKey}`)}
                </h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {t(`features.${f.descKey}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            {tPlans("title")}
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.nameKey}
                className="rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-800/50"
              >
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {tPlans(plan.nameKey)}
                </h3>
                <p className="mt-2 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {tPlans(plan.priceKey)}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {plan.features.map((key) => (
                    <li key={key}>{tPlans(key)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {tPlans("moreOptions")}
            </p>
            <Link
              href="/pricing"
              className="mt-4 inline-block rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"
            >
              {tPlans("viewPricing")}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-emerald-600 px-6 py-16 dark:border-zinc-800 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-lg font-medium text-white sm:text-xl">
            {t("cta.text")}
          </p>
          <Link
            href="/convert"
            className="mt-6 inline-block rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-600"
          >
            {t("cta.button")}
          </Link>
        </div>
      </section>
    </div>
  );
}
