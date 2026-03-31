"use client";

import { useCallback, useEffect, useState } from "react";
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
  if (el.closest("[data-contact-panel-shell]")) return true;
  return false;
}

type Props = {
  open: boolean;
  onCapture: (r: IssuePickResult) => void;
  onClose: () => void;
};

export function IssueRegionPicker({ open, onCapture, onClose }: Props) {
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [armed, setArmed] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const updateHighlight = useCallback((el: Element | null) => {
    if (!el || el === document.documentElement || el === document.body) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
    });
  }, []);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;

    // 手機/觸控：預設先讓使用者能「滑動定位」，再手動切到「開始選取」避免被鎖捲動卡住
    const touch =
      typeof window !== "undefined" &&
      (("ontouchstart" in window) || (navigator.maxTouchPoints != null && navigator.maxTouchPoints > 0));
    setIsTouchDevice(!!touch);
    setArmed(!touch);
    setRect(null);

    if (!touch) document.body.classList.add("cu-issue-picker-active");

    const pickAtPoint = (clientX: number, clientY: number): Element | null => {
      const el = document.elementFromPoint(clientX, clientY);
      if (!el) return null;
      if (isIgnorableTarget(el)) return null;
      return el;
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

    const onPointerMove = (e: PointerEvent) => {
      if (!armed) return;
      const t = pickAtPoint(e.clientX, e.clientY);
      updateHighlight(t);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!armed) return;
      const t = pickAtPoint(e.clientX, e.clientY);
      if (!t) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      commitPick(t);
    };

    // 保留桌機滑鼠事件作為 fallback（部分瀏覽器/環境 pointer 事件可能被攔）
    const onMouseMove = (e: MouseEvent) => {
      if (!armed) return;
      if (isIgnorableTarget(e.target)) {
        setRect(null);
        return;
      }
      const t = e.target;
      if (t instanceof Element) updateHighlight(t);
    };

    const onClick = (e: MouseEvent) => {
      if (!armed) return;
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

    const blockTouchMove = (e: TouchEvent) => {
      if (!armed) return;
      // iOS/Android：避免滑動時頁面捲動
      e.preventDefault();
    };

    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("touchmove", blockTouchMove, { capture: true, passive: false });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey, true);

    return () => {
      document.body.classList.remove("cu-issue-picker-active");
      document.removeEventListener("pointermove", onPointerMove, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("mousemove", onMouseMove, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("touchmove", blockTouchMove, true);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open, onCapture, onClose, updateHighlight, armed]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    if (armed) document.body.classList.add("cu-issue-picker-active");
    else document.body.classList.remove("cu-issue-picker-active");
  }, [open, armed]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className={styles.root} aria-hidden={false}>
      {rect && (
        <div
          className={styles.highlight}
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
        />
      )}
      <div className={styles.hud} data-issue-picker-hud role="toolbar" aria-label="標示問題區塊">
        <p className={styles.hudText}>
          {isTouchDevice ? (
            armed ? (
              <>
                <strong style={{ color: "#e2e8f0" }}>點一下</strong>要回報的區塊：會帶入名稱並嘗試<strong>截取該區塊畫面</strong>（約 1～3 秒）。
              </>
            ) : (
              <>
                先<strong style={{ color: "#e2e8f0" }}>滑動捲動</strong>把畫面移到你要回報的位置，再按「開始選取」。
              </>
            )
          ) : (
            <>
              用滑鼠<strong style={{ color: "#e2e8f0" }}>點一下</strong>要回報的區塊：填入區域名稱並嘗試<strong>截取該區塊畫面</strong>（約 1～3 秒）。
            </>
          )}
          <br />
          按 Esc 或取消結束。
        </p>
        {isTouchDevice && (
          <button
            type="button"
            className={styles.hudBtn}
            onClick={() => {
              setRect(null);
              setArmed((v) => !v);
            }}
            aria-pressed={armed}
          >
            {armed ? "繼續滑動" : "開始選取"}
          </button>
        )}
        <button type="button" className={styles.hudBtn} onClick={onClose}>
          取消標示
        </button>
      </div>
    </div>,
    document.body,
  );
}
