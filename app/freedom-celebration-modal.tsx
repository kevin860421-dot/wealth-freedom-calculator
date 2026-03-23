"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./freedom-celebration-modal.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * 恭喜達成財富自由：小彈窗動畫；點遮罩（旁邊）關閉；CTA 另開分頁開本計算機。
 */
export function FreedomCelebrationModal({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={onClose}
      aria-hidden={!open}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="freedom-celebration-title"
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.sparkle} aria-hidden>
          ✨
        </div>
        <h2 id="freedom-celebration-title" className={styles.title}>
          恭喜！以目前參數已達財富自由目標
        </h2>
        <p className={styles.sub}>
          繼續用計算機微調本金、報酬與稅負假設，把路徑看得更清楚。
        </p>
        <div className={styles.actions}>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.cta}
          >
            前往財富自由計算機（另開分頁）
          </Link>
          <button type="button" className={styles.ghost} onClick={onClose}>
            關閉
          </button>
        </div>
        <p className={styles.hint}>點擊視窗外側（半透明區）也可關閉</p>
      </div>
    </div>,
    document.body
  );
}
