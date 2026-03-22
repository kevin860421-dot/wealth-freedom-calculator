"use client";

import { ContactUsPanel } from "./contact-us-panel";
import { useStats } from "./stats-provider";
import { useCallback, useEffect, useState } from "react";
import styles from "./footer-stats-strip.module.css";

const SHARE_TITLE = "財富自由計算機";
const SHARE_DESC = "財富自由計算機：台股 ETF、定期定額、股利與稅負試算（僅供參考）";

function fmt(n: number) {
  return Math.max(0, Math.floor(n)).toLocaleString("zh-TW");
}

export function FooterStatsStrip() {
  const { stats } = useStats();
  const [pageUrl, setPageUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setPageUrl(typeof window !== "undefined" ? window.location.href : "");
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const copyLink = useCallback(async () => {
    const url = pageUrl || (typeof window !== "undefined" ? window.location.href : "");
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        /* ignore */
      }
    }
  }, [pageUrl]);

  const nativeShare = useCallback(async () => {
    const url = pageUrl || (typeof window !== "undefined" ? window.location.href : "");
    if (!url || !navigator.share) return;
    try {
      await navigator.share({ title: SHARE_TITLE, text: SHARE_DESC, url });
    } catch {
      /* user cancel or error */
    }
  }, [pageUrl]);

  const lineShareUrl =
    pageUrl.length > 0 ? `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(pageUrl)}` : "#";
  const fbShareUrl =
    pageUrl.length > 0 ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}` : "#";

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        {/* 欄 1：造訪統計 */}
        <aside className={`${styles.card} ${styles.cardStats}`} aria-label="造訪統計">
          <div className={styles.cardHead}>
            <span className={styles.cardIcon} aria-hidden>
              ◎
            </span>
            <div className={styles.cardTitles}>
              <div className={styles.cardTitleZh}>造訪概況</div>
              <div className={styles.cardTitleEn}>Snapshot</div>
            </div>
          </div>
          <div className={`${styles.cardBody} ${styles.statsInner}`}>
            <div className={styles.statBlock}>
              <span className={styles.statLabel}>月瀏覽</span>
              <span className={styles.statNum}>{fmt(stats.monthPageViews)}</span>
            </div>
            <div className={styles.statBlock}>
              <span className={styles.statLabel}>有效互動</span>
              <span className={`${styles.statNum} ${styles.statNumAccent}`}>{fmt(stats.monthEngagement)}</span>
            </div>
          </div>
          <div className={styles.cardSlot} aria-hidden />
        </aside>

        {/* 欄 2：聯絡我們（獨立面板 UI） */}
        <ContactUsPanel />

        {/* 欄 3：分享 */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardIcon} aria-hidden>
              ↗
            </span>
            <div className={styles.cardTitles}>
              <div className={styles.cardTitleZh}>分享此頁</div>
              <div className={styles.cardTitleEn}>Share</div>
            </div>
          </div>
          <div className={`${styles.cardBody} ${styles.shareBody}`}>
            <p className={styles.shareHint}>轉傳給也在規劃退休與被動收入的朋友。</p>
            <div className={styles.shareRow}>
              <button
                type="button"
                className={`${styles.btnGhost} ${copied ? styles.btnGhostSuccess : ""}`}
                onClick={copyLink}
              >
                {copied ? "✓ 已複製" : "複製連結"}
              </button>
              {canNativeShare && (
                <button type="button" className={styles.btnGhost} onClick={() => void nativeShare()}>
                  系統分享
                </button>
              )}
              <a
                href={lineShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.btnGhost} ${styles.btnLine}`}
                onClick={(e) => {
                  if (!pageUrl) e.preventDefault();
                }}
              >
                LINE
              </a>
              <a
                href={fbShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.btnGhost} ${styles.btnFb}`}
                onClick={(e) => {
                  if (!pageUrl) e.preventDefault();
                }}
              >
                Facebook
              </a>
            </div>
            <div className={styles.cardSlot} aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}
