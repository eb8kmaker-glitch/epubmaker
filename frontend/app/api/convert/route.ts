/**
 * EPUB Conversion API — free, no auth required.
 *
 * Flow: rate-limit → parse file + options → validate → convert → return EPUB blob.
 */

import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { fileTypeFromBuffer } from "file-type";
import { convert } from "pandoc-wasm";
import { EPUB_STYLES } from "@/app/lib/epubStyles";
import { checkRateLimit } from "@/lib/rateLimit";
import JSZip from "jszip";

export const runtime = "nodejs";
export const maxDuration = 60;

if (typeof process !== "undefined" && !process.env.TMPDIR) {
  process.env.TMPDIR = "/tmp";
}

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".docx", ".txt"];
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const TEXT_PLAIN_MIME = "text/plain";

const INPUT_FILENAME = "input.docx";
const OUTPUT_FILENAME = "output.epub";
const INTERMEDIATE_HTML_FILENAME = "output.html";
const STYLE_FILENAME = "style.css";

interface ConversionOptionsInput {
  toc?: boolean;
  tocDepth?: number;
  epubVersion?: "epub3" | "epub2";
  title?: string;
  author?: string;
  language?: string;
  publisher?: string;
  date?: string;
  style?: string;
  customCss?: string;
}

function getExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i).toLowerCase();
}

function getInputFormat(ext: string): "docx" | "txt" {
  return ext === ".docx" ? "docx" : "txt";
}

async function validateFileType(
  buffer: Buffer,
  filename: string
): Promise<{ ok: true; inputFormat: "docx" | "txt" } | { ok: false; error: string }> {
  const ext = getExtension(filename);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { ok: false, error: "Allowed extensions: .docx, .txt only." };
  }
  const detected = await fileTypeFromBuffer(buffer);
  if (ext === ".docx") {
    if (!detected || detected.mime !== DOCX_MIME) {
      return {
        ok: false,
        error: `Invalid file: expected DOCX (magic bytes). Got: ${detected ? `${detected.mime} (${detected.ext})` : "unknown"}.`,
      };
    }
    return { ok: true, inputFormat: "docx" };
  }
  if (detected && detected.mime !== TEXT_PLAIN_MIME) {
    return {
      ok: false,
      error: `Invalid file: expected plain text. Got: ${detected.mime} (${detected.ext}).`,
    };
  }
  return { ok: true, inputFormat: getInputFormat(ext) };
}

function buildPandocOptions(params: {
  from: string;
  to: string;
  outputFile: string;
  toc: boolean;
  tocDepth: number;
  styleCssFile: string;
  coverImageFile?: string;
  metadata?: Record<string, string>;
  inputFile?: string;
}): Record<string, unknown> {
  const opts: Record<string, unknown> = {
    from: params.from,
    to: params.to,
    "output-file": params.outputFile,
    standalone: true,
    "table-of-contents": params.toc,
    "toc-depth": params.tocDepth,
    "epub-title-page": false,
    css: [params.styleCssFile],
    metadata: params.metadata ?? {},
  };
  if (params.coverImageFile) {
    opts["epub-cover-image"] = params.coverImageFile;
  }
  if (params.inputFile) {
    opts["input-files"] = [params.inputFile];
  }
  return opts;
}

async function runConversion(
  file: File,
  inputFormat: "docx" | "txt",
  options: ConversionOptionsInput,
  coverFile?: File | null
): Promise<Buffer> {
  const files: Record<string, Blob | string> = {};

  const styleCss =
    options.style === "custom"
      ? (options.customCss ?? EPUB_STYLES.default ?? "")
      : (EPUB_STYLES[options.style ?? "default"] ?? EPUB_STYLES.default ?? "");
  files[STYLE_FILENAME] = styleCss;

  let coverFilename: string | undefined;
  if (coverFile) {
    const ext = getExtension(coverFile.name) || ".jpg";
    coverFilename = `cover${ext}`;
    files[coverFilename] = new Blob([await coverFile.arrayBuffer()], { type: coverFile.type });
  }

  const metadata: Record<string, string> = {};
  if (options.title) metadata.title = options.title;
  if (options.author) metadata.author = options.author;
  if (options.language) metadata.lang = options.language;
  if (options.publisher) metadata.publisher = options.publisher;
  if (options.date) metadata.date = options.date;

  const toc = options.toc !== false;
  const tocDepth = options.tocDepth ?? 3;
  const epubVersion = options.epubVersion ?? "epub3";

  let fromFormat: string;
  let stdin: string | null = null;

  if (inputFormat === "docx") {
    const docxBlob = new Blob([await file.arrayBuffer()]);
    const docxFiles: Record<string, Blob | string> = { [INPUT_FILENAME]: docxBlob };
    const htmlResult = await convert(
      {
        from: "docx",
        to: "html",
        "output-file": INTERMEDIATE_HTML_FILENAME,
        "input-files": [INPUT_FILENAME],
        standalone: true,
      },
      null,
      docxFiles
    );
    const htmlBlobOrStr = htmlResult.files?.[INTERMEDIATE_HTML_FILENAME];
    if (!htmlBlobOrStr) {
      throw new Error(htmlResult.stderr || "DOCX → HTML produced no output.");
    }
    stdin = typeof htmlBlobOrStr === "string" ? htmlBlobOrStr : await (htmlBlobOrStr as Blob).text();
    fromFormat = "html";
  } else {
    stdin = await file.text();
    fromFormat = "markdown";
  }

  const pandocOptions = buildPandocOptions({
    from: fromFormat,
    to: epubVersion,
    outputFile: OUTPUT_FILENAME,
    toc,
    tocDepth,
    styleCssFile: STYLE_FILENAME,
    coverImageFile: coverFilename,
    metadata,
  });

  const result = await convert(pandocOptions, stdin, files);
  const epubBlob = result.files?.[OUTPUT_FILENAME];
  if (!epubBlob || !(epubBlob instanceof Blob)) {
    throw new Error(result.stderr || "Conversion produced no output.");
  }
  return Buffer.from(await epubBlob.arrayBuffer());
}

function isTitlePage(href: string): boolean {
  return /title[_-]?page/i.test(href.split("/").pop() ?? "");
}

async function removeTitlePage(buffer: Buffer): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buffer);
  const titlePagePaths = Object.keys(zip.files).filter(isTitlePage);
  if (titlePagePaths.length === 0) return buffer;

  const titlePageNames = new Set(titlePagePaths.map((p) => p.split("/").pop()!));
  titlePagePaths.forEach((p) => zip.remove(p));

  const containerXml = await zip.file("META-INF/container.xml")?.async("text");
  if (!containerXml) return zip.generateAsync({ type: "nodebuffer", mimeType: "application/epub+zip" });

  const opfPath = containerXml.match(/full-path="([^"]+)"/)?.[1];
  if (!opfPath) return zip.generateAsync({ type: "nodebuffer", mimeType: "application/epub+zip" });

  const opfFile = zip.file(opfPath);
  if (!opfFile) return zip.generateAsync({ type: "nodebuffer", mimeType: "application/epub+zip" });

  let opf = await opfFile.async("text");
  const opfDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";

  const removedIds = new Set<string>();
  let navPath: string | null = null;
  let ncxPath: string | null = null;

  opf = opf.replace(/<item\b([^>]*?)\/>/gi, (tag, attrs: string) => {
    const href = attrs.match(/href="([^"]+)"/)?.[1] ?? "";
    const id = attrs.match(/\bid="([^"]+)"/)?.[1] ?? "";
    const properties = attrs.match(/properties="([^"]+)"/)?.[1] ?? "";
    const mediaType = attrs.match(/media-type="([^"]+)"/)?.[1] ?? "";

    if (/\bnav\b/.test(properties) && !navPath) navPath = opfDir + href;
    if (mediaType === "application/x-dtbncx+xml" && !ncxPath) ncxPath = opfDir + href;

    const filename = href.split("/").pop() ?? "";
    if (titlePageNames.has(filename) || isTitlePage(href)) {
      if (id) removedIds.add(id);
      return "";
    }
    return tag;
  });

  if (removedIds.size > 0) {
    opf = opf.replace(/<itemref\b([^>]*?)\/>/gi, (tag, attrs: string) => {
      const idref = attrs.match(/idref="([^"]+)"/)?.[1] ?? "";
      return removedIds.has(idref) ? "" : tag;
    });
  }

  zip.file(opfPath, opf);

  if (navPath) {
    const navFile = zip.file(navPath);
    if (navFile) {
      let nav = await navFile.async("text");
      nav = nav.replace(/<li\b[^>]*>(?:(?!<li\b)[\s\S])*?<\/li>/gi, (li) => {
        const href = li.match(/<a\b[^>]*href="([^"]+)"/i)?.[1] ?? "";
        return isTitlePage(href) ? "" : li;
      });
      zip.file(navPath, nav);
    }
  }

  if (ncxPath) {
    const ncxFile = zip.file(ncxPath);
    if (ncxFile) {
      let ncx = await ncxFile.async("text");
      ncx = ncx.replace(/<navPoint\b[^>]*>[\s\S]*?<\/navPoint>/gi, (np) => {
        const src = np.match(/<content\b[^>]*src="([^"]+)"/i)?.[1] ?? "";
        return isTitlePage(src) ? "" : np;
      });
      zip.file(ncxPath, ncx);
    }
  }

  return zip.generateAsync({ type: "nodebuffer", mimeType: "application/epub+zip" });
}

export async function POST(request: NextRequest) {
  try {
    if (!checkRateLimit(request, 10)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided. Send a file in the 'file' field." },
        { status: 400 }
      );
    }

    let options: ConversionOptionsInput = {};
    const optionsRaw = formData.get("options");
    if (optionsRaw && typeof optionsRaw === "string") {
      try {
        options = JSON.parse(optionsRaw) as ConversionOptionsInput;
      } catch {
        // use defaults
      }
    }

    const coverRaw = formData.get("cover");
    const coverFile = coverRaw instanceof File ? coverRaw : null;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "File size must be 50MB or less." }, { status: 413 });
    }
    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: "Allowed extensions: .docx, .txt only." }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const validation = await validateFileType(buffer, file.name);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const inputFormat = validation.inputFormat;

    try {
      const epubBuffer = await removeTitlePage(
        await runConversion(file, inputFormat, options, coverFile)
      );

      const baseName = (options.title || file.name.replace(/\.[^.]+$/, ""))
        .replace(/[^\w\s-]/g, "")
        .trim() || "document";
      const outputFilename = `${baseName}.epub`;

      return new NextResponse(epubBuffer.buffer as ArrayBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/epub+zip",
          "Content-Disposition": `attachment; filename="${outputFilename}"`,
        },
      });
    } catch (conversionErr) {
      Sentry.captureException(conversionErr);
      const errMessage = conversionErr instanceof Error ? conversionErr.message : String(conversionErr);
      console.error("[convert] error:", conversionErr);
      return NextResponse.json({ error: errMessage }, { status: 500 });
    }
  } catch (err) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : "Conversion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
