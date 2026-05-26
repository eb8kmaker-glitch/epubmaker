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
} from "@/app/lib/bookModel";
import { buildEpubFromBook } from "@/app/lib/epubBuilder";
import ChapterSidebar from "./ChapterSidebar";
import BlockCanvas from "./BlockCanvas";
import PreviewPanel from "./PreviewPanel";
import MetaPanel from "./MetaPanel";
import { Divider, SpinIcon, CheckIcon } from "./EditorMicro";
import { topBtnSt } from "./editorShared";
import ConvertSideAd from "@/app/components/ads/ConvertSideAd";

type RightPanel = "preview" | "meta";

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
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep activeChapterId valid
  useEffect(() => {
    if (!book.chapters.find((c) => c.id === activeChapterId)) {
      setActiveChapterId(book.chapters[0]?.id ?? "");
    }
  }, [book.chapters, activeChapterId]);

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

      {/* ── Main 3-panel area ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* 좌측 세로 광고 — 1400px 이상에서만 노출 (CSS 제어) */}
        <ConvertSideAd />

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
            width: 300,
            flexShrink: 0,
            borderLeft: "1px solid var(--lib-border)",
            display: "flex",
            flexDirection: "column",
            background: "var(--lib-bg-2)",
            overflow: "hidden",
          }}
        >
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
