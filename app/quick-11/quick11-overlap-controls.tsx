"use client";

import { formatMoney, Q11_ANNUAL_RATE_MAX_PCT, Q11_ANNUAL_RATE_MIN_PCT, Q11_ANNUAL_RATE_STEP_PCT, type LoanMethod } from "./logic";
import { Quick11MethodToggle } from "./quick11-method-toggle";
import styles from "./quick11-overlap-controls.module.css";

/** 與首頁試算 loanYears 上限一致 */
export const Q11_OVERLAP_LOAN_YEARS_MIN = 1;
export const Q11_OVERLAP_LOAN_YEARS_MAX = 100;

const LOAN_AMOUNT_MIN = 50_000;
const LOAN_AMOUNT_MAX = 30_000_000;
const LOAN_AMOUNT_STEP = 100_000;
const RATE_MIN = Q11_ANNUAL_RATE_MIN_PCT;
const RATE_MAX = Q11_ANNUAL_RATE_MAX_PCT;
const RATE_STEP = Q11_ANNUAL_RATE_STEP_PCT;
const PREPAY_MAX = 100_000;
const PREPAY_STEP = 1_000;

export type Quick11OverlapControlsProps = {
  isLight?: boolean;
  method: LoanMethod;
  onMethodChange: (m: LoanMethod) => void;
  annualRate: number;
  onAnnualRateChange: (v: number) => void;
  loanYears: number;
  onLoanYearsChange: (v: number) => void;
  loanAmount: number;
  onLoanAmountChange: (v: number) => void;
  extraMonthlyPrepay: number;
  onExtraMonthlyPrepayChange: (v: number) => void;
};

function MiniRange(props: {
  id: string;
  label: string;
  display: string;
  min: number;
  max: number;
  step: number;
  value: number;
  isLight: boolean;
  className?: string;
  onChange: (v: number) => void;
}) {
  const { id, label, display, min, max, step, value, isLight, className = styles.cell, onChange } = props;
  return (
    <div className={className}>
      <div className={styles.labelRow}>
        <span className={`${styles.label} ${isLight ? styles.labelLight : styles.labelDark}`}>{label}</span>
        <span className={`${styles.value} ${isLight ? styles.valueLight : styles.valueDark}`}>{display}</span>
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

export function Quick11OverlapControls(props: Quick11OverlapControlsProps) {
  const {
    isLight = false,
    method,
    onMethodChange,
    annualRate,
    onAnnualRateChange,
    loanYears,
    onLoanYearsChange,
    loanAmount,
    onLoanAmountChange,
    extraMonthlyPrepay,
    onExtraMonthlyPrepayChange,
  } = props;

  const amountClamped = Math.min(LOAN_AMOUNT_MAX, Math.max(LOAN_AMOUNT_MIN, loanAmount));
  const prepayClamped = Math.min(PREPAY_MAX, Math.max(0, extraMonthlyPrepay));
  const yearsClamped = Math.min(
    Q11_OVERLAP_LOAN_YEARS_MAX,
    Math.max(Q11_OVERLAP_LOAN_YEARS_MIN, Math.round(loanYears)),
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.methodRow}>
        <Quick11MethodToggle method={method} onChange={onMethodChange} isLight={isLight} compact />
      </div>

      <div className={styles.loanGrid}>
        <MiniRange
          id="overlap-rate"
          label="利率"
          display={`${annualRate.toFixed(2)}%`}
          min={RATE_MIN}
          max={RATE_MAX}
          step={RATE_STEP}
          value={Math.min(RATE_MAX, Math.max(RATE_MIN, annualRate))}
          isLight={isLight}
          onChange={onAnnualRateChange}
        />
        <MiniRange
          id="overlap-amount"
          label="金額"
          display={`${Math.round(amountClamped / 10_000)}萬`}
          min={LOAN_AMOUNT_MIN}
          max={LOAN_AMOUNT_MAX}
          step={LOAN_AMOUNT_STEP}
          value={amountClamped}
          isLight={isLight}
          onChange={onLoanAmountChange}
        />
        <MiniRange
          id="overlap-prepay"
          label="每月多還"
          display={prepayClamped <= 0 ? "$0" : `$${formatMoney(prepayClamped)}`}
          min={0}
          max={PREPAY_MAX}
          step={PREPAY_STEP}
          value={prepayClamped}
          isLight={isLight}
          onChange={onExtraMonthlyPrepayChange}
        />
        <MiniRange
          id="overlap-loan-years"
          label="貸款年期"
          display={`${yearsClamped}年`}
          min={Q11_OVERLAP_LOAN_YEARS_MIN}
          max={Q11_OVERLAP_LOAN_YEARS_MAX}
          step={1}
          value={yearsClamped}
          isLight={isLight}
          onChange={(v) => onLoanYearsChange(Math.round(v))}
        />
      </div>
    </div>
  );
}
