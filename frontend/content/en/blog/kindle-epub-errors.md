---
title: "Common Kindle EPUB Errors and How to Fix Them"
description: "Troubleshoot the most common EPUB errors when publishing to Amazon Kindle — including metadata issues, TOC problems, image errors, and CSS compatibility."
date: "2025-04-29"
tags: [kindle, epub, errors, troubleshooting, publishing]
readingTime: 7
slugs:
  en: kindle-epub-errors
  ko: kindle-epub-errors
---

Publishing an EPUB to Amazon Kindle often surfaces errors that don't appear in other reading apps. Kindle uses its own rendering engine (based on WebKit), and KDP's validator is stricter than most.

Here are the most common errors and exactly how to fix them.

## Error 1: "TOC Not Found" or Missing Navigation

**Symptom:** Kindle shows no chapter navigation, or KDP reports a missing TOC.

**Cause:** Your EPUB's `nav.xhtml` (EPUB 3) or `toc.ncx` (EPUB 2) is missing or malformed.

**Fix:**
- In EPUBMaker, ensure "Include Table of Contents" is checked in conversion settings
- Set the TOC depth to at least 1
- For DOCX files: verify your document uses proper Heading styles (not bold text)
- Use the built-in TOC Editor to inspect and fix chapters after conversion

## Error 2: Images Not Displaying

**Symptom:** Images show as broken links or appear stretched/distorted on Kindle.

**Cause:** Image paths are incorrect, MIME types are missing, or images exceed Kindle's size limits.

**Fix:**
- Kindle supports JPEG, PNG, and GIF (no WebP, SVG, or AVIF)
- Keep images under **5 MB** each
- Keep total image content under **50 MB** per book
- Image dimensions: max **4,096 × 4,096 px**
- Use relative paths in HTML: `<img src="../images/cover.jpg">` not absolute paths

## Error 3: "Invalid Spine" or "Content Document Not in Spine"

**Symptom:** KDP rejects the file with a spine-related error.

**Cause:** The EPUB's spine (reading order) references documents that don't exist, or contains duplicates.

**Fix:**
- Re-convert your file from scratch using EPUBMaker
- If you manually edited the EPUB, check the `content.opf` file for broken `<itemref>` entries
- Ensure every HTML file listed in the spine exists in the `OEBPS/` directory

## Error 4: CSS Not Rendering Correctly

**Symptom:** Font choices, line spacing, or layout look wrong on Kindle.

**Cause:** Kindle's CSS support is limited and differs from browsers.

**Kindle CSS limitations:**
- No CSS Grid
- No CSS Custom Properties (variables)
- Limited Flexbox support
- No `@font-face` for embedded fonts (KFX format only)
- `text-align: justify` is applied by the device, not the CSS

**Fix:**
Use simple, Kindle-compatible CSS. EPUBMaker's "Book" and "Novel" style presets are optimized for Kindle compatibility.

```css
/* Kindle-safe body style */
body {
  font-family: serif;
  font-size: 1em;
  line-height: 1.5;
  margin: 0;
  padding: 0;
}

h1, h2, h3 {
  font-weight: bold;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

p {
  margin: 0;
  text-indent: 1.5em;
}

p.first, p + h1 + p, p + h2 + p {
  text-indent: 0;
}
```

## Error 5: Metadata Validation Failure

**Symptom:** KDP shows "Metadata is incomplete" or rejects the file entirely.

**Cause:** Missing required metadata fields.

**Required metadata for KDP:**
- `dc:title` — book title
- `dc:language` — language code (e.g., `en`, `ko`, `ja`)
- `dc:identifier` — unique ID (UUID or ISBN)

**Fix:** In EPUBMaker's conversion settings, fill in:
- Title
- Language (use the standard language code)

EPUBMaker auto-generates a UUID if no ISBN is provided.

## Error 6: "File Contains Encryption" or DRM Error

**Symptom:** Kindle app or KDP reports encryption issues.

**Cause:** The EPUB was previously DRM-protected (e.g., purchased from another store).

**Fix:** You can only convert files you own the rights to. If you're uploading your own manuscript converted to EPUB, this error should not appear. If it does, re-convert from the original source file (DOCX or TXT) using EPUBMaker.

## Error 7: Special Characters and Encoding

**Symptom:** Strange characters appear in the text, especially for non-Latin scripts.

**Cause:** Encoding mismatch. EPUBs must use UTF-8 encoding.

**Fix:**
- Ensure your source DOCX or TXT file is saved as UTF-8
- For TXT files: check encoding in your text editor (VS Code shows encoding in the status bar)
- Re-convert in EPUBMaker — it always outputs UTF-8

## Error 8: Footnotes Rendering as Inline Text

**Symptom:** Footnotes appear in the middle of paragraphs rather than at the end of the section.

**Cause:** DOCX footnote styles aren't always correctly mapped to EPUB popup footnotes.

**Fix:**
- Enable EPUB 3 in conversion settings
- EPUB 3 supports proper popup footnotes via `epub:type="footnote"`
- Alternatively, convert footnotes to endnotes before converting

## Using KindleGen / Kindle Previewer

Amazon's **Kindle Previewer** (free download) is the best tool to test your EPUB before uploading to KDP:

1. Download from Amazon's developer page
2. Open your EPUB in Kindle Previewer
3. It converts to Kindle format and shows exactly how the book will appear
4. Error messages in Previewer are more specific than KDP's upload validator

## Quick Checklist Before Uploading to KDP

- [ ] Title and language metadata filled in
- [ ] TOC enabled with at least depth 1
- [ ] Cover image: 1,600 × 2,560 px JPEG
- [ ] All images are JPEG or PNG (not WebP or SVG)
- [ ] No CSS custom properties (`var()`)
- [ ] Tested in Kindle Previewer
- [ ] File re-converted from source if any edits were made

Following this checklist will resolve the vast majority of Kindle EPUB errors before they reach KDP.
