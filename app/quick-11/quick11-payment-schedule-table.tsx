"use client";

import { formatMoney, type LoanMethod, type PaymentRow } from "./logic";

type Props = {
  rows: PaymentRow[];
  method: LoanMethod;
  isLight?: boolean;
  maxHeightClass?: string;
  /** 精簡版（首頁展開）不顯示方法標籤列 */
  compact?: boolean;
};

const TABLE_BORDER_LIGHT = "border-slate-200";
const TABLE_HEAD_LIGHT = "bg-[#F8FAFC] text-[#4A5568]";

export function Quick11PaymentScheduleTable(props: Props) {
  const { rows, method, isLight = false, maxHeightClass = "max-h-[280px]", compact = false } = props;
  const methodLabel = method === "annuity" ? "本息均攤" : "本金平均";

  if (rows.length === 0) {
    return (
      <p className={`rounded-lg border px-3 py-2 text-[12px] ${isLight ? "border-slate-200 text-slate-500" : "border-slate-700 text-slate-400"}`}>
        尚無攤還資料
      </p>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-lg border ${isLight ? "border-slate-200 bg-white" : "border-slate-700 bg-slate-950/70"}`}
    >
      {!compact ? (
        <div
          className={`flex items-center justify-between gap-2 border-b px-3 py-2 ${isLight ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-slate-900/80"}`}
        >
          <p className={`text-[12px] font-bold ${isLight ? "text-slate-800" : "text-slate-200"}`}>每期繳款明細</p>
          <span
            className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${isLight ? "bg-sky-100 text-sky-800" : "bg-sky-500/20 text-sky-200"}`}
          >
            {methodLabel}
          </span>
        </div>
      ) : null}
      <div className={`overflow-auto ${maxHeightClass}`}>
        <table className="w-full min-w-[520px] table-auto text-left text-[13px]">
          <thead className={isLight ? `sticky top-0 ${TABLE_HEAD_LIGHT}` : "sticky top-0 bg-slate-900"}>
            <tr className={`border-b ${isLight ? `${TABLE_BORDER_LIGHT} text-slate-600` : "border-slate-700 text-slate-300"}`}>
              <th className="whitespace-nowrap px-2.5 py-2 font-bold">期數</th>
              <th className="whitespace-nowrap px-2.5 py-2 font-bold">每期還款</th>
              <th className="whitespace-nowrap px-2.5 py-2 font-bold">每期利息</th>
              <th className="whitespace-nowrap px-2.5 py-2 font-bold">每期本金</th>
              <th className="whitespace-nowrap px-2.5 py-2 font-bold">剩餘本金</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const isFirst = row.period === 1;
              return (
                <tr
                  key={`schedule-${row.period}`}
                  className={`border-b ${
                    isLight
                      ? `${TABLE_BORDER_LIGHT} ${idx % 2 === 0 ? "bg-white" : "bg-[#F8FAFC]"} text-slate-800`
                      : `border-slate-800 ${idx % 2 === 0 ? "bg-slate-950/80" : "bg-slate-900/55"} text-slate-200`
                  }`}
                >
                  <td className="whitespace-nowrap px-2.5 py-2.5 font-semibold">
                    {row.period}
                    {isFirst && method === "equalPrincipal" ? (
                      <span
                        className={`ml-1 rounded px-1 py-0.5 text-[9px] font-bold ${isLight ? "bg-amber-100 text-amber-800" : "bg-amber-400/20 text-amber-200"}`}
                      >
                        首月
                      </span>
                    ) : null}
                  </td>
                  <td
                    className={`whitespace-nowrap px-2.5 py-2.5 font-bold tabular-nums ${
                      isFirst ? (isLight ? "text-sky-800" : "text-sky-200") : ""
                    }`}
                  >
                    {formatMoney(row.payment)}
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-2.5 tabular-nums">{formatMoney(row.interest)}</td>
                  <td className="whitespace-nowrap px-2.5 py-2.5 tabular-nums">{formatMoney(row.principal)}</td>
                  <td className="whitespace-nowrap px-2.5 py-2.5 tabular-nums">{formatMoney(row.balance)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
