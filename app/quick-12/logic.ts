import { mergeTaxOnePayout } from "@/lib/dividend-tax-sandbox";
import { clampNum } from "@/lib/quick-calculator-math";

/** 本息平均攤還：每月應繳（與常見房貸／信貸公式一致） */
export function amortMonthlyPayment(principal: number, annualLoanRatePct: number, months: number): number {
  const p = Math.max(0, principal);
  const n = Math.max(1, Math.round(months));
  const r = clampNum(annualLoanRatePct, 0, 60) / 100 / 12;
  if (r <= 1e-14) return p / n;
  const pow = Math.pow(1 + r, n);
  return (p * r * pow) / (pow - 1);
}

export type LoanCostResult = {
  monthlyPayment: number;
  totalPaid: number;
  totalInterest: number;
  /** 本金同期以「月複利、每月孳息課稅」滾存之稅後終值（與大計算機 merge + 二代健保邏輯一致） */
  fvInvestNet: number;
  fvInvestGross: number;
  sumTaxOnGains: number;
  sumNhi2OnGains: number;
  /** 稅後機會利得 = 稅後終值 − 本金 */
  opportunityNetGain: number;
  /** 示意：已付利息 + 未投入本金之稅後機會利得 */
  headlineTotalCost: number;
};

/**
 * 投資路徑：每月以當月孳息套用 {@link mergeTaxOnePayout}（合併課稅 + 8.5% 抵減可選、二代健保 2.11%、單期 2 萬門檻）。
 * 與首頁簡化路徑一致：月複利一次。
 */
export function computeLoanCostScenario(input: {
  principal: number;
  periods: number;
  loanAnnualPct: number;
  investAnnualPct: number;
  marginalTaxRate: number;
  useDividendCredit: boolean;
}): LoanCostResult {
  const principal = Math.max(0, Math.round(input.principal));
  const n = Math.max(1, Math.round(input.periods));
  const monthlyPayment = amortMonthlyPayment(principal, input.loanAnnualPct, n);
  const totalPaid = monthlyPayment * n;
  const totalInterest = Math.max(0, totalPaid - principal);

  const rInv = clampNum(input.investAnnualPct, 0, 99) / 100 / 12;
  const taxR = clampNum(input.marginalTaxRate, 0, 50) / 100;
  let balNet = principal;
  let balGross = principal;
  let sumTax = 0;
  let sumNhi2 = 0;
  for (let m = 1; m <= n; m++) {
    const grossGain = balGross * rInv;
    balGross += grossGain;
    const { tax, nhi2, net } = mergeTaxOnePayout(grossGain, taxR, input.useDividendCredit, true, 12);
    sumTax += tax;
    sumNhi2 += nhi2;
    balNet += net;
  }
  const opportunityNetGain = Math.max(0, balNet - principal);
  const headlineTotalCost = totalInterest + opportunityNetGain;

  return {
    monthlyPayment,
    totalPaid,
    totalInterest,
    fvInvestNet: balNet,
    fvInvestGross: balGross,
    sumTaxOnGains: sumTax,
    sumNhi2OnGains: sumNhi2,
    opportunityNetGain,
    headlineTotalCost,
  };
}
