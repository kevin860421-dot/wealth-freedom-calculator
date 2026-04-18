"use client";

import type { CSSProperties } from "react";
import {
  forwardRef,
  useLayoutEffect,
  useRef,
  useImperativeHandle,
  useCallback,
} from "react";

/** 常見 Blogger／編輯器貼上的首個標籤（Markdown # 開頭不會命中） */
const HTML_BODY_ROOT_TAGS = new Set([
  "div", "section", "article", "main", "aside", "nav", "header", "footer",
  "p", "span", "figure", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6",
  "img", "a", "br", "hr", "ul", "ol", "li", "table", "thead", "tbody", "tfoot", "tr", "td", "th",
  "b", "strong", "i", "em", "font", "center", "pre", "code", "iframe", "video", "svg", "form", "style",
]);

/** 與 export／WYSIWYG 邏輯一致：內文視為 HTML（含從 Blogger 貼上的片段） */
export function isRawHtmlBody(s: string): boolean {
  const t = s.trimStart();
  if (!t) return false;
  if (t.startsWith("<!--")) return true;
  if (/^<!DOCTYPE\s/i.test(t)) return true;
  const m = t.match(/^<\s*\/?\s*([a-zA-Z][\w:-]*)/);
  if (!m) return false;
  return HTML_BODY_ROOT_TAGS.has(m[1].toLowerCase());
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** 將 Markdown 圖片語法轉成簡單 <p><img></p>，供插入 HTML 內文 */
export function markdownImgsToHtmlFragment(md: string): string {
  const trimmed = md.trim();
  const parts: string[] = [];
  const re = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(trimmed)) !== null) {
    const alt = escapeAttr(m[1]);
    const src = escapeAttr(m[2]);
    parts.push(
      `<p style="text-align:center;margin:1em 0;"><img src="${src}" alt="${alt}" style="max-width:100%;height:auto;border-radius:4px;" /></p>`,
    );
  }
  const rest = trimmed.replace(/!\[[^\]]*\]\([^)]+\)/g, "").replace(/\n+/g, " ").trim();
  if (parts.length === 0) {
    return rest ? `<p>${escapeAttr(rest)}</p>` : "";
  }
  return parts.join("") + (rest ? `<p>${escapeAttr(rest)}</p>` : "");
}

/** 在目前選取處插入 HTML；若選取不在編輯區內則附加在結尾 */
export function insertHtmlAtCaret(container: HTMLElement, html: string): void {
  const fragmentHtml = html.trim();
  if (!fragmentHtml) return;
  container.focus();
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    container.insertAdjacentHTML("beforeend", fragmentHtml);
    return;
  }
  const range = sel.getRangeAt(0);
  if (!container.contains(range.commonAncestorContainer)) {
    container.insertAdjacentHTML("beforeend", fragmentHtml);
    return;
  }
  range.deleteContents();
  const tpl = document.createElement("template");
  tpl.innerHTML = fragmentHtml;
  const frag = tpl.content;
  if (!frag.firstChild) return;
  const last = frag.lastChild;
  range.insertNode(frag);
  if (last?.parentNode) {
    range.setStartAfter(last);
    range.collapse(true);
  } else {
    range.collapse(false);
  }
  sel.removeAllRanges();
  sel.addRange(range);
}

export type HtmlBodyEditorHandle = {
  insertHtml: (html: string) => void;
  focusEditor: () => void;
};

type HtmlBodyEditorProps = {
  value: string;
  onChange: (html: string) => void;
  className?: string;
  style?: CSSProperties;
};

export const HtmlBodyEditor = forwardRef<HtmlBodyEditorHandle, HtmlBodyEditorProps>(
  function HtmlBodyEditor({ value, onChange, className, style }, ref) {
    const elRef = useRef<HTMLDivElement | null>(null);
    const focused = useRef(false);

    useLayoutEffect(() => {
      const el = elRef.current;
      if (!el) return;
      if (!focused.current && value !== el.innerHTML) {
        el.innerHTML = value;
      }
    }, [value]);

    const insertHtml = useCallback((html: string) => {
      const el = elRef.current;
      if (!el) return;
      insertHtmlAtCaret(el, html);
      onChange(el.innerHTML);
      el.focus();
    }, [onChange]);

    const focusEditor = useCallback(() => {
      elRef.current?.focus();
    }, []);

    useImperativeHandle(ref, () => ({ insertHtml, focusEditor }), [insertHtml, focusEditor]);

    return (
      <div
        ref={elRef}
        className={className}
        style={style}
        contentEditable
        spellCheck={false}
        suppressContentEditableWarning
        onInput={(e) => onChange((e.currentTarget as HTMLDivElement).innerHTML)}
        onFocus={() => {
          focused.current = true;
        }}
        onBlur={() => {
          focused.current = false;
        }}
      />
    );
  },
);

HtmlBodyEditor.displayName = "HtmlBodyEditor";
