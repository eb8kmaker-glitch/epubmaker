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
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
const BETA_DAILY_LIMIT = 3;
const BETA_STORAGE_KEY = "epubmaker_beta_usage";

const BATCH_FREE_LIMIT = 3;
const BATCH_STARTER_LIMIT = 20;
const BATCH_PRO_LIMIT = Infinity;
type Plan = "free" | "starter" | "pro";
function getBatchLimit(plan: Plan): number {
  switch (plan) {
    case "free": return BATCH_FREE_LIMIT;
    case "starter": return BATCH_STARTER_LIMIT;
    case "pro": return BATCH_PRO_LIMIT;
    default: return BATCH_FREE_LIMIT;
  }
}

function getBetaUsage(): { count: number; date: string } {
  if (typeof window === "undefined") return { count: 0, date: "" };
  const today = new Date().toDateString();
  try {
    const raw = localStorage.getItem(BETA_STORAGE_KEY);
    if (!raw) return { count: 0, date: today };
    const { date, count } = JSON.parse(raw) as { date: string; count: number };
    if (date !== today) return { count: 0, date: today };
    return { date, count };
  } catch {
    return { count: 0, date: today };
  }
}

function incrementBetaUsage(): void {
  const u = getBetaUsage();
  const today = new Date().toDateString();
  const newCount = u.date === today ? u.count + 1 : 1;
  localStorage.setItem(BETA_STORAGE_KEY, JSON.stringify({ date: today, count: newCount }));
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
  const ext = getExtension(file.name);
  return (
    ACCEPTED_EXTENSIONS.includes(ext) ||
    file.type in ACCEPTED_TYPES
  );
}

function canConvertToEpub(file: File): boolean {
  return CONVERT_TO_EPUB_EXTENSIONS.includes(getExtension(file.name));
}

type BatchResult = { filename: string; blob: Blob };

export default function FileUpload() {
  const t = useTranslations("FileUpload");
  const tDocx = useTranslations("docxGuide");
  const currentPlan: Plan = "free";
  const batchLimit = getBatchLimit(currentPlan);

  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [previewFile, setPreviewFile] = useState<Blob | null>(null);
  const [validationResult, setValidationResult] = useState<EpubValidationResult | null>(null);
  const [validationLoading, setValidationLoading] = useState(false);
  const [notionUrl, setNotionUrl] = useState("");
  const [notionLoading, setNotionLoading] = useState(false);
  const [showNotionInput, setShowNotionInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [conversionOptions, setConversionOptions] = useState<ConversionOptions>(DEFAULT_OPTIONS);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [betaUsage, setBetaUsage] = useState(() => getBetaUsage());

  useEffect(() => {
    setBetaUsage(getBetaUsage());
  }, [converting]);

  const handleFiles = useCallback((fileList: FileList | null) => {
    setError(null);
    setConvertError(null);
    setBatchResults([]);
    if (!fileList?.length) return;

    if (fileList.length > 1) {
      const list: File[] = [];
      for (let i = 0; i < fileList.length && list.length < batchLimit; i++) {
        const f = fileList[i];
        if (!isValidFile(f)) {
          setError(t("errorFileType", { name: f.name }));
          setFiles([]);
          setFile(null);
          return;
        }
        if (f.size > MAX_FILE_SIZE_BYTES) {
          setError(t("errorFileSize"));
          setFiles([]);
          setFile(null);
          return;
        }
        list.push(f);
      }
      if (fileList.length > batchLimit) {
        setError(t("batchLimitReached", { max: String(batchLimit) }));
      }
      setFiles(list);
      setFile(null);
      return;
    }

    const f = fileList[0];
    if (!isValidFile(f)) {
      setError(t("errorFileType", { name: f.name }));
      setFile(null);
      setFiles([]);
      return;
    }
    if (f.size > MAX_FILE_SIZE_BYTES) {
      setError(t("errorFileSize"));
      setFile(null);
      setFiles([]);
      return;
    }
    const ext = getExtension(f.name);
    if (ext === ".txt" || ext === ".md" || ext === ".html" || ext === ".htm") {
      const reader = new FileReader();
      reader.onload = () => {
        const text = (reader.result as string) ?? "";
        if (text.length > MAX_TEXT_CHARS) {
          setError(t("errorTextLength", { max: MAX_TEXT_CHARS.toLocaleString(), current: text.length.toLocaleString() }));
          setFile(null);
          setFiles([]);
          return;
        }
        setFile(f);
        setFiles([]);
      };
      reader.readAsText(f, "UTF-8");
      return;
    }
    setFile(f);
    setFiles([]);
  }, [t, batchLimit]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      e.target.value = "";
    },
    [handleFiles]
  );

  const clearFile = useCallback(() => {
    setPreviewFile(null);
    setValidationResult(null);
    setValidationLoading(false);
    setCoverFile(null);
    setFile(null);
    setFiles([]);
    setBatchResults([]);
    setBatchProgress(null);
    setError(null);
    setConvertError(null);
  }, []);

  useEffect(() => {
    if (!previewFile) {
      setValidationResult(null);
      setValidationLoading(false);
      return;
    }
    let cancelled = false;
    setValidationLoading(true);
    setValidationResult(null);
    const formData = new FormData();
    formData.append("epub", previewFile);
    fetch("/api/validate-epub", { method: "POST", body: formData })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Validation failed"))))
      .then((result: EpubValidationResult) => {
        if (!cancelled) {
          setValidationResult(result);
          setValidationLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setValidationLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [previewFile]);

  const removeBatchFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const convertOneFile = useCallback(async (f: File): Promise<BatchResult> => {
    const formData = new FormData();
    formData.append("file", f);
    formData.append("options", JSON.stringify(conversionOptions));
    const res = await fetch("/api/convert", { method: "POST", body: formData });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Conversion failed (${res.status})`);
    }
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition");
    const match = disposition?.match(/filename="?([^";\n]+)"?/);
    const filename = match ? match[1].trim() : "document.epub";
    return { filename, blob };
  }, [conversionOptions]);

  const convertAll = useCallback(async () => {
    if (files.length === 0) return;
    const remaining = BETA_DAILY_LIMIT - betaUsage.count;
    if (remaining <= 0) {
      setConvertError(t("dailyLimit"));
      return;
    }
    const toConvert = files.slice(0, Math.min(files.length, remaining));
    setConvertError(null);
    setBatchResults([]);
    setConverting(true);
    setBatchProgress({ current: 0, total: toConvert.length });
    const results: BatchResult[] = [];
    try {
      for (let i = 0; i < toConvert.length; i++) {
        setBatchProgress({ current: i + 1, total: toConvert.length });
        const result = await convertOneFile(toConvert[i]);
        results.push(result);
        incrementBetaUsage();
      }
      setBatchResults(results);
      setBetaUsage(getBetaUsage());
    } catch (e) {
      setConvertError(e instanceof Error ? e.message : t("errorConversionFailed"));
    } finally {
      setConverting(false);
      setBatchProgress(null);
    }
  }, [files, betaUsage.count, convertOneFile, t]);

  const downloadZip = useCallback(async () => {
    if (batchResults.length === 0) return;
    const zip = new JSZip();
    for (const { filename, blob } of batchResults) {
      zip.file(filename, blob);
    }
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "epubs.zip";
    a.click();
    URL.revokeObjectURL(url);
  }, [batchResults]);

  const handleCoverFileChange = useCallback((newCover: File | null) => {
    if (newCover && newCover.size > MAX_FILE_SIZE_BYTES) {
      setError(t("errorCoverSize"));
      return;
    }
    setError(null);
    setCoverFile(newCover);
  }, [t]);

  const handleGoogleDocSelected = useCallback((docFile: File) => {
    setError(null);
    setConvertError(null);
    setFiles([]);
    setFile(docFile);
  }, []);

  const handleNotionImport = useCallback(async () => {
    const url = notionUrl.trim();
    if (!url) return;
    setConvertError(null);
    setNotionLoading(true);
    try {
      const res = await fetch("/api/import-notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data.error as string) || t("notionError"));
      }
      const html = data.html as string;
      const title = (data.title as string) || "notion-page";
      const safeName = title.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 80) || "notion-page";
      const file = new File([html], `${safeName}.html`, { type: "text/html" });
      setError(null);
      setFiles([]);
      setFile(file);
      setNotionUrl("");
      setShowNotionInput(false);
    } catch (e) {
      setConvertError(e instanceof Error ? e.message : t("notionError"));
    } finally {
      setNotionLoading(false);
    }
  }, [notionUrl, t]);

  const atBetaDailyLimit = betaUsage.count >= BETA_DAILY_LIMIT;

  const convertToEpub = useCallback(async () => {
    if (!file || !canConvertToEpub(file)) return;
    if (atBetaDailyLimit) {
      setConvertError(t("dailyLimit"));
      return;
    }
    setConvertError(null);
    setConverting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("options", JSON.stringify(conversionOptions));
      if (coverFile) {
        formData.append("cover", coverFile);
      }
      const res = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Conversion failed (${res.status})`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?([^";\n]+)"?/);
      const filename = match ? match[1].trim() : "document.epub";
      setPreviewFile(blob);
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(downloadUrl);
      incrementBetaUsage();
      setBetaUsage(getBetaUsage());
    } catch (e) {
      setConvertError(e instanceof Error ? e.message : t("errorConversionFailed"));
    } finally {
      setConverting(false);
    }
  }, [file, conversionOptions, coverFile, atBetaDailyLimit]);

  return (
    <div className="w-full max-w-lg space-y-6">
      <label className="block">
        <span className="sr-only">Choose file</span>
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`
            relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-[12px] border-2 border-dashed px-6 py-10
            transition-all duration-200 ease-in-out
            ${isDragging
              ? "border-[var(--accent-soft)] bg-[var(--dropzone-hover)]"
              : "border-[var(--accent-soft)] bg-[var(--secondary-bg)] hover:bg-[var(--dropzone-hover)]"
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_STRING}
            multiple
            onChange={onInputChange}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Upload DOCX, TXT, PDF, HTML, or MD file (multiple for batch)"
          />
          <span className="mb-2 text-4xl" aria-hidden>
            📄
          </span>
          <p className="text-center text-sm font-medium text-[var(--content-muted)]">
            {isDragging ? t("dropHere") : t("dropText")}
          </p>
          <p className="mt-1 text-center text-xs text-[var(--content-muted)]">
            {t("browse", { extensions: ACCEPTED_STRING })}
          </p>
        </div>
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--content)] shadow-sm transition-all duration-200 hover:bg-[var(--secondary-bg)]"
        >
          {t("uploadFile")}
        </button>
        <GoogleDocsPicker
          onFileSelected={handleGoogleDocSelected}
          onError={setConvertError}
          disabled={converting}
        >
          {t("importGoogleDocs")}
        </GoogleDocsPicker>
        <button
          type="button"
          onClick={() => setShowNotionInput((v) => !v)}
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--content)] shadow-sm transition-all duration-200 hover:bg-[var(--secondary-bg)]"
        >
          {t("importNotion")}
        </button>
      </div>

      {showNotionInput && (
        <div className="flex flex-wrap items-center gap-2 rounded-[12px] border border-[var(--guide-border)] bg-[var(--guide-bg)] p-3">
          <input
            type="url"
            value={notionUrl}
            onChange={(e) => setNotionUrl(e.target.value)}
            placeholder={t("notionUrlPlaceholder")}
            className="min-w-[200px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--content)] placeholder:text-[var(--content-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            disabled={notionLoading}
          />
          <button
            type="button"
            onClick={handleNotionImport}
            disabled={notionLoading || !notionUrl.trim()}
            className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-[var(--primary-hover)] disabled:opacity-50"
          >
            {notionLoading ? t("notionImporting") : t("notionImportButton")}
          </button>
        </div>
      )}

      <div
        role="region"
        aria-label={tDocx("title")}
        className="rounded-[12px] border border-[var(--guide-border)] bg-[var(--guide-bg)] px-4 py-3 transition-all duration-200"
      >
        <p className="flex items-start gap-2 text-sm font-medium text-[var(--content)]">
          <span className="mt-0.5 shrink-0 text-base text-[var(--accent)]" aria-hidden>
            📋
          </span>
          <span>{tDocx("title")}</span>
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[var(--content-muted)]">
          {tDocx("description")}
        </p>
        <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-[var(--content-muted)]">
          <li>{tDocx("heading1")}</li>
          <li>{tDocx("heading2")}</li>
          <li>{tDocx("heading3")}</li>
        </ul>
        <p className="mt-2 text-xs font-medium text-[var(--content)]">
          {tDocx("howTo")}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-[var(--content-muted)]">
          {tDocx("path")}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[var(--content-muted)]">
          {tDocx("note")}
        </p>
      </div>

      {files.length > 0 && (
        <>
          <div className="rounded-[12px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-card)]">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--content-muted)]">
              {t("batchTitle")}
            </p>
            <p className="mt-1 text-sm text-[var(--content-muted)]">{t("batchHint")}</p>
            <ul className="mt-3 space-y-2">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 rounded-lg bg-[var(--secondary-bg)] px-3 py-2">
                  <span className="min-w-0 truncate text-sm text-[var(--content)]">{f.name}</span>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-xs text-[var(--content-muted)]">{formatBytes(f.size)}</span>
                    <button
                      type="button"
                      onClick={() => removeBatchFile(i)}
                      className="text-xs text-[var(--content-muted)] underline hover:text-[var(--primary)]"
                      aria-label={t("removeFile")}
                    >
                      {t("removeFile")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <ConversionSettings
              options={conversionOptions}
              onChange={setConversionOptions}
              coverFile={null}
              onCoverFileChange={() => {}}
            />
            {batchProgress ? (
              <div className="mt-4">
                <p className="text-sm text-[var(--content-muted)]">
                  {t("convertingBatch", { current: batchProgress.current, total: batchProgress.total })}
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--secondary-bg)]">
                  <div
                    className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
                    style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={convertAll}
                  disabled={converting || (betaUsage.count >= BETA_DAILY_LIMIT)}
                  className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-[var(--primary-hover)] disabled:opacity-50"
                >
                  {t("convertAll")}
                </button>
                <button
                  type="button"
                  onClick={clearFile}
                  className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--content)] hover:bg-[var(--secondary-bg)]"
                >
                  {t("removeFile")}
                </button>
              </div>
            )}
            {batchResults.length > 0 && !batchProgress && (
              <div className="mt-4 space-y-2 rounded-lg border border-[var(--guide-border)] bg-[var(--guide-bg)] p-3">
                <p className="text-sm font-medium text-[var(--content)]">{t("downloadFile")}</p>
                <div className="flex flex-wrap gap-2">
                  {batchResults.map((r) => (
                    <button
                      key={r.filename}
                      type="button"
                      onClick={() => {
                        const url = URL.createObjectURL(r.blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = r.filename;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="inline-flex items-center rounded-lg bg-[var(--primary)] px-3 py-1.5 text-sm text-white hover:bg-[var(--primary-hover)]"
                    >
                      {r.filename}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={downloadZip}
                    className="inline-flex items-center rounded-lg border border-[var(--primary)] bg-transparent px-3 py-1.5 text-sm text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white"
                  >
                    {t("downloadAllZip")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          {error}
        </div>
      )}

      {convertError && (
        <div
          role="alert"
          className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {convertError}
        </div>
      )}

      {file && (
        <>
          <div className="rounded-[12px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-card)] transition-all duration-200">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--content-muted)]">
              {t("uploadedFile")}
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="min-w-0 truncate font-medium text-[var(--content)]">
                {file.name}
              </p>
              <span className="shrink-0 rounded-lg bg-[var(--guide-bg)] px-2 py-1 font-mono text-sm text-[var(--content-muted)]">
                {formatBytes(file.size)}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={clearFile}
                className="text-sm text-[var(--content-muted)] underline underline-offset-2 transition-colors duration-200 hover:text-[var(--primary)]"
              >
                {t("removeFile")}
              </button>
            </div>
          </div>

          {canConvertToEpub(file) && (
            <>
              <ConversionSettings
                options={conversionOptions}
                onChange={setConversionOptions}
                coverFile={coverFile}
                onCoverFileChange={handleCoverFileChange}
              />
              {atBetaDailyLimit && (
                <p className="text-sm text-amber-700">
                  {t("dailyLimit")}
                </p>
              )}
              <div>
                <button
                  type="button"
                  onClick={convertToEpub}
                  disabled={converting || atBetaDailyLimit}
                  className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-in-out hover:bg-[var(--primary-hover)] disabled:opacity-50"
                >
                  {converting ? t("converting") : t("convertButton")}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {previewFile && (
        <div className="mt-6 w-full max-w-3xl space-y-4">
          <EpubPreview file={previewFile} />
          <EpubCompatibilityCheck result={validationResult} loading={validationLoading} />
        </div>
      )}
    </div>
  );
}
