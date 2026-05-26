import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getAllPosts } from "@/app/lib/content";

const BASE_URL = "https://www.epubmaker.org";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // Static pages per locale
  const staticPaths = ["", "/convert", "/blog", "/faq", "/guides", "/announcement"];

  for (const locale of routing.locales) {
    for (const path of staticPaths) {
      entries.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path === "" ? "weekly" : "monthly",
        priority: path === "" ? 1.0 : path === "/blog" || path === "/faq" ? 0.9 : 0.8,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((loc) => [loc, `${BASE_URL}/${loc}${path}`])
          ),
        },
      });
    }
  }

  // SEO landing pages (ko + en only)
  const seoLandingPaths = [
    "/sigil-alternative",
    "/how-to-make-epub",
    "/pdf-to-epub",
    "/free-ebook-creator",
  ];

  for (const locale of ["ko", "en"]) {
    for (const path of seoLandingPaths) {
      entries.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: {
          languages: {
            ko: `${BASE_URL}/ko${path}`,
            en: `${BASE_URL}/en${path}`,
          },
        },
      });
    }
  }

  // Blog posts
  for (const locale of routing.locales) {
    const posts = getAllPosts(locale, "blog");
    for (const post of posts) {
      const url = `${BASE_URL}/${locale}/blog/${post.slug}`;
      entries.push({
        url,
        lastModified: new Date(post.date),
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: {
          languages: Object.fromEntries(
            Object.entries(post.slugs).map(([loc, slug]) => [
              loc,
              `${BASE_URL}/${loc}/blog/${slug}`,
            ])
          ),
        },
      });
    }
  }

  // Guides
  for (const locale of routing.locales) {
    const posts = getAllPosts(locale, "guides");
    for (const post of posts) {
      entries.push({
        url: `${BASE_URL}/${locale}/guides/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
