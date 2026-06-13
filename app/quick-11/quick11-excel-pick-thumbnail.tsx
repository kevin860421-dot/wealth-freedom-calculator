import styles from "./quick11-excel-pick-thumbnail.module.css";

type Quick11ExcelPickThumbnailProps = {
  variant: "plain" | "formula";
  compact?: boolean;
};

/** 下載彈窗選項卡：Excel 迷你預覽（純數值 vs 含公式） */
export function Quick11ExcelPickThumbnail({ variant, compact = false }: Quick11ExcelPickThumbnailProps) {
  const rootClass = `${styles.root} ${compact ? styles.compact : ""}`.trim();

  if (variant === "plain") {
    return (
      <div className={rootClass} aria-hidden title="純資料 Excel 示意">
        <div className={styles.titleBar}>
          <span className={styles.tab}>貸款試算</span>
        </div>
        <div className={styles.grid}>
          <span className={styles.cellHead}>本金</span>
          <span className={styles.cellValue}>8,000,000</span>
          <span className={styles.cellHead}>月付</span>
          <span className={styles.cellValue}>30,521</span>
          <span className={styles.cellHead}>負債比</span>
          <span className={styles.cellWarn}>38.2%</span>
        </div>
      </div>
    );
  }

  return (
    <div className={rootClass} aria-hidden title="完整有公式 Excel 示意">
      <div className={styles.titleBar}>
        <span className={styles.tab}>貸款試算</span>
      </div>
      <div className={styles.grid}>
        <span className={styles.cellHead}>月付</span>
        <span className={styles.cellFormula}>=PMT(B6/12,...)</span>
        <span className={styles.cellHead}>總利息</span>
        <span className={styles.cellFormula}>=SUM(E:E)</span>
        <span className={styles.cellHead}>負債比</span>
        <span className={styles.cellFormula}>=B9/B8</span>
      </div>
    </div>
  );
}
