"use client";

import { QUICK11_LOAN_PRESETS } from "./loan-scenarios";
import { formatMoney, Q11_ANNUAL_RATE_MAX_PCT, Q11_ANNUAL_RATE_MIN_PCT } from "./logic";
import goldStat from "./quick-11-golden-stat.module.css";
import type { Quick11ShareSnapshotData } from "./quick11-share-snapshot-data";

const LOAN_PRINCIPAL_MIN = 10_000;
const LOAN_PRINCIPAL_MAX = 50_000_000;

function sliderPct(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

function SnapshotInputField(props: {
  label: string;
  unit: string;
  text: string;
  value: number;
  sliderMin: number;
  sliderMax: number;
  compact?: boolean;
  showPresets?: boolean;
  quickActions?: Array<{ label: string }>;
}) {
  const { label, unit, text, value, sliderMin, sliderMax, compact = false, showPresets = false, quickActions } = props;
  const pct = sliderPct(value, sliderMin, sliderMax);

  return (
    <div
      className={`block rounded-lg border ${compact ? "p-1.5" : "p-2"} border-slate-700 bg-slate-900/55`}
    >
      {showPresets ? (
        <div className="mb-1.5 flex flex-wrap items-center gap-1">
          {QUICK11_LOAN_PRESETS.map((preset) => (
            <span
              key={preset.key}
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-600 bg-slate-800 px-1.5 py-1 text-[11px] font-semibold text-slate-100"
            >
              <span aria-hidden>{preset.icon}</span>
              <span>{preset.label}</span>
            </span>
          ))}
        </div>
      ) : null}
      <div className={`mb-1.5 flex items-center justify-between gap-1.5 ${compact ? "min-h-[20px]" : "min-h-[22px]"}`}>
        <span className={`font-semibold tracking-[0.03em] ${compact ? "text-[12px]" : "text-[14px]"} text-slate-200`}>
          {label}
        </span>
        <span className={`shrink-0 whitespace-nowrap font-semibold tracking-[0.03em] ${compact ? "text-[12px]" : "text-[15px]"} text-slate-300`}>
          {unit}
        </span>
      </div>
      <div className="flex min-w-0 items-stretch gap-1.5">
        <div
          className={`flex min-w-0 w-full items-center rounded-md border font-black ${
            compact ? "h-9 px-1.5 tracking-[-0.015em] text-[15px]" : "h-10 px-3 tracking-[-0.01em] text-[20px]"
          } border-slate-600 bg-[#0b1220] text-slate-100`}
        >
          {text}
        </div>
        <div className={`grid shrink-0 grid-rows-2 gap-1 ${compact ? "w-8" : "w-9"}`}>
          <span
            className={`flex items-center justify-center rounded-sm border font-bold ${
              compact ? "h-[19px] text-[12px]" : "h-[21px] text-[13px]"
            } border-slate-600 bg-slate-900/80 text-slate-100`}
          >
            +
          </span>
          <span
            className={`flex items-center justify-center rounded-sm border font-bold ${
              compact ? "h-[19px] text-[12px]" : "h-[21px] text-[13px]"
            } border-slate-600 bg-slate-900/80 text-slate-100`}
          >
            -
          </span>
        </div>
      </div>
      <div className="relative mt-1 h-1.5 w-full overflow-hidden rounded-lg bg-slate-700">
        <div className="absolute inset-y-0 left-0 rounded-lg bg-sky-500" style={{ width: `${pct}%` }} />
      </div>
      {quickActions?.length ? (
        <div className="mt-1.5 flex w-full gap-1 overflow-x-auto pb-0.5">
          {quickActions.map((action) => (
            <span
              key={action.label}
              className="shrink-0 rounded-sm border border-slate-600 bg-slate-900/80 px-2.5 py-1.5 text-[12px] font-semibold tracking-[0.03em] text-slate-100"
            >
              {action.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SnapshotInfoCard(props: { title: string; value: string; tone: string }) {
  return (
    <div className={`min-w-0 flex min-h-[94px] flex-col rounded-lg border p-2 ${props.tone}`}>
      <p className="truncate whitespace-nowrap text-[14px] font-bold tracking-[0.04em] text-slate-300">{props.title}</p>
      <p className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-[18px] font-black leading-none tracking-[-0.015em]">
        {props.value}
      </p>
    </div>
  );
}

function SnapshotTotalRepaymentCard(props: { totalRepayment: number; totalInterest: number; principal: number }) {
  const { totalRepayment, totalInterest, principal } = props;
  const warnHigh = totalInterest > principal;
  const bgClass = warnHigh ? "bg-red-950/35" : "bg-sky-500/12";
  const titleClass = totalInterest > principal / 2 ? "text-orange-300" : "text-slate-400";
  const valueClass = warnHigh ? "text-red-200" : "text-sky-100";

  return (
    <div className={`rounded-lg border p-2 ${bgClass} ${warnHigh ? "border-red-500/65" : "border-sky-500/35"}`}>
      <p className={`truncate whitespace-nowrap text-[16px] font-bold tracking-[0.04em] ${titleClass}`}>總繳金額</p>
      <p className={`mt-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[20px] font-black leading-none tracking-[-0.01em] ${valueClass}`}>
        NT$ {formatMoney(totalRepayment)}
      </p>
    </div>
  );
}

/** 與 /quick-11 首頁（輸入區＋首頁總覽）視覺對齊，供 html2canvas 擷取 */
export function Quick11HomeSnapshotView({ data }: { data: Quick11ShareSnapshotData }) {
  const isAnnuity = data.method === "annuity";

  return (
    <div className="space-y-3 rounded-xl border border-slate-700 bg-[#0f172a] p-2.5 text-slate-100">
      <div className="space-y-2 rounded-lg border border-slate-800 bg-sky-950/55 p-2">
        <SnapshotInputField
          label="貸款總額"
          unit="NT$"
          text={formatMoney(data.loanAmount)}
          value={data.loanAmount}
          sliderMin={LOAN_PRINCIPAL_MIN}
          sliderMax={LOAN_PRINCIPAL_MAX}
          showPresets
          quickActions={[
            { label: "+5萬" },
            { label: "+10萬" },
            { label: "+20萬" },
            { label: "+50萬" },
            { label: "+100萬" },
          ]}
        />
        <div className="grid gap-2" style={{ gridTemplateColumns: "minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 0.9fr)" }}>
          <SnapshotInputField
            compact
            label="月收入（預警）"
            unit="NT$"
            text={formatMoney(data.monthlyIncome)}
            value={data.monthlyIncome}
            sliderMin={20_000}
            sliderMax={10_000_000}
          />
          <SnapshotInputField
            compact
            label="年利率"
            unit="%"
            text={String(data.annualRate)}
            value={data.annualRate}
            sliderMin={Q11_ANNUAL_RATE_MIN_PCT}
            sliderMax={Q11_ANNUAL_RATE_MAX_PCT}
          />
          <SnapshotInputField
            compact
            label="貸款年期"
            unit="年"
            text={String(data.loanYears)}
            value={data.loanYears}
            sliderMin={1}
            sliderMax={100}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900/60">
        <div className="space-y-2 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-lg font-black text-sky-100">首頁總覽</p>
            <div className="mr-5 inline-flex items-center gap-1.5 rounded-md border border-slate-600 bg-transparent px-1.5 py-1">
              <span
                className={`rounded border bg-transparent px-3 py-1 text-[14px] font-bold ${
                  isAnnuity ? "border-sky-400/70 text-sky-200" : "border-transparent text-slate-300"
                }`}
              >
                本息均攤
              </span>
              <span
                className={`rounded border bg-transparent px-3 py-1 text-[14px] font-bold ${
                  !isAnnuity
                    ? "border-amber-300 text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.2)]"
                    : "border-amber-400/70 text-slate-200"
                }`}
              >
                本金平均
              </span>
              <span className="whitespace-nowrap text-[12px] font-bold tracking-[0.02em] text-amber-200">推薦使用</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <SnapshotInfoCard
              title="每月繳款"
              value={`NT$ ${formatMoney(data.monthlyPayment)}`}
              tone="text-slate-100 border-slate-600 bg-slate-800/80"
            />
            <SnapshotInfoCard
              title="每月利息"
              value={`NT$ ${formatMoney(data.monthlyInterest)}`}
              tone="text-slate-100 border-slate-600 bg-slate-800/80"
            />
            <SnapshotInfoCard
              title="總繳利息"
              value={`NT$ ${formatMoney(data.totalInterest)}`}
              tone="text-sky-100 border-sky-500/35 bg-sky-500/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SnapshotTotalRepaymentCard
              principal={data.loanAmount}
              totalInterest={data.totalInterest}
              totalRepayment={data.totalRepayment}
            />
            <div className={`min-w-0 rounded-lg border border-slate-600 bg-slate-800/80 p-2 text-slate-100 ${goldStat.q11GoldStat}`}>
              <div className={goldStat.q11GoldInner}>
                <p className="truncate whitespace-nowrap text-[16px] font-bold tracking-[0.04em] text-slate-300">多出多少</p>
                <p className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-[20px] font-black leading-none tracking-[-0.015em]">
                  NT$ {formatMoney(data.totalInterest)}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">相較本金多付</p>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-500">wealth-freedom-calculator.vercel.app/quick-11</p>
        </div>
      </div>
    </div>
  );
}
