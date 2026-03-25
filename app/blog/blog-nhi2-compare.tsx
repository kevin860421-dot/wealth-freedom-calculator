"use client";

import { useMemo, useState } from "react";
import styles from "./blog-nhi2-compare.module.css";

const NHI2_THRESHOLD = 20000;
const NHI2_RATE = 0.0211;

function formatMoney(n: number): string {
  return Math.round(n).toLocaleString("zh-TW");
}

/**
 * 與首頁試算一致：54C 應稅基數 ≥ 2 萬時，對該基數課 2.11% 補充保費（教學用）。
 */
export function BlogNhi2Compare() {
  const [gross, setGross] = useState(50000);
  const [ratioPct, setRatioPct] = useState(100);

  const taxableBase = useMemo(() => (gross * ratioPct) / 100, [gross, ratioPct]);
  const nhi2 = useMemo(() => {
    if (taxableBase < NHI2_THRESHOLD) return 0;
    return Math.round(taxableBase * NHI2_RATE);
  }, [taxableBase]);
  const netAfterNhi2 = gross - nhi2;

  const applyPreset = (g: number, r: number) => {
    setGross(g);
    setRatioPct(r);
  };

  return (
    <div className={styles.wrap} role="region" aria-label="二代健保補充保費試算對照">
      <p className={styles.title}>有沒有「二代健保補充保費」，實拿差多少？</p>
      <p className={styles.sub}>
        以下<strong>只談補充保費這一刀</strong>（先假設不扣所得稅），規則與站內計算機相同：以<strong>54C 應稅股利計入金額</strong>判斷是否達{" "}
        <strong>2 萬</strong>門檻；達門檻則對該計入金額課 <strong>2.11%</strong>。
      </p>

      <div className={styles.controls}>
        <div className={styles.row}>
          <div className={styles.rowTop}>
            <span>這期現金股利（元）</span>
            <span className={styles.value}>{formatMoney(gross)}</span>
          </div>
          <input
            className={styles.range}
            type="range"
            min={5000}
            max={150000}
            step={1000}
            value={gross}
            onChange={(e) => setGross(Number(e.target.value))}
            aria-valuemin={5000}
            aria-valuemax={150000}
            aria-valuenow={gross}
            aria-label="現金股利金額"
          />
        </div>
        <div className={styles.row}>
          <div className={styles.rowTop}>
            <span>54C 應稅股利約占現金股利</span>
            <span className={styles.value}>{ratioPct}%</span>
          </div>
          <input
            className={styles.range}
            type="range"
            min={30}
            max={100}
            step={5}
            value={ratioPct}
            onChange={(e) => setRatioPct(Number(e.target.value))}
            aria-valuemin={30}
            aria-valuemax={100}
            aria-valuenow={ratioPct}
            aria-label="54C 應稅股利占比"
          />
          <div className={styles.presetRow}>
            <button type="button" className={styles.preset} onClick={() => applyPreset(30000, 100)}>
              3 萬 · 全 54C
            </button>
            <button type="button" className={styles.preset} onClick={() => applyPreset(50000, 60)}>
              5 萬 · 54C 60%（臨界附近）
            </button>
            <button type="button" className={styles.preset} onClick={() => applyPreset(100000, 100)}>
              10 萬 · 全 54C
            </button>
          </div>
        </div>
      </div>

      <p className={styles.sub} style={{ marginBottom: "0.65rem" }}>
        本期 <strong>54C 計入金額</strong> ≈ {formatMoney(taxableBase)} 元
        {taxableBase < NHI2_THRESHOLD ? (
          <>
            ，<strong>未達</strong> 2 萬門檻 → 補充保費 <strong>0</strong> 元。
          </>
        ) : (
          <>
            ，<strong>已達</strong> 門檻 → 補充保費試算 {formatMoney(taxableBase)} × 2.11% = <strong>{formatMoney(nhi2)}</strong> 元。
          </>
        )}
      </p>

      <div className={styles.cards}>
        <div className={styles.card}>
          <div className={styles.cardLabel}>不扣補充保費時（僅示意）</div>
          <div className={styles.cardAmt}>{formatMoney(gross)} 元</div>
          <div className={styles.cardAmtSmall}>帳上現金股利金額</div>
        </div>
        <div className={`${styles.card} ${nhi2 === 0 ? styles.cardMuted : ""}`}>
          <div className={styles.cardLabel}>扣完補充保費後（仍不含所得稅）</div>
          <div className={styles.cardAmt}>{formatMoney(netAfterNhi2)} 元</div>
          <div className={styles.cardAmtSmall}>
            {nhi2 > 0 ? `已扣補充保費 ${formatMoney(nhi2)} 元` : "本次無補充保費"}
          </div>
        </div>
      </div>

      <div className={styles.diff}>
        {nhi2 > 0 ? (
          <>
            光<strong>二代健保</strong>這一刀，就比「不觸發補充保費」時少拿 <strong>{formatMoney(nhi2)}</strong> 元（同一筆現金股利前提下）。
          </>
        ) : (
          <>
            這組數字下<strong>沒有</strong>補充保費；試著拉高股利或 54C 占比，跨過 2 萬計入門檻，右欄就會開始少一截。
          </>
        )}
      </div>

      <p className={styles.note}>
        ETF 若含收益平準金等，54C 占比常低於 100%，門檻感會變「同樣配息、不一定會扣到」——可拖曳上方占比感受差異。實際扣繳以發放單位與當年度法令為準。
      </p>
    </div>
  );
}
