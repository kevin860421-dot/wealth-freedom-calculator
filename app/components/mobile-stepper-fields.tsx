"use client";

import styles from "./mobile-stepper-fields.module.css";

export { styles as stepperStyles };

export function moneyStep(n: number): number {
  return n > 100000 ? 5000 : 1000;
}

export type MoneySliderConfig = {
  min: number;
  /** 滑桿預設刻度上限（會隨目前金額自動放大，不鎖死輸入） */
  trackDefault: number;
  step: number;
  parse: (raw: string) => number;
  format: (n: number) => string;
};

type StepperTextFieldProps = {
  label: string;
  labelCompact?: boolean;
  value: string;
  placeholder?: string;
  principal?: boolean;
  feedback?: string | null;
  onChange: (v: string) => void;
  onBlur?: () => void;
  onEnter?: () => void;
  onStep: (delta: number) => void;
  hint?: string;
  slider?: MoneySliderConfig;
};

export function StepperTextField({
  label,
  labelCompact = false,
  value,
  placeholder,
  principal = false,
  feedback,
  onChange,
  onBlur,
  onEnter,
  onStep,
  hint,
  slider,
}: StepperTextFieldProps) {
  const circleCls = principal ? `${styles.circleStepBtn} ${styles.circleStepBtnPrincipal}` : styles.circleStepBtn;
  const rowCls = principal ? `${styles.inputRow} ${styles.inputRowPrincipal}` : styles.inputRow;
  const fieldCls = principal ? `${styles.inputField} ${styles.inputFieldPrincipal}` : styles.inputField;
  const sliderCls = principal ? `${styles.moneySlider} ${styles.moneySliderPrincipal}` : styles.moneySlider;
  const sliderAmount = slider ? Math.max(slider.min, slider.parse(value) || 0) : 0;
  const sliderMax = slider
    ? Math.max(slider.trackDefault, sliderAmount, slider.step)
    : 0;
  /** 左大右小：反轉刻度，避免 direction:rtl 在受控 range 上觸發無限 onChange */
  const sliderDisplayValue = slider ? sliderMax - sliderAmount + slider.min : 0;

  return (
    <div className={slider ? `${styles.field} ${styles.fieldWithSlider}` : styles.field}>
      <span className={labelCompact ? `${styles.label} ${styles.labelCompact}` : styles.label}>{label}</span>
      <div className={styles.fieldInputWrap}>
        {feedback ? (
          <span className={styles.feedbackPop} key={feedback}>
            {feedback}
          </span>
        ) : null}
        <div className={styles.stepperRow}>
          <button type="button" className={circleCls} aria-label="增加" onClick={() => onStep(1)}>
            +
          </button>
          <div className={rowCls}>
            <div className={styles.inputFieldScroll}>
              <input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onEnter?.();
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                onBlur={onBlur}
                onFocus={(e) => e.target.select()}
                className={fieldCls}
                placeholder={placeholder}
              />
            </div>
          </div>
          <button type="button" className={circleCls} aria-label="減少" onClick={() => onStep(-1)}>
            −
          </button>
        </div>
        {slider ? (
          <div className={styles.sliderWrap}>
            <div className={styles.sliderTrackInset}>
              <input
                type="range"
                className={sliderCls}
                min={slider.min}
                max={sliderMax}
                step={slider.step}
                value={sliderDisplayValue}
                aria-label={`${label} 滑桿`}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  if (!Number.isFinite(raw)) return;
                  const nextAmount = sliderMax - raw + slider.min;
                  if (nextAmount === sliderAmount) return;
                  onChange(slider.format(nextAmount));
                }}
              />
            </div>
          </div>
        ) : null}
      </div>
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  );
}

function bumpRatePct(current: number | "", delta: number): number {
  const base = current === "" ? 0 : Number(current) || 0;
  return Math.max(0, Math.round((base + delta * 0.1) * 10) / 10);
}

type StepperRateFieldProps = {
  label: string;
  labelCompact?: boolean;
  gridOnly?: boolean;
  /** 雙欄殖利率：緊湊型左＋右－ */
  compact?: boolean;
  value: number | "";
  placeholder?: string;
  dimmed?: boolean;
  onChange: (n: number | "") => void;
  onStep?: (delta: number) => void;
  hint?: string;
};

export function StepperRateField({
  label,
  labelCompact = false,
  gridOnly = false,
  compact = false,
  value,
  placeholder,
  dimmed = false,
  onChange,
  onStep,
  hint,
}: StepperRateFieldProps) {
  const rowCls = `${styles.inputRow} ${styles.inputRowRate}${compact ? ` ${styles.inputRowCompact}` : ""}${dimmed ? ` ${styles.inputRowDimmed}` : ""}`;
  const btnCls = compact ? `${styles.circleStepBtn} ${styles.circleStepBtnCompact}` : styles.circleStepBtn;
  const stepperCls = compact ? `${styles.stepperRow} ${styles.stepperRowCompact}` : styles.stepperRow;
  const inputEl = (
    <div className={rowCls}>
      <input
        type="text"
        inputMode="decimal"
        value={value === "" ? "" : String(value)}
        placeholder={placeholder}
        onChange={(e) => {
          const raw = e.target.value.replace(/,/g, "").trim();
          if (raw === "") {
            onChange("");
            return;
          }
          const n = Number(raw);
          onChange(Number.isFinite(n) ? n : "");
        }}
        onFocus={(e) => e.target.select()}
        className={`${styles.inputField} ${styles.inputFieldRate}${compact ? ` ${styles.inputFieldCompact}` : ""}`}
      />
    </div>
  );

  return (
    <div
      className={
        compact || labelCompact || gridOnly
          ? `${styles.ratePairCell}${compact ? ` ${styles.ratePairCellCompact}` : ""}`
          : styles.field
      }
    >
      <span className={labelCompact ? `${styles.label} ${styles.labelCompact}` : styles.label}>{label}</span>
      {gridOnly && !compact ? (
        inputEl
      ) : (
        <div className={stepperCls}>
          <button type="button" className={btnCls} aria-label="增加" onClick={() => onStep?.(1)}>
            +
          </button>
          {inputEl}
          <button type="button" className={btnCls} aria-label="減少" onClick={() => onStep?.(-1)}>
            −
          </button>
        </div>
      )}
      {hint ? <p className={styles.rateHint}>{hint}</p> : null}
    </div>
  );
}

/** ② 投資標的區：年化＋股息／股利殖利率 */
export function MobileTargetRateFields(props: {
  annualReturnRate: number;
  setAnnualReturnRate: (n: number) => void;
  setRateSource: (s: "annual" | "dividend" | null) => void;
  rateFromDividend: boolean;
  dividendYieldPct: number | "";
  stockDividendPct: number | "";
  setDividendYieldPct: (v: number | "") => void;
  setStockDividendPct: (v: number | "") => void;
}) {
  const {
    annualReturnRate,
    setAnnualReturnRate,
    setRateSource,
    rateFromDividend,
    dividendYieldPct,
    stockDividendPct,
    setDividendYieldPct,
    setStockDividendPct,
  } = props;

  return (
    <div className={styles.stack}>
      <StepperRateField
        label="年化報酬率 (%)"
        value={annualReturnRate === 0 ? "" : annualReturnRate}
        dimmed={rateFromDividend}
        onChange={(v) => {
          setAnnualReturnRate(v === "" ? 0 : v);
          setRateSource("annual");
        }}
        onStep={(dir) => {
          const base = annualReturnRate || 0;
          const next = Math.max(0, Math.round((base + dir * 0.1) * 10) / 10);
          setAnnualReturnRate(next);
          setRateSource("annual");
        }}
      />
      <div className={styles.ratePairGrid}>
        <StepperRateField
          label="股息殖利率 (%)"
          labelCompact
          compact
          value={dividendYieldPct}
          placeholder="5.5"
          onChange={(v) => {
            setDividendYieldPct(v);
            setRateSource("dividend");
          }}
          onStep={(dir) => {
            setDividendYieldPct(bumpRatePct(dividendYieldPct, dir));
            setRateSource("dividend");
          }}
        />
        <StepperRateField
          label="股利殖利率 (%)"
          labelCompact
          compact
          value={stockDividendPct}
          placeholder="3"
          onChange={(v) => {
            setStockDividendPct(v);
            setRateSource("dividend");
          }}
          onStep={(dir) => {
            setStockDividendPct(bumpRatePct(stockDividendPct, dir));
            setRateSource("dividend");
          }}
        />
      </div>
    </div>
  );
}
