// Shared constants and style objects for the BookEditor components.
import type { BlockType } from "@/app/lib/bookModel";
import type React from "react";

export const BLOCK_TYPES: Array<{ type: BlockType; label: string; hint: string }> = [
  { type: "paragraph", label: "본문",     hint: "일반 단락 텍스트" },
  { type: "h2",        label: "소제목",   hint: "섹션 제목 (H2)" },
  { type: "h3",        label: "소소제목", hint: "하위 제목 (H3)" },
  { type: "quote",     label: "인용",     hint: "인용구" },
  { type: "image",     label: "이미지",   hint: "사진·그림 삽입" },
];

export const BLOCK_TYPE_ICONS: Record<BlockType, string> = {
  paragraph: "¶",
  h2: "H2",
  h3: "H3",
  quote: "❝",
  image: "🖼",
};

export const BLOCK_TAG: Record<Exclude<BlockType, "image">, string> = {
  paragraph: "p",
  h2: "h2",
  h3: "h3",
  quote: "blockquote",
};

export const BLOCK_PLACEHOLDER: Record<Exclude<BlockType, "image">, string> = {
  paragraph: "내용을 입력하세요... ('/' 명령어)",
  h2: "소제목...",
  h3: "소소제목...",
  quote: "인용구를 입력하세요...",
};

export const BLOCK_STYLES: Record<Exclude<BlockType, "image">, React.CSSProperties> = {
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

export const topBtnSt: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 5,
  padding: "5px 10px", borderRadius: 6, border: "none",
  background: "transparent", cursor: "pointer",
  fontSize: 12, color: "var(--lib-dusk)",
  fontFamily: "var(--font-sans), system-ui, sans-serif",
  transition: "all 0.15s ease",
};

export const iconBtnSt: React.CSSProperties = {
  width: 24, height: 24, borderRadius: 5,
  border: "1px solid var(--lib-border)",
  background: "var(--lib-bg-3)", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 10, color: "var(--lib-dusk)",
  fontFamily: "var(--font-sans), system-ui, sans-serif",
  transition: "all 0.15s ease",
  flexShrink: 0,
};
