"use client";

import { useMemo, useState } from "react";
import styles from "./blog-etf-54c-composition.module.css";

const NHI2_THRESHOLD = 20000;
const NHI2_RATE = 0.0211;

function fmt(n: number): string {
  return Math.round(n).toLocaleString("zh-TW");
}

/**
 * 教學用：現金股利拆成「54C 應稅股利」與其餘（含平準金等示意），對齊站內二代健保門檻邏輯。
 */
export function BlogEtf54cComposition() {
  const [cashDividend, setCashDividend] = useState(80000);
  const [ratio54cPct, setRatio54cPct] = useState(72);

  const amount54c = useMemo(() => (cashDividend * ratio54cPct) / 100, [cashDividend, ratio54cPct]);
  const rest = useMemo(() => cashDividend - amount54c, [cashDividend, amount54c]);
  const nhi2 = useMemo(() => {
    if (amount54c < NHI2_THRESHOLD) return 0;
    return Math.round(amount54c * NHI2_RATE);
  }, [amount54c]);

  return (
    <div className={styles.wrap} role="region" aria-label="ETF 配息與 54C 組成試算（教學）">
      <p className={styles.title}>配息組成沙盒：54C 計入 vs 其餘（平準金等示意）</p>
      <p className={styles.lead}>
        站內試算與
        <strong>二代健保補充保費門檻</strong>皆以<strong>54C 應稅股利計入金額</strong>判斷，不是「配息簡訊上的總額」直接代入。下表可對照常見占比想像。
      </p>

      <div className={styles.presets}>
        <button type="button" className={styles.preset} onClick={() => { setCashDividend(50000); setRatio54cPct(85); }}>
          5 萬配息 · 54C 偏高（示意）
        </button>
        <button type="button" className={styles.preset} onClick={() => { setCashDividend(80000); setRatio54cPct(45); }}>
          8 萬配息 · 平準金占比較高（示意）
        </button>
        <button type="button" className={styles.preset} onClick={() => { setCashDividend(120000); setRatio54cPct(70); }}>
          12 萬 · 典型區間
        </button>
      </div>

      <div className={styles.row}>
        <div className={styles.rowTop}>
          <span>這次入帳現金股利（元）</span>
          <span className={styles.value}>{fmt(cashDividend)}</span>
        </div>
        <input
          className={styles.range}
          type="range"
          min={15000}
          max={200000}
          step={5000}
          value={cashDividend}
          onChange={(e) => setCashDividend(Number(e.target.value))}
          aria-label="現金股利金額"
        />
      </div>

      <div className={styles.row}>
        <div className={styles.rowTop}>
          <span>54C 應稅股利約占現金股利</span>
          <span className={styles.value}>{ratio54cPct}%</span>
        </div>
        <input
          className={styles.range}
          type="range"
          min={25}
          max={100}
          step={5}
          value={ratio54cPct}
          onChange={(e) => setRatio54cPct(Number(e.target.value))}
          aria-label="54C 占比百分比"
        />
      </div>

      <div className={styles.split}>
        <div className={styles.box}>
          <strong>54C 應稅股利（計入健保／所得稅基礎之示意）</strong>
          <span className={styles.amt}>{fmt(amount54c)} 元</span>
        </div>
        <div className={styles.box}>
          <strong>其餘（含收益平準金等，本沙盒不細拆）</strong>
          <span className={styles.amt}>{fmt(rest)} 元</span>
        </div>
      </div>

      <div className={styles.nhiLine}>
        {amount54c >= NHI2_THRESHOLD ? (
          <>
            54C 計入已達 <strong>2 萬</strong>門檻 → 補充保費試算：{fmt(amount54c)} × 2.11% = <strong>{fmt(nhi2)}</strong> 元。
          </>
        ) : (
          <>
            54C 計入 <strong>未達</strong> 2 萬門檻 → 本教學假設下補充保費 <strong>0</strong> 元（若誤用「總配息」相乘會高估）。
          </>
        )}
      </div>

      <p className={styles.note}>
        各檔 ETF 年報、配息公告與成分比例不同；請以發放單位、基金公司揭露與主管機關認定為準。資本利得與非 54C 之配息類型不在此沙盒逐項拆分。
      </p>
    </div>
  );
}
