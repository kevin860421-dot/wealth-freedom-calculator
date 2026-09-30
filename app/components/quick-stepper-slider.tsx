"use client";

import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import {
  amountFromInvertedRange,
  clampRangeAmount,
  invertedFillPct,
  invertedRangeDisplay,
} from "./quick-inverted-range";
import styles from "./quick-stepper-slider.module.css";

export { amountFromInvertedRange, clampRangeAmount, invertedFillPct, invertedRangeDisplay };

function fitInputTextToWidth(input: HTMLInputElement, minPx: number, maxPx: number) {
  const width = input.clientWidth;
  if (width <= 0) return;
  const cssMax = parseFloat(getComputedStyle(input).getPropertyValue("--step-num-max"));
  const ceiling = Number.isFinite(cssMax) && cssMax > minPx ? cssMax : maxPx;
  input.style.fontSize = `${ceiling}px`;
  if (input.scrollWidth <= width) return;
  let lo = minPx;
  let hi = ceiling;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    input.style.fontSize = `${mid}px`;
    if (input.scrollWidth <= width) lo = mid;
    else hi = mid;
  }
  input.style.fontSize = `${lo}px`;
}

function useStepperInputShrinkFit(text: string, tall: boolean) {
  const inputRef = useRef<HTMLInputElement>(null);
  const minPx = tall ? 13 : 12;
  const maxPx = tall ? 22 : 18;

  const fit = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    fitInputTextToWidth(input, minPx, maxPx);
  }, [minPx, maxPx]);

  useLayoutEffect(() => {
    fit();
    const id = requestAnimationFrame(() => fit());
    return () => cancelAnimationFrame(id);
  }, [text, fit]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => fit());
    ro.observe(input);
    return () => ro.disconnect();
  }, [fit]);

  return { inputRef, maxPx };
}

type StepperRowProps = {
  text: string;
  onTextChange: (v: string) => void;
  onCommit: (raw?: string) => void;
  onBump: (delta: number) => void;
  bumpStep: number;
  ariaLabel: string;
  inputMode?: "numeric" | "decimal";
  tall?: boolean;
  inputSuffix?: ReactNode;
  onEnter?: () => void;
  /** 右加左減。未設時維持舊的左加右減。 */
  increaseRight?: boolean;
};

/** 未設 increaseRight：+ 左、− 右。increaseRight：− 左、+ 右。 */
export function QuickStepperRow({
  text,
  onTextChange,
  onCommit,
  onBump,
  bumpStep,
  ariaLabel,
  inputMode = "numeric",
  tall = false,
  inputSuffix,
  onEnter,
  increaseRight = false,
}: StepperRowProps) {
  const { inputRef, maxPx } = useStepperInputShrinkFit(text, tall);
  const decreaseButton = (
    <button type="button" className={styles.stepBtn} aria-label={`${ariaLabel} 減少`} onClick={() => onBump(-bumpStep)}>
      −
    </button>
  );
  const increaseButton = (
    <button type="button" className={styles.stepBtn} aria-label={`${ariaLabel} 增加`} onClick={() => onBump(bumpStep)}>
      +
    </button>
  );

  return (
    <div className={styles.stepperRow}>
      {increaseRight ? decreaseButton : increaseButton}
      <div className={styles.inputRow}>
        <input
          ref={inputRef}
          type="text"
          inputMode={inputMode}
          value={text ?? ""}
          aria-label={ariaLabel}
          onChange={(e) => onTextChange(e.target.value)}
          onBlur={(e) => onCommit(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onEnter?.();
              onCommit(e.currentTarget.value);
              (e.currentTarget as HTMLInputElement).blur();
            }
          }}
          onFocus={(e) => e.target.select()}
          className={`${styles.inputField} ${tall ? styles.inputFieldTall : ""} ${inputSuffix ? styles.inputFieldWithSuffix : ""}`}
          style={{ fontSize: maxPx }}
        />
        {inputSuffix}
      </div>
      {increaseRight ? increaseButton : decreaseButton}
    </div>
  );
}

type InvertedSliderProps = {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  ariaLabel: string;
  tone?: "green" | "cyan";
  scaleLeft?: string | number;
  scaleRight?: string | number;
  style?: CSSProperties;
  /** 左小右大。未設時維持左大右小。 */
  increaseRight?: boolean;
};

/** 預設左大右小。increaseRight 時左小右大。 */
export function QuickInvertedSlider({
  value,
  min,
  max,
  step,
  onChange,
  ariaLabel,
  tone = "green",
  scaleLeft,
  scaleRight,
  style,
  increaseRight = false,
}: InvertedSliderProps) {
  const amount = clampRangeAmount(value, min, max);
  const display = increaseRight ? amount : invertedRangeDisplay(amount, min, max);
  const fillPct = increaseRight
    ? max <= min
      ? "0%"
      : `${((amount - min) / (max - min)) * 100}%`
    : invertedFillPct(amount, min, max);
  const rangeCls = tone === "cyan" ? `${styles.range} ${styles.rangeCyan}` : styles.range;

  return (
    <div className={styles.sliderWrap} style={style}>
      <input
        type="range"
        className={rangeCls}
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(display) ? display : min}
        aria-label={ariaLabel}
        style={{ "--fill-pct": fillPct } as CSSProperties}
        onChange={(e) => {
          const raw = Number(e.target.value);
          if (!Number.isFinite(raw)) return;
          const next = increaseRight ? clampRangeAmount(raw, min, max) : amountFromInvertedRange(raw, min, max);
          if (next === amount) return;
          onChange(next);
        }}
      />
      {scaleLeft != null || scaleRight != null ? (
        <div className={styles.scaleRow}>
          <span>{scaleLeft ?? (increaseRight ? min : max)}</span>
          <span>{scaleRight ?? (increaseRight ? max : min)}</span>
        </div>
      ) : null}
    </div>
  );
}

type FieldProps = StepperRowProps &
  InvertedSliderProps & {
    label?: ReactNode;
    labelStyle?: CSSProperties;
    hideSlider?: boolean;
  };

export function QuickStepperSliderField({
  label,
  labelStyle,
  hideSlider,
  ...rest
}: FieldProps) {
  const { text, onTextChange, onCommit, onBump, bumpStep, ariaLabel, inputMode, tall, inputSuffix, onEnter, increaseRight } = rest;
  const { value, min, max, step, onChange, tone, scaleLeft, scaleRight, style } = rest;

  return (
    <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
      {label ? (
        <div style={labelStyle ?? { fontSize: 15, fontWeight: 800 }}>{label}</div>
      ) : null}
      <QuickStepperRow
        text={text}
        onTextChange={onTextChange}
        onCommit={onCommit}
        onBump={onBump}
        bumpStep={bumpStep}
        ariaLabel={ariaLabel}
        inputMode={inputMode}
        tall={tall}
        inputSuffix={inputSuffix}
        onEnter={onEnter}
        increaseRight={increaseRight}
      />
      {hideSlider ? null : (
        <QuickInvertedSlider
          value={value}
          min={min}
          max={max}
          step={step}
          increaseRight={increaseRight}
          onChange={onChange}
          ariaLabel={`${ariaLabel} 拉條`}
          tone={tone}
          scaleLeft={scaleLeft}
          scaleRight={scaleRight}
          style={style}
        />
      )}
    </div>
  );
}
