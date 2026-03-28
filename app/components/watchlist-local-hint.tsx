"use client";

import styles from "./watchlist-local-hint.module.css";

/** 精簡版；完整說明見 title（滑鼠懸停） */
const HINT_SHORT = "僅本機，未上傳";
const HINT_TITLE = "資料僅存在此裝置的瀏覽器中，未上傳至伺服器；清除網站資料可能一併刪除。";

function LocalDeviceIcon() {
  return (
    <span className={styles.iconBox} aria-hidden>
      <svg className={styles.iconSvg} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M7 7.5a2 2 0 012-2h11l5 5v14a2 2 0 01-2 2H9a2 2 0 01-2-2v-17z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M18 6v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M10 14h10M10 18h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path
          d="M21 22.5v-1.2a2.2 2.2 0 114.4 0v1.2"
          stroke="#34d399"
          strokeWidth="1.35"
          strokeLinecap="round"
        />
        <rect x="19" y="22.5" width="8.5" height="5.5" rx="1.2" stroke="#34d399" strokeWidth="1.35" />
      </svg>
    </span>
  );
}

type Props = {
  variant: "modal" | "footer";
  titleId?: string;
};

/**
 * 圖塊 + 精簡隱私說明（與「我的自選股」標題並列或置中堆疊）
 */
export function WatchlistLocalHint({ variant, titleId }: Props) {
  if (variant === "modal") {
    return (
      <div className={styles.rowModal}>
        <LocalDeviceIcon />
        <div className={styles.textBlockModal}>
          <h2 id={titleId} className={styles.titleModal}>
            我的自選股
          </h2>
          <p className={styles.hint} title={HINT_TITLE}>
            {HINT_SHORT}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.stackFooter}>
      <LocalDeviceIcon />
      <h2 id={titleId} className={styles.titleFooter}>
        我的自選股
      </h2>
      <p className={styles.hint} title={HINT_TITLE}>
        {HINT_SHORT}
      </p>
    </div>
  );
}
