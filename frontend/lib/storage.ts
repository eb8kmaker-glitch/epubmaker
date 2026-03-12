/**
 * Supabase Storage: 변환 입력/출력 업로드, signed URL, 삭제, 만료 정리.
 *
 * 모든 함수는 createAdminClient(service_role)만 사용.
 * 사용 위치: API Route, Server Action, Cron 등 서버 전용.
 */

import { createAdminClient } from "@/lib/supabase";
import { fileTypeFromBuffer } from "file-type";

const BUCKET = "conversions";

const ALLOWED_INPUT: Record<string, string> = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
  "image/jpeg": "jpg",
  "image/png": "png",
};

const ALLOWED_EXTENSIONS = new Set<string>(["docx", "txt", "jpg", "jpeg", "png"]);

function getExtFromFilename(name: string): string {
  const i = name.lastIndexOf(".");
  if (i === -1) return "";
  return name.slice(i + 1).toLowerCase();
}

/**
 * 1. uploadInputFile
 * conversions 버킷에 {userId}/{conversionId}/input.{ext} 로 업로드.
 * magic bytes(file-type)로 실제 MIME 검증 후 docx, txt, jpeg, png만 허용.
 */
export async function uploadInputFile(
  userId: string,
  conversionId: string,
  file: File
): Promise<{ path: string }> {
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const detected = await fileTypeFromBuffer(buf);

    let ext: string;
    if (detected) {
      const allowedExt = ALLOWED_INPUT[detected.mime];
      if (!allowedExt || !ALLOWED_EXTENSIONS.has(detected.ext)) {
        throw new Error(
          `Invalid file type: detected ${detected.mime} (${detected.ext}). Allowed: docx, txt, jpeg, png.`
        );
      }
      ext = detected.ext === "jpg" ? "jpg" : detected.ext;
    } else {
      const nameExt = getExtFromFilename(file.name);
      if (nameExt !== "txt") {
        throw new Error(
          `Could not detect file type (magic bytes). Only .txt is allowed without signature; got extension: ${nameExt || "none"}.`
        );
      }
      ext = "txt";
    }

    const path = `${userId}/${conversionId}/input.${ext}`;
    const supabase = createAdminClient();
    const { error } = await supabase.storage.from(BUCKET).upload(path, buf, {
      contentType: file.type || undefined,
      upsert: true,
    });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
    return { path };
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("uploadInputFile failed");
  }
}

/**
 * 2. uploadOutputFile
 * 변환된 EPUB을 {userId}/{conversionId}/output.epub 로 업로드.
 */
export async function uploadOutputFile(
  userId: string,
  conversionId: string,
  buffer: Buffer
): Promise<{ path: string }> {
  try {
    const path = `${userId}/${conversionId}/output.epub`;
    const supabase = createAdminClient();
    const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
      contentType: "application/epub+zip",
      upsert: true,
    });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
    return { path };
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("uploadOutputFile failed");
  }
}

/**
 * 3. getSignedDownloadUrl
 * 지정 시간(초) 동안 유효한 signed URL 반환.
 */
export async function getSignedDownloadUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<{ url: string }> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, expiresIn);
    if (error) throw new Error(`Signed URL failed: ${error.message}`);
    if (!data?.signedUrl) throw new Error("Signed URL not returned");
    return { url: data.signedUrl };
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("getSignedDownloadUrl failed");
  }
}

/**
 * 4. deleteConversionFiles
 * 해당 conversionId 폴더 내 모든 파일 삭제.
 */
export async function deleteConversionFiles(
  userId: string,
  conversionId: string
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const prefix = `${userId}/${conversionId}`;
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET)
      .list(prefix);
    if (listError) throw new Error(`Storage list failed: ${listError.message}`);
    if (!files?.length) return;
    const paths = files
      .filter((f) => f.name != null)
      .map((f) => `${prefix}/${f.name}`);
    const { error: removeError } = await supabase.storage.from(BUCKET).remove(paths);
    if (removeError) throw new Error(`Storage remove failed: ${removeError.message}`);
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("deleteConversionFiles failed");
  }
}

/**
 * 5. cleanupExpiredFiles (서버 cron용)
 * conversions 테이블에서 expires_at 지난 레코드의 storage_path 조회 후
 * 해당 conversion 폴더 파일 삭제하고 storage_path를 null로 업데이트.
 */
export async function cleanupExpiredFiles(): Promise<{ cleaned: number; errors: string[] }> {
  const errors: string[] = [];
  let cleaned = 0;
  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();
    const { data: rows, error: selectError } = await supabase
      .from("conversions")
      .select("id, user_id")
      .lt("expires_at", now)
      .not("storage_path", "is", null);
    if (selectError) {
      throw new Error(`conversions select failed: ${selectError.message}`);
    }
    if (!rows?.length) return { cleaned: 0, errors: [] };

    for (const row of rows) {
      try {
        const userId = row.user_id as string;
        const conversionId = row.id as string;
        await deleteConversionFiles(userId, conversionId);
        const { error: updateError } = await supabase
          .from("conversions")
          .update({ storage_path: null })
          .eq("id", row.id);
        if (updateError) errors.push(`${row.id}: ${updateError.message}`);
        else cleaned++;
      } catch (e) {
        errors.push(`${row.id}: ${e instanceof Error ? e.message : "unknown"}`);
      }
    }
    return { cleaned, errors };
  } catch (e) {
    if (e instanceof Error) errors.push(e.message);
    else errors.push("cleanupExpiredFiles failed");
    return { cleaned, errors };
  }
}

export { BUCKET as BUCKET_CONVERSIONS };
