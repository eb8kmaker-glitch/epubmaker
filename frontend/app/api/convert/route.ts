/**
 * EPUB Conversion API — free, no auth required.
 *
 * Flow: rate-limit → parse file + options → validate → convert → (if logged in: save record) → return EPUB blob.
 */

import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createServerClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase";
import { uploadInputFile, uploadOutputFile } from "@/lib/storage";
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

const STORAGE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days for all users

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
  return { ok: true, inputFormat: "txt" };
}

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) return null;
  const first = forwarded.split(",")[0]?.trim();
  return first ?? null;
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
    // Rate limit: 10 per minute per IP
    if (!checkRateLimit(request, 10)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Auth is optional — anonymous users can convert
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id ?? null;

    // Parse file + options
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

    // Validate
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
    const ipAddress = getClientIp(request);

    // Create conversion record (logged-in users only)
    let conversionId: string | null = null;
    if (userId) {
      const admin = createAdminClient();
      const { data: conversionRow, error: insertError } = await admin
        .from("conversions")
        .insert({
          user_id: userId,
          original_filename: file.name,
          original_size_bytes: file.size,
          input_format: inputFormat,
          output_format: "epub",
          status: "processing",
          ip_address: ipAddress,
        })
        .select("id")
        .single();
      if (!insertError && conversionRow) {
        conversionId = conversionRow.id as string;
        // Upload input file
        try {
          await uploadInputFile(userId, conversionId, file);
        } catch (e) {
          console.warn("[convert] input upload failed:", e instanceof Error ? e.message : e);
        }
      }
    }

    try {
      // Convert
      const epubBuffer = await removeTitlePage(
        await runConversion(file, inputFormat, options, coverFile)
      );

      // Save output (logged-in users only)
      if (userId && conversionId) {
        const admin = createAdminClient();
        let storagePath: string | null = null;
        try {
          await uploadOutputFile(userId, conversionId, epubBuffer);
          storagePath = `${userId}/${conversionId}/output.epub`;
        } catch (e) {
          console.warn("[convert] output upload failed:", e instanceof Error ? e.message : e);
        }
        const now = new Date();
        const expiresAt = new Date(now.getTime() + STORAGE_EXPIRY_MS);
        await admin
          .from("conversions")
          .update({
            status: "completed",
            completed_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            storage_path: storagePath,
          })
          .eq("id", conversionId);
      }

      const baseName = (options.title || file.name.replace(/\.[^.]+$/, ""))
        .replace(/[^\w\s-]/g, "")
        .trim() || "document";
      const outputFilename = `${baseName}.epub`;

      return new NextResponse(epubBuffer.buffer as ArrayBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/epub+zip",
          "Content-Disposition": `attachment; filename="${outputFilename}"`,
          ...(conversionId ? { "X-Conversion-Id": conversionId } : {}),
        },
      });
    } catch (conversionErr) {
      Sentry.captureException(conversionErr);
      const errMessage = conversionErr instanceof Error ? conversionErr.message : String(conversionErr);
      console.error("[convert] error:", conversionErr);
      if (userId && conversionId) {
        const admin = createAdminClient();
        await admin
          .from("conversions")
          .update({ status: "failed", error_message: errMessage })
          .eq("id", conversionId);
      }
      return NextResponse.json({ error: errMessage }, { status: 500 });
    }
  } catch (err) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : "Conversion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
