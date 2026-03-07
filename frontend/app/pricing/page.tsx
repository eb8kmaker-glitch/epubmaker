import Link from "next/link";

const LEMON_SQUEEZY = {
  free: "https://epubmaker.lemonsqueezy.com/checkout/buy/4433ff2d-97ec-4737-b45f-43ed6ac020e9",
  starter: "https://epubmaker.lemonsqueezy.com/checkout/buy/bdba77a1-9561-45d2-91ec-6aa3bc205ad5",
  pro: "https://epubmaker.lemonsqueezy.com/checkout/buy/fe7e2d70-5fd1-4445-80c0-93d898f579d7",
  payPerUse: "https://epubmaker.lemonsqueezy.com/checkout/buy/55e55a27-69cc-4ac1-a4ce-03f247c1c620",
} as const;

const plans = [
  {
    name: "Free",
    price: "$0 / month",
    description: "Get started at no cost",
    features: [
      "5 conversions per month",
      "DOCX & TXT support",
      "Basic EPUB export",
    ],
    cta: "Start Free",
    href: LEMON_SQUEEZY.free,
  },
  {
    name: "Starter",
    price: "$9 / month",
    description: "For regular authors",
    features: [
      "100 conversions per month",
      "Metadata editor",
      "Cover image upload",
      "CSS styling presets",
    ],
    recommended: true,
    cta: "Start Starter",
    href: LEMON_SQUEEZY.starter,
  },
  {
    name: "Pro",
    price: "$19 / month",
    description: "For power users",
    features: [
      "Unlimited conversions",
      "All features included",
      "Priority conversion",
    ],
    cta: "Upgrade to Pro",
    href: LEMON_SQUEEZY.pro,
  },
  {
    name: "Pay-per-use",
    price: "$3 per conversion",
    description: "No monthly commitment",
    features: [
      "No monthly subscription",
      "Pay only when converting",
      "Ideal for occasional authors",
      "Credits never expire",
    ],
    cta: "Get credits",
    href: LEMON_SQUEEZY.payPerUse,
  },
  {
    name: "Publisher / B2B",
    price: "Custom",
    description: "Bulk and API",
    features: [
      "Bulk conversion pricing",
      "API access",
      "Priority processing",
      "Dedicated support",
    ],
    cta: "Contact sales",
    href: "/contact",
  },
];

const FAQ = [
  {
    q: "What file types are supported?",
    a: "We support DOCX and TXT files for conversion to EPUB. Upload your manuscript and configure metadata, cover, and styling before downloading.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can upgrade or cancel your plan at any time. No long-term commitment required.",
  },
  {
    q: "Do I need an account?",
    a: "You can try the Free plan without signing up. Starter and Pro plans require an account for billing and conversion history.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {/* Page header */}
      <section className="border-b border-zinc-200 bg-white px-6 py-16 dark:border-zinc-800 dark:bg-zinc-900/50 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple pricing for EPUB conversion
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Choose the plan that fits your publishing workflow.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {plans.map((plan) => {
              const highlighted = plan.recommended === true;
              return (
                <div
                  key={plan.name}
                  className={`flex flex-col rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-800/50 ${
                    highlighted
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 dark:border-emerald-400 dark:ring-emerald-400/20"
                      : "border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  {highlighted && (
                    <span className="mb-2 inline-block w-fit rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                      Recommended
                    </span>
                  )}
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {plan.name}
                  </h2>
                  {plan.description && (
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {plan.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                      {plan.price}
                    </span>
                  </div>
                  <ul className="mt-6 flex-1 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="mt-0.5 text-emerald-600 dark:text-emerald-400">
                          ✓
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    {...(plan.href.startsWith("http")
                      ? {
                          target: "_blank",
                          rel: "noopener noreferrer",
                        }
                      : {})}
                    className={`mt-8 block w-full rounded-lg py-2.5 text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${
                      highlighted
                        ? "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500"
                        : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-zinc-200 bg-white px-6 py-16 dark:border-zinc-800 dark:bg-zinc-900/30 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            Frequently asked questions
          </h2>
          <dl className="mt-12 space-y-8">
            {FAQ.map((item) => (
              <div key={item.q}>
                <dt className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                  {item.q}
                </dt>
                <dd className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-200 bg-emerald-600 px-6 py-16 dark:border-zinc-800 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">
            Start converting your manuscript today
          </h2>
          <Link
            href="/convert"
            className="mt-6 inline-block rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-600"
          >
            Start Converting
          </Link>
        </div>
      </section>

      {/* Back link */}
      <div className="px-6 py-6">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
