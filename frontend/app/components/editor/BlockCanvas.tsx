"use client";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type React from "react";
import {
  type Block, type TextBlock, type ImageBlock, type BlockType, type Chapter, uid,
} from "@/app/lib/bookModel";
import ContentEditable from "./ContentEditable";
import { BLOCK_TYPE_ICONS, BLOCK_TAG, BLOCK_STYLES } from "./editorShared";

interface CanvasProps {
  chapter: Chapter;
  onBlocksChange: (blocks: Block[]) => void;
  onChapterTitleChange: (title: string) => void;
  onSplit: (blockIndex: number) => void;
}

export default function BlockCanvas({ chapter, onBlocksChange, onChapterTitleChange, onSplit }: CanvasProps) {
  const t = useTranslations("Editor");
  const BLOCK_TYPES = [
    { type: "paragraph" as const, label: t("blockTypeParagraph"), hint: t("blockHintParagraph") },
    { type: "h2"        as const, label: t("blockTypeH2"),        hint: t("blockHintH2") },
    { type: "h3"        as const, label: t("blockTypeH3"),        hint: t("blockHintH3") },
    { type: "quote"     as const, label: t("blockTypeQuote"),     hint: t("blockHintQuote") },
    { type: "image"     as const, label: t("blockTypeImage"),     hint: t("blockHintImage") },
  ];
  const BLOCK_PLACEHOLDER: Record<string, string> = {
    paragraph: t("blockPlaceholderParagraph"),
    h2: t("blockPlaceholderH2"),
    h3: t("blockPlaceholderH3"),
    quote: t("blockPlaceholderQuote"),
  };
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
            placeholder={t("chapterTitlePlaceholder")}
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
                    {t("addBlock")}
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
                  title={t("changeBlockType")}
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
                  title={t("deleteBlock")}
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
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--lib-ink)", fontFamily: "var(--font-sans), system-ui, sans-serif", margin: 0 }}>{t("splitChapterHere")}</p>
                      <p style={{ fontSize: 10, color: "var(--lib-dust)", fontFamily: "var(--font-sans), system-ui, sans-serif", margin: 0 }}>{t("splitChapterHint")}</p>
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
                    placeholder={BLOCK_PLACEHOLDER[(block as TextBlock).type] ?? ""}
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
            {t("addBlockHint")}
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
  placeholder: string;
  block: TextBlock;
  focused: boolean;
  onChange: (html: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onEnter: () => void;
  onDelete: () => void;
  onSlashCommand: () => void;
}

function TextBlockView({ block, focused, placeholder, onChange, onFocus, onBlur, onEnter, onDelete, onSlashCommand }: TextBlockViewProps) {
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
      placeholder={placeholder}
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
  const t = useTranslations("Editor");
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
          {t("addImageHint")}
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
        <input
          value={block.alt}
          onChange={(e) => onChange({ alt: e.target.value })}
          placeholder={t("imageAltPlaceholder")}
          style={{
            marginTop: 6, width: "100%", fontSize: 11,
            color: "var(--lib-dust)", background: "transparent",
            border: "none", borderBottom: "1px solid var(--lib-border)",
            outline: "none", padding: "2px 0",
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            boxSizing: "border-box",
          }}
        />
        <input
          value={block.caption}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder={t("imageCaptionPlaceholder")}
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
