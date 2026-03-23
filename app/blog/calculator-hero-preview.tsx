import styles from "./calculator-hero-preview.module.css";

/**
 * 靜態「畫面預覽」：模仿首頁財富自由計算機 hero 區塊（非截圖，免維護圖檔）。
 */
export function CalculatorHeroPreview() {
  return (
    <figure className={styles.wrap} aria-label="財富自由計算機介面預覽（示意）">
      <div className={styles.card}>
        <div className={styles.grid3}>
          <div className={styles.colMain}>
            <div className={styles.badge}>WEALTH FREEDOM</div>
            <div className={styles.title}>財富自由計算機</div>
            <p className={styles.tagline}>月領目標、複利紀律、股利與稅負試算——同一畫面對齊。</p>
          </div>
          <div className={styles.colMid}>
            <p className={styles.bullet}>◆ 定期定額＋股利再投入</p>
            <p className={styles.bullet}>◆ 分離／合併課稅與二代健保欄位</p>
            <p className={styles.bullet}>◆ 用數據看 FIRE 還差幾年</p>
          </div>
          <div className={styles.colEta}>
            <div className={styles.etaLabel}>FIRE ETA</div>
            <div className={styles.etaValue}>只需 N 年</div>
            <div className={styles.bar}>
              <div className={styles.barFill} />
            </div>
          </div>
        </div>
      </div>
      <figcaption className={styles.caption}>與首頁相同風格之示意版面，實際欄位以計算機為準。</figcaption>
    </figure>
  );
}
