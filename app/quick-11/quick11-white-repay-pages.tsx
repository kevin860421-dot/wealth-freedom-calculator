"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { formatMoney } from "./logic";
import { splitYearsMonths } from "./repay-simulations";
import { getQ11Theme, type Q11Theme } from "./quick11-white-theme";
import { Quick11EarlyRepayTermChart } from "./quick11-early-repay-term-chart";

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
    <span className={`inline-flex min-w-[3.5rem] items-baseline gap-0.5 border-b-2 ${theme.inlineBorder} px-1 pb-0.5 align-middle`}>
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
        className={`min-w-0 border-0 bg-transparent p-0 font-black tabular-nums outline-none ring-0 ${theme.input} ${align === "right" ? "text-right" : "text-center"}`}
        style={{ width, fontSize: inputPx }}
      />
      <span className={theme.inputSuffix}>{suffix}</span>
    </span>
  );
}

function inlineInputWidth(text: string, minRem: number, maxRem: number): string {
  const len = Math.max(1, text.length);
  const rem = Math.min(maxRem, Math.max(minRem, len * 0.62 + 1.4));
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

function SliderRangeLabels({
  isLight,
  left,
  right,
}: {
  isLight: boolean;
  left: string;
  right: string;
}) {
  const tone = isLight ? "text-slate-500" : "text-[#6B7280]";
  return (
    <div className={`mt-1 flex items-center justify-between text-[10px] font-bold tracking-wide ${tone}`}>
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
              width={inlineInputWidth(extraText, 3.5, 7.5)}
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

type LumpProps = ThemeProps & {
  lumpAtYear: number;
  lumpAtYearText: string;
  lumpAmount: number;
  lumpText: string;
  loanAmount: number;
  savedMonths: number;
  savedInterest: number;
  onYearText: (v: string) => void;
  onYearCommit: () => void;
  onLumpText: (v: string) => void;
  onLumpCommit: () => void;
  onLumpSlider: (v: number) => void;
  lumpSliderStep: number;
};

export function Quick11LumpSumWhitePage({
  isLight = true,
  lumpAtYear,
  lumpAtYearText,
  lumpAmount,
  lumpText,
  loanAmount,
  savedMonths,
  savedInterest,
  onYearText,
  onYearCommit,
  onLumpText,
  onLumpCommit,
  onLumpSlider,
  lumpSliderStep,
}: LumpProps) {
  const theme = getQ11Theme(isLight);
  const { years, months } = splitYearsMonths(savedMonths);

  return (
    <div className="space-y-4 font-['Microsoft_JhengHei','微軟正黑體',sans-serif]">
      <div className={`${theme.card} space-y-3`}>
        <p className={theme.sectionLabel}>試算條件</p>
        <p className={theme.body}>
          在第{" "}
          <ThemeInlineInput
            theme={theme}
            value={lumpAtYearText}
            onChange={onYearText}
            onBlur={onYearCommit}
            suffix="年"
            ariaLabel="大額還款年份"
          />{" "}
          一筆過大額還款{" "}
          <ThemeInlineInput
            theme={theme}
            value={lumpText}
            onChange={onLumpText}
            onBlur={onLumpCommit}
            suffix="元"
            ariaLabel="大額還款金額"
            align="right"
            width="4.5rem"
          />
        </p>
        <input
          type="range"
          min={0}
          max={loanAmount}
          step={lumpSliderStep}
          value={lumpAmount}
          onChange={(e) => onLumpSlider(Number(e.currentTarget.value))}
          className={theme.slider}
          aria-label="大額還款金額拉條"
        />
        <p className={theme.muted}>
          目前設定：第 {lumpAtYear} 年（第 {lumpAtYear * 12} 月）還 NT$ {formatMoney(lumpAmount)}
        </p>
      </div>

      <MoonResult theme={theme} icon="🎉">
        縮短航程：您的房貸畢業時間將提早{" "}
        <span className={theme.accent}>
          {years > 0 ? `${years} 年` : ""}
          {years > 0 && months > 0 ? " " : ""}
          {months > 0 ? `${months} 個月` : years === 0 ? "0 個月" : ""}
        </span>
        ！
      </MoonResult>

      <MoonResult theme={theme} icon="💰">
        節省燃料：此舉成功幫您省下 <span className={theme.accent}>NT$ {formatMoney(savedInterest)}</span> 元的純利息代價！
      </MoonResult>
    </div>
  );
}

type GraceProps = ThemeProps & {
  graceYears: number;
  graceYearsText: string;
  graceMaxYears: number;
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
  graceYears,
  graceYearsText,
  graceMaxYears,
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
  const graceSlider = isLight
    ? "h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-100 accent-emerald-500"
    : "h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-emerald-400";

  return (
    <div className="space-y-4 font-['Microsoft_JhengHei','微軟正黑體',sans-serif]">
      <div className={`${theme.card} space-y-3`}>
        <p className={theme.sectionLabel}>試算條件</p>
        <p className={theme.body}>
          申請寬限期{" "}
          <ThemeInlineInput
            theme={theme}
            value={graceYearsText}
            onChange={onYearsText}
            onBlur={onYearsCommit}
            suffix="年"
            ariaLabel="寬限期年數"
          />
          <span className={`text-[13px] font-normal ${theme.muted}`}>（只繳利息、不還本金）</span>
        </p>
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
      </div>

      <motion.div className={theme.gracePhase1} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
        <p className={theme.gracePhase1Title}>第一階段 · 寬限期內</p>
        <p className={`mt-2 ${theme.gracePhase1Amount}`}>
          前 {graceLabel} 年每月降至{" "}
          <span className="text-[clamp(20px,5.5vw,26px)] font-black tabular-nums">NT$ {formatMoney(interestOnlyMonthly)}</span>
        </p>
      </motion.div>

      <motion.div
        className={theme.gracePhase2}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <p className={theme.gracePhase2Title}>第二階段 · 寬限期後</p>
        <p className={`mt-2 ${theme.gracePhase2Body}`}>
          ⚠️ 警報！寬限期結束後，由於剩餘還款年限縮短，您的每月還款將暴增至{" "}
          <span className={`text-[clamp(20px,5.5vw,26px)] tabular-nums ${theme.gracePhase2Amount}`}>
            NT$ {formatMoney(afterGraceMonthly)}
          </span>{" "}
          （增加 {paymentIncreasePct.toFixed(0)}%）！
        </p>
        <p className={`mt-3 ${theme.gracePhase2Body}`}>
          總繳利息將因而「多送給銀行」{" "}
          <span className={theme.gracePhase2Amount}>NT$ {formatMoney(interestIncrease)}</span> 元！
        </p>
      </motion.div>
    </div>
  );
}
