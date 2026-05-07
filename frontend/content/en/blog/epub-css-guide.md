---
title: "CSS Styling for EPUB: Tips for Beautiful Ebook Typography"
description: "How to write effective CSS for EPUB files — covering typography, spacing, Kindle compatibility, font embedding, and common pitfalls to avoid."
date: "2025-05-05"
tags: [epub, css, typography, styling, design]
readingTime: 8
slugs:
  en: epub-css-guide
  ko: epub-css-guide
---

CSS in EPUB files is both familiar and surprising. You use the same properties as web CSS, but the rendering environment is very different — and the same stylesheet may look completely different on a Kindle, Kobo, and Apple Books.

This guide covers the CSS techniques that work reliably across all major EPUB readers.

## The EPUB CSS Environment

EPUB content is rendered by each device's internal reading engine:

- **Kindle (KFX):** Based on a modified WebKit, strict CSS subset
- **Kobo:** Uses Qt WebEngine (Chromium-based)
- **Apple Books:** Full Safari/WebKit rendering
- **Google Play Books:** Chromium-based, mostly standard CSS

The safest CSS is **simple CSS** — avoid anything that requires modern browser features.

## Typography Fundamentals

### Font Families

```css
/* Safe font stack — works on all readers */
body {
  font-family: "Georgia", serif;
  font-size: 1em; /* relative to reader setting */
  line-height: 1.6;
}

/* Sans-serif for UI elements */
h1, h2, h3 {
  font-family: "Arial", "Helvetica", sans-serif;
}
```

**Never hardcode font sizes in pixels.** Use `em` or `rem` so the reader's font size setting works correctly.

### Paragraph Styles

The two main conventions for paragraph formatting are **indented** (traditional book style) and **spaced** (web/report style). Pick one.

```css
/* Traditional book style — indented, no spacing */
p {
  margin: 0;
  padding: 0;
  text-indent: 1.5em;
}

/* Web style — no indent, spacing between */
p {
  margin: 0 0 0.8em 0;
  padding: 0;
  text-indent: 0;
}
```

For the first paragraph after a heading, indent should be removed:

```css
h1 + p, h2 + p, h3 + p,
p.chapter-start, p.first-para {
  text-indent: 0;
}
```

## Headings

```css
h1 {
  font-size: 1.8em;
  font-weight: bold;
  margin-top: 2em;
  margin-bottom: 0.8em;
  page-break-before: always; /* start chapters on new page */
}

h2 {
  font-size: 1.3em;
  font-weight: bold;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

h3 {
  font-size: 1.1em;
  font-weight: bold;
  margin-top: 1em;
  margin-bottom: 0.3em;
}
```

Use `page-break-before: always` on `h1` to start each chapter on a fresh page.

## Images

```css
img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1em auto;
}

/* Full-page images */
img.full-page {
  width: 100%;
  height: auto;
}

/* Inline images (icons, decorations) */
img.inline {
  display: inline;
  vertical-align: middle;
  width: 1em;
  height: 1em;
}
```

Always use `max-width: 100%` to prevent images from overflowing narrow screens.

## Block Quotes

```css
blockquote {
  margin: 1em 2em;
  padding: 0;
  font-style: italic;
  color: #444;
}

blockquote p {
  text-indent: 0;
}
```

## Code Blocks

For technical books with code samples:

```css
pre, code {
  font-family: "Courier New", "Courier", monospace;
  font-size: 0.85em;
}

pre {
  white-space: pre-wrap; /* wrap long lines */
  word-wrap: break-word;
  background-color: #f5f5f5;
  padding: 0.8em 1em;
  margin: 1em 0;
  border-left: 3px solid #ccc;
}
```

## Tables

Tables in EPUB require special handling for small screens:

```css
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
  margin: 1em 0;
}

th, td {
  border: 1px solid #ccc;
  padding: 0.4em 0.6em;
  text-align: left;
  vertical-align: top;
}

th {
  background-color: #f0f0f0;
  font-weight: bold;
}
```

For tables wider than the screen, consider converting them to a list or figure.

## What to Avoid

### Avoid CSS Custom Properties

```css
/* This WILL NOT work on Kindle */
:root { --accent: #8B5E3C; }
p { color: var(--accent); }

/* Use this instead */
p { color: #8B5E3C; }
```

### Avoid Flexbox and Grid

Kindle's CSS engine doesn't support Flexbox or Grid reliably. Use `float` or block layout instead.

```css
/* Avoid on Kindle */
.two-col { display: flex; gap: 1em; }

/* Use instead */
.two-col::after { content: ""; display: table; clear: both; }
.two-col .left { float: left; width: 48%; margin-right: 4%; }
.two-col .right { float: left; width: 48%; }
```

### Avoid Absolute Positioning

Absolute positioning breaks on reflowable text. Use it only for decorative elements with `position: relative` containers.

### Avoid Media Queries (mostly)

Some EPUB 3 readers support `@media` queries, but most e-ink readers and Kindle don't. Don't rely on them for core layout.

## EPUBMaker Style Presets

EPUBMaker includes four pre-built CSS presets:

| Preset | Style | Best For |
|---|---|---|
| **Default** | Clean, neutral | General non-fiction |
| **Book** | Serif, indented paragraphs | Literary fiction |
| **Novel** | Wide margins, comfortable spacing | Romance, genre fiction |
| **Academic** | Tight layout, clear headings | Textbooks, manuals |

You can also select **Custom** and paste your own CSS — the presets load as a starting point for editing.

## Testing Your Styles

The only reliable way to test EPUB CSS is to open the file in the actual reading apps:

1. **Kindle Previewer** (Amazon, free) — most important for KDP publishing
2. **Calibre EPUB viewer** (free, cross-platform)
3. **Adobe Digital Editions** (free, desktop)
4. **Apple Books** on macOS or iOS
5. **Readium** browser extension (Chrome/Firefox)

A style that looks perfect in Calibre may look broken on Kindle. Always test on Kindle Previewer before publishing to Amazon.

## Sample Complete Stylesheet

Here is a clean, cross-reader stylesheet suitable for most novels and non-fiction:

```css
/* EPUBMaker Book Preset — cross-reader safe */

body {
  font-family: "Georgia", serif;
  font-size: 1em;
  line-height: 1.6;
  margin: 0;
  padding: 0;
  color: #1a1a1a;
}

h1 {
  font-size: 1.8em;
  font-weight: bold;
  margin: 2em 0 0.8em;
  line-height: 1.2;
  page-break-before: always;
  text-align: left;
}

h2 {
  font-size: 1.3em;
  font-weight: bold;
  margin: 1.5em 0 0.5em;
}

h3 {
  font-size: 1.1em;
  font-weight: bold;
  margin: 1em 0 0.3em;
}

p {
  margin: 0;
  text-indent: 1.5em;
}

h1 + p, h2 + p, h3 + p {
  text-indent: 0;
}

blockquote {
  margin: 1em 2em;
  font-style: italic;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1em auto;
}
```

This stylesheet is the foundation of EPUBMaker's "Book" preset. It renders cleanly on Kindle, Kobo, Apple Books, and all major EPUB readers.
