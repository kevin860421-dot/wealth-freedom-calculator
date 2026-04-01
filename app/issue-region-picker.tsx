"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { captureElementToJpegDataUrl } from "./capture-element-screenshot";
import styles from "./issue-region-picker.module.css";

export type IssuePickResult = {
  /** 給使用者看的簡短區域名稱 */
  shortLabel: string;
  path: string;
  tag: string;
  /** 選取元素的畫面截圖（JPEG data URL），失敗或過大時為 null */
  screenshotDataUrl: string | null;
};

/** 由點選元素產生簡短「回報區域」說明（優先 data-section、標題、可讀文字） */
export function shortRegionLabel(el: Element): string {
  let cur: Element | null = el;
  for (let i = 0; i < 10 && cur; i++) {
    const ds = cur.getAttribute("data-section")?.trim();
    if (ds) return ds.slice(0, 42);
    cur = cur.parentElement;
  }
  const aria = el.getAttribute("aria-label")?.trim();
  if (aria) return aria.slice(0, 42);

  const subH = el.querySelector("h1, h2, h3, h4");
  const subTxt = subH?.textContent?.trim();
  if (subTxt) return subTxt.slice(0, 36);

  cur = el.parentElement;
  for (let i = 0; i < 6 && cur; i++) {
    const h = cur.querySelector(":scope > h1, :scope > h2, :scope > h3, :scope > h4");
    const t = h?.textContent?.trim();
    if (t) return t.slice(0, 36);
    cur = cur.parentElement;
  }

  const raw = (el as HTMLElement).innerText?.replace(/\s+/g, " ").trim() ?? "";
  if (raw.length > 0) {
    const slice = raw.slice(0, 34);
    return raw.length > 34 ? `${slice}…` : slice;
  }
  return `頁面上的「${el.tagName.toLowerCase()}」區塊`;
}

const HUD_SEL = "[data-issue-picker-hud]";

function buildElementPath(el: Element, maxDepth = 10): string {
  const parts: string[] = [];
  let cur: Element | null = el;
  for (let i = 0; i < maxDepth && cur && cur !== document.body; i++) {
    const tag = cur.tagName.toLowerCase();
    if (tag === "html") break;
    let part = tag;
    const id = cur.id;
    if (id && /^[a-zA-Z][\w-]*$/.test(id)) {
      part += `#${id}`;
      parts.unshift(part);
      break;
    }
    const classStr =
      typeof (cur as HTMLElement).className === "string"
        ? (cur as HTMLElement).className
        : cur.getAttribute("class") ?? "";
    if (classStr.trim()) {
      const cls = classStr
        .trim()
        .split(/\s+/)
        .filter((c) => c && !c.startsWith("css-") && c.length < 40)
        .slice(0, 2);
      if (cls.length) part += `.${cls.join(".")}`;
    }
    const ds = cur.getAttribute("data-section");
    if (ds) {
      const safe = ds.replace(/"/g, "").slice(0, 40);
      part += `[data-section="${safe}"]`;
      parts.unshift(part);
      cur = cur.parentElement;
      continue;
    }
    parts.unshift(part);
    cur = cur.parentElement;
  }
  return parts.join(" > ");
}

function isIgnorableTarget(el: EventTarget | null): boolean {
  if (!el || !(el instanceof Element)) return true;
  if (el.closest(HUD_SEL)) return true;
  return false;
}

function promoteToSectionLike(el: Element | null): Element | null {
  if (!el) return null;
  const vw = typeof window !== "undefined" ? window.innerWidth : 0;
  const vh = typeof window !== "undefined" ? window.innerHeight : 0;

  // 目標：不要太細（按鈕/文字），也不要太大（整頁容器）
  const MIN_H = 84; // 讓使用者一眼知道是哪一塊
  const MAX_H = vh > 0 ? Math.max(220, Math.floor(vh * 0.62)) : 520; // 避免抓到超大區塊
  const MIN_W = vw > 0 ? Math.floor(vw * 0.5) : 280; // 太窄通常是小元件/欄位

  const blockishTag = (tag: string) =>
    tag === "section" || tag === "article" || tag === "main" || tag === "aside" || tag === "nav";

  const hasDirectHeading = (node: Element) => {
    const h = node.querySelector(":scope > h1, :scope > h2, :scope > h3");
    return !!(h && (h.textContent?.trim()?.length ?? 0) > 0);
  };

  const scoreCandidate = (node: Element, depth: number) => {
    const r = node.getBoundingClientRect();
    const tag = node.tagName.toLowerCase();
    const ds = node.getAttribute("data-section");
    const role = node.getAttribute("role");

    const tooSmall = r.height < MIN_H || r.width < MIN_W;
    const tooBig = r.height > MAX_H || (vh > 0 && r.height > vh * 0.8);

    let score = 0;
    if (ds) score += 40;
    if (blockishTag(tag)) score += 18;
    if (role === "region") score += 12;
    if (hasDirectHeading(node)) score += 18;

    // 盡量選「中等」高度：接近 42% 視窗高度最理想
    if (vh > 0) {
      const ideal = vh * 0.42;
      const delta = Math.abs(r.height - ideal);
      score += Math.max(0, 30 - Math.min(30, Math.round(delta / 10)));
    }

    // 避免一路往上挑到超大容器
    score -= depth * 2;
    if (tooSmall) score -= 80;
    if (tooBig) score -= 80;

    return { score, rect: r, tooSmall, tooBig };
  };

  // 收集本體 + 祖先，從中挑分數最高的「中等區塊」
  const chain: Element[] = [];
  let cur: Element | null = el;
  for (let i = 0; i < 14 && cur && cur !== document.body; i++) {
    chain.push(cur);
    cur = cur.parentElement;
  }

  let best: { node: Element; score: number; rect: DOMRect } | null = null;
  for (let i = 0; i < chain.length; i++) {
    const node = chain[i];
    const res = scoreCandidate(node, i);
    if (!best || res.score > best.score) best = { node, score: res.score, rect: res.rect };
  }

  if (best && best.score > -40) return best.node;

  // 保底：如果全都不理想，就往上找「第一個不那麼小」的父層，避免選到單一文字/按鈕
  for (let i = 0; i < chain.length; i++) {
    const r = chain[i].getBoundingClientRect();
    if (r.height >= MIN_H && r.width >= MIN_W) return chain[i];
  }

  return el;
}

type Props = {
  open: boolean;
  onCapture: (r: IssuePickResult) => void;
  onClose: () => void;
};

export function IssueRegionPicker({ open, onCapture, onClose }: Props) {
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const candidateRef = useRef<Element | null>(null);
  const commitPickRef = useRef<((t: Element) => void) | null>(null);
  const rafRef = useRef<number | null>(null);

  const fitRectToViewport = useCallback(
    (r: DOMRect) => {
      const vw = typeof window !== "undefined" ? window.innerWidth : r.width;
      const vh = typeof window !== "undefined" ? window.innerHeight : r.height;
      const pad = 8; // 讓邊界永遠看得到

      const fullW = Math.max(0, vw - pad * 2);
      const fullH = Math.max(0, vh - pad * 2);

      // 太大（或幾乎滿版）→ 直接顯示「全螢幕框」，避免看不到上下左右邊界
      const tooWide = r.width >= vw - pad * 2;
      const tooTall = r.height >= vh - pad * 2;
      if (tooWide || tooTall) {
        return { top: pad, left: pad, width: fullW, height: fullH };
      }

      // 邊界跑出視窗 → 夾回來（仍維持原尺寸，但確保四邊可見）
      const width = Math.min(r.width, fullW);
      const height = Math.min(r.height, fullH);
      const left = Math.min(Math.max(r.left, pad), vw - pad - width);
      const top = Math.min(Math.max(r.top, pad), vh - pad - height);
      return { top, left, width, height };
    },
    [],
  );

  const updateHighlight = useCallback((el: Element | null) => {
    if (!el || el === document.documentElement || el === document.body) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect(fitRectToViewport(r));
  }, [fitRectToViewport]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;

    // 手機/觸控：改成「捲動選取」：跟著滑動高亮區塊，右側按鈕確認
    const touch =
      typeof window !== "undefined" &&
      (("ontouchstart" in window) || (navigator.maxTouchPoints != null && navigator.maxTouchPoints > 0));
    setIsTouchDevice(!!touch);
    setRect(null);
    candidateRef.current = null;

    if (!touch) document.body.classList.add("cu-issue-picker-active");

    const pickAtPoint = (clientX: number, clientY: number): Element | null => {
      const el = document.elementFromPoint(clientX, clientY);
      if (!el) return null;
      if (isIgnorableTarget(el)) return null;
      return promoteToSectionLike(el);
    };

    const commitPick = (t: Element) => {
      const path = buildElementPath(t);
      const tag = t.tagName.toLowerCase();
      const shortLabel = shortRegionLabel(t);
      const el = t as HTMLElement;

      onClose();

      void (async () => {
        await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
        const screenshotDataUrl = await captureElementToJpegDataUrl(el);
        onCapture({ shortLabel, path, tag, screenshotDataUrl });
      })();
    };
    commitPickRef.current = commitPick;

    const updateFromViewport = () => {
      const x = Math.round(window.innerWidth * 0.5);
      const y = Math.round(window.innerHeight * 0.32);
      const t = pickAtPoint(x, y);
      candidateRef.current = t;
      updateHighlight(t);
    };

    const onScroll = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        updateFromViewport();
      });
    };

    const onPointerMove = (e: PointerEvent) => {
      if (touch) return;
      const t = pickAtPoint(e.clientX, e.clientY);
      candidateRef.current = t;
      updateHighlight(t);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (touch) return;
      const t = pickAtPoint(e.clientX, e.clientY);
      if (!t) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      commitPick(t);
    };

    // 保留桌機滑鼠事件作為 fallback（部分瀏覽器/環境 pointer 事件可能被攔）
    const onMouseMove = (e: MouseEvent) => {
      if (touch) return;
      if (isIgnorableTarget(e.target)) {
        setRect(null);
        return;
      }
      const t = e.target;
      if (t instanceof Element) {
        const promoted = promoteToSectionLike(t);
        candidateRef.current = promoted;
        updateHighlight(promoted);
      }
    };

    const onClick = (e: MouseEvent) => {
      if (touch) return;
      if (isIgnorableTarget(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const t = e.target;
      if (!(t instanceof Element)) {
        onClose();
        return;
      }
      commitPick(t);
    };

    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("click", onClick, true);
    if (touch) {
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      updateFromViewport();
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey, true);

    return () => {
      commitPickRef.current = null;
      document.body.classList.remove("cu-issue-picker-active");
      document.removeEventListener("pointermove", onPointerMove, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("mousemove", onMouseMove, true);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("keydown", onKey, true);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [open, onCapture, onClose, updateHighlight]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className={styles.root} aria-hidden={false}>
      {rect && (
        <div
          className={`${styles.highlight} ${isTouchDevice ? styles.highlightMobile : ""}`}
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
        />
      )}
      {isTouchDevice ? (
        <button
          type="button"
          className={styles.confirmFab}
          onClick={() => {
            const t = candidateRef.current;
            if (!t) return;
            commitPickRef.current?.(t);
          }}
        >
          確認選取
        </button>
      ) : null}
      <div className={styles.hud} data-issue-picker-hud role="toolbar" aria-label="標示問題區塊">
        <p className={styles.hudText}>
          {isTouchDevice ? (
            <>
              <strong style={{ color: "#e2e8f0" }}>上下滑動</strong>讓黃光停在要回報的區塊，然後按右側「確認選取」。
              <br />
              取消可按下方按鈕。
            </>
          ) : (
            <>
              用滑鼠<strong style={{ color: "#e2e8f0" }}>點一下</strong>要回報的區塊：填入區域名稱並嘗試<strong>截取該區塊畫面</strong>（約 1～3 秒）。
            </>
          )}
          <br />
          按 Esc 或取消結束。
        </p>
        <button type="button" className={styles.hudBtn} onClick={onClose}>
          取消標示
        </button>
      </div>
    </div>,
    document.body,
  );
}
