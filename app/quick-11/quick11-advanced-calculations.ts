import type { PaymentRow } from "./logic";

/** 提前還清後，補齊至合約年期（圖表 X 軸對齊使用者設定的貸款年限） */
export function padPaymentRowsToContractYears(rows: PaymentRow[], loanYears: number): PaymentRow[] {
  const targetMonths = Math.max(1, Math.round(loanYears * 12));
  if (!rows.length) return rows;
  if (rows.length >= targetMonths) return rows.slice(0, targetMonths);
  const padded = rows.slice();
  for (let p = rows.length + 1; p <= targetMonths; p += 1) {
    padded.push({
      period: p,
      principal: 0,
      interest: 0,
      payment: 0,
      balance: 0,
    });
  }
  return padded;
}

/** 每年末：剩餘本金 vs 累積利息（本息／本金平均攤還明細） */
export function buildPrincipalInterestOverlapSeries(rows: PaymentRow[]) {
  if (!rows.length) {
    return { years: [] as number[], balanceSeries: [] as number[], cumInterestSeries: [] as number[], crossoverYear: null as number | null };
  }
  const yearCount = Math.max(1, Math.ceil(rows.length / 12));
  const years: number[] = [];
  const balanceSeries: number[] = [];
  const cumInterestSeries: number[] = [];
  let cumInterest = 0;

  for (let y = 1; y <= yearCount; y += 1) {
    const endPeriod = Math.min(rows.length, y * 12);
    for (let p = (y - 1) * 12; p < endPeriod; p += 1) {
      cumInterest += rows[p]?.interest ?? 0;
    }
    const lastRow = rows[endPeriod - 1];
    years.push(y);
    balanceSeries.push(Math.round(lastRow?.balance ?? 0));
    cumInterestSeries.push(Math.round(cumInterest));
  }

  let crossoverYear: number | null = null;
  for (let i = 0; i < years.length; i += 1) {
    if (cumInterestSeries[i] >= balanceSeries[i]) {
      crossoverYear = years[i];
      break;
    }
  }

  return { years, balanceSeries, cumInterestSeries, crossoverYear };
}

/**
 * 通膨調整：逐月折現固定月付（標準 PV 公式，參考 NPV／Bogleheads 房貸通膨討論）。
 * PV = Σ M_t / (1 + i)^t，i 為月通膨率。
 */
export function computeInflationAdjustedPaymentPV(rows: PaymentRow[], annualInflationPct: number) {
  const monthlyInflation = Math.max(0, annualInflationPct) / 100 / 12;
  let nominalTotal = 0;
  let realPresentValue = 0;

  for (const row of rows) {
    nominalTotal += row.payment;
    const discount = Math.pow(1 + monthlyInflation, row.period);
    realPresentValue += row.payment / discount;
  }

  return {
    nominalTotal,
    realPresentValue,
    /** 名義總還款以「最後一期的購買力」折算（簡化一句話版） */
    realAtTermEnd: nominalTotal / Math.pow(1 + annualInflationPct / 100, rows.length / 12),
  };
}

/**
 * 機會成本：若每月房貸改投入市場（期末年金 FV）。
 * FV = PMT × [(1+r)^n − 1] / r
 */
export function computeOpportunityCostFv(monthlyPayment: number, months: number, annualReturnPct: number) {
  const pmt = Math.max(0, monthlyPayment);
  const n = Math.max(0, Math.round(months));
  if (pmt <= 0 || n <= 0) return 0;
  const r = Math.max(0, annualReturnPct) / 100 / 12;
  if (r <= 0) return pmt * n;
  return pmt * ((Math.pow(1 + r, n) - 1) / r);
}

/** 依每期實際月付（含本金平均遞減）逐月複利累積 FV */
export function computeOpportunityCostFvFromRows(rows: PaymentRow[], annualReturnPct: number) {
  const n = rows.length;
  if (n <= 0) return 0;
  const r = Math.max(0, annualReturnPct) / 100 / 12;
  if (r <= 0) {
    return rows.reduce((sum, row) => sum + Math.max(0, row.payment), 0);
  }
  let fv = 0;
  for (let t = 0; t < n; t += 1) {
    const pmt = Math.max(0, rows[t]?.payment ?? 0);
    const monthsRemaining = n - t;
    fv += pmt * Math.pow(1 + r, monthsRemaining);
  }
  return fv;
}

/** 緊急預備金可支撐幾個月房貸（不含其他生活費） */
export function computeEmergencyFundMonths(savings: number, monthlyPayment: number) {
  if (monthlyPayment <= 0) return Number.POSITIVE_INFINITY;
  return Math.max(0, savings) / monthlyPayment;
}

export type EmergencySurvivalMetrics = {
  monthlyTotalExpense: number;
  monthlyRemainingIncome: number;
  monthlyCashGap: number;
  survivalMonths: number;
  isSurplus: boolean;
};

/**
 * 安全氣囊：存款可支撐月數（房貸 + 生活費 − 剩餘收入）。
 * incomeRetentionPct：0% 完全失業、100% 收入正常。
 */
export function computeEmergencySurvivalMetrics(
  savings: number,
  monthlyPayment: number,
  monthlyLivingExpense: number,
  monthlyIncome: number,
  incomeRetentionPct: number,
): EmergencySurvivalMetrics {
  const monthlyTotalExpense = Math.max(0, monthlyPayment) + Math.max(0, monthlyLivingExpense);
  const retention = Math.min(100, Math.max(0, incomeRetentionPct)) / 100;
  const monthlyRemainingIncome = Math.max(0, monthlyIncome) * retention;
  const monthlyCashGap = monthlyTotalExpense - monthlyRemainingIncome;

  if (monthlyCashGap <= 0) {
    return {
      monthlyTotalExpense,
      monthlyRemainingIncome,
      monthlyCashGap,
      survivalMonths: Number.POSITIVE_INFINITY,
      isSurplus: true,
    };
  }

  return {
    monthlyTotalExpense,
    monthlyRemainingIncome,
    monthlyCashGap,
    survivalMonths: Math.max(0, savings) / monthlyCashGap,
    isSurplus: false,
  };
}

export type RateHikePreset = "minus25bp" | "flat" | "plus25bp" | "plus50bp" | "plus100bp";

export const RATE_HIKE_PRESETS: { id: RateHikePreset; label: string; addPct: number }[] = [
  { id: "minus25bp", label: "🟢 佛心降息 1 碼 (-0.25%)", addPct: -0.25 },
  { id: "flat", label: "🔹 央行維持現狀", addPct: 0 },
  { id: "plus25bp", label: "⚠️ 小幅升息 1 碼 (+0.25%)", addPct: 0.25 },
  { id: "plus50bp", label: "🔸 連續升息 2 碼 (+0.50%)", addPct: 0.5 },
  { id: "plus100bp", label: "🚨 終極暴升 4 碼 (+1.00%)", addPct: 1 },
];

export function rateHikeAddPct(preset: RateHikePreset) {
  return RATE_HIKE_PRESETS.find((p) => p.id === preset)?.addPct ?? 0;
}

/** 情境利率 = 現況 ± 碼數，限制在 0%～15% */
export function resolveRateHikeScenarioRate(baseAnnualRatePct: number, preset: RateHikePreset) {
  const raw = baseAnnualRatePct + rateHikeAddPct(preset);
  return Math.min(15, Math.max(0, Number(raw.toFixed(2))));
}

export type BankNegotiationReportInput = {
  loanAmount: number;
  annualRate: number;
  loanYears: number;
  monthlyIncome: number;
  methodLabel: string;
  monthlyPayment: number;
  dtiPct: number;
  totalInterest: number;
  totalRepayment: number;
  equalPrincipalInterest: number;
  interestSavedVsAnnuity: number;
  rateShockPct: number;
  shockedMonthlyPayment: number;
  shockedDtiPct: number;
  prepaySavedInterest: number;
  inflationPct: number;
  realPaymentPv: number;
};

/** 談判用純文字摘要（可複製貼到 Email／LINE） */
export function buildBankNegotiationReportText(input: BankNegotiationReportInput): string {
  const lines = [
    "【破產計算機 · 銀行談判健檢摘要】（情境試算，僅供參考）",
    "",
    `貸款本金：NT$ ${Math.round(input.loanAmount).toLocaleString("zh-TW")}`,
    `年利率：${input.annualRate.toFixed(2)}% · 年期：${input.loanYears} 年`,
    `月收入（預警）：NT$ ${Math.round(input.monthlyIncome).toLocaleString("zh-TW")}`,
    `還款方式：${input.methodLabel}`,
    `首月月付：NT$ ${Math.round(input.monthlyPayment).toLocaleString("zh-TW")} · 負債比 ${input.dtiPct.toFixed(1)}%`,
    "",
    `總利息（${input.methodLabel}）：NT$ ${Math.round(input.totalInterest).toLocaleString("zh-TW")}`,
    `總還款：NT$ ${Math.round(input.totalRepayment).toLocaleString("zh-TW")}`,
    `若改本金平均，利息約 NT$ ${Math.round(input.equalPrincipalInterest).toLocaleString("zh-TW")}（約少 NT$ ${Math.round(input.interestSavedVsAnnuity).toLocaleString("zh-TW")}）`,
    "",
    `通膨 ${input.inflationPct.toFixed(1)}% 下，月付折現總額約 NT$ ${Math.round(input.realPaymentPv).toLocaleString("zh-TW")}（今日購買力，示意）`,
    `升息壓力 +${input.rateShockPct.toFixed(2)}% → 新月付 NT$ ${Math.round(input.shockedMonthlyPayment).toLocaleString("zh-TW")} · 負債比 ${input.shockedDtiPct.toFixed(1)}%`,
    `提前還款示意省下利息：NT$ ${Math.round(input.prepaySavedInterest).toLocaleString("zh-TW")}`,
    "",
    "完整試算：https://wealth-freedom-calculator.vercel.app/quick-11",
  ];
  return lines.join("\n");
}
