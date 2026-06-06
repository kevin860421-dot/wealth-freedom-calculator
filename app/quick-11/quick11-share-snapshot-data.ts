import type { LoanMethod } from "./logic";

export type Quick11ShareSnapshotData = {
  loanAmount: number;
  annualRate: number;
  loanYears: number;
  monthlyIncome: number;
  method: LoanMethod;
  monthlyPayment: number;
  monthlyInterest: number;
  totalInterest: number;
  totalRepayment: number;
  dtiPct: number;
  warningLabel: string;
  warningMessage: string;
  warningWrapClass: string;
  warningMeterClass: string;
};
