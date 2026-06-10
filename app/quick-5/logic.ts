import { clampNum } from "@/lib/quick-calculator-math";

export function formatTwd(n: number) {
  const v = Math.round(Number.isFinite(n) ? n : 0);
  return v.toLocaleString("en-US");
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

export const INVEST_ANNUAL_PCT = 7;
export const MONEY_MIN = 0;
export const MONEY_MAX = 1_000_000;
export const YEARS_MIN = 1;
export const YEARS_MAX = 100;

export function commitMoney(raw: string, current: number) {
  const hasOps = /[+\-*/()]/.test(raw);
  const v = hasOps ? evalCalcInputToNumber(raw) : parseMoneyInputToInt(raw);
  return Math.round(clampNum(v ?? current, MONEY_MIN, MONEY_MAX) / 100) * 100;
}

export function commitYearsValue(raw: string, current: number) {
  const hasOps = /[+\-*/()]/.test(raw);
  const v = hasOps ? evalCalcInputToNumber(raw) : parseMoneyInputToInt(raw);
  return Math.round(clampNum(v ?? current, YEARS_MIN, YEARS_MAX));
}
