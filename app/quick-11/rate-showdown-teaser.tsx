"use client";

import { formatMoney, RATE_SHOWDOWN_MAX_ANNUAL_PCT, type RateShowdownRow } from "./rate-showdown";

type RateShowdownTeaserProps = {
  rows: RateShowdownRow[];
  isLight?: boolean;
  onOpen: () => void;
};

/** 首頁總覽：利率對照預覽（可展開視覺）+ 點擊仍開彈窗 */
export function RateShowdownTeaser({ rows, isLight = false, onOpen }: RateShowdownTeaserProps) {
  const baseline = rows[0];
  const nextTier = rows[1];
  const totalTiers = rows.length;
  const extraVsBaseline = nextTier?.extraVsBaseline ?? 0;

  return (
    <div
      className={`rounded-xl border px-3 py-3 ${
        isLight
          ? "border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-950 shadow-[0_2px_10px_rgba(245,158,11,0.2)]"
          : "border-amber-500/50 bg-gradient-to-r from-amber-500/12 to-red-500/8 text-amber-50 shadow-[0_0_16px_rgba(245,158,11,0.12)]"
      }`}
    >
      <p className="text-[22px] font-black leading-normal tracking-[0.01em]">🤔 如果是其他利率呢？</p>
      <p className={`mt-3 text-[16px] font-bold leading-normal ${isLight ? "text-amber-900/90" : "text-amber-100"}`}>
        📈 每 0.5% 一檔，最高試到 {RATE_SHOWDOWN_MAX_ANNUAL_PCT}%
      </p>

      <div
        className={`mt-3.5 overflow-hidden rounded-lg border ${
          isLight ? "border-amber-200/90 bg-white/60" : "border-amber-500/35 bg-black/20"
        }`}
      >
        <ul className="divide-y divide-amber-500/20">
          {baseline ? (
            <li
              className={`flex flex-wrap items-center gap-x-2 gap-y-1 px-2.5 py-2 ${
                isLight ? "bg-white/80" : "bg-black/10"
              }`}
            >
              <span
                className={`shrink-0 rounded-md border px-2 py-0.5 text-[13px] font-black tabular-nums ${
                  isLight ? "border-sky-400/60 bg-sky-50 text-sky-900" : "border-sky-400/45 bg-sky-500/15 text-sky-100"
                }`}
              >
                {baseline.annualRatePct}%
              </span>
              <span
                className={`min-w-0 text-[13px] font-bold tabular-nums leading-snug ${isLight ? "text-slate-800" : "text-slate-100"}`}
              >
                總利息 NT$ {formatMoney(baseline.totalInterest)}
              </span>
            </li>
          ) : null}

          {nextTier ? (
            <>
              <li
                className={`py-1 text-center text-[14px] font-black leading-none ${isLight ? "text-amber-800/60" : "text-amber-200/55"}`}
                aria-hidden
              >
                ↓
              </li>
              <li
                className={`flex flex-wrap items-center gap-x-2 gap-y-1 px-2.5 py-2 ${
                  isLight ? "bg-white/80" : "bg-black/10"
                }`}
              >
                <span
                  className={`shrink-0 rounded-md border px-2 py-0.5 text-[13px] font-black tabular-nums ${
                    isLight ? "border-sky-400/60 bg-sky-50 text-sky-900" : "border-sky-400/45 bg-sky-500/15 text-sky-100"
                  }`}
                >
                  {nextTier.annualRatePct}%
                </span>
                <span
                  className={`min-w-0 text-[13px] font-bold tabular-nums leading-snug ${isLight ? "text-slate-800" : "text-slate-100"}`}
                >
                  總利息 NT$ {formatMoney(nextTier.totalInterest)}
                </span>
              </li>
            </>
          ) : null}
        </ul>

        {nextTier && extraVsBaseline > 0 ? (
          <div
            className={`border-t border-amber-500/20 px-2.5 py-2 ${
              isLight ? "bg-amber-50/80" : "bg-amber-500/8"
            }`}
          >
            <p className={`text-[13px] font-bold tabular-nums leading-snug ${isLight ? "text-slate-900" : "text-slate-100"}`}>
              ⚠️ 多付 NT$ {formatMoney(extraVsBaseline)}
            </p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={onOpen}
          aria-expanded="false"
          aria-label={`查看所有利率，共 ${totalTiers} 檔`}
          className={`flex w-full items-center justify-between gap-2 border-t px-2.5 py-2.5 text-left transition active:scale-[0.995] ${
            isLight
              ? "border-amber-300 bg-amber-100/90 text-amber-950 hover:bg-amber-200/80"
              : "border-amber-500/40 bg-amber-500/15 text-amber-50 hover:bg-amber-500/22"
          }`}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-[13px] font-black leading-none ${
                isLight ? "border-amber-400/70 bg-white text-amber-800" : "border-amber-400/50 bg-amber-950/40 text-amber-200"
              }`}
              aria-hidden
            >
              ▼
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-black leading-snug">查看所有利率</span>
              <span className={`block text-[11px] font-semibold ${isLight ? "text-amber-900/75" : "text-amber-100/75"}`}>
                還有更多利率可一次對照
              </span>
            </span>
          </span>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black tabular-nums ${
              isLight ? "bg-amber-600 text-white" : "bg-amber-400/90 text-amber-950"
            }`}
          >
            共 {totalTiers} 檔
          </span>
        </button>
      </div>
    </div>
  );
}
