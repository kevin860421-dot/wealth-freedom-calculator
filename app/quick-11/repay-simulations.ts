import type { LoanMethod } from "./logic";

export type RepaymentScheduleRow = {
  period: number;
  principal: number;
  interest: number;
  payment: number;
  balance: number;
};

export function splitYearsMonths(totalMonths: number): { years: number; months: number } {
  const t = Math.max(0, Math.round(totalMonths));
  return { years: Math.floor(t / 12), months: t % 12 };
}

export function annuityMonthlyPayment(loanAmount: number, annualRate: number, loanYears: number) {
  const months = Math.max(1, Math.round(loanYears * 12));
  const monthlyRate = Math.max(0, annualRate) / 100 / 12;
  if (monthlyRate <= 0) return loanAmount / months;
  const factor = Math.pow(1 + monthlyRate, months);
  return (loanAmount * monthlyRate * factor) / (factor - 1);
}

/** 本息均攤下，指定期數內之總利息。 */
export function totalInterestAnnuityOverMonths(loanAmount: number, annualRatePct: number, amortMonths: number) {
  const mo = Math.max(0, Math.round(amortMonths));
  if (mo <= 0 || loanAmount <= 0) return 0;
  const years = mo / 12;
  const pmt = annuityMonthlyPayment(loanAmount, annualRatePct, years);
  return Math.max(0, pmt * mo - loanAmount);
}

/** 從第 startMonth 期（含）起，每月額外多還 extraMonthlyPayment。 */
export function simulateEarlyRepaymentFromMonth(
  loanAmount: number,
  annualRate: number,
  loanYears: number,
  extraMonthlyPayment: number,
  startMonth: number,
  baseMethod: LoanMethod = "annuity",
) {
  const monthlyRate = Math.max(0, annualRate) / 100 / 12;
  const months = Math.max(1, Math.round(loanYears * 12));
  const regularMonthly = annuityMonthlyPayment(loanAmount, annualRate, loanYears);
  const principalBase = loanAmount / months;
  const start = Math.max(1, Math.min(months, Math.round(startMonth)));
  const maxMonths = months * 2;
  let balance = Math.max(0, loanAmount);
  let paidMonths = 0;
  let totalInterest = 0;
  const rows: RepaymentScheduleRow[] = [];

  while (balance > 0 && paidMonths < maxMonths) {
    const period = paidMonths + 1;
    const extra = period >= start ? Math.max(0, extraMonthlyPayment) : 0;
    const interest = monthlyRate <= 0 ? 0 : balance * monthlyRate;
    const principalCandidate =
      baseMethod === "equalPrincipal"
        ? principalBase + extra
        : regularMonthly - interest + extra;
    const principal = Math.min(balance, Math.max(0, principalCandidate));
    if (principal <= 0 && interest <= 0) break;
    balance = Math.max(0, balance - principal);
    totalInterest += interest;
    paidMonths += 1;
    rows.push({
      period: paidMonths,
      principal,
      interest,
      payment: principal + interest,
      balance,
    });
  }

  return { months: paidMonths, totalInterest, rows };
}

/** 在第 lumpAtMonth 期（含該期還款後）一筆大額還本。 */
export function simulateLumpSumAtMonth(
  loanAmount: number,
  annualRate: number,
  loanYears: number,
  lumpSum: number,
  lumpAtMonth: number,
  baseMethod: LoanMethod = "annuity",
) {
  const monthlyRate = Math.max(0, annualRate) / 100 / 12;
  const months = Math.max(1, Math.round(loanYears * 12));
  const regularMonthly = annuityMonthlyPayment(loanAmount, annualRate, loanYears);
  const principalBase = loanAmount / months;
  const lumpAt = Math.max(1, Math.min(months, Math.round(lumpAtMonth)));
  const lump = Math.min(Math.max(0, lumpSum), loanAmount);
  const maxMonths = months * 2;
  let balance = Math.max(0, loanAmount);
  let paidMonths = 0;
  let totalInterest = 0;
  const rows: RepaymentScheduleRow[] = [];

  while (balance > 0 && paidMonths < maxMonths) {
    const period = paidMonths + 1;
    const interest = monthlyRate <= 0 ? 0 : balance * monthlyRate;
    const principalCandidate =
      baseMethod === "equalPrincipal" ? principalBase : regularMonthly - interest;
    let principal = Math.min(balance, Math.max(0, principalCandidate));
    balance = Math.max(0, balance - principal);
    if (period === lumpAt && lump > 0) {
      const applied = Math.min(balance, lump);
      balance -= applied;
      principal += applied;
    }
    if (principal <= 0 && interest <= 0 && balance <= 0) break;
    totalInterest += interest;
    paidMonths += 1;
    rows.push({
      period: paidMonths,
      principal,
      interest,
      payment: principal + interest,
      balance,
    });
  }

  return { months: paidMonths, totalInterest, rows };
}

/** 向後相容：第 1 期起即額外還款。 */
export function simulateEarlyRepayment(
  loanAmount: number,
  annualRate: number,
  loanYears: number,
  extraMonthlyPayment: number,
  baseMethod: LoanMethod = "annuity",
) {
  return simulateEarlyRepaymentFromMonth(
    loanAmount,
    annualRate,
    loanYears,
    extraMonthlyPayment,
    1,
    baseMethod,
  );
}

/** 向後相容：貸款起始時一筆還本。 */
export function simulateLumpSumRepayment(
  loanAmount: number,
  annualRate: number,
  loanYears: number,
  lumpSum: number,
  baseMethod: LoanMethod = "annuity",
) {
  return simulateLumpSumAtMonth(loanAmount, annualRate, loanYears, lumpSum, 1, baseMethod);
}

export function computeGraceDelayMetrics(
  loanAmount: number,
  annualRate: number,
  loanYears: number,
  graceEffectiveMonths: number,
  baselineTotalInterest: number,
  baselineMonthlyPayment: number,
) {
  const baselineMonths = Math.max(1, Math.round(loanYears * 12));
  const G = graceEffectiveMonths;
  const m = Math.max(0, annualRate) / 100 / 12;
  const interestDuringGrace = G * loanAmount * m;
  const amortMonths = Math.max(1, baselineMonths - G);
  const amortTotalInt = totalInterestAnnuityOverMonths(loanAmount, annualRate, amortMonths);
  const graceTotalInt = interestDuringGrace + amortTotalInt;
  const interestIncrease = Math.max(0, Math.round(graceTotalInt - baselineTotalInterest));
  const afterGraceMonthly = annuityMonthlyPayment(loanAmount, annualRate, amortMonths / 12);
  const paymentIncrease = Math.max(0, Math.round(afterGraceMonthly - baselineMonthlyPayment));
  const interestOnlyMonthly = loanAmount * m;
  const paymentIncreasePct =
    baselineMonthlyPayment > 0 ? (paymentIncrease / baselineMonthlyPayment) * 100 : 0;

  return {
    interestIncrease,
    paymentIncrease,
    paymentIncreasePct,
    planAMonthly: Math.round(baselineMonthlyPayment),
    planATotalInterest: Math.round(baselineTotalInterest),
    planBInterestOnlyMonthly: Math.round(interestOnlyMonthly),
    planBAfterGraceMonthly: Math.round(afterGraceMonthly),
    planBTotalInterest: Math.round(graceTotalInt),
    amortMonths,
    graceYears: G / 12,
  };
}
