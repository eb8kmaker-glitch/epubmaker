"use client";
import type React from "react";
import type { BookMeta } from "@/app/lib/bookModel";

interface MetaPanelProps {
  meta: BookMeta;
  onChange: (m: BookMeta) => void;
}

export default function MetaPanel({ meta, onChange }: MetaPanelProps) {
  const set = <K extends keyof BookMeta>(key: K, val: BookMeta[K]) =>
    onChange({ ...meta, [key]: val });

  const inputSt: React.CSSProperties = {
    width: "100%", padding: "8px 10px", borderRadius: 7,
    border: "1px solid var(--lib-border)", background: "var(--lib-bg)",
    fontSize: 13, color: "var(--lib-ink)", outline: "none",
    fontFamily: "var(--font-sans), system-ui, sans-serif",
    boxSizing: "border-box",
  };
  const labelSt: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
    color: "var(--lib-dust)", display: "block", marginBottom: 4,
    fontFamily: "var(--font-sans), system-ui, sans-serif",
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px" }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--lib-dust)", marginBottom: 16, fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
        책 설정
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div><label style={labelSt}>제목</label><input style={{ ...inputSt, fontFamily: "var(--font-serif), Georgia, serif", fontSize: 14 }} value={meta.title} onChange={(e) => set("title", e.target.value)} placeholder="책 제목" /></div>
        <div><label style={labelSt}>저자</label><input style={inputSt} value={meta.author} onChange={(e) => set("author", e.target.value)} placeholder="저자 이름" /></div>
        <div><label style={labelSt}>언어</label>
          <select style={inputSt} value={meta.language} onChange={(e) => set("language", e.target.value as BookMeta["language"])}>
            <option value="ko">한국어</option><option value="en">English</option>
            <option value="ja">日本語</option><option value="zh">中文</option>
          </select>
        </div>
        <div><label style={labelSt}>출판사</label><input style={inputSt} value={meta.publisher} onChange={(e) => set("publisher", e.target.value)} placeholder="출판사" /></div>
        <div><label style={labelSt}>날짜</label><input style={inputSt} value={meta.date} onChange={(e) => set("date", e.target.value)} placeholder="2024-01-01" /></div>

        <div style={{ height: 1, background: "var(--lib-border)" }} />

        <div><label style={labelSt}>EPUB 버전</label>
          <select style={inputSt} value={meta.epubVersion} onChange={(e) => set("epubVersion", e.target.value as BookMeta["epubVersion"])}>
            <option value="epub3">EPUB 3 (권장)</option><option value="epub2">EPUB 2</option>
          </select>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={meta.toc} onChange={(e) => set("toc", e.target.checked)} style={{ width: 14, height: 14, accentColor: "var(--lib-wood-dim)" }} />
          <span style={{ fontSize: 13, color: "var(--lib-ink)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>목차(TOC) 포함</span>
        </label>

        <div style={{ height: 1, background: "var(--lib-border)" }} />

        <div>
          <label style={labelSt}>스타일 프리셋</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {(["default", "book", "novel", "academic"] as const).map((s) => (
              <button key={s} type="button" onClick={() => set("style", s)} style={{
                padding: "4px 12px", borderRadius: 20, fontSize: 11, border: "1.5px solid",
                borderColor: meta.style === s ? "var(--lib-wood-dim)" : "var(--lib-border)",
                background: meta.style === s ? "var(--lib-wood-dim)" : "transparent",
                color: meta.style === s ? "#F8F5F0" : "var(--lib-dusk)",
                cursor: "pointer", fontFamily: "var(--font-sans), system-ui, sans-serif",
                fontWeight: meta.style === s ? 600 : 400, transition: "all 0.15s ease",
              }}>
                {{ default: "기본", book: "도서", novel: "소설", academic: "학술" }[s]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
