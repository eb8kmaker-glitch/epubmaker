import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Hero from "@/app/components/home/Hero";
import FeatureCards from "@/app/components/home/FeatureCards";
import GoldDivider from "@/app/components/ui/GoldDivider";
import AdFitBanner from "@/app/components/ads/AdFitBanner";
import AdBanner from "@/app/components/ads/AdBanner";
import { routing } from "@/i18n/routing";

export const dynamic = "force-static";
export const revalidate = 3600;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

const BASE_URL = "https://www.epubmaker.org";

const PAGE_META: Record<string, { title: string; description: string }> = {
  ko: {
    title: "EPUB 변환기 — 무료 DOCX/TXT to EPUB | EPUBMaker",
    description:
      "설치 없이 브라우저에서 EPUB 전자책을 무료로 만드세요. DOCX·TXT 변환, 목차 편집, 메타데이터 수정, 실시간 미리보기까지. 계정 불필요.",
  },
  en: {
    title: "EPUBMaker — Free DOCX & TXT to EPUB Converter Online",
    description:
      "Create and convert EPUB ebooks free online. Edit the table of contents, update metadata, and preview your ebook — all in your browser. No account required.",
  },
  ja: {
    title: "EPUB変換器 — 無料DOCX/TXTをEPUBに変換 | EPUBMaker",
    description:
      "DOCXとTXTを無料でEPUBに変換。目次編集・メタデータ修正・リアルタイムプレビューをブラウザで完結。アカウント不要。",
  },
  zh: {
    title: "EPUB转换器 — 免费DOCX/TXT转EPUB在线工具 | EPUBMaker",
    description:
      "免费在线将DOCX和TXT转换为EPUB。支持目录编辑、元数据修改和实时预览，全在浏览器中完成。无需账户。",
  },
  pt: {
    title: "Conversor EPUB — Converta DOCX/TXT para EPUB Grátis | EPUBMaker",
    description:
      "Converta DOCX e TXT para EPUB gratuitamente. Edite sumário, metadados e visualize no navegador. Sem necessidade de conta.",
  },
  de: {
    title: "EPUB Konverter — DOCX/TXT kostenlos in EPUB umwandeln | EPUBMaker",
    description:
      "DOCX und TXT kostenlos in EPUB umwandeln. Inhaltsverzeichnis bearbeiten, Metadaten ändern und direkt im Browser vorschauen. Kein Konto nötig.",
  },
  fr: {
    title: "Convertisseur EPUB — Convertir DOCX/TXT en EPUB Gratuit | EPUBMaker",
    description:
      "Convertissez DOCX et TXT en EPUB gratuitement. Éditez la table des matières, les métadonnées et prévisualisez dans le navigateur. Sans compte.",
  },
  es: {
    title: "Conversor EPUB — Convierte DOCX/TXT a EPUB Gratis | EPUBMaker",
    description:
      "Convierte DOCX y TXT a EPUB gratis. Edita el índice, los metadatos y previsualiza en el navegador. Sin necesidad de cuenta.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const { title, description } = PAGE_META[locale] ?? PAGE_META.en;

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
    applicationCategory: "UtilitiesApplication",
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

      {/* Ad Unit B — Features 섹션과 FAQ 섹션 사이 */}
      <section style={{ background: "var(--lib-bg)", padding: "0 36px" }}>
        <div className="ad-unit-wrapper" style={{ maxWidth: 728, margin: "48px auto" }}>
          <span className="ad-label">advertisement</span>
          <AdBanner adSlot="4110613892" />
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

    </div>
  );
}
