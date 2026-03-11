/**
 * Client-side EPUB conversion using pandoc-wasm.
 * Runs entirely in the browser; no server required.
 */

import type { ConversionOptions } from "@/app/components/ConversionSettings";
import { EPUB_STYLES } from "./epubStyles";

const OUTPUT_FILENAME = "output.epub";
const STYLE_FILENAME = "style.css";

function getExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i).toLowerCase();
}

function baseName(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? name : name.slice(0, i);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function convertToEpubInBrowser(params: {
  file: File;
  options: ConversionOptions;
  coverFile: File | null;
}): Promise<{ blob: Blob; filename: string }> {
  const { convert } = await import("pandoc-wasm");
  const { file, options, coverFile } = params;

  const ext = getExtension(file.name);
  const fromFormat = ext === ".docx" ? "docx" : "plain";
  const safeBase = baseName(file.name).replace(/[^a-zA-Z0-9-_]/g, "_") || "document";
  const downloadName = `${safeBase}.epub`;

  const pandocOptions: Record<string, unknown> = {
    from: fromFormat,
    to: options.epubVersion === "epub2" ? "epub2" : "epub3",
    "output-file": OUTPUT_FILENAME,
    standalone: true,
    "table-of-contents": options.toc,
    "toc-depth": Math.min(3, Math.max(1, options.tocDepth)),
    css: [STYLE_FILENAME],
    metadata: {
      ...(options.title && { title: options.title }),
      ...(options.author && { author: [options.author] }),
      ...(options.language && { lang: options.language }),
      ...(options.publisher && { publisher: options.publisher }),
      ...(options.date && { date: options.date }),
    },
  };

  const coverKey = coverFile
    ? `cover${getExtension(coverFile.name) || ".png"}`
    : null;
  if (coverKey) {
    pandocOptions["epub-cover-image"] = coverKey;
  }

  const files: Record<string, Blob | string> = {};
  let stdin: string | null = null;

  if (ext === ".docx") {
    const buf = await file.arrayBuffer();
    pandocOptions.text = arrayBufferToBase64(buf);
  } else {
    stdin = await file.text();
  }

  files[STYLE_FILENAME] = EPUB_STYLES[options.style] ?? EPUB_STYLES.default;

  if (coverFile && coverKey) {
    files[coverKey] = coverFile;
  }

  const result = await convert(pandocOptions, stdin, files);

  const epubBlob = result.files?.[OUTPUT_FILENAME];
  if (!epubBlob || !(epubBlob instanceof Blob)) {
    const errMsg = result.stderr || "Conversion produced no output.";
    throw new Error(errMsg);
  }

  return { blob: epubBlob, filename: downloadName };
}
