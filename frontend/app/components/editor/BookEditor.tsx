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

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  BookModel,
  BookMeta,
  Chapter,
  Block,
  TextBlock,
  ImageBlock,
  BlockType,
  uid,
  newChapter,
  splitChapter,
  mergeChapters,
} from "@/app/lib/bookModel";
import { buildEpubFromBook } from "@/app/lib/epubBuilder";
import { EPUB_STYLES } from "@/app/lib/epubStyles";

// ── Types ────────────────────────────────────────────────────────────────────

type RightPanel = "preview" | "meta";

interface Props {
  book: BookModel;
  onBookChange: (book: BookModel) => void;
  onBack: () => void;
  /** If provided, also offer "reconvert from source" */
  onReconvert?: () => void;
  reconverting?: boolean;
}

// ── BookEditor ────────────────────────────────────────────────────────────────

export default function BookEditor({
  book,
  onBookChange,
  onBack,
  onReconvert,
  reconverting,
}: Props) {
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

  // Auto-save indicator
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

  // ── Chapter operations ─────────────────────────────────────────────────────

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
    const ch = newChapter();
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
    updateBook((b) => ({ ...b, chapters: mergeChapters(b.chapters, id) }));
  };

  // ── Block operations (within active chapter) ──────────────────────────────

  const updateBlocks = useCallback(
    (blocks: Block[]) => {
      updateChapter(activeChapterId, (c) => ({ ...c, blocks }));
    },
    [activeChapterId, updateChapter],
  );

  // ── Export ────────────────────────────────────────────────────────────────

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

  // ── Styles ────────────────────────────────────────────────────────────────

  const topbarH = 52;
  const navbarH = 60;
  const totalTop = navbarH + topbarH;

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
        {/* Back */}
        <button
          type="button"
          onClick={onBack}
          style={topBtnSt}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          나가기
        </button>

        <Divider />

        {/* Book title (editable inline) */}
        <input
          type="text"
          value={book.meta.title}
          onChange={(e) =>
            updateBook((b) => ({ ...b, meta: { ...b.meta, title: e.target.value } }))
          }
          placeholder="제목 없음"
          style={{
            flex: 1,
            minWidth: 0,
            maxWidth: 320,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--lib-ink)",
            fontFamily: "var(--font-serif), Georgia, serif",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        />

        <div style={{ flex: 1 }} />

        {/* Save status */}
        {saveStatus !== "idle" && (
          <span style={{
            fontSize: 11, color: saveStatus === "saved" ? "#16a34a" : "var(--lib-dust)",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            {saveStatus === "saving" ? (
              <><SpinIcon size={10} />저장 중</>
            ) : (
              <><CheckIcon size={10} />저장됨</>
            )}
          </span>
        )}

        {/* Reconvert (if source available) */}
        {onReconvert && (
          <button type="button" onClick={onReconvert} disabled={reconverting} style={{ ...topBtnSt, opacity: reconverting ? 0.6 : 1 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: reconverting ? "be-spin 1s linear infinite" : "none" }} aria-hidden>
              <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {reconverting ? "재변환 중…" : "재변환"}
          </button>
        )}

        {/* Right panel toggle */}
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
              {p === "preview" ? "미리보기" : "설정"}
            </button>
          ))}
        </div>

        {/* Export */}
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
          {exporting ? "생성 중…" : "EPUB 다운로드"}
        </button>
      </div>

      {/* ── Main 3-panel area ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── LEFT: Chapter sidebar ── */}
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

        {/* ── CENTER: Block canvas ── */}
        <BlockCanvas
          chapter={activeChapter}
          onBlocksChange={updateBlocks}
          onChapterTitleChange={(title) =>
            updateChapter(activeChapterId, (c) => ({ ...c, title }))
          }
          onSplit={handleSplit}
        />

        {/* ── RIGHT: Preview or Meta ── */}
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
      `}</style>
    </div>
  );
}

// ── ChapterSidebar ─────────────────────────────────────────────────────────────

interface SidebarProps {
  chapters: Chapter[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onToggleCollapse: (id: string) => void;
  onMerge: (id: string) => void;
  onReorder: (from: number, to: number) => void;
}

function ChapterSidebar({
  chapters, activeId, onSelect, onAdd, onDelete, onRename, onToggleCollapse, onMerge, onReorder,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const startEdit = (ch: Chapter) => {
    setEditingId(ch.id);
    setEditValue(ch.title);
  };

  const commitEdit = () => {
    if (editingId && editValue.trim()) onRename(editingId, editValue.trim());
    setEditingId(null);
  };

  return (
    <aside
      className="be-chapter-sidebar"
      style={{
        width: 240,
        flexShrink: 0,
        borderRight: "1px solid var(--lib-border)",
        background: "var(--lib-bg-2)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{
        padding: "12px 14px 10px",
        borderBottom: "1px solid var(--lib-border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--lib-dust)" }}>
          챕터 ({chapters.length})
        </span>
        <button
          type="button"
          onClick={onAdd}
          title="새 챕터 추가"
          style={{
            width: 24, height: 24, borderRadius: 6, border: "none",
            background: "var(--lib-bg-3)", color: "var(--lib-wood)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--lib-wood-dim)"; e.currentTarget.style.color = "#F8F5F0"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--lib-bg-3)"; e.currentTarget.style.color = "var(--lib-wood)"; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Chapter list */}
      <ul style={{ flex: 1, overflowY: "auto", padding: "6px 0", listStyle: "none", margin: 0 }}>
        {chapters.map((ch, idx) => (
          <li
            key={ch.id}
            draggable
            onDragStart={() => setDraggingIdx(idx)}
            onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
            onDrop={() => {
              if (draggingIdx !== null) onReorder(draggingIdx, idx);
              setDraggingIdx(null); setDragOverIdx(null);
            }}
            onDragEnd={() => { setDraggingIdx(null); setDragOverIdx(null); }}
            style={{
              margin: "2px 6px",
              borderRadius: 8,
              background: ch.id === activeId ? "var(--lib-bg-3)" : "transparent",
              border: dragOverIdx === idx ? "1.5px dashed var(--lib-wood)" : "1.5px solid transparent",
              opacity: draggingIdx === idx ? 0.4 : 1,
              transition: "all 0.12s ease",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "7px 10px",
              }}
              onClick={() => onSelect(ch.id)}
            >
              {/* Drag handle */}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--lib-border-2)" strokeWidth="2" style={{ flexShrink: 0, cursor: "grab" }} aria-hidden>
                <circle cx="9" cy="7" r="1" fill="currentColor" /><circle cx="15" cy="7" r="1" fill="currentColor" />
                <circle cx="9" cy="12" r="1" fill="currentColor" /><circle cx="15" cy="12" r="1" fill="currentColor" />
                <circle cx="9" cy="17" r="1" fill="currentColor" /><circle cx="15" cy="17" r="1" fill="currentColor" />
              </svg>

              {/* Chapter number */}
              <span style={{ fontSize: 10, color: "var(--lib-dust)", fontFamily: "monospace", flexShrink: 0 }}>
                {String(idx + 1).padStart(2, "0")}
              </span>

              {/* Title (editable on double-click) */}
              {editingId === ch.id ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingId(null); }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    flex: 1, minWidth: 0, fontSize: 12, fontWeight: 500,
                    color: "var(--lib-ink)", background: "var(--lib-bg)",
                    border: "1px solid var(--lib-wood-dim)", borderRadius: 4,
                    padding: "2px 6px", outline: "none",
                    fontFamily: "var(--font-sans), system-ui, sans-serif",
                  }}
                />
              ) : (
                <span
                  onDoubleClick={(e) => { e.stopPropagation(); startEdit(ch); }}
                  style={{
                    flex: 1, minWidth: 0, fontSize: 12, fontWeight: ch.id === activeId ? 600 : 400,
                    color: ch.id === activeId ? "var(--lib-ink)" : "var(--lib-dusk)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    fontFamily: "var(--font-sans), system-ui, sans-serif",
                  }}
                >
                  {ch.title || "제목 없음"}
                </span>
              )}

              {/* Collapse toggle */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleCollapse(ch.id); }}
                title={ch.collapsed ? "펼치기" : "접기"}
                style={iconBtnSt}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ transition: "transform 0.2s", transform: ch.collapsed ? "rotate(-90deg)" : "rotate(0deg)" }} aria-hidden>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>

            {/* Chapter actions (when active) */}
            {ch.id === activeId && !ch.collapsed && (
              <div style={{
                display: "flex", gap: 4, padding: "0 10px 8px 28px",
                animation: "be-fadeIn 0.15s ease",
              }}>
                <ChipBtn onClick={() => startEdit(ch)}>이름 변경</ChipBtn>
                {idx > 0 && <ChipBtn onClick={() => onMerge(ch.id)}>이전 병합</ChipBtn>}
                {chapters.length > 1 && (
                  <ChipBtn
                    onClick={() => { if (confirm(`"${ch.title}" 챕터를 삭제하시겠어요?`)) onDelete(ch.id); }}
                    danger
                  >
                    삭제
                  </ChipBtn>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Footer hint */}
      <div style={{ padding: "8px 14px", borderTop: "1px solid var(--lib-border)" }}>
        <p style={{ fontSize: 10, color: "var(--lib-dust)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
          드래그로 챕터 순서 변경 · 더블클릭으로 이름 변경
        </p>
      </div>
    </aside>
  );
}

// ── BlockCanvas ───────────────────────────────────────────────────────────────

interface CanvasProps {
  chapter: Chapter;
  onBlocksChange: (blocks: Block[]) => void;
  onChapterTitleChange: (title: string) => void;
  onSplit: (blockIndex: number) => void;
}

function BlockCanvas({ chapter, onBlocksChange, onChapterTitleChange, onSplit }: CanvasProps) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [cmdMenuId, setCmdMenuId] = useState<string | null>(null);
  const [hoverBetween, setHoverBetween] = useState<number | null>(null);

  const updateBlock = (id: string, patch: Partial<Block>) => {
    onBlocksChange(chapter.blocks.map((b) => (b.id === id ? { ...b, ...patch } as Block : b)));
  };

  const addBlockAfter = (afterIndex: number, type: BlockType = "paragraph") => {
    const newBlock: Block = type === "image"
      ? { id: uid(), type: "image", src: "", alt: "", caption: "" }
      : { id: uid(), type, html: "" };
    const next = [...chapter.blocks];
    next.splice(afterIndex + 1, 0, newBlock);
    onBlocksChange(next);
    setTimeout(() => setFocusedId(newBlock.id), 10);
  };

  const deleteBlock = (id: string) => {
    if (chapter.blocks.length <= 1) {
      onBlocksChange([{ id: uid(), type: "paragraph", html: "" }]);
      return;
    }
    const idx = chapter.blocks.findIndex((b) => b.id === id);
    const focusNext = chapter.blocks[idx > 0 ? idx - 1 : 1]?.id ?? null;
    onBlocksChange(chapter.blocks.filter((b) => b.id !== id));
    if (focusNext) setTimeout(() => setFocusedId(focusNext), 10);
  };

  const changeBlockType = (id: string, type: BlockType) => {
    if (type === "image") {
      const b = chapter.blocks.find((b) => b.id === id);
      onBlocksChange(chapter.blocks.map((bl) =>
        bl.id === id ? { id, type: "image", src: "", alt: (bl as TextBlock).html?.replace(/<[^>]+>/g, "") ?? "", caption: "" } : bl
      ));
    } else {
      const b = chapter.blocks.find((b) => b.id === id);
      const html = b?.type !== "image" ? (b as TextBlock).html : "";
      onBlocksChange(chapter.blocks.map((bl) =>
        bl.id === id ? { id, type, html } as Block : bl
      ));
    }
    setCmdMenuId(null);
  };

  const handleImageDrop = (id: string, e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const src = URL.createObjectURL(file);
    updateBlock(id, { src } as Partial<ImageBlock>);
  };

  return (
    <main
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "40px 0 80px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "var(--lib-panel)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 660, padding: "0 24px" }}>

        {/* Chapter title */}
        <div style={{ marginBottom: 36 }}>
          <ContentEditable
            value={chapter.title}
            onChange={(html) => onChapterTitleChange(html.replace(/<[^>]+>/g, ""))}
            tag="h1"
            placeholder="챕터 제목을 입력하세요..."
            style={{
              fontSize: 30,
              fontWeight: 700,
              fontFamily: "var(--font-serif), Georgia, serif",
              color: "var(--lib-ink)",
              letterSpacing: "-0.02em",
              lineHeight: 1.25,
              outline: "none",
              border: "none",
              background: "transparent",
              width: "100%",
            }}
          />
          <div style={{ height: 2, background: "var(--lib-border)", marginTop: 12 }} />
        </div>

        {/* Blocks */}
        {chapter.blocks.map((block, idx) => (
          <div key={block.id} style={{ position: "relative" }}>

            {/* Insert zone between blocks */}
            <div
              style={{ height: 12, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              onMouseEnter={() => setHoverBetween(idx)}
              onMouseLeave={() => setHoverBetween(null)}
              onClick={() => addBlockAfter(idx - 1)}
            >
              {hoverBetween === idx && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, animation: "be-fadeIn 0.15s ease" }}>
                  <div style={{ flex: 1, height: 1, background: "var(--lib-wood-dim)", opacity: 0.4 }} />
                  <button type="button" style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "2px 10px", borderRadius: 20,
                    border: "1px solid var(--lib-wood-dim)",
                    background: "var(--lib-bg-2)", color: "var(--lib-wood)",
                    fontSize: 10, fontWeight: 600, cursor: "pointer",
                    fontFamily: "var(--font-sans), system-ui, sans-serif",
                  }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    블록 추가
                  </button>
                  <div style={{ flex: 1, height: 1, background: "var(--lib-wood-dim)", opacity: 0.4 }} />
                </div>
              )}
            </div>

            {/* Block row */}
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                borderRadius: 8,
                padding: "2px 0",
                transition: "background 0.1s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(0,0,0,0.02)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
            >
              {/* Block type indicator + actions (left gutter) */}
              <div style={{
                flexShrink: 0,
                width: 28,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                paddingTop: 6,
                opacity: focusedId === block.id ? 1 : 0,
                transition: "opacity 0.15s ease",
              }}
                className="be-block-gutter"
              >
                {/* Type button */}
                <button
                  type="button"
                  title="블록 타입 변경"
                  onClick={() => setCmdMenuId(cmdMenuId === block.id ? null : block.id)}
                  style={{
                    width: 22, height: 22, borderRadius: 5,
                    border: "1px solid var(--lib-border)",
                    background: "var(--lib-bg-2)", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 8, fontWeight: 700, color: "var(--lib-dust)",
                    letterSpacing: "0",
                  }}
                >
                  {BLOCK_TYPE_ICONS[block.type]}
                </button>
                {/* Delete */}
                <button
                  type="button"
                  title="블록 삭제"
                  onClick={() => deleteBlock(block.id)}
                  style={{
                    width: 22, height: 22, borderRadius: 5, border: "none",
                    background: "transparent", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--lib-dust)", transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--lib-dust)"; e.currentTarget.style.background = "transparent"; }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Command menu */}
              {cmdMenuId === block.id && (
                <div style={{
                  position: "absolute",
                  top: 0, left: 36,
                  zIndex: 50,
                  background: "var(--lib-bg)",
                  border: "1px solid var(--lib-border)",
                  borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  padding: 6,
                  display: "flex", flexDirection: "column", gap: 2,
                  minWidth: 160,
                  animation: "be-fadeIn 0.15s ease",
                }}>
                  {BLOCK_TYPES.map(({ type, label, hint }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => changeBlockType(block.id, type)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "6px 10px", borderRadius: 7, border: "none",
                        background: block.type === type ? "var(--lib-bg-3)" : "transparent",
                        cursor: "pointer", textAlign: "left",
                        transition: "background 0.1s ease",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--lib-bg-3)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = block.type === type ? "var(--lib-bg-3)" : "transparent"; }}
                    >
                      <span style={{ fontSize: 12, width: 16, textAlign: "center" }}>{BLOCK_TYPE_ICONS[type]}</span>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--lib-ink)", fontFamily: "var(--font-sans), system-ui, sans-serif", margin: 0 }}>{label}</p>
                        <p style={{ fontSize: 10, color: "var(--lib-dust)", fontFamily: "var(--font-sans), system-ui, sans-serif", margin: 0 }}>{hint}</p>
                      </div>
                    </button>
                  ))}
                  <div style={{ height: 1, background: "var(--lib-border)", margin: "2px 0" }} />
                  <button
                    type="button"
                    onClick={() => { onSplit(idx); setCmdMenuId(null); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "6px 10px", borderRadius: 7, border: "none",
                      background: "transparent", cursor: "pointer",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--lib-bg-3)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    <span style={{ fontSize: 12 }}>✂️</span>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--lib-ink)", fontFamily: "var(--font-sans), system-ui, sans-serif", margin: 0 }}>여기서 챕터 분할</p>
                      <p style={{ fontSize: 10, color: "var(--lib-dust)", fontFamily: "var(--font-sans), system-ui, sans-serif", margin: 0 }}>새 챕터로 분리</p>
                    </div>
                  </button>
                </div>
              )}

              {/* Block content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {block.type === "image" ? (
                  <ImageBlockView
                    block={block as ImageBlock}
                    focused={focusedId === block.id}
                    onChange={(patch) => updateBlock(block.id, patch)}
                    onFocus={() => setFocusedId(block.id)}
                    onDrop={(e) => handleImageDrop(block.id, e)}
                  />
                ) : (
                  <TextBlockView
                    block={block as TextBlock}
                    focused={focusedId === block.id}
                    onChange={(html) => updateBlock(block.id, { html } as Partial<TextBlock>)}
                    onFocus={() => { setFocusedId(block.id); setCmdMenuId(null); }}
                    onBlur={() => setFocusedId(null)}
                    onEnter={() => addBlockAfter(idx)}
                    onDelete={() => deleteBlock(block.id)}
                    onSlashCommand={() => setCmdMenuId(block.id)}
                  />
                )}
              </div>
            </div>
          </div>
        ))}

        {/* End spacer + add button */}
        <div
          style={{ marginTop: 20, display: "flex", justifyContent: "center" }}
          onMouseEnter={() => setHoverBetween(-1)}
          onMouseLeave={() => setHoverBetween(null)}
        >
          <button
            type="button"
            onClick={() => addBlockAfter(chapter.blocks.length - 1)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 18px", borderRadius: 24,
              border: "1px dashed var(--lib-border-2)",
              background: "transparent", color: "var(--lib-dust)",
              fontSize: 12, cursor: "pointer",
              fontFamily: "var(--font-sans), system-ui, sans-serif",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--lib-wood)"; e.currentTarget.style.color = "var(--lib-wood)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--lib-border-2)"; e.currentTarget.style.color = "var(--lib-dust)"; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            블록 추가 (또는 / 명령어)
          </button>
        </div>
      </div>

      {/* Dismiss command menu */}
      {cmdMenuId && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 49 }}
          onClick={() => setCmdMenuId(null)}
        />
      )}
    </main>
  );
}

// ── TextBlockView ─────────────────────────────────────────────────────────────

interface TextBlockViewProps {
  block: TextBlock;
  focused: boolean;
  onChange: (html: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onEnter: () => void;
  onDelete: () => void;
  onSlashCommand: () => void;
}

function TextBlockView({ block, focused, onChange, onFocus, onBlur, onEnter, onDelete, onSlashCommand }: TextBlockViewProps) {
  return (
    <ContentEditable
      value={block.html}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onEnter(); return; }
        if (e.key === "Backspace" && !e.currentTarget.innerHTML) { e.preventDefault(); onDelete(); return; }
        if (e.key === "/" && !e.currentTarget.innerHTML) { onSlashCommand(); }
      }}
      tag={BLOCK_TAG[block.type]}
      placeholder={BLOCK_PLACEHOLDER[block.type]}
      style={BLOCK_STYLES[block.type]}
      focused={focused}
    />
  );
}

// ── ImageBlockView ────────────────────────────────────────────────────────────

interface ImageBlockViewProps {
  block: ImageBlock;
  focused: boolean;
  onChange: (patch: Partial<ImageBlock>) => void;
  onFocus: () => void;
  onDrop: (e: React.DragEvent) => void;
}

function ImageBlockView({ block, focused, onChange, onFocus, onDrop }: ImageBlockViewProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  if (!block.src) {
    return (
      <div
        onClick={() => { onFocus(); inputRef.current?.click(); }}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          minHeight: 120,
          borderRadius: 10,
          border: "2px dashed var(--lib-border-2)",
          background: "var(--lib-bg-2)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 8,
          cursor: "pointer", padding: 24,
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--lib-wood)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--lib-border-2)"; }}
      >
        <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange({ src: URL.createObjectURL(f), alt: f.name });
          e.target.value = "";
        }} />
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--lib-dust)" strokeWidth="1.5" aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <p style={{ fontSize: 13, color: "var(--lib-dusk)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
          이미지 클릭하여 추가 또는 드래그
        </p>
        <p style={{ fontSize: 11, color: "var(--lib-dust)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
          JPEG · PNG · WebP
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <figure style={{ margin: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={block.src}
          alt={block.alt}
          style={{
            width: "100%", borderRadius: 10,
            display: "block",
            border: focused ? "2px solid var(--lib-wood-dim)" : "2px solid transparent",
            transition: "border-color 0.15s ease",
          }}
          onClick={onFocus}
        />
        {/* Alt text */}
        <input
          value={block.alt}
          onChange={(e) => onChange({ alt: e.target.value })}
          placeholder="이미지 설명 (접근성을 위해 입력하세요)..."
          style={{
            marginTop: 6, width: "100%", fontSize: 11,
            color: "var(--lib-dust)", background: "transparent",
            border: "none", borderBottom: "1px solid var(--lib-border)",
            outline: "none", padding: "2px 0",
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            boxSizing: "border-box",
          }}
        />
        {/* Caption */}
        <input
          value={block.caption}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="캡션 (선택)..."
          style={{
            marginTop: 4, width: "100%", fontSize: 12,
            color: "var(--lib-dusk)", background: "transparent",
            border: "none", outline: "none", padding: "2px 0",
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            boxSizing: "border-box",
          }}
        />
      </figure>
      {/* Remove button */}
      <button
        type="button"
        onClick={() => onChange({ src: "", alt: "", caption: "" })}
        style={{
          position: "absolute", top: 8, right: 8,
          width: 28, height: 28, borderRadius: 8,
          background: "rgba(0,0,0,0.5)", border: "none",
          color: "#fff", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

// ── ContentEditable ───────────────────────────────────────────────────────────
// Controlled contenteditable that avoids cursor-jump by NOT re-rendering while focused.

interface CEProps {
  value: string;
  onChange: (html: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  tag?: keyof JSX.IntrinsicElements;
  placeholder?: string;
  style?: React.CSSProperties;
  focused?: boolean;
}

function ContentEditable({ value, onChange, onFocus, onBlur, onKeyDown, tag = "div", placeholder = "", style = {}, focused }: CEProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isFocused = useRef(false);

  // Sync from state only when NOT focused (avoids cursor reset)
  useLayoutEffect(() => {
    if (!isFocused.current && ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
  });

  // Focus the element when `focused` prop becomes true
  useEffect(() => {
    if (focused && ref.current && document.activeElement !== ref.current) {
      ref.current.focus();
      // Move cursor to end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [focused]);

  const Tag = tag as "div";

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onFocus={() => { isFocused.current = true; onFocus?.(); }}
      onBlur={() => {
        isFocused.current = false;
        onChange(ref.current?.innerHTML ?? "");
        onBlur?.();
      }}
      onInput={() => { onChange(ref.current?.innerHTML ?? ""); }}
      onKeyDown={onKeyDown}
      style={{
        outline: "none",
        minHeight: "1.5em",
        lineHeight: 1.75,
        ...style,
      }}
      className="be-editable"
    />
  );
}

// ── PreviewPanel ──────────────────────────────────────────────────────────────

function PreviewPanel({ chapter, style, customCss }: { chapter: Chapter; style: string; customCss: string }) {
  const css = style === "custom" && customCss ? customCss : (EPUB_STYLES[style] ?? EPUB_STYLES.default ?? "");
  const [fontSize, setFontSize] = useState(16);
  const [darkMode, setDarkMode] = useState(false);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: ${fontSize}px;
          line-height: 1.8;
          padding: 32px 28px;
          background: ${darkMode ? "#1a1a1a" : "#fdfaf6"};
          color: ${darkMode ? "#e0d9ce" : "#2d2416"};
          max-width: 100%;
        }
        h1 { font-size: 1.6em; margin-bottom: 0.8em; font-weight: 700; }
        h2 { font-size: 1.25em; margin: 1.4em 0 0.6em; font-weight: 600; }
        h3 { font-size: 1.08em; margin: 1.2em 0 0.5em; font-weight: 600; }
        p  { margin-bottom: 0.9em; }
        blockquote { border-left: 3px solid ${darkMode ? "#666" : "#c4a882"}; padding-left: 16px; margin: 1em 0; color: ${darkMode ? "#aaa" : "#6b5b3e"}; font-style: italic; }
        img { max-width: 100%; border-radius: 6px; margin: 0.8em 0; }
        figure { margin: 1em 0; }
        figcaption { font-size: 0.85em; color: ${darkMode ? "#888" : "#9a8672"}; text-align: center; margin-top: 4px; }
        ${css}
      </style>
    </head>
    <body>
      <h1>${chapter.title}</h1>
      ${chapter.blocks.map((b) => {
        if (b.type === "paragraph") return `<p>${(b as TextBlock).html || "&nbsp;"}</p>`;
        if (b.type === "h2") return `<h2>${(b as TextBlock).html || "&nbsp;"}</h2>`;
        if (b.type === "h3") return `<h3>${(b as TextBlock).html || "&nbsp;"}</h3>`;
        if (b.type === "quote") return `<blockquote><p>${(b as TextBlock).html || "&nbsp;"}</p></blockquote>`;
        if (b.type === "image" && (b as ImageBlock).src) {
          const ib = b as ImageBlock;
          return `<figure><img src="${ib.src}" alt="${ib.alt}"/>${ib.caption ? `<figcaption>${ib.caption}</figcaption>` : ""}</figure>`;
        }
        return "";
      }).join("\n")}
    </body>
    </html>
  `;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Preview controls */}
      <div style={{
        padding: "10px 14px",
        borderBottom: "1px solid var(--lib-border)",
        display: "flex", alignItems: "center", gap: 8,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--lib-dust)", flex: 1 }}>
          미리보기
        </span>
        {/* Font size */}
        <button type="button" style={iconBtnSt} onClick={() => setFontSize((s) => Math.max(12, s - 1))} title="글자 줄이기">A-</button>
        <span style={{ fontSize: 10, color: "var(--lib-dust)", minWidth: 20, textAlign: "center" }}>{fontSize}</span>
        <button type="button" style={iconBtnSt} onClick={() => setFontSize((s) => Math.min(24, s + 1))} title="글자 키우기">A+</button>
        {/* Dark mode */}
        <button
          type="button"
          onClick={() => setDarkMode((d) => !d)}
          style={{
            ...iconBtnSt,
            background: darkMode ? "var(--lib-ink)" : "var(--lib-bg-3)",
            color: darkMode ? "#F8F5F0" : "var(--lib-dust)",
          }}
          title={darkMode ? "라이트 모드" : "다크 모드"}
        >
          {darkMode ? "☀" : "🌙"}
        </button>
      </div>

      {/* Kindle-style device frame */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 12px", display: "flex", justifyContent: "center", background: "var(--lib-bg-3)" }}>
        <div style={{
          width: "100%",
          maxWidth: 260,
          borderRadius: 12,
          boxShadow: "0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.08)",
          overflow: "hidden",
          border: "8px solid " + (darkMode ? "#111" : "#2c2c2c"),
          background: darkMode ? "#1a1a1a" : "#fdfaf6",
        }}>
          <iframe
            srcDoc={html}
            style={{ width: "100%", height: 400, border: "none", display: "block" }}
            title="EPUB 미리보기"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}

// ── MetaPanel ─────────────────────────────────────────────────────────────────

function MetaPanel({ meta, onChange }: { meta: BookMeta; onChange: (m: BookMeta) => void }) {
  const set = <K extends keyof BookMeta>(key: K, val: BookMeta[K]) =>
    onChange({ ...meta, [key]: val });

  const inputSt: React.CSSProperties = {
    width: "100%", padding: "8px 10px", borderRadius: 7,
    border: "1px solid var(--lib-border)", background: "var(--lib-bg)",
    fontSize: 13, color: "var(--lib-ink)", outline: "none",
    fontFamily: "var(--font-sans), system-ui, sans-serif",
    boxSizing: "border-box",
  };
  const labelSt: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
    color: "var(--lib-dust)", display: "block", marginBottom: 4,
    fontFamily: "var(--font-sans), system-ui, sans-serif",
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px" }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--lib-dust)", marginBottom: 16, fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
        책 설정
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div><label style={labelSt}>제목</label><input style={{ ...inputSt, fontFamily: "var(--font-serif), Georgia, serif", fontSize: 14 }} value={meta.title} onChange={(e) => set("title", e.target.value)} placeholder="책 제목" /></div>
        <div><label style={labelSt}>저자</label><input style={inputSt} value={meta.author} onChange={(e) => set("author", e.target.value)} placeholder="저자 이름" /></div>
        <div><label style={labelSt}>언어</label>
          <select style={inputSt} value={meta.language} onChange={(e) => set("language", e.target.value as BookMeta["language"])}>
            <option value="ko">한국어</option><option value="en">English</option>
            <option value="ja">日本語</option><option value="zh">中文</option>
          </select>
        </div>
        <div><label style={labelSt}>출판사</label><input style={inputSt} value={meta.publisher} onChange={(e) => set("publisher", e.target.value)} placeholder="출판사" /></div>
        <div><label style={labelSt}>날짜</label><input style={inputSt} value={meta.date} onChange={(e) => set("date", e.target.value)} placeholder="2024-01-01" /></div>

        <div style={{ height: 1, background: "var(--lib-border)" }} />

        <div><label style={labelSt}>EPUB 버전</label>
          <select style={inputSt} value={meta.epubVersion} onChange={(e) => set("epubVersion", e.target.value as BookMeta["epubVersion"])}>
            <option value="epub3">EPUB 3 (권장)</option><option value="epub2">EPUB 2</option>
          </select>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={meta.toc} onChange={(e) => set("toc", e.target.checked)} style={{ width: 14, height: 14, accentColor: "var(--lib-wood-dim)" }} />
          <span style={{ fontSize: 13, color: "var(--lib-ink)", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>목차(TOC) 포함</span>
        </label>

        <div style={{ height: 1, background: "var(--lib-border)" }} />

        <div>
          <label style={labelSt}>스타일 프리셋</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {(["default", "book", "novel", "academic"] as const).map((s) => (
              <button key={s} type="button" onClick={() => set("style", s)} style={{
                padding: "4px 12px", borderRadius: 20, fontSize: 11, border: "1.5px solid",
                borderColor: meta.style === s ? "var(--lib-wood-dim)" : "var(--lib-border)",
                background: meta.style === s ? "var(--lib-wood-dim)" : "transparent",
                color: meta.style === s ? "#F8F5F0" : "var(--lib-dusk)",
                cursor: "pointer", fontFamily: "var(--font-sans), system-ui, sans-serif",
                fontWeight: meta.style === s ? 600 : 400, transition: "all 0.15s ease",
              }}>
                {{ default: "기본", book: "도서", novel: "소설", academic: "학술" }[s]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Block type config ─────────────────────────────────────────────────────────

const BLOCK_TYPES: Array<{ type: BlockType; label: string; hint: string }> = [
  { type: "paragraph", label: "본문",     hint: "일반 단락 텍스트" },
  { type: "h2",        label: "소제목",   hint: "섹션 제목 (H2)" },
  { type: "h3",        label: "소소제목", hint: "하위 제목 (H3)" },
  { type: "quote",     label: "인용",     hint: "인용구" },
  { type: "image",     label: "이미지",   hint: "사진·그림 삽입" },
];

const BLOCK_TYPE_ICONS: Record<BlockType, string> = {
  paragraph: "¶",
  h2: "H2",
  h3: "H3",
  quote: "❝",
  image: "🖼",
};

const BLOCK_TAG: Record<Exclude<BlockType, "image">, string> = {
  paragraph: "p",
  h2: "h2",
  h3: "h3",
  quote: "blockquote",
};

const BLOCK_PLACEHOLDER: Record<Exclude<BlockType, "image">, string> = {
  paragraph: "내용을 입력하세요... ('/' 명령어)",
  h2: "소제목...",
  h3: "소소제목...",
  quote: "인용구를 입력하세요...",
};

const BLOCK_STYLES: Record<Exclude<BlockType, "image">, React.CSSProperties> = {
  paragraph: {
    fontSize: 15,
    lineHeight: 1.85,
    color: "var(--lib-ink)",
    fontFamily: "var(--font-serif), Georgia, serif",
    padding: "4px 0",
  },
  h2: {
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1.4,
    color: "var(--lib-ink)",
    fontFamily: "var(--font-serif), Georgia, serif",
    padding: "10px 0 4px",
  },
  h3: {
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 1.4,
    color: "var(--lib-ink)",
    fontFamily: "var(--font-serif), Georgia, serif",
    padding: "8px 0 4px",
  },
  quote: {
    fontSize: 15,
    lineHeight: 1.8,
    color: "var(--lib-dusk)",
    fontFamily: "var(--font-serif), Georgia, serif",
    fontStyle: "italic",
    borderLeft: "3px solid var(--lib-wood)",
    paddingLeft: 16,
    margin: "4px 0",
  },
};

// ── Shared micro-components ────────────────────────────────────────────────────

function Divider() {
  return <span style={{ width: 1, height: 16, background: "var(--lib-border)", flexShrink: 0 }} aria-hidden />;
}

function SpinIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ animation: "be-spin 1s linear infinite" }} aria-hidden>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ChipBtn({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 500,
        border: `1px solid ${danger ? "rgba(220,38,38,0.3)" : "var(--lib-border)"}`,
        background: "transparent",
        color: danger ? "#b91c1c" : "var(--lib-dusk)",
        cursor: "pointer",
        fontFamily: "var(--font-sans), system-ui, sans-serif",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = danger ? "rgba(220,38,38,0.06)" : "var(--lib-bg-3)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}

const topBtnSt: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 5,
  padding: "5px 10px", borderRadius: 6, border: "none",
  background: "transparent", cursor: "pointer",
  fontSize: 12, color: "var(--lib-dusk)",
  fontFamily: "var(--font-sans), system-ui, sans-serif",
  transition: "all 0.15s ease",
};

const iconBtnSt: React.CSSProperties = {
  width: 24, height: 24, borderRadius: 5,
  border: "1px solid var(--lib-border)",
  background: "var(--lib-bg-3)", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 10, color: "var(--lib-dusk)",
  fontFamily: "var(--font-sans), system-ui, sans-serif",
  transition: "all 0.15s ease",
  flexShrink: 0,
};
