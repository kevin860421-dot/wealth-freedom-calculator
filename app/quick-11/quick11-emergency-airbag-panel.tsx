"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { computeEmergencySurvivalMetrics } from "./quick11-advanced-calculations";
import { useQuick11Input, QUICK11_BABY_SCENARIO_LIVING_EXPENSE, QUICK11_DEFAULT_MONTHLY_LIVING_EXPENSE } from "./quick11-input-context";
import { formatMoney } from "./logic";
import type { Q11Theme } from "./quick11-white-theme";
import styles from "./quick11-emergency-airbag-panel.module.css";

const LIVING_EXPENSE_MIN = 0;
const LIVING_EXPENSE_MAX = 100_000;
const LIVING_EXPENSE_STEP = 5_000;
const INCOME_RETENTION_MIN = 0;
const INCOME_RETENTION_MAX = 100;
const INCOME_RETENTION_STEP = 10;
const SAFETY_SCALE_MONTHS = 12;
const SCENARIO_ANIM_MS = 520;

type ScenarioKey = "normal" | "furlough" | "unemployment" | "baby";

type AlertLevel = "ok" | "warn" | "bad";

function clampLiving(n: number) {
  return Math.min(LIVING_EXPENSE_MAX, Math.max(LIVING_EXPENSE_MIN, Math.round(n / LIVING_EXPENSE_STEP) * LIVING_EXPENSE_STEP));
}

function clampRetention(n: number) {
  return Math.min(
    INCOME_RETENTION_MAX,
    Math.max(INCOME_RETENTION_MIN, Math.round(n / INCOME_RETENTION_STEP) * INCOME_RETENTION_STEP),
  );
}

function animateTo(
  from: number,
  to: number,
  durationMs: number,
  onUpdate: (v: number) => void,
  snap?: (v: number) => number,
) {
  const start = performance.now();
  let frame = 0;

  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / durationMs);
    const eased = 1 - Math.pow(1 - t, 3);
    const raw = from + (to - from) * eased;
    onUpdate(snap ? snap(raw) : raw);
    if (t < 1) frame = requestAnimationFrame(tick);
    else onUpdate(snap ? snap(to) : to);
  };

  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}

function depositInputWidth(text: string): string {
  const len = Math.max(1, text.length);
  const rem = Math.min(9.5, Math.max(4.5, len * 0.72 + 1.5));
  return `${rem}rem`;
}

function MoneyInlineInput(props: {
  theme: Q11Theme;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  ariaLabel: string;
}) {
  const { theme, value, onChange, onBlur, ariaLabel } = props;
  const inputWidth = depositInputWidth(value);
  return (
    <span className={`${styles.depositInputWrap} border-b-2 ${theme.inlineBorder}`}>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.currentTarget.value.replace(/[^\d]/g, ""))}
        onBlur={onBlur}
        className={`${styles.depositInput} ${theme.input}`}
        style={{ width: inputWidth, minWidth: inputWidth }}
      />
      <span className={`${styles.depositSuffix} ${theme.inputSuffix}`}>NT$</span>
    </span>
  );
}

function ParamSlider(props: {
  id: string;
  label: string;
  display: string;
  min: number;
  max: number;
  step: number;
  value: number;
  isLight: boolean;
  onChange: (v: number) => void;
}) {
  const { id, label, display, min, max, step, value, isLight, onChange } = props;
  return (
    <div className={styles.sliderBlock}>
      <label htmlFor={id} className={`${styles.sliderLabel} ${isLight ? styles.sliderLabelLight : styles.sliderLabelDark}`}>
        {label}
      </label>
      <div className={styles.sliderMetaRow}>
        <span className={`${styles.sliderValue} ${isLight ? styles.sliderValueLight : styles.sliderValueDark}`}>{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        className={`${styles.range} ${isLight ? styles.rangeLight : styles.rangeDark}`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        onChange={(e) => {
          const next = Number(e.currentTarget.value);
          if (Number.isFinite(next)) onChange(next);
        }}
      />
    </div>
  );
}

function resolveAlertLevel(metrics: ReturnType<typeof computeEmergencySurvivalMetrics>): AlertLevel {
  if (metrics.isSurplus) return "ok";
  if (metrics.survivalMonths < 3) return "bad";
  if (metrics.survivalMonths <= 6) return "warn";
  return "ok";
}

function progressTone(level: AlertLevel, isLight: boolean) {
  if (level === "bad") return isLight ? styles.progressFillBadLight : styles.progressFillBadDark;
  if (level === "warn") return isLight ? styles.progressFillWarnLight : styles.progressFillWarnDark;
  return isLight ? styles.progressFillOkLight : styles.progressFillOkDark;
}

function progressEndLabel(level: AlertLevel) {
  if (level === "bad") return "☠️ 斷頭法拍危險期";
  if (level === "warn") return "⚠️ 緊繃臨界點";
  return "🛡️ 安全緩衝期";
}

const SCENARIO_BUTTONS: Array<{
  key: ScenarioKey;
  emoji: string;
  label: string;
  tone: "ok" | "warn" | "bad" | "baby";
}> = [
  { key: "normal", emoji: "🟢", label: "正常軌道", tone: "ok" },
  { key: "furlough", emoji: "🟡", label: "無薪假衝擊", tone: "warn" },
  { key: "unemployment", emoji: "🔴", label: "極端失業危機", tone: "bad" },
  { key: "baby", emoji: "🍼", label: "家庭新增成員", tone: "baby" },
];

export type Quick11EmergencyAirbagPanelProps = {
  isLight?: boolean;
  theme: Q11Theme;
  emergencySavings: number;
  emergencyText: string;
  onEmergencyText: (v: string) => void;
  onEmergencyCommit: () => void;
  monthlyLivingExpense: number;
  onMonthlyLivingExpenseChange: (v: number) => void;
  incomeRetentionPct: number;
  onIncomeRetentionPctChange: (v: number) => void;
};

export function Quick11EmergencyAirbagPanel(props: Quick11EmergencyAirbagPanelProps) {
  const {
    isLight = false,
    theme,
    emergencySavings,
    emergencyText,
    onEmergencyText,
    onEmergencyCommit,
    monthlyLivingExpense,
    onMonthlyLivingExpenseChange,
    incomeRetentionPct,
    onIncomeRetentionPctChange,
  } = props;

  const { baselineMonthlyPayment, methodLabel, monthlyIncome } = useQuick11Input();

  const [activeScenario, setActiveScenario] = useState<ScenarioKey | null>(null);
  const animCancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => animCancelRef.current?.();
  }, []);

  const livingClamped = clampLiving(monthlyLivingExpense);
  const retentionClamped = clampRetention(incomeRetentionPct);

  const metrics = useMemo(
    () =>
      computeEmergencySurvivalMetrics(
        emergencySavings,
        baselineMonthlyPayment,
        livingClamped,
        monthlyIncome,
        retentionClamped,
      ),
    [emergencySavings, baselineMonthlyPayment, livingClamped, monthlyIncome, retentionClamped],
  );

  const alertLevel = resolveAlertLevel(metrics);

  const monthsLabel = metrics.isSurplus
    ? "∞ 安全無虞"
    : metrics.survivalMonths >= 120
      ? "10 年+"
      : `${metrics.survivalMonths.toFixed(1)} 個月`;

  const progressPct = metrics.isSurplus
    ? 100
    : Math.min(100, Math.max(0, (metrics.survivalMonths / SAFETY_SCALE_MONTHS) * 100));

  const runScenario = useCallback(
    (key: ScenarioKey) => {
      animCancelRef.current?.();
      setActiveScenario(key);

      const cancelFns: Array<() => void> = [];

      if (key === "normal") {
        cancelFns.push(
          animateTo(incomeRetentionPct, 100, SCENARIO_ANIM_MS, onIncomeRetentionPctChange, clampRetention),
        );
        cancelFns.push(
          animateTo(
            monthlyLivingExpense,
            QUICK11_DEFAULT_MONTHLY_LIVING_EXPENSE,
            SCENARIO_ANIM_MS,
            onMonthlyLivingExpenseChange,
            clampLiving,
          ),
        );
      } else if (key === "furlough") {
        cancelFns.push(animateTo(incomeRetentionPct, 60, SCENARIO_ANIM_MS, onIncomeRetentionPctChange, clampRetention));
      } else if (key === "unemployment") {
        cancelFns.push(animateTo(incomeRetentionPct, 0, SCENARIO_ANIM_MS, onIncomeRetentionPctChange, clampRetention));
      } else if (key === "baby") {
        cancelFns.push(animateTo(incomeRetentionPct, 100, SCENARIO_ANIM_MS, onIncomeRetentionPctChange, clampRetention));
        cancelFns.push(
          animateTo(
            monthlyLivingExpense,
            QUICK11_BABY_SCENARIO_LIVING_EXPENSE,
            SCENARIO_ANIM_MS,
            onMonthlyLivingExpenseChange,
            clampLiving,
          ),
        );
      }

      animCancelRef.current = () => cancelFns.forEach((fn) => fn());
    },
    [incomeRetentionPct, monthlyLivingExpense, onIncomeRetentionPctChange, onMonthlyLivingExpenseChange],
  );

  const alertClass = isLight
    ? alertLevel === "bad"
      ? styles.alertBadLight
      : alertLevel === "warn"
        ? styles.alertWarnLight
        : styles.alertOkLight
    : alertLevel === "bad"
      ? styles.alertBadDark
      : alertLevel === "warn"
        ? styles.alertWarnDark
        : styles.alertOkDark;

  const progressFillClass = progressTone(alertLevel, isLight);

  return (
    <div className={styles.wrap}>
      <div className={`${styles.card} ${isLight ? styles.cardLight : styles.cardDark}`}>
        <div className={styles.depositBlock}>
          <p className={`${styles.intro} ${isLight ? styles.introLight : styles.introDark}`}>目前可動用存款（不含自備款）</p>
          <MoneyInlineInput
            theme={theme}
            value={emergencyText}
            onChange={onEmergencyText}
            onBlur={onEmergencyCommit}
            ariaLabel="緊急預備金"
          />
        </div>

        <p className={`${styles.mortgageSync} ${isLight ? styles.mortgageSyncLight : styles.mortgageSyncDark}`}>
          房貸首月月付 NT$ {formatMoney(baselineMonthlyPayment)}
          <span className={styles.mortgageMethod}>（{methodLabel} · 與首頁同步）</span>
        </p>

        <div className={styles.scenarioRow} role="group" aria-label="一鍵危機模擬">
          {SCENARIO_BUTTONS.map((btn) => {
            const isActive = activeScenario === btn.key;
            const toneClass = isLight
              ? btn.tone === "ok"
                ? styles.scenarioOkLight
                : btn.tone === "warn"
                  ? styles.scenarioWarnLight
                  : btn.tone === "bad"
                    ? styles.scenarioBadLight
                    : styles.scenarioBabyLight
              : btn.tone === "ok"
                ? styles.scenarioOkDark
                : btn.tone === "warn"
                  ? styles.scenarioWarnDark
                  : btn.tone === "bad"
                    ? styles.scenarioBadDark
                    : styles.scenarioBabyDark;
            return (
              <button
                key={btn.key}
                type="button"
                className={`${styles.scenarioBtn} ${toneClass} ${isActive ? styles.scenarioBtnActive : ""}`}
                aria-pressed={isActive}
                onClick={() => runScenario(btn.key)}
              >
                <span className={styles.scenarioEmoji} aria-hidden>
                  {btn.emoji}
                </span>
                <span className={styles.scenarioLabel}>{btn.label}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.sliderStack}>
          <ParamSlider
            id="q11-living-expense"
            label="🍔 設定每月家庭基本生活開銷 (不含房貸)："
            display={`NT$ ${formatMoney(livingClamped)} / 月`}
            min={LIVING_EXPENSE_MIN}
            max={LIVING_EXPENSE_MAX}
            step={LIVING_EXPENSE_STEP}
            value={livingClamped}
            isLight={isLight}
            onChange={(v) => {
              setActiveScenario(null);
              onMonthlyLivingExpenseChange(v);
            }}
          />
          <ParamSlider
            id="q11-income-retention"
            label="🛑 模擬突發狀況下的家庭總收入成數："
            display={`${retentionClamped}%`}
            min={INCOME_RETENTION_MIN}
            max={INCOME_RETENTION_MAX}
            step={INCOME_RETENTION_STEP}
            value={retentionClamped}
            isLight={isLight}
            onChange={(v) => {
              setActiveScenario(null);
              onIncomeRetentionPctChange(v);
            }}
          />
        </div>

        <div className={`${styles.resultBox} ${isLight ? styles.resultBoxLight : ""}`}>
          <p className={`${styles.resultLead} ${isLight ? styles.resultLeadLight : styles.resultLeadDark}`}>
            每月總支出 NT$ {formatMoney(metrics.monthlyTotalExpense)}（房貸 {formatMoney(baselineMonthlyPayment)} + 生活費{" "}
            {formatMoney(livingClamped)}）· 剩餘收入 NT$ {formatMoney(metrics.monthlyRemainingIncome)}
          </p>
          <p className={`${styles.resultMonths} ${isLight ? styles.resultMonthsLight : styles.resultMonthsDark}`}>
            可支撐 {monthsLabel}
          </p>

          <div className={styles.progressWrap}>
            <div className={`${styles.progressTrack} ${isLight ? styles.progressTrackLight : styles.progressTrackDark}`}>
              <div
                className={`${styles.progressFill} ${progressFillClass}`}
                style={{ width: `${progressPct}%` }}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={SAFETY_SCALE_MONTHS}
                aria-valuenow={metrics.isSurplus ? SAFETY_SCALE_MONTHS : Math.min(SAFETY_SCALE_MONTHS, metrics.survivalMonths)}
                aria-label="法拍安全期進度"
              />
            </div>
            <div className={styles.progressMeta}>
              <span className={`${styles.progressScale} ${isLight ? styles.progressScaleLight : styles.progressScaleDark}`}>0 月</span>
              <span className={`${styles.progressEndLabel} ${isLight ? styles.progressEndLabelLight : styles.progressEndLabelDark}`}>
                {progressEndLabel(alertLevel)}
              </span>
              <span className={`${styles.progressScale} ${isLight ? styles.progressScaleLight : styles.progressScaleDark}`}>12 月</span>
            </div>
          </div>

          <p className={`${styles.resultDetail} ${isLight ? styles.resultDetailLight : styles.resultDetailDark}`}>
            {metrics.isSurplus
              ? "剩餘收入 ≥ 總支出，無月度現金缺口。"
              : `每月現金缺口 NT$ ${formatMoney(metrics.monthlyCashGap)} = 總支出 − 剩餘收入`}
          </p>
        </div>
      </div>

      <div className={`${styles.alert} ${alertClass}`}>
        {alertLevel === "bad" ? (
          <>
            <p className={styles.alertTitle}>❌ 極度危險！存款無法抵禦短期衝擊，建議提高預備金</p>
            <p className={styles.alertBody}>可支撐月數低於 3 個月，請優先補強緊急預備金或降低固定支出。</p>
          </>
        ) : alertLevel === "warn" ? (
          <>
            <p className={styles.alertTitle}>⚠️ 防禦力尚可，但若發生長期失業將面臨斷頭危機</p>
            <p className={styles.alertBody}>可支撐約 3～6 個月，建議持續累積至 6 個月以上更安全。</p>
          </>
        ) : (
          <>
            <p className={styles.alertTitle}>✅ 安全氣囊健全，具備良好的抗風險能力</p>
            <p className={styles.alertBody}>
              {metrics.isSurplus
                ? "目前情境下收入可覆蓋房貸與生活費，仍建議保留基本緊急金。"
                : "可支撐超過 6 個月，抗風險緩衝較充足。"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
