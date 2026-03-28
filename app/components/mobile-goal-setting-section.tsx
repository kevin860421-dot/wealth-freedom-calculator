"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./mobile-goal-setting-section.module.css";

export type PayoutFrequency = "month" | "quarter" | "semiannual" | "year";

export type MobileGoalSettingSectionProps = {
  targetQuarterIncome: string;
  setTargetQuarterIncome: (v: string) => void;
  targetQuarterIncomeNum: number;
  targetYearsToAchieve: string;
  setTargetYearsToAchieve: (v: string) => void;
  payoutFrequency: PayoutFrequency;
  handlePayoutFrequencyChange: (v: PayoutFrequency) => void;
  requiredMonthlyToAchieveInYears: number | null;
  requiredAssetsForTarget: number | null;
  commitFormula: (s: string) => string;
  parseFormula: (s: string) => number;
};

const RANGE_MAX = 200000;
const RANGE_STEP = 5000;

/**
 * 手機版「目標設定」區塊（#mobile-goal-setting）。僅排版／互動，計算由父層。
 */
export function MobileGoalSettingSection({
  targetQuarterIncome,
  setTargetQuarterIncome,
  targetQuarterIncomeNum,
  targetYearsToAchieve,
  setTargetYearsToAchieve,
  payoutFrequency,
  handlePayoutFrequencyChange,
  requiredMonthlyToAchieveInYears,
  requiredAssetsForTarget,
  commitFormula,
  parseFormula,
}: MobileGoalSettingSectionProps) {
  const clamped = Math.min(RANGE_MAX, Math.max(0, targetQuarterIncomeNum));
  const fillPct = `${(clamped / RANGE_MAX) * 100}%`;

  const [incomeFlash, setIncomeFlash] = useState(false);
  const [assetsFlash, setAssetsFlash] = useState(false);
  const prevIncome = useRef(targetQuarterIncomeNum);
  const prevAssets = useRef(requiredAssetsForTarget);

  useEffect(() => {
    if (prevIncome.current !== targetQuarterIncomeNum) {
      prevIncome.current = targetQuarterIncomeNum;
      setIncomeFlash(true);
      const t = window.setTimeout(() => setIncomeFlash(false), 320);
      return () => window.clearTimeout(t);
    }
  }, [targetQuarterIncomeNum]);

  useEffect(() => {
    if (prevAssets.current !== requiredAssetsForTarget) {
      prevAssets.current = requiredAssetsForTarget;
      setAssetsFlash(true);
      const t = window.setTimeout(() => setAssetsFlash(false), 320);
      return () => window.clearTimeout(t);
    }
  }, [requiredAssetsForTarget]);

  return (
    <section id="mobile-goal-setting" className={styles.root} aria-labelledby="mobile-goal-setting-title">
      <div className={styles.titleBlock}>
        <h2 id="mobile-goal-setting-title" className={styles.title}>
          目標設定
        </h2>
        <p className={styles.subtitle}>調整你的財富自由目標</p>
      </div>

      <div className={styles.sliderSection}>
        <p className={styles.sliderLabel}>目標月收入</p>
        <div className={`${styles.bigNumWrap} ${incomeFlash ? styles.bigNumWrapFlash : ""}`}>
          <p className={styles.bigNum}>
            {targetQuarterIncomeNum.toLocaleString("zh-TW")}
            <span className={styles.bigUnit}>元 / 月</span>
          </p>
        </div>

        <div className={styles.sliderWrap}>
          <input
            type="range"
            min={0}
            max={RANGE_MAX}
            step={RANGE_STEP}
            value={clamped}
            onChange={(e) => setTargetQuarterIncome(e.target.value)}
            className={styles.range}
            style={{ "--fill-pct": fillPct } as CSSProperties}
            aria-label="目標月收入"
          />
        </div>
        <div className={styles.scaleRow}>
          <span>0</span>
          <span style={{ color: "#94a3b8", fontWeight: 600 }}>{clamped.toLocaleString("zh-TW")} 元/月</span>
          <span>200,000</span>
        </div>

        <div className={styles.manualRow}>
          <span className={styles.manualLabel}>手動輸入（元／月）</span>
          <input
            type="text"
            inputMode="decimal"
            value={targetQuarterIncome}
            onChange={(e) => setTargetQuarterIncome(e.target.value)}
            onBlur={() => setTargetQuarterIncome(commitFormula(targetQuarterIncome))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setTargetQuarterIncome(commitFormula(targetQuarterIncome));
                (e.target as HTMLInputElement).blur();
              }
            }}
            className={styles.manualInput}
            aria-label="手動輸入目標月收入"
          />
        </div>
      </div>

      <div className={styles.secondaryGrid}>
        <div className={styles.cell}>
          <span className={styles.cellLabel}>領息頻率</span>
          <div className={styles.segmented} role="group" aria-label="領息頻率">
            {(["month", "quarter", "semiannual", "year"] as const).map((v) => (
              <label
                key={v}
                className={`${styles.segLabel} ${payoutFrequency === v ? styles.segOn : styles.segOff}`}
              >
                <input
                  type="radio"
                  name="mobile-payout-freq"
                  checked={payoutFrequency === v}
                  onChange={() => handlePayoutFrequencyChange(v)}
                  style={{ display: "none" }}
                />
                {v === "month" ? "月" : v === "quarter" ? "季" : v === "semiannual" ? "半年" : "年"}
              </label>
            ))}
          </div>
        </div>
        <div className={styles.cell}>
          <span className={styles.cellLabel}>投資年期</span>
          <div className={styles.yearsInputWrap}>
            <input
              type="text"
              inputMode="numeric"
              value={targetYearsToAchieve}
              onChange={(e) => setTargetYearsToAchieve(e.target.value)}
              onBlur={() => setTargetYearsToAchieve(commitFormula(targetYearsToAchieve))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setTargetYearsToAchieve(commitFormula(targetYearsToAchieve));
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className={styles.yearsField}
              aria-label="投資年期"
            />
            <div className={styles.yearsStep}>
              <button
                type="button"
                aria-label="增加一年"
                onClick={() => {
                  const n = Math.max(0, Math.round(parseFormula(targetYearsToAchieve) || 0));
                  setTargetYearsToAchieve(String(n + 1));
                }}
              >
                ▲
              </button>
              <button
                type="button"
                aria-label="減少一年"
                onClick={() => {
                  const n = Math.max(0, Math.round(parseFormula(targetYearsToAchieve) || 0));
                  setTargetYearsToAchieve(String(Math.max(0, n - 1)));
                }}
              >
                ▼
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.resultsStack}>
        <div className={styles.resultPrimary}>
          <div className={styles.resultLabel}>達成所需資產</div>
          <div
            className={`${styles.resultValuePrimary} ${assetsFlash ? styles.resultValuePrimaryFlash : ""}`}
          >
            {requiredAssetsForTarget != null ? `${requiredAssetsForTarget.toLocaleString("zh-TW")} 元` : "—"}
          </div>
        </div>
        <div className={styles.resultSecondary}>
          <div className={styles.resultLabel}>建議每月投入</div>
          <div className={styles.resultValueSecondary}>
            {requiredMonthlyToAchieveInYears != null ? `${requiredMonthlyToAchieveInYears.toLocaleString("zh-TW")} 元` : "—"}
          </div>
        </div>
      </div>

      <p className={styles.hint}>常見預設可從頂部參數橫幅「恢復預設」一鍵帶入。</p>
    </section>
  );
}
