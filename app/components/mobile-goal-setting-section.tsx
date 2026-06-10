"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { stepperStyles } from "./mobile-stepper-fields";
import styles from "./mobile-goal-setting-section.module.css";

export type MobileGoalCalcMode = "forward" | "reverse";

export type MobileGoalSettingSectionProps = {
  targetQuarterIncome: string;
  setTargetQuarterIncome: (v: string) => void;
  targetQuarterIncomeNum: number;
  requiredMonthlyToAchieveInYears: number | null;
  suggestedMonthlyDisplay: string;
  requiredAssetsForTarget: number | null;
  parseFormula: (s: string) => number;
  fireEtaStr: string;
  fireEtaYears: number | null;
  reverseMonthlyIncome: number | null;
  reverseYears: number;
  setReverseYears: (n: number) => void;
  calcMode: MobileGoalCalcMode;
  onCalcModeChange: (mode: MobileGoalCalcMode) => void;
};

const INCOME_RANGE_MAX = 200000;
const INCOME_RANGE_STEP = 5000;
const YEARS_MIN = 1;
const YEARS_MAX = 100;

function clampYears(n: number) {
  return Math.max(YEARS_MIN, Math.min(YEARS_MAX, Math.round(n)));
}

/**
 * 手機版目標儀表板：金額順推／年期反推 Tab 切換（#mobile-goal-setting）。
 */
export function MobileGoalSettingSection({
  targetQuarterIncome,
  setTargetQuarterIncome,
  targetQuarterIncomeNum,
  suggestedMonthlyDisplay,
  requiredAssetsForTarget,
  parseFormula,
  fireEtaStr,
  fireEtaYears,
  reverseMonthlyIncome,
  reverseYears,
  setReverseYears,
  calcMode,
  onCalcModeChange,
}: MobileGoalSettingSectionProps) {
  const isForward = calcMode === "forward";
  const incomeClamped = Math.min(INCOME_RANGE_MAX, Math.max(0, targetQuarterIncomeNum));
  const incomeFillPct = `${(incomeClamped / INCOME_RANGE_MAX) * 100}%`;
  const yearsFillPct = `${((reverseYears - YEARS_MIN) / (YEARS_MAX - YEARS_MIN)) * 100}%`;
  const yearsSliderDisplay = YEARS_MAX - reverseYears + YEARS_MIN;

  const [incomeFlash, setIncomeFlash] = useState(false);
  const [assetsFlash, setAssetsFlash] = useState(false);
  const [yearsFlash, setYearsFlash] = useState(false);
  const [sliderToast, setSliderToast] = useState<string | null>(null);
  const prevIncome = useRef(targetQuarterIncomeNum);
  const prevAssets = useRef(requiredAssetsForTarget);
  const prevYears = useRef(reverseYears);
  const prevIncomeToast = useRef<number | null>(null);

  const [yearsText, setYearsText] = useState(String(reverseYears));

  useEffect(() => {
    setYearsText(String(reverseYears));
  }, [reverseYears]);

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

  const bumpYears = (delta: number) => {
    setReverseYears(clampYears(reverseYears + delta));
  };

  const commitYearsText = () => {
    const n = clampYears(parseFormula(yearsText) || reverseYears);
    setReverseYears(n);
    setYearsText(String(n));
  };

  const metricsReady = isForward ? fireEtaStr !== "—" : reverseMonthlyIncome != null && reverseMonthlyIncome > 0;

  const bottomMain = isForward
    ? fireEtaStr
    : reverseMonthlyIncome != null && reverseMonthlyIncome > 0
      ? reverseMonthlyIncome.toLocaleString("zh-TW")
      : "—";

  const assetsHint = isForward
    ? fireEtaYears != null
      ? `約 ${fireEtaYears} 年後達成`
      : "依目前投入試算"
    : `${reverseYears} 年內達標試算`;

  return (
    <section id="mobile-goal-setting" className={styles.root} aria-labelledby="mobile-goal-setting-title">
      <div className={styles.modeTabs} role="tablist" aria-label="計算模式">
        <button
          type="button"
          role="tab"
          aria-selected={isForward}
          className={`${styles.modeTab} ${isForward ? styles.modeTabActive : ""}`}
          onClick={() => onCalcModeChange("forward")}
        >
          💰 金額順推
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isForward}
          className={`${styles.modeTab} ${!isForward ? styles.modeTabActive : ""}`}
          onClick={() => onCalcModeChange("reverse")}
        >
          ⏳ 年期反推
        </button>
      </div>

      <div className={styles.inputPanel}>
        <h2 id="mobile-goal-setting-title" className={styles.title}>
          {isForward ? "目標月收入" : "目標達成年期"}
        </h2>

        {isForward ? (
          <>
            <div className={styles.bigNumArea}>
              {sliderToast ? (
                <div className={styles.sliderToast} role="status" aria-live="polite">
                  {sliderToast}
                </div>
              ) : null}
              <div className={`${styles.bigNumWrap} ${incomeFlash ? styles.bigNumWrapFlash : ""}`}>
                <p className={styles.bigNum}>
                  <span className={styles.bigNumDigits}>{targetQuarterIncomeNum.toLocaleString("zh-TW")}</span>
                  <span className={styles.bigUnit}>元 / 月</span>
                </p>
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
                <p className={styles.bigNum}>
                  <span className={`${styles.bigNumDigits} ${styles.bigNumDigitsCyan}`}>{reverseYears}</span>
                  <span className={styles.bigUnit}>年</span>
                </p>
              </div>
            </div>

            <div className={stepperStyles.fieldInputWrap}>
              <div className={stepperStyles.stepperRow}>
                <button type="button" className={stepperStyles.circleStepBtn} aria-label="增加一年" onClick={() => bumpYears(1)}>
                  +
                </button>
                <div className={stepperStyles.inputRow}>
                  <div className={stepperStyles.inputFieldScroll}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={yearsText}
                      onChange={(e) => setYearsText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          commitYearsText();
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      onBlur={commitYearsText}
                      onFocus={(e) => e.target.select()}
                      className={`${stepperStyles.inputField} ${styles.yearsInputGlow}`}
                      aria-label="目標達成年期"
                    />
                  </div>
                </div>
                <button type="button" className={stepperStyles.circleStepBtn} aria-label="減少一年" onClick={() => bumpYears(-1)}>
                  −
                </button>
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
                  if (!Number.isFinite(raw)) return;
                  setReverseYears(clampYears(YEARS_MAX - raw + YEARS_MIN));
                }}
                className={`${styles.range} ${styles.rangeYears}`}
                style={{ "--fill-pct": yearsFillPct } as CSSProperties}
                aria-label="目標達成年期滑桿"
              />
              <div className={styles.scaleRow}>
                <span>{YEARS_MAX}</span>
                <span>{YEARS_MIN}</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className={styles.resultsGrid}>
        <div className={styles.resultSecondary}>
          <div className={styles.resultLabel}>建議每月投入</div>
          <div className={styles.resultValueSecondary}>
            {suggestedMonthlyDisplay === "—" || suggestedMonthlyDisplay === "計算中…"
              ? suggestedMonthlyDisplay
              : `${suggestedMonthlyDisplay} 元`}
          </div>
        </div>
        <div className={styles.resultPrimary}>
          <div className={styles.resultLabel}>達成所需資產</div>
          <div className={`${styles.resultValuePrimary} ${assetsFlash ? styles.resultValuePrimaryFlash : ""}`}>
            {requiredAssetsForTarget != null ? `${requiredAssetsForTarget.toLocaleString("zh-TW")} 元` : "—"}
          </div>
          <div className={styles.resultYearsHint}>{assetsHint}</div>
        </div>
      </div>

      <div className={styles.etaCard} role="region" aria-label={isForward ? "預估達成時間" : "反推預估可月領"}>
        <p className={styles.etaLabel}>{isForward ? "預估達成時間" : "🔮 反推預估可月領"}</p>
        <p className={styles.etaMainRow}>
          <span className={`${styles.etaMain} ${!metricsReady ? styles.etaMainMuted : ""}`}>{bottomMain}</span>
          {!isForward ? <span className={styles.etaUnitInline}>元 / 月</span> : null}
        </p>
        <p className={styles.etaSub}>{isForward ? "距離財富自由" : "依目前每月投入試算"}</p>
      </div>
    </section>
  );
}
