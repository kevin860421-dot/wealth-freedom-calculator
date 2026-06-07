"use client";

import Link from "next/link";
import { useState } from "react";
import {
  QUICK11_EXIT_MODAL_PREVIEW_PATH,
  QUICK11_SIM_RESET_PATH,
} from "@/lib/quick11-marketing";
import {
  QUICK11_SIM_RESET_ITEMS,
  type Quick11SimulationResetReport,
} from "../quick11-simulation-reset";
import { Quick11SimResetButton } from "../quick11-sim-reset-button";

/** 開發／模擬用：清除 quick-11 本機資料（獨立頁，不在 /quick-11 上） */
export function Quick11SimResetClient() {
  const [report, setReport] = useState<Quick11SimulationResetReport | null>(null);

  return (
    <div className="min-h-[100dvh] bg-[#0b0f14] px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-md">
        <p className="text-center text-[12px] font-bold uppercase tracking-[0.12em] text-amber-400/90">Dev · 模擬工具</p>
        <h1 className="mt-2 text-center text-[22px] font-black leading-snug text-white sm:text-[26px]">
          破產計算機資料重置
        </h1>
        <p className="mt-2 text-center text-[13px] leading-relaxed text-slate-400">
          僅供本機或上線前測試。按一次即可回到「未領 Excel、未跑四步驟、倒數重算、離開彈窗可再出現」。
          <br />
          <span className="text-slate-500">若 /quick-11 已在其他分頁開著，也會同步清除。</span>
        </p>

        <ul className="mt-5 space-y-2 rounded-xl border border-slate-700/80 bg-slate-900/60 p-3.5 text-[13px] text-slate-300">
          {QUICK11_SIM_RESET_ITEMS.map((item) => (
            <li key={item.id} className="flex gap-2 leading-snug">
              <span className="shrink-0 text-emerald-400" aria-hidden>
                ✓
              </span>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5">
          <Quick11SimResetButton onAfterReset={setReport} />
        </div>

        {report ? (
          <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-[12px] leading-relaxed text-emerald-100">
            <p className="font-black text-emerald-300">已清除（{report.at.slice(11, 19)}）</p>
            {report.clearedKeys.length > 0 ? (
              <ul className="mt-2 space-y-1 font-mono text-[11px] text-emerald-200/90">
                {report.clearedKeys.map((key) => (
                  <li key={key}>{key}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-emerald-200/80">本機本來就沒有快取資料；cookie 已一併重置。</p>
            )}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/quick-11"
            className="flex min-h-[44px] items-center justify-center rounded-lg border border-sky-500/50 bg-sky-500/15 px-3 text-[14px] font-black text-sky-200 transition hover:bg-sky-500/25"
          >
            前往正式破產計算機 →
          </Link>
          <Link
            href="/quick-11?wizard=1"
            className="flex min-h-[44px] items-center justify-center rounded-lg border border-slate-600 bg-slate-800/80 px-3 text-[14px] font-bold text-slate-200 transition hover:bg-slate-700/80"
          >
            開啟 /quick-11?wizard=1
          </Link>
          <Link
            href={QUICK11_EXIT_MODAL_PREVIEW_PATH}
            className="flex min-h-[44px] items-center justify-center rounded-lg border border-slate-700 px-3 text-[13px] font-semibold text-slate-400 transition hover:text-slate-200"
          >
            四步驟彈窗預覽頁
          </Link>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-600">
          路徑：<span className="font-mono text-slate-500">{QUICK11_SIM_RESET_PATH}</span>
          <br />
          未索引 · 請勿放進正式導流
        </p>
      </div>
    </div>
  );
}
