"use client";

import type { LoanMethod } from "./logic";

type Quick11MethodToggleProps = {
  method: LoanMethod;
  onChange: (method: LoanMethod) => void;
  isLight?: boolean;
  /** 交疊圖等窄列：隱藏「推薦使用」、縮小按鈕 */
  compact?: boolean;
};

export function Quick11MethodToggle({
  method,
  onChange,
  isLight = false,
  compact = false,
}: Quick11MethodToggleProps) {
  const shell = compact
    ? `inline-flex items-center gap-0.5 rounded-md border px-0.5 py-0.5 ${
        isLight ? "border-[#E2E8F0] bg-white" : "border-slate-600 bg-transparent"
      }`
    : `inline-flex items-center gap-1.5 rounded-md border px-1.5 py-1 ${
        isLight
          ? "border-[#E2E8F0] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
          : "border-slate-600 bg-transparent"
      }`;

  const btnBase = compact
    ? "rounded border bg-transparent px-2 py-0.5 text-[12px] font-bold transition"
    : "rounded border bg-transparent px-3 py-1 text-[14px] font-bold transition";

  return (
    <div className={shell} role="group" aria-label="還款方式">
      <button
        type="button"
        onClick={() => onChange("annuity")}
        className={`${btnBase} ${
          method === "annuity"
            ? isLight
              ? "border-sky-400 text-sky-700"
              : "border-sky-400/70 text-sky-200"
            : isLight
              ? "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
              : "border-transparent text-slate-300 hover:border-slate-500 hover:text-slate-100"
        }`}
      >
        本息均攤
      </button>
      <button
        type="button"
        onClick={() => onChange("equalPrincipal")}
        className={`${btnBase} ${
          method === "equalPrincipal"
            ? isLight
              ? "border-amber-400 text-amber-800 shadow-[0_0_10px_rgba(251,191,36,0.15)]"
              : "border-amber-300 text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.2)]"
            : isLight
              ? "border-amber-200 text-slate-600 hover:text-amber-800"
              : "border-amber-400/70 text-slate-200 hover:text-amber-100"
        }`}
      >
        本金平均
      </button>
      {!compact ? (
        <span className={`whitespace-nowrap text-[12px] font-bold tracking-[0.02em] ${isLight ? "text-amber-700" : "text-amber-200"}`}>
          推薦使用
        </span>
      ) : null}
    </div>
  );
}
