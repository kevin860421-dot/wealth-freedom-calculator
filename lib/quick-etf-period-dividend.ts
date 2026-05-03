import type { TickerFrequency, TickerPreset } from "../app/ticker-presets";
import { clampNum } from "@/lib/quick-calculator-math";
import { getAfterTaxAndNhi2WithRate, getBuyFee } from "@/lib/table-calculator";

/** 無 dividendMonths 時，對齊大計算機預設：視為每月可配 */
export function fallbackDividendMonths(frequency: TickerFrequency): number[] {
  void frequency;
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
}

export function resolveDividendMonths(preset: TickerPreset): number[] {
  if (preset.dividendMonths?.length) return preset.dividendMonths;
  return fallbackDividendMonths(preset.frequency);
}

export type QuickEtfPeriodResult = {
  nth: number;
  calYear: number;
  calMonth: number;
  /** 該月發放之粗估殖息金額（與大計算機同口徑：應稅、健保、手續費） */
  grossDividend: number;
  afterTaxDividend: number;
  taxableDividend54c: number;
  taxAmount: number;
  nhi2Amount: number;
  reinvestAfterFee: number;
  reinvestFee: number;
  contributionAfterFee: number;
  contributionFee: number;
  balanceEnd: number;
};

/**
 * 第 n 次投入 = 第 n 個月（自開始年月起算）。
 * 複利：配息月依「距上次配息月數」攤提年化報酬；非配息月股利為 0。
 */
export function quickEtfNthMonthSnapshot(
  monthlyInvest: number,
  annualReturnPct: number,
  dividendMonths: number[],
  startYear: number,
  startMonth: number,
  periodNth: number,
  ratio54cPct: number = 100,
  taxBracketRate: number = 0.2,
  reinvestRatioPct: number = 100,
): QuickEtfPeriodResult {
  const monthsTotal = Math.max(1, Math.trunc(periodNth));
  const annualRate = clampNum(annualReturnPct, 0, 99) / 100;
  const monthlyAdd = Math.max(0, monthlyInvest);
  const contributionFee = getBuyFee(monthlyAdd);
  const monthlyAddAfterFee = Math.max(0, monthlyAdd - contributionFee);
  const periodsPerYear = Math.max(1, dividendMonths.length || 1);
  const ratio54c = clampNum(ratio54cPct, 0, 100) / 100;
  const reinvestRatio = clampNum(reinvestRatioPct, 0, 100) / 100;
  let balance = 0;
  let lastDividendMonthIndex = -1;

  let out: QuickEtfPeriodResult = {
    nth: 1,
    calYear: startYear,
    calMonth: startMonth,
    grossDividend: 0,
    afterTaxDividend: 0,
    taxableDividend54c: 0,
    taxAmount: 0,
    nhi2Amount: 0,
    reinvestAfterFee: 0,
    reinvestFee: 0,
    contributionAfterFee: Math.round(monthlyAddAfterFee),
    contributionFee: Math.round(contributionFee),
    balanceEnd: 0,
  };

  for (let monthIndex = 0; monthIndex < monthsTotal; monthIndex++) {
    const calMonth = ((startMonth - 1 + monthIndex) % 12) + 1;
    const calYear = startYear + Math.floor((startMonth - 1 + monthIndex) / 12);
    balance += monthlyAddAfterFee;

    let gross = 0;
    let afterTax = 0;
    let taxable54c = 0;
    let tax = 0;
    let nhi2 = 0;
    let reinvestFee = 0;
    let reinvestAfterFee = 0;
    if (dividendMonths.length > 0 && dividendMonths.includes(calMonth)) {
      const monthsSinceLast = lastDividendMonthIndex < 0 ? monthIndex + 1 : monthIndex - lastDividendMonthIndex;
      const periodRateForMonths = annualRate * (monthsSinceLast / 12);
      gross = balance * periodRateForMonths;
      const taxPack = getAfterTaxAndNhi2WithRate(
        gross,
        taxBracketRate,
        true,
        periodsPerYear,
        true,
        ratio54c,
      );
      afterTax = taxPack.net;
      taxable54c = taxPack.taxableBase;
      tax = taxPack.tax;
      nhi2 = taxPack.nhi2;
      const reinvestRaw = Math.max(0, afterTax * reinvestRatio);
      reinvestFee = getBuyFee(reinvestRaw);
      reinvestAfterFee = Math.max(0, reinvestRaw - reinvestFee);
      balance += reinvestAfterFee;
      lastDividendMonthIndex = monthIndex;
    }

    if (monthIndex === monthsTotal - 1) {
      out = {
        nth: monthIndex + 1,
        calYear,
        calMonth,
        grossDividend: Math.round(gross),
        afterTaxDividend: Math.round(afterTax),
        taxableDividend54c: Math.round(taxable54c),
        taxAmount: Math.round(tax),
        nhi2Amount: Math.round(nhi2),
        reinvestAfterFee: Math.round(reinvestAfterFee),
        reinvestFee: Math.round(reinvestFee),
        contributionAfterFee: Math.round(monthlyAddAfterFee),
        contributionFee: Math.round(contributionFee),
        balanceEnd: Math.round(balance),
      };
    }
  }

  return out;
}
