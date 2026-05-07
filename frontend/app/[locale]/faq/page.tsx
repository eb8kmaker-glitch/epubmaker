import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { FAQJsonLd, BreadcrumbJsonLd } from "@/app/components/content/JsonLd";
import AdBanner from "@/app/components/ads/AdBanner";

const BASE_URL = "https://epubmaker.org";
const FAQ_COUNT = 8;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "FAQ" });
  return {
    title: `${t("title")} — EPUBMaker`,
    description: t("subtitle"),
    alternates: {
      canonical: `${BASE_URL}/${locale}/faq`,
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function FAQPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("FAQ");

  const items = Array.from({ length: FAQ_COUNT }, (_, i) => ({
    question: t(`q${i + 1}` as Parameters<typeof t>[0]),
    answer: t(`a${i + 1}` as Parameters<typeof t>[0]),
  }));

  const breadcrumbs = [
    { name: "EPUBMaker", url: `${BASE_URL}/${locale}` },
    { name: t("title"), url: `${BASE_URL}/${locale}/faq` },
  ];

  return (
    <>
      <FAQJsonLd items={items} />
      <BreadcrumbJsonLd items={breadcrumbs} />

      <div style={{ minHeight: "100vh", background: "var(--lib-bg)" }}>
        {/* Header */}
        <section
          style={{
            padding: "64px 36px 48px",
            borderBottom: "1px solid var(--lib-border)",
            background: "var(--lib-bg-2)",
          }}
        >
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--lib-dust)",
                marginBottom: 12,
                fontFamily: "var(--font-sans), system-ui, sans-serif",
              }}
            >
              EPUBMaker
            </div>
            <h1
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: 500,
                color: "var(--lib-ink)",
                marginBottom: 12,
                lineHeight: 1.2,
              }}
            >
              {t("title")}
            </h1>
            <p
              style={{
                fontSize: 15,
                fontWeight: 300,
                color: "var(--lib-dusk)",
                fontFamily: "var(--font-sans), system-ui, sans-serif",
                lineHeight: 1.65,
              }}
            >
              {t("subtitle")}
            </p>
          </div>
        </section>

        {/* FAQ items */}
        <section style={{ padding: "48px 36px 80px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <dl>
              {items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    borderBottom: i < items.length - 1 ? "1px solid var(--lib-border)" : "none",
                    paddingBottom: 28,
                    marginBottom: 28,
                  }}
                >
                  <dt
                    style={{
                      fontFamily: "var(--font-serif), Georgia, serif",
                      fontSize: 18,
                      fontWeight: 500,
                      color: "var(--lib-ink)",
                      marginBottom: 10,
                      lineHeight: 1.3,
                    }}
                  >
                    {item.question}
                  </dt>
                  <dd
                    style={{
                      fontSize: 14,
                      color: "var(--lib-dusk)",
                      lineHeight: 1.75,
                      fontFamily: "var(--font-sans), system-ui, sans-serif",
                      fontWeight: 300,
                      margin: 0,
                    }}
                  >
                    {item.answer}
                  </dd>
                </div>
              ))}
            </dl>

            {/* Ad */}
            <div style={{ marginTop: 48 }}>
              <AdBanner adSlot="4455667788" style={{ minHeight: 90 }} />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
