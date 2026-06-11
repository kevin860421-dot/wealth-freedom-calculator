"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AutoShrinkEtaValue, MobileGoalKpiGrid } from "./mobile-kpi-auto-shrink";
import { amountFromInvertedRange, invertedFillPct } from "./quick-inverted-range";
import styles from "./mobile-goal-setting-section.module.css";

export type MobileGoalCalcMode = "forward" | "reverse";

export type MobileGoalSettingSectionProps = {
  targetQuarterIncome: string;
  setTargetQuarterIncome: (v: string) => void;
  targetQuarterIncomeNum: number;
  requiredMonthlyToAchieveInYears: number | null;
  suggestedMonthlyDisplay: string;
  requiredAssetsForTarget: number | null;
  fireEtaStr: string;
  /** 今年 + 目標年期、月份為當月（例：2036 年 5 月） */
  reverseTargetDateStr: string;
  reverseYears: number;
  setReverseYears: (n: number) => void;
  calcMode: MobileGoalCalcMode;
  onCalcModeChange: (mode: MobileGoalCalcMode) => void;
};

const INCOME_RANGE_MAX = 200000;
const INCOME_RANGE_STEP = 5000;
const YEARS_MIN = 1;
const YEARS_MAX = 100;

/**
 * 手機版目標儀表板：預計達成時間／建議每月投入 Tab 切換（#mobile-goal-setting）。
 */
export function MobileGoalSettingSection({
  targetQuarterIncome,
  setTargetQuarterIncome,
  targetQuarterIncomeNum,
  suggestedMonthlyDisplay,
  requiredAssetsForTarget,
  fireEtaStr,
  reverseTargetDateStr,
  reverseYears,
  setReverseYears,
  calcMode,
  onCalcModeChange,
}: MobileGoalSettingSectionProps) {
  const isForward = calcMode === "forward";
  const incomeClamped = Math.min(INCOME_RANGE_MAX, Math.max(0, targetQuarterIncomeNum));
  const incomeFillPct = `${(incomeClamped / INCOME_RANGE_MAX) * 100}%`;
  const yearsSliderDisplay = YEARS_MAX - reverseYears + YEARS_MIN;
  const yearsFillPct = invertedFillPct(reverseYears, YEARS_MIN, YEARS_MAX);

  const [incomeFlash, setIncomeFlash] = useState(false);
  const [assetsFlash, setAssetsFlash] = useState(false);
  const [yearsFlash, setYearsFlash] = useState(false);
  const [sliderToast, setSliderToast] = useState<string | null>(null);
  const prevIncome = useRef(targetQuarterIncomeNum);
  const prevAssets = useRef(requiredAssetsForTarget);
  const prevYears = useRef(reverseYears);
  const prevIncomeToast = useRef<number | null>(null);

  useEffect(() => {
    if (prevIncome.current !== targetQuarterIncomeNum) {
      prevIncome.current = targetQuarterIncomeNum;
      setIncomeFlash(true);
      const t = window.setTimeout(() => setIncomeFlash(false), 320);
      return () => window.clearTimeout(t);
    }
  }, [targetQuarterIncomeNum]);

  useEffect(() => {
    if (prevIncomeToast.current === null) {
      prevIncomeToast.current = targetQuarterIncomeNum;
      return;
    }
    const prev = prevIncomeToast.current;
    if (prev === targetQuarterIncomeNum) return;
    const d = targetQuarterIncomeNum - prev;
    prevIncomeToast.current = targetQuarterIncomeNum;
    if (d === 0) return;
    setSliderToast(
      d > 0 ? `每月多 ${Math.abs(d).toLocaleString("zh-TW")} 元` : `每月少 ${Math.abs(d).toLocaleString("zh-TW")} 元`,
    );
    const t = window.setTimeout(() => setSliderToast(null), 1000);
    return () => window.clearTimeout(t);
  }, [targetQuarterIncomeNum]);

  useEffect(() => {
    if (prevAssets.current !== requiredAssetsForTarget) {
      prevAssets.current = requiredAssetsForTarget;
      setAssetsFlash(true);
      const t = window.setTimeout(() => setAssetsFlash(false), 320);
      return () => window.clearTimeout(t);
    }
  }, [requiredAssetsForTarget]);

  useEffect(() => {
    if (prevYears.current !== reverseYears) {
      prevYears.current = reverseYears;
      setYearsFlash(true);
      const t = window.setTimeout(() => setYearsFlash(false), 320);
      return () => window.clearTimeout(t);
    }
  }, [reverseYears]);

  return (
    <section
      id="mobile-goal-setting"
      key={calcMode}
      className={`${styles.root} ${isForward ? "" : styles.rootReverse}`}
      aria-labelledby="mobile-goal-setting-title"
    >
      <div className={styles.modeTabs} role="tablist" aria-label="計算模式">
        <button
          type="button"
          role="tab"
          aria-selected={isForward}
          className={`${styles.modeTab} ${isForward ? styles.modeTabActive : ""}`}
          onClick={() => onCalcModeChange("forward")}
        >
          ⏱️ 預計達成時間
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isForward}
          className={`${styles.modeTab} ${!isForward ? styles.modeTabActive : ""}`}
          onClick={() => onCalcModeChange("reverse")}
        >
          💰 建議每月投入
        </button>
      </div>

      <div className={styles.inputPanel}>
        <h2 id="mobile-goal-setting-title" className={styles.title}>
          {isForward ? "目標月收入" : "目標達成年"}
        </h2>

        {isForward ? (
          <>
            <div className={styles.bigNumArea}>
              <div className={styles.sliderToastSlot} aria-hidden={!sliderToast}>
                <div
                  className={`${styles.sliderToast} ${sliderToast ? styles.sliderToastVisible : ""}`}
                  role="status"
                  aria-live="polite"
                >
                  {sliderToast ?? "\u00a0"}
                </div>
              </div>
              <div className={`${styles.bigNumWrap} ${incomeFlash ? styles.bigNumWrapFlash : ""}`}>
                <div className={styles.bigNumRow}>
                  <span className={styles.bigNumDigits}>{targetQuarterIncomeNum.toLocaleString("zh-TW")}</span>
                  <span className={styles.bigUnit}>元/月</span>
                </div>
              </div>
            </div>
            <div className={styles.sliderWrap}>
              <input
                type="range"
                min={0}
                max={INCOME_RANGE_MAX}
                step={INCOME_RANGE_STEP}
                value={incomeClamped}
                onChange={(e) => setTargetQuarterIncome(e.target.value)}
                className={styles.range}
                style={{ "--fill-pct": incomeFillPct } as CSSProperties}
                aria-label="目標月收入"
              />
            </div>
          </>
        ) : (
          <>
            <div className={styles.bigNumArea}>
              <div className={`${styles.bigNumWrap} ${yearsFlash ? styles.bigNumWrapFlash : ""}`}>
                <div className={styles.bigNumRow}>
                  <span className={`${styles.bigNumDigits} ${styles.bigNumDigitsCyan}`}>{reverseYears}</span>
                  <span className={styles.bigUnit}>年</span>
                </div>
                <p className={styles.reverseTargetDate}>
                  <span className={styles.reverseTargetDateLabel}>對應年月</span>
                  {reverseTargetDateStr}
                </p>
              </div>
            </div>
            <div className={styles.sliderWrap}>
              <input
                type="range"
                min={YEARS_MIN}
                max={YEARS_MAX}
                step={1}
                value={yearsSliderDisplay}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  const next = amountFromInvertedRange(raw, YEARS_MIN, YEARS_MAX);
                  if (next === reverseYears) return;
                  setReverseYears(next);
                }}
                className={`${styles.range} ${styles.rangeYears}`}
                style={{ "--fill-pct": yearsFillPct } as CSSProperties}
                aria-label="目標達成年滑桿"
              />
            </div>
          </>
        )}
      </div>

      <MobileGoalKpiGrid
        gridClassName={styles.resultsGrid}
        cardClassNames={{
          secondary: styles.resultSecondary,
          primary: styles.resultPrimary,
          label: styles.resultLabel,
        }}
        leftText={suggestedMonthlyDisplay}
        rightText={
          requiredAssetsForTarget != null ? requiredAssetsForTarget.toLocaleString("zh-TW") : "—"
        }
        leftPending={suggestedMonthlyDisplay === "計算中…"}
        rightPending={false}
        rightFlash={assetsFlash}
      />

      {isForward ? (
        <div className={styles.etaCard} role="region" aria-label="預估達成時間">
          <p className={styles.etaLabel}>預估達成時間</p>
          <AutoShrinkEtaValue fireEtaStr={fireEtaStr} muted={fireEtaStr === "—"} />
        </div>
      ) : null}
    </section>
  );
}
