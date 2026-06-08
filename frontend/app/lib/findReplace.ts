"use client";
// Find/Replace across all chapters of a BookModel.
//
// Text blocks store rich HTML (inline <b>/<i>/… formatting). To preserve that
// formatting, all matching and replacement happens *inside individual text
// nodes* (walked via the DOM). A match that would span a formatting boundary
// lives across two text nodes and is therefore never detected — it is excluded
// from both the count and replacement, by design.

import type { BookModel } from "./bookModel";

export interface SearchMatch {
  chapterId: string;
  chapterIndex: number;
  blockId: string;
  start: number;  // offset within the block's concatenated text-node text
  length: number;
}

/** Non-overlapping occurrence indices of `query` within `text`. */
export function indicesOf(text: string, query: string, caseSensitive: boolean): number[] {
  if (!query) return [];
  const hay = caseSensitive ? text : text.toLowerCase();
  const needle = caseSensitive ? query : query.toLowerCase();
  const out: number[] = [];
  let i = hay.indexOf(needle);
  while (i !== -1) {
    out.push(i);
    i = hay.indexOf(needle, i + needle.length);
  }
  return out;
}

function textNodesOf(container: HTMLElement): Text[] {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let n = walker.nextNode();
  while (n) { nodes.push(n as Text); n = walker.nextNode(); }
  return nodes;
}

/** Matches within one block's HTML, expressed as block-global offsets. */
function matchesInHtml(html: string, query: string, caseSensitive: boolean): Array<{ start: number; length: number }> {
  if (!query || typeof document === "undefined") return [];
  const div = document.createElement("div");
  div.innerHTML = html;
  const res: Array<{ start: number; length: number }> = [];
  let cum = 0;
  for (const node of textNodesOf(div)) {
    const nv = node.nodeValue ?? "";
    for (const idx of indicesOf(nv, query, caseSensitive)) {
      res.push({ start: cum + idx, length: query.length });
    }
    cum += nv.length;
  }
  return res;
}

/** All matches across every text block, in document order. */
export function findMatches(book: BookModel, query: string, caseSensitive: boolean): SearchMatch[] {
  const out: SearchMatch[] = [];
  if (!query) return out;
  book.chapters.forEach((ch, ci) => {
    for (const b of ch.blocks) {
      if (b.type === "image") continue;
      for (const m of matchesInHtml(b.html, query, caseSensitive)) {
        out.push({ chapterId: ch.id, chapterIndex: ci, blockId: b.id, start: m.start, length: m.length });
      }
    }
  });
  return out;
}

/**
 * Rewrite a block's HTML, replacing text-node content only.
 * `single` (a block-global offset) replaces that one occurrence; otherwise all.
 */
function replaceInHtml(
  html: string, query: string, replacement: string, caseSensitive: boolean, single?: number,
): { html: string; count: number } {
  if (!query || typeof document === "undefined") return { html, count: 0 };
  const div = document.createElement("div");
  div.innerHTML = html;
  let cum = 0;
  let count = 0;
  for (const node of textNodesOf(div)) {
    const nv = node.nodeValue ?? "";
    if (single !== undefined) {
      if (single >= cum && single < cum + nv.length) {
        const local = single - cum;
        node.nodeValue = nv.slice(0, local) + replacement + nv.slice(local + query.length);
        count = 1;
        break;
      }
    } else {
      const idxs = indicesOf(nv, query, caseSensitive);
      if (idxs.length) {
        let s = nv;
        // Rebuild from the end so earlier indices stay valid.
        for (let k = idxs.length - 1; k >= 0; k--) {
          s = s.slice(0, idxs[k]) + replacement + s.slice(idxs[k] + query.length);
        }
        node.nodeValue = s;
        count += idxs.length;
      }
    }
    cum += nv.length;
  }
  return { html: div.innerHTML, count };
}

/** Replace every match across the whole book. Returns a new book + total count. */
export function replaceAll(
  book: BookModel, query: string, replacement: string, caseSensitive: boolean,
): { book: BookModel; count: number } {
  let count = 0;
  const chapters = book.chapters.map((ch) => ({
    ...ch,
    blocks: ch.blocks.map((b) => {
      if (b.type === "image") return b;
      const r = replaceInHtml(b.html, query, replacement, caseSensitive);
      count += r.count;
      return r.count ? { ...b, html: r.html } : b;
    }),
  }));
  return { book: { ...book, chapters }, count };
}

/** Replace a single match (identified by chapter/block/offset). */
export function replaceSingle(
  book: BookModel, match: SearchMatch, query: string, replacement: string, caseSensitive: boolean,
): BookModel {
  const chapters = book.chapters.map((ch) => {
    if (ch.id !== match.chapterId) return ch;
    return {
      ...ch,
      blocks: ch.blocks.map((b) => {
        if (b.id !== match.blockId || b.type === "image") return b;
        const r = replaceInHtml(b.html, query, replacement, caseSensitive, match.start);
        return r.count ? { ...b, html: r.html } : b;
      }),
    };
  });
  return { ...book, chapters };
}
