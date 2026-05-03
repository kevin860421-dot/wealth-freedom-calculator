import { clampNum, futureValueMonthlyContribution } from "@/lib/quick-calculator-math";

/** 與 quick-8：固定錨點年分 + 目前預計年 */
export function quickChartYearTicks(horizonYears: number): number[] {
  const cap = Math.min(50, Math.max(1, Math.round(horizonYears)));
  const ys = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
  const set = new Set<number>();
  for (const y of ys) {
    if (y <= cap) set.add(y);
  }
  set.add(cap);
  return Array.from(set).sort((a, b) => a - b);
}

/** 左線：僅累積投入；右線：月複利期末（與小計算機共用假設） */
export function buildPrincipalVsCompoundSeries(
  monthly: number,
  annualPct: number,
  horizonYears: number,
): { ticks: number[]; principal: number[]; compound: number[] } {
  const ticks = quickChartYearTicks(horizonYears);
  const m = Math.max(0, monthly);
  const p = clampNum(annualPct, 0, 99);
  const principal = ticks.map((y) => Math.round(m * 12 * y));
  const compound = ticks.map((y) => Math.round(futureValueMonthlyContribution(m, p, y)));
  return { ticks, principal, compound };
}
