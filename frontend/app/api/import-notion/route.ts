import { NextResponse } from "next/server";
import { extractNotionPageId, fetchNotionPageAsHtml } from "@/app/lib/notionToHtml";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!url) {
      return NextResponse.json({ error: "Missing or invalid url" }, { status: 400 });
    }

    const pageId = extractNotionPageId(url);
    if (!pageId) {
      return NextResponse.json({ error: "Invalid Notion page URL or ID" }, { status: 400 });
    }

    const token = process.env.NOTION_API_KEY ?? process.env.NOTION_INTEGRATION_SECRET;
    if (!token) {
      return NextResponse.json({ error: "Notion integration not configured" }, { status: 503 });
    }

    const { html, title } = await fetchNotionPageAsHtml(pageId, token);
    return NextResponse.json({ html, title });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
