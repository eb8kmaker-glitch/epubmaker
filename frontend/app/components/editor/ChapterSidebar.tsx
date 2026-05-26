"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Chapter } from "@/app/lib/bookModel";
import { ChipBtn } from "./EditorMicro";
import { iconBtnSt } from "./editorShared";

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

export default function ChapterSidebar({
  chapters, activeId, onSelect, onAdd, onDelete, onRename, onToggleCollapse, onMerge, onReorder,
}: SidebarProps) {
  const t = useTranslations("Editor");
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
      data-testid="open-toc-editor-btn"
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
          {t("chaptersLabel", { count: chapters.length })}
        </span>
        <button
          type="button"
          onClick={onAdd}
          title={t("addChapterTitle")}
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
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 10px" }}
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
                  {ch.title || t("untitled")}
                </span>
              )}

              {/* Collapse toggle */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleCollapse(ch.id); }}
                title={ch.collapsed ? t("expandChapter") : t("collapseChapter")}
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
                <ChipBtn onClick={() => startEdit(ch)}>{t("renameChapter")}</ChipBtn>
                {idx > 0 && <ChipBtn onClick={() => onMerge(ch.id)}>{t("mergePrevious")}</ChipBtn>}
                {chapters.length > 1 && (
                  <ChipBtn
                    onClick={() => { if (confirm(t("confirmDeleteChapter", { title: ch.title }))) onDelete(ch.id); }}
                    danger
                  >
                    {t("deleteChapter")}
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
          {t("chapterSidebarHint")}
        </p>
      </div>
    </aside>
  );
}
