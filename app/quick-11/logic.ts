import { clampNum } from "@/lib/quick-calculator-math";

export type LoanMethod = "annuity" | "equalPrincipal";

export type PaymentRow = {
  period: number;
  principal: number;
  interest: number;
  payment: number;
  balance: number;
};

export type LoanCalcOutput = {
  annuityRows: PaymentRow[];
  equalPrincipalRows: PaymentRow[];
  annuityTotalInterest: number;
  equalPrincipalTotalInterest: number;
  annuityMonthlyPayment: number;
};

export function sanitizeCalcInput(s: string) {
  return s.replace(/[^\d+\-*/().,%\s]/g, "");
}

export function evaluateCalcInput(s: string): number | null {
  try {
    const cleaned = s.replace(/,/g, "").trim();
    if (!cleaned) return null;
    if (/[^0-9+\-*/().%\s]/.test(cleaned)) return null;
    const expr = cleaned.replace(/(\d+(?:\.\d+)?)\s*%/g, "($1/100)");
    const result = Function(`"use strict"; return (${expr});`)();
    const next = Number(result);
    if (!Number.isFinite(next)) return null;
    return next;
  } catch {
    return null;
  }
}

export function formatMoney(n: number) {
  const safe = Number.isFinite(n) ? n : 0;
  return Math.round(safe).toLocaleString("zh-TW");
}

function computeAnnuityRows(loanAmount: number, monthlyRate: number, periods: number): { rows: PaymentRow[]; monthly: number; totalInterest: number } {
  const rows: PaymentRow[] = [];
  if (loanAmount <= 0 || periods <= 0) return { rows, monthly: 0, totalInterest: 0 };

  const payment =
    monthlyRate <= 0
      ? loanAmount / periods
      : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, periods)) / (Math.pow(1 + monthlyRate, periods) - 1);

  let balance = loanAmount;
  let totalInterest = 0;

  for (let i = 1; i <= periods; i += 1) {
    const interest = monthlyRate <= 0 ? 0 : balance * monthlyRate;
    const rawPrincipal = payment - interest;
    const principal = i === periods ? balance : Math.min(balance, Math.max(0, rawPrincipal));
    const paid = principal + interest;
    balance = Math.max(0, balance - principal);
    totalInterest += interest;
    rows.push({
      period: i,
      principal,
      interest,
      payment: paid,
      balance,
    });
  }

  return { rows, monthly: payment, totalInterest };
}

function computeEqualPrincipalRows(loanAmount: number, monthlyRate: number, periods: number): { rows: PaymentRow[]; totalInterest: number } {
  const rows: PaymentRow[] = [];
  if (loanAmount <= 0 || periods <= 0) return { rows, totalInterest: 0 };

  const principalBase = loanAmount / periods;
  let balance = loanAmount;
  let totalInterest = 0;

  for (let i = 1; i <= periods; i += 1) {
    const interest = monthlyRate <= 0 ? 0 : balance * monthlyRate;
    const principal = i === periods ? balance : Math.min(balance, principalBase);
    const payment = principal + interest;
    balance = Math.max(0, balance - principal);
    totalInterest += interest;
    rows.push({
      period: i,
      principal,
      interest,
      payment,
      balance,
    });
  }

  return { rows, totalInterest };
}

export function buildLoanSchedules(loanAmount: number, annualRatePct: number, loanYears: number): LoanCalcOutput {
  const safeLoan = clampNum(loanAmount, 0, 500_000_000);
  const safeRate = clampNum(annualRatePct, 0, 50);
  const safeYears = Math.round(clampNum(loanYears, 1, 50));
  const periods = safeYears * 12;
  const monthlyRate = safeRate / 100 / 12;

  const annuity = computeAnnuityRows(safeLoan, monthlyRate, periods);
  const equalPrincipal = computeEqualPrincipalRows(safeLoan, monthlyRate, periods);

  return {
    annuityRows: annuity.rows,
    equalPrincipalRows: equalPrincipal.rows,
    annuityTotalInterest: annuity.totalInterest,
    equalPrincipalTotalInterest: equalPrincipal.totalInterest,
    annuityMonthlyPayment: annuity.monthly,
  };
}
