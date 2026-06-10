import type { CSSProperties } from "react";
import { clampNum, fvMonthly } from "@/lib/quick-calculator-math";

export function formatTwd(n: number) {
  const v = Math.round(Number.isFinite(n) ? n : 0);
  return v.toLocaleString("en-US");
}

/** 額度不大於萬時顯示「元」，否則「萬」 */
export function formatSmartUnit(n: number) {
  const v = Math.round(Number.isFinite(n) ? n : 0);
  if (v < 10000) return `${v.toLocaleString("en-US")} 元`;
  const wan = (v / 10000).toFixed(1).replace(/\.0$/, "");
  return `${wan} 萬`;
}

export function sanitizeCalcInput(s: string) {
  return s.replace(/[^\d+\-*/().,%\s]/g, "");
}

export function evalCalcInputToNumber(s: string): number | null {
  try {
    const cleaned = s.replace(/,/g, "").trim();
    if (!cleaned) return null;
    if (/[^0-9+\-*/().%\s]/.test(cleaned)) return null;
    const expr = cleaned.replace(/(\d+(?:\.\d+)?)\s*%/g, "($1/100)");
    // eslint-disable-next-line no-new-func
    const v = Function(`"use strict"; return (${expr});`)();
    const num = Number(v);
    if (!Number.isFinite(num)) return null;
    return num;
  } catch {
    return null;
  }
}

export function parseMoneyInputToInt(s: string): number | null {
  const cleaned = s.replace(/,/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

/** 房貸端：月繳 M 中轉為「自有／本金累積」之示意比例（非房價漲跌） */
export const MORTGAGE_EQUITY_SHARE = 0.55;

export const MONEY_MIN = 0;
export const MONEY_MAX = 1_000_000;
export const YEARS_MIN = 1;
export const YEARS_MAX = 100;
export const INVEST_ANNUAL_PCT = 7;

export const MILESTONE_YEARS = [1, 5, 10, 20, 30, 40] as const;

/**
 * 房貸 path：繳款期 1..N 年為本金累積示意；第 N 年結清後「累積示意＋每月 M」全數依複利滾入股市（與第七台車貸邏輯一致）。
 */
export function mortgageVsStockPath(
  monthly: number,
  mortgageYears: number,
  calendarYears: number,
  equityShare: number,
  annualPct: number,
): number {
  const m = Math.max(0, monthly);
  const N = Math.round(clampNum(mortgageYears, YEARS_MIN, YEARS_MAX));
  const y = Math.max(0, calendarYears);
  if (y <= N) {
    return Math.round(m * 12 * y * equityShare);
  }
  const lumpAtEnd = Math.round(m * 12 * N * equityShare);
  const investYears = y - N;
  const months = Math.max(0, Math.round(investYears * 12));
  return Math.round(
    fvMonthly({
      annualReturnPct: annualPct,
      months,
      initial: lumpAtEnd,
      monthlyContribution: m,
    }),
  );
}

export const pillBtn: CSSProperties = {
  flex: "0 0 44px",
  width: 44,
  height: 44,
  boxSizing: "border-box",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
  color: "#e8eefc",
  fontSize: 20,
  fontWeight: 900,
  cursor: "pointer",
};

export const yearBtn: CSSProperties = {
  flex: "0 0 44px",
  width: 44,
  height: 44,
  boxSizing: "border-box",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
  color: "#e8eefc",
  fontSize: 20,
  fontWeight: 900,
  cursor: "pointer",
};

export const rangeStyle: CSSProperties = {
  display: "block",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  marginTop: 6,
  height: 28,
  accentColor: "#3b82f6",
};
