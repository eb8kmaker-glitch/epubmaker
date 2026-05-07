import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getAllPosts } from "@/app/lib/content";
import { BreadcrumbJsonLd } from "@/app/components/content/JsonLd";
import AdBanner from "@/app/components/ads/AdBanner";

const BASE_URL = "https://epubmaker.org";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Guides" });
  return {
    title: `${t("title")} — EPUBMaker`,
    description: t("subtitle"),
    alternates: { canonical: `${BASE_URL}/${locale}/guides` },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function GuidesPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("Guides");

  let posts = getAllPosts(locale, "guides");
  if (posts.length === 0 && locale !== "en") {
    posts = getAllPosts("en", "guides");
  }

  const breadcrumbs = [
    { name: "EPUBMaker", url: `${BASE_URL}/${locale}` },
    { name: t("title"), url: `${BASE_URL}/${locale}/guides` },
  ];

  return (
    <>
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

        {/* Guides list */}
        <section style={{ padding: "48px 36px 80px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            {posts.length === 0 ? (
              <p
                style={{
                  fontSize: 14,
                  color: "var(--lib-dust)",
                  fontFamily: "var(--font-sans), system-ui, sans-serif",
                }}
              >
                {t("comingSoon")}
              </p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {posts.map((post, i) => (
                  <li
                    key={post.slug}
                    style={{
                      paddingBottom: 28,
                      marginBottom: 28,
                      borderBottom: i < posts.length - 1 ? "1px solid var(--lib-border)" : "none",
                    }}
                  >
                    <Link
                      href={`/guides/${post.slug}`}
                      style={{ textDecoration: "none" }}
                    >
                      <h2
                        style={{
                          fontFamily: "var(--font-serif), Georgia, serif",
                          fontSize: 20,
                          fontWeight: 500,
                          color: "var(--lib-ink)",
                          marginBottom: 8,
                          lineHeight: 1.3,
                        }}
                      >
                        {post.title}
                      </h2>
                    </Link>
                    <p
                      style={{
                        fontSize: 14,
                        color: "var(--lib-dusk)",
                        lineHeight: 1.65,
                        marginBottom: 10,
                        fontFamily: "var(--font-sans), system-ui, sans-serif",
                        fontWeight: 300,
                      }}
                    >
                      {post.description}
                    </p>
                    <Link
                      href={`/guides/${post.slug}`}
                      style={{
                        fontSize: 12,
                        color: "var(--lib-wood-dim)",
                        fontWeight: 500,
                        textDecoration: "none",
                        fontFamily: "var(--font-sans), system-ui, sans-serif",
                      }}
                    >
                      {t("readGuide")} →
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <div style={{ marginTop: 48 }}>
              <AdBanner adSlot="5566778899" style={{ minHeight: 90 }} />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
