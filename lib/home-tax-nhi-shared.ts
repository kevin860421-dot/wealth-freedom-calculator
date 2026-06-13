/** 與首頁「二代健保與稅金」試算區共用常數／公式（第 13 台小計算機） */

import type { CSSProperties } from "react";
export const TAX_THRESHOLD = 20000;
export const TAX_CREDIT_RATE = 0.085;
export const TAX_CREDIT_CAP = 80000;

export const TAX_BRACKETS = [
  { value: 0.05, label: "5% 年收 56萬以下", incomeLabel: "年收入 56萬以下" },
  { value: 0.12, label: "12% 年收 56～126萬", incomeLabel: "年收入 56～126萬" },
  { value: 0.2, label: "20% 年收 126～252萬", incomeLabel: "年收入 126～252萬" },
  { value: 0.3, label: "30% 年收 252～472萬", incomeLabel: "年收入 252～472萬" },
  { value: 0.4, label: "40% 年收 472萬以上", incomeLabel: "年收入 472萬以上" },
] as const;

export function getTaxBracketByIncomeWan(incomeWan: number): number {
  if (incomeWan < 56) return 0.05;
  if (incomeWan < 126) return 0.12;
  if (incomeWan < 252) return 0.2;
  if (incomeWan < 472) return 0.3;
  return 0.4;
}

export function parseFormula(s: string): number {
  if (s == null || typeof s !== "string") return 0;
  const t = String(s).trim().replace(/\s/g, "").replace(/,/g, "");
  if (t === "") return 0;
  if (!/^[\d+\-*/().]+$/.test(t)) return NaN;
  try {
    const v = new Function("return (" + t + ")")();
    return typeof v === "number" && !Number.isNaN(v) ? v : NaN;
  } catch {
    return NaN;
  }
}

export function commitFormula(s: string): string {
  const n = parseFormula(s.replace(/,/g, ""));
  if (typeof n === "number" && !Number.isNaN(n) && n >= 0) {
    return n % 1 === 0 ? String(Math.round(n)) : String(n);
  }
  return s;
}

export const QUICK13_INPUT_STYLE: CSSProperties = {
  backgroundColor: "rgba(0,0,0,0.4)",
  borderRadius: 6,
  border: "1px solid rgba(255,255,255,0.1)",
  padding: "4px 8px",
  fontSize: 11,
  color: "#e5e7eb",
  outline: "none",
};
