"use client";

import type { ReactNode } from "react";
import { QuickInvertedSlider } from "@/app/components/quick-stepper-slider";
import { Quick10ExcelChartCta } from "./quick10-excel-chart-cta";
import { formatTwd, inputStyle, miniBtn, sanitizeCalcInput } from "./logic";

function HomeStepper({
  label,
  text,
  onTextChange,
  onCommit,
  onPlus,
  onMinus,
  inputMode = "decimal",
  sliderValue,
  sliderMin,
  sliderMax,
  sliderStep,
  onSliderChange,
}: {
  label: string;
  text: string;
  onTextChange: (raw: string) => void;
  onCommit: (raw: string) => void;
  onPlus: () => void;
  onMinus: () => void;
  inputMode?: "decimal" | "numeric";
  sliderValue: number;
  sliderMin: number;
  sliderMax: number;
  sliderStep: number;
  onSliderChange: (v: number) => void;
}) {
  return (
    <div className="flex h-full min-h-[118px] flex-col rounded-lg border border-slate-700 bg-slate-900/55 p-2">
      <p className="text-[15px] font-black leading-snug text-slate-100">{label}</p>
      <div className="mt-auto flex min-w-0 items-center gap-1.5 pt-2">
        <button type="button" onClick={onPlus} style={miniBtn} className="shrink-0" aria-label={`${label} 增加`}>
          +
        </button>
        <input
          inputMode={inputMode}
          value={text}
          placeholder="支援 +-*/"
          onChange={(e) => onTextChange(sanitizeCalcInput(e.target.value))}
          onBlur={(e) => onCommit(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onCommit((e.currentTarget as HTMLInputElement).value);
              (e.currentTarget as HTMLInputElement).blur();
            }
          }}
          style={{ ...inputStyle, textAlign: "center", flex: 1, minWidth: 0 }}
        />
        <button type="button" onClick={onMinus} style={miniBtn} className="shrink-0" aria-label={`${label} 減少`}>
          −
        </button>
      </div>
      <QuickInvertedSlider
        value={sliderValue}
        min={sliderMin}
        max={sliderMax}
        step={sliderStep}
        ariaLabel={`${label} 拉條`}
        onChange={onSliderChange}
      />
    </div>
  );
}

function SummaryCard({
  title,
  value,
  tone,
  hovered,
  onEnter,
  onLeave,
}: {
  title: string;
  value: string;
  tone: "principal" | "wind" | "crash";
  hovered: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const toneClass =
    tone === "wind"
      ? "border-emerald-400/35 bg-emerald-950/30 shadow-[0_10px_22px_rgba(16,185,129,0.12)]"
      : tone === "crash"
        ? "border-orange-400/35 bg-orange-950/28 shadow-[0_10px_22px_rgba(251,146,60,0.12)]"
        : "border-slate-600/50 bg-slate-900/55";
  const titleClass =
    tone === "wind"
      ? "text-emerald-300"
      : tone === "crash"
        ? "text-orange-300"
        : "text-slate-300";
  const valueClass =
    tone === "wind" ? "text-emerald-300" : tone === "crash" ? "text-orange-300" : "text-slate-100";

  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`flex h-full min-h-[92px] flex-col rounded-xl border p-2.5 transition duration-150 ${toneClass} ${
        hovered ? "-translate-y-0.5" : ""
      }`}
    >
      <p className={`text-[12px] font-black leading-snug ${titleClass}`}>{title}</p>
      <p className={`mt-auto pt-2 text-[17px] font-black tabular-nums leading-none ${valueClass}`}>{value}</p>
    </div>
  );
}

export type Quick10HomeConsoleProps = {
  crashMarketPoints: number;
  principalTotal: number;
  terminal: number;
  afterCrash: number;
  monthly: number;
  years: number;
  annualPct: number;
  crashPct: number;
  monthlyText: string;
  yearsText: string;
  annualPctText: string;
  crashPctText: string;
  onMonthlyTextChange: (raw: string) => void;
  onYearsTextChange: (raw: string) => void;
  onAnnualPctTextChange: (raw: string) => void;
  onCrashPctTextChange: (raw: string) => void;
  commitMoney: (raw: string) => void;
  commitYears: (raw: string) => void;
  commitAnnualPct: (raw: string) => void;
  commitCrashPct: (raw: string) => void;
  bumpMonthly: (delta: number) => void;
  bumpYears: (delta: number) => void;
  bumpAnnualPct: (delta: number) => void;
  bumpCrashPct: (delta: number) => void;
  onMonthlySlider: (v: number) => void;
  onYearsSlider: (v: number) => void;
  onAnnualPctSlider: (v: number) => void;
  onCrashPctSlider: (v: number) => void;
  hoveredCard: "principal" | "normal" | "crash" | null;
  setHoveredCard: (v: "principal" | "normal" | "crash" | null) => void;
  chartSlot?: ReactNode;
  onDownloadExcelChart?: () => void;
  excelDownloadBusy?: boolean;
  footerSlot?: ReactNode;
};

export function Quick10HomeConsole(props: Quick10HomeConsoleProps) {
  const {
    crashMarketPoints,
    principalTotal,
    terminal,
    afterCrash,
    monthly,
    years,
    annualPct,
    crashPct,
    monthlyText,
    yearsText,
    annualPctText,
    crashPctText,
    onMonthlyTextChange,
    onYearsTextChange,
    onAnnualPctTextChange,
    onCrashPctTextChange,
    commitMoney,
    commitYears,
    commitAnnualPct,
    commitCrashPct,
    bumpMonthly,
    bumpYears,
    bumpAnnualPct,
    bumpCrashPct,
    onMonthlySlider,
    onYearsSlider,
    onAnnualPctSlider,
    onCrashPctSlider,
    hoveredCard,
    setHoveredCard,
    chartSlot,
    onDownloadExcelChart,
    excelDownloadBusy = false,
    footerSlot,
  } = props;

  const evaporation = Math.max(0, Math.round(terminal - afterCrash));

  return (
    <div className="space-y-3">
      <p className="text-center text-[12px] font-semibold tracking-wide text-slate-500">
        情境大盤約 {crashMarketPoints.toLocaleString("en-US")} 點（對照）
      </p>

      <div className="grid grid-cols-2 gap-3">
        <HomeStepper
          label="每月投入金額"
          text={monthlyText}
          onTextChange={onMonthlyTextChange}
          onCommit={commitMoney}
          onPlus={() => bumpMonthly(1000)}
          onMinus={() => bumpMonthly(-1000)}
          sliderValue={monthly}
          sliderMin={0}
          sliderMax={500_000}
          sliderStep={100}
          onSliderChange={onMonthlySlider}
        />
        <HomeStepper
          label="預計投入年數"
          text={yearsText}
          onTextChange={onYearsTextChange}
          onCommit={commitYears}
          onPlus={() => bumpYears(1)}
          onMinus={() => bumpYears(-1)}
          sliderValue={years}
          sliderMin={1}
          sliderMax={100}
          sliderStep={1}
          onSliderChange={onYearsSlider}
        />
        <HomeStepper
          label="預期年化報酬率（%）"
          text={annualPctText}
          onTextChange={onAnnualPctTextChange}
          onCommit={commitAnnualPct}
          onPlus={() => bumpAnnualPct(1)}
          onMinus={() => bumpAnnualPct(-1)}
          sliderValue={annualPct}
          sliderMin={0}
          sliderMax={30}
          sliderStep={0.5}
          onSliderChange={onAnnualPctSlider}
        />
        <HomeStepper
          label="期末大跌（%）"
          text={crashPctText}
          onTextChange={onCrashPctTextChange}
          onCommit={commitCrashPct}
          onPlus={() => bumpCrashPct(1)}
          onMinus={() => bumpCrashPct(-1)}
          sliderValue={crashPct}
          sliderMin={-99}
          sliderMax={0}
          sliderStep={1}
          onSliderChange={onCrashPctSlider}
        />
      </div>

      <div className="grid grid-cols-3 items-stretch gap-3">
        <SummaryCard
          title="⚪ 投入總本金"
          value={formatTwd(principalTotal)}
          tone="principal"
          hovered={hoveredCard === "principal"}
          onEnter={() => setHoveredCard("principal")}
          onLeave={() => setHoveredCard(null)}
        />
        <SummaryCard
          title="🟢 順風總資產"
          value={formatTwd(terminal)}
          tone="wind"
          hovered={hoveredCard === "normal"}
          onEnter={() => setHoveredCard("normal")}
          onLeave={() => setHoveredCard(null)}
        />
        <SummaryCard
          title="🟠 崩盤剩餘資產"
          value={formatTwd(afterCrash)}
          tone="crash"
          hovered={hoveredCard === "crash"}
          onEnter={() => setHoveredCard("crash")}
          onLeave={() => setHoveredCard(null)}
        />
      </div>

      <div className="rounded-xl border border-red-500/40 bg-red-950/35 px-3 py-3 text-center shadow-[inset_0_1px_0_rgba(239,68,68,0.12)]">
        <p className="text-[clamp(13px,3.6vw,16px)] font-black leading-snug text-red-400 drop-shadow-[0_0_14px_rgba(239,68,68,0.45)]">
          🩸 崩盤蒸發黑洞：− NT$ {formatTwd(evaporation)} 元
        </p>
        <p className="mt-1 text-[11px] font-semibold text-red-300/75">（順風資產減去崩盤資產）</p>
      </div>

      {chartSlot}
      {onDownloadExcelChart ? (
        <Quick10ExcelChartCta onClick={onDownloadExcelChart} busy={excelDownloadBusy} />
      ) : null}
      {footerSlot}
    </div>
  );
}
