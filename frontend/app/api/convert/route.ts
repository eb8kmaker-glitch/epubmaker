import { NextResponse } from "next/server";
import { convert } from "pandoc-wasm";
import { EPUB_STYLES } from "@/app/lib/epubStyles";
import { normalizeToHtml } from "@/app/lib/normalizeToHtml";

export const runtime = "nodejs";
export const maxDuration = 60;

const INPUT_FILENAME = "input.docx";
const OUTPUT_FILENAME = "output.epub";
const STYLE_FILENAME = "style.css";
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = [".docx", ".txt", ".pdf", ".html", ".htm", ".md"];
const NORMALIZE_EXTENSIONS = [".pdf", ".html", ".htm", ".md"];

function getExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i).toLowerCase();
}

function baseName(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? name : name.slice(0, i);
}

/** Build pandoc options from frontend JSON. Only pandoc-supported options (no "text"). */
function buildPandocOptions(params: {
  from: string;
  to: string;
  outputFile: string;
  toc: boolean;
  tocDepth: number;
  metadata: { title?: string; author?: string; lang?: string; publisher?: string; date?: string };
  epubCoverImage?: string;
  styleCssFile: string;
  inputFile?: string;
}): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};
  if (params.metadata.title) metadata.title = params.metadata.title;
  if (params.metadata.author) metadata.author = [params.metadata.author];
  if (params.metadata.lang) metadata.lang = params.metadata.lang;
  if (params.metadata.publisher) metadata.publisher = params.metadata.publisher;
  if (params.metadata.date) metadata.date = params.metadata.date;

  const opts: Record<string, unknown> = {
    from: params.from,
    to: params.to,
    "output-file": params.outputFile,
    standalone: true,
    "table-of-contents": params.toc,
    "toc-depth": params.tocDepth,
    css: [params.styleCssFile],
    metadata,
  };
  if (params.epubCoverImage) opts["epub-cover-image"] = params.epubCoverImage;
  if (params.inputFile) opts["input-files"] = [params.inputFile];
  return opts;
}

interface ConversionOptionsBody {
  toc?: boolean;
  tocDepth?: number;
  epubVersion?: "epub3" | "epub2";
  title?: string;
  author?: string;
  language?: string;
  publisher?: string;
  date?: string;
  style?: keyof typeof EPUB_STYLES;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided. Send a file in the 'file' field." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File size must be 50MB or less." },
        { status: 400 }
      );
    }

    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: "Supported formats: DOCX, TXT, PDF, HTML, MD." },
        { status: 400 }
      );
    }

    const optionsRaw = formData.get("options");
    const options: ConversionOptionsBody = typeof optionsRaw === "string"
      ? (JSON.parse(optionsRaw) as ConversionOptionsBody)
      : {};

    const cover = formData.get("cover");
    if (cover && cover instanceof File && cover.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Cover image must be 10MB or less." },
        { status: 400 }
      );
    }

    const safeBase = baseName(file.name).replace(/[^a-zA-Z0-9-_]/g, "_") || "document";
    const downloadName = `${safeBase}.epub`;
    const toFormat = options.epubVersion === "epub2" ? "epub2" : "epub3";
    const styleName = options.style && options.style in EPUB_STYLES ? options.style : "default";

    const coverKey =
      cover && cover instanceof File
        ? `cover${getExtension(cover.name) || ".png"}`
        : null;

    let fromFormat: string;
    let stdin: string | null = null;
    const files: Record<string, Blob | string> = {};

    if (NORMALIZE_EXTENSIONS.includes(ext)) {
      fromFormat = "html";
      const html = await normalizeToHtml(
        ext === ".pdf"
          ? { type: "pdf", buffer: Buffer.from(await file.arrayBuffer()) }
          : ext === ".md"
            ? { type: "md", text: await file.text() }
            : { type: "html", text: await file.text() }
      );
      stdin = html;
    } else if (ext === ".docx") {
      fromFormat = "docx";
      files[INPUT_FILENAME] = new Blob([await file.arrayBuffer()]);
    } else {
      fromFormat = "plain";
      stdin = await file.text();
    }

    const pandocOptions = buildPandocOptions({
      from: fromFormat,
      to: toFormat,
      outputFile: OUTPUT_FILENAME,
      toc: options.toc !== false,
      tocDepth: Math.min(3, Math.max(1, options.tocDepth ?? 3)),
      metadata: {
        title: options.title,
        author: options.author,
        lang: options.language,
        publisher: options.publisher,
        date: options.date,
      },
      epubCoverImage: coverKey ?? undefined,
      styleCssFile: STYLE_FILENAME,
      inputFile: fromFormat === "docx" ? INPUT_FILENAME : undefined,
    });

    files[STYLE_FILENAME] = EPUB_STYLES[styleName] ?? EPUB_STYLES.default;
    if (cover && cover instanceof File && coverKey) {
      files[coverKey] = new Blob([await cover.arrayBuffer()]);
    }

    const pandocCommandLog = [
      "pandoc",
      fromFormat === "docx" ? INPUT_FILENAME : "(stdin)",
      "-o",
      OUTPUT_FILENAME,
      "-f",
      fromFormat,
      "-t",
      toFormat,
      pandocOptions["table-of-contents"] ? "--toc" : "",
      `--toc-depth=${pandocOptions["toc-depth"]}`,
      ...(pandocOptions.metadata && typeof pandocOptions.metadata === "object" && (pandocOptions.metadata as Record<string, unknown>).title
        ? [`--metadata title="${(pandocOptions.metadata as Record<string, string>).title}"`]
        : []),
      ...(pandocOptions.metadata && typeof pandocOptions.metadata === "object" && (pandocOptions.metadata as Record<string, unknown>).author
        ? [`--metadata author="${((pandocOptions.metadata as Record<string, string[]>).author as string[])?.[0] ?? ""}"`]
        : []),
      ...(pandocOptions.metadata && typeof pandocOptions.metadata === "object" && (pandocOptions.metadata as Record<string, unknown>).lang
        ? [`--metadata lang="${(pandocOptions.metadata as Record<string, string>).lang}"`]
        : []),
    ]
      .filter(Boolean)
      .join(" ");
    console.log("[pandoc] Effective command (conceptual):", pandocCommandLog);
    console.log("[pandoc] Options passed to convert():", JSON.stringify(pandocOptions, null, 2));

    const result = await convert(pandocOptions, stdin, files);

    const epubBlob = result.files?.[OUTPUT_FILENAME];
    if (!epubBlob || !(epubBlob instanceof Blob)) {
      const errMsg = result.stderr || "Conversion produced no output.";
      return NextResponse.json({ error: errMsg }, { status: 500 });
    }

    const epubBuffer = Buffer.from(await epubBlob.arrayBuffer());
    return new NextResponse(epubBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/epub+zip",
        "Content-Disposition": `attachment; filename="${downloadName}"`,
        "Content-Length": String(epubBuffer.length),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Conversion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
