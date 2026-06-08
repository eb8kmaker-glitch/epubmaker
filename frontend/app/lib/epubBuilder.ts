"use client";
// Builds an EPUB Blob from a BookModel — runs entirely in the browser.

import JSZip from "jszip";
import { BookModel, Chapter, Block, ImageBlock, uid } from "./bookModel";
import { EPUB_STYLES, IMAGE_BASE_CSS } from "./epubStyles";
import { buildTitlePageXhtml, buildColophonXhtml } from "./frontMatter";
import {
  chapterFootnoteIds, footnoteNumberMap, renderFootnoteRefs, footnoteSectionHtml, FOOTNOTE_CSS,
} from "./footnotes";

// ── Image helpers ─────────────────────────────────────────────────────────────

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function sanitizeImageFilename(blob: Blob, chapterIndex: number, imageIndex: number): string {
  const ext = MIME_TO_EXT[blob.type] ?? "jpg";
  return `img_ch${String(chapterIndex).padStart(2, "0")}_${String(imageIndex).padStart(3, "0")}.${ext}`;
}

interface ImageEntry {
  epubFilename: string;  // e.g. img_ch01_001.jpg
  blob: Blob;
  mimeType: string;
}

interface CoverEntry {
  epubFilename: string;  // e.g. cover.jpg (under OEBPS/images/)
  mimeType: string;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function buildEpubFromBook(
  book: BookModel,
): Promise<{ blob: Blob; filename: string }> {
  const zip = new JSZip();
  const bookId = uid();
  const isEpub3 = book.meta.epubVersion !== "epub2";

  // 1. mimetype — must be first and uncompressed (EPUB spec)
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  // 2. META-INF
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:schemas:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  );

  // 3. CSS — always append IMAGE_BASE_CSS so images are bounded in all viewers
  const baseStyle = book.meta.style === "custom" && book.meta.customCss
    ? book.meta.customCss
    : (EPUB_STYLES[book.meta.style] ?? EPUB_STYLES.default ?? "");
  const css = baseStyle.includes("max-width: 100%") ? baseStyle : baseStyle + IMAGE_BASE_CSS;
  zip.file("OEBPS/styles/style.css", css);

  // 4. Collect images across all chapters, assign sanitized filenames
  const imageMap = new Map<string, ImageEntry>(); // blockId → entry
  for (let ci = 0; ci < book.chapters.length; ci++) {
    let imgIdx = 0;
    for (const block of book.chapters[ci].blocks) {
      if (block.type === "image") {
        const ib = block as ImageBlock;
        if (ib.fileBlob) {
          imgIdx++;
          const filename = sanitizeImageFilename(ib.fileBlob, ci + 1, imgIdx);
          imageMap.set(block.id, { epubFilename: filename, blob: ib.fileBlob, mimeType: ib.fileBlob.type });
        }
      }
    }
  }

  // Add image files to zip
  for (const entry of imageMap.values()) {
    zip.file(`OEBPS/images/${entry.epubFilename}`, entry.blob);
  }

  // 4b. Cover image → images/cover.* + cover.xhtml
  let cover: CoverEntry | null = null;
  if (book.meta.coverImage?.blob) {
    const { blob, mimeType } = book.meta.coverImage;
    const ext = MIME_TO_EXT[mimeType] ?? "jpg";
    cover = { epubFilename: `cover.${ext}`, mimeType };
    zip.file(`OEBPS/images/${cover.epubFilename}`, blob);
    zip.file("OEBPS/cover.xhtml", buildCoverXhtml(cover.epubFilename, book.meta.language));
  }

  // 4c. Front/back matter — title page (front) and colophon (back), excluded from TOC
  const includeTitlePage = book.meta.titlePage !== false;
  const includeColophon = book.meta.colophon !== false;
  if (includeTitlePage) zip.file("OEBPS/titlepage.xhtml", buildTitlePageXhtml(book.meta));
  if (includeColophon) zip.file("OEBPS/colophon.xhtml", buildColophonXhtml(book.meta));

  // 5. Chapter XHTMLs
  const chapterFiles: string[] = [];
  for (let i = 0; i < book.chapters.length; i++) {
    const ch = book.chapters[i];
    const fn = `chapter${String(i + 1).padStart(3, "0")}.xhtml`;
    chapterFiles.push(fn);
    zip.file(`OEBPS/${fn}`, chapterToXhtml(ch, imageMap, isEpub3));
  }

  // 6. toc.ncx (EPUB2 & EPUB3 compat)
  if (book.meta.toc) {
    zip.file("OEBPS/toc.ncx", buildNcx(book, bookId, chapterFiles));
  }

  // 7. nav.xhtml (EPUB3 only)
  if (isEpub3 && book.meta.toc) {
    zip.file("OEBPS/nav.xhtml", buildNav(book, chapterFiles));
  }

  // 8. content.opf
  zip.file("OEBPS/content.opf", buildOpf(book, bookId, chapterFiles, isEpub3, imageMap, cover, includeTitlePage, includeColophon));

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

function chapterToXhtml(ch: Chapter, imageMap: Map<string, ImageEntry>, isEpub3: boolean): string {
  const fnIds = chapterFootnoteIds(ch);
  const fnNumbers = footnoteNumberMap(fnIds);
  const fnMode = isEpub3 ? "epub3" : "epub2";
  const bodyBlocks = ch.blocks.map((b) => blockToXhtml(b, imageMap, fnNumbers, fnMode)).filter(Boolean).join("\n  ");
  const fnSection = footnoteSectionHtml(ch, fnIds, fnNumbers, fnMode);
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:epub="http://www.idpf.org/2007/ops"
      xml:lang="ko" lang="ko">
<head>
  <meta charset="UTF-8"/>
  <title>${esc(ch.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles/style.css"/>
  <style type="text/css">
    img { max-width: 100%; height: auto; display: block; }
    figure { margin: 1.5em 0; padding: 0; max-width: 100%; }
    figure img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
    figcaption { font-size: 0.85em; color: #666; text-align: center; margin-top: 0.4em; line-height: 1.4; }
${FOOTNOTE_CSS}  </style>
</head>
<body>
  <h1>${esc(ch.title)}</h1>
  ${bodyBlocks}
${fnSection ? "  " + fnSection + "\n" : ""}</body>
</html>`;
}

function blockToXhtml(
  block: Block,
  imageMap: Map<string, ImageEntry>,
  fnNumbers: Record<string, number>,
  fnMode: "epub3" | "epub2",
): string {
  const text = (html: string) => sanitize(renderFootnoteRefs(html, fnNumbers, fnMode));
  switch (block.type) {
    case "paragraph":
      return block.html ? `<p>${text(block.html)}</p>` : "";
    case "h2":
      return block.html ? `<h2>${text(block.html)}</h2>` : "";
    case "h3":
      return block.html ? `<h3>${text(block.html)}</h3>` : "";
    case "quote":
      return block.html ? `<blockquote><p>${text(block.html)}</p></blockquote>` : "";
    case "image": {
      const entry = imageMap.get(block.id);
      if (!entry && !block.src) return "";
      const imgSrc = entry ? `images/${entry.epubFilename}` : esc(block.src);
      const align = block.align ?? "full";

      if (align === "inline-left" || align === "inline-right") {
        const figureHtml = `<figure style="margin:0;padding:0;">\n          <img src="${imgSrc}" alt="${esc(block.alt)}" style="max-width:100%;height:auto;display:block;"/>${block.caption ? `\n          <figcaption style="font-size:0.85em;color:#666;text-align:center;margin-top:0.4em;line-height:1.4;">${esc(block.caption)}</figcaption>` : ""}\n        </figure>`;
        const textHtml = `<p style="margin:0;">${esc(block.sideText ?? "")}</p>`;
        const imgTd = align === "inline-left"
          ? `<td class="img-col" style="width:40%;vertical-align:top;padding-right:1em;border:none;">\n        ${figureHtml}\n      </td>`
          : `<td class="img-col-right" style="width:40%;vertical-align:top;border:none;">\n        ${figureHtml}\n      </td>`;
        const textTd = align === "inline-left"
          ? `<td class="text-col" style="width:60%;vertical-align:top;border:none;">\n        ${textHtml}\n      </td>`
          : `<td class="text-col-left" style="width:60%;vertical-align:top;padding-right:1em;border:none;">\n        ${textHtml}\n      </td>`;
        const [firstTd, secondTd] = align === "inline-left" ? [imgTd, textTd] : [textTd, imgTd];
        return `<table class="img-inline" style="width:100%;border:none;border-collapse:collapse;margin:1.5em 0;">\n  <tbody>\n    <tr>\n      ${firstTd}\n      ${secondTd}\n    </tr>\n  </tbody>\n</table>`;
      }

      let imgStyle: string;
      let figStyle: string;
      let clearfix = "";

      if (align === "left") {
        imgStyle = 'class="img-left" style="float:left;max-width:40%;height:auto;margin:0.25em 1em 0.5em 0;"';
        figStyle = 'style="margin:1.5em 0;padding:0;max-width:100%;"';
        clearfix = '<div style="clear:both;"></div>';
      } else if (align === "right") {
        imgStyle = 'class="img-right" style="float:right;max-width:40%;height:auto;margin:0.25em 0 0.5em 1em;"';
        figStyle = 'style="margin:1.5em 0;padding:0;max-width:100%;"';
        clearfix = '<div style="clear:both;"></div>';
      } else {
        imgStyle = 'class="img-full" style="max-width:100%;height:auto;display:block;margin:0 auto;"';
        figStyle = 'style="margin:1.5em 0;padding:0;max-width:100%;"';
      }

      const fig = block.caption
        ? `<figure ${figStyle}><img src="${imgSrc}" alt="${esc(block.alt)}" ${imgStyle}/><figcaption style="font-size:0.85em;color:#666;text-align:center;margin-top:0.4em;line-height:1.4;">${esc(block.caption)}</figcaption></figure>${clearfix}`
        : `<figure ${figStyle}><img src="${imgSrc}" alt="${esc(block.alt)}" ${imgStyle}/></figure>${clearfix}`;
      return fig;
    }
    default:
      return "";
  }
}

// ── Cover → XHTML ──────────────────────────────────────────────────────────────

function buildCoverXhtml(coverFilename: string, language: string): string {
  const lang = esc(language || "en");
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:epub="http://www.idpf.org/2007/ops"
      xml:lang="${lang}" lang="${lang}">
<head>
  <meta charset="UTF-8"/>
  <title>Cover</title>
  <style type="text/css">
    html, body { margin: 0; padding: 0; height: 100%; }
    body { text-align: center; }
    .cover-wrap { margin: 0; padding: 0; height: 100%; }
    img { max-width: 100%; max-height: 100%; height: auto; }
  </style>
</head>
<body epub:type="cover">
  <div class="cover-wrap">
    <img src="images/${esc(coverFilename)}" alt="Cover" role="doc-cover"/>
  </div>
</body>
</html>`;
}

// ── OPF ──────────────────────────────────────────────────────────────────────

function buildOpf(
  book: BookModel,
  bookId: string,
  chapterFiles: string[],
  isEpub3: boolean,
  imageMap: Map<string, ImageEntry>,
  cover: CoverEntry | null,
  includeTitlePage: boolean,
  includeColophon: boolean,
): string {
  const { meta } = book;
  const version = isEpub3 ? "3.0" : "2.0";

  // Identifier: a user-supplied ISBN takes precedence as an ISBN URN; otherwise
  // fall back to the generated book id.
  const isbn = normalizeIsbn(meta.isbn);
  const idAttr = isbn ? "book-id" : "uid";
  const idValue = isbn ? `urn:isbn:${isbn}` : bookId;

  const manifestItems = chapterFiles
    .map((fn, i) => `    <item id="ch${i + 1}" href="${fn}" media-type="application/xhtml+xml"/>`)
    .join("\n");
  const spineItems = chapterFiles
    .map((_, i) => `    <itemref idref="ch${i + 1}"/>`)
    .join("\n");

  // Cover: image carries the EPUB3 cover-image property; cover.xhtml is the rendered
  // cover page (first in spine). The legacy <meta name="cover"> keeps EPUB2 readers
  // and Calibre/Apple Books recognising the thumbnail.
  const coverMeta = cover ? `    <meta name="cover" content="cover-image"/>\n` : "";
  const coverManifest = cover
    ? `    <item id="cover-image" href="images/${cover.epubFilename}" media-type="${cover.mimeType}"${isEpub3 ? ` properties="cover-image"` : ""}/>\n` +
      `    <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>\n`
    : "";
  const coverSpine = cover ? `    <itemref idref="cover" linear="no"/>\n` : "";

  // Title page (front, after cover) and colophon (back). Not added to the TOC.
  const titlePageManifest = includeTitlePage
    ? `    <item id="titlepage" href="titlepage.xhtml" media-type="application/xhtml+xml"/>\n` : "";
  const colophonManifest = includeColophon
    ? `    <item id="colophon" href="colophon.xhtml" media-type="application/xhtml+xml"/>\n` : "";
  const titlePageSpine = includeTitlePage ? `    <itemref idref="titlepage"/>\n` : "";
  const colophonSpine = includeColophon ? `    <itemref idref="colophon"/>\n` : "";
  const navItem = isEpub3 && meta.toc
    ? `    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>\n`
    : "";
  const ncxItem = meta.toc
    ? `    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>\n`
    : "";
  const ncxAttr = meta.toc ? ` toc="ncx"` : "";

  const imageItems = Array.from(imageMap.values())
    .map((entry, i) => `    <item id="img${i + 1}" href="images/${entry.epubFilename}" media-type="${entry.mimeType}"/>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="${version}" unique-identifier="${idAttr}">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:identifier id="${idAttr}">${esc(idValue)}</dc:identifier>
    <dc:title>${esc(meta.title || "Untitled")}</dc:title>
    <dc:creator>${esc(meta.author || "Unknown")}</dc:creator>
    <dc:language>${esc(meta.language)}</dc:language>
    ${meta.publisher ? `<dc:publisher>${esc(meta.publisher)}</dc:publisher>` : ""}
    ${meta.date ? `<dc:date>${esc(meta.date)}</dc:date>` : ""}
${coverMeta}  </metadata>
  <manifest>
    <item id="css" href="styles/style.css" media-type="text/css"/>
${coverManifest}${titlePageManifest}${colophonManifest}${navItem}${ncxItem}${manifestItems}
${imageItems ? imageItems + "\n" : ""}  </manifest>
  <spine${ncxAttr}>
${coverSpine}${titlePageSpine}${spineItems}
${colophonSpine}  </spine>
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

/** Strip hyphens/whitespace from an ISBN; uppercase the optional ISBN-10 check digit. */
function normalizeIsbn(isbn: string | undefined): string {
  return (isbn ?? "").replace(/[\s-]/g, "").toUpperCase();
}

/** XML-escape a string */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Strip tags that are invalid in XHTML while preserving inline formatting */
function sanitize(html: string): string {
  // Remove script/style tags entirely
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
}
