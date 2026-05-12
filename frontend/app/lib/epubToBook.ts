"use client";
// Parses an EPUB Blob into a BookModel using JSZip.
// Runs entirely in the browser — no server call needed.

import JSZip from "jszip";
import { BookModel, BookMeta, Chapter, Block, Block as BlockType, uid, defaultMeta } from "./bookModel";

export async function epubBlobToBook(
  blob: Blob,
  hint: Partial<BookMeta> = {},
): Promise<BookModel> {
  const zip = await JSZip.loadAsync(blob);

  // ── 1. container.xml → OPF path ─────────────────────────────────────────
  const containerXml = await zip.file("META-INF/container.xml")?.async("text");
  if (!containerXml) throw new Error("Invalid EPUB: missing container.xml");

  const opfMatch = containerXml.match(/full-path="([^"]+)"/);
  if (!opfMatch) throw new Error("Invalid EPUB: cannot locate OPF");
  const opfPath = opfMatch[1];
  const opfDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";

  // ── 2. OPF → spine order + manifest ─────────────────────────────────────
  const opfXml = await zip.file(opfPath)?.async("text");
  if (!opfXml) throw new Error("Invalid EPUB: missing OPF");

  const manifest: Record<string, string> = {};
  for (const m of opfXml.matchAll(/<item[^>]+id="([^"]+)"[^>]+href="([^"]+)"/g)) {
    manifest[m[1]] = m[2];
  }
  const spine: string[] = [];
  for (const m of opfXml.matchAll(/<itemref[^>]+idref="([^"]+)"/g)) {
    spine.push(m[1]);
  }

  // ── 3. Parse each spine document into Chapter ───────────────────────────
  const chapters: Chapter[] = [];
  for (const idref of spine) {
    const href = manifest[idref];
    if (!href || href.includes("nav") || href.includes("toc")) continue;
    const fullPath = opfDir + href;
    const html = await zip.file(fullPath)?.async("text");
    if (!html) continue;

    const blocks = parseHtmlToBlocks(html);
    if (blocks.length === 0) continue;

    // Chapter title = first h1 text, or filename
    const firstH1 = blocks.find((b) => b.type === "h2" || (b as TextBlock).html?.startsWith("<h"));
    const title =
      blocks[0]?.type === "paragraph" && blocks.length === 1 && !(blocks[0] as TextBlock).html
        ? href.replace(/\.[^.]+$/, "")
        : extractFirstHeading(html) || href.replace(/\.[^.]+$/, "");

    chapters.push({
      id: uid(),
      title,
      blocks,
      collapsed: false,
    });
  }

  // ── 4. Extract metadata from OPF ────────────────────────────────────────
  const titleMatch = opfXml.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/);
  const authorMatch = opfXml.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/);
  const langMatch = opfXml.match(/<dc:language[^>]*>([^<]+)<\/dc:language>/);
  const pubMatch = opfXml.match(/<dc:publisher[^>]*>([^<]+)<\/dc:publisher>/);
  const dateMatch = opfXml.match(/<dc:date[^>]*>([^<]+)<\/dc:date>/);

  const base = defaultMeta();
  const meta: BookMeta = {
    ...base,
    ...hint,
    title: hint.title || titleMatch?.[1]?.trim() || "",
    author: hint.author || authorMatch?.[1]?.trim() || "",
    language: (hint.language || langMatch?.[1]?.trim().slice(0, 2) || "ko") as BookMeta["language"],
    publisher: hint.publisher || pubMatch?.[1]?.trim() || "",
    date: hint.date || dateMatch?.[1]?.trim() || base.date,
  };

  return {
    meta,
    chapters: chapters.length > 0 ? chapters : [
      { id: uid(), title: "챕터 1", blocks: [{ id: uid(), type: "paragraph", html: "" }], collapsed: false },
    ],
  };
}

// ── HTML → Block[] ───────────────────────────────────────────────────────────

type TextBlock = Extract<BlockType, { type: "paragraph" | "h2" | "h3" | "quote" }>;

function parseHtmlToBlocks(html: string): Block[] {
  if (typeof DOMParser === "undefined") {
    // SSR fallback: return a single paragraph with stripped text
    return [{ id: uid(), type: "paragraph", html: stripTags(html) }];
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const body = doc.querySelector("body") ?? doc.documentElement;

  // Remove non-content elements
  body.querySelectorAll("nav, script, style, link").forEach((el) => el.remove());

  const blocks: Block[] = [];

  function visit(el: Element) {
    const tag = el.tagName?.toLowerCase();
    switch (tag) {
      case "h1":
        // h1 becomes the chapter title — skip as a block (it's in Chapter.title)
        break;
      case "h2":
        blocks.push({ id: uid(), type: "h2", html: el.innerHTML.trim() });
        break;
      case "h3":
        blocks.push({ id: uid(), type: "h3", html: el.innerHTML.trim() });
        break;
      case "p": {
        const inner = el.innerHTML.trim();
        if (inner) blocks.push({ id: uid(), type: "paragraph", html: inner });
        break;
      }
      case "blockquote":
        blocks.push({ id: uid(), type: "quote", html: el.innerHTML.trim() });
        break;
      case "img": {
        const src = el.getAttribute("src") ?? "";
        blocks.push({ id: uid(), type: "image", src, alt: el.getAttribute("alt") ?? "", caption: "" });
        break;
      }
      case "figure": {
        const img = el.querySelector("img");
        if (img) {
          blocks.push({
            id: uid(), type: "image",
            src: img.getAttribute("src") ?? "",
            alt: img.getAttribute("alt") ?? "",
            caption: el.querySelector("figcaption")?.textContent?.trim() ?? "",
          });
        }
        break;
      }
      default:
        // Recurse into container elements
        for (const child of Array.from(el.children)) visit(child);
    }
  }

  for (const child of Array.from(body.children)) visit(child);

  return blocks.length > 0 ? blocks : [{ id: uid(), type: "paragraph", html: "" }];
}

function extractFirstHeading(html: string): string | null {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return null;
  return m[1].replace(/<[^>]+>/g, "").trim() || null;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
