import { getTranslations } from "next-intl/server";
import Hero from "@/app/components/home/Hero";
import StatsBar from "@/app/components/home/StatsBar";
import FeatureCards from "@/app/components/home/FeatureCards";
import PricingCards from "@/app/components/home/PricingCards";
import GoldDivider from "@/app/components/ui/GoldDivider";
import HeroEmailSignup from "@/app/components/HeroEmailSignup";

export default async function HomePage() {
  const t = await getTranslations("Home");

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Beta banner */}
      <div
        style={{
          borderBottom: "1px solid rgba(214,185,123,0.12)",
          background: "rgba(43,30,23,0.5)",
          padding: "10px 24px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: 13,
            color: "var(--cream-dim)",
            fontWeight: 300,
            letterSpacing: "0.02em",
          }}
        >
          {t("beta")}
        </p>
      </div>

      {/* Hero */}
      <Hero />

      {/* Stats */}
      <StatsBar />

      {/* Features */}
      <section
        id="features"
        style={{ padding: "80px 24px" }}
      >
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          {/* Section label */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "var(--gold)",
                marginBottom: 10,
                fontFamily: "var(--font-jost), sans-serif",
              }}
            >
              {t("featuresLabel")}
            </div>
            <h2
              style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontSize: 36,
                fontWeight: 500,
                color: "var(--cream)",
                margin: 0,
              }}
            >
              {t("features.title")}
            </h2>
          </div>

          <FeatureCards />
        </div>
      </section>

      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 24px" }}>
        <GoldDivider />
      </div>

      {/* Pricing */}
      <section
        id="pricing"
        style={{ padding: "80px 24px" }}
      >
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          {/* Section label */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "var(--gold)",
                marginBottom: 10,
                fontFamily: "var(--font-jost), sans-serif",
              }}
            >
              {t("pricingLabel")}
            </div>
            <h2
              style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontSize: 36,
                fontWeight: 500,
                color: "var(--cream)",
                margin: 0,
              }}
            >
              {t("plans.title")}
            </h2>
          </div>

          <PricingCards />
        </div>
      </section>

      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 24px" }}>
        <GoldDivider />
      </div>

      {/* Newsletter */}
      <section
        style={{
          padding: "64px 24px 80px",
          textAlign: "center",
        }}
      >
        <HeroEmailSignup />
      </section>
    </div>
  );
}
