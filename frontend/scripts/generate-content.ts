/**
 * EPUBMaker Content Generator
 *
 * Automatically generates SEO-optimized blog posts / guides using the
 * Anthropic Claude API and writes them to the correct locale folder.
 *
 * Usage:
 *   npx ts-node scripts/generate-content.ts \
 *     --topic "How to set metadata in EPUB" \
 *     --section blog \
 *     --locales en,ko \
 *     --slug epub-metadata-guide
 *
 * Prerequisites:
 *   export ANTHROPIC_API_KEY=sk-ant-...
 *   npm install --save-dev ts-node @anthropic-ai/sdk
 */

import fs from "fs";
import path from "path";

// ── Config ────────────────────────────────────────────────────────
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CONTENT_DIR = path.join(__dirname, "..", "content");
const MODEL = "claude-opus-4-6";

// ── CLI args ──────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  return {
    topic: get("--topic") ?? "EPUB metadata guide",
    section: (get("--section") ?? "blog") as "blog" | "guides",
    locales: (get("--locales") ?? "en").split(","),
    slug: get("--slug") ?? slugify(get("--topic") ?? "article"),
  };
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── Anthropic API call ────────────────────────────────────────────
async function callClaude(prompt: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error: ${res.status} — ${err}`);
  }

  const data = (await res.json()) as {
    content: { type: string; text: string }[];
  };
  return data.content.find((c) => c.type === "text")?.text ?? "";
}

// ── Prompts ───────────────────────────────────────────────────────
const LOCALE_STYLES: Record<string, string> = {
  en: "Warm, informative tone — like a knowledgeable librarian helping a writer.",
  ko: "친절하고 부드러운 SaaS 서비스 문체. 너무 딱딱하지 않게, 실제 사용자에게 말하듯 자연스럽게.",
  ja: "丁寧で落ち着いた文体。「〜できます」「〜してください」を基本とし、読者に寄り添う説明を心がける。",
  es: "Tono cercano y práctico, propio de un servicio web de calidad. Evita el estilo de manual técnico o la traducción literal del inglés.",
  de: "Klar, direkt und funktionsorientiert. Kurze Sätze bevorzugen. Kein übermäßig formeller Ton.",
  zh: "自然流畅的互联网产品文案风格。简洁明了，避免生硬的直译表达，使用简体中文。",
  fr: "Ton professionnel mais accessible, adapté aux services numériques. Phrases claires et bien structurées.",
  pt: "Tom amigável e direto, como se fosse um serviço digital brasileiro/português de qualidade. Evite traduções literais do inglês.",
};

function buildPrompt(topic: string, locale: string, slug: string, section: string): string {
  const langName =
    { en: "English", ko: "Korean", es: "Spanish", ja: "Japanese", zh: "Chinese", pt: "Portuguese", de: "German", fr: "French" }[locale] ?? locale;
  const style = LOCALE_STYLES[locale] ?? "Clear, helpful and natural for a native speaker.";

  return `You are an expert technical writer specializing in digital publishing and EPUB creation.
You are writing for native ${langName} speakers — NOT translating from English.
This must feel like content written by a local author, not a translation tool.

Write a comprehensive, SEO-optimized ${section === "guides" ? "how-to guide" : "blog article"} in ${langName} about:

**Topic:** ${topic}

Tone & Style (critical):
${style}

Requirements:
1. Write ONLY the Markdown content — no preamble, no explanations
2. Start with a YAML frontmatter block wrapped in --- delimiters
3. Frontmatter must include:
   - title (compelling, SEO-optimized, natural in ${langName} — not a literal English translation)
   - description (150-160 chars, in ${langName})
   - date (today's date: ${new Date().toISOString().split("T")[0]})
   - tags (array of 3-6 relevant lowercase tags, in ${langName} if appropriate)
   - readingTime (estimated minutes to read)
   - slugs section with: ${locale}: ${slug}
4. Article body:
   - 800-1200 words in ${langName}
   - Use ## and ### headings (in ${langName})
   - Include practical examples and comparison tables where relevant
   - Use natural ${langName} terminology for: EPUB, table of contents (TOC), metadata, manuscript, cover image
   - End with a clear, actionable conclusion
   - Reference EPUBMaker features naturally (conversion, TOC editor, CSS presets)
5. Do NOT produce a literal translation — adapt idioms, examples, and terminology to feel native

Output ONLY the frontmatter + Markdown body. Nothing else.`;
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  const { topic, section, locales, slug } = parseArgs();

  console.log(`\nGenerating: "${topic}"`);
  console.log(`Section: ${section}, Slug: ${slug}, Locales: ${locales.join(", ")}\n`);

  for (const locale of locales) {
    const dir = path.join(CONTENT_DIR, locale, section);
    fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, `${slug}.md`);
    if (fs.existsSync(filePath)) {
      console.log(`  [${locale}] Skipping — ${filePath} already exists`);
      continue;
    }

    console.log(`  [${locale}] Calling Claude API...`);
    const prompt = buildPrompt(topic, locale, slug, section);
    const content = await callClaude(prompt);

    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`  [${locale}] Saved to ${filePath}`);

    // Small delay between requests
    if (locales.indexOf(locale) < locales.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log("\nDone! Don't forget to:");
  console.log("  git add content/");
  console.log("  git commit -m 'content: add generated article'");
  console.log("  git push origin main\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
