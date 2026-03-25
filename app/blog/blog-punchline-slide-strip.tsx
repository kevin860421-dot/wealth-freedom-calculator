"use client";

import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { scrollToBlogCalculatorCta } from "./blog-calculator-cta";
import styles from "./blog-punchline-slide-strip.module.css";

type Props = {
  /** sessionStorage：同一分頁最多自動滑出一次 */
  sessionKey: string;
  /** 觀測此元素進入視窗時觸發 */
  sentinelRef: RefObject<HTMLElement | null>;
};

/**
 * 與第一篇「中央慶祝彈窗」不同：底部滑入條 + 微光 punchline，引導開計算機。
 */
export function BlogPunchlineSlideStrip({ sessionKey, sentinelRef }: Props) {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const triggered = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(sessionKey) === "1") return;
    } catch {
      /* ignore */
    }

    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !triggered.current) {
            triggered.current = true;
            setShow(true);
            io.disconnect();
          }
        }
      },
      { root: null, rootMargin: "0px 0px -5% 0px", threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted, sessionKey, sentinelRef]);

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(sessionKey, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  }, [sessionKey]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className={`${styles.strip} ${show ? styles.visible : ""}`} role="region" aria-label="行動引導">
      <div className={styles.inner}>
        <p className={styles.punch}>
          <span className={styles.spark}>你不是投資錯，你是算錯。</span>
        </p>
        <button
          type="button"
          className={styles.cta}
          onClick={() => {
            dismiss();
            requestAnimationFrame(() => scrollToBlogCalculatorCta());
          }}
        >
          前往文末開啟計算機 →
        </button>
        <button type="button" className={styles.dismiss} onClick={dismiss}>
          先關閉
        </button>
      </div>
    </div>,
    document.body
  );
}

/** 隱形觀測點 + 底部滑條一包搞定（給 Server page 用） */
export function BlogPunchlineEndGate({ sessionKey }: { sessionKey: string }) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <div
        ref={sentinelRef}
        aria-hidden
        style={{
          height: 1,
          width: "100%",
          marginTop: "0.5rem",
          pointerEvents: "none",
          opacity: 0,
        }}
      />
      <BlogPunchlineSlideStrip sessionKey={sessionKey} sentinelRef={sentinelRef} />
    </>
  );
}
