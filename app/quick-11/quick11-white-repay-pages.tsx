"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { formatMoney } from "./logic";
import { splitYearsMonths } from "./repay-simulations";
import { getQ11Theme, type Q11Theme } from "./quick11-white-theme";

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
}) {
  return (
    <span className={`inline-flex min-w-[4.5rem] items-baseline gap-0.5 border-b-2 ${theme.inlineBorder} px-1 pb-0.5 align-middle`}>
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
        className={`min-w-0 border-0 bg-transparent p-0 text-[18px] font-black tabular-nums outline-none ring-0 ${theme.input} ${align === "right" ? "text-right" : "text-center"}`}
        style={{ width }}
      />
      <span className={theme.inputSuffix}>{suffix}</span>
    </span>
  );
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

type ThemeProps = { isLight?: boolean };

type EarlyProps = ThemeProps & {
  startMonth: number;
  startMonthText: string;
  extraMonthly: number;
  extraText: string;
  savedMonths: number;
  savedInterest: number;
  onStartMonthText: (v: string) => void;
  onStartMonthCommit: () => void;
  onExtraChange: (v: number) => void;
};

export function Quick11EarlyRepayWhitePage({
  isLight = true,
  startMonth,
  startMonthText,
  extraMonthly,
  extraText,
  savedMonths,
  savedInterest,
  onStartMonthText,
  onStartMonthCommit,
  onExtraChange,
}: EarlyProps) {
  const theme = getQ11Theme(isLight);
  const { years, months } = splitYearsMonths(savedMonths);
  const yearPart = years > 0 ? `${years} 年` : "";
  const monthPart = months > 0 ? `${months} 個月` : years === 0 ? "0 個月" : "";

  return (
    <div className="space-y-4 font-['Microsoft_JhengHei','微軟正黑體',sans-serif]">
      <div className={`${theme.card} space-y-3`}>
        <p className={theme.sectionLabel}>試算條件</p>
        <p className={theme.body}>
          預計從第{" "}
          <ThemeInlineInput
            theme={theme}
            value={startMonthText}
            onChange={onStartMonthText}
            onBlur={onStartMonthCommit}
            suffix="月"
            ariaLabel="開始額外還款期數"
          />{" "}
          開始，每月額外多還{" "}
          <ThemeInlineInput
            theme={theme}
            value={extraText}
            onChange={(raw) => onExtraChange(raw === "" ? 0 : Number(raw))}
            suffix="元"
            ariaLabel="每月額外還款金額"
            align="right"
            width="4.5rem"
          />
        </p>
        <input
          type="range"
          min={0}
          max={100_000}
          step={1_000}
          value={extraMonthly}
          onChange={(e) => onExtraChange(Number(e.currentTarget.value))}
          className={theme.slider}
          aria-label="每月額外還款拉條"
        />
        <p className={theme.muted}>目前設定：第 {startMonth} 月起，每月 + NT$ {formatMoney(extraMonthly)}</p>
      </div>

      <MoonResult theme={theme} icon="🎉">
        縮短航程：您的房貸畢業時間將提早{" "}
        <span className={theme.accent}>
          {yearPart}
          {yearPart && monthPart ? " " : ""}
          {monthPart}
        </span>
        ！
      </MoonResult>

      <MoonResult theme={theme} icon="💰">
        節省燃料：此舉成功幫您省下 <span className={theme.accent}>NT$ {formatMoney(savedInterest)}</span> 元的純利息代價！
      </MoonResult>
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
