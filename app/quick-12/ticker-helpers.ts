import type { TickerFrequency, TickerPreset } from "@/app/ticker-presets";

function periodsPerYear(f: TickerFrequency): number {
  if (f === "month") return 12;
  if (f === "quarter") return 4;
  if (f === "semiannual") return 2;
  return 1;
}

/**
 * 示意「持有 1 張（1000 股）」之年現金配息：優先用 股價×1000×殖利率%；否則用 每期每股配息×期數×1000。
 * 與 ticker-presets 欄位語意一致（教學試算，非申報金額）。
 */
export function estimatedAnnualCashDividendPerLot(p: TickerPreset): number {
  const price = p.price ?? 0;
  const y = p.dividendYieldPct ?? 0;
  if (price > 0 && y > 0) {
    return Math.round(price * 1000 * (y / 100));
  }
  const per = p.dividendPerPeriod ?? 0;
  if (per <= 0) return 0;
  return Math.round(per * periodsPerYear(p.frequency) * 1000);
}

export function default54cPctFromPreset(p: TickerPreset): number {
  const r = parseFloat(String(p.ratio54c ?? "").replace(/,/g, ""));
  if (Number.isFinite(r) && r >= 0 && r <= 100) return Math.round(r);
  return 100;
}

export function formatInputMoney(n: number): string {
  return Math.max(0, Math.round(Number.isFinite(n) ? n : 0)).toLocaleString("zh-TW");
}

/** 持股市值 × 殖利率% → 粗估年現金配息（示意，非除息明細） */
export function annualDividendFromMarketValueApprox(marketValue: number, yieldPct: number): number {
  const mv = Math.max(0, marketValue);
  const y = Math.max(0, yieldPct);
  if (mv <= 0 || y <= 0) return 0;
  return Math.round(mv * (y / 100));
}
