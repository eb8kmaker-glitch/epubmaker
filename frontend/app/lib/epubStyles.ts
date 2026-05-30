/**
 * EPUB CSS style presets for client-side conversion.
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

.img-full {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 1em auto;
}

.img-left {
  float: left;
  max-width: 40%;
  height: auto;
  margin-right: 1em;
  margin-bottom: 0.5em;
  margin-top: 0.25em;
}

.img-right {
  float: right;
  max-width: 40%;
  height: auto;
  margin-left: 1em;
  margin-bottom: 0.5em;
  margin-top: 0.25em;
}
`;

export const EPUB_STYLES: Record<string, string> = {
  default: `/* Default EPUB style preset */
body {
  font-family: serif;
  line-height: 1.6;
  margin: 1em;
}

p {
  text-indent: 0;
  text-align: left;
  line-height: 1.6;
  margin-bottom: 0.5em;
  margin-top: 0;
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

  novel: `/* Novel style preset – 한국어 단행본 소설 표준 */
body {
  font-family: "Bookerly", "Literata", Georgia, serif;
  font-size: 1em;
  line-height: 1.75;
  margin: 2em 1.5em;
}

h1 {
  font-size: 1.5em;
  margin: 2em 0 1.5em;
  text-align: center;
  page-break-after: avoid;
}

h2 {
  font-size: 1.2em;
  margin: 1.5em 0 1em;
  page-break-after: avoid;
}

h3 {
  font-size: 1.05em;
  margin: 1.2em 0 0.8em;
  page-break-after: avoid;
}

p {
  text-indent: 1em;
  text-align: justify;
  line-height: 1.75;
  margin-bottom: 0;
  margin-top: 0;
}

p:first-of-type,
h1 + p,
h2 + p,
h3 + p {
  text-indent: 0;
}
${IMAGE_BASE_CSS}`,

  academic: `/* Academic style preset – 학술/논문/비소설 */
body {
  font-family: "Times New Roman", Times, serif;
  font-size: 12pt;
  line-height: 1.7;
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
  text-indent: 0;
  text-align: justify;
  line-height: 1.7;
  margin-bottom: 0.75em;
  margin-top: 0;
}

blockquote {
  font-size: 0.9em;
  border-left: 3px solid #C8A97E;
  padding-left: 10px;
  margin: 1em 1em;
  color: #444;
  font-style: italic;
}
${IMAGE_BASE_CSS}`,
};
