import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Hero from "@/app/components/home/Hero";
import FeatureCards from "@/app/components/home/FeatureCards";
import GoldDivider from "@/app/components/ui/GoldDivider";
import HeroEmailSignup from "@/app/components/HeroEmailSignup";

export default async function HomePage() {
  const t = await getTranslations("Home");

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Hero */}
      <Hero />

      {/* Features */}
      <section
        id="features"
        style={{ padding: "72px 24px" }}
      >
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
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

      {/* Free forever callout */}
      <section style={{ padding: "72px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "var(--gold)",
              marginBottom: 16,
              fontFamily: "var(--font-jost), sans-serif",
            }}
          >
            {t("freeForever.label")}
          </p>
          <h2
            style={{
              fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 500,
              color: "var(--cream)",
              lineHeight: 1.2,
              marginBottom: 16,
            }}
          >
            {t("freeForever.title")}
          </h2>
          <p
            style={{
              fontSize: 15,
              color: "var(--cream-dim)",
              lineHeight: 1.75,
              marginBottom: 32,
              fontWeight: 300,
            }}
          >
            {t("freeForever.desc")}
          </p>
          <Link
            href="/convert"
            className="btn-gold"
            style={{
              display: "inline-block",
              padding: "13px 36px",
              fontSize: 14,
              letterSpacing: "0.06em",
              borderRadius: 2,
              textDecoration: "none",
              fontFamily: "var(--font-jost), sans-serif",
            }}
          >
            {t("freeForever.cta")}
          </Link>
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
