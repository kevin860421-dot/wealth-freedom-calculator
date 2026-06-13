"use client";

import { createContext, useContext } from "react";
import type { LoanMethod } from "./logic";

/** 安全氣囊「正常軌道」預設生活費 */
export const QUICK11_DEFAULT_MONTHLY_LIVING_EXPENSE = 15_000;

/** 「家庭新增成員」情境：基本生活費 + 育兒固定開銷示意 */
export const QUICK11_BABY_SCENARIO_LIVING_EXPENSE = 35_000;

export type Quick11InputStore = {
  loanAmount: number;
  annualRate: number;
  loanYears: number;
  monthlyIncome: number;
  /** 與首頁還款方式切換同步的首月月付 */
  method: LoanMethod;
  methodLabel: string;
  baselineMonthlyPayment: number;
};

export const Quick11InputContext = createContext<Quick11InputStore | null>(null);

export function useQuick11Input() {
  const ctx = useContext(Quick11InputContext);
  if (!ctx) throw new Error("Quick11InputContext not found");
  return ctx;
}
