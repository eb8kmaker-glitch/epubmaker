/**
 * Convert Notion API block children to HTML for EPUB pipeline.
 * Maps block types to semantic HTML; rich_text annotations to inline tags.
 */

export interface NotionRichText {
  plain_text: string;
  href?: string | null;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
  };
}

export interface NotionBlock {
  id: string;
  type: string;
  [key: string]: unknown;
}

const NOTION_API = "https://api.notion.com/v1";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function richTextToHtml(richText: NotionRichText[]): string {
  if (!richText?.length) return "";
  return richText
    .map((t) => {
      let content = escapeHtml(t.plain_text || "");
      if (t.annotations?.code) content = `<code>${content}</code>`;
      if (t.annotations?.bold) content = `<strong>${content}</strong>`;
      if (t.annotations?.italic) content = `<em>${content}</em>`;
      if (t.annotations?.strikethrough) content = `<s>${content}</s>`;
      if (t.annotations?.underline) content = `<u>${content}</u>`;
      if (t.href) content = `<a href="${escapeHtml(t.href)}">${content}</a>`;
      return content;
    })
    .join("");
}

function getBlockRichText(block: NotionBlock): NotionRichText[] {
  const type = block.type;
  const data = block[type] as Record<string, unknown> | undefined;
  const rt = data?.rich_text as NotionRichText[] | undefined;
  return Array.isArray(rt) ? rt : [];
}

function getBlockCaption(block: NotionBlock): NotionRichText[] {
  const type = block.type;
  const data = block[type] as Record<string, unknown> | undefined;
  const rt = data?.caption as NotionRichText[] | undefined;
  return Array.isArray(rt) ? rt : [];
}

function blockToHtml(block: NotionBlock): string {
  const type = block.type;
  const text = richTextToHtml(getBlockRichText(block));

  switch (type) {
    case "heading_1":
      return text ? `<h1>${text}</h1>` : "";
    case "heading_2":
      return text ? `<h2>${text}</h2>` : "";
    case "heading_3":
      return text ? `<h3>${text}</h3>` : "";
    case "paragraph":
      return text ? `<p>${text}</p>` : "<p></p>";
    case "bulleted_list_item":
      return text ? `<li>${text}</li>` : "";
    case "numbered_list_item":
      return text ? `<li>${text}</li>` : "";
    case "to_do": {
      const checked = (block.to_do as { checked?: boolean })?.checked;
      const wrap = checked ? "<s>" : "";
      const wrapEnd = checked ? "</s>" : "";
      return text ? `<p>${wrap}${text}${wrapEnd}</p>` : "";
    }
    case "quote":
      return text ? `<blockquote><p>${text}</p></blockquote>` : "";
    case "code": {
      const lang = (block.code as { language?: string })?.language ?? "";
      const attr = lang ? ` class="language-${escapeHtml(lang)}"` : "";
      return text ? `<pre><code${attr}>${text}</code></pre>` : "";
    }
    case "image": {
      const img = block.image as { type?: string; file?: { url?: string }; external?: { url?: string } };
      const url = img?.file?.url ?? img?.external?.url ?? "";
      const cap = richTextToHtml(getBlockCaption(block));
      const alt = cap || "Image";
      return url ? `<figure><img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" />${cap ? `<figcaption>${cap}</figcaption>` : ""}</figure>` : "";
    }
    case "divider":
      return "<hr />";
    case "callout":
    case "toggle":
      return text ? `<p>${text}</p>` : "";
    default:
      return text ? `<p>${text}</p>` : "";
  }
}

/** Format 32-char hex as UUID with dashes (Notion API expects this). */
function toNotionUuid(hex32: string): string {
  if (hex32.length !== 32) return hex32;
  return `${hex32.slice(0, 8)}-${hex32.slice(8, 12)}-${hex32.slice(12, 16)}-${hex32.slice(16, 20)}-${hex32.slice(20, 32)}`;
}

/** Extract Notion page ID from URL or raw id. Returns UUID-format string for API. */
export function extractNotionPageId(urlOrId: string): string | null {
  const s = urlOrId.trim();
  if (!s) return null;
  const asUrl = s.startsWith("http") ? s : `https://notion.so/${s}`;
  try {
    const u = new URL(asUrl);
    const path = u.pathname.replace(/^\/+/, "").split("?")[0];
    const segment = path.split("/").filter(Boolean).pop() ?? path;
    const uuidMatch = segment.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (uuidMatch) return uuidMatch[1];
    const hexMatch = segment.match(/([a-f0-9]{32})/i);
    const raw = hexMatch ? hexMatch[1] : segment.replace(/-/g, "");
    return raw.length === 32 && /^[a-f0-9]+$/i.test(raw) ? toNotionUuid(raw) : null;
  } catch {
    const id = s.replace(/-/g, "");
    return id.length === 32 && /^[a-f0-9]+$/i.test(id) ? toNotionUuid(id) : null;
  }
}

async function fetchBlockChildren(
  blockId: string,
  notionToken: string,
  childMap: Map<string, NotionBlock[]>
): Promise<void> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${notionToken}`,
    "Notion-Version": "2022-06-28",
  };
  let cursor: string | undefined;
  const list: NotionBlock[] = [];
  do {
    const url = `${NOTION_API}/blocks/${blockId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ""}`;
    const res = await fetch(url, { headers });
    if (!res.ok) return;
    const data = (await res.json()) as { results?: NotionBlock[]; next_cursor?: string };
    const results = data.results ?? [];
    list.push(...results);
    cursor = data.next_cursor ?? undefined;
  } while (cursor);
  childMap.set(blockId, list);
  await Promise.all(
    list
      .filter((b) => (b as { has_children?: boolean }).has_children)
      .map((b) => fetchBlockChildren(b.id, notionToken, childMap))
  );
}

export async function fetchNotionPageAsHtml(
  pageId: string,
  notionToken: string
): Promise<{ html: string; title: string }> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${notionToken}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
  };

  const pageRes = await fetch(`${NOTION_API}/pages/${pageId}`, { headers });
  if (!pageRes.ok) {
    const err = await pageRes.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || `Notion API error: ${pageRes.status}`);
  }
  const pageData = (await pageRes.json()) as { properties?: { title?: { title?: Array<{ plain_text?: string }> } } };
  const titleArr = pageData.properties?.title?.title ?? [];
  const title = titleArr.map((t) => t.plain_text ?? "").join("").trim() || "Notion Page";

  const childMap = new Map<string, NotionBlock[]>();
  await fetchBlockChildren(pageId, notionToken, childMap);
  const blocks = childMap.get(pageId) ?? [];

  const getChildren = (blockId: string): string => {
    const children = childMap.get(blockId) ?? [];
    const parts: string[] = [];
    let inList: "ul" | "ol" | null = null;
    for (const child of children) {
      const type = child.type;
      if (type === "bulleted_list_item") {
        if (inList !== "ul") {
          if (inList) parts.push(inList === "ol" ? "</ol>" : "</ul>");
          parts.push("<ul>");
          inList = "ul";
        }
        parts.push(blockToHtml(child));
      } else if (type === "numbered_list_item") {
        if (inList !== "ol") {
          if (inList) parts.push("</ul>");
          parts.push("<ol>");
          inList = "ol";
        }
        parts.push(blockToHtml(child));
      } else {
        if (inList) {
          parts.push(inList === "ol" ? "</ol>" : "</ul>");
          inList = null;
        }
        parts.push(blockToHtml(child));
      }
    }
    if (inList) parts.push(inList === "ol" ? "</ol>" : "</ul>");
    return parts.join("");
  };

  const parts: string[] = [];
  let inList: "ul" | "ol" | null = null;
  for (const block of blocks) {
    if (block.type === "child_page" || block.type === "child_database") continue;
    if (block.type === "bulleted_list_item") {
      if (inList !== "ul") {
        if (inList) parts.push(inList === "ol" ? "</ol>" : "</ul>");
        parts.push("<ul>");
        inList = "ul";
      }
      parts.push(blockToHtml(block));
      const nested = getChildren(block.id);
      if (nested) parts.push(nested);
    } else if (block.type === "numbered_list_item") {
      if (inList !== "ol") {
        if (inList) parts.push("</ul>");
        parts.push("<ol>");
        inList = "ol";
      }
      parts.push(blockToHtml(block));
      const nested = getChildren(block.id);
      if (nested) parts.push(nested);
    } else {
      if (inList) {
        parts.push(inList === "ol" ? "</ol>" : "</ul>");
        inList = null;
      }
      if (block.type === "child_page" || block.type === "child_database") continue;
      parts.push(blockToHtml(block));
      const nested = getChildren(block.id);
      if (nested) parts.push(nested);
    }
  }
  if (inList) parts.push(inList === "ol" ? "</ol>" : "</ul>");

  const body = parts.filter(Boolean).join("\n");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title></head><body>${body}</body></html>`;
  return { html, title };
}
