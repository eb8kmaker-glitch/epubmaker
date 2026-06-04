import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getPost, getAllPostSlugs } from "@/app/lib/content";
import ArticleLayout from "@/app/components/content/ArticleLayout";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/app/components/content/JsonLd";
import AdFit from "@/app/components/ads/AdFit";

const BASE_URL = "https://www.epubmaker.org";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;

  // Try locale first, fall back to English
  const post = await getPost(locale, "blog", slug) ?? await getPost("en", "blog", slug);
  if (!post) return {};

  const url = `${BASE_URL}/${locale}/blog/${slug}`;

  const languages: Record<string, string> = {};
  for (const [loc, locSlug] of Object.entries(post.slugs)) {
    languages[loc] = `${BASE_URL}/${loc}/blog/${locSlug}`;
  }

  return {
    title: `${post.title} — EPUBMaker`,
    description: post.description,
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url,
      publishedTime: post.date,
      locale,
    },
  };
}

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    const slugs = getAllPostSlugs(locale, "blog");
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
    // Also include English slugs for all locales (fallback)
    if (locale !== "en") {
      const enSlugs = getAllPostSlugs("en", "blog");
      for (const slug of enSlugs) {
        if (!slugs.includes(slug)) {
          params.push({ locale, slug });
        }
      }
    }
  }
  return params;
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  // Try locale, fall back to English
  const post = await getPost(locale, "blog", slug) ?? await getPost("en", "blog", slug);
  if (!post) notFound();

  const t = await getTranslations("Blog");
  const url = `${BASE_URL}/${locale}/blog/${slug}`;

  const breadcrumbs = [
    { name: "EPUBMaker", url: `${BASE_URL}/${locale}` },
    { name: t("title"), url: `${BASE_URL}/${locale}/blog` },
    { name: post.title, url },
  ];

  return (
    <>
      <ArticleJsonLd
        title={post.title}
        description={post.description}
        url={url}
        datePublished={post.date}
        locale={locale}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />

      <div style={{ background: "var(--lib-bg)", minHeight: "100vh" }}>
        <ArticleLayout
          post={post}
          backHref="/blog"
          backLabel={`← ${t("backToBlog")}`}
          tableOfContentsLabel={t("tableOfContents")}
        />

        {/* 글 하단 CTA 위 광고 */}
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 36px 64px", display: "flex", justifyContent: "center" }}>
          <AdFit
            adUnit="DAN-wIRxEO1tx9SUVgKz"
            width={300}
            height={250}
          />
        </div>
      </div>
    </>
  );
}
