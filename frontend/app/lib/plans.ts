export const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    conversions: 5,
    features: [
      "5 conversions per month",
      "DOCX & TXT support",
      "Basic EPUB export",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: 9,
    conversions: 100,
    features: [
      "100 conversions per month",
      "Metadata editor",
      "Cover image upload",
      "CSS styling presets",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 19,
    conversions: Infinity,
    features: [
      "Unlimited conversions",
      "All features",
      "Priority conversion",
    ],
  },
] as const;

export type PlanId = (typeof PLANS)[number]["id"];

/** Lookup by plan id for API (e.g. user.plan). */
export function getPlanConfig(planId: string): { conversions: number } {
  const plan = PLANS.find((p) => p.id === planId);
  return plan
    ? { conversions: plan.conversions }
    : { conversions: PLANS[0].conversions };
}

export const CREDIT_PRICE = 2;
