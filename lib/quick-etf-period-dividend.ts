import type { TickerFrequency, TickerPreset } from "../app/ticker-presets";
import { clampNum } from "@/lib/quick-calculator-math";

/** 無 dividendMonths 時依頻率給示意配息月 */
export function fallbackDividendMonths(frequency: TickerFrequency): number[] {
  switch (frequency) {
    case "month":
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    case "quarter":
      return [1, 4, 7, 10];
    case "semiannual":
      return [1, 7];
    case "year":
      return [12];
    default:
      return [1, 7];
  }
}

export function resolveDividendMonths(preset: TickerPreset): number[] {
  if (preset.dividendMonths?.length) return preset.dividendMonths;
  return fallbackDividendMonths(preset.frequency);
}

export type QuickEtfPeriodResult = {
  calYear: number;
  calMonth: number;
  /** 該月發放之粗估殖息金額（與首頁 getPeriodSnapshots 無費用簡化版：全數再投入） */
  grossDividend: number;
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
): QuickEtfPeriodResult {
  const monthsTotal = Math.max(1, Math.trunc(periodNth));
  const annualRate = clampNum(annualReturnPct, 0, 99) / 100;
  let balance = 0;
  let lastDividendMonthIndex = -1;

  let out: QuickEtfPeriodResult = {
    calYear: startYear,
    calMonth: startMonth,
    grossDividend: 0,
    balanceEnd: 0,
  };

  for (let monthIndex = 0; monthIndex < monthsTotal; monthIndex++) {
    const calMonth = ((startMonth - 1 + monthIndex) % 12) + 1;
    const calYear = startYear + Math.floor((startMonth - 1 + monthIndex) / 12);
    balance += Math.max(0, monthlyInvest);

    let gross = 0;
    if (dividendMonths.length > 0 && dividendMonths.includes(calMonth)) {
      const monthsSinceLast = lastDividendMonthIndex < 0 ? monthIndex + 1 : monthIndex - lastDividendMonthIndex;
      const periodRateForMonths = annualRate * (monthsSinceLast / 12);
      gross = balance * periodRateForMonths;
      balance += gross;
      lastDividendMonthIndex = monthIndex;
    }

    if (monthIndex === monthsTotal - 1) {
      out = {
        calYear,
        calMonth,
        grossDividend: Math.round(gross),
        balanceEnd: Math.round(balance),
      };
    }
  }

  return out;
}
