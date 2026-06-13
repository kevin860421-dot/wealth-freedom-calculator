import type { LoanCalcOutput, LoanMethod, PaymentRow } from "./logic";

/** 目前還款方式對應的完整攤還表 */
export function pickScheduleRows(output: LoanCalcOutput, method: LoanMethod): PaymentRow[] {
  return method === "annuity" ? output.annuityRows : output.equalPrincipalRows;
}

/** DTI／首期壓力：以第 1 期實際繳款為準 */
export function firstPeriodPayment(output: LoanCalcOutput, method: LoanMethod): number {
  return pickScheduleRows(output, method)[0]?.payment ?? 0;
}

export type MonthlyPaymentHeadline = {
  title: string;
  amount: number;
  hint: string;
  methodLabel: string;
  /** 本金平均：最末一期期款（展示用） */
  lastPeriodPayment?: number;
};

/**
 * 首頁／結果頁「每月繳款(第一期)」標題與主數字（單一來源）。
 * 金額一律以第 1 期實際繳款為準（DTI 同源）。
 */
export function monthlyPaymentHeadline(output: LoanCalcOutput, method: LoanMethod): MonthlyPaymentHeadline {
  const first = firstPeriodPayment(output, method);
  if (method === "annuity") {
    return {
      title: "每月繳款(第一期)",
      amount: first,
      hint: "本息均攤 · 每期相同",
      methodLabel: "本息均攤",
    };
  }
  const last = output.equalPrincipalRows.at(-1)?.payment ?? 0;
  return {
    title: "每月繳款(第一期)",
    amount: first,
    hint: `末月約 ${Math.round(last).toLocaleString("zh-TW")} · 逐月遞減`,
    methodLabel: "本金平均",
    lastPeriodPayment: last,
  };
}

export function monthlyPaymentTitleForMethod(_method: LoanMethod): string {
  return "每月繳款(第一期)";
}

export function formatPaymentMoney(amount: number): string {
  return `NT$ ${Math.round(amount).toLocaleString("zh-TW")}`;
}

/** 彈窗內切換還款方式時，依兩套攤還表重算標題與主數字 */
export function paymentHeadlineFromSchedules(
  annuityRows: PaymentRow[],
  equalPrincipalRows: PaymentRow[],
  method: LoanMethod,
): MonthlyPaymentHeadline {
  if (method === "annuity") {
    const first = annuityRows[0]?.payment ?? 0;
    return {
      title: "每月繳款(第一期)",
      amount: first,
      hint: "本息均攤 · 每期相同",
      methodLabel: "本息均攤",
    };
  }
  const first = equalPrincipalRows[0]?.payment ?? 0;
  const last = equalPrincipalRows.at(-1)?.payment ?? 0;
  return {
    title: "每月繳款(第一期)",
    amount: first,
    hint: `末月約 ${Math.round(last).toLocaleString("zh-TW")} · 逐月遞減`,
    methodLabel: "本金平均",
    lastPeriodPayment: last,
  };
}

export function scheduleRowsForMethod(
  annuityRows: PaymentRow[],
  equalPrincipalRows: PaymentRow[],
  method: LoanMethod,
): PaymentRow[] {
  return method === "annuity" ? annuityRows : equalPrincipalRows;
}
