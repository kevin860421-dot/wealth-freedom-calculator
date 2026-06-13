"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  computeInflationAdjustedPaymentPV,
  computeOpportunityCostFvFromRows,
} from "./quick11-advanced-calculations";
import { buildLoanSchedules, formatMoney, type LoanMethod } from "./logic";
import { Quick11InflationCardModal, type InflationCardModalKind } from "./quick11-inflation-card-modal";
import styles from "./quick11-inflation-opportunity-panel.module.css";

export const Q11_INFLATION_SCENARIO_YEARS_MIN = 10;
export const Q11_INFLATION_SCENARIO_YEARS_MAX = 40;

const INFLATION_MIN = 0;
const INFLATION_MAX = 15;
const INFLATION_STEP = 0.5;
const RETURN_MIN = 0;
const RETURN_MAX = 50;
const RETURN_STEP = 0.5;

const AMOUNT_MIN_PX = 8;
const AMOUNT_MAX_PX = 22;
const LABEL_MIN_PX = 9;
const LABEL_MAX_PX = 13;
const SLIDER_VALUE_MIN_PX = 10;
const SLIDER_VALUE_MAX_PX = 12;

function clampScenarioYears(years: number) {
  return Math.min(Q11_INFLATION_SCENARIO_YEARS_MAX, Math.max(Q11_INFLATION_SCENARIO_YEARS_MIN, Math.round(years)));
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

function fitUnifiedFontSize(
  items: { line: HTMLElement; container: HTMLElement }[],
  minPx: number,
  maxPx: number,
) {
  const widths = items.map(({ container }) => container.clientWidth);
  if (widths.some((w) => w <= 0)) return;

  let lo = minPx;
  let hi = maxPx;
  for (let pass = 0; pass < 24; pass += 1) {
    const mid = (lo + hi) / 2;
    const allFit = items.every(({ line }, i) => {
      line.style.fontSize = `${mid}px`;
      return line.scrollWidth <= widths[i];
    });
    if (allFit) lo = mid;
    else hi = mid;
  }

  for (const { line } of items) {
    line.style.fontSize = `${lo}px`;
  }
}

function FitText({
  children,
  className,
  minPx,
  maxPx,
  fitKey,
  wrapClassName,
}: {
  children: ReactNode;
  className: string;
  minPx: number;
  maxPx: number;
  fitKey: string;
  wrapClassName?: string;
}) {
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
  }, [fitKey, fit]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => fit());
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  return (
    <div ref={containerRef} className={wrapClassName ?? styles.fitWrap}>
      <span ref={lineRef} className={className} style={{ fontSize: maxPx }}>
        {children}
      </span>
    </div>
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
      <div className={styles.sliderLabelRow}>
        <span className={`${styles.sliderLabel} ${isLight ? styles.sliderLabelLight : styles.sliderLabelDark}`}>{label}</span>
        <FitText
          fitKey={display}
          minPx={SLIDER_VALUE_MIN_PX}
          maxPx={SLIDER_VALUE_MAX_PX}
          wrapClassName={styles.sliderValueFit}
          className={`${styles.sliderValue} ${isLight ? styles.sliderValueLight : styles.sliderValueDark}`}
        >
          {display}
        </FitText>
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

function ClickableCard(props: {
  cardClassName: string;
  labelClassName: string;
  label: string;
  labelFitKey: string;
  amount: string;
  amountClassName: string;
  containerRef: RefObject<HTMLDivElement | null>;
  lineRef: RefObject<HTMLSpanElement | null>;
  ariaLabel: string;
  onOpen: () => void;
}) {
  const {
    cardClassName,
    labelClassName,
    label,
    labelFitKey,
    amount,
    amountClassName,
    containerRef,
    lineRef,
    ariaLabel,
    onOpen,
  } = props;

  return (
    <button type="button" className={`${styles.cardButton} ${cardClassName}`} aria-label={ariaLabel} onClick={onOpen}>
      <FitText
        fitKey={labelFitKey}
        minPx={LABEL_MIN_PX}
        maxPx={LABEL_MAX_PX}
        wrapClassName={styles.cardLabelFit}
        className={`${styles.cardLabel} ${labelClassName}`}
      >
        {label}
      </FitText>
      <AmountSlot amount={amount} className={amountClassName} containerRef={containerRef} lineRef={lineRef} />
    </button>
  );
}

function AmountSlot({
  amount,
  className,
  containerRef,
  lineRef,
}: {
  amount: string;
  className: string;
  containerRef: RefObject<HTMLDivElement | null>;
  lineRef: RefObject<HTMLSpanElement | null>;
}) {
  return (
    <div ref={containerRef} className={styles.amountWrap}>
      <span ref={lineRef} className={`${styles.amountLine} ${className}`} style={{ fontSize: AMOUNT_MAX_PX }}>
        <span className={styles.amountCurrency}>NT$</span>
        <span className={styles.amountDigits}>{amount}</span>
      </span>
    </div>
  );
}

export type Quick11InflationOpportunityPanelProps = {
  isLight?: boolean;
  loanAmount: number;
  annualRate: number;
  method: LoanMethod;
  loanYears: number;
  inflationPct: number;
  onInflationPctChange: (v: number) => void;
  opportunityReturnPct: number;
  onOpportunityReturnPctChange: (v: number) => void;
};

export function Quick11InflationOpportunityPanel(props: Quick11InflationOpportunityPanelProps) {
  const {
    isLight = false,
    loanAmount,
    annualRate,
    method,
    loanYears,
    inflationPct,
    onInflationPctChange,
    opportunityReturnPct,
    onOpportunityReturnPctChange,
  } = props;

  const [scenarioYears, setScenarioYears] = useState(() => clampScenarioYears(loanYears));
  const [modalKind, setModalKind] = useState<InflationCardModalKind | null>(null);

  const amountContainerRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];
  const amountLineRefs = [useRef<HTMLSpanElement>(null), useRef<HTMLSpanElement>(null), useRef<HTMLSpanElement>(null)];

  useEffect(() => {
    setScenarioYears(clampScenarioYears(loanYears));
  }, [loanAmount, annualRate, loanYears, method]);

  const scenarioYearsClamped = clampScenarioYears(scenarioYears);
  const inflationClamped = Math.min(INFLATION_MAX, Math.max(INFLATION_MIN, inflationPct));
  const returnClamped = Math.min(RETURN_MAX, Math.max(RETURN_MIN, opportunityReturnPct));

  const scenarioRows = useMemo(() => {
    const schedules = buildLoanSchedules(loanAmount, annualRate, scenarioYearsClamped);
    return method === "annuity" ? schedules.annuityRows : schedules.equalPrincipalRows;
  }, [loanAmount, annualRate, scenarioYearsClamped, method]);

  const inflationMetrics = useMemo(
    () => computeInflationAdjustedPaymentPV(scenarioRows, inflationClamped),
    [scenarioRows, inflationClamped],
  );

  const opportunityFv = useMemo(
    () => computeOpportunityCostFvFromRows(scenarioRows, returnClamped),
    [scenarioRows, returnClamped],
  );

  const nominalStr = formatMoney(inflationMetrics.nominalTotal);
  const realStr = formatMoney(inflationMetrics.realPresentValue);
  const fvStr = formatMoney(opportunityFv);
  const monthlyPayment = scenarioRows[0]?.payment ?? 0;
  const amountsFitKey = `${nominalStr}-${realStr}-${fvStr}-${scenarioYearsClamped}`;
  const modalOpen = modalKind != null;

  const fitAllAmounts = useCallback(() => {
    const items = amountLineRefs
      .map((lineRef, i) => ({
        line: lineRef.current,
        container: amountContainerRefs[i].current,
      }))
      .filter((x): x is { line: HTMLSpanElement; container: HTMLDivElement } => Boolean(x.line && x.container));

    if (items.length !== 3) return;
    fitUnifiedFontSize(items, AMOUNT_MIN_PX, AMOUNT_MAX_PX);
  }, []);

  useLayoutEffect(() => {
    fitAllAmounts();
    const id = requestAnimationFrame(() => fitAllAmounts());
    return () => cancelAnimationFrame(id);
  }, [amountsFitKey, fitAllAmounts]);

  useEffect(() => {
    const nodes = amountContainerRefs.map((r) => r.current).filter(Boolean) as HTMLDivElement[];
    if (!nodes.length || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => fitAllAmounts());
    for (const n of nodes) ro.observe(n);
    return () => ro.disconnect();
  }, [fitAllAmounts]);

  const amountClasses = {
    nominal: isLight ? styles.amountNominalLight : styles.amountNominalDark,
    real: isLight ? styles.amountRealLight : styles.amountRealDark,
    hero: isLight ? styles.amountHeroLight : styles.amountHeroDark,
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.columnsGrid}>
        <div className={styles.column}>
          <ParamSlider
            id="q11-scenario-years"
            label="試算年期"
            display={`${scenarioYearsClamped}年`}
            min={Q11_INFLATION_SCENARIO_YEARS_MIN}
            max={Q11_INFLATION_SCENARIO_YEARS_MAX}
            step={1}
            value={scenarioYearsClamped}
            isLight={isLight}
            onChange={(v) => setScenarioYears(clampScenarioYears(v))}
          />
          <ClickableCard
            cardClassName={isLight ? styles.cardLight : styles.cardDark}
            labelClassName={isLight ? styles.cardLabelLight : styles.cardLabelDark}
            label={`${scenarioYearsClamped} 年名義總還款`}
            labelFitKey={`lbl-nom-${scenarioYearsClamped}`}
            amount={nominalStr}
            amountClassName={amountClasses.nominal}
            containerRef={amountContainerRefs[0]}
            lineRef={amountLineRefs[0]}
            ariaLabel="查看名義總還款說明"
            onOpen={() => setModalKind("nominal")}
          />
        </div>

        <div className={styles.column}>
          <ParamSlider
            id="q11-inflation-pct"
            label="年通膨"
            display={`${inflationClamped.toFixed(1)}%`}
            min={INFLATION_MIN}
            max={INFLATION_MAX}
            step={INFLATION_STEP}
            value={inflationClamped}
            isLight={isLight}
            onChange={onInflationPctChange}
          />
          <ClickableCard
            cardClassName={isLight ? styles.cardRealLight : styles.cardRealDark}
            labelClassName={isLight ? styles.cardLabelRealLight : styles.cardLabelRealDark}
            label="折現今日購買力"
            labelFitKey="lbl-real"
            amount={realStr}
            amountClassName={amountClasses.real}
            containerRef={amountContainerRefs[1]}
            lineRef={amountLineRefs[1]}
            ariaLabel="查看通膨折現說明"
            onOpen={() => setModalKind("real")}
          />
        </div>

        <div className={styles.column}>
          <ParamSlider
            id="q11-opportunity-return"
            label="改投年化"
            display={`${returnClamped.toFixed(1)}%`}
            min={RETURN_MIN}
            max={RETURN_MAX}
            step={RETURN_STEP}
            value={returnClamped}
            isLight={isLight}
            onChange={onOpportunityReturnPctChange}
          />
          <ClickableCard
            cardClassName={isLight ? styles.cardHeroLight : styles.cardHeroDark}
            labelClassName={isLight ? styles.cardLabelHeroLight : styles.cardLabelHeroDark}
            label="月付改投市場"
            labelFitKey="lbl-fv"
            amount={fvStr}
            amountClassName={amountClasses.hero}
            containerRef={amountContainerRefs[2]}
            lineRef={amountLineRefs[2]}
            ariaLabel="查看機會成本說明"
            onOpen={() => setModalKind("opportunity")}
          />
        </div>
      </div>

      <p className={`${styles.disclaimer} ${isLight ? styles.disclaimerLight : styles.disclaimerDark}`}>
        * 示意試算：折現為標準 PV（Σ 月付÷(1+月通膨)^期）；機會成本為每期月付逐月複利 FV。未含稅費、波動與提前還款。點卡片可看白話說明。
      </p>

      <Quick11InflationCardModal
        open={modalOpen}
        kind={modalKind}
        onClose={() => setModalKind(null)}
        isLight={isLight}
        scenarioYears={scenarioYearsClamped}
        inflationPct={inflationClamped}
        returnPct={returnClamped}
        nominalTotal={inflationMetrics.nominalTotal}
        realPresentValue={inflationMetrics.realPresentValue}
        opportunityFv={opportunityFv}
        monthlyPayment={monthlyPayment}
      />
    </div>
  );
}
