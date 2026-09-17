/** 綜所稅分開／合併示意用；配息入帳不就源扣繳所得稅。 */
export const AFTER_TAX_RANK_TAX_SEPARATE = 0.28;
export const AFTER_TAX_RANK_NHI_RATE = 0.0211;
export const AFTER_TAX_RANK_NHI_THRESHOLD = 20_000;
export const AFTER_TAX_RANK_WIRE_FEE = 10;
export const AFTER_TAX_RANK_FEE_PER_LOT = 15;
export const AFTER_TAX_RANK_TARGET_ANNUAL = 120_000;

export type AfterTaxRankFreq = "月" | "季" | "半年" | "年";

export type AfterTaxRankSnapshotRow = {
  ticker: string;
  name: string;
  price: number;
  lastCashPerUnit: number;
  stockDivPerUnit: number;
  ttmCashPerUnit: number;
  ttmComplete: boolean;
  ttmNote: string;
  freq: AfterTaxRankFreq;
  exDate: string;
  lastBuy: string;
  payDate: string;
  /** 近 12 個月（或已除息期數）每期現金配息；主榜以中位數回推。 */
  recentCashPayouts?: number[];
};

export type AfterTaxRankDerived = AfterTaxRankSnapshotRow & {
  lots: number;
  capital: number;
  /** 該期現金股息毛額（張數×每股股息×1000） */
  grossDividend: number;
  wireFee: number;
  nhi: number;
  fee: number;
  /** 該期實領目標（月1萬／季3萬／半年6萬／年12萬） */
  net: number;
  rank: number;
};

export function payoutsPerYear(freq: AfterTaxRankFreq): number {
  switch (freq) {
    case "月":
      return 12;
    case "季":
      return 4;
    case "半年":
      return 2;
    case "年":
      return 1;
  }
}

/** 依頻率鎖定「該期」實領目標（平均月領 1 萬）。 */
export function perPeriodNetTarget(freq: AfterTaxRankFreq): number {
  switch (freq) {
    case "月":
      return 10_000;
    case "季":
      return 30_000;
    case "半年":
      return 60_000;
    case "年":
      return 120_000;
  }
}

export function getMedian(values: number[]): number {
  const arr = values.filter((n) => Number.isFinite(n) && n > 0);
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** 主榜用：近 12 個月（或可得期數）每期現金配息樣本。 */
export function recentCashPayoutSamplesForRow(
  row: AfterTaxRankSnapshotRow,
): number[] {
  if (row.recentCashPayouts?.length) {
    return row.recentCashPayouts.filter((n) => Number.isFinite(n) && n > 0);
  }
  const py = payoutsPerYear(row.freq);
  if (row.ttmComplete && py > 0 && row.ttmCashPerUnit > 0) {
    const per = row.ttmCashPerUnit / py;
    return Array.from({ length: py }, () => per);
  }
  if (row.lastCashPerUnit > 0) return [row.lastCashPerUnit];
  return [];
}

export function medianDividendPerShareForPeriod(
  row: AfterTaxRankSnapshotRow,
): number {
  return getMedian(recentCashPayoutSamplesForRow(row));
}

export function dividendPerShareForPeriod(
  row: AfterTaxRankSnapshotRow,
  basis: "ttm" | "last",
): number {
  if (basis === "last") return row.lastCashPerUnit;
  const median = medianDividendPerShareForPeriod(row);
  if (median > 0) return median;
  return row.lastCashPerUnit;
}

/**
 * 由實領目標逆推張數：匯費 10 元；手續費＝ceil(張數×15)；二代健保就源 2.11%（毛額≥2萬）。
 * 不扣繳綜合所得稅。
 */
export function solveLotsForPeriodNet(
  dividendPerShare: number,
  targetNet: number,
): { lots: number; grossDividend: number; nhi: number; fee: number } {
  const grossPerLot = dividendPerShare * 1000;
  if (grossPerLot <= 0 || targetNet <= 0) {
    return { lots: 0, grossDividend: 0, nhi: 0, fee: 0 };
  }

  const wire = AFTER_TAX_RANK_WIRE_FEE;
  let lots = targetNet / grossPerLot;

  for (let i = 0; i < 40; i++) {
    const fee = Math.ceil(lots * AFTER_TAX_RANK_FEE_PER_LOT);
    const netPlusCosts = targetNet + fee + wire;
    let grossDividend = netPlusCosts;
    let nhi = 0;
    if (grossDividend >= AFTER_TAX_RANK_NHI_THRESHOLD) {
      grossDividend = netPlusCosts / (1 - AFTER_TAX_RANK_NHI_RATE);
      nhi = Math.round(grossDividend * AFTER_TAX_RANK_NHI_RATE);
    }
    const nextLots = grossDividend / grossPerLot;
    if (Math.abs(nextLots - lots) < 1e-5) {
      return { lots: nextLots, grossDividend, nhi, fee };
    }
    lots = nextLots;
  }

  const fee = Math.ceil(lots * AFTER_TAX_RANK_FEE_PER_LOT);
  const netPlusCosts = targetNet + fee + wire;
  let grossDividend = netPlusCosts;
  let nhi = 0;
  if (grossDividend >= AFTER_TAX_RANK_NHI_THRESHOLD) {
    grossDividend = netPlusCosts / (1 - AFTER_TAX_RANK_NHI_RATE);
    nhi = Math.round(grossDividend * AFTER_TAX_RANK_NHI_RATE);
  }
  return { lots, grossDividend, nhi, fee };
}

export function compareByRequiredCapital(
  a: Pick<AfterTaxRankDerived, "capital" | "ticker">,
  b: Pick<AfterTaxRankDerived, "capital" | "ticker">,
): number {
  const diff = a.capital - b.capital;
  if (diff !== 0) return diff;
  return a.ticker.localeCompare(b.ticker, "zh-Hant");
}

export function deriveAfterTaxRank(
  rows: AfterTaxRankSnapshotRow[],
  basis: "ttm" | "last",
  topN?: number,
): AfterTaxRankDerived[] {
  const mapped = rows.map((row) => {
    const targetNet = perPeriodNetTarget(row.freq);
    const div = dividendPerShareForPeriod(row, basis);
    const { lots, grossDividend, nhi, fee } = solveLotsForPeriodNet(div, targetNet);
    const capital = row.price * lots * 1000;
    return {
      ...row,
      lots,
      capital,
      grossDividend,
      wireFee: AFTER_TAX_RANK_WIRE_FEE,
      nhi,
      fee,
      net: targetNet,
      rank: 0,
    };
  });
  const sorted = [...mapped].sort(compareByRequiredCapital);
  const capped =
    topN != null && topN > 0 ? sorted.slice(0, topN) : sorted;
  return capped.map((row, i) => ({ ...row, rank: i + 1 }));
}

export function formatRankMoney(n: number): string {
  return Math.round(n).toLocaleString("zh-TW");
}

export function formatRankNhi(nhi: number): string {
  if (nhi <= 0) return "—";
  return formatRankMoney(nhi);
}
