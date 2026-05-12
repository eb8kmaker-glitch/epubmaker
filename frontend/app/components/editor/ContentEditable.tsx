"use client";
// Controlled contenteditable that avoids cursor-jump by NOT re-rendering while focused.
import { useEffect, useLayoutEffect, useRef } from "react";
import type React from "react";

interface CEProps {
  value: string;
  onChange: (html: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  tag?: keyof React.JSX.IntrinsicElements;
  placeholder?: string;
  style?: React.CSSProperties;
  focused?: boolean;
}

export default function ContentEditable({
  value, onChange, onFocus, onBlur, onKeyDown,
  tag = "div", placeholder = "", style = {}, focused,
}: CEProps) {
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
