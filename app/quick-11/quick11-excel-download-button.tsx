"use client";

import styles from "./quick11-excel-download-button.module.css";

type Quick11ExcelDownloadButtonProps = {
  isLight?: boolean;
  onOpenWizard: () => void;
};

/** 破產計算機底部：單一「下載Excel」按鈕 → 四步驟彈窗 */
export function Quick11ExcelDownloadButton({ isLight = false, onOpenWizard }: Quick11ExcelDownloadButtonProps) {
  return (
    <button
      type="button"
      onClick={onOpenWizard}
      aria-label="下載Excel"
      className={`${styles.btn} ${isLight ? styles.btnLight : ""}`}
    >
      下載<span className={styles.excel}>Excel</span>
    </button>
  );
}
