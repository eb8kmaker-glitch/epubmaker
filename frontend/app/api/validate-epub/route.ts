import { NextResponse } from "next/server";
import { EpubCheck } from "@likecoin/epubcheck-ts";
import { buildValidationResult } from "@/app/lib/validateEpub";
import { checkRateLimit } from "@/lib/rateLimit";

const RATE_LIMIT_PER_MINUTE = 10;

/** EPUB is ZIP-based: local file header signature PK (0x50 0x4B 0x03 0x04) or empty zip (0x50 0x4B 0x05 0x06). */
function isEpubMagicBytes(buffer: Uint8Array): boolean {
  if (buffer.length < 4) return false;
  return (
    (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) ||
    (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x05 && buffer[3] === 0x06)
  );
}

export async function POST(request: Request) {
  if (!checkRateLimit(request, RATE_LIMIT_PER_MINUTE)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }
  try {
    const formData = await request.formData();
    const file = formData.get("epub");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing EPUB file" }, { status: 400 });
    }
    const buffer = new Uint8Array(await file.arrayBuffer());
    if (!isEpubMagicBytes(buffer)) {
      return NextResponse.json(
        { error: "Invalid file: not an EPUB (magic bytes mismatch). Expected ZIP-based EPUB." },
        { status: 400 }
      );
    }
    const result = await EpubCheck.validate(buffer);
    const output = buildValidationResult({
      messages: result.messages,
      version: result.version,
      fatalCount: result.fatalCount,
      errorCount: result.errorCount,
      warningCount: result.warningCount,
    });
    return NextResponse.json(output);
  } catch (e) {
    console.error("EPUB validation error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Validation failed" },
      { status: 500 }
    );
  }
}
