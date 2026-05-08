"use client";

import type { ConversionOptions, StylePreset } from "@/app/components/ConversionSettings";
import { EPUB_STYLES } from "@/app/lib/epubStyles";

const STYLE_PRESETS: { value: StylePreset; label: string }[] = [
  { value: "default", label: "기본" },
  { value: "book",    label: "도서" },
  { value: "novel",   label: "소설" },
  { value: "academic",label: "학술" },
  { value: "custom",  label: "커스텀" },
];

interface Props {
  conversionOptions: ConversionOptions;
  onOptionsChange: (opts: ConversionOptions) => void;
  onReconvert: () => void;
  reconverting: boolean;
}

export default function MetaTab({ conversionOptions, onOptionsChange, onReconvert, reconverting }: Props) {
  const set = <K extends keyof ConversionOptions>(key: K, value: ConversionOptions[K]) =>
    onOptionsChange({ ...conversionOptions, [key]: value });

  function handleStyleChange(style: StylePreset) {
    if (style === "custom") {
      const base = conversionOptions.style !== "custom" ? conversionOptions.style : "default";
      onOptionsChange({ ...conversionOptions, style: "custom", customCss: conversionOptions.customCss || EPUB_STYLES[base] || "" });
    } else {
      set("style", style);
    }
  }

  const inputSt: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 6,
    border: "1px solid var(--lib-border)",
    background: "var(--lib-panel)",
    fontFamily: "var(--font-sans), system-ui, sans-serif",
    fontSize: 14,
    color: "var(--lib-ink)",
    outline: "none",
    boxSizing: "border-box",
  };
  const labelSt: React.CSSProperties = {
    display: "block",
    marginBottom: 5,
    fontSize: 12,
    fontWeight: 500,
    color: "var(--lib-dust)",
    fontFamily: "var(--font-sans), system-ui, sans-serif",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <h2
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "var(--lib-ink)",
          marginBottom: 24,
          fontFamily: "var(--font-serif), Georgia, serif",
        }}
      >
        메타데이터 편집
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Title */}
        <div>
          <label style={labelSt}>제목</label>
          <input
            type="text"
            value={conversionOptions.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="책 제목"
            style={{ ...inputSt, fontSize: 16, fontFamily: "var(--font-serif), Georgia, serif" }}
          />
        </div>

        {/* Author */}
        <div>
          <label style={labelSt}>저자</label>
          <input
            type="text"
            value={conversionOptions.author}
            onChange={(e) => set("author", e.target.value)}
            placeholder="저자 이름"
            style={inputSt}
          />
        </div>

        {/* Language */}
        <div>
          <label style={labelSt}>언어</label>
          <select
            value={conversionOptions.language}
            onChange={(e) => set("language", e.target.value as ConversionOptions["language"])}
            style={inputSt}
          >
            <option value="ko">한국어 (ko)</option>
            <option value="en">English (en)</option>
            <option value="ja">日本語 (ja)</option>
            <option value="zh">中文 (zh)</option>
          </select>
        </div>

        {/* Publisher */}
        <div>
          <label style={labelSt}>출판사</label>
          <input
            type="text"
            value={conversionOptions.publisher}
            onChange={(e) => set("publisher", e.target.value)}
            placeholder="출판사 이름"
            style={inputSt}
          />
        </div>

        {/* Date */}
        <div>
          <label style={labelSt}>날짜</label>
          <input
            type="text"
            value={conversionOptions.date}
            onChange={(e) => set("date", e.target.value)}
            placeholder="예: 2024-01-15"
            style={inputSt}
          />
        </div>

        <div style={{ height: 1, background: "var(--lib-border)" }} />

        {/* EPUB version */}
        <div>
          <label style={labelSt}>EPUB 버전</label>
          <select
            value={conversionOptions.epubVersion}
            onChange={(e) => set("epubVersion", e.target.value as "epub3" | "epub2")}
            style={inputSt}
          >
            <option value="epub3">EPUB 3 (권장)</option>
            <option value="epub2">EPUB 2</option>
          </select>
        </div>

        {/* TOC */}
        <div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={conversionOptions.toc}
              onChange={(e) => set("toc", e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "var(--lib-wood-dim)" }}
            />
            <span style={{ fontSize: 13, color: "var(--lib-ink)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
              목차(TOC) 포함
            </span>
          </label>
          {conversionOptions.toc && (
            <div style={{ marginTop: 10, paddingLeft: 24 }}>
              <label style={labelSt}>목차 깊이</label>
              <select
                value={conversionOptions.tocDepth}
                onChange={(e) => set("tocDepth", Number(e.target.value) as 1 | 2 | 3)}
                style={{ ...inputSt, width: "auto", minWidth: 80 }}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </div>
          )}
        </div>

        {/* Style preset */}
        <div>
          <label style={labelSt}>스타일 프리셋</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
            {STYLE_PRESETS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleStyleChange(value)}
                style={{
                  padding: "5px 14px",
                  borderRadius: 20,
                  fontSize: 12,
                  border: "1px solid var(--lib-border)",
                  color: conversionOptions.style === value ? "#F8F5F0" : "var(--lib-dusk)",
                  background: conversionOptions.style === value ? "var(--lib-wood-dim)" : "transparent",
                  cursor: "pointer",
                  transition: "all 150ms ease",
                  fontFamily: "var(--font-sans), system-ui, sans-serif",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom CSS */}
        {conversionOptions.style === "custom" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
              <label style={{ ...labelSt, marginBottom: 0 }}>커스텀 CSS</label>
              <div style={{ display: "flex", gap: 4 }}>
                {(["default", "book", "novel", "academic"] as const).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => set("customCss", EPUB_STYLES[preset] ?? "")}
                    style={{
                      fontSize: 10,
                      color: "var(--lib-wood-dim)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textDecoration: "underline",
                      fontFamily: "var(--font-sans), system-ui, sans-serif",
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={conversionOptions.customCss}
              onChange={(e) => set("customCss", e.target.value)}
              rows={14}
              spellCheck={false}
              style={{
                ...inputSt,
                fontFamily: "var(--font-mono), monospace",
                fontSize: 12,
                resize: "vertical",
              }}
            />
          </div>
        )}

        <div style={{ height: 1, background: "var(--lib-border)" }} />

        {/* Reconvert CTA */}
        <div>
          <button
            type="button"
            onClick={onReconvert}
            disabled={reconverting}
            style={{
              width: "100%",
              padding: "12px 20px",
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 8,
              border: "none",
              cursor: reconverting ? "wait" : "pointer",
              background: "var(--lib-wood-dim)",
              color: "#F8F5F0",
              fontFamily: "var(--font-sans), system-ui, sans-serif",
              letterSpacing: "0.02em",
              opacity: reconverting ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "opacity 0.15s",
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
              style={{ animation: reconverting ? "spin 1s linear infinite" : "none" }}
            >
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {reconverting ? "재변환 중…" : "이 설정으로 EPUB 재생성"}
          </button>
          <p
            style={{
              marginTop: 8,
              fontSize: 11,
              color: "var(--lib-dust)",
              textAlign: "center",
              fontFamily: "var(--font-sans), system-ui, sans-serif",
            }}
          >
            변경 사항이 원본 파일에 새로 적용됩니다
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
