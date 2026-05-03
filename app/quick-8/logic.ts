import { createElement, Fragment, type CSSProperties, type ReactNode } from "react";

export function formatTwd(n: number) {
  const v = Math.round(Number.isFinite(n) ? n : 0);
  return v.toLocaleString("en-US");
}

// 小額顯示「元」，大額顯示「萬」（保留 1 位小數）
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

export const INSTALLMENT_TIPS = [
  "⚠️ 原來月付 {monthlyInstallment}，最後代價是 {deltaMoney}",
  "💸 這筆分期現在爽一下，未來少賺 {deltaMoney}",
  "📉 每月這點分期，默默吃掉你未來 {deltaMoney}",
  "⏳ 分期不是沒錢，是偷走未來的錢",
  "🚀 如果拿去投資，這筆錢可能變成 {deltaMoney}",
] as const;

export const TIP_FONT_MAX_PX = 24;
export const TIP_FONT_MIN_PX = 8;

/** 數字比主文略大（約 1～2 級），月付與代價分色 */
const TIP_NUMBER_SHARED: CSSProperties = {
  fontSize: "calc(1em + 3px)",
  fontWeight: 900,
  verticalAlign: "baseline",
  wordBreak: "normal",
  overflowWrap: "break-word",
};

const TIP_INSTALLMENT_SPAN_STYLE: CSSProperties = {
  ...TIP_NUMBER_SHARED,
  color: "rgba(252, 211, 77, 0.96)",
};

const TIP_DELTA_SPAN_STYLE: CSSProperties = {
  ...TIP_NUMBER_SHARED,
  color: "rgba(106, 165, 184, 0.98)",
};

export function buildInstallmentTipContent(templateIndex: number, monthlyInstallment: number, deltaYuan: number): ReactNode {
  if (monthlyInstallment <= 0) {
    return "🔥 目前沒有分期負擔，你的資產正在加速成長";
  }
  const template = INSTALLMENT_TIPS[templateIndex] ?? INSTALLMENT_TIPS[0];
  const inst = formatTwd(monthlyInstallment);
  const del = formatSmartUnit(deltaYuan);
  const parts: ReactNode[] = [];
  let rest: string = template;
  let k = 0;
  while (rest.length > 0) {
    const mi = rest.indexOf("{monthlyInstallment}");
    const dm = rest.indexOf("{deltaMoney}");
    if (mi === -1 && dm === -1) {
      parts.push(rest);
      break;
    }
    const useMi = mi >= 0 && (dm === -1 || mi <= dm);
    const idx = useMi ? mi : dm;
    const token = useMi ? "{monthlyInstallment}" : "{deltaMoney}";
    if (idx > 0) parts.push(rest.slice(0, idx));
    const amountStyle = useMi ? TIP_INSTALLMENT_SPAN_STYLE : TIP_DELTA_SPAN_STYLE;
    parts.push(createElement("span", { key: `tip-amt-${k++}`, style: amountStyle }, useMi ? inst : del));
    rest = rest.slice(idx + token.length);
  }
  return createElement(Fragment, null, ...parts);
}

/** 在 nowrap 下找出最大可塞進寬度的字級；仍塞不下則改為換行 + 最小字 */
export function measureTipFitPx(el: HTMLElement): { px: number; wrap: boolean } {
  const avail = el.clientWidth;
  if (avail < 4) return { px: TIP_FONT_MAX_PX, wrap: false };

  el.style.whiteSpace = "nowrap";
  let lo = TIP_FONT_MIN_PX;
  let hi = TIP_FONT_MAX_PX;
  let ans = TIP_FONT_MIN_PX;
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    el.style.fontSize = `${mid}px`;
    if (el.scrollWidth <= avail + 1) {
      ans = mid;
      lo = mid + 0.02;
    } else {
      hi = mid - 0.02;
    }
  }
  el.style.fontSize = `${ans}px`;
  while (ans > TIP_FONT_MIN_PX && el.scrollWidth > avail + 1) {
    ans -= 0.5;
    el.style.fontSize = `${ans}px`;
  }
  if (el.scrollWidth <= avail + 1) {
    el.style.removeProperty("font-size");
    el.style.removeProperty("white-space");
    return { px: Math.round(ans * 10) / 10, wrap: false };
  }
  el.style.whiteSpace = "normal";
  el.style.fontSize = `${TIP_FONT_MIN_PX}px`;
  el.style.removeProperty("font-size");
  el.style.removeProperty("white-space");
  return { px: TIP_FONT_MIN_PX, wrap: true };
}
