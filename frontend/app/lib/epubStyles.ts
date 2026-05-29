/**
 * EPUB CSS style presets for client-side conversion.
 * Used by pandoc-wasm when generating EPUB.
 */

export const IMAGE_BASE_CSS = `
img {
  max-width: 100%;
  height: auto;
  display: block;
}

figure {
  margin: 1.5em 0;
  padding: 0;
  max-width: 100%;
}

figure img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
}

figcaption {
  font-size: 0.85em;
  color: #666;
  text-align: center;
  margin-top: 0.4em;
  line-height: 1.4;
}
`;

export const EPUB_STYLES: Record<string, string> = {
  default: `/* Default EPUB style preset */
body {
  font-family: serif;
  line-height: 1.5;
  margin: 1em;
}
${IMAGE_BASE_CSS}`,
  book: `/* Book style preset – comfortable reading */
body {
  font-family: Georgia, "Times New Roman", serif;
  line-height: 1.6;
  margin: 1.5em 2em;
  max-width: 35em;
}

h1, h2, h3 {
  margin-top: 1.5em;
  page-break-after: avoid;
}

p {
  margin-bottom: 1em;
  text-align: justify;
}
${IMAGE_BASE_CSS}`,
  novel: `/* Novel style preset – fiction reading */
body {
  font-family: "Bookerly", "Literata", Georgia, serif;
  font-size: 1em;
  line-height: 1.7;
  margin: 2em 1.5em;
}

h1 {
  font-size: 1.5em;
  margin: 2em 0 1em;
  text-align: center;
}

h2 {
  font-size: 1.2em;
  margin: 1.5em 0 0.75em;
  page-break-after: avoid;
}

p {
  margin-bottom: 1.2em;
  text-indent: 1.5em;
}

p:first-of-type,
h1 + p,
h2 + p {
  text-indent: 0;
}
${IMAGE_BASE_CSS}`,
  academic: `/* Academic style preset – papers and non-fiction */
body {
  font-family: "Times New Roman", Times, serif;
  font-size: 12pt;
  line-height: 1.5;
  margin: 1in;
}

h1, h2, h3, h4 {
  font-weight: bold;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  page-break-after: avoid;
}

h1 { font-size: 1.5em; }
h2 { font-size: 1.3em; }
h3 { font-size: 1.1em; }

p {
  margin-bottom: 0.75em;
}

blockquote {
  margin: 1em 2em;
  font-style: italic;
}
${IMAGE_BASE_CSS}`,
};
