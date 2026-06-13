"use client";

import type { RateHikePreset } from "./quick11-advanced-calculations";
import { RATE_HIKE_PRESETS } from "./quick11-advanced-calculations";
import { formatMoney } from "./logic";
import styles from "./quick11-rate-hike-panel.module.css";

export type RateHikeCrisisTheme = "relief" | "safe" | "caution" | "warn" | "critical";

export function resolveRateHikeCrisisTheme(preset: RateHikePreset): RateHikeCrisisTheme {
  if (preset === "minus25bp") return "relief";
  if (preset === "flat") return "safe";
  if (preset === "plus25bp") return "caution";
  if (preset === "plus50bp") return "warn";
  return "critical";
}

export type Quick11RateHikePanelProps = {
  isLight?: boolean;
  rateHikePreset: RateHikePreset;
  onRateHikePreset: (p: RateHikePreset) => void;
  hikeMonthlyPayment: number;
  hikeDtiPct: number;
  hikeTotalInterest: number;
  hikeInterestDelta: number;
  annualRate: number;
  scenarioRate: number;
};

type ThemeKind = "wrap" | "chipActive" | "primary" | "secondary" | "value" | "alert";

function themeClass(theme: RateHikeCrisisTheme, isLight: boolean, kind: ThemeKind) {
  const prefix = isLight ? "Light" : "Dark";
  const map: Record<RateHikeCrisisTheme, Record<ThemeKind, string>> = {
    relief: {
      wrap: styles[`themeRelief${prefix}`],
      chipActive: styles[`chipActiveRelief${prefix}`],
      primary: styles[`primaryRelief${prefix}`],
      secondary: styles[`secondaryRelief${prefix}`],
      value: styles[`valueRelief${prefix}`],
      alert: styles[`alertRelief${prefix}`],
    },
    safe: {
      wrap: styles[`themeSafe${prefix}`],
      chipActive: styles[`chipActiveSafe${prefix}`],
      primary: styles[`primarySafe${prefix}`],
      secondary: styles[`secondarySafe${prefix}`],
      value: styles[`valueSafe${prefix}`],
      alert: styles[`alertSafe${prefix}`],
    },
    caution: {
      wrap: styles[`themeCaution${prefix}`],
      chipActive: styles[`chipActiveCaution${prefix}`],
      primary: styles[`primaryCaution${prefix}`],
      secondary: styles[`secondaryCaution${prefix}`],
      value: styles[`valueCaution${prefix}`],
      alert: styles[`alertCaution${prefix}`],
    },
    warn: {
      wrap: styles[`themeWarn${prefix}`],
      chipActive: styles[`chipActiveWarn${prefix}`],
      primary: styles[`primaryWarn${prefix}`],
      secondary: styles[`secondaryWarn${prefix}`],
      value: styles[`valueWarn${prefix}`],
      alert: styles[`alertWarn${prefix}`],
    },
    critical: {
      wrap: styles[`themeCritical${prefix}`],
      chipActive: styles[`chipActiveCritical${prefix}`],
      primary: styles[`primaryCritical${prefix}`],
      secondary: styles[`secondaryCritical${prefix}`],
      value: styles[`valueCritical${prefix}`],
      alert: styles[`alertCritical${prefix}`],
    },
  };
  return map[theme][kind];
}

function alertMessage(preset: RateHikePreset, hikeDtiPct: number): string {
  if (preset === "minus25bp") {
    return "✅ 降息有感！月付壓力減輕，多出來的錢建議改投市場進行複利翻轉。";
  }
  if (preset === "flat") {
    return "央行維持現狀：月付與負債比維持基準，可作為對照起點。";
  }
  if (preset === "plus25bp") {
    return "小幅升息 1 碼：月付與總利息開始上升，宜預留緩衝或評估轉貸談判。";
  }
  if (preset === "plus50bp") {
    return "⚠️ 負債比逼近 50%！每月可支配所得受到壓縮，請開始注意記帳與家庭開銷。";
  }
  if (hikeDtiPct > 50) {
    return "🚨 負債比破 50%：斷頭法拍風險升高，請優先檢視現金流、備援金與轉貸／展期選項。";
  }
  return "🚨 終極暴升：財務防線大幅削弱，月付與總利息激增，請立即盤點家庭現金流。";
}

function formatInterestDelta(delta: number): string {
  const sign = delta >= 0 ? "+ " : "− ";
  return `${sign}NT$ ${formatMoney(Math.abs(delta))}`;
}

export function Quick11RateHikePanel(props: Quick11RateHikePanelProps) {
  const {
    isLight = false,
    rateHikePreset,
    onRateHikePreset,
    hikeMonthlyPayment,
    hikeDtiPct,
    hikeTotalInterest,
    hikeInterestDelta,
    annualRate,
    scenarioRate,
  } = props;

  const crisisTheme = resolveRateHikeCrisisTheme(rateHikePreset);
  const presets = RATE_HIKE_PRESETS;

  return (
    <div className={`${styles.wrap} ${themeClass(crisisTheme, isLight, "wrap")}`}>
      <p className={`${styles.lead} ${isLight ? styles.leadLight : styles.leadDark}`}>
        一鍵切換利率情境，即時看月付與負債比是否「爆炸」。
      </p>

      <div className={styles.chipGrid}>
        {presets.map((preset, index) => {
          const active = rateHikePreset === preset.id;
          const presetTheme = resolveRateHikeCrisisTheme(preset.id);
          const isLast = index === presets.length - 1;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onRateHikePreset(preset.id)}
              className={`${styles.chip} ${isLight ? styles.chipLight : styles.chipDark} ${
                isLast ? styles.chipFull : ""
              } ${active ? themeClass(presetTheme, isLight, "chipActive") : ""} ${active ? styles.chipOn : ""}`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className={styles.primaryGrid}>
        <div className={`${styles.primaryCard} ${themeClass(crisisTheme, isLight, "primary")}`}>
          <p className={styles.cardLabel}>新月付（首月）</p>
          <p className={`${styles.primaryValue} ${themeClass(crisisTheme, isLight, "value")}`}>
            NT$ {formatMoney(hikeMonthlyPayment)}
          </p>
        </div>
        <div className={`${styles.primaryCard} ${themeClass(crisisTheme, isLight, "primary")}`}>
          <p className={styles.cardLabel}>新負債比</p>
          <p className={`${styles.primaryValue} ${themeClass(crisisTheme, isLight, "value")}`}>
            {hikeDtiPct.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className={styles.secondaryGrid}>
        <div className={`${styles.secondaryCard} ${themeClass(crisisTheme, isLight, "secondary")}`}>
          <p className={styles.secondaryLabel}>總利息變化</p>
          <p className={`${styles.secondaryValue} ${themeClass(crisisTheme, isLight, "value")}`}>
            {formatInterestDelta(hikeInterestDelta)}
          </p>
        </div>
        <div className={`${styles.secondaryCard} ${themeClass(crisisTheme, isLight, "secondary")}`}>
          <p className={styles.secondaryLabel}>情境總利息</p>
          <p className={`${styles.secondaryValue} ${themeClass(crisisTheme, isLight, "value")}`}>
            NT$ {formatMoney(hikeTotalInterest)}
          </p>
        </div>
      </div>

      <div className={`${styles.alert} ${themeClass(crisisTheme, isLight, "alert")}`}>
        {alertMessage(rateHikePreset, hikeDtiPct)}
      </div>

      <p className={`${styles.rateFoot} ${isLight ? styles.rateFootLight : styles.rateFootDark}`}>
        現況利率 {annualRate.toFixed(2)}% → 情境 {scenarioRate.toFixed(2)}%（本息均攤示意）
      </p>
    </div>
  );
}
