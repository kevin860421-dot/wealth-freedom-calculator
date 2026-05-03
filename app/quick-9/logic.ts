import type { CSSProperties } from "react";

export function formatTwd(n: number) {
  const v = Math.round(Number.isFinite(n) ? n : 0);
  return v.toLocaleString("en-US");
}

export function formatWan1(n: number) {
  const v = Math.round(Number.isFinite(n) ? n : 0);
  const wan = v / 10000;
  const s = wan.toFixed(1).replace(/\.0$/, "");
  return s;
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

export type SeriesPoint = { y: number; a: number; b: number };

export const miniBtn: CSSProperties = {
  flex: "0 0 44px",
  width: 44,
  height: 40,
  boxSizing: "border-box",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
  color: "#e8eefc",
  fontSize: 20,
  fontWeight: 900,
  cursor: "pointer",
};
