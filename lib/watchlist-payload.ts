/**
 * 自選標的資料：可序列化結構（供多組標的槽位共用）。
 */

export type RowPreset = "exdiv" | "sector" | "yield_note" | "link" | "custom";

export type WatchlistRow = {
  id: string;
  preset: RowPreset;
  customLabel: string;
  value: string;
};

export type WatchlistPayload = {
  ticker: string;
  name: string;
  annualReturnPct: string;
  dividendYieldPct: string;
  stockDividendPct: string;
  rows: WatchlistRow[];
  updatedAt: string;
};

const PRESET_VALUES: RowPreset[] = ["exdiv", "sector", "yield_note", "link", "custom"];

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isPreset(v: string): v is RowPreset {
  return PRESET_VALUES.includes(v as RowPreset);
}

function migrateRow(r: unknown): WatchlistRow {
  if (r && typeof r === "object" && "preset" in r && typeof (r as WatchlistRow).preset === "string") {
    const x = r as Partial<WatchlistRow>;
    const rawPreset = String(x.preset ?? "");
    const preset: RowPreset = isPreset(rawPreset) ? rawPreset : "custom";
    return {
      id: x.id || newId(),
      preset,
      customLabel: typeof x.customLabel === "string" ? x.customLabel : "",
      value: typeof x.value === "string" ? x.value : "",
    };
  }
  const legacy = r as { id?: string; label?: string; value?: string };
  return {
    id: legacy.id || newId(),
    preset: "custom",
    customLabel: legacy.label ?? "",
    value: legacy.value ?? "",
  };
}

/** 由任意 JSON 解析自選股資料；失敗則 null */
export function parseWatchlistPayload(o: unknown): WatchlistPayload | null {
  if (typeof o !== "object" || o === null) return null;
  const rec = o as Record<string, unknown>;
  if (typeof rec.ticker !== "string" || !Array.isArray(rec.rows)) return null;
  return {
    ticker: rec.ticker,
    name: typeof rec.name === "string" ? rec.name : "",
    annualReturnPct: typeof rec.annualReturnPct === "string" ? rec.annualReturnPct : "",
    dividendYieldPct: typeof rec.dividendYieldPct === "string" ? rec.dividendYieldPct : "",
    stockDividendPct: typeof rec.stockDividendPct === "string" ? rec.stockDividendPct : "",
    rows: (rec.rows as unknown[]).map(migrateRow),
    updatedAt: typeof rec.updatedAt === "string" ? rec.updatedAt : new Date().toISOString(),
  };
}

export function emptyWatchlistPayload(): WatchlistPayload {
  return {
    ticker: "",
    name: "",
    annualReturnPct: "",
    dividendYieldPct: "",
    stockDividendPct: "",
    rows: [],
    updatedAt: new Date().toISOString(),
  };
}

export function createEmptyRow(): WatchlistRow {
  return { id: newId(), preset: "exdiv", customLabel: "", value: "" };
}
