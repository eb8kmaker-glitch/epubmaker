"use client";

import { useEffect, useState } from "react";
import TocEditor from "@/app/components/TocEditor";
import EpubPreview from "@/app/components/EpubPreview";
import SidebarTocTree from "./SidebarTocTree";
import MetaTab from "./tabs/MetaTab";
import BodyTab from "./tabs/BodyTab";
import type { ConversionOptions } from "@/app/components/ConversionSettings";
import type { EpubValidationResult } from "@/app/lib/validateEpub";

type EditorTab = "meta" | "toc" | "body" | "preview";

const TABS: { id: EditorTab; label: string }[] = [
  { id: "meta",    label: "메타데이터" },
  { id: "toc",     label: "목차 편집" },
  { id: "body",    label: "본문 보기" },
  { id: "preview", label: "미리보기" },
];

interface Props {
  epubBlob: Blob;
  filename: string;
  conversionOptions: ConversionOptions;
  onOptionsChange: (opts: ConversionOptions) => void;
  validationResult: EpubValidationResult | null;
  validationLoading: boolean;
  validationError: string | null;
  onBack: () => void;
  onReconvert: () => void;
  reconverting: boolean;
}

export default function EditorLayout({
  epubBlob,
  filename,
  conversionOptions,
  onOptionsChange,
  validationResult,
  validationLoading,
  validationError,
  onBack,
  onReconvert,
  reconverting,
}: Props) {
  const [activeTab, setActiveTab] = useState<EditorTab>("meta");

  // Lock body scroll while editor overlay is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleDownload = () => {
    const url = URL.createObjectURL(epubBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const vs = validationLoading
    ? { icon: "…", color: "var(--lib-dust)", label: "검사 중…" }
    : validationResult?.status === "ok"
    ? { icon: "✔", color: "#16a34a", label: "오류 없음" }
    : validationResult?.status === "warning"
    ? { icon: "⚠", color: "#d97706", label: "경고 있음" }
    : validationResult?.status === "error"
    ? { icon: "✖", color: "#dc2626", label: "오류 있음" }
    : { icon: "–", color: "var(--lib-dust)", label: "–" };

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        top: 60,
        bottom: 0,
        zIndex: 40,
        display: "flex",
        flexDirection: "column",
        background: "var(--lib-bg)",
        fontFamily: "var(--font-sans), system-ui, sans-serif",
      }}
    >
      {/* ── Topbar ── */}
      <div
        style={{
          height: 48,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 14px",
          borderBottom: "1px solid var(--lib-border)",
          background: "var(--lib-bg-2)",
        }}
      >
        {/* Back */}
        <button
          type="button"
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 10px",
            borderRadius: 6,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 13,
            color: "var(--lib-dusk)",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--lib-bg-3)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          돌아가기
        </button>

        <span style={{ width: 1, height: 16, background: "var(--lib-border)" }} aria-hidden />

        {/* Filename badge */}
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 10px",
            borderRadius: 20,
            background: "var(--lib-bg-3)",
            fontSize: 12,
            color: "var(--lib-ink)",
            maxWidth: 260,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={filename}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--lib-wood)" strokeWidth="1.5" aria-hidden>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          {filename}
        </span>

        <div style={{ flex: 1 }} />

        {/* Re-convert */}
        <button
          type="button"
          onClick={onReconvert}
          disabled={reconverting}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid var(--lib-border)",
            background: "transparent",
            cursor: reconverting ? "wait" : "pointer",
            fontSize: 12,
            color: "var(--lib-dusk)",
            opacity: reconverting ? 0.6 : 1,
          }}
          title="메타데이터 설정을 적용해 EPUB 재생성"
        >
          <svg
            width="13"
            height="13"
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
          {reconverting ? "재변환 중…" : "재변환"}
        </button>

        {/* Download */}
        <button
          type="button"
          onClick={handleDownload}
          data-testid="editor-download-btn"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
            background: "var(--lib-wood-dim)",
            color: "#F8F5F0",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          EPUB 다운로드
        </button>
      </div>

      {/* ── Main body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── Left sidebar ── */}
        <aside
          style={{
            width: 220,
            flexShrink: 0,
            borderRight: "1px solid var(--lib-border)",
            background: "var(--lib-bg-2)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* File info */}
          <div style={{ padding: "16px 16px 12px" }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--lib-dust)", marginBottom: 6 }}>
              파일
            </p>
            <p style={{ fontSize: 12, color: "var(--lib-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={filename}>
              {filename}
            </p>
          </div>

          <div style={{ height: 1, background: "var(--lib-border)", margin: "0 12px" }} />

          {/* Validation */}
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--lib-dust)", marginBottom: 6 }}>
              EPUB 검사
            </p>
            <p style={{ fontSize: 12, color: vs.color, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontFamily: "monospace", fontSize: 13 }}>{vs.icon}</span>
              {vs.label}
            </p>
            {validationResult?.status !== "ok" && validationResult?.metadataErrors && validationResult.metadataErrors.length > 0 && (
              <ul style={{ marginTop: 6, paddingLeft: 14, fontSize: 10, color: "var(--lib-dust)", lineHeight: 1.55 }}>
                {validationResult.metadataErrors.slice(0, 3).map((e, i) => (
                  <li key={i} style={{ listStyleType: "disc", wordBreak: "break-word" }}>{e.message}</li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ height: 1, background: "var(--lib-border)", margin: "0 12px" }} />

          {/* TOC tree */}
          <div style={{ padding: "12px 0 16px", flex: 1 }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--lib-dust)", marginBottom: 8, padding: "0 16px" }}>
              목차
            </p>
            <SidebarTocTree
              epubBlob={epubBlob}
              onChapterClick={() => setActiveTab("toc")}
            />
          </div>
        </aside>

        {/* ── Right content area ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Tab bar */}
          <div
            style={{
              flexShrink: 0,
              display: "flex",
              borderBottom: "1px solid var(--lib-border)",
              background: "var(--lib-bg-2)",
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "10px 22px",
                  fontSize: 13,
                  fontWeight: activeTab === tab.id ? 500 : 400,
                  color: activeTab === tab.id ? "var(--lib-ink)" : "var(--lib-dust)",
                  background: "transparent",
                  border: "none",
                  borderBottom: activeTab === tab.id ? "2px solid var(--lib-wood-dim)" : "2px solid transparent",
                  marginBottom: -1,
                  cursor: "pointer",
                  transition: "color 0.12s, border-color 0.12s",
                  fontFamily: "var(--font-sans), system-ui, sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {activeTab === "meta" && (
              <MetaTab
                conversionOptions={conversionOptions}
                onOptionsChange={onOptionsChange}
                onReconvert={onReconvert}
                reconverting={reconverting}
              />
            )}
            {activeTab === "toc" && (
              <div style={{ padding: 20 }}>
                <TocEditor
                  epubBlob={epubBlob}
                  filename={filename}
                  onClose={() => setActiveTab("meta")}
                />
              </div>
            )}
            {activeTab === "body" && (
              <BodyTab epubBlob={epubBlob} />
            )}
            {activeTab === "preview" && (
              <div style={{ padding: 20 }}>
                <EpubPreview file={epubBlob} />
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
