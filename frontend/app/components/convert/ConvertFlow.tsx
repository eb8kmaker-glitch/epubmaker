"use client";
/**
 * ConvertFlow — Entry point for the EPUB editor.
 *
 * Two entry paths:
 *  A) Upload a file → convert via API → parse EPUB → BookEditor
 *  B) "Start blank" → empty BookModel → BookEditor
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import BookEditor from "@/app/components/editor/BookEditor";
import { emptyBook, type BookModel } from "@/app/lib/bookModel";
import { epubBlobToBook } from "@/app/lib/epubToBook";
import { DEFAULT_OPTIONS, type ConversionOptions } from "@/app/components/ConversionSettings";

// ── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_EXTENSIONS = [".docx", ".txt"];
const ACCEPTED_TYPES: Record<string, string> = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "text/plain": ".txt",
};
const ACCEPTED_STRING = ".docx, .txt";
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_TEXT_CHARS = 30_000;
const SETTINGS_KEY = "epubmaker_settings_v2";

interface RecentProject { filename: string; title?: string; date: string; }

function loadSettings(): ConversionOptions {
  if (typeof window === "undefined") return DEFAULT_OPTIONS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_OPTIONS, ...(JSON.parse(raw) as Partial<ConversionOptions>) };
  } catch {}
  return DEFAULT_OPTIONS;
}
function saveSettings(opts: ConversionOptions) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(opts)); } catch {}
}
function loadRecent(): RecentProject[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("epubmaker_recent_v1") ?? "[]"); } catch { return []; }
}
function pushRecent(filename: string, title?: string) {
  const list = loadRecent().filter((r) => r.filename !== filename);
  try { localStorage.setItem("epubmaker_recent_v1", JSON.stringify([{ filename, title, date: new Date().toISOString() }, ...list].slice(0, 6))); } catch {}
}
function getExtension(name: string) { const i = name.lastIndexOf("."); return i === -1 ? "" : name.slice(i).toLowerCase(); }
function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const k = 1024, s = ["B","KB","MB","GB"], i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${s[i]}`;
}
function isValidFile(f: File) { return ACCEPTED_EXTENSIONS.includes(getExtension(f.name)) || f.type in ACCEPTED_TYPES; }

// ── Main Component ────────────────────────────────────────────────────────────

type Phase = "landing" | "parsing" | "editing";

export default function ConvertFlow() {
  const t = useTranslations("FileUpload");

  const [phase, setPhase] = useState<Phase>("landing");
  const [book, setBook] = useState<BookModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parseProgress, setParseProgress] = useState<string>("파일 분석 중…");
  const [recent, setRecent] = useState<RecentProject[]>([]);

  // Keep original file + options for reconvert
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [conversionOptions, setConversionOptions] = useState<ConversionOptions>(loadSettings);
  const [reconverting, setReconverting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setRecent(loadRecent()); }, []);
  useEffect(() => { saveSettings(conversionOptions); }, [conversionOptions]);

  // ── File processing ──────────────────────────────────────────────────────

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setPhase("parsing");
    setSourceFile(file);

    try {
      // Validate
      if (!isValidFile(file)) throw new Error(t("errorFileType", { name: file.name }));
      if (file.size > MAX_FILE_SIZE_BYTES) throw new Error(t("errorFileSize"));

      // TXT length check
      if (getExtension(file.name) === ".txt") {
        setParseProgress("텍스트 파일 읽는 중…");
        const text = await file.text();
        if (text.length > MAX_TEXT_CHARS)
          throw new Error(t("errorTextLength", { max: MAX_TEXT_CHARS.toLocaleString(), current: text.length.toLocaleString() }));
      }

      // Convert via API
      setParseProgress("서버에서 변환 중…");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("options", JSON.stringify(conversionOptions));

      const res = await fetch("/api/convert", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error || `변환 실패 (${res.status})`);
      }

      const epubBlob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const fnMatch = disposition?.match(/filename="?([^";\n]+)"?/);
      const filename = fnMatch?.[1]?.trim() ?? "document.epub";

      // Parse EPUB → BookModel
      setParseProgress("챕터 구조 분석 중…");
      const parsed = await epubBlobToBook(epubBlob, {
        title: conversionOptions.title || file.name.replace(/\.[^.]+$/, ""),
        author: conversionOptions.author,
        language: conversionOptions.language,
        publisher: conversionOptions.publisher,
        date: conversionOptions.date,
        epubVersion: conversionOptions.epubVersion,
        toc: conversionOptions.toc,
        tocDepth: conversionOptions.tocDepth as 1 | 2 | 3,
        style: conversionOptions.style as BookModel["meta"]["style"],
        customCss: conversionOptions.customCss,
      });

      pushRecent(file.name, parsed.meta.title || conversionOptions.title);
      setRecent(loadRecent());
      setBook(parsed);
      setPhase("editing");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorConversionFailed"));
      setPhase("landing");
    }
  }, [conversionOptions, t]);

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList?.length) return;
    processFile(fileList[0]);
  }, [processFile]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files); e.target.value = "";
  }, [handleFiles]);

  // Reconvert from original source
  const handleReconvert = useCallback(async () => {
    if (!sourceFile || !book) return;
    setReconverting(true);
    try {
      const formData = new FormData();
      formData.append("file", sourceFile);
      const updatedOpts: ConversionOptions = {
        ...conversionOptions,
        title: book.meta.title,
        author: book.meta.author,
        language: book.meta.language,
        publisher: book.meta.publisher,
        date: book.meta.date,
        epubVersion: book.meta.epubVersion,
        toc: book.meta.toc,
        tocDepth: book.meta.tocDepth,
      };
      formData.append("options", JSON.stringify(updatedOpts));
      const res = await fetch("/api/convert", { method: "POST", body: formData });
      if (!res.ok) throw new Error("재변환 실패");
      const blob = await res.blob();
      const parsed = await epubBlobToBook(blob, book.meta);
      setBook(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "재변환 중 오류가 발생했습니다");
    } finally {
      setReconverting(false);
    }
  }, [sourceFile, book, conversionOptions]);

  const startBlank = () => {
    setBook(emptyBook());
    setPhase("editing");
  };

  const goBack = () => {
    setBook(null);
    setSourceFile(null);
    setPhase("landing");
    setError(null);
  };

  // ── Phase: Editing ────────────────────────────────────────────────────────

  if (phase === "editing" && book) {
    return (
      <BookEditor
        book={book}
        onBookChange={setBook}
        onBack={goBack}
        onReconvert={sourceFile ? handleReconvert : undefined}
        reconverting={reconverting}
      />
    );
  }

  // ── Phase: Parsing (loading screen) ──────────────────────────────────────

  if (phase === "parsing") {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "calc(100vh - 104px)",
        flexDirection: "column", gap: 20,
        background: "var(--lib-panel)",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: "var(--lib-bg-2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--lib-wood-dim)" strokeWidth="1.8"
            style={{ animation: "cf2-spin 1.2s ease-in-out infinite" }} aria-hidden>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 16, fontWeight: 500, color: "var(--lib-ink)", marginBottom: 6, fontFamily: "var(--font-serif), Georgia, serif" }}>
            전자책으로 변환하는 중
          </p>
          <p style={{ fontSize: 13, color: "var(--lib-dust)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
            {parseProgress}
          </p>
        </div>
        <div style={{ width: 200, height: 4, background: "var(--lib-bg-3)", borderRadius: 10, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 10,
            background: "linear-gradient(90deg, var(--lib-wood), var(--lib-wood-dim))",
            animation: "cf2-progress 1.6s ease-in-out infinite", width: "40%",
          }} />
        </div>
        <style>{`
          @keyframes cf2-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes cf2-progress {
            0%   { transform: translateX(-100%) scaleX(0.5); }
            50%  { transform: translateX(100%) scaleX(1.2); }
            100% { transform: translateX(250%) scaleX(0.5); }
          }
        `}</style>
      </div>
    );
  }

  // ── Phase: Landing ────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: "calc(100vh - 60px)",
      display: "flex", flexDirection: "column",
      background: "var(--lib-panel)",
    }}>
      <div style={{ flex: 1, maxWidth: 680, margin: "0 auto", padding: "60px 28px 80px", width: "100%" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 14px", borderRadius: 20,
            background: "var(--lib-bg-3)",
            border: "1px solid var(--lib-border)",
            marginBottom: 16,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--lib-wood)" strokeWidth="2" aria-hidden>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--lib-wood)", letterSpacing: "0.05em", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
              전자책 에디터
            </span>
          </div>
          <h1 style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: 32, fontWeight: 500, color: "var(--lib-ink)",
            letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 12,
          }}>
            직접 편집하고<br />바로 EPUB으로
          </h1>
          <p style={{
            fontSize: 15, color: "var(--lib-dusk)", lineHeight: 1.65,
            fontFamily: "var(--font-sans), system-ui, sans-serif",
          }}>
            파일을 업로드하면 챕터로 분리해 드립니다.<br />
            텍스트 편집, 챕터 관리, 실시간 미리보기까지 — 브라우저에서 바로.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            data-testid="upload-error"
            role="alert"
            style={{
              marginBottom: 20, padding: "12px 16px", borderRadius: 10,
              border: "1px solid rgba(220,80,80,0.25)", background: "rgba(254,226,226,0.6)",
              fontSize: 13, color: "#b91c1c",
              display: "flex", alignItems: "flex-start", gap: 10,
              fontFamily: "var(--font-sans), system-ui, sans-serif",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Upload zone */}
        <label style={{ display: "block", cursor: "pointer" }}>
          <span className="sr-only">{t("chooseFile")}</span>
          <div
            data-testid="upload-zone"
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            style={{
              position: "relative", display: "flex",
              minHeight: 300,
              flexDirection: "column", alignItems: "center", justifyContent: "center",
              borderRadius: 20,
              border: isDragging ? "2.5px solid var(--lib-wood)" : "2px dashed var(--lib-border-2)",
              background: isDragging ? "var(--lib-bg-3)" : "var(--lib-bg-2)",
              padding: "48px 40px", textAlign: "center", cursor: "pointer",
              transition: "all 0.25s ease",
              boxShadow: isDragging ? "0 0 0 5px rgba(139,90,43,0.08)" : "0 2px 12px rgba(0,0,0,0.04)",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_STRING}
              onChange={onInputChange}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
              aria-label={t("ariaUpload")}
              data-testid="file-input"
            />

            <div style={{
              width: 80, height: 80, borderRadius: 22,
              background: isDragging ? "var(--lib-wood-dim)" : "var(--lib-bg-3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 22, transition: "all 0.25s ease",
              boxShadow: isDragging ? "0 8px 24px rgba(139,90,43,0.25)" : "0 2px 10px rgba(0,0,0,0.06)",
            }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
                stroke={isDragging ? "#F8F5F0" : "var(--lib-wood)"}
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <line x1="12" y1="10" x2="12" y2="16" />
                <line x1="9" y1="13" x2="15" y2="13" />
              </svg>
            </div>

            <p style={{
              fontSize: 19, fontWeight: 500,
              fontFamily: "var(--font-serif), Georgia, serif",
              color: isDragging ? "var(--lib-wood)" : "var(--lib-ink)",
              marginBottom: 8, transition: "color 0.2s ease",
            }}>
              {isDragging ? "여기에 놓으세요" : "파일을 드래그하거나 클릭하세요"}
            </p>
            <p style={{
              fontSize: 13, color: "var(--lib-dust)", marginBottom: 28,
              lineHeight: 1.6, fontFamily: "var(--font-sans), system-ui, sans-serif",
            }}>
              DOCX 또는 TXT → 챕터 분리 → 에디터에서 바로 편집
            </p>

            {/* Format badges */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              {[
                { ext: "DOCX", color: "#2563eb", bg: "rgba(37,99,235,0.08)", label: "Word 문서" },
                { ext: "TXT",  color: "#16a34a", bg: "rgba(22,163,74,0.08)",  label: "텍스트 파일" },
              ].map(({ ext, color, bg, label }) => (
                <div key={ext} style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "6px 14px", borderRadius: 24,
                  background: "var(--lib-bg)", border: "1px solid var(--lib-border)",
                  fontSize: 12, fontFamily: "var(--font-sans), system-ui, sans-serif",
                }}>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: "1px 5px", borderRadius: 4, background: bg, color, letterSpacing: "0.04em" }}>{ext}</span>
                  <span style={{ color: "var(--lib-dusk)" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </label>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--lib-border)" }} />
          <span style={{ fontSize: 11, color: "var(--lib-dust)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>또는</span>
          <div style={{ flex: 1, height: 1, background: "var(--lib-border)" }} />
        </div>

        {/* Start blank */}
        <button
          type="button"
          onClick={startBlank}
          style={{
            width: "100%", padding: "14px 20px",
            borderRadius: 12, border: "1px solid var(--lib-border)",
            background: "var(--lib-bg-2)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            fontSize: 14, fontWeight: 500, color: "var(--lib-dusk)",
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--lib-wood)"; e.currentTarget.style.color = "var(--lib-wood)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--lib-border)"; e.currentTarget.style.color = "var(--lib-dusk)"; }}
          data-testid="start-blank-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          빈 문서로 시작하기
        </button>

        {/* Feature highlights */}
        <div style={{ marginTop: 48, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { icon: "✏️", title: "블록 기반 편집", desc: "단락·소제목·인용·이미지 블록으로 자유롭게 구성" },
            { icon: "📚", title: "챕터 관리", desc: "드래그로 순서 변경, 분할·병합 지원" },
            { icon: "👁", title: "실시간 미리보기", desc: "Kindle 스타일 프레임으로 즉시 확인" },
            { icon: "⬇️", title: "EPUB 다운로드", desc: "브라우저에서 바로 생성, 서버 불필요" },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{
              padding: "16px 18px", borderRadius: 12,
              background: "var(--lib-bg-2)",
              border: "1px solid var(--lib-border)",
            }}>
              <p style={{ fontSize: 20, marginBottom: 6 }}>{icon}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--lib-ink)", marginBottom: 4, fontFamily: "var(--font-sans), system-ui, sans-serif" }}>{title}</p>
              <p style={{ fontSize: 11, color: "var(--lib-dust)", lineHeight: 1.55, fontFamily: "var(--font-sans), system-ui, sans-serif" }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Recent */}
        {recent.length > 0 && (
          <div style={{ marginTop: 36 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--lib-dust)", marginBottom: 10, fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
              {t("recentLabel")}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {recent.map((r) => (
                <div key={r.filename + r.date} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "9px 14px", borderRadius: 8, background: "var(--lib-bg-2)",
                  fontSize: 13, color: "var(--lib-dusk)",
                  fontFamily: "var(--font-sans), system-ui, sans-serif",
                }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.title || r.filename}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--lib-dust)", flexShrink: 0, marginLeft: 16 }}>
                    {new Date(r.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
