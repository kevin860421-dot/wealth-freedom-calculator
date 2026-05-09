import type { LoanMethod } from "./logic";

/** 文內嵌／網址帶參時與主站 `/quick-11` 預設區隔的試算錨點 */
export type Quick11EmbedPreset = {
  loanAmount: number;
  annualRate: number;
  loanYears: number;
  monthlyIncome: number;
  extraMonthlyPayment?: number;
  lumpSumAmount?: number;
  /** 分頁 tab：0 首頁、1 本息…（見 view 內 pageTabs） */
  initialPage?: number;
  method?: LoanMethod;
};

function clampNum(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** 將試算錨點轉成查詢字串：給 iframe `src`、分享連結與 `/quick-11?…` 同步 */
export function quick11PresetToQueryString(p: Quick11EmbedPreset): string {
  const u = new URLSearchParams();
  u.set("loan", String(Math.round(p.loanAmount)));
  u.set("rate", String(p.annualRate));
  u.set("years", String(Math.round(p.loanYears)));
  u.set("income", String(Math.round(p.monthlyIncome)));
  if (p.extraMonthlyPayment != null) u.set("extra", String(Math.round(p.extraMonthlyPayment)));
  if (p.lumpSumAmount != null) u.set("lump", String(Math.round(p.lumpSumAmount)));
  if (p.initialPage != null) u.set("tab", String(Math.round(p.initialPage)));
  if (p.method) u.set("method", p.method);
  return u.toString();
}

/**
 * 從網址還原試算錨點（與 `QuickCalculator11View` 的 `embedPreset` 對齊）。
 * 無有效 `loan` 時回傳 undefined，元件沿用預設。
 */
export function parseQuick11PresetFromSearchParams(sp: { get: (key: string) => string | null }): Quick11EmbedPreset | undefined {
  const loanRaw = sp.get("loan");
  if (loanRaw == null || loanRaw === "") return undefined;

  const loanAmount = Number(loanRaw);
  if (!Number.isFinite(loanAmount) || loanAmount <= 0) return undefined;

  const rate = Number(sp.get("rate") ?? "2.2");
  const years = Number(sp.get("years") ?? "30");
  const income = Number(sp.get("income") ?? "80000");

  const extraRaw = sp.get("extra");
  const lumpRaw = sp.get("lump");
  const tabRaw = sp.get("tab");
  const methodRaw = sp.get("method");

  let method: LoanMethod | undefined;
  if (methodRaw === "annuity" || methodRaw === "equalPrincipal") {
    method = methodRaw;
  }

  /** 與首頁貸款輸入下限對齊（機車／學貸等小額情境） */
  const la = clampNum(Math.round(loanAmount), 50_000, 50_000_000);

  const preset: Quick11EmbedPreset = {
    loanAmount: la,
    annualRate: clampNum(Number.isFinite(rate) ? rate : 2.2, 0, 99),
    loanYears: clampNum(Number.isFinite(years) ? Math.round(years) : 30, 1, 50),
    monthlyIncome: clampNum(Number.isFinite(income) ? Math.round(income) : 80_000, 1, 999_999_999),
  };

  if (extraRaw != null && extraRaw !== "") {
    const e = Number(extraRaw);
    if (Number.isFinite(e)) preset.extraMonthlyPayment = clampNum(Math.round(e), 0, la);
  }
  if (lumpRaw != null && lumpRaw !== "") {
    const l = Number(lumpRaw);
    if (Number.isFinite(l)) preset.lumpSumAmount = clampNum(Math.round(l), 0, la);
  }
  if (tabRaw != null && tabRaw !== "") {
    const t = Number(tabRaw);
    if (Number.isFinite(t)) preset.initialPage = clampNum(Math.round(t), 0, 8);
  }
  if (method) preset.method = method;

  return preset;
}
