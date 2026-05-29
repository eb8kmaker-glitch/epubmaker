"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import type { Chapter, TextBlock, ImageBlock } from "@/app/lib/bookModel";
import { EPUB_STYLES } from "@/app/lib/epubStyles";
import { iconBtnSt } from "./editorShared";

interface PreviewPanelProps {
  chapter: Chapter;
  style: string;
  customCss: string;
}

const WIDTH_PRESETS = [
  { label: "📱", width: 320, title: "Mobile (320px)" },
  { label: "📖", width: 480, title: "Kindle (480px)" },
  { label: "💻", width: 600, title: "Tablet (600px)" },
  { label: "⬜", width: 0, title: "Full width" },
] as const;

export default function PreviewPanel({ chapter, style, customCss }: PreviewPanelProps) {
  const css = style === "custom" && customCss ? customCss : (EPUB_STYLES[style] ?? EPUB_STYLES.default ?? "");
  const [fontSize, setFontSize] = useState(16);
  const [darkMode, setDarkMode] = useState(false);
  const [presetWidth, setPresetWidth] = useState(0); // 0 = full width
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  const openPopout = useCallback(() => {
    const popout = window.open(
      "",
      "epub-preview",
      "width=480,height=700,resizable=yes,scrollbars=yes,toolbar=no,menubar=no",
    );
    if (popout) {
      popout.document.open();
      popout.document.write(html);
      popout.document.close();
    }
  }, [html]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Toolbar row 1: title + font + dark + popout */}
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
        <button
          type="button"
          onClick={openPopout}
          title="새 창에서 열기"
          style={{
            ...iconBtnSt,
            fontSize: 14,
          }}
        >
          ⤢
        </button>
      </div>

      {/* Toolbar row 2: width presets */}
      <div style={{
        padding: "6px 14px",
        borderBottom: "1px solid var(--lib-border)",
        display: "flex", alignItems: "center", gap: 4,
        flexShrink: 0,
      }}>
        {WIDTH_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            title={preset.title}
            onClick={() => setPresetWidth(preset.width)}
            style={{
              padding: "3px 8px",
              borderRadius: 4,
              border: "1px solid var(--lib-border)",
              background: presetWidth === preset.width ? "var(--lib-bg-3)" : "transparent",
              cursor: "pointer",
              fontSize: 13,
              color: presetWidth === preset.width ? "var(--lib-ink)" : "var(--lib-dust)",
              fontWeight: presetWidth === preset.width ? 700 : 400,
            }}
          >
            {preset.label}
          </button>
        ))}
        {presetWidth > 0 && (
          <span style={{ fontSize: 10, color: "var(--lib-dust)", marginLeft: 4 }}>{presetWidth}px</span>
        )}
      </div>

      {/* Preview area */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 12px", display: "flex", justifyContent: "center", background: "var(--lib-bg-3)" }}>
        <div style={{
          width: presetWidth > 0 ? presetWidth : "100%",
          maxWidth: presetWidth > 0 ? presetWidth : "100%",
          borderRadius: 8,
          boxShadow: "0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.08)",
          overflow: "hidden",
          border: "1px solid " + (darkMode ? "#333" : "#ddd"),
          background: darkMode ? "#1a1a1a" : "#fdfaf6",
          transition: "width 0.2s ease",
        }}>
          <iframe
            ref={iframeRef}
            srcDoc={html}
            style={{ width: "100%", height: 500, border: "none", display: "block" }}
            title="EPUB 미리보기"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
