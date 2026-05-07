import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Hero from "@/app/components/home/Hero";
import FeatureCards from "@/app/components/home/FeatureCards";
import GoldDivider from "@/app/components/ui/GoldDivider";
import HeroEmailSignup from "@/app/components/HeroEmailSignup";
import AdBanner from "@/app/components/ads/AdBanner";

export const dynamic = "force-static";
export const revalidate = 3600;

export default async function HomePage() {
  const t = await getTranslations("Home");

  return (
    <div style={{ minHeight: "100vh", background: "var(--lib-bg)" }}>
      {/* Hero */}
      <Hero />

      {/* Features */}
      <section id="features" style={{ padding: "72px 36px", background: "var(--lib-bg)" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          {/* Section header */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--lib-dust)",
                marginBottom: 10,
                fontFamily: "var(--font-sans), system-ui, sans-serif",
              }}
            >
              {t("featuresLabel")}
            </div>
            <h2
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: 30,
                fontWeight: 500,
                color: "var(--lib-ink)",
                margin: 0,
              }}
            >
              {t("features.title")}
            </h2>
          </div>

          <FeatureCards />
        </div>
      </section>

      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 36px" }}>
        <GoldDivider />
      </div>

      {/* Free forever callout */}
      <section style={{ padding: "72px 36px", textAlign: "center", background: "var(--lib-bg)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--lib-dust)",
              marginBottom: 14,
              fontFamily: "var(--font-sans), system-ui, sans-serif",
            }}
          >
            {t("freeForever.label")}
          </p>
          <h2
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "clamp(24px, 4vw, 36px)",
              fontWeight: 500,
              color: "var(--lib-ink)",
              lineHeight: 1.2,
              marginBottom: 14,
            }}
          >
            {t("freeForever.title")}
          </h2>
          <p
            style={{
              fontSize: 15,
              fontWeight: 300,
              color: "var(--lib-dusk)",
              lineHeight: 1.75,
              marginBottom: 28,
              fontFamily: "var(--font-sans), system-ui, sans-serif",
            }}
          >
            {t("freeForever.desc")}
          </p>
          <Link
            href="/convert"
            className="btn-primary"
            style={{
              display: "inline-block",
              padding: "11px 28px",
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 7,
              textDecoration: "none",
              background: "var(--lib-wood-dim)",
              color: "#F8F5F0",
              fontFamily: "var(--font-sans), system-ui, sans-serif",
            }}
          >
            {t("freeForever.cta")}
          </Link>
        </div>
      </section>

      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 36px" }}>
        <GoldDivider />
      </div>

      {/* Newsletter */}
      <section style={{ padding: "64px 36px 80px", textAlign: "center", background: "var(--lib-bg)" }}>
        <HeroEmailSignup />
      </section>

      {/* Ad — home page bottom */}
      <section style={{ padding: "0 36px 48px", background: "var(--lib-bg)" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <AdBanner adSlot="1234567890" style={{ minHeight: 90 }} />
        </div>
      </section>
    </div>
  );
}
