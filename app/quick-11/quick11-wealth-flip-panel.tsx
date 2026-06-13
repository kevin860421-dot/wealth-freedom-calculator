"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import Link from "next/link";
import { formatMoney, type LoanMethod } from "./logic";
import { Quick11MethodToggle } from "./quick11-method-toggle";
import { Quick11ExcelDownloadButton } from "./quick11-excel-download-button";
import styles from "./quick11-wealth-flip-panel.module.css";

const COMPOUND_RATE_PCT = 7;
const COMPOUND_YEARS = 20;
const EXTRA_PREPAY_MIN = 0;
const EXTRA_PREPAY_MAX = 100_000;
const EXTRA_PREPAY_STEP = 1_000;
const STAT_AMOUNT_MIN_PX = 9;
const STAT_AMOUNT_MAX_PX = 22;

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

function WealthFlipFitAmount({
  amount,
  valueClassName,
}: {
  amount: string;
  valueClassName: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);

  const fit = useCallback(() => {
    const container = containerRef.current;
    const line = lineRef.current;
    if (!container || !line) return;
    fitTextToContainerWidth(line, container.clientWidth, STAT_AMOUNT_MIN_PX, STAT_AMOUNT_MAX_PX);
  }, []);

  useLayoutEffect(() => {
    fit();
    const id = requestAnimationFrame(() => fit());
    return () => cancelAnimationFrame(id);
  }, [amount, fit]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => fit());
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  return (
    <div ref={containerRef} className={styles.statAmountWrap}>
      <span
        ref={lineRef}
        className={`${styles.statAmount} ${valueClassName}`}
        style={{ fontSize: STAT_AMOUNT_MAX_PX }}
      >
        <span className={styles.currency}>NT$</span>
        <span className={styles.amountDigits}>{amount}</span>
      </span>
    </div>
  );
}

export type Quick11WealthFlipPanelProps = {
  isLight?: boolean;
  method: LoanMethod;
  onMethodChange: (method: LoanMethod) => void;
  /** 首頁／提前還款分頁：每月額外多還金額 */
  extraMonthlyPrepay: number;
  onExtraMonthlyPrepayChange: (value: number) => void;
  prepaySavedInterest: number;
  freedomProjected: number;
  onOpenExcelWizard?: () => void;
};

/** 財富翻轉 Tab：扁平化版面，核心為雙數據卡 */
export function Quick11WealthFlipPanel({
  isLight = false,
  method,
  onMethodChange,
  extraMonthlyPrepay,
  onExtraMonthlyPrepayChange,
  prepaySavedInterest,
  freedomProjected,
  onOpenExcelWizard,
}: Quick11WealthFlipPanelProps) {
  const theme = isLight ? styles.themeLight : styles.themeDark;
  const extraClamped = Math.min(EXTRA_PREPAY_MAX, Math.max(EXTRA_PREPAY_MIN, extraMonthlyPrepay));
  const sliderPct =
    EXTRA_PREPAY_MAX <= EXTRA_PREPAY_MIN
      ? 0
      : ((extraClamped - EXTRA_PREPAY_MIN) / (EXTRA_PREPAY_MAX - EXTRA_PREPAY_MIN)) * 100;

  return (
    <section className={`${styles.root} ${theme}`} aria-labelledby="wealth-flip-title">
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <h2 id="wealth-flip-title" className={styles.title}>
            <span className={styles.titleIcon} aria-hidden>
              📈
            </span>
            財富翻轉（把省下利息變資產）
          </h2>
          <Quick11MethodToggle method={method} onChange={onMethodChange} isLight={isLight} />
        </div>
      </header>

      <div className={styles.leadBlock}>
        <p className={styles.subtitle} aria-label={`每月提早多還款 ${formatMoney(extraClamped)} 元`}>
          <span aria-hidden>💡 </span>
          依據首頁設定：假設您每月提早多還款{" "}
          <strong className={styles.conditionAmount}>NT$ {formatMoney(extraClamped)}</strong> 元
        </p>

        <div className={styles.sliderWrap}>
          <label className={styles.sliderLabel} htmlFor="wealth-flip-extra-prepay">
            拉條調整每月提早多還金額
          </label>
          <input
            id="wealth-flip-extra-prepay"
            type="range"
            min={EXTRA_PREPAY_MIN}
            max={EXTRA_PREPAY_MAX}
            step={EXTRA_PREPAY_STEP}
            value={extraClamped}
            className={styles.slider}
            style={{ "--slider-pct": `${sliderPct}%` } as CSSProperties}
            aria-valuemin={EXTRA_PREPAY_MIN}
            aria-valuemax={EXTRA_PREPAY_MAX}
            aria-valuenow={extraClamped}
            aria-valuetext={`NT$ ${formatMoney(extraClamped)}`}
            onChange={(e) => {
              const next = Number(e.currentTarget.value);
              if (Number.isFinite(next)) onExtraMonthlyPrepayChange(next);
            }}
          />
          <div className={styles.sliderRangeLabels}>
            <span>NT$ 0</span>
            <span>NT$ 10萬</span>
          </div>
        </div>
      </div>

      <div className={styles.statsGrid} role="group" aria-label="省下利息與複利試算結果">
        <article className={`${styles.statCard} ${styles.statCardSaved}`}>
          <p className={styles.statLabel}>省下利息</p>
          <div
            className={styles.statValueSaved}
            aria-label={`提前還款省下利息 ${Math.round(prepaySavedInterest).toLocaleString("zh-TW")} 元`}
          >
            <WealthFlipFitAmount amount={formatMoney(prepaySavedInterest)} valueClassName={styles.statValueSavedText} />
          </div>
        </article>

        <article className={`${styles.statCard} ${styles.statCardGrowth}`}>
          <p className={styles.statLabel}>
            {COMPOUND_RATE_PCT}% 複利 {COMPOUND_YEARS} 年
          </p>
          <div
            className={styles.statValueGrowth}
            aria-label={`以 ${COMPOUND_RATE_PCT}% 複利 ${COMPOUND_YEARS} 年約 ${Math.round(freedomProjected).toLocaleString("zh-TW")} 元`}
          >
            <WealthFlipFitAmount amount={formatMoney(freedomProjected)} valueClassName={styles.statValueGrowthText} />
          </div>
        </article>
      </div>

      <p className={styles.disclaimer}>* 以上為固定年化 {COMPOUND_RATE_PCT}%、{COMPOUND_YEARS} 年複利之情境示意，非投資保證。</p>

      {onOpenExcelWizard ? (
        <div className={styles.excelWrap}>
          <Quick11ExcelDownloadButton isLight={isLight} onOpenWizard={onOpenExcelWizard} />
        </div>
      ) : null}

      <Link href="/quick-1" className={styles.cta}>
        <span aria-hidden>🤖</span>
        <span>前往存股複利計算機</span>
      </Link>
    </section>
  );
}
