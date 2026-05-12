"use client";
// Builds an EPUB Blob from a BookModel — runs entirely in the browser.

import JSZip from "jszip";
import { BookModel, Chapter, Block, uid } from "./bookModel";
import { EPUB_STYLES } from "./epubStyles";

// ── Public API ────────────────────────────────────────────────────────────────

export async function buildEpubFromBook(
  book: BookModel,
): Promise<{ blob: Blob; filename: string }> {
  const zip = new JSZip();
  const bookId = uid();
  const isEpub3 = book.meta.epubVersion !== "epub2";

  // mimetype must be first and uncompressed
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  // META-INF/container.xml
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:schemas:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  );

  // CSS
  const css = book.meta.style === "custom" && book.meta.customCss
    ? book.meta.customCss
    : (EPUB_STYLES[book.meta.style] ?? EPUB_STYLES.default ?? "");
  zip.file("OEBPS/styles/style.css", css);

  // Chapter XHTMLs
  const chapterFiles: string[] = [];
  for (let i = 0; i < book.chapters.length; i++) {
    const ch = book.chapters[i];
    const fn = `chapter${String(i + 1).padStart(3, "0")}.xhtml`;
    chapterFiles.push(fn);
    zip.file(`OEBPS/${fn}`, chapterToXhtml(ch));
  }

  // toc.ncx (EPUB2 & EPUB3 compat)
  if (book.meta.toc) {
    zip.file("OEBPS/toc.ncx", buildNcx(book, bookId, chapterFiles));
  }

  // nav.xhtml (EPUB3 only)
  if (isEpub3 && book.meta.toc) {
    zip.file("OEBPS/nav.xhtml", buildNav(book, chapterFiles));
  }

  // content.opf
  zip.file("OEBPS/content.opf", buildOpf(book, bookId, chapterFiles, isEpub3));

  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/epub+zip",
  });

  const safeName = (book.meta.title || "book")
    .replace(/[^\w가-힣\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 60) || "book";

  return { blob, filename: `${safeName}.epub` };
}

// ── Chapter → XHTML ──────────────────────────────────────────────────────────

function chapterToXhtml(ch: Chapter): string {
  const bodyBlocks = ch.blocks.map(blockToXhtml).filter(Boolean).join("\n  ");
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ko" lang="ko">
<head>
  <meta charset="UTF-8"/>
  <title>${esc(ch.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles/style.css"/>
</head>
<body>
  <h1>${esc(ch.title)}</h1>
  ${bodyBlocks}
</body>
</html>`;
}

function blockToXhtml(block: Block): string {
  switch (block.type) {
    case "paragraph":
      return block.html ? `<p>${sanitize(block.html)}</p>` : "";
    case "h2":
      return block.html ? `<h2>${sanitize(block.html)}</h2>` : "";
    case "h3":
      return block.html ? `<h3>${sanitize(block.html)}</h3>` : "";
    case "quote":
      return block.html ? `<blockquote><p>${sanitize(block.html)}</p></blockquote>` : "";
    case "image": {
      if (!block.src) return "";
      const fig = block.caption
        ? `<figure><img src="${esc(block.src)}" alt="${esc(block.alt)}"/><figcaption>${esc(block.caption)}</figcaption></figure>`
        : `<figure><img src="${esc(block.src)}" alt="${esc(block.alt)}"/></figure>`;
      return fig;
    }
    default:
      return "";
  }
}

// ── OPF ──────────────────────────────────────────────────────────────────────

function buildOpf(
  book: BookModel,
  bookId: string,
  chapterFiles: string[],
  isEpub3: boolean,
): string {
  const { meta } = book;
  const version = isEpub3 ? "3.0" : "2.0";
  const manifestItems = chapterFiles
    .map((fn, i) => `    <item id="ch${i + 1}" href="${fn}" media-type="application/xhtml+xml"/>`)
    .join("\n");
  const spineItems = chapterFiles
    .map((_, i) => `    <itemref idref="ch${i + 1}"/>`)
    .join("\n");
  const navItem = isEpub3 && meta.toc
    ? `    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>\n`
    : "";
  const ncxItem = meta.toc
    ? `    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>\n`
    : "";
  const ncxAttr = meta.toc ? ` toc="ncx"` : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="${version}" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:identifier id="uid">${bookId}</dc:identifier>
    <dc:title>${esc(meta.title || "Untitled")}</dc:title>
    <dc:creator>${esc(meta.author || "Unknown")}</dc:creator>
    <dc:language>${esc(meta.language)}</dc:language>
    ${meta.publisher ? `<dc:publisher>${esc(meta.publisher)}</dc:publisher>` : ""}
    ${meta.date ? `<dc:date>${esc(meta.date)}</dc:date>` : ""}
  </metadata>
  <manifest>
    <item id="css" href="styles/style.css" media-type="text/css"/>
${navItem}${ncxItem}${manifestItems}
  </manifest>
  <spine${ncxAttr}>
${spineItems}
  </spine>
</package>`;
}

// ── NCX ──────────────────────────────────────────────────────────────────────

function buildNcx(book: BookModel, bookId: string, chapterFiles: string[]): string {
  const points = book.chapters
    .map((ch, i) => `  <navPoint id="np${i + 1}" playOrder="${i + 1}">
    <navLabel><text>${esc(ch.title)}</text></navLabel>
    <content src="${chapterFiles[i]}"/>
  </navPoint>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${bookId}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${esc(book.meta.title || "Untitled")}</text></docTitle>
  <navMap>
${points}
  </navMap>
</ncx>`;
}

// ── Nav (EPUB3) ───────────────────────────────────────────────────────────────

function buildNav(book: BookModel, chapterFiles: string[]): string {
  const items = book.chapters
    .map((ch, i) => `      <li><a href="${chapterFiles[i]}">${esc(ch.title)}</a></li>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><meta charset="UTF-8"/><title>Table of Contents</title></head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>목차</h1>
    <ol>
${items}
    </ol>
  </nav>
</body>
</html>`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** XML-escape a string */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Allow basic inline HTML but strip potentially invalid XML */
function sanitize(html: string): string {
  // For now, return as-is (contenteditable produces reasonable HTML)
  // In production you'd want DOMPurify here
  return html;
}
