import styles from "./blog-calculator-snippet-duo.module.css";

type Variant = "post4" | "post5";

function Chrome({ label }: { label: string }) {
  return (
    <div className={styles.chrome} aria-hidden>
      <span className={`${styles.dot} ${styles.d1}`} />
      <span className={`${styles.dot} ${styles.d2}`} />
      <span className={`${styles.dot} ${styles.d3}`} />
      <span className={styles.chromeTitle}>{label}</span>
    </div>
  );
}

/**
 * 兩張「計算機畫面摘錄」：版型贴近首頁試算表／深色 UI，與第一篇 CalculatorHeroPreview 三欄 hero 不同；數字為教學示意。
 */
export function BlogCalculatorSnippetDuo({ variant }: { variant: Variant }) {
  if (variant === "post4") {
    return (
      <div className={styles.duo} aria-label="財富自由計算機介面摘錄：54C 與表格欄位示意">
        <figure className={styles.figure}>
          <Chrome label="wealth-freedom · table" />
          <div className={styles.card}>
            <div className={styles.shotTitle}>累積試算表 · 單期摘錄</div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>期數</th>
                  <th>本次股息</th>
                  <th>54C%</th>
                  <th>54C應稅額</th>
                  <th>補充保費</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={styles.num}>12</td>
                  <td className={styles.num}>62,400</td>
                  <td className={styles.num}>68%</td>
                  <td className={`${styles.num} ${styles.accent}`}>42,432</td>
                  <td className={`${styles.num} ${styles.danger}`}>895</td>
                </tr>
              </tbody>
            </table>
            <p className={styles.caption}>對應首頁表格：以 54C 計入判斷二代健保門檻後試算 2.11%。</p>
          </div>
        </figure>

        <figure className={styles.figure}>
          <Chrome label="wealth-freedom · etf" />
          <div className={styles.card}>
            <div className={styles.shotTitle}>標的設定 · 股利組成想像</div>
            <div className={styles.etfRow}>
              <span>
                <span className={styles.etfId}>0056</span> 高股息（示意）
              </span>
              <span className={styles.num}>殖利率 9.2%</span>
            </div>
            <div className={styles.barTrack}>
              <div className={styles.bar54c} style={{ width: "58%" }}>
                54C 58%
              </div>
              <div className={styles.barRest} style={{ width: "42%" }}>
                其他 42%
              </div>
            </div>
            <p className={styles.legend}>「其他」含收益平準金等示意；實際依基金公司公告。</p>
            <p className={styles.caption}>對應首頁：54C 股利占現金股利占比欄位與標的下拉。</p>
          </div>
        </figure>

        <p className={styles.duoCaption}>
          以上為依首頁計算機<strong>欄位邏輯重繪</strong>之示意，非即時截圖；實際版面與數字以開啟計算機為準。
        </p>
      </div>
    );
  }

  /* post5 */
  return (
    <div className={styles.duo} aria-label="財富自由計算機介面摘錄：整戶所得與課稅選項示意">
      <figure className={styles.figure}>
        <Chrome label="wealth-freedom · income" />
        <div className={styles.card}>
          <div className={styles.shotTitle}>整戶所得拼圖（教學用）</div>
          <div className={styles.puzzle}>
            <div className={styles.puzzleRow}>
              <span className={styles.puzzleLabel}>薪資淨額（示意）</span>
              <span className={`${styles.num} ${styles.accent}`}>1,420,000</span>
            </div>
            <div className={styles.puzzleRow}>
              <span className={styles.puzzleLabel}>股利／配息入帳（示意）</span>
              <span className={`${styles.num} ${styles.accent}`}>186,000</span>
            </div>
            <div className={styles.puzzleRow}>
              <span className={styles.puzzleLabel}>其他所得（略）</span>
              <span className={styles.num}>—</span>
            </div>
          </div>
          <div className={styles.bracket}>
            合併申報後，邊際級距可能落在較高帶；股利是否改走分離課稅，應以<strong>整戶試算</strong>比較淨稅負。
          </div>
          <p className={styles.caption}>呼應計算機中「薪資＋股利＋再投入」同一長表的精神。</p>
        </div>
      </figure>

      <figure className={styles.figure}>
        <Chrome label="wealth-freedom · compare" />
        <div className={styles.card}>
          <div className={styles.shotTitle}>合併課稅 vs 分離課稅 · 粗估對照</div>
          <div className={styles.compare}>
            <div className={styles.compareRow}>
              <div className={styles.compareLabel}>合併＋股利抵減 8.5%（示意淨稅額）</div>
              <div className={styles.compareAmt}>約 112,400 元</div>
              <div className={styles.compareHint}>受每戶可抵減稅額上限影響；個案不同。</div>
            </div>
            <div className={styles.compareRow}>
              <div className={styles.compareLabel}>股利分離課稅 28%（同批股利粗估）</div>
              <div className={styles.compareAmt}>約 52,080 元</div>
              <div className={styles.compareHint}>僅股利這條線；未計入與薪資合算後總淨額差異。</div>
            </div>
          </div>
          <p className={styles.caption}>實務須以國稅局試算或專業協助；此為讀者帶入計算機前的概念對照。</p>
        </div>
      </figure>

      <p className={styles.duoCaption}>
        兩圖內容與第四篇「54C 欄位」摘錄不同，專注<strong>整戶所得</strong>與<strong>課稅選項對照</strong>；仍為示意非截圖。
      </p>
    </div>
  );
}
