import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Hero from "@/app/components/home/Hero";
import FeatureCards from "@/app/components/home/FeatureCards";
import GoldDivider from "@/app/components/ui/GoldDivider";
import AdFitBanner from "@/app/components/ads/AdFitBanner";
import { routing } from "@/i18n/routing";

export const dynamic = "force-static";
export const revalidate = 3600;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Home" });

  const steps = [
    { num: "01", titleKey: "step1Title", descKey: "step1Desc" },
    { num: "02", titleKey: "step2Title", descKey: "step2Desc" },
    { num: "03", titleKey: "step3Title", descKey: "step3Desc" },
  ] as const;

  return (
    <div style={{ minHeight: "100vh", background: "var(--lib-bg)" }}>
      {/* ── Hero ── */}
      <Hero locale={locale} />

      {/* ── Ad: Hero 아래 ──────────────────────────────────────────────────────
           adUnit: 애드핏 승인 후 "DAN-xxxxxxxxxx" 형식의 단위 ID 로 교체
           ─────────────────────────────────────────────────────────────────── */}
      <section style={{ padding: "28px 36px 0", background: "var(--lib-bg)" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <AdFitBanner
            adUnit="DAN-PLACEHOLDER_HOME_HERO"
            desktopSize="728x90"
            mobileSize="320x50"
          />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ padding: "72px 36px", background: "var(--lib-bg-2)", borderBottom: "1px solid var(--lib-border)" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
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
              {t("hero.ctaSecondary")}
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
              {t("howItWorks.title")}
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 32,
            }}
          >
            {steps.map((step) => (
              <div
                key={step.num}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: 36,
                    fontWeight: 500,
                    color: "var(--lib-border-2)",
                    lineHeight: 1,
                  }}
                >
                  {step.num}
                </span>
                <h3
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: 17,
                    fontWeight: 500,
                    color: "var(--lib-ink)",
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {t(`howItWorks.${step.titleKey}`)}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-sans), system-ui, sans-serif",
                    fontSize: 13,
                    fontWeight: 300,
                    color: "var(--lib-dusk)",
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {t(`howItWorks.${step.descKey}`)}
                </p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 44 }}>
            <Link
              href="/convert"
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
              className="btn-primary"
            >
              {t("hero.cta")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: "72px 36px", background: "var(--lib-bg)" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
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

          <FeatureCards locale={locale} />
        </div>
      </section>

      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 36px" }}>
        <GoldDivider />
      </div>

      {/* ── Free forever callout + CTA ── */}
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

      {/* ── Ad: 홈 페이지 하단 ─────────────────────────────────────────────────
           adUnit: 애드핏 승인 후 "DAN-xxxxxxxxxx" 형식의 단위 ID 로 교체
           ─────────────────────────────────────────────────────────────────── */}
      <section style={{ padding: "0 36px 48px", background: "var(--lib-bg)" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <AdFitBanner
            adUnit="DAN-PLACEHOLDER_HOME_BOTTOM"
            desktopSize="728x90"
            mobileSize="320x50"
          />
        </div>
      </section>
    </div>
  );
}
