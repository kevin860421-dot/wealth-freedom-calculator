import { TICKER_PRESETS, type TickerPreset } from "./ticker-presets";
import { resolveQuick4CalculatorHref, resolveQuick4PublishedMiniBlogHref } from "./quick-4/quick4-mini-blog-routing";

/** 從 ticker-presets label 取出顯示用簡稱，如「元大台灣50」 */
export function getEtfShortName(label: string): string {
  const paren = label.indexOf("（");
  if (paren >= 0) return label.slice(0, paren).trim();
  const dash = label.indexOf("-");
  if (dash >= 0) return label.slice(0, dash).trim();
  return label.trim();
}

function normalizeQuery(raw: string): string {
  return raw.replace(/\s/g, "").toLowerCase();
}

function toQueryString(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (raw == null) return "";
  return String(raw);
}

type SearchEntry = {
  preset: TickerPreset;
  haystack: string;
};

const ETF_SEARCH_INDEX: SearchEntry[] = TICKER_PRESETS.map((preset) => {
  const short = getEtfShortName(preset.label);
  const haystack = normalizeQuery(`${preset.id}${short}${preset.label}`);
  return { preset, haystack };
});

/**
 * 模糊過濾：代號片段或名稱／簡稱任一包含查詢字串即匹配（不分大小寫、忽略空白）。
 */
export function filterTickerPresetsByQuery(raw: unknown, limit = 80): TickerPreset[] {
  const q = normalizeQuery(toQueryString(raw).trim());
  if (!q) return TICKER_PRESETS;
  const out: TickerPreset[] = [];
  for (const { preset, haystack } of ETF_SEARCH_INDEX) {
    if (haystack.includes(q)) {
      out.push(preset);
      if (out.length >= limit) break;
    }
  }
  return out;
}

/** 搜尋／選單導向第 4 台：計算機 code 與 mini-blog（未發布標的文 → 已發布最佳匹配） */
export function resolveTickerQuick4Navigation(tickerId: string, now: Date = new Date()) {
  const id = tickerId.toUpperCase();
  const blog = resolveQuick4PublishedMiniBlogHref(id, now);
  return {
    tickerId: id,
    calculatorHref: resolveQuick4CalculatorHref(id),
    miniBlogHref: blog.href,
    miniBlogSlug: blog.slug,
    isOwnTickerArticle: blog.isOwnArticle,
  };
}
