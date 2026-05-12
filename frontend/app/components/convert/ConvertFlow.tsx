"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import JSZip from "jszip";
import EditorLayout from "@/app/components/editor/EditorLayout";
import { EPUB_STYLES } from "@/app/lib/epubStyles";
import {
  DEFAULT_OPTIONS,
  type ConversionOptions,
  type StylePreset,
} from "@/app/components/ConversionSettings";
import type { EpubValidationResult } from "@/app/lib/validateEpub";

// ── Constants ──────────────────────────────────────────────────────────────

const ACCEPTED_TYPES: Record<string, string> = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "text/plain": ".txt",
};
const ACCEPTED_EXTENSIONS = [".docx", ".txt"];
const ACCEPTED_STRING = ".docx, .txt";
const MAX_TEXT_CHARS = 30_000;
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_COVER_SIZE_BYTES = 10 * 1024 * 1024;
const COVER_ACCEPT = "image/jpeg,image/png";
const SETTINGS_KEY = "epubmaker_settings_v2";
const RECENT_KEY = "epubmaker_recent_v1";

const STYLE_PRESETS: Array<{ value: StylePreset; label: string; desc: string }> = [
  { value: "default",  label: "기본",  desc: "깔끔한 기본 스타일" },
  { value: "book",     label: "도서",  desc: "출판 도서 느낌" },
  { value: "novel",    label: "소설",  desc: "소설 전용 여백" },
  { value: "academic", label: "학술",  desc: "논문·레포트" },
];

// ── Types & Helpers ────────────────────────────────────────────────────────

interface RecentProject { filename: string; title?: string; date: string; }
type BatchResult = { filename: string; blob: Blob };

function loadSettings(): ConversionOptions {
  if (typeof window === "undefined") return DEFAULT_OPTIONS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_OPTIONS, ...(JSON.parse(raw) as Partial<ConversionOptions>) };
  } catch {}
  return DEFAULT_OPTIONS;
}

function saveSettings(opts: ConversionOptions): void {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(opts)); } catch {}
}

function loadRecent(): RecentProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as RecentProject[]) : [];
  } catch { return []; }
}

function pushRecent(filename: string, title?: string): void {
  const list = loadRecent().filter((r) => r.filename !== filename);
  const updated = [{ filename, title, date: new Date().toISOString() }, ...list].slice(0, 6);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(updated)); } catch {}
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i).toLowerCase();
}

function isValidFile(file: File): boolean {
  return ACCEPTED_EXTENSIONS.includes(getExtension(file.name)) || file.type in ACCEPTED_TYPES;
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function ConvertFlow() {
  const t = useTranslations("FileUpload");

  // Core state
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [previewFile, setPreviewFile] = useState<Blob | null>(null);
  const [previewFilename, setPreviewFilename] = useState<string>("document.epub");
  const [validationResult, setValidationResult] = useState<EpubValidationResult | null>(null);
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentProject[]>([]);
  const [conversionOptions, setConversionOptions] = useState<ConversionOptions>(loadSettings);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // UI state
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saving" | "saved" | null>(null);
  const [showCustomCss, setShowCustomCss] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Auto-save settings
  useEffect(() => {
    setAutoSaveStatus("saving");
    let clearTimer: ReturnType<typeof setTimeout>;
    const timer = setTimeout(() => {
      saveSettings(conversionOptions);
      setAutoSaveStatus("saved");
      clearTimer = setTimeout(() => setAutoSaveStatus(null), 2000);
    }, 700);
    return () => { clearTimeout(timer); clearTimeout(clearTimer); };
  }, [conversionOptions]);

  useEffect(() => { setRecent(loadRecent()); }, []);

  // EPUB validation after conversion
  useEffect(() => {
    if (!previewFile) {
      setValidationResult(null);
      setValidationLoading(false);
      setValidationError(null);
      return;
    }
    let cancelled = false;
    setValidationLoading(true);
    setValidationResult(null);
    setValidationError(null);
    const formData = new FormData();
    formData.append("epub", previewFile);
    fetch("/api/validate-epub", { method: "POST", body: formData })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(data.error || `Validation failed (${res.status})`);
        }
        return res.json() as Promise<EpubValidationResult>;
      })
      .then((result) => { if (!cancelled) { setValidationResult(result); setValidationLoading(false); } })
      .catch((err: unknown) => {
        if (!cancelled) {
          setValidationError(err instanceof Error ? err.message : "Validation failed");
          setValidationLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [previewFile]);

  // File handling
  const handleFiles = useCallback((fileList: FileList | null) => {
    setError(null);
    setConvertError(null);
    setBatchResults([]);
    if (!fileList?.length) return;

    if (fileList.length > 1) {
      const list: File[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i];
        if (!isValidFile(f)) { setError(t("errorFileType", { name: f.name })); setFiles([]); setFile(null); return; }
        if (f.size > MAX_FILE_SIZE_BYTES) { setError(t("errorFileSize")); setFiles([]); setFile(null); return; }
        list.push(f);
      }
      setFiles(list);
      setFile(null);
      return;
    }

    const f = fileList[0];
    if (!isValidFile(f)) { setError(t("errorFileType", { name: f.name })); setFile(null); setFiles([]); return; }
    if (f.size > MAX_FILE_SIZE_BYTES) { setError(t("errorFileSize")); setFile(null); setFiles([]); return; }
    const ext = getExtension(f.name);
    if (ext === ".txt") {
      const reader = new FileReader();
      reader.onload = () => {
        const text = (reader.result as string) ?? "";
        if (text.length > MAX_TEXT_CHARS) {
          setError(t("errorTextLength", { max: MAX_TEXT_CHARS.toLocaleString(), current: text.length.toLocaleString() }));
          setFile(null); setFiles([]); return;
        }
        setFile(f); setFiles([]);
      };
      reader.readAsText(f, "UTF-8");
      return;
    }
    setFile(f); setFiles([]);
  }, [t]);

  const onDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }, [handleFiles]);
  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { handleFiles(e.target.files); e.target.value = ""; }, [handleFiles]);

  const clearFile = useCallback(() => {
    setPreviewFile(null); setPreviewFilename("document.epub");
    setValidationResult(null); setValidationLoading(false); setValidationError(null);
    setFile(null); setFiles([]); setBatchResults([]); setBatchProgress(null);
    setError(null); setConvertError(null); setCoverFile(null);
  }, []);

  const removeBatchFile = useCallback((index: number) => { setFiles((prev) => prev.filter((_, i) => i !== index)); }, []);

  const convertOneFile = useCallback(async (f: File): Promise<BatchResult> => {
    const formData = new FormData();
    formData.append("file", f);
    formData.append("options", JSON.stringify(conversionOptions));
    const res = await fetch("/api/convert", { method: "POST", body: formData });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error || `Conversion failed (${res.status})`);
    }
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition");
    const match = disposition?.match(/filename="?([^";\n]+)"?/);
    const filename = match ? match[1].trim() : "document.epub";
    return { filename, blob };
  }, [conversionOptions]);

  const convertAll = useCallback(async () => {
    if (files.length === 0) return;
    setConvertError(null); setBatchResults([]); setConverting(true);
    setBatchProgress({ current: 0, total: files.length });
    const results: BatchResult[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        setBatchProgress({ current: i + 1, total: files.length });
        const result = await convertOneFile(files[i]);
        results.push(result);
        pushRecent(files[i].name, conversionOptions.title);
      }
      setBatchResults(results);
      setRecent(loadRecent());
    } catch (e) {
      setConvertError(e instanceof Error ? e.message : t("errorConversionFailed"));
    } finally {
      setConverting(false); setBatchProgress(null);
    }
  }, [files, convertOneFile, t, conversionOptions.title]);

  const downloadZip = useCallback(async () => {
    if (batchResults.length === 0) return;
    const zip = new JSZip();
    for (const { filename, blob } of batchResults) zip.file(filename, blob);
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url; a.download = "epubs.zip"; a.click();
    URL.revokeObjectURL(url);
  }, [batchResults]);

  const convertToEpub = useCallback(async () => {
    if (!file) return;
    setConvertError(null); setConverting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("options", JSON.stringify(conversionOptions));
      if (coverFile) formData.append("cover", coverFile);
      const res = await fetch("/api/convert", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || `Conversion failed (${res.status})`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?([^";\n]+)"?/);
      const filename = match ? match[1].trim() : "document.epub";
      setPreviewFile(blob); setPreviewFilename(filename);
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl; a.download = filename; a.click();
      URL.revokeObjectURL(downloadUrl);
      pushRecent(file.name, conversionOptions.title);
      setRecent(loadRecent());
    } catch (e) {
      setConvertError(e instanceof Error ? e.message : t("errorConversionFailed"));
    } finally { setConverting(false); }
  }, [file, conversionOptions, coverFile, t]);

  const setOpt = <K extends keyof ConversionOptions>(key: K, value: ConversionOptions[K]) => {
    setConversionOptions((prev) => ({ ...prev, [key]: value }));
  };

  function handleStyleChange(newStyle: StylePreset) {
    if (newStyle === "custom") {
      const basePreset = conversionOptions.style !== "custom" ? conversionOptions.style : "default";
      const baseCss = EPUB_STYLES[basePreset] ?? EPUB_STYLES.default ?? "";
      setConversionOptions({ ...conversionOptions, style: "custom", customCss: conversionOptions.customCss || baseCss });
      setShowCustomCss(true);
    } else {
      setConversionOptions({ ...conversionOptions, style: newStyle });
    }
  }

  const isBatch = files.length > 1;
  const hasFile = !!file || isBatch;

  // ── Shared style tokens ──────────────────────────────────────────────────

  const inputSt: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 8,
    border: "1px solid var(--lib-border)",
    background: "var(--lib-bg)",
    fontFamily: "var(--font-sans), system-ui, sans-serif",
    fontSize: 13,
    color: "var(--lib-ink)",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s ease",
  };

  const labelSt: React.CSSProperties = {
    display: "block",
    marginBottom: 5,
    fontSize: 10,
    fontWeight: 700,
    color: "var(--lib-dust)",
    fontFamily: "var(--font-sans), system-ui, sans-serif",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  };

  // ── After conversion: full-screen editor ────────────────────────────────

  if (previewFile) {
    return (
      <EditorLayout
        epubBlob={previewFile}
        filename={previewFilename}
        conversionOptions={conversionOptions}
        onOptionsChange={setConversionOptions}
        validationResult={validationResult}
        validationLoading={validationLoading}
        validationError={validationError}
        onBack={clearFile}
        onReconvert={convertToEpub}
        reconverting={converting}
      />
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 60px)" }}>

      {/* ── Sticky action bar ── */}
      <div
        style={{
          position: "sticky",
          top: 60,
          zIndex: 20,
          background: "var(--lib-bg-2)",
          borderBottom: "1px solid var(--lib-border)",
          height: 44,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 10,
        }}
      >
        {/* Step breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
          <StepDot done={hasFile} active={!hasFile} label="업로드" />
          <StepLine active={hasFile} />
          <StepDot done={false} active={hasFile} label="설정" />
          <StepLine active={false} />
          <StepDot done={false} active={false} label="변환" />
        </div>

        {/* Auto-save indicator */}
        {autoSaveStatus && (
          <span
            style={{
              fontSize: 11,
              color: autoSaveStatus === "saved" ? "#16a34a" : "var(--lib-dust)",
              display: "flex", alignItems: "center", gap: 4,
              animation: "cf-fadeIn 0.3s ease",
              fontFamily: "var(--font-sans), system-ui, sans-serif",
            }}
          >
            {autoSaveStatus === "saving" ? (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "cf-spin 1s linear infinite" }} aria-hidden>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                저장 중
              </>
            ) : (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                저장됨
              </>
            )}
          </span>
        )}

        {/* Action buttons (when file selected) */}
        {hasFile && (
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              onClick={clearFile}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 11px", borderRadius: 6,
                border: "1px solid var(--lib-border)",
                background: "transparent", cursor: "pointer",
                fontSize: 12, color: "var(--lib-dusk)",
                fontFamily: "var(--font-sans), system-ui, sans-serif",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--lib-border-2)"; e.currentTarget.style.color = "var(--lib-ink)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--lib-border)"; e.currentTarget.style.color = "var(--lib-dusk)"; }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
              새 문서
            </button>

            <button
              type="button"
              onClick={() => setRightPanelOpen((v) => !v)}
              className="cf-panel-toggle"
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 11px", borderRadius: 6,
                border: rightPanelOpen ? "1px solid var(--lib-wood)" : "1px solid var(--lib-border)",
                background: rightPanelOpen ? "var(--lib-bg-3)" : "transparent",
                cursor: "pointer", fontSize: 12,
                color: rightPanelOpen ? "var(--lib-wood)" : "var(--lib-dusk)",
                fontFamily: "var(--font-sans), system-ui, sans-serif",
                transition: "all 0.15s ease",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              고급 설정
            </button>
          </div>
        )}
      </div>

      {/* ── Main layout ── */}
      <div style={{ flex: 1, display: "flex", position: "relative" }}>

        {/* ── Center content column ── */}
        <div
          style={{
            flex: 1,
            maxWidth: 680,
            margin: "0 auto",
            padding: hasFile ? "36px 28px 100px" : "64px 28px 100px",
            width: "100%",
            transition: "padding 0.2s ease",
          }}
        >
          {/* Error alerts */}
          {(error || convertError) && (
            <div
              data-testid={error ? "upload-error" : "convert-error"}
              role="alert"
              style={{
                marginBottom: 20,
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid rgba(220,80,80,0.25)",
                background: "rgba(254,226,226,0.6)",
                fontSize: 13, color: "#b91c1c", lineHeight: 1.5,
                display: "flex", alignItems: "flex-start", gap: 10,
                fontFamily: "var(--font-sans), system-ui, sans-serif",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error || convertError}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              STATE A: No file — Upload zone
          ════════════════════════════════════════════════════════ */}
          {!hasFile && !previewFile && (
            <div style={{ animation: "cf-fadeIn 0.35s ease" }}>

              {/* Hero header */}
              <div style={{ textAlign: "center", marginBottom: 40 }}>
                <h1 style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: 30,
                  fontWeight: 500,
                  color: "var(--lib-ink)",
                  marginBottom: 10,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.25,
                }}>
                  전자책을 만들어 보세요
                </h1>
                <p style={{
                  fontSize: 15,
                  color: "var(--lib-dusk)",
                  fontFamily: "var(--font-sans), system-ui, sans-serif",
                  lineHeight: 1.6,
                }}>
                  블로그 글 쓰듯 자연스럽게, 나만의 EPUB 전자책을 완성하세요
                </p>
              </div>

              {/* Drop zone */}
              <label style={{ display: "block", cursor: "pointer" }}>
                <span className="sr-only">{t("chooseFile")}</span>
                <div
                  data-testid="upload-zone"
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  style={{
                    position: "relative",
                    display: "flex",
                    minHeight: 340,
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 20,
                    border: isDragging
                      ? "2.5px solid var(--lib-wood)"
                      : "2px dashed var(--lib-border-2)",
                    background: isDragging
                      ? "var(--lib-bg-3)"
                      : "var(--lib-bg-2)",
                    padding: "52px 40px",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                    textAlign: "center",
                    boxShadow: isDragging
                      ? "0 0 0 5px rgba(139,90,43,0.08), 0 8px 32px rgba(0,0,0,0.06)"
                      : "0 2px 12px rgba(0,0,0,0.04)",
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_STRING}
                    multiple
                    onChange={onInputChange}
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                    aria-label={t("ariaUpload")}
                  />

                  {/* Upload icon */}
                  <div
                    style={{
                      width: 80, height: 80,
                      borderRadius: 22,
                      background: isDragging ? "var(--lib-wood-dim)" : "var(--lib-bg-3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginBottom: 24,
                      transition: "all 0.25s ease",
                      boxShadow: isDragging
                        ? "0 8px 24px rgba(139,90,43,0.3)"
                        : "0 2px 10px rgba(0,0,0,0.06)",
                    }}
                  >
                    {isDragging ? (
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#F8F5F0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                      </svg>
                    ) : (
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--lib-wood)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    )}
                  </div>

                  <p style={{
                    fontSize: 19,
                    fontWeight: 500,
                    fontFamily: "var(--font-serif), Georgia, serif",
                    color: isDragging ? "var(--lib-wood)" : "var(--lib-ink)",
                    marginBottom: 8,
                    transition: "color 0.2s ease",
                  }}>
                    {isDragging ? "여기에 파일을 놓으세요" : "파일을 드래그하거나 클릭하세요"}
                  </p>
                  <p style={{
                    fontSize: 13,
                    color: "var(--lib-dust)",
                    marginBottom: 32,
                    fontFamily: "var(--font-sans), system-ui, sans-serif",
                    lineHeight: 1.6,
                  }}>
                    Word 문서 또는 텍스트 파일로 시작하세요<br />
                    최대 50MB · 여러 파일 동시 업로드 가능
                  </p>

                  {/* Format badges */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                    {[
                      { ext: "DOCX", color: "#2563eb", bg: "rgba(37,99,235,0.08)", label: "Word 문서" },
                      { ext: "TXT",  color: "#16a34a", bg: "rgba(22,163,74,0.08)",  label: "텍스트 파일" },
                    ].map(({ ext, color, bg, label }) => (
                      <div
                        key={ext}
                        style={{
                          display: "flex", alignItems: "center", gap: 7,
                          padding: "6px 14px",
                          borderRadius: 24,
                          background: "var(--lib-bg)",
                          border: "1px solid var(--lib-border)",
                          fontSize: 12,
                          fontFamily: "var(--font-sans), system-ui, sans-serif",
                        }}
                      >
                        <span style={{
                          fontSize: 10, fontWeight: 800,
                          padding: "1px 5px", borderRadius: 4,
                          background: bg, color,
                          letterSpacing: "0.04em",
                        }}>
                          {ext}
                        </span>
                        <span style={{ color: "var(--lib-dusk)" }}>{label}</span>
                      </div>
                    ))}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "6px 14px",
                      borderRadius: 24,
                      background: "var(--lib-bg)",
                      border: "1px solid var(--lib-border)",
                      fontSize: 12,
                      fontFamily: "var(--font-sans), system-ui, sans-serif",
                    }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--lib-wood)" strokeWidth="2" aria-hidden>
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                      <span style={{ color: "var(--lib-dusk)" }}>배치 변환 지원</span>
                    </div>
                  </div>
                </div>
              </label>

              {/* How it works */}
              <div style={{ marginTop: 40, display: "flex", gap: 0 }}>
                {[
                  { step: "01", title: "파일 업로드", desc: "DOCX 또는 TXT 파일을 드래그하거나 클릭해서 선택하세요" },
                  { step: "02", title: "제목·설정 입력", desc: "제목, 저자, 스타일을 설정하면 자동으로 최적화됩니다" },
                  { step: "03", title: "EPUB 다운로드", desc: "버튼 하나로 완성된 전자책이 바로 다운로드됩니다" },
                ].map(({ step, title, desc }, i) => (
                  <div
                    key={step}
                    style={{
                      flex: 1,
                      padding: "20px 16px",
                      borderLeft: i > 0 ? "1px solid var(--lib-border)" : "none",
                      textAlign: "center",
                    }}
                  >
                    <p style={{
                      fontSize: 11, fontWeight: 700,
                      color: "var(--lib-wood)",
                      letterSpacing: "0.15em",
                      marginBottom: 6,
                      fontFamily: "var(--font-sans), system-ui, sans-serif",
                    }}>
                      {step}
                    </p>
                    <p style={{
                      fontSize: 13, fontWeight: 600,
                      color: "var(--lib-ink)",
                      marginBottom: 4,
                      fontFamily: "var(--font-sans), system-ui, sans-serif",
                    }}>
                      {title}
                    </p>
                    <p style={{
                      fontSize: 11,
                      color: "var(--lib-dust)",
                      lineHeight: 1.65,
                      fontFamily: "var(--font-sans), system-ui, sans-serif",
                    }}>
                      {desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Recent projects */}
              {recent.length > 0 && (
                <div style={{ marginTop: 36 }}>
                  <p style={{
                    fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    color: "var(--lib-dust)", marginBottom: 10,
                    fontFamily: "var(--font-sans), system-ui, sans-serif",
                  }}>
                    {t("recentLabel")}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {recent.map((r) => (
                      <div
                        key={r.filename + r.date}
                        style={{
                          display: "flex", alignItems: "center",
                          justifyContent: "space-between",
                          padding: "9px 14px",
                          borderRadius: 8,
                          background: "var(--lib-bg-2)",
                          border: "1px solid transparent",
                          fontSize: 13, color: "var(--lib-dusk)",
                          fontFamily: "var(--font-sans), system-ui, sans-serif",
                          transition: "border-color 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--lib-dust)" strokeWidth="1.5" style={{ flexShrink: 0 }} aria-hidden>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {r.title || r.filename}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: "var(--lib-dust)", flexShrink: 0, marginLeft: 16 }}>
                          {new Date(r.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              STATE B: Single file — Configure + Convert
          ════════════════════════════════════════════════════════ */}
          {file && !isBatch && (
            <div style={{ animation: "cf-fadeIn 0.3s ease" }}>

              {/* File card */}
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 18px",
                  borderRadius: 14,
                  background: "var(--lib-bg-2)",
                  border: "1px solid var(--lib-border)",
                  marginBottom: 36,
                  boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                  background: getExtension(file.name) === ".docx"
                    ? "rgba(37,99,235,0.1)"
                    : "rgba(22,163,74,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                    stroke={getExtension(file.name) === ".docx" ? "#3b82f6" : "#22c55e"}
                    strokeWidth="1.5" aria-hidden>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="9" y1="13" x2="15" y2="13" />
                    <line x1="9" y1="17" x2="15" y2="17" />
                    <line x1="9" y1="9" x2="11" y2="9" />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 14, fontWeight: 600, color: "var(--lib-ink)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    fontFamily: "var(--font-sans), system-ui, sans-serif",
                  }}>
                    {file.name}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800, letterSpacing: "0.05em",
                      padding: "1px 6px", borderRadius: 4,
                      background: getExtension(file.name) === ".docx" ? "rgba(37,99,235,0.1)" : "rgba(22,163,74,0.1)",
                      color: getExtension(file.name) === ".docx" ? "#2563eb" : "#16a34a",
                    }}>
                      {getExtension(file.name).toUpperCase().replace(".", "")}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--lib-dust)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
                      {formatBytes(file.size)}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--lib-dust)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
                      · 업로드 완료
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  data-testid="remove-file-btn"
                  onClick={clearFile}
                  aria-label={t("removeFile")}
                  style={{
                    flexShrink: 0, width: 32, height: 32, borderRadius: 8,
                    border: "none", background: "var(--lib-bg-3)",
                    color: "var(--lib-dust)", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.08)"; e.currentTarget.style.color = "#ef4444"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--lib-bg-3)"; e.currentTarget.style.color = "var(--lib-dust)"; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* ── Blog-style title input ── */}
              <div style={{ marginBottom: 4 }}>
                <input
                  type="text"
                  data-testid="title-input"
                  value={conversionOptions.title}
                  onChange={(e) => setOpt("title", e.target.value)}
                  placeholder="제목을 입력하세요..."
                  style={{
                    width: "100%",
                    padding: "12px 0",
                    border: "none",
                    borderBottom: "2px solid var(--lib-border)",
                    background: "transparent",
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: 26,
                    fontWeight: 500,
                    color: "var(--lib-ink)",
                    outline: "none",
                    boxSizing: "border-box",
                    letterSpacing: "-0.01em",
                    transition: "border-color 0.2s ease",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderBottomColor = "var(--lib-wood-dim)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderBottomColor = "var(--lib-border)"; }}
                />
              </div>

              {/* ── Author input ── */}
              <div style={{ marginBottom: 36 }}>
                <input
                  type="text"
                  value={conversionOptions.author}
                  onChange={(e) => setOpt("author", e.target.value)}
                  placeholder="저자 이름..."
                  style={{
                    width: "100%",
                    padding: "10px 0",
                    border: "none",
                    borderBottom: "1px solid var(--lib-border)",
                    background: "transparent",
                    fontFamily: "var(--font-sans), system-ui, sans-serif",
                    fontSize: 15,
                    color: "var(--lib-dusk)",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s ease",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderBottomColor = "var(--lib-wood-dim)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderBottomColor = "var(--lib-border)"; }}
                />
              </div>

              {/* ── Style preset ── */}
              <div style={{ marginBottom: 28 }}>
                <p style={{ ...labelSt, marginBottom: 10 }}>스타일 프리셋</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {STYLE_PRESETS.map(({ value, label, desc }) => {
                    const isActive = conversionOptions.style === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleStyleChange(value)}
                        style={{
                          padding: "10px 8px",
                          borderRadius: 10,
                          border: "1.5px solid",
                          borderColor: isActive ? "var(--lib-wood-dim)" : "var(--lib-border)",
                          background: isActive ? "var(--lib-wood-dim)" : "var(--lib-bg-2)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          textAlign: "center",
                        }}
                        title={desc}
                      >
                        <p style={{
                          fontSize: 12, fontWeight: isActive ? 700 : 500,
                          color: isActive ? "#F8F5F0" : "var(--lib-ink)",
                          fontFamily: "var(--font-sans), system-ui, sans-serif",
                          marginBottom: 2,
                        }}>
                          {label}
                        </p>
                        <p style={{
                          fontSize: 10,
                          color: isActive ? "rgba(248,245,240,0.7)" : "var(--lib-dust)",
                          fontFamily: "var(--font-sans), system-ui, sans-serif",
                          lineHeight: 1.4,
                        }}>
                          {desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Cover upload ── */}
              <div style={{ marginBottom: 28 }}>
                <p style={{ ...labelSt, marginBottom: 10 }}>표지 이미지</p>
                {!coverFile ? (
                  <label style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "9px 16px",
                    borderRadius: 8,
                    border: "1.5px dashed var(--lib-border-2)",
                    cursor: "pointer", fontSize: 13,
                    color: "var(--lib-dusk)",
                    fontFamily: "var(--font-sans), system-ui, sans-serif",
                    background: "var(--lib-bg-2)",
                    transition: "all 0.15s ease",
                  }}>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept={COVER_ACCEPT}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          if (f.size > MAX_COVER_SIZE_BYTES) { setError(t("errorCoverSize")); return; }
                          setCoverFile(f);
                        }
                        e.target.value = "";
                      }}
                      style={{ display: "none" }}
                    />
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--lib-wood)" strokeWidth="1.5" aria-hidden>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    표지 이미지 추가 (JPEG · PNG · 최대 10MB)
                  </label>
                ) : (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 10,
                    padding: "9px 16px", borderRadius: 8,
                    border: "1px solid var(--lib-border)",
                    background: "var(--lib-bg-2)", fontSize: 13,
                    fontFamily: "var(--font-sans), system-ui, sans-serif",
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" aria-hidden>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span style={{ color: "var(--lib-ink)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {coverFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCoverFile(null)}
                      style={{ fontSize: 11, color: "var(--lib-dust)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}
                    >
                      제거
                    </button>
                  </div>
                )}
              </div>

              {/* ── Docx hint ── */}
              <div style={{
                display: "flex", gap: 10, alignItems: "flex-start",
                padding: "12px 14px", borderRadius: 10,
                background: "var(--lib-bg-2)",
                border: "1px solid var(--lib-border)",
                marginBottom: 32,
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--lib-wood)" strokeWidth="1.5" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p style={{ fontSize: 12, color: "var(--lib-dusk)", lineHeight: 1.65, fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
                  DOCX 파일에서 <strong style={{ color: "var(--lib-ink)" }}>제목 스타일(H1, H2)</strong>을 적용하면 챕터가 자동으로 구분됩니다.
                  고급 설정에서 목차 깊이와 EPUB 버전을 조정할 수 있습니다.
                </p>
              </div>

              {/* ── Convert button / Progress ── */}
              {converting ? (
                <div data-testid="converting-state">
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 12, padding: "20px 0", marginBottom: 12,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "var(--lib-bg-3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--lib-wood-dim)" strokeWidth="2" style={{ animation: "cf-spin 1s linear infinite" }} aria-hidden>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 500, color: "var(--lib-ink)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
                        {t("converting")}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--lib-dust)", marginTop: 2, fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
                        잠시만 기다려 주세요...
                      </p>
                    </div>
                  </div>
                  <div style={{ height: 5, background: "var(--lib-bg-3)", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 10,
                      background: "linear-gradient(90deg, var(--lib-wood), var(--lib-wood-dim))",
                      animation: "cf-progress 1.6s ease-in-out infinite",
                      width: "40%",
                    }} />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  data-testid="convert-btn"
                  onClick={convertToEpub}
                  style={{
                    width: "100%",
                    padding: "17px 24px",
                    fontSize: 16, fontWeight: 600,
                    borderRadius: 14, border: "none",
                    cursor: "pointer",
                    background: "var(--lib-wood-dim)",
                    color: "#F8F5F0",
                    fontFamily: "var(--font-sans), system-ui, sans-serif",
                    letterSpacing: "0.02em",
                    transition: "all 0.2s ease",
                    boxShadow: "0 4px 18px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.08)";
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  {t("convertButton")}
                </button>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              STATE C: Batch mode
          ════════════════════════════════════════════════════════ */}
          {isBatch && (
            <div style={{ animation: "cf-fadeIn 0.3s ease" }}>
              <div style={{
                borderRadius: 14,
                border: "1px solid var(--lib-border)",
                background: "var(--lib-bg-2)",
                overflow: "hidden",
                marginBottom: 20,
              }}>
                {/* Batch header */}
                <div style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--lib-border)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--lib-ink)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
                      {t("batchTitle")}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--lib-dust)", marginTop: 2, fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
                      {files.length}개 파일 · 한 번에 모두 변환합니다
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    style={{
                      fontSize: 12, color: "var(--lib-dust)",
                      background: "none", border: "none", cursor: "pointer",
                      textDecoration: "underline",
                      fontFamily: "var(--font-sans), system-ui, sans-serif",
                    }}
                  >
                    전체 취소
                  </button>
                </div>

                {/* File list */}
                <ul style={{ listStyle: "none", margin: 0, padding: "8px 0" }}>
                  {files.map((f, i) => (
                    <li
                      key={`${f.name}-${i}`}
                      style={{
                        display: "flex", alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 20px",
                        gap: 10,
                        transition: "background 0.1s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--lib-dust)" strokeWidth="1.5" style={{ flexShrink: 0 }} aria-hidden>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span style={{ fontSize: 13, color: "var(--lib-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
                          {f.name}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: "var(--lib-dust)", fontFamily: "monospace" }}>
                          {formatBytes(f.size)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeBatchFile(i)}
                          style={{ fontSize: 11, color: "var(--lib-dust)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "var(--font-sans), system-ui, sans-serif" }}
                        >
                          {t("removeFile")}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Batch progress / buttons */}
              {batchProgress ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--lib-dusk)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
                      {t("convertingBatch", { current: batchProgress.current, total: batchProgress.total })}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--lib-dust)", fontFamily: "monospace" }}>
                      {Math.round((batchProgress.current / batchProgress.total) * 100)}%
                    </span>
                  </div>
                  <div style={{ height: 6, background: "var(--lib-bg-3)", borderRadius: 10 }}>
                    <div style={{
                      height: "100%", borderRadius: 10,
                      background: "linear-gradient(90deg, var(--lib-wood), var(--lib-wood-dim))",
                      width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                      transition: "width 0.4s ease",
                    }} />
                  </div>
                </div>
              ) : batchResults.length > 0 ? (
                <div>
                  <p style={{ fontSize: 12, color: "#16a34a", marginBottom: 12, fontFamily: "var(--font-sans), system-ui, sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {batchResults.length}개 파일 변환 완료
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                    {batchResults.map((r) => (
                      <button
                        key={r.filename}
                        type="button"
                        onClick={() => {
                          const url = URL.createObjectURL(r.blob);
                          const a = document.createElement("a");
                          a.href = url; a.download = r.filename; a.click();
                          URL.revokeObjectURL(url);
                        }}
                        style={{
                          padding: "8px 14px", fontSize: 12,
                          borderRadius: 8,
                          border: "1px solid var(--lib-border)",
                          cursor: "pointer",
                          background: "var(--lib-bg-2)",
                          color: "var(--lib-ink)",
                          fontFamily: "var(--font-sans), system-ui, sans-serif",
                          display: "flex", alignItems: "center", gap: 6,
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        {r.filename}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    data-testid="download-zip-btn"
                    onClick={downloadZip}
                    style={{
                      padding: "12px 20px", fontSize: 14, fontWeight: 600,
                      borderRadius: 10, border: "none",
                      cursor: "pointer",
                      background: "var(--lib-wood-dim)",
                      color: "#F8F5F0",
                      fontFamily: "var(--font-sans), system-ui, sans-serif",
                      display: "flex", alignItems: "center", gap: 8,
                      boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    {t("downloadAllZip")}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  data-testid="convert-all-btn"
                  onClick={convertAll}
                  disabled={converting}
                  style={{
                    width: "100%", padding: "16px 24px",
                    fontSize: 15, fontWeight: 600,
                    borderRadius: 12, border: "none",
                    cursor: converting ? "wait" : "pointer",
                    background: "var(--lib-wood-dim)",
                    color: "#F8F5F0",
                    fontFamily: "var(--font-sans), system-ui, sans-serif",
                    opacity: converting ? 0.7 : 1,
                    boxShadow: "0 4px 18px rgba(0,0,0,0.14)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    transition: "all 0.2s ease",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  {t("convertAll")}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Right panel: Advanced settings ── */}
        {hasFile && !isBatch && rightPanelOpen && (
          <aside
            className="cf-right-panel"
            style={{
              width: 276,
              flexShrink: 0,
              borderLeft: "1px solid var(--lib-border)",
              background: "var(--lib-bg-2)",
              overflowY: "auto",
              position: "sticky",
              top: 104,
              height: "calc(100vh - 104px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 18 }}>
              <p style={{
                fontSize: 10, fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase",
                color: "var(--lib-dust)",
                fontFamily: "var(--font-sans), system-ui, sans-serif",
              }}>
                고급 설정
              </p>

              {/* EPUB version */}
              <div>
                <label style={labelSt}>EPUB 버전</label>
                <select
                  value={conversionOptions.epubVersion}
                  onChange={(e) => setOpt("epubVersion", e.target.value as "epub3" | "epub2")}
                  style={inputSt}
                >
                  <option value="epub3">EPUB 3 (권장)</option>
                  <option value="epub2">EPUB 2</option>
                </select>
              </div>

              {/* Language */}
              <div>
                <label style={labelSt}>언어</label>
                <select
                  value={conversionOptions.language}
                  onChange={(e) => setOpt("language", e.target.value as ConversionOptions["language"])}
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
                  onChange={(e) => setOpt("publisher", e.target.value)}
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
                  onChange={(e) => setOpt("date", e.target.value)}
                  placeholder="예: 2024-01-15"
                  style={inputSt}
                />
              </div>

              <div style={{ height: 1, background: "var(--lib-border)" }} />

              {/* TOC */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 10 }}>
                  <input
                    type="checkbox"
                    checked={conversionOptions.toc}
                    onChange={(e) => setOpt("toc", e.target.checked)}
                    style={{ width: 15, height: 15, accentColor: "var(--lib-wood-dim)", flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 13, color: "var(--lib-ink)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
                    목차(TOC) 포함
                  </span>
                </label>
                {conversionOptions.toc && (
                  <div style={{ paddingLeft: 22 }}>
                    <label style={labelSt}>목차 깊이</label>
                    <select
                      value={conversionOptions.tocDepth}
                      onChange={(e) => setOpt("tocDepth", Number(e.target.value) as 1 | 2 | 3)}
                      style={{ ...inputSt, width: "auto", minWidth: 120 }}
                    >
                      <option value={1}>H1만</option>
                      <option value={2}>H1 + H2</option>
                      <option value={3}>H1 + H2 + H3</option>
                    </select>
                  </div>
                )}
              </div>

              <div style={{ height: 1, background: "var(--lib-border)" }} />

              {/* Custom CSS */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <label style={{ ...labelSt, marginBottom: 0 }}>커스텀 CSS</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (conversionOptions.style !== "custom") handleStyleChange("custom");
                      setShowCustomCss((v) => !v);
                    }}
                    style={{
                      fontSize: 11, color: "var(--lib-wood)",
                      background: "none", border: "none", cursor: "pointer",
                      textDecoration: "underline",
                      fontFamily: "var(--font-sans), system-ui, sans-serif",
                    }}
                  >
                    {showCustomCss ? "접기" : "편집"}
                  </button>
                </div>

                {showCustomCss && (
                  <div style={{ animation: "cf-fadeIn 0.2s ease" }}>
                    <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
                      {(["default", "book", "novel", "academic"] as const).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setOpt("customCss", EPUB_STYLES[preset] ?? "")}
                          style={{
                            padding: "2px 8px", fontSize: 10, fontWeight: 500,
                            color: "var(--lib-wood-dim)",
                            background: "var(--lib-bg)",
                            border: "1px solid var(--lib-border)", borderRadius: 5,
                            cursor: "pointer",
                            fontFamily: "var(--font-sans), system-ui, sans-serif",
                          }}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={conversionOptions.customCss}
                      onChange={(e) => setOpt("customCss", e.target.value)}
                      placeholder="/* CSS를 입력하세요 */"
                      rows={12}
                      spellCheck={false}
                      style={{
                        ...inputSt,
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: 11,
                        resize: "vertical",
                        lineHeight: 1.55,
                      }}
                    />
                    <p style={{ fontSize: 10, color: "var(--lib-dust)", marginTop: 5, fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
                      EPUB 내부에 직접 적용되는 CSS입니다
                    </p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Mobile: Advanced settings collapsible (shown when panel is toggled on mobile) */}
      {hasFile && !isBatch && (
        <div className="cf-mobile-advanced" style={{ display: "none" }}>
          {/* Rendered via CSS below for mobile */}
        </div>
      )}

      {/* ── Animations & responsive ── */}
      <style>{`
        @keyframes cf-progress {
          0%   { transform: translateX(-100%) scaleX(0.5); }
          50%  { transform: translateX(100%) scaleX(1.2); }
          100% { transform: translateX(250%) scaleX(0.5); }
        }
        @keyframes cf-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes cf-fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 900px) {
          .cf-right-panel { display: none !important; }
          .cf-panel-toggle { display: none !important; }
        }
        input[type="text"]::placeholder,
        input[type="text"]::-webkit-input-placeholder {
          color: var(--lib-border-2);
        }
      `}</style>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StepDot({ done, active, label }: { done: boolean; active: boolean; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        background: done ? "var(--lib-wood-dim)" : "transparent",
        border: done ? "none" : `2px solid ${active ? "var(--lib-wood-dim)" : "var(--lib-border)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.3s ease",
      }}>
        {done ? (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#F8F5F0" strokeWidth="3" aria-hidden>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: active ? "var(--lib-wood-dim)" : "var(--lib-border)",
            transition: "all 0.3s ease",
          }} />
        )}
      </div>
      <span style={{
        fontSize: 10, fontWeight: active || done ? 600 : 400,
        color: active || done ? "var(--lib-wood)" : "var(--lib-dust)",
        fontFamily: "var(--font-sans), system-ui, sans-serif",
        transition: "all 0.3s ease",
        whiteSpace: "nowrap",
      }}>
        {label}
      </span>
    </div>
  );
}

function StepLine({ active }: { active: boolean }) {
  return (
    <div style={{
      flex: 1,
      maxWidth: 48,
      height: 2,
      background: active ? "var(--lib-wood-dim)" : "var(--lib-border)",
      borderRadius: 2,
      marginBottom: 16,
      transition: "background 0.3s ease",
    }} />
  );
}
