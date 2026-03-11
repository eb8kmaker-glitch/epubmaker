/**
 * Normalize PDF, Markdown, or HTML input to a single HTML string for EPUB conversion.
 * Pipeline: input → normalize → HTML → (pandoc) → EPUB
 */

import * as cheerio from "cheerio";
import { marked } from "marked";
import { PDFParse } from "pdf-parse";

const DEFAULT_HTML_WRAP = "<!DOCTYPE html><html><head><meta charset=\"utf-8\"/></head><body>{content}</body></html>";

export type NormalizeInput =
  | { type: "pdf"; buffer: Buffer }
  | { type: "md"; text: string }
  | { type: "html"; text: string };

/**
 * Extract text from PDF and wrap in minimal HTML (paragraphs).
 * Headings are not detected; text is wrapped in <p> blocks by splitting on double newlines.
 */
export async function pdfToHtml(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    await parser.destroy();
    const text = result?.text ?? "";
    const paragraphs = text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    const body = paragraphs.length
      ? paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n")
      : "<p></p>";
    return DEFAULT_HTML_WRAP.replace("{content}", body);
  } finally {
    await parser.destroy().catch(() => {});
  }
}

/**
 * Convert Markdown to HTML. Preserves heading structure (h1–h3) for TOC.
 */
export async function mdToHtml(md: string): Promise<string> {
  marked.setOptions({ gfm: true });
  const body = (await marked.parse(md)) as string;
  return DEFAULT_HTML_WRAP.replace("{content}", body ?? "");
}

/**
 * Normalize HTML: parse with cheerio and return full document HTML.
 * Ensures charset and preserves heading structure for TOC extraction.
 */
export function htmlNormalize(html: string): string {
  const $ = cheerio.load(html);
  if (!$("head meta[charset]").length) {
    $("head").prepend('<meta charset="utf-8"/>');
  }
  return $.html();
}

/**
 * Normalize any supported input to HTML string for pandoc.
 */
export async function normalizeToHtml(input: NormalizeInput): Promise<string> {
  switch (input.type) {
    case "pdf":
      return pdfToHtml(input.buffer);
    case "md":
      return mdToHtml(input.text);
    case "html":
      return htmlNormalize(input.text);
    default:
      throw new Error("Unsupported input type");
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
