"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import JSZip from "jszip";
import EpubCompatibilityCheck from "@/app/components/EpubCompatibilityCheck";
import EpubPreview from "@/app/components/EpubPreview";
import TocEditor from "@/app/components/TocEditor";
import { EPUB_STYLES } from "@/app/lib/epubStyles";
import {
  DEFAULT_OPTIONS,
  type ConversionOptions,
  type StylePreset,
} from "@/app/components/ConversionSettings";
import type { EpubValidationResult } from "@/app/lib/validateEpub";

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

interface RecentProject {
  filename: string;
  title?: string;
  date: string;
}

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

const STYLE_PRESETS: Array<{ value: StylePreset; labelKey: "styleDefault" | "styleBook" | "styleNovel" | "styleAcademic" | "styleCustom" }> = [
  { value: "default", labelKey: "styleDefault" },
  { value: "book",    labelKey: "styleBook" },
  { value: "novel",   labelKey: "styleNovel" },
  { value: "academic",labelKey: "styleAcademic" },
  { value: "custom",  labelKey: "styleCustom" },
];

export default function ConvertFlow() {
  const t = useTranslations("FileUpload");
  const tCfg = useTranslations("ConversionSettings");
  const tDocx = useTranslations("docxGuide");

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
  const [showTocEditor, setShowTocEditor] = useState(false);
  const [validationResult, setValidationResult] = useState<EpubValidationResult | null>(null);
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentProject[]>([]);
  const [conversionOptions, setConversionOptions] = useState<ConversionOptions>(loadSettings);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { saveSettings(conversionOptions); }, [conversionOptions]);
  useEffect(() => { setRecent(loadRecent()); }, []);

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
    setPreviewFile(null); setPreviewFilename("document.epub"); setShowTocEditor(false);
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
      setPreviewFile(blob); setPreviewFilename(filename); setShowTocEditor(false);
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

  function handleStyleChange(newStyle: StylePreset) {
    if (newStyle === "custom") {
      const basePreset = conversionOptions.style !== "custom" ? conversionOptions.style : "default";
      const baseCss = EPUB_STYLES[basePreset] ?? EPUB_STYLES.default ?? "";
      setConversionOptions({ ...conversionOptions, style: "custom", customCss: conversionOptions.customCss || baseCss });
    } else {
      setConversionOptions({ ...conversionOptions, style: newStyle });
    }
  }

  function handleLoadPreset(preset: string) {
    const css = EPUB_STYLES[preset] ?? EPUB_STYLES.default ?? "";
    setConversionOptions({ ...conversionOptions, customCss: css });
  }

  const setOpt = <K extends keyof ConversionOptions>(key: K, value: ConversionOptions[K]) => {
    setConversionOptions((prev) => ({ ...prev, [key]: value }));
  };

  const isBatch = files.length > 1;
  const hasFile = !!file || isBatch;

  // ── Shared styles ──
  const inputSt: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 6,
    border: "1px solid var(--lib-border)",
    background: "var(--lib-bg)",
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
    letterSpacing: "0.02em",
  };
  const sectionSt: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Recent projects (empty state only) ── */}
      {recent.length > 0 && !hasFile && !previewFile && (
        <div
          style={{
            borderRadius: 6,
            border: "1px solid var(--lib-border)",
            background: "var(--lib-bg-2)",
            padding: "12px 16px",
          }}
        >
          <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--lib-dust)", marginBottom: 8 }}>
            {t("recentLabel")}
          </p>
          <ul style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {recent.map((r) => (
              <li
                key={r.filename + r.date}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 13, color: "var(--lib-dusk)" }}
              >
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.title || r.filename}
                </span>
                <span style={{ fontSize: 11, color: "var(--lib-dust)", flexShrink: 0 }}>
                  {new Date(r.date).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Upload zone (no file selected) ── */}
      {!hasFile && !previewFile && (
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
              minHeight: 280,
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              border: isDragging
                ? "2px dashed var(--lib-gold)"
                : "2px dashed var(--lib-border-2)",
              background: isDragging ? "var(--lib-bg-3)" : "var(--lib-bg-2)",
              padding: "40px 32px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "center",
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
            <div
              style={{
                width: 52,
                height: 52,
                marginBottom: 16,
                borderRadius: 12,
                background: isDragging ? "var(--lib-gold)" : "var(--lib-bg-3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isDragging ? "#FDFAF6" : "var(--lib-wood)"} strokeWidth="1.5" aria-hidden>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 500, color: "var(--lib-ink)", marginBottom: 6, fontFamily: "var(--font-serif), Georgia, serif" }}>
              {isDragging ? t("dropHere") : t("dropText")}
            </p>
            <p style={{ fontSize: 13, color: "var(--lib-dust)" }}>
              {t("browse", { extensions: ACCEPTED_STRING })}
            </p>
          </div>
        </label>
      )}

      {/* ── Errors ── */}
      {error && (
        <div data-testid="upload-error" style={{ borderRadius: 6, border: "1px solid var(--lib-border-2)", background: "var(--lib-bg-3)", padding: "10px 14px", fontSize: 13, color: "var(--lib-wood-dim)" }} role="alert">
          {error}
        </div>
      )}
      {convertError && (
        <div data-testid="convert-error" style={{ borderRadius: 6, border: "1px solid rgba(220,80,80,0.3)", background: "rgba(40,10,10,0.3)", padding: "10px 14px", fontSize: 13, color: "#ef4444" }} role="alert">
          {convertError}
        </div>
      )}

      {/* ── Single file: file card + form ── */}
      {file && !isBatch && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* File card */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid var(--lib-border)",
              background: "var(--lib-bg-2)",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                background: "var(--lib-bg-3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--lib-wood)" strokeWidth="1.5" aria-hidden>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, color: "var(--lib-ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {file.name}
              </p>
              <p style={{ fontSize: 12, color: "var(--lib-dust)", marginTop: 2 }}>
                {getExtension(file.name).toUpperCase().replace(".", "")} · {formatBytes(file.size)}
              </p>
            </div>
            <button
              type="button"
              data-testid="remove-file-btn"
              onClick={clearFile}
              aria-label={t("removeFile")}
              style={{
                flexShrink: 0,
                width: 28,
                height: 28,
                borderRadius: 6,
                border: "none",
                background: "var(--lib-bg-3)",
                color: "var(--lib-dust)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Metadata fields */}
          <div style={sectionSt}>
            <div>
              <label style={labelSt}>{tCfg("title")}</label>
              <input
                type="text"
                data-testid="title-input"
                value={conversionOptions.title}
                onChange={(e) => setOpt("title", e.target.value)}
                placeholder={tCfg("titlePlaceholder")}
                style={{ ...inputSt, fontSize: 16, fontFamily: "var(--font-serif), Georgia, serif" }}
              />
            </div>
            <div>
              <label style={labelSt}>{tCfg("author")}</label>
              <input
                type="text"
                value={conversionOptions.author}
                onChange={(e) => setOpt("author", e.target.value)}
                placeholder={tCfg("authorPlaceholder")}
                style={inputSt}
              />
            </div>
          </div>

          {/* Advanced settings toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              color: "var(--lib-wood)",
              fontSize: 13,
              fontFamily: "var(--font-sans), system-ui, sans-serif",
              alignSelf: "flex-start",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
              style={{ transition: "transform 0.2s", transform: showAdvanced ? "rotate(90deg)" : "rotate(0deg)" }}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            {tCfg("heading")}
          </button>

          {/* Advanced settings panel */}
          {showAdvanced && (
            <div
              style={{
                borderRadius: 8,
                border: "1px solid var(--lib-border)",
                background: "var(--lib-bg-2)",
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* EPUB version */}
              <div>
                <label style={labelSt}>{tCfg("epubVersion")}</label>
                <select
                  value={conversionOptions.epubVersion}
                  onChange={(e) => setOpt("epubVersion", e.target.value as "epub3" | "epub2")}
                  style={inputSt}
                >
                  <option value="epub3">{tCfg("epub3")}</option>
                  <option value="epub2">{tCfg("epub2")}</option>
                </select>
              </div>

              {/* TOC */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ display: "flex", cursor: "pointer", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={conversionOptions.toc}
                    onChange={(e) => setOpt("toc", e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: "var(--lib-wood-dim)" }}
                  />
                  <span style={{ fontSize: 13, color: "var(--lib-ink)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
                    {tCfg("includeToc")}
                  </span>
                </label>
                {conversionOptions.toc && (
                  <div style={{ paddingLeft: 24 }}>
                    <label style={labelSt}>{tCfg("tocDepth")}</label>
                    <select
                      value={conversionOptions.tocDepth}
                      onChange={(e) => setOpt("tocDepth", Number(e.target.value) as 1 | 2 | 3)}
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
                <label style={labelSt}>{tCfg("stylePreset")}</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  {STYLE_PRESETS.map(({ value, labelKey }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleStyleChange(value)}
                      style={{
                        padding: "4px 12px",
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
                      {tCfg(labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom CSS */}
              {conversionOptions.style === "custom" && (
                <div>
                  <div style={{ marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label style={{ ...labelSt, marginBottom: 0 }}>{tCfg("customCssLabel")}</label>
                    <div style={{ display: "flex", gap: 4 }}>
                      {(["default", "book", "novel", "academic"] as const).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleLoadPreset(preset)}
                          style={{
                            padding: "2px 6px",
                            fontSize: 10,
                            fontWeight: 500,
                            color: "var(--lib-wood-dim)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            textDecoration: "underline",
                            fontFamily: "var(--font-sans), system-ui, sans-serif",
                          }}
                        >
                          {tCfg(`style${preset.charAt(0).toUpperCase() + preset.slice(1)}` as "styleDefault" | "styleBook" | "styleNovel" | "styleAcademic")}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={conversionOptions.customCss}
                    onChange={(e) => setOpt("customCss", e.target.value)}
                    placeholder={tCfg("customCssPlaceholder")}
                    rows={12}
                    spellCheck={false}
                    style={{ ...inputSt, fontFamily: "var(--font-mono), monospace", fontSize: 12, resize: "vertical" }}
                  />
                  <p style={{ marginTop: 4, fontSize: 11, color: "var(--lib-dust)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
                    {tCfg("customCssHint")}
                  </p>
                </div>
              )}

              {/* Cover image */}
              <div>
                <p style={labelSt}>{tCfg("coverImage")}</p>
                {!coverFile ? (
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px dashed var(--lib-border-2)",
                      cursor: "pointer",
                      background: "var(--lib-bg)",
                    }}
                  >
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--lib-wood)" strokeWidth="1.5" aria-hidden>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span style={{ fontSize: 13, color: "var(--lib-dusk)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
                      {tCfg("coverHint")}
                    </span>
                  </label>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, borderRadius: 6, border: "1px solid var(--lib-border)", background: "var(--lib-bg)", padding: "8px 12px" }}>
                    <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, color: "var(--lib-ink)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
                      {coverFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCoverFile(null)}
                      style={{ flexShrink: 0, fontSize: 12, color: "var(--lib-dust)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "var(--font-sans), system-ui, sans-serif" }}
                    >
                      {tCfg("remove")}
                    </button>
                  </div>
                )}
              </div>

              {/* Language */}
              <div>
                <label style={labelSt}>{tCfg("language")}</label>
                <select
                  value={conversionOptions.language}
                  onChange={(e) => setOpt("language", e.target.value as ConversionOptions["language"])}
                  style={inputSt}
                >
                  <option value="ko">Korean (ko)</option>
                  <option value="en">English (en)</option>
                  <option value="ja">Japanese (ja)</option>
                  <option value="zh">Chinese (zh)</option>
                </select>
              </div>

              {/* Publisher */}
              <div>
                <label style={labelSt}>{tCfg("publisher")}</label>
                <input
                  type="text"
                  value={conversionOptions.publisher}
                  onChange={(e) => setOpt("publisher", e.target.value)}
                  placeholder={tCfg("publisherPlaceholder")}
                  style={inputSt}
                />
              </div>

              {/* Date */}
              <div>
                <label style={labelSt}>{tCfg("date")}</label>
                <input
                  type="text"
                  value={conversionOptions.date}
                  onChange={(e) => setOpt("date", e.target.value)}
                  placeholder={tCfg("datePlaceholder")}
                  style={inputSt}
                />
              </div>
            </div>
          )}

          {/* DOCX guide hint */}
          <div
            style={{
              borderRadius: 6,
              border: "1px solid var(--lib-border)",
              background: "var(--lib-bg-2)",
              padding: "10px 14px",
              fontSize: 12,
              color: "var(--lib-dust)",
              lineHeight: 1.6,
              fontFamily: "var(--font-sans), system-ui, sans-serif",
            }}
            role="note"
          >
            {tDocx("note")}
          </div>

          {/* Convert button */}
          {converting ? (
            <div data-testid="converting-state">
              <div style={{ marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--lib-dusk)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
                  {t("converting")}
                </span>
              </div>
              <div style={{ height: 4, background: "var(--lib-bg-3)", borderRadius: 4, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: 4,
                    background: "var(--lib-wood-dim)",
                    animation: "progress-indeterminate 1.4s ease-in-out infinite",
                    width: "40%",
                  }}
                />
              </div>
            </div>
          ) : (
            <button
              type="button"
              data-testid="convert-btn"
              onClick={convertToEpub}
              style={{
                width: "100%",
                padding: "14px 24px",
                fontSize: 15,
                fontWeight: 500,
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                background: "var(--lib-wood-dim)",
                color: "#F8F5F0",
                fontFamily: "var(--font-sans), system-ui, sans-serif",
                letterSpacing: "0.02em",
                transition: "opacity 0.15s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
            >
              {t("convertButton")}
            </button>
          )}
        </div>
      )}

      {/* ── Batch file list ── */}
      {isBatch && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ borderRadius: 8, border: "1px solid var(--lib-border)", background: "var(--lib-bg-2)", padding: 16 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--lib-dust)", marginBottom: 10 }}>
              {t("batchTitle")} — {files.length}
            </p>
            <ul style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "var(--lib-bg-3)", borderRadius: 4, padding: "6px 10px" }}
                >
                  <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, color: "var(--lib-ink)" }}>
                    {f.name}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--lib-dust)" }}>
                      {formatBytes(f.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeBatchFile(i)}
                      style={{ fontSize: 12, color: "var(--lib-dust)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                    >
                      {t("removeFile")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {batchProgress ? (
              <div>
                <p style={{ fontSize: 13, color: "var(--lib-dusk)", marginBottom: 6 }}>
                  {t("convertingBatch", { current: batchProgress.current, total: batchProgress.total })}
                </p>
                <div style={{ height: 4, background: "var(--lib-bg)", borderRadius: 4 }}>
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 4,
                      background: "var(--lib-wood-dim)",
                      width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  data-testid="convert-all-btn"
                  onClick={convertAll}
                  disabled={converting}
                  style={{
                    padding: "10px 20px",
                    fontSize: 13,
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    background: "var(--lib-wood-dim)",
                    color: "#F8F5F0",
                    fontFamily: "var(--font-sans), system-ui, sans-serif",
                    opacity: converting ? 0.7 : 1,
                  }}
                >
                  {t("convertAll")}
                </button>
                <button
                  type="button"
                  onClick={clearFile}
                  style={{ padding: "10px 20px", fontSize: 13, borderRadius: 6, border: "1px solid var(--lib-border)", cursor: "pointer", background: "transparent", color: "var(--lib-dusk)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}
                >
                  {t("removeFile")}
                </button>
              </div>
            )}
          </div>

          {/* Batch results */}
          {batchResults.length > 0 && !batchProgress && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {batchResults.map((r) => (
                <button
                  key={r.filename}
                  type="button"
                  onClick={() => { const url = URL.createObjectURL(r.blob); const a = document.createElement("a"); a.href = url; a.download = r.filename; a.click(); URL.revokeObjectURL(url); }}
                  style={{ padding: "8px 16px", fontSize: 13, borderRadius: 6, border: "1px solid var(--lib-border)", cursor: "pointer", background: "var(--lib-bg-2)", color: "var(--lib-ink)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}
                >
                  {t("downloadFile")} · {r.filename}
                </button>
              ))}
              <button
                type="button"
                onClick={downloadZip}
                style={{ padding: "8px 16px", fontSize: 13, borderRadius: 6, border: "none", cursor: "pointer", background: "var(--lib-wood-dim)", color: "#F8F5F0", fontFamily: "var(--font-sans), system-ui, sans-serif" }}
              >
                {t("downloadAllZip")}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Download result card ── */}
      {previewFile && !converting && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Success card */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 18px",
              borderRadius: 8,
              border: "1px solid var(--lib-border)",
              background: "var(--lib-bg-2)",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: "var(--lib-wood-dim)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F8F5F0" strokeWidth="1.5" aria-hidden>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "var(--lib-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {previewFilename}
              </p>
              <p style={{ fontSize: 12, color: "var(--lib-dust)", marginTop: 2 }}>
                {t("downloadFile")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const url = URL.createObjectURL(previewFile);
                const a = document.createElement("a");
                a.href = url; a.download = previewFilename; a.click();
                URL.revokeObjectURL(url);
              }}
              style={{
                flexShrink: 0,
                padding: "8px 16px",
                fontSize: 13,
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: "var(--lib-wood-dim)",
                color: "#F8F5F0",
                fontFamily: "var(--font-sans), system-ui, sans-serif",
              }}
            >
              ↓ {t("downloadFile")}
            </button>
          </div>

          {/* TOC Editor toggle */}
          {!showTocEditor ? (
            <button
              type="button"
              data-testid="open-toc-editor-btn"
              onClick={() => setShowTocEditor(true)}
              style={{
                alignSelf: "flex-start",
                padding: "7px 14px",
                fontSize: 13,
                borderRadius: 6,
                border: "1px solid var(--lib-border)",
                cursor: "pointer",
                background: "transparent",
                color: "var(--lib-dusk)",
                fontFamily: "var(--font-sans), system-ui, sans-serif",
              }}
            >
              {t("openTocEditor")}
            </button>
          ) : (
            <TocEditor epubBlob={previewFile} filename={previewFilename} onClose={() => setShowTocEditor(false)} />
          )}

          <EpubCompatibilityCheck result={validationResult} loading={validationLoading} error={validationError} />
          <EpubPreview file={previewFile} />
        </div>
      )}

      {/* Progress animation styles */}
      <style>{`
        @keyframes progress-indeterminate {
          0%   { transform: translateX(-100%) scaleX(0.5); }
          50%  { transform: translateX(100%) scaleX(1); }
          100% { transform: translateX(250%) scaleX(0.5); }
        }
      `}</style>
    </div>
  );
}
