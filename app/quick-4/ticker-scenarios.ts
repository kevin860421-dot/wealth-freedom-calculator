import { TICKER_PRESETS, type TickerPreset } from "@/app/ticker-presets";
import type { Quick4EmbedPreset } from "./embed-preset";

export const QUICK4_CALCULATOR_NAME = "ETF 領息夢想模擬器";

/** 量產文 slug：`quick4-00919-dividend-simulator` */
export function quick4TickerSlug(tickerId: string): string {
  return `quick4-${tickerId.toLowerCase()}-dividend-simulator`;
}

export function parseQuick4TickerSlug(slug: string): string | undefined {
  const m = /^quick4-([a-z0-9]{2,6})-dividend-simulator$/iu.exec(slug);
  return m?.[1]?.toUpperCase();
}

export function findTickerPreset(tickerId: string): TickerPreset | undefined {
  const id = tickerId.toUpperCase();
  return TICKER_PRESETS.find((p) => p.id.toUpperCase() === id);
}

export function tickerShortName(preset: TickerPreset): string {
  const m = preset.label.match(/^(.+?)（/u);
  return m?.[1]?.trim() ?? preset.label.split("（")[0]?.trim() ?? preset.id;
}

function freqLabel(freq: TickerPreset["frequency"]): string {
  if (freq === "month") return "月配";
  if (freq === "quarter") return "季配";
  if (freq === "semiannual") return "半年配";
  return "年配";
}

/** 文內／SEO 用：標的＋參考殖利率（示意） */
export function tickerYieldHint(preset: TickerPreset): string {
  const cash = preset.dividendYieldPct;
  const stk = preset.stockDividendPct;
  if (cash != null && cash > 0 && stk != null && stk > 0) return `股息約 ${cash}%＋股票股利示意 ${stk}%`;
  if (cash != null && cash > 0) return `股息殖利率示意 ${cash}%`;
  if (preset.annualReturn != null) return `年化報酬示意 ${preset.annualReturn}%`;
  return "報酬與配息以試算預設為準";
}

export function buildQuick4EmbedPresetFromTicker(
  tickerId: string,
  overrides: Partial<Omit<Quick4EmbedPreset, "etfCode">> = {},
): Quick4EmbedPreset | undefined {
  const preset = findTickerPreset(tickerId);
  if (!preset) return undefined;
  return {
    etfCode: preset.id,
    monthlyInvest: 20_000,
    years: 20,
    startYear: 2026,
    startMonth: 3,
    nthPeriod: 1,
    ...overrides,
  };
}

/** mini-blog slug → 試算錨點；非 ticker 文回 undefined */
export function quick4EmbedPresetFromSlug(slug: string): Quick4EmbedPreset | undefined {
  const id = parseQuick4TickerSlug(slug);
  if (!id) return undefined;
  return buildQuick4EmbedPresetFromTicker(id);
}

export function quick4TrialConditionsLine(tickerId: string, preset?: TickerPreset): string {
  const p = preset ?? findTickerPreset(tickerId);
  const id = p?.id ?? tickerId.toUpperCase();
  const name = p ? tickerShortName(p) : id;
  const freq = p ? freqLabel(p.frequency) : "配息";
  const yieldHint = p ? tickerYieldHint(p) : "";
  return `本篇試算條件（與文末試算開頁一致）：每月投入 NT$ 20,000、累積 20 年、標的 ${id}（${name}）、${freq}、${yieldHint}、第 1 期配息示範、起始 2026 年 3 月。（情境示意，非報酬保證；實際以你的契約與市場為準）`;
}
