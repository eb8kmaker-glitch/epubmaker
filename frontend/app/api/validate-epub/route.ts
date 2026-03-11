import { NextResponse } from "next/server";
import { EpubCheck } from "@likecoin/epubcheck-ts";
import { buildValidationResult } from "@/app/lib/validateEpub";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("epub");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing EPUB file" }, { status: 400 });
    }
    const buffer = new Uint8Array(await file.arrayBuffer());
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
