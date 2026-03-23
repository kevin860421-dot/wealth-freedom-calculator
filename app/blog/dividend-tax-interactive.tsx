"use client";

import { useMemo, useState } from "react";
import {
  mergeTaxOnePayout,
  separateTaxOnePayout,
  fmtMoney,
} from "@/lib/dividend-tax-sandbox";
import styles from "./dividend-tax-interactive.module.css";

const MARGINAL_OPTIONS = [
  { value: 0.05, label: "5%（年收約 56 萬以下）" },
  { value: 0.12, label: "12%（年收約 56～126 萬）" },
  { value: 0.2, label: "20%（年收約 126～252 萬）" },
  { value: 0.3, label: "30%（年收約 252～472 萬）" },
  { value: 0.4, label: "40%（年收約 472 萬以上）" },
] as const;

const PERIODS_OPTIONS = [
  { value: 1, label: "每年 1 筆（例：年配）" },
  { value: 4, label: "每年 4 筆（例：季配）" },
  { value: 12, label: "每年 12 筆（例：月配）" },
] as const;

export function DividendTaxInteractive() {
  const [gross, setGross] = useState(100_000);
  const [mode, setMode] = useState<"separate" | "merge">("separate");
  const [marginal, setMarginal] = useState(0.12);
  const [useCredit, setUseCredit] = useState(true);
  const [periodsPerYear, setPeriodsPerYear] = useState(4);
  const [applyNhi2, setApplyNhi2] = useState(true);

  const separate = useMemo(() => separateTaxOnePayout(gross), [gross]);
  const merge = useMemo(
    () => mergeTaxOnePayout(gross, marginal, useCredit, applyNhi2, periodsPerYear),
    [gross, marginal, useCredit, applyNhi2, periodsPerYear]
  );

  const active = mode === "separate" ? separate : merge;
  const totalDeduct =
    mode === "separate"
      ? separate.tax + separate.nhi2
      : merge.tax + merge.nhi2;

  return (
    <section className={styles.section} aria-labelledby="tax-slider-heading">
      <h2 id="tax-slider-heading" className={styles.h2}>
        互動試算：拉動股利金額，看大概扣多少
      </h2>
      <p className={styles.lead}>
        以下與首頁計算機使用<strong>同一套試算假設</strong>（分離 28%、合併時含 8.5% 抵減與每戶上限分攤、二代健保 2.11% 門檻）。數字四捨五入，僅供理解用。
      </p>

      <div className={styles.modeRow}>
        <button
          type="button"
          className={mode === "separate" ? styles.modeOn : styles.modeOff}
          onClick={() => setMode("separate")}
        >
          分離課稅（28%）
        </button>
        <button
          type="button"
          className={mode === "merge" ? styles.modeOn : styles.modeOff}
          onClick={() => setMode("merge")}
        >
          合併課稅（可抵減 8.5%）
        </button>
      </div>

      {mode === "merge" && (
        <div className={styles.controls}>
          <label className={styles.label}>
            綜所稅邊際稅率
            <select
              className={styles.select}
              value={marginal}
              onChange={(e) => setMarginal(Number(e.target.value))}
            >
              {MARGINAL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.label}>
            每年配息筆數（影響 8 萬抵減上限分攤）
            <select
              className={styles.select}
              value={periodsPerYear}
              onChange={(e) => setPeriodsPerYear(Number(e.target.value))}
            >
              {PERIODS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={useCredit}
              onChange={(e) => setUseCredit(e.target.checked)}
            />
            套用股利可抵減稅額（8.5%）
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={applyNhi2}
              onChange={(e) => setApplyNhi2(e.target.checked)}
            />
            計入二代健保補充保費（單筆應稅基數 ≥ 2 萬時）
          </label>
        </div>
      )}

      <div className={styles.sliderBlock}>
        <div className={styles.sliderTop}>
          <span>單筆股利（現金）</span>
          <strong className={styles.grossStrong}>{fmtMoney(gross)} 元</strong>
        </div>
        <input
          type="range"
          min={0}
          max={500000}
          step={1000}
          value={gross}
          onChange={(e) => setGross(Number(e.target.value))}
          className={styles.range}
          aria-valuemin={0}
          aria-valuemax={500000}
          aria-valuenow={gross}
          aria-label="單筆股利金額"
        />
        <div className={styles.sliderTicks}>
          <span>0</span>
          <span>25 萬</span>
          <span>50 萬</span>
        </div>
      </div>

      <div className={styles.results}>
        <div className={styles.resultCard}>
          <div className={styles.resultLabel}>所得稅（試算）</div>
          <div className={styles.resultValue}>
            {fmtMoney(mode === "separate" ? separate.tax : merge.tax)} 元
          </div>
        </div>
        <div className={styles.resultCard}>
          <div className={styles.resultLabel}>二代健保（試算）</div>
          <div className={styles.resultValue}>
            {fmtMoney(mode === "separate" ? separate.nhi2 : merge.nhi2)} 元
          </div>
        </div>
        {mode === "merge" && (
          <div className={styles.resultCard}>
            <div className={styles.resultLabel}>當期可抵減（8.5% 上限內）</div>
            <div className={styles.resultValue}>{fmtMoney(merge.credit)} 元</div>
          </div>
        )}
        <div className={`${styles.resultCard} ${styles.resultHighlight}`}>
          <div className={styles.resultLabel}>預估實拿</div>
          <div className={styles.resultValueLarge}>{fmtMoney(active.net)} 元</div>
        </div>
      </div>

      <p className={styles.totalHint}>
        本期合計扣款（稅＋健保）約 <strong>{fmtMoney(totalDeduct)}</strong> 元
      </p>
      <p className={styles.microDisclaimer}>
        與首頁「財富自由計算機」表格邏輯一致；個案、年度與申報方式不同時結果會不同，不構成稅務建議。
      </p>
    </section>
  );
}
