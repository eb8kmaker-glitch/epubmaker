/**
 * EPUB 변환 API (인증 + 사용량 제한 + Storage + DB 기록).
 *
 * 순서: 인증 → 파일 수신 → options/cover 파싱 → 검증 → can_convert RPC → conversions 삽입 → Storage 업로드 → 변환 → 출력 업로드 → increment_conversion → EPUB blob 반환.
 * createServerClient: 세션 확인. createAdminClient: RPC, conversions, Storage.
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

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
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

/** Magic bytes 검증: .docx, .txt만 허용. */
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
  // .txt
  if (detected && detected.mime !== TEXT_PLAIN_MIME) {
    return {
      ok: false,
      error: `Invalid file: expected plain text. Got: ${detected.mime} (${detected.ext}).`,
    };
  }
  return { ok: true, inputFormat: "txt" };
}

/** 플랜별 Storage 보관 만료 시각 계산. */
function getExpiresAt(from: Date, plan: string): Date {
  switch (plan) {
    case "pro":
    case "publisher":
      return new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000); // 30일
    case "starter":
      return new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);  // 7일
    default:
      return new Date(from.getTime() + 60 * 60 * 1000);            // 1시간 (free)
  }
}

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) return null;
  const first = forwarded.split(",")[0]?.trim();
  return first ?? null;
}

/** pandoc 옵션 (docx/txt → epub). */
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

/** DOCX/TXT → EPUB 변환 (pandoc-wasm). options와 cover 파일을 적용. */
async function runConversion(
  file: File,
  inputFormat: "docx" | "txt",
  options: ConversionOptionsInput,
  coverFile?: File | null
): Promise<Buffer> {
  const files: Record<string, Blob | string> = {};

  // CSS: custom이면 customCss 사용, 아니면 프리셋 선택
  const styleCss =
    options.style === "custom"
      ? (options.customCss ?? EPUB_STYLES.default ?? "")
      : (EPUB_STYLES[options.style ?? "default"] ?? EPUB_STYLES.default ?? "");
  files[STYLE_FILENAME] = styleCss;

  // 표지 이미지
  let coverFilename: string | undefined;
  if (coverFile) {
    const ext = getExtension(coverFile.name) || ".jpg";
    coverFilename = `cover${ext}`;
    files[coverFilename] = new Blob([await coverFile.arrayBuffer()], { type: coverFile.type });
  }

  // 메타데이터
  const metadata: Record<string, string> = {};
  if (options.title) metadata.title = options.title;
  if (options.author) metadata.author = options.author;
  if (options.language) metadata.lang = options.language;
  if (options.publisher) metadata.publisher = options.publisher;
  if (options.date) metadata.date = options.date;

  const toc = options.toc !== false; // 기본 true
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
    fromFormat = "plain";
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

/** title_page.xhtml 판별 (경로의 마지막 세그먼트 기준). */
function isTitlePage(href: string): boolean {
  return /title[_-]?page/i.test(href.split("/").pop() ?? "");
}

/**
 * 변환된 EPUB에서 title_page.xhtml을 제거하는 후처리.
 * pandoc --epub-title-page=false 옵션이 동작하면 이 함수는 조기 반환(no-op).
 * 동작하지 않을 경우 ZIP, OPF manifest/spine, nav.xhtml, toc.ncx를 직접 정리.
 */
async function removeTitlePage(buffer: Buffer): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buffer);

  const titlePagePaths = Object.keys(zip.files).filter(isTitlePage);
  if (titlePagePaths.length === 0) return buffer; // 이미 없으면 그대로 반환

  const titlePageNames = new Set(titlePagePaths.map((p) => p.split("/").pop()!));

  // 1. ZIP에서 파일 제거
  titlePagePaths.forEach((p) => zip.remove(p));

  // 2. container.xml → OPF 경로 확인
  const containerXml = await zip.file("META-INF/container.xml")?.async("text");
  if (!containerXml) return zip.generateAsync({ type: "nodebuffer", mimeType: "application/epub+zip" });

  const opfPath = containerXml.match(/full-path="([^"]+)"/)?.[1];
  if (!opfPath) return zip.generateAsync({ type: "nodebuffer", mimeType: "application/epub+zip" });

  const opfFile = zip.file(opfPath);
  if (!opfFile) return zip.generateAsync({ type: "nodebuffer", mimeType: "application/epub+zip" });

  let opf = await opfFile.async("text");
  const opfDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";

  // 3. OPF manifest에서 title_page 항목 제거 + nav/ncx 경로 수집
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

  // 4. OPF spine에서 해당 itemref 제거
  if (removedIds.size > 0) {
    opf = opf.replace(/<itemref\b([^>]*?)\/>/gi, (tag, attrs: string) => {
      const idref = attrs.match(/idref="([^"]+)"/)?.[1] ?? "";
      return removedIds.has(idref) ? "" : tag;
    });
  }

  zip.file(opfPath, opf);

  // 5. nav.xhtml에서 title_page 링크 <li> 제거
  if (navPath) {
    const navFile = zip.file(navPath);
    if (navFile) {
      let nav = await navFile.async("text");
      // 중첩 <li> 없이 단순 항목만 매칭 (title_page는 항상 leaf 노드)
      nav = nav.replace(/<li\b[^>]*>(?:(?!<li\b)[\s\S])*?<\/li>/gi, (li) => {
        const href = li.match(/<a\b[^>]*href="([^"]+)"/i)?.[1] ?? "";
        return isTitlePage(href) ? "" : li;
      });
      zip.file(navPath, nav);
    }
  }

  // 6. toc.ncx에서 title_page를 참조하는 <navPoint> 제거
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
    // 0. Rate limit: IP 기준 분당 5회
    if (!checkRateLimit(request, 5)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // 1. 인증 확인
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    // 2. 파일 및 옵션 수신
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided. Send a file in the 'file' field." },
        { status: 400 }
      );
    }

    // options 파싱
    let options: ConversionOptionsInput = {};
    const optionsRaw = formData.get("options");
    if (optionsRaw && typeof optionsRaw === "string") {
      try {
        options = JSON.parse(optionsRaw) as ConversionOptionsInput;
      } catch {
        // options 파싱 실패 시 기본값 사용
      }
    }

    // cover 이미지 파싱
    const coverRaw = formData.get("cover");
    const coverFile = coverRaw instanceof File ? coverRaw : null;

    // 3. 파일 검증
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File size must be 50MB or less." },
        { status: 413 }
      );
    }
    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: "Allowed extensions: .docx, .txt only." },
        { status: 400 }
      );
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const validation = await validateFileType(buffer, file.name);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const inputFormat = validation.inputFormat;

    const admin = createAdminClient();
    const ipAddress = getClientIp(request);

    // 사용자 플랜 조회 (Storage 만료 기간 계산용)
    const { data: userProfile } = await admin
      .from("users")
      .select("subscription_plan")
      .eq("id", userId)
      .single();
    const userPlan = (userProfile?.subscription_plan as string) ?? "free";

    // 4. 사용량 체크
    const { data: canConvertData, error: rpcError } = await admin.rpc("can_convert", {
      p_user_id: userId,
    });
    if (rpcError) {
      Sentry.captureException(rpcError);
      console.error("[convert] can_convert RPC error:", rpcError);
      return NextResponse.json(
        { error: "Usage check failed." },
        { status: 500 }
      );
    }
    const allowed = (canConvertData as { allowed?: boolean } | null)?.allowed;
    if (allowed === false) {
      const out = canConvertData as { used?: number; limit?: number; resets_at?: string } | null;
      return NextResponse.json(
        {
          error: "Conversion limit reached.",
          used: out?.used,
          limit: out?.limit,
          resets_at: out?.resets_at,
        },
        { status: 429 }
      );
    }

    // 5. conversions 레코드 생성 (status = processing)
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
    if (insertError || !conversionRow) {
      if (insertError) Sentry.captureException(insertError);
      console.error("[convert] insert conversion error:", insertError);
      return NextResponse.json(
        { error: "Failed to create conversion record." },
        { status: 500 }
      );
    }
    const conversionId = conversionRow.id as string;

    try {
      // 6. Storage에 원본 업로드 (실패해도 변환은 계속 — 버킷 미설정 등 인프라 문제 허용)
      try {
        await uploadInputFile(userId, conversionId, file);
      } catch (storageErr) {
        console.warn("[convert] 원본 Storage 업로드 실패 (변환 계속):", storageErr instanceof Error ? storageErr.message : storageErr);
      }

      // 7. EPUB 변환 (options, cover 전달) → title_page 후처리
      const epubBuffer = await removeTitlePage(
        await runConversion(file, inputFormat, options, coverFile)
      );

      // 8. 변환 성공 — Storage에 결과 업로드 (실패해도 EPUB 반환은 보장)
      let storagePath: string | null = null;
      try {
        await uploadOutputFile(userId, conversionId, epubBuffer);
        storagePath = `${userId}/${conversionId}/output.epub`;
      } catch (storageErr) {
        console.warn("[convert] 결과 Storage 업로드 실패 (EPUB 반환은 계속):", storageErr instanceof Error ? storageErr.message : storageErr);
      }

      const now = new Date();
      const expiresAt = storagePath ? getExpiresAt(now, userPlan) : null;

      await admin
        .from("conversions")
        .update({
          status: "completed",
          completed_at: now.toISOString(),
          ...(expiresAt && { expires_at: expiresAt.toISOString() }),
          storage_path: storagePath,
        })
        .eq("id", conversionId);

      await admin.rpc("increment_conversion", { p_user_id: userId });

      // 9. EPUB blob을 클라이언트에 직접 반환 (Content-Disposition 포함)
      const baseName = (options.title || file.name.replace(/\.[^.]+$/, "")).replace(/[^\w\s-]/g, "").trim() || "document";
      const outputFilename = `${baseName}.epub`;

      return new NextResponse(epubBuffer.buffer as ArrayBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/epub+zip",
          "Content-Disposition": `attachment; filename="${outputFilename}"`,
          "X-Conversion-Id": conversionId,
        },
      });
    } catch (conversionErr) {
      // 변환 실패
      Sentry.captureException(conversionErr);
      const errMessage = conversionErr instanceof Error ? conversionErr.message : String(conversionErr);
      console.error("[convert] conversion error:", conversionErr);
      await admin
        .from("conversions")
        .update({
          status: "failed",
          error_message: errMessage,
        })
        .eq("id", conversionId);
      return NextResponse.json(
        { error: errMessage },
        { status: 500 }
      );
    }
  } catch (err) {
    Sentry.captureException(err);
    console.error("[convert] request error:", err);
    const message = err instanceof Error ? err.message : "Conversion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
