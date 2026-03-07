"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import ConversionSettings, {
  DEFAULT_OPTIONS,
  type ConversionOptions,
} from "./ConversionSettings";
import EpubPreview from "./EpubPreview";

const ACCEPTED_TYPES = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "text/plain": ".txt",
  "application/pdf": ".pdf",
};

const ACCEPTED_EXTENSIONS = [".docx", ".txt", ".pdf"];
const ACCEPTED_STRING = ".docx, .txt, .pdf";
const CONVERT_TO_EPUB_EXTENSIONS = [".docx", ".txt"];

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

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [previewFile, setPreviewFile] = useState<Blob | null>(null);
  const [conversionOptions, setConversionOptions] = useState<ConversionOptions>(DEFAULT_OPTIONS);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    setError(null);
    if (!files?.length) return;
    const f = files[0];
    if (!isValidFile(f)) {
      setError(`Please upload a DOCX, TXT or PDF file. "${f.name}" is not supported.`);
      setFile(null);
      return;
    }
    setFile(f);
  }, []);

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
    setCoverFile(null);
    setFile(null);
    setError(null);
    setConvertError(null);
  }, []);

  const convertToEpub = useCallback(async () => {
    if (!file || !canConvertToEpub(file)) return;
    setConvertError(null);
    setConverting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("options", JSON.stringify(conversionOptions));
      if (coverFile) {
        formData.append("cover", coverFile);
      }
      const res = await fetch("/api/convert-to-epub", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setConvertError("login");
          setConverting(false);
          return;
        }
        if (res.status === 403) {
          setConvertError("limit");
          setConverting(false);
          return;
        }
        throw new Error(data.error || `Conversion failed (${res.status})`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?([^";\n]+)"?/);
      const name = match ? match[1].trim() : "document.epub";
      setPreviewFile(blob);
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = name;
      a.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      setConvertError(e instanceof Error ? e.message : "Conversion failed");
    } finally {
      setConverting(false);
    }
  }, [file, conversionOptions, coverFile]);

  return (
    <div className="w-full max-w-lg space-y-6">
      <label className="block">
        <span className="sr-only">Choose file</span>
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`
            relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10
            transition-colors duration-150
            ${isDragging
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-zinc-300 bg-zinc-50/80 hover:border-zinc-400 hover:bg-zinc-100/80 dark:border-zinc-600 dark:bg-zinc-900/50 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/50"
            }
          `}
        >
          <input
            type="file"
            accept={ACCEPTED_STRING}
            onChange={onInputChange}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Upload DOCX, TXT or PDF file"
          />
          <span className="mb-2 text-4xl" aria-hidden>
            📄
          </span>
          <p className="text-center text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {isDragging ? "Drop file here" : "Drag and drop your file here"}
          </p>
          <p className="mt-1 text-center text-xs text-zinc-500 dark:text-zinc-500">
            or click to browse — {ACCEPTED_STRING}
          </p>
        </div>
      </label>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
        >
          {error}
        </div>
      )}

      {convertError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
        >
          {convertError === "login" ? (
            <span>Login required. Please sign in to convert files.</span>
          ) : convertError === "limit" ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>Monthly conversion limit reached.</span>
              <Link
                href="/pricing"
                className="shrink-0 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-red-950"
              >
                View plans
              </Link>
            </div>
          ) : (
            convertError
          )}
        </div>
      )}

      {file && (
        <>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Uploaded file
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="min-w-0 truncate font-medium text-zinc-900 dark:text-zinc-100">
                {file.name}
              </p>
              <span className="shrink-0 rounded bg-zinc-100 px-2 py-1 font-mono text-sm text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                {formatBytes(file.size)}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={clearFile}
                className="text-sm text-zinc-500 underline underline-offset-2 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Remove file
              </button>
            </div>
          </div>

          {canConvertToEpub(file) && (
            <>
              <ConversionSettings
                options={conversionOptions}
                onChange={setConversionOptions}
                coverFile={coverFile}
                onCoverFileChange={setCoverFile}
              />
              <div>
                <button
                  type="button"
                  onClick={convertToEpub}
                  disabled={converting}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {converting ? "Converting…" : "Convert to EPUB"}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {previewFile && (
        <div className="mt-6 w-full max-w-3xl">
          <EpubPreview file={previewFile} />
        </div>
      )}
    </div>
  );
}
