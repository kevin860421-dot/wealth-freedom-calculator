/**
 * 小計算機 → GA4 `click_main_calculator` 的 from_page 參數（可讀 slug）。
 * 與 quick_id（1～12）並存，方便報表依情境名稱分組。
 */
export const QUICK_GA_FROM_PAGE: Record<number, string> = {
  1: "stock_compound_calculator",
  2: "wealth_freedom_countdown",
  3: "dream_monthly_income",
  4: "etf_dividend_dream",
  5: "snowball_principal_vs_compound",
  6: "mortgage_vs_global_stocks",
  7: "car_loan_calculator",
  8: "delayed_gratification",
  9: "delayed_gratification_invest_first",
  10: "compound_dream_vs_crash",
  11: "bankruptcy_calculator",
  12: "salary_tax_nhi2_pk",
};

export function getQuickGaFromPage(quickId: number): string {
  return QUICK_GA_FROM_PAGE[quickId] ?? `quick_${quickId}`;
}
