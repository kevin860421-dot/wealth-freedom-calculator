"use client";

import {
  isQuick11ExcelDownloadEnabled,
  QUICK11_EXCEL_DOWNLOAD_DISABLED_HINT,
} from "@/lib/quick11-marketing";
import styles from "./quick11-excel-download-button.module.css";

type Quick11ExcelDownloadButtonProps = {
  isLight?: boolean;
  onOpenWizard: () => void;
};

/** 破產計算機底部：單一「下載 Excel」按鈕 → 四步驟彈窗（全分頁同款） */
export function Quick11ExcelDownloadButton({ isLight = false, onOpenWizard }: Quick11ExcelDownloadButtonProps) {
  const enabled = isQuick11ExcelDownloadEnabled();

  return (
    <button
      type="button"
      onClick={enabled ? onOpenWizard : undefined}
      disabled={!enabled}
      aria-label={enabled ? "下載 Excel" : QUICK11_EXCEL_DOWNLOAD_DISABLED_HINT}
      title={enabled ? undefined : QUICK11_EXCEL_DOWNLOAD_DISABLED_HINT}
      className={`${styles.btn} ${isLight ? styles.btnLight : ""} ${enabled ? "" : styles.btnDisabled}`}
    >
      <span className={styles.label}>
        <span className={styles.downloadText}>下載</span>
        <span className={styles.excel}>Excel</span>
      </span>
    </button>
  );
}
