/**
 * 小計算機精選情境連結：僅供站內導覽與分享，不列入 sitemap。
 * canonical 仍指向 /quick-N（無 query）。
 */

export type QuickCuratedScenario = {
  label: string;
  query: Record<string, string>;
};

export function buildQuickScenarioHref(quickId: number, query: Record<string, string>): string {
  const qs = new URLSearchParams(query).toString();
  return qs ? `/quick-${quickId}?${qs}` : `/quick-${quickId}`;
}

export const QUICK_CURATED_SCENARIOS: Record<number, QuickCuratedScenario[]> = {
  1: [
    { label: "月投 3,000・20 年", query: { m: "3000", y: "20" } },
    { label: "月投 5,000・25 年", query: { m: "5000", y: "25" } },
    { label: "月投 10,000・30 年", query: { m: "10000", y: "30" } },
    { label: "月投 20,000・15 年", query: { m: "20000", y: "15" } },
    { label: "月投 5,000・10 年", query: { m: "5000", y: "10" } },
    { label: "月投 1,000・30 年", query: { m: "1000", y: "30" } },
    { label: "月投 15,000・20 年", query: { m: "15000", y: "20" } },
    { label: "月投 8,000・25 年", query: { m: "8000", y: "25" } },
  ],
  2: [
    { label: "目標月領 3 萬・月投 1 萬", query: { tm: "30000", mi: "10000" } },
    { label: "目標月領 5 萬・月投 2 萬", query: { tm: "50000", mi: "20000" } },
    { label: "目標月領 6 萬・月投 2.5 萬", query: { tm: "60000", mi: "25000" } },
    { label: "目標月領 8 萬・月投 3 萬", query: { tm: "80000", mi: "30000" } },
    { label: "目標月領 5 萬・月投 1.5 萬", query: { tm: "50000", mi: "15000" } },
    { label: "目標月領 4 萬・月投 1.2 萬", query: { tm: "40000", mi: "12000" } },
    { label: "目標月領 10 萬・月投 4 萬", query: { tm: "100000", mi: "40000" } },
    { label: "目標月領 5 萬・月投 5 萬", query: { tm: "50000", mi: "50000" } },
  ],
  3: [
    { label: "希望月領 3 萬・20 年", query: { tm: "30000", y: "20" } },
    { label: "希望月領 5 萬・25 年", query: { tm: "50000", y: "25" } },
    { label: "希望月領 6 萬・30 年", query: { tm: "60000", y: "30" } },
    { label: "希望月領 8 萬・20 年", query: { tm: "80000", y: "20" } },
    { label: "希望月領 5 萬・15 年", query: { tm: "50000", y: "15" } },
    { label: "希望月領 4 萬・25 年", query: { tm: "40000", y: "25" } },
    { label: "希望月領 10 萬・30 年", query: { tm: "100000", y: "30" } },
    { label: "希望月領 5 萬・10 年", query: { tm: "50000", y: "10" } },
  ],
  4: [
    { label: "0050・月投 5,000・20 年", query: { etf: "0050", mi: "5000", y: "20" } },
    { label: "00878・月投 1 萬・25 年", query: { etf: "00878", mi: "10000", y: "25" } },
    { label: "00919・月投 8,000・15 年", query: { etf: "00919", mi: "8000", y: "15" } },
    { label: "00929・月投 3,000・30 年", query: { etf: "00929", mi: "3000", y: "30" } },
    { label: "0050・月投 2 萬・10 年", query: { etf: "0050", mi: "20000", y: "10" } },
    { label: "00878・月投 5,000・30 年", query: { etf: "00878", mi: "5000", y: "30" } },
    { label: "00919・月投 1.5 萬・20 年", query: { etf: "00919", mi: "15000", y: "20" } },
    { label: "0050・月投 1 萬・第 12 期", query: { etf: "0050", mi: "10000", y: "20", n: "12" } },
  ],
  5: [
    { label: "月投 3,000・20 年", query: { m: "3000", y: "20" } },
    { label: "月投 5,000・25 年", query: { m: "5000", y: "25" } },
    { label: "月投 10,000・30 年", query: { m: "10000", y: "30" } },
    { label: "月投 10,000・10 年", query: { m: "10000", y: "10" } },
    { label: "月投 20,000・20 年", query: { m: "20000", y: "20" } },
    { label: "月投 5,000・15 年", query: { m: "5000", y: "15" } },
    { label: "月投 8,000・30 年", query: { m: "8000", y: "30" } },
    { label: "月投 15,000・25 年", query: { m: "15000", y: "25" } },
  ],
  6: [
    { label: "月投 2 萬・房貸 20 年", query: { m: "20000", y: "20" } },
    { label: "月投 3 萬・房貸 30 年", query: { m: "30000", y: "30" } },
    { label: "月投 1.5 萬・房貸 25 年", query: { m: "15000", y: "25" } },
    { label: "月投 2 萬・房貸 15 年", query: { m: "20000", y: "15" } },
    { label: "月投 1 萬・房貸 30 年", query: { m: "10000", y: "30" } },
    { label: "月投 2.5 萬・房貸 20 年", query: { m: "25000", y: "20" } },
    { label: "月投 3 萬・房貸 15 年", query: { m: "30000", y: "15" } },
    { label: "月投 2 萬・房貸 25 年", query: { m: "20000", y: "25" } },
  ],
  7: [
    { label: "月投 2 萬・車貸 5 年", query: { m: "20000", y: "5" } },
    { label: "月投 1.5 萬・車貸 7 年", query: { m: "15000", y: "7" } },
    { label: "月投 2.5 萬・車貸 3 年", query: { m: "25000", y: "3" } },
    { label: "月投 1 萬・車貸 5 年", query: { m: "10000", y: "5" } },
    { label: "月投 3 萬・車貸 5 年", query: { m: "30000", y: "5" } },
    { label: "月投 2 萬・車貸 7 年", query: { m: "20000", y: "7" } },
    { label: "月投 1.2 萬・車貸 3 年", query: { m: "12000", y: "3" } },
    { label: "月投 2 萬・車貸 10 年", query: { m: "20000", y: "10" } },
  ],
  8: [
    { label: "總預算 2 萬・分期 1 萬・20 年", query: { total: "20000", inst: "10000", invest: "10000", y: "20" } },
    { label: "總預算 5 萬・少分期・20 年", query: { total: "50000", inst: "10000", invest: "40000", y: "20" } },
    { label: "iPhone 級・高分期・15 年", query: { total: "36000", inst: "3000", invest: "0", y: "15" } },
    { label: "0050 情境・月預算 1 萬", query: { etf: "0050", total: "10000", inst: "5000", invest: "5000", y: "20", rate: "8.5" } },
    { label: "通膨調整・投資 7%", query: { total: "20000", inst: "8000", invest: "12000", y: "20", inflation: "true", inflation_rate: "3" } },
    { label: "總預算 8 萬・均衡・25 年", query: { total: "80000", inst: "20000", invest: "60000", y: "25" } },
    { label: "總預算 3 萬・低分期・30 年", query: { total: "30000", inst: "3000", invest: "27000", y: "30" } },
    { label: "總預算 10 萬・高投資・20 年", query: { total: "100000", inst: "20000", invest: "80000", y: "20" } },
  ],
  9: [
    { label: "預算 3 萬・分期 1 萬・延後 2 年", query: { tb: "30000", inst: "10000", iy: "3", dy: "2", ap: "7" } },
    { label: "預算 5 萬・高分期・延後 1 年", query: { tb: "50000", inst: "20000", iy: "2", dy: "1", ap: "7" } },
    { label: "預算 2 萬・低分期・延後 3 年", query: { tb: "20000", inst: "5000", iy: "2", dy: "3", ap: "6" } },
    { label: "預算 8 萬・均衡・延後 2 年", query: { tb: "80000", inst: "15000", iy: "3", dy: "2", ap: "7" } },
    { label: "預算 4 萬・分期 1.2 萬・延後 2 年", query: { tb: "40000", inst: "12000", iy: "3", dy: "2", ap: "7" } },
    { label: "預算 6 萬・短分期・延後 3 年", query: { tb: "60000", inst: "25000", iy: "1", dy: "3", ap: "8" } },
    { label: "預算 10 萬・低分期・延後 1 年", query: { tb: "100000", inst: "10000", iy: "4", dy: "1", ap: "7" } },
    { label: "預算 3 萬・全分期・延後 1 年", query: { tb: "30000", inst: "30000", iy: "1", dy: "1", ap: "6" } },
  ],
  10: [
    { label: "月投 5,000・20 年・期末 -20%", query: { m: "5000", y: "20", ap: "7", crash: "-20" } },
    { label: "月投 1 萬・30 年・期末 -30%", query: { m: "10000", y: "30", ap: "7", crash: "-30" } },
    { label: "月投 1 萬・20 年・期末 -40%", query: { m: "10000", y: "20", ap: "7", crash: "-40" } },
    { label: "月投 3,000・25 年・期末 -25%", query: { m: "3000", y: "25", ap: "6", crash: "-25" } },
    { label: "月投 2 萬・15 年・期末 -15%", query: { m: "20000", y: "15", ap: "8", crash: "-15" } },
    { label: "月投 8,000・30 年・期末 -35%", query: { m: "8000", y: "30", ap: "7", crash: "-35" } },
    { label: "月投 1 萬・10 年・期末 -50%", query: { m: "10000", y: "10", ap: "7", crash: "-50" } },
    { label: "月投 5,000・30 年・溫和 -10%", query: { m: "5000", y: "30", ap: "7", crash: "-10" } },
  ],
  11: [
    { label: "房貸 800 萬・30 年・月入 8 萬", query: { loan: "8000000", rate: "2.2", years: "30", income: "80000" } },
    { label: "房貸 1200 萬・30 年・月入 12 萬", query: { loan: "12000000", rate: "2.0", years: "30", income: "120000" } },
    { label: "信貸 50 萬・5 年・月入 5 萬", query: { loan: "500000", rate: "5.5", years: "5", income: "50000" } },
    { label: "房貸 600 萬・20 年・月入 7 萬", query: { loan: "6000000", rate: "2.3", years: "20", income: "70000" } },
    { label: "房貸 1000 萬・25 年・多還 5 千", query: { loan: "10000000", rate: "2.1", years: "25", income: "90000", extra: "5000" } },
    { label: "房貸 500 萬・15 年・月入 6 萬", query: { loan: "5000000", rate: "2.4", years: "15", income: "60000" } },
    { label: "信貸 80 萬・7 年・月入 6 萬", query: { loan: "800000", rate: "4.8", years: "7", income: "60000" } },
    { label: "房貸 1500 萬・30 年・ lump 50 萬", query: { loan: "15000000", rate: "2.0", years: "30", income: "150000", lump: "500000" } },
  ],
  12: [
    { label: "PK 模式・情境 0", query: { page: "2", pk: "0" } },
    { label: "PK 模式・情境 1", query: { page: "2", pk: "1" } },
    { label: "PK 模式・情境 2", query: { page: "2", pk: "2" } },
    { label: "月薪試算・第 0 頁", query: { page: "0" } },
    { label: "年終試算・第 1 頁", query: { page: "1" } },
    { label: "PK 模式・情境 3", query: { page: "2", pk: "3" } },
    { label: "PK 模式・情境 4", query: { page: "2", pk: "4" } },
    { label: "PK 模式・情境 5", query: { page: "2", pk: "5" } },
  ],
};

export function getQuickCuratedScenarios(id: number): QuickCuratedScenario[] {
  return QUICK_CURATED_SCENARIOS[id] ?? [];
}

/** 全站精選情境總數（約 96 組，僅內鏈，不進 sitemap） */
export function countAllCuratedScenarios(): number {
  return Object.values(QUICK_CURATED_SCENARIOS).reduce((sum, list) => sum + list.length, 0);
}
