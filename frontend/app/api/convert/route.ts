/**
 * EPUB 변환 API (인증 + 사용량 제한 + Storage + DB 기록).
 *
 * 순서: 인증 → 파일 수신 → 검증 → can_convert RPC → conversions 삽입 → Storage 업로드 → 변환 → 출력 업로드 → increment_conversion → signed URL 반환.
 * createServerClient: 세션 확인. createAdminClient: RPC, conversions, Storage.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase";
import { uploadInputFile, uploadOutputFile, getSignedDownloadUrl } from "@/lib/storage";
import { fileTypeFromBuffer } from "file-type";
import { convert } from "pandoc-wasm";
import { EPUB_STYLES } from "@/app/lib/epubStyles";

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

function getExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i).toLowerCase();
}

function getInputFormat(ext: string): "docx" | "txt" {
  return ext === ".docx" ? "docx" : "txt";
}

/** Magic bytes 검증: .docx, .txt만 허용. 불일치 시 에러 메시지 반환. */
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
  inputFile?: string;
}): Record<string, unknown> {
  return {
    from: params.from,
    to: params.to,
    "output-file": params.outputFile,
    standalone: true,
    "table-of-contents": params.toc,
    "toc-depth": params.tocDepth,
    css: [params.styleCssFile],
    metadata: {},
    ...(params.inputFile ? { "input-files": [params.inputFile] } : {}),
  };
}

/** DOCX/TXT → EPUB 변환 (pandoc-wasm). */
async function runConversion(
  file: File,
  inputFormat: "docx" | "txt"
): Promise<Buffer> {
  const files: Record<string, Blob | string> = {};
  files[STYLE_FILENAME] = EPUB_STYLES.default ?? "";

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
    to: "epub3",
    outputFile: OUTPUT_FILENAME,
    toc: true,
    tocDepth: 3,
    styleCssFile: STYLE_FILENAME,
    inputFile: fromFormat === "html" ? undefined : undefined,
  });

  const result = await convert(pandocOptions, stdin, files);
  const epubBlob = result.files?.[OUTPUT_FILENAME];
  if (!epubBlob || !(epubBlob instanceof Blob)) {
    throw new Error(result.stderr || "Conversion produced no output.");
  }
  return Buffer.from(await epubBlob.arrayBuffer());
}

export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    // 2. 파일 수신
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided. Send a file in the 'file' field." },
        { status: 400 }
      );
    }

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

    // 4. 사용량 체크
    const { data: canConvertData, error: rpcError } = await admin.rpc("can_convert", {
      p_user_id: userId,
    });
    if (rpcError) {
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
      console.error("[convert] insert conversion error:", insertError);
      return NextResponse.json(
        { error: "Failed to create conversion record." },
        { status: 500 }
      );
    }
    const conversionId = conversionRow.id as string;

    try {
      // 6. Storage에 원본 업로드
      await uploadInputFile(userId, conversionId, file);

      // 7. EPUB 변환
      const epubBuffer = await runConversion(file, inputFormat);

      // 8. 변환 성공
      await uploadOutputFile(userId, conversionId, epubBuffer);

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
      const storagePath = `${userId}/${conversionId}/output.epub`;

      await admin
        .from("conversions")
        .update({
          status: "completed",
          completed_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          storage_path: storagePath,
        })
        .eq("id", conversionId);

      await admin.rpc("increment_conversion", { p_user_id: userId });

      const { url: downloadUrl } = await getSignedDownloadUrl(storagePath, 3600);

      return NextResponse.json({
        downloadUrl,
        conversionId,
        expiresAt: expiresAt.toISOString(),
      });
    } catch (conversionErr) {
      // 9. 변환 실패
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
    console.error("[convert] request error:", err);
    const message = err instanceof Error ? err.message : "Conversion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
