/**
 * 單筆股利試算（教學用）：與 app/page.tsx 內 getAfterTaxAndNhi2 / getAfterTaxAndNhi2WithRate 邏輯一致。
 * 實際申報請以稅法與專業顧問為準。
 */

export const TAX_THRESHOLD = 20000;
export const SEPARATE_TAX_RATE = 0.28;
export const NHI2_THRESHOLD = 20000;
export const NHI2_RATE = 0.0211;
export const TAX_CREDIT_RATE = 0.085;
export const TAX_CREDIT_CAP_ANNUAL = 80000;

/** 分離課稅 28%：與 getAfterTaxAndNhi2 相同 */
export function separateTaxOnePayout(gross: number): { tax: number; nhi2: number; net: number } {
  if (gross <= 0) return { tax: 0, nhi2: 0, net: 0 };
  if (gross < TAX_THRESHOLD) return { tax: 0, nhi2: 0, net: gross };
  const tax = gross * SEPARATE_TAX_RATE;
  const nhi2 = gross >= NHI2_THRESHOLD ? gross * NHI2_RATE : 0;
  return { tax, nhi2, net: gross - tax - nhi2 };
}

/** 合併課稅 + 8.5% 抵減（可選）：與 getAfterTaxAndNhi2WithRate 相同假設，ratio54C=1 */
export function mergeTaxOnePayout(
  grossPerPeriod: number,
  marginalTaxRate: number,
  useCredit: boolean,
  applyNhi2: boolean,
  periodsPerYear: number
): { tax: number; nhi2: number; credit: number; net: number; taxableBase: number } {
  if (grossPerPeriod <= 0) {
    return { tax: 0, nhi2: 0, credit: 0, net: grossPerPeriod, taxableBase: 0 };
  }
  const taxableBase = grossPerPeriod;
  const ratio54C = 1;

  if (taxableBase * ratio54C < TAX_THRESHOLD) {
    const nhi2 =
      applyNhi2 && taxableBase * ratio54C >= NHI2_THRESHOLD ? taxableBase * ratio54C * NHI2_RATE : 0;
    return { tax: 0, nhi2, credit: 0, net: Math.max(0, grossPerPeriod - nhi2), taxableBase };
  }

  const creditLimitPerPeriod = TAX_CREDIT_CAP_ANNUAL / Math.max(1, periodsPerYear);
  const rawCredit = taxableBase * ratio54C * TAX_CREDIT_RATE;
  const credit = useCredit ? Math.min(rawCredit, creditLimitPerPeriod) : 0;
  const taxBeforeCredit = taxableBase * ratio54C * marginalTaxRate;
  const tax = Math.max(0, taxBeforeCredit - credit);
  const nhi2 =
    applyNhi2 && taxableBase * ratio54C >= NHI2_THRESHOLD ? taxableBase * ratio54C * NHI2_RATE : 0;
  const net = grossPerPeriod - tax - nhi2;
  return { tax, nhi2, credit, net, taxableBase };
}

export function fmtMoney(n: number): string {
  return Math.round(n).toLocaleString("zh-TW");
}
