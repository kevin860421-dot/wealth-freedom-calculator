/**
 * 表格計算公式驗證用 - 與 app/page.tsx 同步
 * 參考：二代健保 2.11%、54C 應稅基數、手續費 0.1425%
 */

export const NHI2_THRESHOLD = 20000;
export const NHI2_RATE = 0.0211;
export const TAX_CREDIT_RATE = 0.085;
export const TAX_CREDIT_CAP = 80000;
export const FEE_RATE = 0.001425;
export const FEE_MIN = 20;

export function getBuyFee(amount: number): number {
  if (amount <= 0) return 0;
  return Math.max(FEE_MIN, Math.round(amount * FEE_RATE));
}

export function getAfterTaxAndNhi2WithRate(
  grossPerPeriod: number,
  taxRate: number,
  applyNhi2: boolean,
  periodsPerYear: number,
  useCredit: boolean,
  ratio54C: number = 1
): { tax: number; nhi2: number; credit: number; net: number; taxableBase: number } {
  if (grossPerPeriod <= 0) return { tax: 0, nhi2: 0, credit: 0, net: grossPerPeriod, taxableBase: 0 };
  const taxableBase = grossPerPeriod * ratio54C;
  const TAX_THRESHOLD = 20000;

  if (taxableBase < TAX_THRESHOLD) {
    const nhi2 = applyNhi2 && taxableBase >= NHI2_THRESHOLD ? taxableBase * NHI2_RATE : 0;
    return { tax: 0, nhi2, credit: 0, net: Math.max(0, grossPerPeriod - nhi2), taxableBase };
  }

  const creditLimitPerPeriod = TAX_CREDIT_CAP / Math.max(1, periodsPerYear);
  const rawCredit = taxableBase * TAX_CREDIT_RATE;
  const credit = useCredit ? Math.min(rawCredit, creditLimitPerPeriod) : 0;
  const taxBeforeCredit = taxableBase * taxRate;
  const tax = Math.max(0, taxBeforeCredit - credit);
  const nhi2 = applyNhi2 && taxableBase >= NHI2_THRESHOLD ? taxableBase * NHI2_RATE : 0;
  const net = grossPerPeriod - tax - nhi2;
  return { tax, nhi2, credit, net, taxableBase };
}
