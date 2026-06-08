"use client";

import type { ReactNode } from "react";

export const Q10_DARK_CARD = "rounded-xl border border-gray-800 bg-[#1F293D] p-3 shadow-[inset_0_1px_0_rgba(56,189,248,0.05)]";
export const Q10_DARK_SHELL = "rounded-xl bg-[#121824] p-2.5 sm:p-3";
export const Q10_SECTION_TITLE = "text-[15px] font-black tracking-tight text-slate-100";
export const Q10_BODY = "text-[14px] font-semibold leading-snug text-[#CBD5E1]";
export const Q10_MUTED = "text-[12px] font-semibold text-[#9CA3AF]";

export function StressCard({
  children,
  alert = false,
  warn = false,
}: {
  children: ReactNode;
  alert?: boolean;
  warn?: boolean;
}) {
  const tone = alert
    ? "border-red-500/45 bg-red-950/35 shadow-[inset_0_1px_0_rgba(239,68,68,0.12)]"
    : warn
      ? "border-orange-500/35 bg-orange-950/25"
      : "border-gray-800 bg-[#1F293D] shadow-[inset_0_1px_0_rgba(56,189,248,0.05)]";
  return <div className={`rounded-xl border p-3 ${tone}`}>{children}</div>;
}

export function MetricHero({
  label,
  value,
  tone = "neutral",
  sub,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "green" | "red" | "amber";
  sub?: string;
}) {
  const valueClass =
    tone === "green"
      ? "text-[#10B981] drop-shadow-[0_0_14px_rgba(16,185,129,0.35)]"
      : tone === "red"
        ? "text-[#EF4444] drop-shadow-[0_0_14px_rgba(239,68,68,0.42)]"
        : tone === "amber"
          ? "text-[#FBBF24] drop-shadow-[0_0_12px_rgba(251,191,36,0.28)]"
          : "text-slate-100";
  return (
    <div className="space-y-1">
      <p className="text-[12px] font-bold tracking-wide text-slate-400">{label}</p>
      <p className={`text-[clamp(18px,5vw,26px)] font-black tabular-nums leading-none ${valueClass}`}>{value}</p>
      {sub ? <p className="text-[11px] font-semibold text-[#9CA3AF]">{sub}</p> : null}
    </div>
  );
}

export function StressSlider({
  label,
  value,
  min,
  max,
  step,
  leftLabel,
  rightLabel,
  onChange,
  formatValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  leftLabel: string;
  rightLabel: string;
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
}) {
  const display = formatValue ? formatValue(value) : String(value);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className={Q10_BODY}>{label}</span>
        <span className="shrink-0 text-[13px] font-black tabular-nums text-sky-300">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
        className="h-2.5 w-full cursor-pointer appearance-none rounded-lg bg-[#0f172a] accent-red-500"
      />
      <div className="flex justify-between text-[11px] font-bold text-[#6B7280]">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

export function StepperField({
  label,
  value,
  text,
  onTextChange,
  onCommit,
  onBump,
  step,
  suffix = "",
}: {
  label: string;
  value: number;
  text: string;
  onTextChange: (v: string) => void;
  onCommit: () => void;
  onBump: (delta: number) => void;
  step: number;
  suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className={Q10_MUTED}>{label}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onBump(-step)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-lg font-black text-sky-300 transition hover:border-sky-500"
          aria-label="減少"
        >
          −
        </button>
        <div className="flex min-w-0 flex-1 items-center rounded-md border border-slate-600 bg-[#0b1220] px-2">
          <input
            value={text}
            onChange={(e) => onTextChange(e.currentTarget.value)}
            onBlur={onCommit}
            className="min-w-0 w-full border-0 bg-transparent py-2 text-center text-[16px] font-black tabular-nums text-slate-100 outline-none"
            inputMode="decimal"
          />
          {suffix ? <span className="shrink-0 text-[12px] font-bold text-slate-400">{suffix}</span> : null}
        </div>
        <button
          type="button"
          onClick={() => onBump(step)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-lg font-black text-sky-300 transition hover:border-sky-500"
          aria-label="增加"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function AlertBanner({ children, level }: { children: ReactNode; level: "red" | "amber" | "green" }) {
  const cls =
    level === "red"
      ? "border-red-500/45 bg-red-950/40 text-red-200"
      : level === "amber"
        ? "border-amber-500/40 bg-amber-950/30 text-amber-100"
        : "border-emerald-500/40 bg-emerald-950/30 text-emerald-100";
  return <p className={`rounded-lg border px-3 py-2 text-[13px] font-black leading-snug ${cls}`}>{children}</p>;
}
