"use client";
// Footnote support, shared by the editor, preview, and EPUB builder.
//
// A footnote *reference* is an empty inline marker embedded in a text block's
// HTML: <sup class="fn-ref" data-fn="ID" contenteditable="false"></sup>
// The visible number comes from a CSS counter (editor/preview) or is rendered
// as a real number at build time — so insert/delete renumbers automatically.
//
// The footnote *text* lives in Chapter.footnotes (id -> plain text), i.e. OUTSIDE
// the block HTML, which is why footnote text is excluded from find/replace and
// character counts.

import type { Chapter } from "./bookModel";

const MARKER_SOURCE = '<sup\\b[^>]*\\bdata-fn="([^"]+)"[^>]*>\\s*<\\/sup>';

export function buildMarkerHtml(id: string): string {
  return `<sup class="fn-ref" data-fn="${id}" contenteditable="false"></sup>`;
}

/** Ordered footnote ids referenced within one HTML string. */
export function extractFootnoteIds(html: string): string[] {
  const re = new RegExp(MARKER_SOURCE, "g");
  const ids: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) ids.push(m[1]);
  return ids;
}

/** Ordered footnote ids across a whole chapter (document order). */
export function chapterFootnoteIds(chapter: Chapter): string[] {
  const ids: string[] = [];
  for (const b of chapter.blocks) {
    if (b.type === "image") continue;
    ids.push(...extractFootnoteIds(b.html));
  }
  return ids;
}

/** Map each id to its 1-based chapter number, in document order. */
export function footnoteNumberMap(ids: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  ids.forEach((id, i) => { map[id] = i + 1; });
  return map;
}

/** Remove a single marker (by id) from an HTML string. */
export function stripMarker(html: string, id: string): string {
  const escId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.replace(new RegExp(`<sup\\b[^>]*\\bdata-fn="${escId}"[^>]*>\\s*<\\/sup>`, "g"), "");
}

type Mode = "epub3" | "epub2" | "preview";

/** Replace empty markers with rendered, numbered references. */
export function renderFootnoteRefs(html: string, numberById: Record<string, number>, mode: Mode): string {
  const re = new RegExp(MARKER_SOURCE, "g");
  return html.replace(re, (_full, id: string) => {
    const n = numberById[id];
    if (!n) return "";
    if (mode === "preview") {
      return `<sup class="fn-ref" id="pv-ref-${n}"><a href="#pv-fn-${n}">${n}</a></sup>`;
    }
    const typeAttr = mode === "epub3" ? ` epub:type="noteref"` : "";
    return `<sup class="fn-ref" id="fnref-${n}"><a${typeAttr} href="#fn-${n}">${n}</a></sup>`;
  });
}

function escText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** The chapter-end footnote list (aside/footnote for EPUB3, div fallback otherwise). */
export function footnoteSectionHtml(
  chapter: Chapter,
  ids: string[],
  numberById: Record<string, number>,
  mode: Mode,
): string {
  if (ids.length === 0) return "";
  const fns = chapter.footnotes ?? {};
  const items = ids.map((id) => {
    const n = numberById[id];
    const text = escText(fns[id] ?? "");
    if (mode === "preview") {
      return `  <div class="footnote" id="pv-fn-${n}"><p><sup>${n}</sup> ${text} <a class="fn-back" href="#pv-ref-${n}">↩</a></p></div>`;
    }
    const back = `<a class="fn-back" href="#fnref-${n}">↩</a>`;
    if (mode === "epub3") {
      return `    <aside epub:type="footnote" id="fn-${n}"><p><sup>${n}</sup> ${text} ${back}</p></aside>`;
    }
    return `    <div class="footnote" id="fn-${n}"><p><sup>${n}</sup> ${text} ${back}</p></div>`;
  }).join("\n");

  if (mode === "preview") {
    return `<div class="footnotes"><hr/>\n${items}\n</div>`;
  }
  if (mode === "epub3") {
    return `<section epub:type="footnotes" class="footnotes">\n  <hr/>\n${items}\n</section>`;
  }
  return `<div class="footnotes">\n  <hr/>\n${items}\n</div>`;
}

/** CSS for references + the footnote list (shared by EPUB output and preview). */
export const FOOTNOTE_CSS = `
.fn-ref { font-size: 0.7em; vertical-align: super; line-height: 0; color: #8b5a2b; }
.fn-ref a { text-decoration: none; color: inherit; }
.footnotes { margin-top: 2.5em; font-size: 0.9em; }
.footnotes hr { border: none; border-top: 1px solid #ccc; margin-bottom: 1em; }
.footnotes p { margin: 0.4em 0; line-height: 1.6; }
.footnotes .fn-back { text-decoration: none; margin-left: 0.3em; }
`;

/** CSS counter that numbers empty markers in the editor (no stored numbers). */
export const FOOTNOTE_COUNTER_CSS = `
.be-fn-blocks { counter-reset: footnote; }
.be-fn-blocks sup.fn-ref { counter-increment: footnote; color: var(--lib-wood); cursor: pointer; font-weight: 600; font-size: 0.7em; vertical-align: super; }
.be-fn-blocks sup.fn-ref::after { content: counter(footnote); }
`;
