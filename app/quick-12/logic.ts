/**
 * 第 12 台：實領薪資與稅務負擔（示意）
 * ─ 二代健保補充保費：與大計算機、`lib/dividend-tax-sandbox` 相同（單筆 ≥ 2 萬、整筆 × 2.11%）。
 * ─ 綜合所得稅：5%～40% 累進差額公式（與首頁 `TAX_BRACKETS`／萬級距 56／126／252／472 對齊之常見速算式）。
 * ─ 勞健保：投保薪資 ×（勞保自付 2.3% + 健保自付 1.6%）×12，投保薪資依級距上下限簡化夾取。
 */

import { NHI2_RATE, NHI2_THRESHOLD } from "@/lib/dividend-tax-sandbox";

/** 勞保／健保投保薪資常見上下限（示意，實務以當年度公告為準） */
export const INSURED_SALARY_MIN = 28590;
export const INSURED_SALARY_MAX = 252500;

export const LABOR_SELF_RATE = 0.023;
export const NHI_SELF_RATE = 0.016;

/**
 * 單身、採標準扣除之示意合計（非個案認定、非當年度唯一正解）：
 * 免稅額 97,000 ＋ 標準扣除 124,000 ＋ 薪資所得特別扣除 218,000 ＝ 439,000。
 * 綜所「所得淨額」＝ 全年毛所得 − 勞健保（自付）− 本合計；再丟進累進級距函數。
 */
export const SIMPLIFIED_EXEMPTION_AND_DEDUCTION = 97000 + 124000 + 218000;

export type SalaryTaxInput = {
  /** 月薪（當作投保薪資輸入） */
  monthlyInsuredSalary: number;
  /** 年終／獎金總額（假設單筆給付，用於二代健保門檻） */
  annualBonus: number;
  /** 兼職／股利等（假設單筆給付） */
  sideIncome: number;
};

export type SalaryTaxResult = {
  monthlySalaryInput: number;
  insuredMonthly: number;
  grossAnnual: number;
  annualLaborHealth: number;
  nhi2Bonus: number;
  nhi2Side: number;
  nhi2Total: number;
  afterLhAndNhi2Annual: number;
  /** 扣完當年勞健保與補充保費後，全年可保留現金 ÷12（尚未扣隔年綜所稅） */
  avgMonthlyAfterLhNhi2: number;
  taxableNetForIncomeTax: number;
  estimatedAnnualIncomeTax: number;
  finalNetAnnual: number;
  /** 勞健保 + 二代健保 + 綜所稅（示意「給政府／公保」） */
  governmentOutflowsAnnual: number;
};

/** 單筆給付二代健保補充保費（與 dividend-tax-sandbox 邏輯一致） */
export function nhi2SupplementalOnePayout(payout: number): number {
  const g = Math.max(0, payout);
  if (g < NHI2_THRESHOLD) return 0;
  return Math.round(g * NHI2_RATE);
}

/** 投保薪資：夾在級距上下限（低於下限時以下限試算勞健保，與實務「不得低於最低投保」之簡化一致） */
export function clampInsuredMonthlySalary(monthly: number): number {
  const m = Math.max(0, Math.round(monthly));
  if (m <= 0) return 0;
  return Math.min(INSURED_SALARY_MAX, Math.max(INSURED_SALARY_MIN, m));
}

/**
 * 綜合所得稅：累進差額公式（所得淨額 × 稅率 − 累進差額），級距與首頁 56／126／252／472 萬一致。
 */
export function progressiveIncomeTaxAnnual(taxableNet: number): number {
  const y = Math.max(0, Math.round(taxableNet));
  if (y <= 0) return 0;
  if (y <= 560_000) return Math.round(y * 0.05);
  if (y <= 1_260_000) return Math.round(y * 0.12 - 39_200);
  if (y <= 2_520_000) return Math.round(y * 0.2 - 140_000);
  if (y <= 4_720_000) return Math.round(y * 0.3 - 392_000);
  return Math.round(y * 0.4 - 864_000);
}

/** 單一標的：年現金配息入帳（示意一筆領）＋ 54C 占比（%），二代健保以 54C 計入金額與 2 萬比較（與大計算機一致）。 */
export type StockDividendRowInput = {
  annualGross: number;
  ratio54cPct: number;
};

export type StockDividendDetail = {
  annualGross: number;
  ratio54cPct: number;
  taxable54: number;
  nhi2: number;
};

export type CombinedSalaryStockResult = SalaryTaxResult & {
  stockGrossTotal: number;
  stockNhi2Total: number;
  stockDetails: StockDividendDetail[];
};

function nhi2FromTaxable54cBase(taxable54: number): number {
  const t = Math.max(0, taxable54);
  if (t < NHI2_THRESHOLD) return 0;
  return Math.round(t * NHI2_RATE);
}

/**
 * 月薪／獎金／兼職 + 多筆股票年配息（各筆單獨判斷二代健保門檻）；綜所稅仍以全年毛所得合併後簡化累進試算。
 */
export function computeCombinedSalaryAndStocks(
  salary: SalaryTaxInput,
  stocks: StockDividendRowInput[],
): CombinedSalaryStockResult {
  const monthlySalaryInput = Math.max(0, Math.round(salary.monthlyInsuredSalary));
  const bonus = Math.max(0, Math.round(salary.annualBonus));
  const side = Math.max(0, Math.round(salary.sideIncome));

  const insuredMonthly = clampInsuredMonthlySalary(monthlySalaryInput);

  const stockDetails: StockDividendDetail[] = stocks.map((s) => {
    const g = Math.max(0, Math.round(s.annualGross));
    const rPct = Math.min(100, Math.max(0, s.ratio54cPct));
    const r = rPct / 100;
    const taxable54 = g * r;
    const nhi2 = nhi2FromTaxable54cBase(taxable54);
    return { annualGross: g, ratio54cPct: rPct, taxable54, nhi2 };
  });
  const stockGrossTotal = stockDetails.reduce((a, d) => a + d.annualGross, 0);
  const stockNhi2Total = stockDetails.reduce((a, d) => a + d.nhi2, 0);

  const grossAnnual = monthlySalaryInput * 12 + bonus + side + stockGrossTotal;

  const monthlyLh = insuredMonthly * (LABOR_SELF_RATE + NHI_SELF_RATE);
  const annualLaborHealth = Math.round(monthlyLh * 12);

  const nhi2Bonus = nhi2SupplementalOnePayout(bonus);
  const nhi2Side = nhi2SupplementalOnePayout(side);
  const nhi2Total = nhi2Bonus + nhi2Side + stockNhi2Total;

  const afterLhAndNhi2Annual = Math.max(0, grossAnnual - annualLaborHealth - nhi2Total);
  const avgMonthlyAfterLhNhi2 = afterLhAndNhi2Annual / 12;

  const taxableNetForIncomeTax = Math.max(0, grossAnnual - annualLaborHealth - SIMPLIFIED_EXEMPTION_AND_DEDUCTION);
  const estimatedAnnualIncomeTax = progressiveIncomeTaxAnnual(taxableNetForIncomeTax);

  const finalNetAnnual = Math.max(0, grossAnnual - annualLaborHealth - nhi2Total - estimatedAnnualIncomeTax);
  const governmentOutflowsAnnual = annualLaborHealth + nhi2Total + estimatedAnnualIncomeTax;

  return {
    monthlySalaryInput,
    insuredMonthly,
    grossAnnual,
    annualLaborHealth,
    nhi2Bonus,
    nhi2Side,
    nhi2Total,
    afterLhAndNhi2Annual,
    avgMonthlyAfterLhNhi2,
    taxableNetForIncomeTax,
    estimatedAnnualIncomeTax,
    finalNetAnnual,
    governmentOutflowsAnnual,
    stockGrossTotal,
    stockNhi2Total,
    stockDetails,
  };
}

export function computeSalaryTaxBurden(input: SalaryTaxInput): SalaryTaxResult {
  const monthlySalaryInput = Math.max(0, Math.round(input.monthlyInsuredSalary));
  const bonus = Math.max(0, Math.round(input.annualBonus));
  const side = Math.max(0, Math.round(input.sideIncome));

  const insuredMonthly = clampInsuredMonthlySalary(monthlySalaryInput);
  const grossAnnual = monthlySalaryInput * 12 + bonus + side;

  const monthlyLh = insuredMonthly * (LABOR_SELF_RATE + NHI_SELF_RATE);
  const annualLaborHealth = Math.round(monthlyLh * 12);

  const nhi2Bonus = nhi2SupplementalOnePayout(bonus);
  const nhi2Side = nhi2SupplementalOnePayout(side);
  const nhi2Total = nhi2Bonus + nhi2Side;

  const afterLhAndNhi2Annual = Math.max(0, grossAnnual - annualLaborHealth - nhi2Total);
  const avgMonthlyAfterLhNhi2 = afterLhAndNhi2Annual / 12;

  // 綜所：簡化淨額 = 全年毛所得 − 勞健保 − 免稅與扣除常數（未逐項列舉補充保費於扣除額，保守示意）
  const taxableNetForIncomeTax = Math.max(0, grossAnnual - annualLaborHealth - SIMPLIFIED_EXEMPTION_AND_DEDUCTION);
  const estimatedAnnualIncomeTax = progressiveIncomeTaxAnnual(taxableNetForIncomeTax);

  const finalNetAnnual = Math.max(0, grossAnnual - annualLaborHealth - nhi2Total - estimatedAnnualIncomeTax);
  const governmentOutflowsAnnual = annualLaborHealth + nhi2Total + estimatedAnnualIncomeTax;

  return {
    monthlySalaryInput,
    insuredMonthly,
    grossAnnual,
    annualLaborHealth,
    nhi2Bonus,
    nhi2Side,
    nhi2Total,
    afterLhAndNhi2Annual,
    avgMonthlyAfterLhNhi2,
    taxableNetForIncomeTax,
    estimatedAnnualIncomeTax,
    finalNetAnnual,
    governmentOutflowsAnnual,
  };
}
