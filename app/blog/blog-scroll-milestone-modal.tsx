"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { scrollToBlogCalculatorCta } from "./blog-calculator-cta";
import styles from "../freedom-celebration-modal.module.css";

type Props = {
  /** sessionStorage 鍵，不同文章用不同鍵 */
  sessionKey: string;
};

/**
 * 在文章底部放置隱形觀測點；讀者滑到接近底部時跳出「邁向財富自由」祝賀與計算機 CTA。
 * 同一分頁工作階段每篇文章最多自動出現一次（關閉後寫入 sessionStorage）。
 */
export function BlogScrollMilestoneModal({ sessionKey }: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggeredRef = useRef(false);

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

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !triggeredRef.current) {
            triggeredRef.current = true;
            setOpen(true);
            obs.disconnect();
          }
        }
      },
      {
        root: null,
        rootMargin: "0px 0px 12% 0px",
        threshold: 0.01,
      }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [mounted, sessionKey]);

  const close = useCallback(() => {
    try {
      sessionStorage.setItem(sessionKey, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }, [sessionKey]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <div
        ref={sentinelRef}
        aria-hidden
        style={{
          height: 2,
          width: "100%",
          marginTop: "0.75rem",
          pointerEvents: "none",
          opacity: 0,
        }}
      />
      {mounted && open && typeof document !== "undefined"
        ? createPortal(
            <div
              className={styles.backdrop}
              role="presentation"
              onClick={close}
              aria-hidden={!open}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="blog-milestone-title"
                className={styles.dialog}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.sparkle} aria-hidden>
                  🎉
                </div>
                <h2 id="blog-milestone-title" className={styles.title} style={{ fontSize: "1.35rem", lineHeight: 1.35 }}>
                  恭喜你邁向財富自由
                </h2>
                <p className={styles.sub}>
                  讀完這篇，你已經比多數人更在意「實拿」與長期路徑。下一步用計算機把數字跑一遍。
                </p>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.cta}
                    onClick={() => {
                      close();
                      requestAnimationFrame(() => scrollToBlogCalculatorCta());
                    }}
                  >
                    前往文末開啟計算機
                  </button>
                  <button type="button" className={styles.ghost} onClick={close}>
                    關閉
                  </button>
                </div>
                <p className={styles.hint}>點擊視窗外側也可關閉</p>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
