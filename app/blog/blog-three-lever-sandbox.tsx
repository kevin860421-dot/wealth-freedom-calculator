"use client";

import { useMemo, useState } from "react";
import styles from "./blog-three-lever-sandbox.module.css";

function formatPrincipal(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `${Math.round(n).toLocaleString("zh-TW")} 元`;
}

/**
 * 與財富自由計算機「同一語言」的三個槓桿：目標月流、稅後回報假設、再投入比例（教學用粗估）。
 */
export function BlogThreeLeverSandbox() {
  const [monthlyWan, setMonthlyWan] = useState(6);
  const [netYieldPct, setNetYieldPct] = useState(3.5);
  const [reinvestPct, setReinvestPct] = useState(70);

  const annualNeed = useMemo(() => monthlyWan * 10000 * 12, [monthlyWan]);
  const principalStatic = useMemo(() => {
    const y = netYieldPct / 100;
    if (y <= 0) return 0;
    return annualNeed / y;
  }, [annualNeed, netYieldPct]);

  const reinvestLabel = useMemo(() => {
    if (reinvestPct >= 75) return "再投入偏高：路徑更依賴複利與時間，與計算機表格假設較一致。";
    if (reinvestPct >= 40) return "再投入中庸：現金流與成長並重，建議在計算機分開試兩種再投入比例。";
    return "再投入偏低：短期花用壓力較小，但本金累積可能較慢——務必在試算裡對齊支出假設。";
  }, [reinvestPct]);

  return (
    <div className={styles.wrap} role="region" aria-label="三槓桿試算沙盒（教學用）">
      <p className={styles.title}>三槓桿沙盒：對齊財富自由計算機的輸入語言</p>
      <p className={styles.lead}>
        以下<strong>不取代</strong>完整試算：不計資本利得、通膨、稅務細節與配息波動；僅協助建立<strong>數量級</strong>與「該丟進計算機的變數」。
      </p>

      <div className={styles.row}>
        <div className={styles.rowTop}>
          <span>目標：稅後可花用的月現金流（萬元／月）</span>
          <span className={styles.value}>{monthlyWan.toFixed(1)} 萬</span>
        </div>
        <input
          className={styles.range}
          type="range"
          min={2}
          max={25}
          step={0.5}
          value={monthlyWan}
          onChange={(e) => setMonthlyWan(Number(e.target.value))}
          aria-label="目標月現金流萬元"
        />
      </div>

      <div className={styles.row}>
        <div className={styles.rowTop}>
          <span>假設：稅後「現金流回報」觀察區間（年化％，教學用）</span>
          <span className={styles.value}>{netYieldPct.toFixed(2)}%</span>
        </div>
        <input
          className={styles.range}
          type="range"
          min={1.5}
          max={9}
          step={0.25}
          value={netYieldPct}
          onChange={(e) => setNetYieldPct(Number(e.target.value))}
          aria-label="稅後現金流回報假設百分比"
        />
      </div>

      <div className={styles.row}>
        <div className={styles.rowTop}>
          <span>紀律：股利／配息中預計再投入的比例</span>
          <span className={styles.value}>{reinvestPct}%</span>
        </div>
        <input
          className={styles.range}
          type="range"
          min={0}
          max={100}
          step={5}
          value={reinvestPct}
          onChange={(e) => setReinvestPct(Number(e.target.value))}
          aria-label="再投入比例百分比"
        />
      </div>

      <div className={styles.result}>
        <div className={styles.resultLabel}>靜態覆蓋想像（僅配息、不計增值）</div>
        <div className={styles.resultMain}>
          粗估需約 <strong>{formatPrincipal(principalStatic)}</strong> 的本金（僅數學倒推）
        </div>
        <div className={styles.resultSub}>
          年需求約 {Math.round(annualNeed).toLocaleString("zh-TW")} 元／年 ÷ {netYieldPct.toFixed(2)}% ≈
          上列金額。{reinvestLabel}
        </div>
      </div>

      <p className={styles.note}>
        實務上請以<strong>財富自由計算機</strong>輸入：定期定額、再投入、級距稅、二代健保與手續費等，才能接近個案現實。
      </p>
    </div>
  );
}
