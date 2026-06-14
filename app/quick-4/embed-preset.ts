/** 第 4 台：網址／文內嵌試算錨點（與 mini-blog slug 對齊） */

export type Quick4EmbedPreset = {
  etfCode: string;
  monthlyInvest?: number;
  years?: number;
  startYear?: number;
  startMonth?: number;
  nthPeriod?: number;
};

function clampNum(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** 分享連結用；`code` 與 `etf` 皆寫入（向後相容） */
export function quick4PresetToQueryString(p: Quick4EmbedPreset): string {
  const u = new URLSearchParams();
  u.set("code", p.etfCode);
  u.set("etf", p.etfCode);
  if (p.monthlyInvest != null) u.set("mi", String(Math.round(p.monthlyInvest)));
  if (p.years != null) u.set("y", String(Math.round(p.years)));
  if (p.startYear != null) u.set("sy", String(Math.round(p.startYear)));
  if (p.startMonth != null) u.set("sm", String(Math.round(p.startMonth)));
  if (p.nthPeriod != null) u.set("n", String(Math.round(p.nthPeriod)));
  return u.toString();
}

/** 讀 `?code=` 或 `?etf=`；無有效代碼時 undefined（元件沿用預設 0050） */
export function parseQuick4PresetFromSearchParams(sp: {
  get: (key: string) => string | null;
}): Quick4EmbedPreset | undefined {
  const raw = (sp.get("code") ?? sp.get("etf") ?? "").trim();
  if (!raw) return undefined;
  const etfCode = raw.toUpperCase();
  if (!/^[A-Z0-9]{2,6}$/u.test(etfCode)) return undefined;

  const preset: Quick4EmbedPreset = { etfCode };

  const miRaw = sp.get("mi") ?? sp.get("monthly");
  if (miRaw != null && miRaw !== "") {
    const mi = Number(miRaw.replace(/,/g, ""));
    if (Number.isFinite(mi)) preset.monthlyInvest = clampNum(Math.round(mi), 0, 1_000_000);
  }
  const yRaw = sp.get("y") ?? sp.get("years");
  if (yRaw != null && yRaw !== "") {
    const y = Number(yRaw);
    if (Number.isFinite(y)) preset.years = clampNum(Math.round(y), 1, 100);
  }
  const sy = sp.get("sy") ?? sp.get("start_year");
  if (sy != null && sy !== "") {
    const n = Number(sy);
    if (Number.isFinite(n)) preset.startYear = clampNum(Math.round(n), 2000, 2100);
  }
  const sm = sp.get("sm") ?? sp.get("start_month");
  if (sm != null && sm !== "") {
    const n = Number(sm);
    if (Number.isFinite(n)) preset.startMonth = clampNum(Math.round(n), 1, 12);
  }
  const nRaw = sp.get("n") ?? sp.get("nth");
  if (nRaw != null && nRaw !== "") {
    const n = Number(nRaw);
    if (Number.isFinite(n)) preset.nthPeriod = clampNum(Math.round(n), 1, 1200);
  }

  return preset;
}
