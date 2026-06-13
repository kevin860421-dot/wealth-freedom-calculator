import styles from "./quick11-excel-pick-thumbnail.module.css";

const EXCEL_ICON_FORMULA = "/quick-11/excel-icon-formula.png";
const EXCEL_ICON_PLAIN = "/quick-11/excel-icon-plain.png";

type Quick11ExcelPickThumbnailProps = {
  variant: "plain" | "formula";
  compact?: boolean;
};

/** 下載彈窗選項卡：Excel 圖示（完整有公式 vs 純資料） */
export function Quick11ExcelPickThumbnail({ variant, compact = false }: Quick11ExcelPickThumbnailProps) {
  const isPlain = variant === "plain";
  const src = isPlain ? EXCEL_ICON_PLAIN : EXCEL_ICON_FORMULA;
  const alt = isPlain ? "純資料 Excel 圖示" : "完整有公式 Excel 圖示";

  return (
    <div className={`${styles.root} ${compact ? styles.compact : ""}`.trim()}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className={styles.icon} draggable={false} />
    </div>
  );
}
