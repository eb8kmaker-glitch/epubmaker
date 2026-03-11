import { NextResponse } from "next/server";
import { convert } from "pandoc-wasm";
import { EPUB_STYLES } from "@/app/lib/epubStyles";

export const runtime = "nodejs";
export const maxDuration = 60;

const OUTPUT_FILENAME = "output.epub";
const STYLE_FILENAME = "style.css";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = [".docx", ".txt"];

function getExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i).toLowerCase();
}

function baseName(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? name : name.slice(0, i);
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
        { error: "File size must be 10MB or less." },
        { status: 400 }
      );
    }

    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: "Only DOCX and TXT files are supported." },
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
    const fromFormat = ext === ".docx" ? "docx" : "plain";
    const styleName = options.style && options.style in EPUB_STYLES ? options.style : "default";

    const pandocOptions: Record<string, unknown> = {
      from: fromFormat,
      to: options.epubVersion === "epub2" ? "epub2" : "epub3",
      "output-file": OUTPUT_FILENAME,
      standalone: true,
      "table-of-contents": options.toc !== false,
      "toc-depth": Math.min(3, Math.max(1, options.tocDepth ?? 3)),
      css: [STYLE_FILENAME],
      metadata: {
        ...(options.title && { title: options.title }),
        ...(options.author && { author: [options.author] }),
        ...(options.language && { lang: options.language }),
        ...(options.publisher && { publisher: options.publisher }),
        ...(options.date && { date: options.date }),
      },
    };

    const coverKey =
      cover && cover instanceof File
        ? `cover${getExtension(cover.name) || ".png"}`
        : null;
    if (coverKey) {
      pandocOptions["epub-cover-image"] = coverKey;
    }

    const files: Record<string, Blob | string> = {};
    files[STYLE_FILENAME] = EPUB_STYLES[styleName] ?? EPUB_STYLES.default;

    let stdin: string | null = null;
    if (ext === ".docx") {
      const buf = await file.arrayBuffer();
      pandocOptions.text = Buffer.from(buf).toString("base64");
    } else {
      stdin = await file.text();
    }

    if (cover && cover instanceof File && coverKey) {
      files[coverKey] = new Blob([await cover.arrayBuffer()]);
    }

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
