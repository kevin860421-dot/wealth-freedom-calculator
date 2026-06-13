"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import { formatMoney } from "./logic";
import styles from "./quick11-risk-simulation-panel.module.css";

const RATE_SHOCK_MIN = 0;
const RATE_SHOCK_MAX = 8;
const RATE_SHOCK_STEP = 0.25;

const LABEL_MIN_PX = 11;
const LABEL_MAX_PX = 17;
const CONTROLLER_VALUE_MIN_PX = 14;
const CONTROLLER_VALUE_MAX_PX = 28;
const METRIC_VALUE_MIN_PX = 10;
const METRIC_VALUE_MAX_PX = 26;
const INTEREST_VALUE_MIN_PX = 9;
const INTEREST_VALUE_MAX_PX = 28;

export type Quick11RiskSimulationPanelProps = {
  isLight?: boolean;
  loanAmount: number;
  annualRate: number;
  loanYears: number;
  monthlyIncome: number;
  rateShockPct: number;
  onRateShockPctChange: (value: number) => void;
  shockedAnnualRate: number;
  shockedMonthlyPayment: number;
  shockedInterestIncrease: number;
};

function formatShockLabel(pct: number) {
  const fixed = Number(Math.min(RATE_SHOCK_MAX, Math.max(RATE_SHOCK_MIN, pct)).toFixed(2));
  return `+ ${fixed.toFixed(2)} %`;
}

function fitTextToContainerWidth(line: HTMLElement, containerWidth: number, minPx: number, maxPx: number) {
  if (containerWidth <= 0) return;
  line.style.fontSize = `${maxPx}px`;
  if (line.scrollWidth <= containerWidth) return;
  let lo = minPx;
  let hi = maxPx;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    line.style.fontSize = `${mid}px`;
    if (line.scrollWidth <= containerWidth) lo = mid;
    else hi = mid;
  }
  line.style.fontSize = `${lo}px`;
}

function RiskFitText(props: {
  text: string;
  className: string;
  minPx?: number;
  maxPx?: number;
  wrapClassName?: string;
}) {
  const { text, className, minPx = METRIC_VALUE_MIN_PX, maxPx = METRIC_VALUE_MAX_PX, wrapClassName = styles.fitWrap } =
    props;
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);

  const fit = useCallback(() => {
    const container = containerRef.current;
    const line = lineRef.current;
    if (!container || !line) return;
    fitTextToContainerWidth(line, container.clientWidth, minPx, maxPx);
  }, [minPx, maxPx]);

  useLayoutEffect(() => {
    fit();
    const id = requestAnimationFrame(() => fit());
    return () => cancelAnimationFrame(id);
  }, [text, fit]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => fit());
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  return (
    <div ref={containerRef} className={wrapClassName}>
      <span ref={lineRef} className={`${styles.fitLine} ${className}`} style={{ fontSize: maxPx }}>
        {text}
      </span>
    </div>
  );
}

export function Quick11RiskSimulationPanel(props: Quick11RiskSimulationPanelProps) {
  const {
    isLight = false,
    loanAmount,
    annualRate,
    loanYears,
    monthlyIncome,
    rateShockPct,
    onRateShockPctChange,
    shockedAnnualRate,
    shockedMonthlyPayment,
    shockedInterestIncrease,
  } = props;

  const fillPct = `${(rateShockPct / RATE_SHOCK_MAX) * 100}%`;
  const interestAlert =
    shockedInterestIncrease <= 0 ? "muted" : shockedInterestIncrease >= 500_000 ? "critical" : "warn";

  const metricValueClass = isLight ? styles.metricValueLight : styles.metricValueDark;
  const metricAccentClass = isLight ? styles.metricValueAccentLight : styles.metricValueAccentDark;
  const controllerValueClass = isLight ? styles.controllerValueLight : styles.controllerValueDark;
  const interestValueClass =
    interestAlert === "muted"
      ? isLight
        ? styles.interestValueMutedLight
        : styles.interestValueMutedDark
      : interestAlert === "critical"
        ? isLight
          ? styles.interestValueCriticalLight
          : styles.interestValueCriticalDark
        : isLight
          ? styles.interestValueWarnLight
          : styles.interestValueWarnDark;
  const interestLabelClass =
    interestAlert === "muted"
      ? isLight
        ? styles.interestBarLabelMutedLight
        : styles.interestBarLabelMutedDark
      : interestAlert === "critical"
        ? isLight
          ? styles.interestBarLabelCriticalLight
          : styles.interestBarLabelCriticalDark
        : isLight
          ? styles.interestBarLabelWarnLight
          : styles.interestBarLabelWarnDark;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <p className={`${styles.title} ${isLight ? styles.titleLight : styles.titleDark}`}>
          風險模擬（升息壓力測試）
        </p>
        <p className={`${styles.context} ${isLight ? styles.contextLight : styles.contextDark}`}>
          貸款 {formatMoney(loanAmount)} · 利率 {annualRate.toFixed(2)}% · {loanYears} 年 · 月收{" "}
          {formatMoney(monthlyIncome)}
        </p>
      </div>

      <div className={`${styles.controller} ${isLight ? styles.controllerLight : styles.controllerDark}`}>
        <div className={styles.controllerHead}>
          <p className={`${styles.controllerLabel} ${isLight ? styles.controllerLabelLight : styles.controllerLabelDark}`}>
            🔥 模擬未來升息幅度
          </p>
          <RiskFitText
            text={formatShockLabel(rateShockPct)}
            className={controllerValueClass}
            minPx={CONTROLLER_VALUE_MIN_PX}
            maxPx={CONTROLLER_VALUE_MAX_PX}
            wrapClassName={styles.controllerValueWrap}
          />
        </div>
        <input
          type="range"
          min={RATE_SHOCK_MIN}
          max={RATE_SHOCK_MAX}
          step={RATE_SHOCK_STEP}
          value={rateShockPct}
          style={{ "--fill-pct": fillPct } as CSSProperties}
          onChange={(event) => {
            const raw = Number(event.currentTarget.value);
            if (!Number.isFinite(raw)) return;
            onRateShockPctChange(Number(raw.toFixed(2)));
          }}
          className={`${styles.slider} ${isLight ? styles.sliderLight : styles.sliderDark}`}
          aria-label="模擬未來升息幅度"
        />
        <div className={`${styles.sliderMarks} ${isLight ? styles.sliderMarksLight : styles.sliderMarksDark}`}>
          <span>0%</span>
          <span>+8%</span>
        </div>
      </div>

      <div className={styles.metricGrid}>
        <div className={`${styles.metricCard} ${isLight ? styles.metricCardLight : styles.metricCardDark}`}>
          <RiskFitText
            text="新每月繳款"
            className={`${styles.metricLabel} ${isLight ? styles.metricLabelLight : styles.metricLabelDark}`}
            minPx={LABEL_MIN_PX}
            maxPx={LABEL_MAX_PX}
          />
          <RiskFitText
            text={`NT$ ${formatMoney(shockedMonthlyPayment)}`}
            className={metricValueClass}
            minPx={METRIC_VALUE_MIN_PX}
            maxPx={METRIC_VALUE_MAX_PX}
            wrapClassName={styles.metricValueWrap}
          />
        </div>
        <div className={`${styles.metricCard} ${isLight ? styles.metricCardLight : styles.metricCardDark}`}>
          <RiskFitText
            text="升息後年利率"
            className={`${styles.metricLabel} ${isLight ? styles.metricLabelLight : styles.metricLabelDark}`}
            minPx={LABEL_MIN_PX}
            maxPx={LABEL_MAX_PX}
          />
          <RiskFitText
            text={`${shockedAnnualRate.toFixed(2)}%`}
            className={metricAccentClass}
            minPx={METRIC_VALUE_MIN_PX}
            maxPx={METRIC_VALUE_MAX_PX}
            wrapClassName={styles.metricValueWrap}
          />
        </div>
      </div>

      <div
        className={`${styles.interestBar} ${
          interestAlert === "muted"
            ? isLight
              ? styles.interestBarMutedLight
              : styles.interestBarMutedDark
            : interestAlert === "critical"
              ? isLight
                ? styles.interestBarCriticalLight
                : styles.interestBarCriticalDark
              : isLight
                ? styles.interestBarWarnLight
                : styles.interestBarWarnDark
        }`}
      >
        <RiskFitText
          text="利息增加"
          className={`${styles.metricLabel} ${styles.interestBarLabel} ${interestLabelClass}`}
          minPx={LABEL_MIN_PX}
          maxPx={LABEL_MAX_PX}
          wrapClassName={styles.interestBarLabelWrap}
        />
        <RiskFitText
          text={`NT$ ${formatMoney(shockedInterestIncrease)}`}
          className={`${styles.interestBarValue} ${interestValueClass}`}
          minPx={INTEREST_VALUE_MIN_PX}
          maxPx={INTEREST_VALUE_MAX_PX}
          wrapClassName={styles.interestBarValueWrap}
        />
      </div>
    </div>
  );
}
