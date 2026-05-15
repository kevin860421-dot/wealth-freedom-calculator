/**
 * 大計算機試算效能抽測（Node 主執行緒，模擬 worker 內計算量）
 * 執行：npx tsx scripts/benchmark-home-sim.ts
 */
import { performance } from "node:perf_hooks";
import {
  computeRequiredMonthlyToAchieveInYears,
  getPeriodSnapshots,
  serializeHeavySimPayload,
  simulate,
  targetPayoutPerPeriod,
  type HeavySimPayload,
} from "../lib/home-simulation-engine";

const payload: HeavySimPayload = {
  principalForCalc: 0,
  monthlyContributionNum: 12000,
  monthlyExtraNum: 6000,
  effectiveAnnualRate: 7.5,
  reinvestRatio: 80,
  payoutFrequency: "semiannual",
  targetQuarterIncomeNum: 50000,
  effectiveTaxRateForSim: 0.2,
  targetYearsNum: 20,
  targetYearsToAchieveEmpty: false,
  targetYearsToAchieveNum: 20,
  currentPrincipalNum: 0,
  sharePrice: 180,
  dividendMonths: [1, 4, 7, 10],
  initialYear: 2026,
  initialMonth: 3,
};

function bench(label: string, fn: () => void, rounds = 5): number {
  fn();
  const times: number[] = [];
  for (let i = 0; i < rounds; i++) {
    const t0 = performance.now();
    fn();
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)]!;
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  console.log(`${label.padEnd(28)} median ${median.toFixed(2)} ms  avg ${avg.toFixed(2)} ms`);
  return median;
}

const targetPerPeriod = targetPayoutPerPeriod(payload.targetQuarterIncomeNum, payload.payoutFrequency);

console.log("--- 單項（預設參數：月領 5 萬、20 年、半年領）---");
bench("simulate 40y", () =>
  simulate({
    initialPrincipal: payload.principalForCalc,
    monthlyContribution: payload.monthlyContributionNum,
    monthlyExtra: payload.monthlyExtraNum,
    annualReturnRate: payload.effectiveAnnualRate,
    reinvestRatio: payload.reinvestRatio,
    payoutFrequency: payload.payoutFrequency,
    targetPayoutPerPeriod: targetPerPeriod,
    taxRate: payload.effectiveTaxRateForSim,
  }),
);

bench("getPeriodSnapshots 20y", () =>
  getPeriodSnapshots(
    {
      initialPrincipal: payload.currentPrincipalNum,
      monthlyContribution: payload.monthlyContributionNum,
      monthlyExtra: payload.monthlyExtraNum,
      annualReturnRate: payload.effectiveAnnualRate,
      reinvestRatio: payload.reinvestRatio,
      payoutFrequency: payload.payoutFrequency,
      dividendMonths: payload.dividendMonths,
    },
    payload.sharePrice,
    20,
    payload.initialYear,
    payload.initialMonth,
  ),
);

const suggestMs = bench("建議月投入（二分搜尋）", () => computeRequiredMonthlyToAchieveInYears(payload));
const result = computeRequiredMonthlyToAchieveInYears(payload);
console.log(`  → 結果：${result != null ? result.toLocaleString("zh-TW") : "—"} 元/月\n`);

console.log("--- 整包 worker 等價（一次進入首頁）---");
const full = bench("full worker bundle", () => {
  const tp = targetPayoutPerPeriod(payload.targetQuarterIncomeNum, payload.payoutFrequency);
  simulate({
    initialPrincipal: payload.principalForCalc,
    monthlyContribution: payload.monthlyContributionNum,
    monthlyExtra: payload.monthlyExtraNum,
    annualReturnRate: payload.effectiveAnnualRate,
    reinvestRatio: payload.reinvestRatio,
    payoutFrequency: payload.payoutFrequency,
    targetPayoutPerPeriod: tp,
    taxRate: payload.effectiveTaxRateForSim,
  });
  simulate({
    initialPrincipal: payload.principalForCalc,
    monthlyContribution: payload.monthlyContributionNum,
    monthlyExtra: payload.monthlyExtraNum,
    annualReturnRate: payload.effectiveAnnualRate,
    reinvestRatio: payload.reinvestRatio,
    payoutFrequency: payload.payoutFrequency,
    targetPayoutPerPeriod: tp,
    maxMonths: payload.targetYearsNum * 12,
    taxRate: payload.effectiveTaxRateForSim,
  });
  getPeriodSnapshots(
    {
      initialPrincipal: payload.currentPrincipalNum,
      monthlyContribution: payload.monthlyContributionNum,
      monthlyExtra: payload.monthlyExtraNum,
      annualReturnRate: payload.effectiveAnnualRate,
      reinvestRatio: payload.reinvestRatio,
      payoutFrequency: payload.payoutFrequency,
      dividendMonths: payload.dividendMonths,
    },
    payload.sharePrice,
    20,
    payload.initialYear,
    payload.initialMonth,
  );
  computeRequiredMonthlyToAchieveInYears(payload);
});

console.log(`\nserialize payload: ${serializeHeavySimPayload(payload).length} chars`);
if (full > 0) {
  console.log(`建議月投約佔整包 ${((suggestMs / full) * 100).toFixed(0)}%（${suggestMs.toFixed(2)} / ${full.toFixed(2)} ms）`);
}
console.log("實際頁面：整包在 Web Worker 執行，主執行緒不應被此耗時卡住。");
console.log("優化前：進頁建議月投曾在主執行緒算 3 次；優化後：還原完成算 1 次（worker）。");
