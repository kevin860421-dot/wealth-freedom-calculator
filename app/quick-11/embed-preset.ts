import type { LoanMethod } from "./logic";

/** 文內嵌／網址帶參時與主站 `/quick-11` 預設區隔的試算錨點 */
export type Quick11EmbedPreset = {
  loanAmount: number;
  annualRate: number;
  loanYears: number;
  monthlyIncome: number;
  extraMonthlyPayment?: number;
  lumpSumAmount?: number;
  /** 分頁 tab：0 首頁、1 本息…（見 view 內 pageTabs） */
  initialPage?: number;
  method?: LoanMethod;
};
