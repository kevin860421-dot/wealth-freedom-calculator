"use client";

import Link from "next/link";
import { ContactUsPanel } from "./contact-us-panel";
import { useStats } from "./stats-provider";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./footer-stats-strip.module.css";

const SHARE_TITLE = "財富自由計算機";
const SHARE_DESC = "財富自由計算機：台股 ETF、定期定額、股利與稅負試算（僅供參考）";
const PROD_URL = "https://wealth-freedom-calculator.vercel.app/";
const AVAILABLE_QUICK_CALCULATORS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

function quickCalculatorLabel(n: number): string {
  if (n === 1) return "第1台｜存股複利計算機";
  if (n === 2) return "第2台｜財富自由倒數計時器";
  if (n === 3) return "第3台｜夢想月領試算器";
  if (n === 4) return "第4台｜ETF 領息夢想模擬器";
  if (n === 5) return "第5台｜雪球效應：本金 vs 複利";
  if (n === 6) return "第6台｜槓桿抉擇：房產 vs 全球股市";
  if (n === 7) return "第7台｜槓桿抉擇：房貸 vs 全球股市";
  if (n === 8) return "第8台｜延遲享樂計算機";
  if (n === 9) return "第9台｜延遲享樂計算機 2";
  if (n === 10) return "第10台｜複利美夢 VS 崩盤現實 計算機";
  if (n === 11) return "第11台｜破產計算機";
  if (n === 12) return "第12台｜小額貸款代價計算機";
  return `第${n}台｜小計算機（建置中）`;
}

function fmt(n: number) {
  return Math.max(0, Math.floor(n)).toLocaleString("zh-TW");
}

export function FooterStatsStrip() {
  const { stats } = useStats();
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(""), 3500);
  }, []);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(PROD_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  }, []);

  const nativeShare = useCallback(async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: SHARE_TITLE, text: SHARE_DESC, url: PROD_URL });
    } catch {
      /* user cancel or error */
    }
  }, []);

  const lineText = `你離財富自由還有幾年？試算看看 👇`;
  const lineShareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(PROD_URL)}&text=${encodeURIComponent(lineText)}`;
  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(PROD_URL)}`;
  const threadsShareUrl = `https://www.threads.net/intent/post?text=${encodeURIComponent(`離財富自由還有幾年？試算看看 👇\n${PROD_URL}`)}`;

  return (
    <>
    <div className={styles.wrap}>
      <div className={styles.row}>
        {/* 欄 1：造訪統計 */}
        <div className={styles.leftStack}>
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

          <section className={`${styles.card} ${styles.quickHub}`} aria-label="小計算機捷徑">
            <div className={styles.quickHubHead}>
              <div className={styles.quickHubTitle}>小計算機 1 - 12</div>
              <div className={styles.quickHubHint}>可用按鈕會以新分頁開啟</div>
            </div>
            <div className={styles.quickSection}>
              <div className={styles.quickSectionTitle}>建置中</div>
              <div className={styles.quickGrid}>
                {Array.from({ length: 12 }, (_, idx) => idx + 1)
                  .filter((n) => !AVAILABLE_QUICK_CALCULATORS.has(n))
                  .map((n) => (
                  <button key={n} type="button" className={`${styles.quickBtn} ${styles.quickBtnDisabled}`} disabled>
                    {quickCalculatorLabel(n)}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.quickSection}>
              <div className={styles.quickSectionTitle}>可使用</div>
              <div className={styles.quickGrid}>
                {Array.from({ length: 12 }, (_, idx) => idx + 1)
                  .filter((n) => AVAILABLE_QUICK_CALCULATORS.has(n))
                  .sort((a, b) => a - b)
                  .map((n) => (
                    <Link
                      key={n}
                      href={`/quick-${n}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.quickBtn}
                    >
                      {quickCalculatorLabel(n)}
                    </Link>
                  ))}
              </div>
            </div>
          </section>
        </div>

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
            {/* 小工具按鈕：複製 & 系統分享 */}
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
            </div>

            {/* 大色塊平台按鈕 */}
            <div className={styles.platformRow}>
              {/* LINE：全平台顯示 */}
              <a
                href={lineShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.platformBtn} ${styles.platformLine}`}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                </svg>
                <span>LINE</span>
              </a>
              {/* Facebook：桌機隱藏，手機顯示 */}
              <a
                href={fbShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.platformBtn} ${styles.platformFb} ${styles.mobileOnly}`}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(`你離財富自由還有幾年？試算看看 👇\n${PROD_URL}`);
                    showToast("✅ 已複製財富自由密碼，可直接貼上分享");
                  } catch { /* ignore */ }
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Facebook</span>
              </a>
              {/* Threads：全平台顯示 */}
              <a
                href={threadsShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.platformBtn} ${styles.platformThreads}`}
              >
                <svg width="24" height="24" viewBox="0 0 192 192" fill="currentColor">
                  <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.049-14.127 5.178-6.6 8.453-15.153 9.899-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.741C35.236 139.966 29.808 120.682 29.605 96c.203-24.682 5.63-43.966 16.133-57.317C56.954 24.425 74.204 17.11 97.013 16.94c22.975.17 40.526 7.52 52.171 21.847 5.71 7.026 10.015 15.86 12.853 26.162l16.147-4.308c-3.44-12.68-8.853-23.606-16.219-32.668C147.036 9.607 125.202.195 97.07 0h-.113C68.882.195 47.292 9.643 32.788 28.08 19.882 44.485 13.224 67.315 13.001 95.932v.136c.223 28.617 6.881 51.447 19.787 67.854C47.292 182.357 68.882 191.805 96.957 192h.113c24.96-.173 42.554-6.708 57.048-21.189 18.963-18.945 18.392-42.692 12.142-57.27-4.484-10.454-13.033-18.944-24.723-24.553z"/>
                  <path d="M98.775 130.699c-8.02.46-15.52-1.693-20.516-6.223-3.642-3.252-5.556-7.566-5.733-12.81-.377-11.122 7.986-18.22 22.403-19.032 7.811-.45 15.09-.157 21.72.877.997 11.66-3.58 34.154-17.874 37.188z"/>
                </svg>
                <span>Threads</span>
              </a>
            </div>
            <div className={styles.cardSlot} aria-hidden />
          </div>
        </div>
      </div>

    </div>

      {/* Toast 提示 */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          background: "rgba(26,77,30,0.96)", color: "#fff",
          padding: "12px 22px", borderRadius: 12,
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          zIndex: 9999, fontSize: 14, fontWeight: 600,
          whiteSpace: "nowrap", pointerEvents: "none",
        }}>
          {toast}
        </div>
      )}
    </>
  );
}
