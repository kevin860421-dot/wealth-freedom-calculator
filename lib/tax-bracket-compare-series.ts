import { mergeTaxOnePayout } from "./dividend-tax-sandbox";

/** 季配 4 次／年，與文章互動區預設一致 */
const PERIODS_PER_YEAR = 4;

export type BracketComparePoint = {
  gross: number;
  netMarginal5: number;
  netMarginal12: number;
  taxMarginal5: number;
  taxMarginal12: number;
  /** 實拿差距（5% 情境 − 12% 情境），正表示低邊際稅率較有利 */
  netAdvantage5Over12: number;
};

/**
 * 合併課稅下，邊際 5% vs 12% 的試算曲線（含 8.5% 抵減、二代健保）。
 */
export function buildBracketCompareSeries(
  grossSteps: number[],
  options: { useCredit?: boolean; applyNhi2?: boolean } = {}
): BracketComparePoint[] {
  const useCredit = options.useCredit ?? true;
  const applyNhi2 = options.applyNhi2 ?? true;

  return grossSteps.map((gross) => {
    const m5 = mergeTaxOnePayout(gross, 0.05, useCredit, applyNhi2, PERIODS_PER_YEAR);
    const m12 = mergeTaxOnePayout(gross, 0.12, useCredit, applyNhi2, PERIODS_PER_YEAR);
    return {
      gross,
      netMarginal5: m5.net,
      netMarginal12: m12.net,
      taxMarginal5: m5.tax,
      taxMarginal12: m12.tax,
      netAdvantage5Over12: m5.net - m12.net,
    };
  });
}

/** 預設用於圖表：5 萬～50 萬，每 5 萬一點 */
export const DEFAULT_GROSS_STEPS = [50_000, 100_000, 150_000, 200_000, 250_000, 300_000, 350_000, 400_000, 450_000, 500_000];
