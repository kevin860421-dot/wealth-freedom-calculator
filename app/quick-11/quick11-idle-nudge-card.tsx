"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./quick11-idle-nudge-card.module.css";

export type Quick11IdleNudgeCopy = {
  title: string;
  body: string;
  button: string;
  /** 試算結果前導句（與 highlight 搭配，如「你的試算結果顯示：」） */
  subtitle?: string;
  /** 黃色強調行（如「最高可少付 NT$432,076」） */
  highlight?: string;
};

type Quick11IdleNudgeCardProps = {
  visible: boolean;
  isLight?: boolean;
  copy: Quick11IdleNudgeCopy;
  onDismiss: () => void;
};

function NudgeBankIcon() {
  return (
    <svg className={styles.iconSvg} viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect x="8" y="20" width="32" height="18" rx="2" fill="#3B82F6" />
      <path d="M6 20L24 10L42 20" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="14" y="26" width="6" height="12" rx="1" fill="#1D4ED8" />
      <rect x="28" y="26" width="6" height="12" rx="1" fill="#1D4ED8" />
      <circle cx="34" cy="34" r="9" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.5" />
      <text x="34" y="38" textAnchor="middle" fill="#854D0E" fontSize="11" fontWeight="800">
        $
      </text>
    </svg>
  );
}

export function Quick11IdleNudgeCard({ visible, copy, onDismiss }: Quick11IdleNudgeCardProps) {
  const hasHighlight = Boolean(copy.highlight?.trim());

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
            className={styles.card}
          >
            <button type="button" aria-label="關閉提醒" onClick={onDismiss} className={styles.closeBtn}>
              ×
            </button>

            <div className={styles.topRow}>
              <div className={styles.iconWrap}>
                <NudgeBankIcon />
              </div>
              <div className={styles.textBlock}>
                <h3 className={styles.title}>{copy.title}</h3>
                {hasHighlight ? (
                  <>
                    {copy.subtitle ? <p className={styles.subtitle}>{copy.subtitle}</p> : null}
                    <p className={styles.highlight}>{copy.highlight}</p>
                  </>
                ) : copy.body ? (
                  <p className={styles.body}>{copy.body}</p>
                ) : null}
              </div>
            </div>

            <Link href="/quick-1" className={styles.cta} onClick={onDismiss}>
              <span className={styles.ctaText}>{copy.button}</span>
              <span className={styles.ctaChevron} aria-hidden>
                ›
              </span>
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
    sessionStorage.removeItem(QUICK11_IDLE_NUDGE_DISMISS_KEY);
  } catch {
    /* ignore */
  }
}
