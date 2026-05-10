import type { Quick11EmbedPreset } from "./embed-preset";

/** 與破產計算機首頁六顆快捷鈕一致（台灣常見情境示意，非報價／非核貸承諾） */
export type Quick11LoanPresetKey = "scooter" | "car" | "personal" | "mortgage" | "student" | "renovation";

export type Quick11LoanPreset = {
  key: Quick11LoanPresetKey;
  icon: string;
  label: string;
  amount: number;
  annualRate: number;
  years: number;
  monthlyIncome: number;
};

export const QUICK11_LOAN_PRESETS: readonly Quick11LoanPreset[] = [
  { key: "scooter", icon: "🛵", label: "機車貸", amount: 50_000, annualRate: 14, years: 4, monthlyIncome: 36_000 },
  { key: "car", icon: "🚗", label: "汽車貸", amount: 800_000, annualRate: 4.2, years: 7, monthlyIncome: 65_000 },
  { key: "personal", icon: "💳", label: "信貸", amount: 500_000, annualRate: 8, years: 5, monthlyIncome: 55_000 },
  { key: "mortgage", icon: "🏠", label: "房貸", amount: 11_000_000, annualRate: 2.2, years: 30, monthlyIncome: 120_000 },
  { key: "student", icon: "🎓", label: "學貸", amount: 450_000, annualRate: 1.9, years: 10, monthlyIncome: 42_000 },
  { key: "renovation", icon: "🛠️", label: "裝潢貸", amount: 1_000_000, annualRate: 3.5, years: 10, monthlyIncome: 75_000 },
] as const;

/** mini-blog slug → 快捷情境（第 1～6 篇依序對應六顆按鈕） */
export const QUICK11_SLUG_TO_PRESET_KEY: Record<string, Quick11LoanPresetKey> = {
  "quick11-scooter-loan-high-rate-trap": "scooter",
  "quick11-car-loan-rate-years-impact": "car",
  "quick11-credit-loan-8pct-cashflow-total-interest": "personal",
  "quick11-mortgage-11m-annuity-vs-equal-principal": "mortgage",
  "quick11-student-loan-payment-stress": "student",
  "quick11-renovation-loan-plus-mortgage-cashflow": "renovation",
};

/**
 * 延伸篇 slug：`quick11-{loan}-t{01-08}-s{007}` → 綁定試算分頁 initialPage。
 * 前 6 篇 legacy slug 不符此格式，回傳 undefined。
 */
export function parseQuick11SlugEmbed(slug: string): { presetKey: Quick11LoanPresetKey; initialPage: number } | undefined {
  const m = /^quick11-(scooter|car|personal|mortgage|student|renovation)-t(\d{2})-s\d{3}$/.exec(slug);
  if (!m) return undefined;
  const initialPage = Number(m[2]);
  if (!Number.isFinite(initialPage) || initialPage < 1 || initialPage > 8) return undefined;
  return { presetKey: m[1] as Quick11LoanPresetKey, initialPage };
}

export function getQuick11LoanPresetBySlug(slug: string): Quick11LoanPreset | undefined {
  const legacyKey = QUICK11_SLUG_TO_PRESET_KEY[slug];
  const ext = parseQuick11SlugEmbed(slug);
  const key = legacyKey ?? ext?.presetKey;
  if (!key) return undefined;
  return QUICK11_LOAN_PRESETS.find((p) => p.key === key);
}

export function quick11EmbedPresetFromSlug(slug: string): Quick11EmbedPreset | undefined {
  const p = getQuick11LoanPresetBySlug(slug);
  if (!p) return undefined;
  const ext = parseQuick11SlugEmbed(slug);
  const base: Quick11EmbedPreset = {
    loanAmount: p.amount,
    annualRate: p.annualRate,
    loanYears: p.years,
    monthlyIncome: p.monthlyIncome,
  };
  if (ext) base.initialPage = ext.initialPage;
  return base;
}

/** 用於文章口語：「5 萬元」「80 萬元」「1100 萬元」 */
export function formatPrincipalZhTW(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 100_000_000) {
    const yi = n / 100_000_000;
    return `${Number.isInteger(yi) ? yi : yi.toFixed(1)} 億元`;
  }
  if (n >= 10_000) {
    const wan = n / 10_000;
    if (Math.abs(wan - Math.round(wan)) < 1e-9) return `${Math.round(wan)} 萬元`;
    return `${wan.toFixed(1)} 萬元`;
  }
  return `NT$ ${n.toLocaleString("zh-TW")}`;
}
