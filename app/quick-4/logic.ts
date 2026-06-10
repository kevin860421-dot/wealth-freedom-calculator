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

export const MONEY_MIN = 0;
export const MONEY_MAX = 1_000_000;
export const YEARS_MIN = 1;
export const YEARS_MAX = 100;
export const YEAR_MIN = 2000;
export const YEAR_MAX = 2100;

export const DEFAULT_START_YEAR = 2026;
export const DEFAULT_START_MONTH = 3;

export function commitMoneyFromRaw(raw: string, current: number) {
  const hasOps = /[+\-*/()]/.test(raw);
  const v = hasOps ? evalCalcInputToNumber(raw) : parseMoneyInputToInt(raw);
  return Math.round(clampNum(v ?? current, MONEY_MIN, MONEY_MAX) / 100) * 100;
}

export function commitYearsFromRaw(raw: string, current: number) {
  const trimmed = raw.replace(/,/g, "").trim();
  if (!trimmed) return current;
  const hasOps = /[+\-*/()]/.test(raw);
  const parsed = hasOps ? evalCalcInputToNumber(raw) : Number(trimmed);
  if (parsed === null || !Number.isFinite(parsed)) return current;
  return Math.round(clampNum(parsed, YEARS_MIN, YEARS_MAX));
}

export function parseYearMonth(
  yStr: string | null,
  mStr: string | null,
  fallbackY: number,
  fallbackM: number,
) {
  let yy = fallbackY;
  let mm = fallbackM;
  if (yStr != null) {
    const v = Number(yStr);
    if (Number.isFinite(v)) yy = Math.round(clampNum(v, YEAR_MIN, YEAR_MAX));
  }
  if (mStr != null) {
    const v = Number(mStr);
    if (Number.isFinite(v)) mm = Math.round(clampNum(v, 1, 12));
  }
  return { yy, mm };
}

export function shiftCalendar(year: number, month: number, deltaMonth: number) {
  const d = new Date(year, month - 1 + deltaMonth, 1);
  let y = d.getFullYear();
  let m = d.getMonth() + 1;
  y = Math.round(clampNum(y, YEAR_MIN, YEAR_MAX));
  m = Math.round(clampNum(m, 1, 12));
  return { y, m };
}
