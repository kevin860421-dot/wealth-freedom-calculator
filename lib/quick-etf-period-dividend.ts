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

/** 依期末資產與配息頻率，粗估「接下來 12 個月」稅後股息總額（非配息月也顯示，避免可月領為 0 的挫折感） */
export function quickEtfEstimatedAnnualDividend(
  balanceEnd: number,
  annualReturnPct: number,
  dividendMonths: number[],
  ratio54cPct: number = 100,
  taxBracketRate: number = 0.2,
): { annualGross: number; afterTaxAnnual: number; avgMonthlyAfterTax: number } {
  const balance = Math.max(0, balanceEnd);
  if (balance <= 0) {
    return { annualGross: 0, afterTaxAnnual: 0, avgMonthlyAfterTax: 0 };
  }

  const annualRate = clampNum(annualReturnPct, 0, 99) / 100;
  const periodsPerYear = Math.max(1, dividendMonths.length || 1);
  const monthsPerPeriod = 12 / periodsPerYear;
  const ratio54c = clampNum(ratio54cPct, 0, 100) / 100;

  let annualGross = 0;
  let afterTaxAnnual = 0;
  for (let i = 0; i < periodsPerYear; i++) {
    const periodGross = balance * annualRate * (monthsPerPeriod / 12);
    const taxPack = getAfterTaxAndNhi2WithRate(
      periodGross,
      taxBracketRate,
      true,
      periodsPerYear,
      true,
      ratio54c,
    );
    annualGross += periodGross;
    afterTaxAnnual += taxPack.net;
  }

  const afterTaxRounded = Math.round(afterTaxAnnual);
  return {
    annualGross: Math.round(annualGross),
    afterTaxAnnual: afterTaxRounded,
    avgMonthlyAfterTax: Math.round(afterTaxRounded / 12),
  };
}


function simulateYearEndBalances(
  monthlyInvest: number,
  annualReturnPct: number,
  dividendMonths: number[],
  _startYear: number,
  startMonth: number,
  maxYears: number,
  ratio54cPct: number,
  reinvestRatioPct: number,
): number[] {
  const yearCount = Math.max(1, Math.trunc(maxYears));
  const annualRate = clampNum(annualReturnPct, 0, 99) / 100;
  const monthlyAdd = Math.max(0, monthlyInvest);
  const contributionFee = getBuyFee(monthlyAdd);
  const monthlyAddAfterFee = Math.max(0, monthlyAdd - contributionFee);
  const periodsPerYear = Math.max(1, dividendMonths.length || 1);
  const ratio54c = clampNum(ratio54cPct, 0, 100) / 100;
  const reinvestRatio = clampNum(reinvestRatioPct, 0, 100) / 100;
  const monthsTotal = yearCount * 12;
  const yearEnds: number[] = [];
  let balance = 0;
  let lastDividendMonthIndex = -1;

  for (let monthIndex = 0; monthIndex < monthsTotal; monthIndex++) {
    const calMonth = ((startMonth - 1 + monthIndex) % 12) + 1;
    balance += monthlyAddAfterFee;

    if (dividendMonths.length > 0 && dividendMonths.includes(calMonth)) {
      const monthsSinceLast = lastDividendMonthIndex < 0 ? monthIndex + 1 : monthIndex - lastDividendMonthIndex;
      const periodRateForMonths = annualRate * (monthsSinceLast / 12);
      const gross = balance * periodRateForMonths;
      const taxPack = getAfterTaxAndNhi2WithRate(gross, 0.2, true, periodsPerYear, true, ratio54c);
      const reinvestRaw = Math.max(0, taxPack.net * reinvestRatio);
      const reinvestFee = getBuyFee(reinvestRaw);
      balance += Math.max(0, reinvestRaw - reinvestFee);
      lastDividendMonthIndex = monthIndex;
    }

    if ((monthIndex + 1) % 12 === 0) {
      yearEnds.push(Math.round(balance));
    }
  }

  return yearEnds;
}

/** 每年末總資產曲線（領息領走 vs 股息再投入對照） */
export function quickEtfAssetGrowthMilestones(
  monthlyInvest: number,
  annualReturnPct: number,
  dividendMonths: number[],
  startYear: number,
  startMonth: number,
  maxYears: number,
  ratio54cPct: number = 100,
): {
  years: number[];
  cashOutSeries: number[];
  dripSeries: number[];
} {
  const yearCount = Math.max(1, Math.trunc(maxYears));
  const years = Array.from({ length: yearCount }, (_, i) => i + 1);
  const cashOutSeries = simulateYearEndBalances(
    monthlyInvest,
    annualReturnPct,
    dividendMonths,
    startYear,
    startMonth,
    yearCount,
    ratio54cPct,
    0,
  );
  const dripSeries = simulateYearEndBalances(
    monthlyInvest,
    annualReturnPct,
    dividendMonths,
    startYear,
    startMonth,
    yearCount,
    ratio54cPct,
    100,
  );

  return { years, cashOutSeries, dripSeries };
}
