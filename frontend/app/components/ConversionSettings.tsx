"use client";

export type StylePreset = "default" | "book" | "novel" | "academic";

export type MetadataLanguage = "ko" | "en" | "ja" | "zh";

export interface ConversionOptions {
  toc: boolean;
  tocDepth: number;
  epubVersion: "epub3" | "epub2";
  title: string;
  author: string;
  language: MetadataLanguage;
  publisher: string;
  date: string;
  style: StylePreset;
}

const DEFAULT_OPTIONS: ConversionOptions = {
  toc: true,
  tocDepth: 3,
  epubVersion: "epub3",
  title: "",
  author: "",
  language: "ko",
  publisher: "",
  date: "",
  style: "default",
};

const COVER_ACCEPT = "image/jpeg,image/png";

interface ConversionSettingsProps {
  options: ConversionOptions;
  onChange: (options: ConversionOptions) => void;
  coverFile: File | null;
  onCoverFileChange: (file: File | null) => void;
}

export default function ConversionSettings({
  options,
  onChange,
  coverFile,
  onCoverFileChange,
}: ConversionSettingsProps) {
  const setOption = <K extends keyof ConversionOptions>(
    key: K,
    value: ConversionOptions[K]
  ) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80">
      <h3 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        Conversion Settings
      </h3>

      <div className="space-y-4">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={options.toc}
            onChange={(e) => setOption("toc", e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-700"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            Include Table of Contents
          </span>
        </label>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            TOC Depth
          </label>
          <select
            value={options.tocDepth}
            onChange={(e) => setOption("tocDepth", Number(e.target.value) as 1 | 2 | 3)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            EPUB Version
          </label>
          <select
            value={options.epubVersion}
            onChange={(e) => setOption("epubVersion", e.target.value as "epub3" | "epub2")}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
          >
            <option value="epub3">EPUB 3</option>
            <option value="epub2">EPUB 2</option>
          </select>
        </div>

        <p className="border-t border-zinc-200 pt-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
          Metadata
        </p>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Title
          </label>
          <input
            type="text"
            value={options.title}
            onChange={(e) => setOption("title", e.target.value)}
            placeholder="Book title"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Author
          </label>
          <input
            type="text"
            value={options.author}
            onChange={(e) => setOption("author", e.target.value)}
            placeholder="Author name"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Language
          </label>
          <select
            value={options.language}
            onChange={(e) => setOption("language", e.target.value as ConversionOptions["language"])}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
          >
            <option value="ko">Korean (ko)</option>
            <option value="en">English (en)</option>
            <option value="ja">Japanese (ja)</option>
            <option value="zh">Chinese (zh)</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Publisher
          </label>
          <input
            type="text"
            value={options.publisher}
            onChange={(e) => setOption("publisher", e.target.value)}
            placeholder="Publisher name"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Date
          </label>
          <input
            type="text"
            value={options.date}
            onChange={(e) => setOption("date", e.target.value)}
            placeholder="e.g. 2024-01-15"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Style Preset
          </label>
          <select
            value={options.style}
            onChange={(e) => setOption("style", e.target.value as ConversionOptions["style"])}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
          >
            <option value="default">Default</option>
            <option value="book">Book</option>
            <option value="novel">Novel</option>
            <option value="academic">Academic</option>
          </select>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Cover Image
          </p>
          {!coverFile ? (
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="file"
                accept={COVER_ACCEPT}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onCoverFileChange(f);
                  e.target.value = "";
                }}
                className="text-sm text-zinc-600 file:mr-2 file:rounded file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-300 dark:hover:file:bg-emerald-900/50"
              />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                JPEG or PNG
              </span>
            </label>
          ) : (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700/50">
              <span className="min-w-0 truncate text-sm text-zinc-700 dark:text-zinc-300">
                {coverFile.name}
              </span>
              <button
                type="button"
                onClick={() => onCoverFileChange(null)}
                className="shrink-0 text-sm text-zinc-500 underline underline-offset-2 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_OPTIONS };
