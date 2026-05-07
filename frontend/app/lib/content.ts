import fs from "fs";
import path from "path";
import { marked } from "marked";

const CONTENT_DIR = path.join(process.cwd(), "content");

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  readingTime: number;
  slugs: Record<string, string>; // cross-locale slug map
  locale: string;
  section: string;
}

export interface Post extends PostMeta {
  contentHtml: string;
  headings: { id: string; text: string; level: number }[];
}

// ── Simple YAML frontmatter parser ──────────────────────────────
function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };

  const data: Record<string, unknown> = {};
  for (const line of match[1].split("\n")) {
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const key = line.slice(0, colon).trim();
    const raw = line.slice(colon + 1).trim();
    // Array syntax: [a, b, c]
    if (raw.startsWith("[") && raw.endsWith("]")) {
      data[key] = raw
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""));
    } else if (raw === "true") {
      data[key] = true;
    } else if (raw === "false") {
      data[key] = false;
    } else if (!isNaN(Number(raw)) && raw !== "") {
      data[key] = Number(raw);
    } else {
      data[key] = raw.replace(/^["']|["']$/g, "");
    }
  }

  return { data, body: match[2] };
}

// ── Parse nested keys like slugs.en: value ───────────────────────
function buildSlugsFromLines(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  let inSlugs = false;
  for (const line of raw.split("\n")) {
    if (line.trim() === "slugs:") { inSlugs = true; continue; }
    if (inSlugs) {
      if (/^\s{2,}/.test(line)) {
        const [k, ...vs] = line.trim().split(":");
        if (k && vs.length) result[k.trim()] = vs.join(":").trim();
      } else {
        inSlugs = false;
      }
    }
  }
  return result;
}

// ── Estimate reading time (200 wpm) ─────────────────────────────
function estimateReadTime(text: string): number {
  return Math.max(1, Math.ceil(text.split(/\s+/).length / 200));
}

// ── Extract headings for TOC ─────────────────────────────────────
function extractHeadings(html: string): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = [];
  const re = /<h([23])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[23]>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    headings.push({
      level: parseInt(m[1]),
      id: m[2],
      text: m[3].replace(/<[^>]+>/g, ""),
    });
  }
  return headings;
}

// ── Add IDs to headings in HTML ──────────────────────────────────
function addHeadingIds(html: string): string {
  return html.replace(/<h([23])>(.*?)<\/h[23]>/gi, (_, level, text) => {
    const id = text
      .replace(/<[^>]+>/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return `<h${level} id="${id}">${text}</h${level}>`;
  });
}

// ── Public API ───────────────────────────────────────────────────

export function getContentPath(locale: string, section: string): string {
  return path.join(CONTENT_DIR, locale, section);
}

export function getAllPostSlugs(locale: string, section: string): string[] {
  const dir = getContentPath(locale, section);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getAllPosts(locale: string, section: string): PostMeta[] {
  const slugs = getAllPostSlugs(locale, section);
  if (slugs.length > 0) {
    return slugs
      .map((slug) => getPostMeta(locale, section, slug))
      .filter(Boolean)
      .sort((a, b) => new Date(b!.date).getTime() - new Date(a!.date).getTime()) as PostMeta[];
  }

  // Fallback to English — log so untranslated content can be tracked
  if (locale !== "en") {
    console.warn(`[content] No ${section} posts found for locale "${locale}" — falling back to "en"`);
    const enSlugs = getAllPostSlugs("en", section);
    return enSlugs
      .map((slug) => getPostMeta("en", section, slug))
      .filter(Boolean)
      .sort((a, b) => new Date(b!.date).getTime() - new Date(a!.date).getTime()) as PostMeta[];
  }

  return [];
}

export function getPostMeta(
  locale: string,
  section: string,
  slug: string
): PostMeta | null {
  const filePath = path.join(getContentPath(locale, section), `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, body } = parseFrontmatter(raw);
  const slugs = buildSlugsFromLines(raw.split("---")[1] ?? "");

  return {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ""),
    date: String(data.date ?? ""),
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    readingTime: Number(data.readingTime ?? estimateReadTime(body)),
    slugs: Object.keys(slugs).length ? slugs : { [locale]: slug },
    locale,
    section,
  };
}

export async function getPost(
  locale: string,
  section: string,
  slug: string
): Promise<Post | null> {
  let meta = getPostMeta(locale, section, slug);
  let resolvedLocale = locale;

  // Fallback to English if locale-specific file doesn't exist
  if (!meta && locale !== "en") {
    console.warn(`[content] Post "${slug}" not found for locale "${locale}" — falling back to "en"`);
    meta = getPostMeta("en", section, slug);
    resolvedLocale = "en";
  }

  if (!meta) return null;

  const filePath = path.join(getContentPath(resolvedLocale, section), `${slug}.md`);
  const raw = fs.readFileSync(filePath, "utf-8");
  const { body } = parseFrontmatter(raw);

  // Configure marked for clean output
  marked.setOptions({ gfm: true });
  const rawHtml = marked.parse(body) as string;
  const contentHtml = addHeadingIds(rawHtml);

  return {
    ...meta,
    contentHtml,
    headings: extractHeadings(contentHtml),
  };
}

// ── Cross-locale URL helper ───────────────────────────────────────
export function getLocalizedPostUrl(
  post: PostMeta,
  targetLocale: string
): string | null {
  const targetSlug = post.slugs[targetLocale];
  if (!targetSlug) return null;
  return `/${targetLocale}/${post.section}/${targetSlug}`;
}
