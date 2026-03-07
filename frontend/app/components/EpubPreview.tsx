"use client";

import ePub, { type Book, type NavItem, type Rendition } from "epubjs";
import { useCallback, useEffect, useRef, useState } from "react";

const VIEWER_HEIGHT = 600;
const SIDEBAR_WIDTH = 250;

export default function EpubPreview({ file }: { file: Blob }) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<Book | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toc, setToc] = useState<NavItem[]>([]);
  const [currentHref, setCurrentHref] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(100);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (!file || !viewerRef.current) return;

    setLoading(true);
    setError(null);
    setToc([]);
    setCurrentHref(null);
    let aborted = false;

    const reader = new FileReader();
    reader.onload = () => {
      if (aborted) return;
      const arrayBuffer = reader.result as ArrayBuffer;
      if (!arrayBuffer || !viewerRef.current) {
        setLoading(false);
        return;
      }
      try {
        const book = ePub(arrayBuffer);
        bookRef.current = book;
        const rendition = book.renderTo(viewerRef.current, {
          width: "100%",
          height: VIEWER_HEIGHT,
          spread: "none",
        });
        renditionRef.current = rendition;

        rendition.on("relocated", (location: { start?: { href?: string } }) => {
          if (!aborted && location?.start?.href != null) {
            setCurrentHref(location.start.href);
          }
        });

        book.loaded.navigation.then((nav) => {
          if (!aborted) setToc(nav.toc || []);
        });

        rendition.display().then(
          () => {
            if (!aborted) setLoading(false);
          },
          (err: unknown) => {
            if (!aborted) {
              setError(err instanceof Error ? err.message : "Failed to load EPUB");
              setLoading(false);
            }
          }
        );
      } catch (err) {
        if (!aborted) {
          setError(err instanceof Error ? err.message : "Failed to load EPUB");
          setLoading(false);
        }
      }
    };
    reader.onerror = () => {
      if (!aborted) {
        setError("Failed to read file");
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);

    return () => {
      aborted = true;
      try {
        renditionRef.current?.destroy();
        renditionRef.current = null;
        bookRef.current?.destroy();
        bookRef.current = null;
      } catch {
        // ignore cleanup errors
      }
    };
  }, [file]);

  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.fontSize(`${fontSize}%`);
    }
  }, [fontSize]);

  useEffect(() => {
    if (!renditionRef.current) return;
    if (darkMode) {
      renditionRef.current.themes.override("background", "#111");
      renditionRef.current.themes.override("color", "#fff");
    } else {
      renditionRef.current.themes.override("background", "#ffffff");
      renditionRef.current.themes.override("color", "#000000");
    }
  }, [darkMode]);

  const goPrev = useCallback(() => {
    renditionRef.current?.prev();
  }, []);

  const goNext = useCallback(() => {
    renditionRef.current?.next();
  }, []);

  const goToHref = useCallback((href: string) => {
    renditionRef.current?.display(href);
  }, []);

  const isCurrentHref = useCallback(
    (itemHref: string) =>
      currentHref != null &&
      (currentHref === itemHref ||
        currentHref.split("#")[0] === itemHref.split("#")[0]),
    [currentHref]
  );

  const renderTocItem = (item: NavItem, depth = 0) => {
    const isCurrent = isCurrentHref(item.href);
    return (
      <div key={item.id || item.href || item.label}>
        <button
          type="button"
          onClick={() => goToHref(item.href)}
          className="w-full cursor-pointer text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          style={{
            paddingLeft: `${12 + depth * 12}px`,
            paddingTop: 6,
            paddingBottom: 6,
            fontWeight: isCurrent ? "bold" : "normal",
          }}
        >
          <span
            className={
              isCurrent ? "text-blue-600 dark:text-blue-400" : "text-zinc-700 dark:text-zinc-300"
            }
          >
            {item.label}
          </span>
        </button>
        {item.subitems?.map((sub) => renderTocItem(sub, depth + 1))}
      </div>
    );
  };

  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 dark:border-zinc-700">
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          EPUB Preview
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.max(80, s - 10))}
              className="rounded px-2 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              title="Decrease font size"
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setFontSize(100)}
              className="rounded px-2 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              title="Reset font size"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.min(160, s + 10))}
              className="rounded px-2 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              title="Increase font size"
            >
              A+
            </button>
          </div>
          <button
            type="button"
            onClick={() => setDarkMode((d) => !d)}
            className="rounded px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? "☀ Light" : "🌙 Dark"}
          </button>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={goPrev}
              className="rounded px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      <div className="flex" style={{ height: `${VIEWER_HEIGHT}px` }}>
        <aside
          className="shrink-0 overflow-y-auto border-r border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-700 dark:bg-zinc-950/50"
          style={{ width: `${SIDEBAR_WIDTH}px` }}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Contents
          </p>
          <div className="flex flex-col gap-0.5">
            {toc.map((item) => renderTocItem(item))}
          </div>
        </aside>
        <div className="relative min-w-0 flex-1 overflow-hidden bg-zinc-50 dark:bg-zinc-950">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-100/90 dark:bg-zinc-900/90">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Loading…
              </span>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <p className="text-center text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
          )}
          <div
            ref={viewerRef}
            className="h-full w-full"
            style={{ visibility: loading || error ? "hidden" : "visible" }}
          />
        </div>
      </div>
    </div>
  );
}
