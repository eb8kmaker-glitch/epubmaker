"use client";

import { useEffect, useState } from "react";
import JSZip from "jszip";

interface Props {
  epubBlob: Blob;
}

interface Chapter {
  title: string;
  text: string;
  wordCount: number;
}

function htmlToText(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  // Remove script/style
  doc.querySelectorAll("script, style, nav").forEach((el) => el.remove());
  return doc.body?.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

export default function BodyTab({ epubBlob }: Props) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const zip = await JSZip.loadAsync(epubBlob);
        const containerXml = await zip.file("META-INF/container.xml")?.async("text");
        if (!containerXml) throw new Error("Invalid EPUB");
        const opfPath = containerXml.match(/full-path="([^"]+)"/)?.[1];
        if (!opfPath) throw new Error("OPF not found");
        const opfDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";
        const opf = await zip.file(opfPath)?.async("text");
        if (!opf) throw new Error("OPF file missing");

        // Build spine order
        const spineMatches = [...opf.matchAll(/<itemref\b[^>]*\bidref="([^"]+)"/g)].map((m) => m[1]);
        const idToHref: Record<string, string> = {};
        const idToLabel: Record<string, string> = {};
        for (const m of opf.matchAll(/<item\b([^>]*?)(?:\/>|>)/gi)) {
          const attrs = m[1];
          const id = attrs.match(/\bid="([^"]+)"/)?.[1];
          const href = attrs.match(/href="([^"]+)"/)?.[1];
          if (id && href) idToHref[id] = opfDir + href;
        }

        // Try to get chapter titles from nav
        const navIdMatch = opf.match(/properties="[^"]*\bnav\b[^"]*"[^>]*href="([^"]+)"/);
        if (navIdMatch) {
          const navPath = opfDir + navIdMatch[1];
          const navContent = await zip.file(navPath)?.async("text");
          if (navContent) {
            const parser = new DOMParser();
            const navDoc = parser.parseFromString(navContent, "text/html");
            const links = navDoc.querySelectorAll("nav a");
            for (const link of links) {
              const href = link.getAttribute("href")?.split("#")[0];
              const label = link.textContent?.trim() ?? "";
              if (href) {
                for (const id of Object.keys(idToHref)) {
                  if (idToHref[id].endsWith(href)) idToLabel[id] = label;
                }
              }
            }
          }
        }

        const result: Chapter[] = [];
        for (const idref of spineMatches.slice(0, 30)) { // cap at 30 chapters
          const path = idToHref[idref];
          if (!path) continue;
          const html = await zip.file(path)?.async("text");
          if (!html) continue;
          const text = htmlToText(html);
          if (!text || text.length < 10) continue;
          const wordCount = text.split(/\s+/).filter(Boolean).length;
          result.push({
            title: idToLabel[idref] || path.split("/").pop()?.replace(/\.[^.]+$/, "") || `챕터 ${result.length + 1}`,
            text: text.slice(0, 8000), // preview first 8000 chars
            wordCount,
          });
        }

        if (!cancelled) setChapters(result);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "본문 읽기 실패");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [epubBlob]);

  if (loading) {
    return (
      <div style={{ padding: 28 }}>
        <p style={{ fontSize: 13, color: "var(--lib-dust)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
          본문 불러오는 중…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 28 }}>
        <p style={{ fontSize: 13, color: "#ef4444", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
          {error}
        </p>
      </div>
    );
  }

  const totalWords = chapters.reduce((s, c) => s + c.wordCount, 0);

  return (
    <div style={{ padding: 28, maxWidth: 720, fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--lib-ink)", fontFamily: "var(--font-serif), Georgia, serif" }}>
          본문 보기
        </h2>
        <span style={{ fontSize: 11, color: "var(--lib-dust)" }}>
          {chapters.length}개 챕터 · 약 {totalWords.toLocaleString()}단어
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {chapters.map((ch, idx) => (
          <div
            key={idx}
            style={{
              borderRadius: 8,
              border: "1px solid var(--lib-border)",
              background: "var(--lib-panel)",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 16px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--lib-ink)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {ch.title}
              </span>
              <span style={{ fontSize: 11, color: "var(--lib-dust)", flexShrink: 0 }}>
                {ch.wordCount.toLocaleString()}단어
              </span>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--lib-dust)"
                strokeWidth="2"
                aria-hidden
                style={{ flexShrink: 0, transition: "transform 0.15s", transform: openIdx === idx ? "rotate(90deg)" : "rotate(0deg)" }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            {openIdx === idx && (
              <div
                style={{
                  padding: "0 16px 16px",
                  borderTop: "1px solid var(--lib-border)",
                }}
              >
                <p
                  style={{
                    marginTop: 12,
                    fontSize: 14,
                    color: "var(--lib-dusk)",
                    lineHeight: 1.75,
                    whiteSpace: "pre-wrap",
                    fontFamily: "var(--font-serif), Georgia, serif",
                    maxHeight: 400,
                    overflowY: "auto",
                  }}
                >
                  {ch.text}
                  {ch.text.length >= 8000 && (
                    <span style={{ fontStyle: "italic", color: "var(--lib-dust)", fontSize: 12 }}>
                      {"\n\n"}… (미리보기 8,000자 제한)
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
