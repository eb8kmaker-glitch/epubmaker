/**
 * GET /api/conversions/[id]/download
 *
 * 인증된 사용자의 변환 결과 파일을 Storage에서 프록시해 반환.
 * - 본인 소유 변환만 접근 가능 (user_id 매칭)
 * - storage_path 없거나 expires_at 초과 시 410 Gone
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1. 인증
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. 본인 소유 conversion 조회
  const admin = createAdminClient();
  const { data: conversion, error } = await admin
    .from("conversions")
    .select("id, user_id, storage_path, expires_at, original_filename")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !conversion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!conversion.storage_path) {
    return NextResponse.json({ error: "File no longer available" }, { status: 410 });
  }

  if (conversion.expires_at && new Date(conversion.expires_at) < new Date()) {
    return NextResponse.json({ error: "File expired" }, { status: 410 });
  }

  // 3. Storage에서 파일 다운로드
  const { data: fileData, error: downloadError } = await admin.storage
    .from("conversions")
    .download(conversion.storage_path);

  if (downloadError || !fileData) {
    return NextResponse.json({ error: "File download failed" }, { status: 500 });
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const baseName = (conversion.original_filename ?? "document").replace(/\.[^.]+$/, "");
  const outputFilename = `${baseName}.epub`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/epub+zip",
      "Content-Disposition": `attachment; filename="${outputFilename}"`,
    },
  });
}
