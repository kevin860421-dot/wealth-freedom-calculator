"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./quick11-idle-nudge-card.module.css";

export type Quick11IdleNudgeCopy = {
  title: string;
  body: string;
  button: string;
};

type Quick11IdleNudgeCardProps = {
  visible: boolean;
  isLight?: boolean;
  copy: Quick11IdleNudgeCopy;
  onDismiss: () => void;
};

export function Quick11IdleNudgeCard({ visible, isLight = false, copy, onDismiss }: Quick11IdleNudgeCardProps) {
  return (
    <AnimatePresence>
      {visible ? (
        <div key="quick11-idle-nudge-wrap" className={styles.wrap}>
          <motion.aside
            key="quick11-idle-nudge-card"
            role="complementary"
            aria-live="polite"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.22 }}
            className={`${styles.card} ${isLight ? styles.cardLight : ""}`}
          >
          <button
            type="button"
            aria-label="關閉提醒"
            onClick={onDismiss}
            className={`${styles.closeBtn} ${isLight ? styles.closeBtnLight : ""}`}
          >
            ×
          </button>
          <h3 className={`${styles.title} ${isLight ? styles.titleLight : ""}`}>{copy.title}</h3>
          <p className={`${styles.body} ${isLight ? styles.bodyLight : ""}`}>{copy.body}</p>
          <Link href="/quick-1" className={`${styles.cta} ${isLight ? styles.ctaLight : ""}`} onClick={onDismiss}>
            <span aria-hidden>🤖</span>
            <span className={styles.ctaText}>{copy.button}</span>
          </Link>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export const QUICK11_IDLE_NUDGE_DISMISS_KEY = "quick11-idle-nudge-dismissed-v1";

export function hasQuick11IdleNudgeDismissed(): boolean {
  try {
    return sessionStorage.getItem(QUICK11_IDLE_NUDGE_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissQuick11IdleNudge(): void {
  try {
    sessionStorage.setItem(QUICK11_IDLE_NUDGE_DISMISS_KEY, "1");
  } catch {
    /* ignore */
  }
}
