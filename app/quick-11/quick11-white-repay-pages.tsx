"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { motion } from "framer-motion";
import { formatMoney } from "./logic";
import { splitYearsMonths } from "./repay-simulations";
import { getQ11Theme, type Q11Theme } from "./quick11-white-theme";
import { Quick11EarlyRepayTermChart } from "./quick11-early-repay-term-chart";
import { Quick11GraceInterestPkChart } from "./quick11-grace-interest-pk-chart";

function ThemeInlineInput({
  theme,
  value,
  onChange,
  onBlur,
  suffix,
  ariaLabel,
  min = 0,
  max,
  align = "center",
  width = "3.25rem",
  inputPx = 18,
}: {
  theme: Q11Theme;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  suffix: string;
  ariaLabel: string;
  min?: number;
  max?: number;
  align?: "center" | "right";
  width?: string;
  inputPx?: number;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-baseline gap-0.5 border-b-2 ${theme.inlineBorder} px-1 pb-0.5 align-middle`}
    >
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        aria-label={ariaLabel}
        min={min}
        max={max}
        onChange={(e) => onChange(e.currentTarget.value.replace(/[^\d]/g, ""))}
        onBlur={onBlur}
        className={`border-0 bg-transparent p-0 pr-0.5 font-black tabular-nums outline-none ring-0 ${theme.input} ${align === "right" ? "text-right" : "text-center"}`}
        style={{ width, minWidth: width, fontSize: inputPx }}
      />
      <span className={`shrink-0 ${theme.inputSuffix}`}>{suffix}</span>
    </span>
  );
}

function inlineInputWidth(text: string, minRem: number, maxRem: number, inputPx = 18): string {
  const len = Math.max(1, text.length);
  const scale = inputPx / 18;
  const rem = Math.min(maxRem, Math.max(minRem, len * 0.78 * scale + 1.75 * scale));
  return `${rem}rem`;
}

function MoonResult({ theme, icon, children }: { theme: Q11Theme; icon: string; children: ReactNode }) {
  return (
    <motion.div className={theme.glow} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
      <p className={theme.moonResultText}>
        <span className="mr-1.5">{icon}</span>
        {children}
      </p>
    </motion.div>
  );
}

const EARLY_DARK_SHELL = "rounded-xl bg-[#121824] p-3 sm:p-4";
const EARLY_DARK_CARD = "rounded-xl border border-gray-800 bg-[#1F293D] p-3.5 sm:p-4 shadow-[inset_0_1px_0_rgba(56,189,248,0.05)]";
const EARLY_SECTION_TITLE = "text-[17px] font-black tracking-tight text-slate-100";
const EARLY_BODY = "text-[15px] font-semibold leading-[1.65] text-[#9CA3AF]";

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

function GraceFitText({
  children,
  className,
  minPx = 11,
  maxPx = 22,
  fitKey = "",
  align = "left",
}: {
  children: ReactNode;
  className: string;
  minPx?: number;
  maxPx?: number;
  fitKey?: string;
  align?: "left" | "center";
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
  }, [children, fitKey, fit]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => fit());
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  return (
    <div
      ref={containerRef}
      className={`min-w-0 w-full overflow-hidden ${align === "center" ? "flex justify-center" : ""}`}
    >
      <span ref={lineRef} className={`inline-block whitespace-nowrap ${className}`} style={{ fontSize: maxPx }}>
        {children}
      </span>
    </div>
  );
}

function SliderRangeLabels({
  isLight,
  left,
  right,
  size = "sm",
}: {
  isLight: boolean;
  left: string;
  right: string;
  size?: "sm" | "lg";
}) {
  const tone = isLight ? "text-slate-500" : "text-[#9CA3AF]";
  const sizeClass = size === "lg" ? "text-[13px]" : "text-[10px]";
  return (
    <div className={`mt-1.5 flex items-center justify-between font-bold tracking-wide ${sizeClass} ${tone}`}>
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}

type ThemeProps = { isLight?: boolean };

type EarlyProps = ThemeProps & {
  startMonth: number;
  startMonthText: string;
  maxStartMonth: number;
  extraMonthly: number;
  extraText: string;
  loanYears: number;
  prepayMonths: number;
  savedMonths: number;
  savedInterest: number;
  onStartMonthText: (v: string) => void;
  onStartMonthCommit: () => void;
  onStartMonthSlider: (v: number) => void;
  onExtraChange: (v: number) => void;
};

export function Quick11EarlyRepayWhitePage({
  isLight = true,
  startMonth,
  startMonthText,
  maxStartMonth,
  extraMonthly,
  extraText,
  loanYears,
  prepayMonths,
  savedMonths,
  savedInterest,
  onStartMonthText,
  onStartMonthCommit,
  onStartMonthSlider,
  onExtraChange,
}: EarlyProps) {
  const theme = getQ11Theme(isLight);
  const prepayYears = Math.round((prepayMonths / 12) * 10) / 10;
  const shellClass = isLight ? "space-y-4" : `${EARLY_DARK_SHELL} space-y-3.5`;
  const cardClass = isLight ? `${theme.card} space-y-3.5` : `${EARLY_DARK_CARD} space-y-3.5`;
  const titleClass = isLight ? theme.pageTitle : EARLY_SECTION_TITLE;
  const bodyClass = isLight ? "text-[15px] font-semibold leading-[1.65] text-slate-700" : EARLY_BODY;
  const amountRowClass = isLight
    ? "text-[15px] font-semibold leading-[1.65] text-slate-700"
    : "text-[15px] font-semibold leading-[1.65] text-[#9CA3AF]";
  const settingClass = isLight
    ? "mt-0.5 text-[12px] text-[#64748B]"
    : "mt-0.5 text-[12px] font-semibold text-[#A0AEC0]";
  const sliderClass = isLight
    ? theme.slider
    : "h-2.5 w-full cursor-pointer appearance-none rounded-lg bg-[#0f172a] accent-[#38BDF8]";

  return (
    <div className={`${shellClass} font-['Microsoft_JhengHei','微軟正黑體',sans-serif]`}>
      <div className={cardClass}>
        <p className={titleClass}>試算條件</p>

        <div className="space-y-2.5">
          <p className={`${bodyClass} flex flex-wrap items-baseline gap-x-1 gap-y-1`}>
            <span className="whitespace-nowrap">預計從第</span>
            <ThemeInlineInput
              theme={theme}
              value={startMonthText}
              onChange={onStartMonthText}
              onBlur={onStartMonthCommit}
              suffix="個月"
              ariaLabel="開始額外還款期數"
              width={inlineInputWidth(startMonthText, 2.5, 5.5)}
              inputPx={20}
            />
            <span className="whitespace-nowrap">開始</span>
          </p>
          <p className={`${amountRowClass} flex flex-wrap items-baseline gap-x-1 gap-y-1`}>
            <span className="whitespace-nowrap">每月額外多還</span>
            <ThemeInlineInput
              theme={theme}
              value={extraText}
              onChange={(raw) => onExtraChange(raw === "" ? 0 : Number(raw))}
              suffix="元"
              ariaLabel="每月額外還款金額"
              align="right"
              width={inlineInputWidth(extraText, 3.5, 10, 22)}
              inputPx={22}
            />
          </p>
        </div>

        <div className={isLight ? "space-y-3 pt-1" : "space-y-3 border-t border-gray-800/80 pt-3"}>
        <div>
          <input
            type="range"
            min={1}
            max={maxStartMonth}
            step={1}
            value={startMonth}
            onChange={(e) => onStartMonthSlider(Number(e.currentTarget.value))}
            className={sliderClass}
            aria-label="開始額外還款月份拉條"
          />
          <SliderRangeLabels isLight={isLight} left="1個月" right={`${maxStartMonth}個月`} />
        </div>

        <div>
          <input
            type="range"
            min={0}
            max={100_000}
            step={1_000}
            value={extraMonthly}
            onChange={(e) => onExtraChange(Number(e.currentTarget.value))}
            className={sliderClass}
            aria-label="每月額外還款金額拉條"
          />
          <SliderRangeLabels isLight={isLight} left="NT$ 0" right="NT$ 10萬" />
        </div>

        <p className={settingClass}>
          目前設定：第 {startMonth} 個月起，每月 + NT$ {formatMoney(extraMonthly)}
        </p>
        </div>
      </div>

      <Quick11EarlyRepayTermChart
        originalYears={loanYears}
        prepayYears={prepayYears}
        savedMonths={savedMonths}
        savedInterest={savedInterest}
        isLight={isLight}
      />
    </div>
  );
}

export const LUMP_AMOUNT_MIN = 100_000;
export const LUMP_AMOUNT_MAX = 5_000_000;
export const LUMP_AMOUNT_STEP = 10_000;

type LumpProps = ThemeProps & {
  lumpAtYear: number;
  lumpAtYearText: string;
  maxLumpYear: number;
  lumpAmount: number;
  lumpAmountMin: number;
  lumpAmountMax: number;
  loanYears: number;
  lumpPrepayMonths: number;
  savedMonths: number;
  savedInterest: number;
  onYearText: (v: string) => void;
  onYearCommit: () => void;
  onYearSlider: (y: number) => void;
  onLumpAmountChange: (v: number) => void;
  onLumpCommit: () => void;
};

export function Quick11LumpSumWhitePage({
  isLight = true,
  lumpAtYear,
  lumpAtYearText,
  maxLumpYear,
  lumpAmount,
  lumpAmountMin,
  lumpAmountMax,
  loanYears,
  lumpPrepayMonths,
  savedMonths,
  savedInterest,
  onYearText,
  onYearCommit,
  onYearSlider,
  onLumpAmountChange,
  onLumpCommit,
}: LumpProps) {
  const theme = getQ11Theme(isLight);
  const prepayYears = Math.round((lumpPrepayMonths / 12) * 10) / 10;
  const lumpAmountDisplay = formatMoney(lumpAmount);
  const shellClass = isLight ? "space-y-4" : `${EARLY_DARK_SHELL} space-y-3.5`;
  const cardClass = isLight ? `${theme.card} space-y-3.5` : `${EARLY_DARK_CARD} space-y-3.5`;
  const titleClass = isLight ? theme.pageTitle : EARLY_SECTION_TITLE;
  const bodyClass = isLight ? "text-[15px] font-semibold leading-[1.65] text-slate-700" : EARLY_BODY;
  const settingClass = isLight
    ? "mt-0.5 text-[12px] text-[#64748B]"
    : "mt-0.5 text-[12px] font-semibold text-[#A0AEC0]";
  const sliderClass = isLight
    ? theme.slider
    : "h-2.5 w-full cursor-pointer appearance-none rounded-lg bg-[#0f172a] accent-[#38BDF8]";

  return (
    <div className={`${shellClass} font-['Microsoft_JhengHei','微軟正黑體',sans-serif]`}>
      <div className={cardClass}>
        <p className={titleClass}>試算條件</p>

        <div className="space-y-2.5">
          <p className={`${bodyClass} flex flex-wrap items-baseline gap-x-1 gap-y-1`}>
            <span className="whitespace-nowrap">在第</span>
            <ThemeInlineInput
              theme={theme}
              value={lumpAtYearText}
              onChange={onYearText}
              onBlur={onYearCommit}
              suffix="年"
              ariaLabel="大額還款年份"
              width={inlineInputWidth(lumpAtYearText, 2, 3.5)}
              inputPx={20}
            />
            <span className="whitespace-nowrap">一筆過大額還款</span>
          </p>
          <p className={`${bodyClass} flex flex-wrap items-baseline gap-x-1 gap-y-1`}>
            <span className="whitespace-nowrap">還款金額</span>
            <ThemeInlineInput
              theme={theme}
              value={lumpAmountDisplay}
              onChange={(raw) => {
                const digits = raw.replace(/[^\d]/g, "");
                onLumpAmountChange(digits === "" ? 0 : Number(digits));
              }}
              onBlur={onLumpCommit}
              suffix="元"
              ariaLabel="大額還款金額"
              align="right"
              width={inlineInputWidth(lumpAmountDisplay, 4.5, 11, 22)}
              inputPx={22}
            />
          </p>
        </div>

        <div className={isLight ? "space-y-3 pt-1" : "space-y-3 border-t border-gray-800/80 pt-3"}>
          <div>
            <input
              type="range"
              min={1}
              max={maxLumpYear}
              step={1}
              value={lumpAtYear}
              onChange={(e) => onYearSlider(Number(e.currentTarget.value))}
              className={sliderClass}
              aria-label="大額還款年份拉條"
            />
            <SliderRangeLabels isLight={isLight} left="1年" right={`${maxLumpYear}年`} />
          </div>

          <div>
            <input
              type="range"
              min={lumpAmountMin}
              max={lumpAmountMax}
              step={LUMP_AMOUNT_STEP}
              value={lumpAmount}
              onChange={(e) => onLumpAmountChange(Number(e.currentTarget.value))}
              className={sliderClass}
              aria-label="大額還款金額拉條"
            />
            <SliderRangeLabels isLight={isLight} left="NT$ 10萬" right="NT$ 500萬" />
          </div>

          <p className={settingClass}>
            目前設定：第 {lumpAtYear} 年（第 {lumpAtYear * 12} 月）還 NT$ {formatMoney(lumpAmount)}
          </p>
        </div>
      </div>

      <Quick11EarlyRepayTermChart
        originalYears={loanYears}
        prepayYears={prepayYears}
        savedMonths={savedMonths}
        savedInterest={savedInterest}
        compareBarLabel="大額還款"
        isLight={isLight}
      />
    </div>
  );
}

type GraceProps = ThemeProps & {
  loanYears: number;
  graceYears: number;
  graceYearsText: string;
  graceMaxYears: number;
  baselineTotalInterest: number;
  graceTotalInterest: number;
  interestOnlyMonthly: number;
  afterGraceMonthly: number;
  paymentIncreasePct: number;
  interestIncrease: number;
  onYearsText: (v: string) => void;
  onYearsCommit: () => void;
  onYearsSlider: (y: number) => void;
};

export function Quick11GraceDelayWhitePage({
  isLight = true,
  loanYears,
  graceYears,
  graceYearsText,
  graceMaxYears,
  baselineTotalInterest,
  graceTotalInterest,
  interestOnlyMonthly,
  afterGraceMonthly,
  paymentIncreasePct,
  interestIncrease,
  onYearsText,
  onYearsCommit,
  onYearsSlider,
}: GraceProps) {
  const theme = getQ11Theme(isLight);
  const graceLabel = graceYears <= 0 ? "0" : String(graceYears);
  const afterGraceYears = Math.max(0, loanYears - graceYears);
  const afterGraceLabel = afterGraceYears <= 0 ? "0" : String(afterGraceYears);

  const darkCard =
    "rounded-xl border border-gray-800 bg-[#1F293D] shadow-[inset_0_1px_0_rgba(56,189,248,0.05)]";
  const shellClass = isLight ? "space-y-2" : `rounded-xl bg-[#121824] p-2 sm:p-2.5 space-y-2`;
  const cardClass = isLight ? `${theme.card} space-y-2.5 p-3` : `${darkCard} p-3 space-y-2.5`;
  const titleClass = isLight ? "text-[16px] font-black text-slate-800" : "text-[16px] font-black tracking-tight text-slate-100";
  const bodyClass = isLight
    ? "text-[15px] font-semibold leading-snug text-slate-700"
    : "text-[15px] font-semibold leading-snug text-[#CBD5E1]";
  const graceSlider = isLight
    ? "h-2.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-100 accent-emerald-500"
    : "h-2.5 w-full cursor-pointer appearance-none rounded-lg bg-[#0f172a] accent-emerald-400";

  const compareShell = isLight ? "rounded-xl border border-slate-200 bg-white p-0 shadow-sm" : `${darkCard} p-0 overflow-hidden`;
  const colCell = "flex h-full min-h-full flex-col p-3";
  const colDivider = isLight ? "border-slate-200" : "border-gray-700/60";
  const colTag = isLight ? "text-[13px] font-bold tracking-wide text-slate-600" : "text-[13px] font-bold tracking-wide text-slate-300";
  const colBody = isLight
    ? "mt-2 text-[14px] font-semibold leading-snug text-slate-600"
    : "mt-2 text-[14px] font-semibold leading-snug text-[#CBD5E1]";
  const amtGreen = isLight
    ? "font-black tabular-nums text-emerald-600"
    : "font-black tabular-nums text-[#10B981] drop-shadow-[0_0_14px_rgba(16,185,129,0.38)]";
  const amtRed = isLight
    ? "font-black tabular-nums text-red-600"
    : "font-black tabular-nums text-[#EF4444] drop-shadow-[0_0_14px_rgba(239,68,68,0.42)]";
  const pctRed = isLight ? "text-[12px] font-bold leading-none text-red-500" : "text-[12px] font-bold leading-none text-[#EF4444]/85";
  const yrAccent = isLight ? "font-black text-slate-800" : "font-black text-white";
  const costLineClass = isLight
    ? "font-bold tracking-wide text-amber-600"
    : "font-bold tracking-wide text-[#FBBF24] drop-shadow-[0_0_12px_rgba(251,191,36,0.28)]";

  return (
    <div className={`${shellClass} font-['Microsoft_JhengHei','微軟正黑體',sans-serif]`}>
      <div className={cardClass}>
        <p className={titleClass}>試算條件</p>
        <p className={`${bodyClass} flex flex-wrap items-baseline gap-x-1 gap-y-0.5`}>
          <span className="whitespace-nowrap">申請寬限期</span>
          <ThemeInlineInput
            theme={theme}
            value={graceYearsText}
            onChange={onYearsText}
            onBlur={onYearsCommit}
            suffix="年"
            ariaLabel="寬限期年數"
            width={inlineInputWidth(graceYearsText, 2, 4, 22)}
            inputPx={22}
          />
          <span className={`text-[13px] font-normal ${isLight ? theme.muted : "text-[#9CA3AF]"}`}>
            （只繳利息、不還本金）
          </span>
        </p>
        <div>
          <input
            type="range"
            min={0}
            max={graceMaxYears}
            step={1}
            value={graceYears}
            onChange={(e) => onYearsSlider(Number(e.currentTarget.value))}
            className={graceSlider}
            aria-label="寬限期年數拉條"
          />
          <SliderRangeLabels
            isLight={isLight}
            size="lg"
            left="0年（不使用）"
            right={`${graceMaxYears}年（極限）`}
          />
        </div>
      </div>

      <motion.div
        className={compareShell}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
      >
        <div className="grid grid-cols-2 items-stretch">
          <div className={`${colCell} border-r ${colDivider}`}>
            <p className={colTag}>🟢 寬限期內</p>
            <p className={colBody}>
              前 <span className={yrAccent}>{graceLabel}</span> 年每月
            </p>
            <div className="mt-auto space-y-1 pt-2.5">
              <GraceFitText className={amtGreen} maxPx={24} minPx={12} fitKey={`io-${interestOnlyMonthly}`}>
                NT$ {formatMoney(interestOnlyMonthly)}
              </GraceFitText>
              <p className={`${pctRed} invisible select-none`} aria-hidden>
                （增加 0%）
              </p>
            </div>
          </div>

          <div className={colCell}>
            <p className={colTag}>🔴 結束過後</p>
            <p className={colBody}>
              後 <span className={yrAccent}>{afterGraceLabel}</span> 年每月暴增至
            </p>
            <div className="mt-auto space-y-1 pt-2.5">
              <GraceFitText className={amtRed} maxPx={22} minPx={10} fitKey={`ag-${afterGraceMonthly}`}>
                NT$ {formatMoney(afterGraceMonthly)}
              </GraceFitText>
              <p className={pctRed}>（增加 {paymentIncreasePct.toFixed(0)}%）</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="px-1 py-1">
        <GraceFitText
          className={costLineClass}
          align="center"
          maxPx={17}
          minPx={11}
          fitKey={`cost-${interestIncrease}`}
        >
          ⚖️ 延遲總代價：多付給銀行 NT$ {formatMoney(interestIncrease)} 元
        </GraceFitText>
      </div>

      <Quick11GraceInterestPkChart
        baselineTotalInterest={baselineTotalInterest}
        graceTotalInterest={graceTotalInterest}
        interestIncrease={interestIncrease}
        isLight={isLight}
        compact
      />
    </div>
  );
}
