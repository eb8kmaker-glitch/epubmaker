import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getAllPosts } from "@/app/lib/content";
import AdBanner from "@/app/components/ads/AdBanner";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Blog" });
  return {
    title: `${t("title")} — EPUBMaker`,
    description: t("subtitle"),
    alternates: {
      canonical: `https://www.epubmaker.org/${locale}/blog`,
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("Blog");

  // Load posts for this locale; fall back to English if locale has no posts
  let posts = getAllPosts(locale, "blog");
  if (posts.length === 0 && locale !== "en") {
    posts = getAllPosts("en", "blog");
  }

  return (
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

      {/* Post list */}
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
              {t("noArticles")}
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {posts.map((post, i) => (
                <li
                  key={post.slug}
                  style={{
                    paddingBottom: 32,
                    marginBottom: 32,
                    borderBottom: i < posts.length - 1 ? "1px solid var(--lib-border)" : "none",
                  }}
                >
                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: 11,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "var(--lib-dust)",
                            background: "var(--lib-bg-3)",
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontFamily: "var(--font-sans), system-ui, sans-serif",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <Link
                    href={`/blog/${post.slug}`}
                    style={{ textDecoration: "none" }}
                  >
                    <h2
                      style={{
                        fontFamily: "var(--font-serif), Georgia, serif",
                        fontSize: 22,
                        fontWeight: 500,
                        color: "var(--lib-ink)",
                        marginBottom: 8,
                        lineHeight: 1.3,
                        transition: "color 150ms ease",
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
                      marginBottom: 14,
                      fontFamily: "var(--font-sans), system-ui, sans-serif",
                      fontWeight: 300,
                    }}
                  >
                    {post.description}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--lib-dust)",
                        fontFamily: "var(--font-sans), system-ui, sans-serif",
                      }}
                    >
                      {new Date(post.date).toLocaleDateString(locale, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--lib-dust)",
                        fontFamily: "var(--font-sans), system-ui, sans-serif",
                      }}
                    >
                      {t("minRead", { min: post.readingTime })}
                    </span>
                    <Link
                      href={`/blog/${post.slug}`}
                      style={{
                        fontSize: 12,
                        color: "var(--lib-wood-dim)",
                        textDecoration: "none",
                        fontWeight: 500,
                        fontFamily: "var(--font-sans), system-ui, sans-serif",
                        transition: "opacity 150ms ease",
                      }}
                    >
                      {t("readMore")} →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Ad */}
          <div style={{ marginTop: 48 }}>
            <AdBanner adSlot="2233445566" style={{ minHeight: 90 }} />
          </div>
        </div>
      </section>
    </div>
  );
}
