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

export const currentMarketIndex = 38926;
export const historicalLowReference = 20000;

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
  height: 44,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.20)",
  color: "#e8eefc",
  padding: "0 8px",
  outline: "none",
  fontSize: 18,
  fontWeight: 950,
  fontVariantNumeric: "tabular-nums",
  boxSizing: "border-box",
};

export const miniBtn: CSSProperties = {
  minWidth: 34,
  width: 34,
  height: 44,
  flexShrink: 0,
  padding: 0,
  boxSizing: "border-box",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
  color: "#e8eefc",
  fontSize: 18,
  fontWeight: 900,
  cursor: "pointer",
};
