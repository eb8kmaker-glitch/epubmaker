"use client";
/**
 * BookEditor — 3-panel EPUB editor
 *
 *  ┌──────────────────────────────────────────────────────────────┐
 *  │ TOPBAR (back · title · autosave · preview toggle · export)  │
 *  ├──────────────┬───────────────────────────────┬──────────────┤
 *  │ LEFT (240px) │ CENTER (flex)                 │ RIGHT (300px)│
 *  │ Chapter list │ Block canvas (selected chap.) │ Preview/Meta │
 *  └──────────────┴───────────────────────────────┴──────────────┘
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  type BookModel, type BookMeta, type Chapter, type Block,
  uid, newChapter, splitChapter, mergeChapters,
  chapterCharCount, estimatePages,
} from "@/app/lib/bookModel";
import { buildEpubFromBook } from "@/app/lib/epubBuilder";
import ChapterSidebar from "./ChapterSidebar";
import BlockCanvas from "./BlockCanvas";
import PreviewPanel from "./PreviewPanel";
import MetaPanel from "./MetaPanel";
import FindReplacePanel from "./FindReplacePanel";
import type { SearchMatch } from "@/app/lib/findReplace";
import { Divider, SpinIcon, CheckIcon } from "./EditorMicro";
import { topBtnSt } from "./editorShared";
type RightPanel = "preview" | "meta";

// Switch to the match's chapter, then scroll + highlight the occurrence in the DOM.
function highlightMatch(match: SearchMatch) {
  const wrap = document.querySelector(`[data-block-id="${match.blockId}"]`) as HTMLElement | null;
  if (!wrap) return;
  const el = (wrap.querySelector(".be-editable") as HTMLElement | null) ?? wrap;
  el.scrollIntoView({ block: "center", behavior: "smooth" });
  try {
    const range = document.createRange();
    const start = match.start;
    const end = match.start + match.length;
    let cum = 0, started = false, ended = false;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode() as Text | null;
    while (node) {
      const len = (node.nodeValue ?? "").length;
      if (!started && start >= cum && start <= cum + len) { range.setStart(node, start - cum); started = true; }
      if (started && end <= cum + len) { range.setEnd(node, end - cum); ended = true; break; }
      cum += len;
      node = walker.nextNode() as Text | null;
    }
    if (started && ended) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  } catch { /* selection is best-effort; the flash below is the reliable cue */ }
  wrap.style.transition = "box-shadow 0.2s ease";
  wrap.style.borderRadius = "8px";
  wrap.style.boxShadow = "0 0 0 2px var(--lib-wood)";
  window.setTimeout(() => { wrap.style.boxShadow = ""; }, 1400);
}

interface Props {
  book: BookModel;
  onBookChange: (book: BookModel) => void;
  onBack: () => void;
  onReconvert?: () => void;
  reconverting?: boolean;
}

export default function BookEditor({
  book, onBookChange, onBack, onReconvert, reconverting,
}: Props) {
  const t = useTranslations("Editor");
  const [activeChapterId, setActiveChapterId] = useState<string>(
    book.chapters[0]?.id ?? "",
  );
  const [rightPanel, setRightPanel] = useState<RightPanel>("preview");
  const [exporting, setExporting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [rightPanelWidth, setRightPanelWidth] = useState(300);
  const [stats, setStats] = useState({ total: 0, current: 0, pages: 0 });
  const [findOpen, setFindOpen] = useState(false);
  const resizeDragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const handleResizeMouseDown = useCallback((e: { clientX: number; preventDefault: () => void }) => {
    e.preventDefault();
    resizeDragRef.current = { startX: e.clientX, startWidth: rightPanelWidth };
    const onMove = (ev: MouseEvent) => {
      if (!resizeDragRef.current) return;
      const delta = resizeDragRef.current.startX - ev.clientX;
      setRightPanelWidth(Math.min(800, Math.max(280, resizeDragRef.current.startWidth + delta)));
    };
    const onUp = () => {
      resizeDragRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [rightPanelWidth]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep activeChapterId valid
  useEffect(() => {
    if (!book.chapters.find((c) => c.id === activeChapterId)) {
      setActiveChapterId(book.chapters[0]?.id ?? "");
    }
  }, [book.chapters, activeChapterId]);

  // Character/page stats — debounced so typing doesn't recompute on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      const total = book.chapters.reduce((sum, c) => sum + chapterCharCount(c), 0);
      const cur = book.chapters.find((c) => c.id === activeChapterId);
      setStats({
        total,
        current: cur ? chapterCharCount(cur) : 0,
        pages: estimatePages(total, book.meta.language),
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [book, activeChapterId]);

  // Ctrl/Cmd+F opens the find/replace bar.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        setFindOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleFindNavigate = useCallback((match: SearchMatch) => {
    setActiveChapterId(match.chapterId);
    // Wait for the chapter switch to render, then highlight.
    requestAnimationFrame(() => requestAnimationFrame(() => highlightMatch(match)));
  }, []);

  const triggerSave = useCallback(() => {
    setSaveStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 800);
  }, []);

  const updateBook = useCallback(
    (updater: (b: BookModel) => BookModel) => {
      onBookChange(updater(book));
      triggerSave();
    },
    [book, onBookChange, triggerSave],
  );

  const activeChapter = book.chapters.find((c) => c.id === activeChapterId) ?? book.chapters[0];

  const updateChapter = useCallback(
    (id: string, updater: (c: Chapter) => Chapter) => {
      updateBook((b) => ({
        ...b,
        chapters: b.chapters.map((c) => (c.id === id ? updater(c) : c)),
      }));
    },
    [updateBook],
  );

  const addChapter = () => {
    const ch = newChapter(t("newChapterTitle"));
    updateBook((b) => ({ ...b, chapters: [...b.chapters, ch] }));
    setActiveChapterId(ch.id);
  };

  const deleteChapter = (id: string) => {
    if (book.chapters.length <= 1) return;
    const idx = book.chapters.findIndex((c) => c.id === id);
    const nextId = book.chapters[idx === 0 ? 1 : idx - 1]?.id ?? "";
    updateBook((b) => ({ ...b, chapters: b.chapters.filter((c) => c.id !== id) }));
    setActiveChapterId(nextId);
  };

  const reorderChapters = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    updateBook((b) => {
      const chs = [...b.chapters];
      const [moved] = chs.splice(fromIdx, 1);
      chs.splice(toIdx, 0, moved);
      return { ...b, chapters: chs };
    });
  };

  const handleSplit = (blockIndex: number) => {
    updateBook((b) => ({
      ...b,
      chapters: splitChapter(b.chapters, activeChapterId, blockIndex),
    }));
  };

  const handleMerge = (id: string) => {
    const idx = book.chapters.findIndex((c) => c.id === id);
    if (idx <= 0) return;
    const prevId = book.chapters[idx - 1].id; // merged result keeps prev's id
    updateBook((b) => ({ ...b, chapters: mergeChapters(b.chapters, id) }));
    setActiveChapterId(prevId);
  };

  const updateBlocks = useCallback(
    (blocks: Block[]) => {
      updateChapter(activeChapterId, (c) => ({ ...c, blocks }));
    },
    [activeChapterId, updateChapter],
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      const { blob, filename } = await buildEpubFromBook(book);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setExporting(false);
    }
  };

  const navbarH = 60;
  const topbarH = 52;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        top: navbarH,
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
          height: topbarH,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 16px",
          borderBottom: "1px solid var(--lib-border)",
          background: "var(--lib-bg-2)",
        }}
      >
        <button type="button" onClick={onBack} style={topBtnSt}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {t("back")}
        </button>

        <Divider />

        <input
          type="text"
          value={book.meta.title}
          onChange={(e) =>
            updateBook((b) => ({ ...b, meta: { ...b.meta, title: e.target.value } }))
          }
          placeholder={t("untitled")}
          style={{
            flex: 1, minWidth: 0, maxWidth: 320,
            background: "transparent", border: "none", outline: "none",
            fontSize: 14, fontWeight: 600, color: "var(--lib-ink)",
            fontFamily: "var(--font-serif), Georgia, serif",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}
        />

        <div style={{ flex: 1 }} />

        {saveStatus !== "idle" && (
          <span style={{
            fontSize: 11, color: saveStatus === "saved" ? "#16a34a" : "var(--lib-dust)",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            {saveStatus === "saving" ? (
              <><SpinIcon size={10} />{t("saving")}</>
            ) : (
              <><CheckIcon size={10} />{t("saved")}</>
            )}
          </span>
        )}

        {onReconvert && (
          <button type="button" onClick={onReconvert} disabled={reconverting} style={{ ...topBtnSt, opacity: reconverting ? 0.6 : 1 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: reconverting ? "be-spin 1s linear infinite" : "none" }} aria-hidden>
              <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {reconverting ? t("reconverting") : t("reconvert")}
          </button>
        )}

        <div style={{ display: "flex", borderRadius: 7, border: "1px solid var(--lib-border)", overflow: "hidden" }}>
          {(["preview", "meta"] as RightPanel[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setRightPanel(p)}
              style={{
                padding: "5px 12px", border: "none",
                background: rightPanel === p ? "var(--lib-bg-3)" : "transparent",
                color: rightPanel === p ? "var(--lib-ink)" : "var(--lib-dust)",
                fontSize: 12, fontWeight: rightPanel === p ? 600 : 400,
                cursor: "pointer", transition: "all 0.15s ease",
                fontFamily: "var(--font-sans), system-ui, sans-serif",
              }}
            >
              {p === "preview" ? t("preview") : t("settings")}
            </button>
          ))}
        </div>

        <button
          type="button"
          data-testid="editor-download-btn"
          onClick={handleExport}
          disabled={exporting}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "8px 16px", borderRadius: 8, border: "none",
            background: "var(--lib-wood-dim)", color: "#F8F5F0",
            fontSize: 13, fontWeight: 600, cursor: exporting ? "wait" : "pointer",
            opacity: exporting ? 0.7 : 1,
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            boxShadow: "0 2px 8px rgba(0,0,0,0.14)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => { if (!exporting) e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          {exporting ? <SpinIcon size={14} /> : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          )}
          {exporting ? t("generating") : t("downloadEpub")}
        </button>
      </div>

      {/* ── Find / Replace bar (pinned below topbar) ── */}
      {findOpen && (
        <FindReplacePanel
          book={book}
          onBookChange={(b) => updateBook(() => b)}
          onNavigate={handleFindNavigate}
          onClose={() => setFindOpen(false)}
        />
      )}

      {/* ── Main 3-panel area ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        <ChapterSidebar
          chapters={book.chapters}
          activeId={activeChapterId}
          onSelect={setActiveChapterId}
          onAdd={addChapter}
          onDelete={deleteChapter}
          onRename={(id, title) => updateChapter(id, (c) => ({ ...c, title }))}
          onToggleCollapse={(id) =>
            updateChapter(id, (c) => ({ ...c, collapsed: !c.collapsed }))
          }
          onMerge={handleMerge}
          onReorder={reorderChapters}
          stats={stats}
        />

        <BlockCanvas
          chapter={activeChapter}
          onBlocksChange={updateBlocks}
          onChapterTitleChange={(title) =>
            updateChapter(activeChapterId, (c) => ({ ...c, title }))
          }
          onSplit={handleSplit}
        />

        <div
          className="be-right-panel"
          style={{
            width: rightPanelWidth,
            flexShrink: 0,
            borderLeft: "1px solid var(--lib-border)",
            display: "flex",
            flexDirection: "column",
            background: "var(--lib-bg-2)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Resize handle on left edge */}
          <div
            onMouseDown={handleResizeMouseDown}
            style={{
              position: "absolute",
              left: 0, top: 0,
              width: 6, height: "100%",
              cursor: "col-resize",
              zIndex: 10,
            }}
            title="패널 너비 조절"
          />
          {rightPanel === "preview" ? (
            <PreviewPanel chapter={activeChapter} style={book.meta.style} customCss={book.meta.customCss} />
          ) : (
            <MetaPanel meta={book.meta} onChange={(meta) => updateBook((b) => ({ ...b, meta }))} />
          )}
        </div>
      </div>

      <style>{`
        @keyframes be-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes be-fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 900px) { .be-right-panel { display: none !important; } }
        @media (max-width: 660px) { .be-chapter-sidebar { display: none !important; } }

        /* 좌측 세로 광고: 1400px 미만에서 완전히 숨김 (레이아웃 변화 없음) */
        .convert-side-ad {
          display: none;
        }
        @media (min-width: 1400px) {
          .convert-side-ad {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 180px;
            min-width: 180px;
            flex-shrink: 0;
            border-right: 1px solid var(--lib-border);
            background: var(--lib-bg-2);
            padding: 20px 10px;
            overflow-y: auto;
            overflow-x: hidden;
          }
        }
      `}</style>
    </div>
  );
}
