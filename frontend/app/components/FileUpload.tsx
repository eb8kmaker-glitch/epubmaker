"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import JSZip from "jszip";
import ConversionSettings, {
  DEFAULT_OPTIONS,
  type ConversionOptions,
} from "./ConversionSettings";
import EpubCompatibilityCheck from "./EpubCompatibilityCheck";
import EpubPreview from "./EpubPreview";
import TocEditor from "./TocEditor";
import GoogleDocsPicker from "./GoogleDocsPicker";
import type { EpubValidationResult } from "@/app/lib/validateEpub";

const ACCEPTED_TYPES: Record<string, string> = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "text/plain": ".txt",
  "application/pdf": ".pdf",
  "text/html": ".html",
  "text/markdown": ".md",
};
const ACCEPTED_EXTENSIONS = [".docx", ".txt", ".pdf", ".html", ".htm", ".md"];
const ACCEPTED_STRING = ".docx, .txt, .pdf, .html, .md";
const CONVERT_TO_EPUB_EXTENSIONS = [".docx", ".txt", ".pdf", ".html", ".htm", ".md"];
const MAX_TEXT_CHARS = 30_000;
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const SETTINGS_KEY = "epubmaker_settings_v2";
const RECENT_KEY = "epubmaker_recent_v1";

interface RecentProject {
  filename: string;
  title?: string;
  date: string;
}

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

function canConvertToEpub(file: File): boolean {
  return CONVERT_TO_EPUB_EXTENSIONS.includes(getExtension(file.name));
}

type BatchResult = { filename: string; blob: Blob };

export default function FileUpload() {
  const t = useTranslations("FileUpload");
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
  const [notionUrl, setNotionUrl] = useState("");
  const [notionLoading, setNotionLoading] = useState(false);
  const [showNotionInput, setShowNotionInput] = useState(false);
  const [recent, setRecent] = useState<RecentProject[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [conversionOptions, setConversionOptions] = useState<ConversionOptions>(loadSettings);

  // Autosave settings to localStorage
  useEffect(() => { saveSettings(conversionOptions); }, [conversionOptions]);

  // Load recent projects on mount
  useEffect(() => { setRecent(loadRecent()); }, []);

  // EPUB validation after preview
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
    if (ext === ".txt" || ext === ".md" || ext === ".html" || ext === ".htm") {
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
    setError(null); setConvertError(null);
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

  const handleCoverFileChange = useCallback((newCover: File | null) => {
    if (newCover && newCover.size > MAX_FILE_SIZE_BYTES) { setError(t("errorCoverSize")); return; }
    setError(null);
    // cover is passed separately to convertToEpub
  }, [t]);

  const [coverFile, setCoverFile] = useState<File | null>(null);

  const handleGoogleDocSelected = useCallback((docFile: File) => {
    setError(null); setConvertError(null); setFiles([]); setFile(docFile);
  }, []);

  const handleNotionImport = useCallback(async () => {
    const url = notionUrl.trim();
    if (!url) return;
    setConvertError(null); setNotionLoading(true);
    try {
      const res = await fetch("/api/import-notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data.error as string) || t("notionError"));
      const html = data.html as string;
      const title = (data.title as string) || "notion-page";
      const safeName = title.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 80) || "notion-page";
      setError(null); setFiles([]); setFile(new File([html], `${safeName}.html`, { type: "text/html" }));
      setNotionUrl(""); setShowNotionInput(false);
    } catch (e) {
      setConvertError(e instanceof Error ? e.message : t("notionError"));
    } finally { setNotionLoading(false); }
  }, [notionUrl, t]);

  const convertToEpub = useCallback(async () => {
    if (!file || !canConvertToEpub(file)) return;
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

  return (
    <div className="w-full max-w-lg space-y-6">
      {/* Recent projects */}
      {recent.length > 0 && !file && files.length === 0 && (
        <div
          style={{
            borderRadius: 3,
            border: "1px solid var(--lib-border)",
            background: "var(--lib-bg-2)",
            padding: "12px 16px",
          }}
        >
          <p
            style={{
              fontSize: 10,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--cream-dim)",
              opacity: 0.6,
              marginBottom: 8,
            }}
          >
            {t("recentLabel")}
          </p>
          <ul style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {recent.map((r) => (
              <li
                key={r.filename + r.date}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  fontSize: 13,
                  color: "var(--cream-dim)",
                }}
              >
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.title || r.filename}
                </span>
                <span style={{ fontSize: 11, opacity: 0.45, flexShrink: 0 }}>
                  {new Date(r.date).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Drop zone */}
      <label className="block">
        <span className="sr-only">Choose file</span>
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          style={{
            position: "relative",
            display: "flex",
            minHeight: 180,
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 3,
            border: isDragging
              ? "2px dashed var(--lib-gold)"
              : "2px dashed var(--lib-border-2)",
            background: isDragging
              ? "var(--lib-bg-3)"
              : "var(--lib-bg-2)",
            padding: "32px 24px",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_STRING}
            multiple
            onChange={onInputChange}
            style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
            aria-label="Upload DOCX, TXT, PDF, HTML, or MD file"
          />
          <span style={{ fontSize: 32, marginBottom: 10 }} aria-hidden>📄</span>
          <p style={{ fontSize: 14, color: "var(--cream-dim)", textAlign: "center", fontWeight: 300 }}>
            {isDragging ? t("dropHere") : t("dropText")}
          </p>
          <p style={{ fontSize: 12, color: "var(--cream-dim)", opacity: 0.5, marginTop: 4 }}>
            {t("browse", { extensions: ACCEPTED_STRING })}
          </p>
        </div>
      </label>

      {/* Import buttons */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn-ghost-gold"
          style={{ padding: "8px 16px", fontSize: 13, borderRadius: 2, background: "transparent", cursor: "pointer" }}
        >
          {t("uploadFile")}
        </button>
        <GoogleDocsPicker onFileSelected={handleGoogleDocSelected} onError={setConvertError} disabled={converting}>
          {t("importGoogleDocs")}
        </GoogleDocsPicker>
        <button
          type="button"
          onClick={() => setShowNotionInput((v) => !v)}
          className="btn-ghost-gold"
          style={{ padding: "8px 16px", fontSize: 13, borderRadius: 2, background: "transparent", cursor: "pointer" }}
        >
          {t("importNotion")}
        </button>
      </div>

      {showNotionInput && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            borderRadius: 3,
            border: "1px solid var(--lib-border)",
            background: "var(--lib-bg-2)",
            padding: 12,
          }}
        >
          <input
            type="url"
            value={notionUrl}
            onChange={(e) => setNotionUrl(e.target.value)}
            placeholder={t("notionUrlPlaceholder")}
            disabled={notionLoading}
            style={{
              flex: "1 1 200px",
              minWidth: 0,
              background: "var(--lib-panel)",
              border: "1px solid var(--lib-border)",
              borderRadius: 2,
              padding: "8px 12px",
              fontSize: 13,
              color: "var(--cream)",
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={handleNotionImport}
            disabled={notionLoading || !notionUrl.trim()}
            className="btn-gold"
            style={{ padding: "8px 16px", fontSize: 13, borderRadius: 2, border: "none", cursor: "pointer" }}
          >
            {notionLoading ? t("notionImporting") : t("notionImportButton")}
          </button>
        </div>
      )}

      {/* DOCX guide */}
      <div
        style={{
          borderRadius: 3,
          border: "1px solid var(--lib-border)",
          background: "var(--lib-bg-2)",
          padding: "12px 16px",
        }}
        role="region"
        aria-label={tDocx("title")}
      >
        <p style={{ fontSize: 13, color: "var(--cream-dim)", fontWeight: 400, marginBottom: 6 }}>
          {tDocx("title")}
        </p>
        <p style={{ fontSize: 12, color: "var(--cream-dim)", opacity: 0.6, lineHeight: 1.5 }}>
          {tDocx("description")}
        </p>
        <ul style={{ margin: "6px 0 0 16px", fontSize: 12, color: "var(--cream-dim)", opacity: 0.55, lineHeight: 1.6 }}>
          <li>{tDocx("heading1")}</li>
          <li>{tDocx("heading2")}</li>
          <li>{tDocx("heading3")}</li>
        </ul>
      </div>

      {/* Batch file list */}
      {files.length > 0 && (
        <div
          style={{
            borderRadius: 3,
            border: "1px solid var(--lib-border)",
            background: "var(--lib-bg-2)",
            padding: 16,
          }}
        >
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cream-dim)", opacity: 0.6, marginBottom: 8 }}>
            {t("batchTitle")} — {files.length} files
          </p>
          <ul style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {files.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  background: "var(--lib-bg-3)",
                  borderRadius: 2,
                  padding: "6px 10px",
                }}
              >
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, color: "var(--cream)" }}>{f.name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--cream-dim)", opacity: 0.5 }}>{formatBytes(f.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeBatchFile(i)}
                    style={{ fontSize: 12, color: "var(--cream-dim)", opacity: 0.5, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                  >
                    {t("removeFile")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <ConversionSettings options={conversionOptions} onChange={setConversionOptions} coverFile={null} onCoverFileChange={() => {}} />
          {batchProgress ? (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 13, color: "var(--cream-dim)" }}>
                {t("convertingBatch", { current: batchProgress.current, total: batchProgress.total })}
              </p>
              <div style={{ marginTop: 8, height: 3, background: "var(--lib-bg-3)", borderRadius: 2 }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: 2,
                    background: "var(--gold)",
                    width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={convertAll}
                disabled={converting}
                className="btn-gold"
                style={{ padding: "10px 20px", fontSize: 13, borderRadius: 2, border: "none", cursor: "pointer" }}
              >
                {t("convertAll")}
              </button>
              <button
                type="button"
                onClick={clearFile}
                className="btn-ghost-gold"
                style={{ padding: "10px 20px", fontSize: 13, borderRadius: 2, background: "transparent", cursor: "pointer" }}
              >
                {t("removeFile")}
              </button>
            </div>
          )}
          {batchResults.length > 0 && !batchProgress && (
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {batchResults.map((r) => (
                <button
                  key={r.filename}
                  type="button"
                  onClick={() => { const url = URL.createObjectURL(r.blob); const a = document.createElement("a"); a.href = url; a.download = r.filename; a.click(); URL.revokeObjectURL(url); }}
                  className="btn-gold"
                  style={{ padding: "6px 14px", fontSize: 12, borderRadius: 2, border: "none", cursor: "pointer" }}
                >
                  {r.filename}
                </button>
              ))}
              <button
                type="button"
                onClick={downloadZip}
                className="btn-ghost-gold"
                style={{ padding: "6px 14px", fontSize: 12, borderRadius: 2, background: "transparent", cursor: "pointer" }}
              >
                {t("downloadAllZip")}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Errors */}
      {error && (
        <div style={{ borderRadius: 3, border: "1px solid var(--lib-border-2)", background: "var(--lib-bg-3)", padding: "10px 14px", fontSize: 13, color: "var(--lib-gold)" }} role="alert">
          {error}
        </div>
      )}
      {convertError && (
        <div style={{ borderRadius: 3, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(43,10,10,0.4)", padding: "10px 14px", fontSize: 13, color: "#ef4444" }} role="alert">
          {convertError}
        </div>
      )}

      {/* Single file */}
      {file && (
        <>
          <div
            style={{
              borderRadius: 3,
              border: "1px solid var(--lib-border)",
              background: "var(--lib-bg-2)",
              padding: 16,
            }}
          >
            <p style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cream-dim)", opacity: 0.5, marginBottom: 6 }}>
              {t("uploadedFile")}
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <p style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 14, color: "var(--cream)", fontWeight: 400 }}>
                {file.name}
              </p>
              <span style={{ flexShrink: 0, fontFamily: "monospace", fontSize: 12, color: "var(--cream-dim)", opacity: 0.5 }}>
                {formatBytes(file.size)}
              </span>
            </div>
            <button
              type="button"
              onClick={clearFile}
              style={{ marginTop: 8, fontSize: 12, color: "var(--cream-dim)", opacity: 0.5, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
            >
              {t("removeFile")}
            </button>
          </div>

          {canConvertToEpub(file) && (
            <>
              <ConversionSettings
                options={conversionOptions}
                onChange={(opts) => { setConversionOptions(opts); }}
                coverFile={coverFile}
                onCoverFileChange={(f) => { handleCoverFileChange(f); setCoverFile(f); }}
              />
              <button
                type="button"
                onClick={convertToEpub}
                disabled={converting}
                className="btn-gold"
                style={{
                  padding: "12px 28px",
                  fontSize: 14,
                  borderRadius: 2,
                  border: "none",
                  cursor: converting ? "wait" : "pointer",
                  letterSpacing: "0.04em",
                  fontFamily: "var(--font-sans), system-ui, sans-serif",
                  opacity: converting ? 0.7 : 1,
                  width: "100%",
                }}
              >
                {converting ? t("converting") : t("convertButton")}
              </button>
            </>
          )}
        </>
      )}

      {/* Preview + TOC editor */}
      {previewFile && (
        <div style={{ marginTop: 24, width: "100%", maxWidth: 960, display: "flex", flexDirection: "column", gap: 16 }}>
          <EpubPreview file={previewFile} />
          <EpubCompatibilityCheck result={validationResult} loading={validationLoading} error={validationError} />
          {!showTocEditor ? (
            <button
              type="button"
              onClick={() => setShowTocEditor(true)}
              className="btn-ghost-gold"
              style={{ padding: "8px 16px", fontSize: 13, borderRadius: 2, background: "transparent", cursor: "pointer", alignSelf: "flex-start" }}
            >
              {t("openTocEditor")}
            </button>
          ) : (
            <TocEditor epubBlob={previewFile} filename={previewFilename} onClose={() => setShowTocEditor(false)} />
          )}
        </div>
      )}
    </div>
  );
}
