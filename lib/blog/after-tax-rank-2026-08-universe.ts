import { getEtfShortName } from "@/app/etf-fuzzy-search";
import {
  TICKER_PRESETS,
  tickerAssetKind,
  type TickerFrequency,
} from "@/app/ticker-presets";
import { AFTER_TAX_RANK_2026_08_ETF_AUDITED } from "@/app/blog/posts/after-tax-rank-2026-08-audited";
import type { AfterTaxRankFreq, AfterTaxRankSnapshotRow } from "@/lib/blog/after-tax-rank";
import { payoutsPerYear } from "@/lib/blog/after-tax-rank";

function freqFromPreset(frequency: TickerFrequency): AfterTaxRankFreq {
  if (frequency === "month") return "月";
  if (frequency === "quarter") return "季";
  if (frequency === "semiannual") return "半年";
  return "年";
}

function presetToSnapshotRow(
  preset: (typeof TICKER_PRESETS)[number],
): AfterTaxRankSnapshotRow {
  const freq = freqFromPreset(preset.frequency);
  const div = preset.dividendPerPeriod ?? 0;
  const py = payoutsPerYear(freq);
  return {
    ticker: preset.id,
    name: getEtfShortName(preset.label),
    price: preset.price ?? 0,
    lastCashPerUnit: div,
    stockDivPerUnit: 0,
    ttmCashPerUnit: div * py,
    ttmComplete: false,
    ttmNote: "試算預設參考，正式月報以 e添富／證交所截止日資料覆核",
    freq,
    exDate: "—",
    lastBuy: "—",
    payDate: "—",
  };
}

export function buildAfterTaxRank202608EtfUniverse(): AfterTaxRankSnapshotRow[] {
  const auditedByTicker = new Map(
    AFTER_TAX_RANK_2026_08_ETF_AUDITED.map((row) => [row.ticker, row]),
  );
  const out: AfterTaxRankSnapshotRow[] = [];
  for (const preset of TICKER_PRESETS) {
    if (tickerAssetKind(preset.label) !== "ETF") continue;
    const audited = auditedByTicker.get(preset.id);
    out.push(audited ?? presetToSnapshotRow(preset));
  }
  return out;
}

/** 2026-08 月報 ETF 母體（含已覆核標的 + 其餘 ETF 試算預設）。 */
export const AFTER_TAX_RANK_2026_08_ETF = buildAfterTaxRank202608EtfUniverse();
