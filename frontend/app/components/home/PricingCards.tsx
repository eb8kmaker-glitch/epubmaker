import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function PricingCards() {
  const t = await getTranslations("Pricing");

  const plans = [
    {
      id: "free",
      featured: false,
      priceNum: "$0",
      period: "/ month",
      features: ["feature1", "feature2", "feature3"] as const,
      href: "/signup",
    },
    {
      id: "pro",
      featured: true,
      priceNum: "$19",
      period: "/ month",
      features: ["feature1", "feature2", "feature3"] as const,
      href: "/pricing",
    },
    {
      id: "publisher",
      featured: false,
      priceNum: t("plans.publisher.price"),
      period: "",
      features: ["feature1", "feature2", "feature3", "feature4"] as const,
      href: "/pricing",
    },
  ] as const;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 20,
      }}
    >
      {plans.map((plan) => {
        const isPub = plan.id === "publisher";

        return (
          <div
            key={plan.id}
            className="pricing-card"
            style={{
              background: plan.featured
                ? "linear-gradient(160deg, #3E2919, #2D1E12)"
                : "#2A1C13",
              border: plan.featured
                ? "1px solid rgba(214,185,123,0.35)"
                : "1px solid rgba(214,185,123,0.1)",
              borderRadius: 3,
              padding: "32px 28px",
              position: "relative",
            }}
          >
            {plan.featured && (
              <div
                style={{
                  position: "absolute",
                  top: -1,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "var(--gold)",
                  color: "var(--deep-brown)",
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  padding: "3px 14px",
                  borderRadius: "0 0 4px 4px",
                  fontFamily: "var(--font-jost), sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                {t("recommended")}
              </div>
            )}

            {/* Plan name */}
            <h3
              style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontSize: 26,
                fontWeight: 500,
                color: "var(--cream)",
                marginBottom: 4,
              }}
            >
              {t(`plans.${plan.id}.title`)}
            </h3>

            <p
              style={{
                fontSize: 13,
                color: "var(--cream-dim)",
                marginBottom: 20,
                fontWeight: 300,
              }}
            >
              {t(`plans.${plan.id}.desc`)}
            </p>

            {/* Price */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 2,
                marginBottom: 24,
              }}
            >
              {!isPub && (
                <sup
                  style={{
                    fontFamily: "var(--font-cormorant), serif",
                    fontSize: 18,
                    color: "var(--gold)",
                    marginTop: 8,
                    fontWeight: 500,
                  }}
                >
                  $
                </sup>
              )}
              <span
                style={{
                  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                  fontSize: isPub ? 32 : 52,
                  fontWeight: 500,
                  color: "var(--gold)",
                  lineHeight: 1,
                }}
              >
                {isPub ? t("plans.publisher.price") : plan.priceNum.replace("$", "")}
              </span>
              {plan.period && (
                <span
                  style={{
                    fontSize: 13,
                    color: "var(--cream-dim)",
                    alignSelf: "flex-end",
                    marginBottom: 6,
                    marginLeft: 4,
                  }}
                >
                  {plan.period}
                </span>
              )}
            </div>

            {/* Features */}
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10 }}>
              {plan.features.map((fk) => (
                <li key={fk} className="plan-feature">
                  {t(`plans.${plan.id}.${fk}`)}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link
              href={plan.href}
              className={plan.featured ? "btn-gold" : "btn-ghost-gold"}
              style={{
                display: "block",
                textAlign: "center",
                padding: "12px 24px",
                borderRadius: 2,
                fontSize: 14,
                fontFamily: "var(--font-jost), sans-serif",
                letterSpacing: "0.04em",
                textDecoration: "none",
                ...(plan.featured
                  ? {}
                  : { background: "transparent" }),
              }}
            >
              {t(`plans.${plan.id}.cta`)}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
