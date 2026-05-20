import { buildLoanSchedules, formatMoney, type LoanMethod } from "./logic";

/** 大對決最高試到年利率 15%（含） */
export const RATE_SHOWDOWN_MAX_ANNUAL_PCT = 15;
/** 每 0.5% 一檔（基準除外） */
export const RATE_SHOWDOWN_STEP_PCT = 0.5;

export type RateShowdownRow = {
  annualRatePct: number;
  deltaPct: number;
  totalInterest: number;
  extraVsBaseline: number;
  metaphor: string | null;
  isBaseline: boolean;
};

export function buildRateShowdownDeltas(baselineAnnualRatePct: number): number[] {
  const deltas: number[] = [0];
  let rate = baselineAnnualRatePct;
  while (true) {
    rate = Number((rate + RATE_SHOWDOWN_STEP_PCT).toFixed(2));
    if (rate > RATE_SHOWDOWN_MAX_ANNUAL_PCT) break;
    deltas.push(Number((rate - baselineAnnualRatePct).toFixed(2)));
  }
  return deltas;
}

/** 依「比基準多繳」金額（萬）回傳情境比喻；門檻為示意，供教育用途 */
export function interestMetaphor(extraWan: number, deltaPct: number): string | null {
  if (deltaPct <= 0) return null;
  if (extraWan >= 1000) return "😱 多送出去快抵上一間房全價";
  if (extraWan >= 850) return "😱 堪比北市小宅首期";
  if (extraWan >= 600) return "😱 超過中南部一棟房子首期";
  if (extraWan >= 450) return "😱 接近中南部一棟房子首期";
  if (extraWan >= 200) return "💸 可以買一台賓士";
  if (extraWan >= 80) return "⚠️ 多出一台國產車";
  if (extraWan >= 30) return "📌 等於多年薪水縮水";
  return "利率看似小差，利息會放大";
}

export function totalInterestForMethod(
  loanAmount: number,
  annualRatePct: number,
  loanYears: number,
  method: LoanMethod,
): number {
  const out = buildLoanSchedules(loanAmount, annualRatePct, loanYears);
  return method === "annuity" ? out.annuityTotalInterest : out.equalPrincipalTotalInterest;
}

export function buildRateShowdownRows(
  loanAmount: number,
  loanYears: number,
  baselineAnnualRatePct: number,
  method: LoanMethod,
): RateShowdownRow[] {
  const baselineInterest = totalInterestForMethod(loanAmount, baselineAnnualRatePct, loanYears, method);
  const deltas = buildRateShowdownDeltas(baselineAnnualRatePct);

  return deltas.map((delta) => {
    const annualRatePct = Number((baselineAnnualRatePct + delta).toFixed(2));
    const totalInterest = totalInterestForMethod(loanAmount, annualRatePct, loanYears, method);
    const extraVsBaseline = Math.max(0, Math.round(totalInterest - baselineInterest));
    const extraWan = extraVsBaseline / 10_000;
    return {
      annualRatePct,
      deltaPct: delta,
      totalInterest: Math.round(totalInterest),
      extraVsBaseline,
      metaphor: interestMetaphor(extraWan, delta),
      isBaseline: delta === 0,
    };
  });
}

export function formatInterestWan(n: number): string {
  const wan = Math.round(n / 10_000);
  return wan.toLocaleString("zh-TW");
}

export { formatMoney };
