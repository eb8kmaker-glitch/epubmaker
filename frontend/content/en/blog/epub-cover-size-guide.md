---
title: "EPUB Cover Image Size Guide: Specifications for Every Platform"
description: "The definitive guide to EPUB cover image dimensions, aspect ratios, and file size limits for Amazon Kindle, Apple Books, Kobo, Google Play Books, and more."
date: "2025-04-22"
tags: [epub, cover, image, kindle, apple-books, publishing]
readingTime: 5
slugs:
  en: epub-cover-size-guide
  ko: epub-cover-size-guide
---

Your cover is the first thing a reader sees. Getting the dimensions right ensures it looks crisp and professional on every platform — from a 6-inch e-ink screen to a desktop reading app.

## The Universal Safe Size

If you want one size that works well everywhere:

**1,600 × 2,400 px** at **72–96 DPI**, saved as **JPEG** (quality 80–90%).

This gives you a 2:3 aspect ratio (portrait), which is the industry standard for book covers.

## Platform-Specific Requirements

### Amazon Kindle (KDP)

| Spec | Value |
|---|---|
| Recommended | 2,560 × 1,600 px |
| Minimum | 1,000 px on longest side |
| Aspect ratio | 1.6:1 (landscape) or 1:1.6 (portrait) |
| Format | JPEG or TIFF |
| Max file size | 50 MB |

> Note: KDP's recommended dimensions are unusual — they prioritize the landscape-oriented thumbnail view in the Kindle store. For portrait books, use **1,600 × 2,560 px**.

### Apple Books

| Spec | Value |
|---|---|
| Recommended | 1,400 × 2,100 px |
| Minimum | 1,400 × 1,873 px |
| Aspect ratio | 2:3 |
| Format | JPEG or PNG |
| Max file size | 4 MB |

### Kobo Writing Life

| Spec | Value |
|---|---|
| Recommended | 1,600 × 2,400 px |
| Minimum | 800 × 1,200 px |
| Aspect ratio | 2:3 |
| Format | JPEG |
| Max file size | 5 MB |

### Google Play Books

| Spec | Value |
|---|---|
| Recommended | 2,500 × 4,000 px |
| Minimum | 500 × 800 px |
| Aspect ratio | 2:3 (preferred) |
| Format | JPEG or PNG |

### Smashwords / Draft2Digital

Both accept standard 1,600 × 2,400 px JPEG covers and will generate thumbnails automatically.

## Aspect Ratios Explained

The **aspect ratio** is the relationship between width and height.

- **2:3** — The standard for most ebook covers. A 1,600 × 2,400 px image has a 2:3 ratio.
- **1:1.6** — Amazon's preferred ratio. Equivalent to 2:3 but specified differently.
- **1:1** — Square covers. Rarely used for books.

To convert your cover to the right ratio, crop it in any image editor: Photoshop, Canva, GIMP, or Affinity Photo.

## Color Mode: RGB vs CMYK

Always use **RGB** for ebook covers. CMYK is for print. JPEG files embedded in EPUBs should always be in RGB mode.

## File Format: JPEG vs PNG

| | JPEG | PNG |
|---|---|---|
| Best for | Photographs, gradients | Text-heavy, flat art |
| File size | Smaller | Larger |
| Transparency | No | Yes |
| Quality loss | Minor (at 80%+) | None |

For most covers with photographic elements, **JPEG at 80–85% quality** is the best choice. PNG is only better if you have solid blocks of color or text that should be pixel-perfect.

## Embedding Your Cover in EPUBMaker

When converting with EPUBMaker:

1. Prepare your cover as JPEG or PNG, 1,600 × 2,400 px
2. In the conversion settings, click "Cover Image" and upload your file
3. EPUBMaker embeds it as the EPUB cover and sets the correct metadata
4. The cover appears in reading apps and ebook store listings

The cover is embedded both as the EPUB's `cover-image` metadata item and as the first page — satisfying the requirements of all major platforms.

## Common Mistakes to Avoid

- **Too small:** Covers under 1,000 px on any dimension will look blurry on retina displays
- **Wrong aspect ratio:** A landscape cover on a portrait-formatted book looks amateur
- **CMYK color mode:** Causes color shift or errors in some reading apps
- **PNG for photographs:** Unnecessarily large file size
- **Forgetting to update:** When you revise your cover, re-upload and reconvert your EPUB

## Quick Reference

| Platform | Recommended | Aspect | Format |
|---|---|---|---|
| Safe universal | 1,600 × 2,400 | 2:3 | JPEG |
| Amazon KDP | 1,600 × 2,560 | 1:1.6 | JPEG |
| Apple Books | 1,400 × 2,100 | 2:3 | JPEG |
| Kobo | 1,600 × 2,400 | 2:3 | JPEG |
| Google Play | 2,500 × 4,000 | 2:3 | JPEG |

Start with the safe universal size, and you'll cover 95% of all platforms with a single image.
