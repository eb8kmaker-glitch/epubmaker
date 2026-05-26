import type { Metadata } from "next";
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

const BASE_URL = "https://www.epubmaker.org";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === "ko";

  const title = isKo
    ? "EPUBMaker — 웹 기반 EPUB 전자책 제작 및 변환 도구"
    : "EPUBMaker — Web-based EPUB Creator & Converter";
  const description = isKo
    ? "설치 없이 브라우저에서 바로 EPUB 전자책을 제작·변환하세요. Sigil보다 쉬운 무료 온라인 EPUB 제작 도구. 계정 불필요."
    : "Create professional EPUB ebooks online. A simple web-based EPUB maker and converter — an easier alternative to Sigil. Free forever, no account required.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Home" });
  const tf = await getTranslations({ locale, namespace: "HomeFAQ" });

  const faqItems = [
    { q: tf("q1"), a: tf("a1") },
    { q: tf("q2"), a: tf("a2") },
    { q: tf("q3"), a: tf("a3") },
    { q: tf("q4"), a: tf("a4") },
    { q: tf("q5"), a: tf("a5") },
  ];

  const softwareAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "EPUBMaker",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://www.epubmaker.org",
    description:
      "Web-based EPUB creation and conversion platform for creating professional electronic books online.",
    keywords: [
      "epub maker",
      "epub converter",
      "ebook creator",
      "online epub editor",
      "sigil alternative",
      "전자책 제작",
    ],
    featureList: [
      "Create EPUB online",
      "Convert files to EPUB",
      "Merge chapters",
      "Split chapters",
      "Edit EPUB structure",
      "Web-based ebook creation",
    ],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  const steps = [
    { num: "01", titleKey: "step1Title", descKey: "step1Desc" },
    { num: "02", titleKey: "step2Title", descKey: "step2Desc" },
    { num: "03", titleKey: "step3Title", descKey: "step3Desc" },
  ] as const;

  return (
    <div style={{ minHeight: "100vh", background: "var(--lib-bg)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* ── Hero ── */}
      <Hero locale={locale} />

      {/* ── Ad: Hero 아래 ──────────────────────────────────────────────────────
           adUnit: 애드핏 승인 후 "DAN-xxxxxxxxxx" 형식의 단위 ID 로 교체
           ─────────────────────────────────────────────────────────────────── */}
      <section style={{ padding: "28px 36px 0", background: "var(--lib-bg)" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <AdFitBanner
            adUnit="DAN-mQe45jKz1SS2Zpe7"
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

      {/* ── FAQ ── */}
      <section
        style={{
          padding: "72px 36px",
          background: "var(--lib-bg-2)",
          borderTop: "1px solid var(--lib-border)",
          borderBottom: "1px solid var(--lib-border)",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
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
              FAQ
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
              {tf("title")}
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {faqItems.map(({ q, a }, i) => (
              <div
                key={i}
                style={{
                  padding: "28px 0",
                  borderBottom: i < faqItems.length - 1 ? "1px solid var(--lib-border)" : undefined,
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: 17,
                    fontWeight: 500,
                    color: "var(--lib-ink)",
                    margin: "0 0 10px",
                    lineHeight: 1.35,
                  }}
                >
                  {q}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-sans), system-ui, sans-serif",
                    fontSize: 14,
                    fontWeight: 300,
                    color: "var(--lib-dusk)",
                    lineHeight: 1.75,
                    margin: 0,
                  }}
                >
                  {a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ad: 홈 페이지 하단 ─────────────────────────────────────────────────
           adUnit: 애드핏 승인 후 "DAN-xxxxxxxxxx" 형식의 단위 ID 로 교체
           ─────────────────────────────────────────────────────────────────── */}
      <section style={{ padding: "0 36px 48px", background: "var(--lib-bg)" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <AdFitBanner
            adUnit="DAN-mQe45jKz1SS2Zpe7"
            desktopSize="728x90"
            mobileSize="320x50"
          />
        </div>
      </section>
    </div>
  );
}
