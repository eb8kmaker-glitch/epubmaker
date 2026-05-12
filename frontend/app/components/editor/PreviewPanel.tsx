"use client";
import { useState } from "react";
import type { Chapter, TextBlock, ImageBlock } from "@/app/lib/bookModel";
import { EPUB_STYLES } from "@/app/lib/epubStyles";
import { iconBtnSt } from "./editorShared";

interface PreviewPanelProps {
  chapter: Chapter;
  style: string;
  customCss: string;
}

export default function PreviewPanel({ chapter, style, customCss }: PreviewPanelProps) {
  const css = style === "custom" && customCss ? customCss : (EPUB_STYLES[style] ?? EPUB_STYLES.default ?? "");
  const [fontSize, setFontSize] = useState(16);
  const [darkMode, setDarkMode] = useState(false);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: ${fontSize}px;
          line-height: 1.8;
          padding: 32px 28px;
          background: ${darkMode ? "#1a1a1a" : "#fdfaf6"};
          color: ${darkMode ? "#e0d9ce" : "#2d2416"};
          max-width: 100%;
        }
        h1 { font-size: 1.6em; margin-bottom: 0.8em; font-weight: 700; }
        h2 { font-size: 1.25em; margin: 1.4em 0 0.6em; font-weight: 600; }
        h3 { font-size: 1.08em; margin: 1.2em 0 0.5em; font-weight: 600; }
        p  { margin-bottom: 0.9em; }
        blockquote { border-left: 3px solid ${darkMode ? "#666" : "#c4a882"}; padding-left: 16px; margin: 1em 0; color: ${darkMode ? "#aaa" : "#6b5b3e"}; font-style: italic; }
        img { max-width: 100%; border-radius: 6px; margin: 0.8em 0; }
        figure { margin: 1em 0; }
        figcaption { font-size: 0.85em; color: ${darkMode ? "#888" : "#9a8672"}; text-align: center; margin-top: 4px; }
        ${css}
      </style>
    </head>
    <body>
      <h1>${chapter.title}</h1>
      ${chapter.blocks.map((b) => {
        if (b.type === "paragraph") return `<p>${(b as TextBlock).html || "&nbsp;"}</p>`;
        if (b.type === "h2") return `<h2>${(b as TextBlock).html || "&nbsp;"}</h2>`;
        if (b.type === "h3") return `<h3>${(b as TextBlock).html || "&nbsp;"}</h3>`;
        if (b.type === "quote") return `<blockquote><p>${(b as TextBlock).html || "&nbsp;"}</p></blockquote>`;
        if (b.type === "image" && (b as ImageBlock).src) {
          const ib = b as ImageBlock;
          return `<figure><img src="${ib.src}" alt="${ib.alt}"/>${ib.caption ? `<figcaption>${ib.caption}</figcaption>` : ""}</figure>`;
        }
        return "";
      }).join("\n")}
    </body>
    </html>
  `;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Preview controls */}
      <div style={{
        padding: "10px 14px",
        borderBottom: "1px solid var(--lib-border)",
        display: "flex", alignItems: "center", gap: 8,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--lib-dust)", flex: 1 }}>
          미리보기
        </span>
        <button type="button" style={iconBtnSt} onClick={() => setFontSize((s) => Math.max(12, s - 1))} title="글자 줄이기">A-</button>
        <span style={{ fontSize: 10, color: "var(--lib-dust)", minWidth: 20, textAlign: "center" }}>{fontSize}</span>
        <button type="button" style={iconBtnSt} onClick={() => setFontSize((s) => Math.min(24, s + 1))} title="글자 키우기">A+</button>
        <button
          type="button"
          onClick={() => setDarkMode((d) => !d)}
          style={{
            ...iconBtnSt,
            background: darkMode ? "var(--lib-ink)" : "var(--lib-bg-3)",
            color: darkMode ? "#F8F5F0" : "var(--lib-dust)",
          }}
          title={darkMode ? "라이트 모드" : "다크 모드"}
        >
          {darkMode ? "☀" : "🌙"}
        </button>
      </div>

      {/* Kindle-style device frame */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 12px", display: "flex", justifyContent: "center", background: "var(--lib-bg-3)" }}>
        <div style={{
          width: "100%",
          maxWidth: 260,
          borderRadius: 12,
          boxShadow: "0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.08)",
          overflow: "hidden",
          border: "8px solid " + (darkMode ? "#111" : "#2c2c2c"),
          background: darkMode ? "#1a1a1a" : "#fdfaf6",
        }}>
          <iframe
            srcDoc={html}
            style={{ width: "100%", height: 400, border: "none", display: "block" }}
            title="EPUB 미리보기"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
