"use client";
// Title page + colophon (copyright page) generation, shared by the EPUB builder
// and the live preview so both render identically.
//
// Fixed phrases on the pages follow the BOOK's language (meta.language); UI
// labels in the settings panel follow the UI language and live in i18n messages.

import type { BookMeta } from "./bookModel";

interface BookStrings {
  author: string;
  publisher: string;
  publishDate: string;
  allRightsReserved: string;
}

const STRINGS: Record<string, BookStrings> = {
  ko: { author: "저자", publisher: "출판사", publishDate: "발행일", allRightsReserved: "모든 권리 보유." },
  en: { author: "Author", publisher: "Publisher", publishDate: "Published", allRightsReserved: "All rights reserved." },
  ja: { author: "著者", publisher: "出版社", publishDate: "発行日", allRightsReserved: "無断転載を禁じます。" },
  zh: { author: "作者", publisher: "出版社", publishDate: "出版日期", allRightsReserved: "保留所有权利。" },
};

function strings(lang: string): BookStrings {
  return STRINGS[lang] ?? STRINGS.en;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function yearOf(meta: BookMeta): string {
  const m = (meta.date || "").match(/\d{4}/);
  return m ? m[0] : String(new Date().getFullYear());
}

/** Localized default copyright line (book language). */
export function defaultCopyright(meta: BookMeta): string {
  const s = strings(meta.language);
  const year = yearOf(meta);
  const author = meta.author?.trim();
  return author
    ? `© ${year} ${author}. ${s.allRightsReserved}`
    : `© ${year}. ${s.allRightsReserved}`;
}

/** CSS for both front-matter pages — injected into the XHTML and the preview. */
export const FRONT_MATTER_CSS = `
.titlepage { text-align: center; margin-top: 22%; padding: 0 1em; }
.titlepage .tp-title { font-size: 2em; font-weight: 700; line-height: 1.25; margin-bottom: 0.4em; }
.titlepage .tp-subtitle { font-size: 1.2em; font-style: italic; color: #666; margin-bottom: 1.6em; }
.titlepage .tp-author { font-size: 1.1em; margin-top: 2em; }
.titlepage .tp-publisher { font-size: 0.95em; color: #666; margin-top: 0.5em; }
.colophon { text-align: center; margin-top: 18%; padding: 0 1em; font-size: 0.95em; }
.colophon .cp-title { font-size: 1.4em; font-weight: 700; margin-bottom: 1.4em; }
.colophon .cp-meta { line-height: 1.9; margin-bottom: 1.4em; }
.colophon .cp-meta p { margin: 0.15em 0; }
.colophon .cp-label { color: #888; margin-right: 0.4em; }
.colophon .cp-copyright { margin-top: 1.4em; font-size: 0.9em; color: #555; }
`;

export function titlePageInnerHtml(meta: BookMeta): string {
  const subtitle = meta.subtitle?.trim()
    ? `\n    <p class="tp-subtitle">${esc(meta.subtitle)}</p>` : "";
  const author = meta.author?.trim()
    ? `\n    <p class="tp-author">${esc(meta.author)}</p>` : "";
  const publisher = meta.publisher?.trim()
    ? `\n    <p class="tp-publisher">${esc(meta.publisher)}</p>` : "";
  return `<div class="titlepage">
    <h1 class="tp-title">${esc(meta.title || "")}</h1>${subtitle}${author}${publisher}
  </div>`;
}

export function colophonInnerHtml(meta: BookMeta): string {
  const s = strings(meta.language);
  const rows: string[] = [];
  if (meta.author?.trim()) rows.push(`<p><span class="cp-label">${s.author}</span>${esc(meta.author)}</p>`);
  if (meta.publisher?.trim()) rows.push(`<p><span class="cp-label">${s.publisher}</span>${esc(meta.publisher)}</p>`);
  if (meta.date?.trim()) rows.push(`<p><span class="cp-label">${s.publishDate}</span>${esc(meta.date)}</p>`);
  if (meta.isbn?.trim()) rows.push(`<p><span class="cp-label">ISBN</span>${esc(meta.isbn)}</p>`);
  const copyright = meta.copyright?.trim() || defaultCopyright(meta);
  return `<div class="colophon">
    <h1 class="cp-title">${esc(meta.title || "")}</h1>
    <div class="cp-meta">${rows.join("\n      ")}</div>
    <p class="cp-copyright">${esc(copyright)}</p>
  </div>`;
}

function pageXhtml(meta: BookMeta, epubType: string, inner: string, titleText: string): string {
  const lang = esc(meta.language || "en");
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:epub="http://www.idpf.org/2007/ops"
      xml:lang="${lang}" lang="${lang}">
<head>
  <meta charset="UTF-8"/>
  <title>${esc(titleText)}</title>
  <link rel="stylesheet" type="text/css" href="styles/style.css"/>
  <style type="text/css">${FRONT_MATTER_CSS}</style>
</head>
<body epub:type="${epubType}">
  ${inner}
</body>
</html>`;
}

export function buildTitlePageXhtml(meta: BookMeta): string {
  return pageXhtml(meta, "titlepage", titlePageInnerHtml(meta), meta.title || "Title Page");
}

export function buildColophonXhtml(meta: BookMeta): string {
  return pageXhtml(meta, "copyright-page", colophonInnerHtml(meta), meta.title || "Colophon");
}
