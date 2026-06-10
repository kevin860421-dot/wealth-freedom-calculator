import type { CSSProperties } from "react";
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

/** @deprecated 請用 useQuick10MarketIndex；保留作 SSR／離線預設 */
export const currentMarketIndex = 38_926;
export const historicalLowReference = 20000;
export const HOME_YEARS_MIN = 1;
export const HOME_YEARS_MAX = 100;

export function evalInput(raw: string, current: number, min: number, max: number, integer = false) {
  const hasOps = /[+\-*/()]/.test(raw);
  const plain = raw.replace(/,/g, "").trim();
  const parsed: number | null = hasOps ? evalCalcInputToNumber(raw) : plain === "" ? null : Number(plain);
  if (parsed === null || !Number.isFinite(parsed)) return current;
  const clamped = clampNum(parsed, min, max);
  return integer ? Math.round(clamped) : clamped;
}

export const inputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  flexShrink: 1,
  height: 40,
  borderRadius: 6,
  border: "1px solid rgb(71, 85, 105)",
  background: "#0b1220",
  color: "#f1f5f9",
  padding: "0 12px",
  outline: "none",
  fontSize: 18,
  fontWeight: 950,
  fontVariantNumeric: "tabular-nums",
  boxSizing: "border-box",
};

export const miniBtn: CSSProperties = {
  minWidth: 36,
  width: 36,
  height: 36,
  flexShrink: 0,
  padding: 0,
  boxSizing: "border-box",
  borderRadius: 9999,
  border: "1px solid rgb(71, 85, 105)",
  background: "rgb(30, 41, 59)",
  color: "#7dd3fc",
  fontSize: 18,
  fontWeight: 900,
  cursor: "pointer",
};
