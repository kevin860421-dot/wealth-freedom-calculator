"use client";

import { AnimatePresence, motion } from "framer-motion";
import { formatInterestWan, formatMoney, RATE_SHOWDOWN_MAX_ANNUAL_PCT, type RateShowdownRow } from "./rate-showdown";

/** 比主欄 440px 略窄，左右留白減少卡片右側空檔感 */
const RATE_SHOWDOWN_MODAL_CLASS = "left-0 right-0 mx-auto w-[calc(100%-1.5rem)] max-w-[384px]";

type RateShowdownModalProps = {
  open: boolean;
  onClose: () => void;
  isLight: boolean;
  baselineRatePct: number;
  methodLabel: string;
  rows: RateShowdownRow[];
};

export function RateShowdownModal({
  open,
  onClose,
  isLight,
  baselineRatePct,
  methodLabel,
  rows,
}: RateShowdownModalProps) {
  const baseline = rows.find((r) => r.isBaseline) ?? rows[0];
  const compareCount = rows.filter((r) => !r.isBaseline).length;

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="關閉利率大對決"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70"
            onClick={onClose}
          />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="rate-showdown-title"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`fixed bottom-0 z-[70] flex max-h-[88vh] flex-col overflow-hidden rounded-t-2xl border shadow-[0_-8px_32px_rgba(0,0,0,0.2)] ${RATE_SHOWDOWN_MODAL_CLASS} ${
              isLight ? "border-slate-200 bg-white" : "border-slate-700 bg-[#0b1220]"
            }`}
          >
            <motion.div className="flex min-h-0 flex-1 flex-col px-2.5 pb-4 pt-3">
              <div className={`mx-auto mb-3 h-1 w-10 shrink-0 rounded-full ${isLight ? "bg-slate-300" : "bg-slate-600"}`} aria-hidden />

              <header className="flex shrink-0 items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className={`text-[14px] font-semibold uppercase tracking-[0.12em] ${isLight ? "text-amber-700" : "text-amber-300"}`}>
                    利率大對決
                  </p>
                  <h2 id="rate-showdown-title" className={`mt-1 text-[16px] font-black leading-snug ${isLight ? "text-slate-900" : "text-slate-50"}`}>
                    你多繳了多少冤枉錢？
                  </h2>
                  <p className={`mt-1 text-[14px] font-semibold leading-relaxed ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                    同一筆貸款、同一還款方式（{methodLabel}），每 0.5% 一檔試到年利率 {RATE_SHOWDOWN_MAX_ANNUAL_PCT}%（共 {compareCount} 種加碼）。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-[14px] font-bold ${
                    isLight ? "border-slate-200 bg-slate-100 text-slate-900" : "border-slate-600 text-slate-200"
                  }`}
                >
                  關閉
                </button>
              </header>

              {baseline ? (
                <div
                  className={`mt-3 shrink-0 rounded-xl border px-2.5 py-2 ${
                    isLight ? "border-sky-200 bg-sky-50 text-sky-950" : "border-sky-500/35 bg-sky-500/10 text-sky-100"
                  }`}
                >
                  <p className="text-[14px] font-bold">➔ 你原本的年利率：{baselineRatePct.toFixed(2)}%</p>
                  <p className="mt-0.5 text-[16px] font-black tabular-nums leading-snug">
                    總繳利息：{formatInterestWan(baseline.totalInterest)} 萬（NT$ {formatMoney(baseline.totalInterest)}）
                  </p>
                </div>
              ) : null}

              <ul className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {rows
                  .filter((r) => !r.isBaseline)
                  .map((row) => (
                    <li
                      key={row.annualRatePct}
                      className={`w-full rounded-xl border px-2.5 py-2 ${
                        isLight
                          ? "border-amber-200/90 bg-amber-50/90 text-amber-950"
                          : "border-amber-500/40 bg-amber-500/10 text-amber-50"
                      }`}
                    >
                      <p className="text-[14px] font-black leading-snug">
                        🚨 如果利率變 {row.annualRatePct.toFixed(2)}%（差 {row.deltaPct}%）
                      </p>
                      <p className={`mt-1 text-[14px] font-semibold tabular-nums leading-snug ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                        總繳利息變成：{formatInterestWan(row.totalInterest)} 萬
                      </p>
                      <p className={`mt-1.5 text-[17px] font-black leading-snug ${isLight ? "text-red-600" : "text-red-300"}`}>
                        👉 你直接多送銀行：
                        <span className="whitespace-nowrap tabular-nums">【 {formatInterestWan(row.extraVsBaseline)} 萬 】</span>
                      </p>
                      {row.metaphor ? <p className="mt-1 text-[14px] font-bold leading-snug opacity-90">{row.metaphor}</p> : null}
                    </li>
                  ))}
              </ul>

              <p className={`mt-3 shrink-0 text-center text-[14px] leading-relaxed ${isLight ? "text-slate-500" : "text-slate-500"}`}>
                * 情境試算僅供教育；實際利率、費率與還款條件以契約與銀行為準。
              </p>
            </motion.div>
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  );
}
