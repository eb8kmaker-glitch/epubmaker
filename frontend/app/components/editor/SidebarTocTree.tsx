"use client";

import { useEffect, useState } from "react";
import JSZip from "jszip";

interface TocEntry {
  label: string;
  href: string;
  depth: number;
}

interface Props {
  epubBlob: Blob;
  onChapterClick: (href: string) => void;
}

function parseNavSimple(content: string): TocEntry[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "text/html");
  const nav =
    doc.querySelector('nav[epub\\:type="toc"]') ||
    doc.querySelector('nav[role="doc-toc"]') ||
    doc.querySelector("nav");
  if (!nav) return [];

  const items: TocEntry[] = [];
  function walk(ol: Element, depth: number) {
    for (const li of ol.children) {
      if (li.tagName.toLowerCase() !== "li") continue;
      const a = li.querySelector("a");
      if (a) items.push({ label: a.textContent?.trim() ?? "", href: a.getAttribute("href") ?? "", depth });
      const nested = li.querySelector("ol");
      if (nested) walk(nested, depth + 1);
    }
  }
  const ol = nav.querySelector("ol");
  if (ol) walk(ol, 0);
  return items;
}

function parseNcxSimple(content: string): TocEntry[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "application/xml");
  const navMap = doc.querySelector("navMap");
  if (!navMap) return [];

  const items: TocEntry[] = [];
  function walk(parent: Element, depth: number) {
    for (const child of parent.children) {
      if (child.tagName.replace(/.*:/, "") !== "navPoint") continue;
      const label = child.querySelector("navLabel > text, text")?.textContent?.trim() ?? "";
      const src = child.querySelector("content")?.getAttribute("src") ?? "";
      items.push({ label, href: src, depth });
      walk(child, depth + 1);
    }
  }
  walk(navMap, 0);
  return items;
}

export default function SidebarTocTree({ epubBlob, onChapterClick }: Props) {
  const [items, setItems] = useState<TocEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const zip = await JSZip.loadAsync(epubBlob);
        const container = await zip.file("META-INF/container.xml")?.async("text");
        if (!container) return;
        const opfPath = container.match(/full-path="([^"]+)"/)?.[1];
        if (!opfPath) return;
        const opfDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";
        const opf = await zip.file(opfPath)?.async("text");
        if (!opf) return;

        let navPath: string | null = null;
        let format: "nav" | "ncx" = "nav";
        let ncxPath: string | null = null;

        const re = /<item\b([^>]*?)(?:\/>|>)/gi;
        let m: RegExpExecArray | null;
        while ((m = re.exec(opf)) !== null) {
          const attrs = m[1];
          const href = attrs.match(/href="([^"]+)"/)?.[1];
          if (!href) continue;
          if (/properties="[^"]*\bnav\b/.test(attrs)) { navPath = opfDir + href; format = "nav"; break; }
          if (!ncxPath && /media-type="application\/x-dtbncx\+xml"/.test(attrs)) ncxPath = opfDir + href;
        }
        if (!navPath && ncxPath) { navPath = ncxPath; format = "ncx"; }
        if (!navPath) return;

        const navContent = await zip.file(navPath)?.async("text");
        if (!navContent) return;
        const parsed = format === "nav" ? parseNavSimple(navContent) : parseNcxSimple(navContent);
        if (!cancelled) setItems(parsed);
      } catch { /* ignore */ } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [epubBlob]);

  if (loading) {
    return (
      <p style={{ padding: "0 16px", fontSize: 11, color: "var(--lib-dust)" }}>불러오는 중…</p>
    );
  }

  if (items.length === 0) {
    return (
      <p style={{ padding: "0 16px", fontSize: 11, color: "var(--lib-dust)" }}>목차 없음</p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {items.map((item, i) => (
        <button
          key={`${item.href}-${i}`}
          type="button"
          onClick={() => onChapterClick(item.href)}
          title={item.label}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            padding: `5px 16px 5px ${16 + item.depth * 12}px`,
            fontSize: item.depth === 0 ? 12 : 11,
            fontWeight: item.depth === 0 ? 500 : 400,
            color: item.depth === 0 ? "var(--lib-dusk)" : "var(--lib-dust)",
            background: "none",
            border: "none",
            cursor: "pointer",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            lineHeight: 1.4,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--lib-bg-3)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
        >
          {item.label || "(untitled)"}
        </button>
      ))}
    </div>
  );
}
