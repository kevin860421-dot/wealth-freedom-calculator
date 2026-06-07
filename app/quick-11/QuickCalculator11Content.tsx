"use client";

import Link from "next/link";
import { AnimatePresence, animate, motion } from "framer-motion";
import { QuickBlogLinksToggle } from "@/app/components/quick-blog-links-toggle";
import { QuickDualLineChart } from "@/app/components/quick-dual-line-chart";
import { QuickSeoArticle } from "@/app/components/quick-seo-article";
import { QuickSeoExtras } from "@/app/components/quick-seo-extras";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { buildLoanSchedules, evaluateCalcInput, formatMoney, type LoanMethod, type PaymentRow } from "./logic";
import { QUICK11_LOAN_PRESETS } from "./loan-scenarios";
import type { Quick11EmbedPreset } from "./embed-preset";
import goldStat from "./quick-11-golden-stat.module.css";
import { buildRateShowdownRows } from "./rate-showdown";
import { RateShowdownModal } from "./rate-showdown-modal";
import { RateShowdownTeaser } from "./rate-showdown-teaser";
import { Quick11BottomToolsCard } from "./quick11-bottom-tools-card";
import { Quick11ExcelLeadBlock } from "./quick11-excel-lead-block";
import { Quick11ExcelWizardModal } from "./quick11-excel-wizard-modal";
import { Quick11ExitIntentModal } from "./quick11-exit-intent-modal";
import { Quick11IdleNudgeCard } from "./quick11-idle-nudge-card";
import { migrateQuick11SessionBundleIfNeeded } from "./quick11-session-migrate";
import { useQuick11IdleNudge } from "./use-quick11-idle-nudge";
import {
  Quick11ShareSnapshotCapture,
  useQuick11ShareSnapshotRef,
  type Quick11ShareSnapshotData,
} from "./quick11-share-snapshot";

type Quick11InputStore = {
  loanAmount: number;
  annualRate: number;
  loanYears: number;
  monthlyIncome: number;
};

type LoanPresetAction = {
  key: string;
  icon: string;
  label: string;
  amount: number;
  annualRate: number;
  years: number;
  monthlyIncome: number;
};

type EarlyRepaymentRow = {
  period: number;
  principal: number;
  interest: number;
  payment: number;
  balance: number;
};

const Quick11InputContext = createContext<Quick11InputStore | null>(null);

function useQuick11Input() {
  const ctx = useContext(Quick11InputContext);
  if (!ctx) throw new Error("Quick11InputContext not found");
  return ctx;
}

function sanitizeCalcInputLite(s: string) {
  return s.replace(/[^\d+\-*/().,%\s]/g, "");
}

function parseAndClamp(raw: string, fallback: number, min: number, max: number, integer = false) {
  const parsed = evaluateCalcInput(raw);
  if (parsed === null) return fallback;
  const next = Math.min(max, Math.max(min, parsed));
  return integer ? Math.round(next) : Number(next.toFixed(2));
}

/** 與 `embed-preset`／mini-blog 嵌入一致：允許機車貸、學貸等小額本金。 */
const LOAN_PRINCIPAL_MIN = 50_000;
const LOAN_PRINCIPAL_MAX = 50_000_000;

/** 寬限期年／月獨立儲存；總月數不得超過 cap（必要時只壓 m，年不變；年變時只壓 m）。 */
function clampGraceYM(yIn: number, mIn: number, cap: number): { y: number; m: number } {
  let y = Math.max(0, Math.floor(yIn));
  let m = Math.max(0, Math.floor(mIn));
  if (cap <= 0) return { y: 0, m: 0 };
  if (y * 12 + m > cap) {
    m = cap - y * 12;
    while (m < 0 && y > 0) {
      y -= 1;
      m = cap - y * 12;
    }
    if (m < 0) return { y: 0, m: 0 };
  }
  return { y, m };
}

/** 總月數轉成「整年＋餘月（0～11）」，供 ±／輸入 commit 與試算一致。 */
function graceTotalToYM(totalMonths: number, cap: number): { y: number; m: number } {
  const t = Math.min(cap, Math.max(0, Math.round(totalMonths)));
  return { y: Math.floor(t / 12), m: t % 12 };
}

/** 寬限期 ±：觸控裝置避免 :hover 黏著；僅在精細指標＋可 hover 時顯示 hover 底。 */
const graceStepperBtnBase =
  "flex min-h-[1.75rem] flex-1 items-center justify-center border-0 bg-transparent px-1 py-1 text-[14px] font-black leading-none tracking-tight transition select-none [-webkit-tap-highlight-color:transparent] disabled:opacity-40";
const graceStepperBtnLight = `${graceStepperBtnBase} text-slate-900 active:bg-slate-200 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-slate-100`;
const graceStepperBtnDark = `${graceStepperBtnBase} text-lime-300 active:bg-white/15 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/10`;

function annuityMonthlyPayment(loanAmount: number, annualRate: number, loanYears: number) {
  const months = Math.max(1, Math.round(loanYears * 12));
  const monthlyRate = Math.max(0, annualRate) / 100 / 12;
  if (monthlyRate <= 0) return loanAmount / months;
  const factor = Math.pow(1 + monthlyRate, months);
  return (loanAmount * monthlyRate * factor) / (factor - 1);
}

/** 本息均攤下，指定期數內之總利息（期數攤還、不計寬限期）。 */
function totalInterestAnnuityOverMonths(loanAmount: number, annualRatePct: number, amortMonths: number) {
  const mo = Math.max(0, Math.round(amortMonths));
  if (mo <= 0 || loanAmount <= 0) return 0;
  const years = mo / 12;
  const pmt = annuityMonthlyPayment(loanAmount, annualRatePct, years);
  return Math.max(0, pmt * mo - loanAmount);
}

/** 舉例區「約 X 萬」：月付用小數、總利息偏好整數萬。 */
function formatWanYuanCompare(n: number, mode: "monthly" | "interestTotal") {
  if (!Number.isFinite(n) || n < 0) return "—";
  const w = n / 10_000;
  if (mode === "interestTotal") return `${Math.round(w)}`;
  if (w >= 100) return `${Math.round(w)}`;
  const t = Math.round(w * 10) / 10;
  return Number.isInteger(t) ? `${t}` : `${t.toFixed(1)}`.replace(/\.0$/, "");
}

function buildInterestPkSeries(annuityRows: PaymentRow[], equalRows: PaymentRow[]) {
  const periods = Math.min(annuityRows.length, equalRows.length);
  const yearCount = Math.max(1, Math.ceil(periods / 12));
  const years: number[] = [];
  const annuityCum: number[] = [];
  const equalCum: number[] = [];
  let annuitySum = 0;
  let equalSum = 0;

  for (let y = 1; y <= yearCount; y += 1) {
    const endPeriod = Math.min(periods, y * 12);
    for (let p = (y - 1) * 12; p < endPeriod; p += 1) {
      annuitySum += annuityRows[p]?.interest ?? 0;
      equalSum += equalRows[p]?.interest ?? 0;
    }
    years.push(y);
    annuityCum.push(Math.round(annuitySum));
    equalCum.push(Math.round(equalSum));
  }

  return { years, annuityCum, equalCum };
}

function simulateEarlyRepayment(loanAmount: number, annualRate: number, loanYears: number, extraMonthlyPayment: number, baseMethod: LoanMethod = "annuity") {
  const monthlyRate = Math.max(0, annualRate) / 100 / 12;
  const months = Math.max(1, Math.round(loanYears * 12));
  const regularMonthly = annuityMonthlyPayment(loanAmount, annualRate, loanYears);
  const principalBase = loanAmount / months;
  const maxMonths = months * 2;
  let balance = Math.max(0, loanAmount);
  let paidMonths = 0;
  let totalInterest = 0;
  const rows: EarlyRepaymentRow[] = [];

  while (balance > 0 && paidMonths < maxMonths) {
    const interest = monthlyRate <= 0 ? 0 : balance * monthlyRate;
    const principalCandidate =
      baseMethod === "equalPrincipal"
        ? principalBase + Math.max(0, extraMonthlyPayment)
        : regularMonthly - interest + Math.max(0, extraMonthlyPayment);
    const principal = Math.min(balance, Math.max(0, principalCandidate));
    if (principal <= 0) break;
    balance -= principal;
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

  return {
    months: paidMonths,
    totalInterest,
    rows,
  };
}

/** 貸款起始時單筆還本（扣減本金後，仍沿用原合約月付／原本金攤還節奏直至結清）。 */
function simulateLumpSumRepayment(loanAmount: number, annualRate: number, loanYears: number, lumpSum: number, baseMethod: LoanMethod = "annuity") {
  const monthlyRate = Math.max(0, annualRate) / 100 / 12;
  const months = Math.max(1, Math.round(loanYears * 12));
  const regularMonthly = annuityMonthlyPayment(loanAmount, annualRate, loanYears);
  const principalBase = loanAmount / months;
  const lump = Math.min(Math.max(0, lumpSum), loanAmount);
  const maxMonths = months * 2;
  let balance = Math.max(0, loanAmount - lump);
  let paidMonths = 0;
  let totalInterest = 0;
  const rows: EarlyRepaymentRow[] = [];

  while (balance > 0 && paidMonths < maxMonths) {
    const interest = monthlyRate <= 0 ? 0 : balance * monthlyRate;
    const principalCandidate =
      baseMethod === "equalPrincipal" ? principalBase : regularMonthly - interest;
    const principal = Math.min(balance, Math.max(0, principalCandidate));
    if (principal <= 0) break;
    balance -= principal;
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

  return {
    months: paidMonths,
    totalInterest,
    rows,
  };
}

export type { Quick11EmbedPreset } from "./embed-preset";

export function QuickCalculator11Content({
  embeddedInMiniBlog = false,
  initialEmbedPreset,
  initialWizardOpen = false,
}: {
  /** 迷你部落格文內試算：不顯示延伸文章折疊，並收斂 main 高度避免底部留白 */
  embeddedInMiniBlog?: boolean;
  /** 與 mini-blog slug／`loan-scenarios` 對齊之文內試算錨點 */
  initialEmbedPreset?: Quick11EmbedPreset;
  /** `?wizard=1` 進站即打開四步驟彈窗 */
  initialWizardOpen?: boolean;
} = {}) {
  const anchor = initialEmbedPreset;

  const [loanAmount, setLoanAmount] = useState(() => anchor?.loanAmount ?? 12_000_000);
  const [loanAmountText, setLoanAmountText] = useState(() => formatMoney(anchor?.loanAmount ?? 12_000_000));
  const [annualRate, setAnnualRate] = useState(() => anchor?.annualRate ?? 2.2);
  const [annualRateText, setAnnualRateText] = useState(() => String(anchor?.annualRate ?? 2.2));
  const [loanYears, setLoanYears] = useState(() => anchor?.loanYears ?? 30);
  const [loanYearsText, setLoanYearsText] = useState(() => String(anchor?.loanYears ?? 30));
  const [monthlyIncome, setMonthlyIncome] = useState(() => anchor?.monthlyIncome ?? 80_000);
  const [monthlyIncomeText, setMonthlyIncomeText] = useState(() => formatMoney(anchor?.monthlyIncome ?? 80_000));

  const [method, setMethod] = useState<LoanMethod>("annuity");
  const [currentPage, setCurrentPage] = useState(() => {
    const tab = anchor?.initialPage;
    if (tab == null || !Number.isFinite(tab)) return 0;
    const t = Math.round(tab);
    if (t < 0 || t > 8) return 0;
    return t;
  });
  const [pageDirection, setPageDirection] = useState(0);
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState(10_000);
  const [earlyRepayMethod, setEarlyRepayMethod] = useState<LoanMethod>("annuity");
  const [lumpSumAmount, setLumpSumAmount] = useState(1_000_000);
  const [lumpSumText, setLumpSumText] = useState(formatMoney(1_000_000));
  const [lumpSumMethod, setLumpSumMethod] = useState<LoanMethod>("equalPrincipal");
  const [graceYM, setGraceYM] = useState({ y: 3, m: 6 });
  const [graceYearsText, setGraceYearsText] = useState("3");
  const [graceMonthsPartText, setGraceMonthsPartText] = useState("6");
  const [rateShockPctVal, setRateShockPctVal] = useState(0);
  const [rateShockPctText, setRateShockPctText] = useState("0");
  const [stockVsInvestPctVal, setStockVsInvestPctVal] = useState(7);
  const [stockVsInvestPctText, setStockVsInvestPctText] = useState("7");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [rateShowdownOpen, setRateShowdownOpen] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(initialWizardOpen);

  useEffect(() => {
    migrateQuick11SessionBundleIfNeeded();
  }, []);

  const incomeInputRef = useRef<HTMLInputElement | null>(null);
  const loanInputRef = useRef<HTMLInputElement | null>(null);
  const rateInputRef = useRef<HTMLInputElement | null>(null);
  const yearsInputRef = useRef<HTMLInputElement | null>(null);
  const tabButtonRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  useEffect(() => {
    document.documentElement.setAttribute("data-quick11-updated-at", String(Date.now()));
  }, [
    loanAmount,
    annualRate,
    loanYears,
    monthlyIncome,
    extraMonthlyPayment,
    lumpSumAmount,
    graceYM.y,
    graceYM.m,
    rateShockPctVal,
    stockVsInvestPctVal,
  ]);

  useEffect(() => {
    const capped = Math.min(Math.max(0, lumpSumAmount), loanAmount);
    if (capped !== lumpSumAmount) setLumpSumAmount(capped);
    setLumpSumText(formatMoney(capped));
  }, [loanAmount]);

  const output = useMemo(() => buildLoanSchedules(loanAmount, annualRate, loanYears), [loanAmount, annualRate, loanYears]);
  const rateShowdownRows = useMemo(
    () => buildRateShowdownRows(loanAmount, loanYears, annualRate, method),
    [loanAmount, loanYears, annualRate, method],
  );
  const rateShowdownMethodLabel = method === "annuity" ? "本息均攤" : "本金平均";
  const rows = method === "annuity" ? output.annuityRows : output.equalPrincipalRows;
  const firstPayment = rows[0]?.payment ?? 0;
  const dtiRatio = monthlyIncome <= 0 ? 1 : firstPayment / monthlyIncome;
  const dtiPct = Math.max(0, dtiRatio * 100);

  const prepayResultAnnuity = useMemo(
    () => simulateEarlyRepayment(loanAmount, annualRate, loanYears, extraMonthlyPayment, "annuity"),
    [loanAmount, annualRate, loanYears, extraMonthlyPayment],
  );
  const prepayResultEqual = useMemo(
    () => simulateEarlyRepayment(loanAmount, annualRate, loanYears, extraMonthlyPayment, "equalPrincipal"),
    [loanAmount, annualRate, loanYears, extraMonthlyPayment],
  );
  const prepayResult = earlyRepayMethod === "annuity" ? prepayResultAnnuity : prepayResultEqual;
  const baselineMonths = Math.max(1, Math.round(loanYears * 12));
  const graceMaxMonths = Math.max(0, baselineMonths - 1);

  useEffect(() => {
    setGraceYM((prev) => graceTotalToYM(prev.y * 12 + prev.m, graceMaxMonths));
  }, [graceMaxMonths]);

  useEffect(() => {
    setGraceYearsText(String(graceYM.y));
    setGraceMonthsPartText(String(graceYM.m));
  }, [graceYM.y, graceYM.m]);
  const prepaySavedInterest = Math.max(0, output.annuityTotalInterest - prepayResultAnnuity.totalInterest);
  const prepaySavedMonths = Math.max(0, baselineMonths - prepayResultAnnuity.months);
  const earlyBaseInterest = earlyRepayMethod === "annuity" ? output.annuityTotalInterest : output.equalPrincipalTotalInterest;
  const earlySavedInterest = Math.max(0, earlyBaseInterest - prepayResult.totalInterest);
  const earlySavedMonths = Math.max(0, baselineMonths - prepayResult.months);
  const earlyBaseRows = earlyRepayMethod === "annuity" ? output.annuityRows : output.equalPrincipalRows;
  const shockedAnnualRate = annualRate + rateShockPctVal;
  const shockedOutput = useMemo(() => buildLoanSchedules(loanAmount, shockedAnnualRate, loanYears), [loanAmount, shockedAnnualRate, loanYears]);
  const shockedInterestIncrease = Math.max(0, shockedOutput.annuityTotalInterest - output.annuityTotalInterest);
  const freedomProjected = useMemo(() => prepaySavedInterest * Math.pow(1 + 0.07, 20), [prepaySavedInterest]);
  const earlyFreedomProjected = useMemo(() => earlySavedInterest * Math.pow(1 + 0.07, 20), [earlySavedInterest]);

  const lumpEffective = Math.min(Math.max(0, lumpSumAmount), loanAmount);
  const lumpResultAnnuity = useMemo(
    () => simulateLumpSumRepayment(loanAmount, annualRate, loanYears, lumpEffective, "annuity"),
    [loanAmount, annualRate, loanYears, lumpEffective],
  );
  const lumpResultEqual = useMemo(
    () => simulateLumpSumRepayment(loanAmount, annualRate, loanYears, lumpEffective, "equalPrincipal"),
    [loanAmount, annualRate, loanYears, lumpEffective],
  );
  const lumpResult = lumpSumMethod === "annuity" ? lumpResultAnnuity : lumpResultEqual;
  const lumpBaseInterest = lumpSumMethod === "annuity" ? output.annuityTotalInterest : output.equalPrincipalTotalInterest;
  const lumpBaseRows = lumpSumMethod === "annuity" ? output.annuityRows : output.equalPrincipalRows;
  const lumpSavedInterest = Math.max(0, lumpBaseInterest - lumpResult.totalInterest);
  const lumpSavedMonths = Math.max(0, baselineMonths - lumpResult.months);
  const lumpFreedomProjected = useMemo(() => lumpSavedInterest * Math.pow(1 + 0.07, 20), [lumpSavedInterest]);

  /** 各種貸款 vs 存股：同額本金、複利，報酬僅指增值（不含本金）；與本金平均總利息對照（常見情境試算）。 */
  const stockVsLoanEstimatedGain = useMemo(() => {
    const years = Math.max(0, loanYears);
    const principal = Math.max(0, loanAmount);
    if (principal <= 0 || years <= 0) return 0;
    const r = stockVsInvestPctVal / 100;
    return Math.round(principal * (Math.pow(1 + r, years) - 1));
  }, [loanAmount, loanYears, stockVsInvestPctVal]);
  const stockVsLoanInterestBaseline = output.equalPrincipalTotalInterest;
  const stockVsLoanPreferInvest = stockVsLoanEstimatedGain > stockVsLoanInterestBaseline;

  const lumpSliderStep =
    loanAmount <= 300_000 ? 5_000 : loanAmount <= 1_500_000 ? 10_000 : loanAmount <= 8_000_000 ? 50_000 : 100_000;
  const lumpBumpStep =
    loanAmount <= 300_000 ? 5_000 : loanAmount <= 1_500_000 ? 10_000 : loanAmount <= 8_000_000 ? 50_000 : 100_000;

  const commitLumpSumInput = () => {
    const next = parseAndClamp(lumpSumText, lumpSumAmount, 0, loanAmount, true);
    setLumpSumAmount(next);
    setLumpSumText(formatMoney(next));
  };

  const bumpLumpSum = (delta: number) => {
    const base = parseAndClamp(lumpSumText, lumpSumAmount, 0, loanAmount, true);
    const bumped = Math.min(loanAmount, Math.max(0, Math.round(base + delta)));
    setLumpSumAmount(bumped);
    setLumpSumText(formatMoney(bumped));
  };

  const graceMonthsAmount = graceYM.y * 12 + graceYM.m;
  const graceEffectiveMonths = Math.min(graceMonthsAmount, graceMaxMonths);
  /** 「年」拉條 max 不依賴餘月，避免 controlled range 隨另一欄變動而誤跳／連動。 */
  const graceYearsSliderMax = Math.max(0, Math.floor(graceMaxMonths / 12));
  const graceYearsSliderValue = graceYM.y;
  /** 「月」為 0～11 之餘月；上限為剩餘可給餘月的期數（至多 11）。 */
  const graceMonthsSliderMax = Math.max(0, Math.min(11, graceMaxMonths - graceYM.y * 12));
  const graceMonthsSliderValue = graceYM.m;
  const graceDelayMetrics = useMemo(() => {
    const G = graceEffectiveMonths;
    const m = Math.max(0, annualRate) / 100 / 12;
    const baselineTotalInt = output.annuityTotalInterest;
    const interestDuringGrace = G * loanAmount * m;
    const amortMonths = Math.max(1, baselineMonths - G);
    const amortTotalInt = totalInterestAnnuityOverMonths(loanAmount, annualRate, amortMonths);
    const graceTotalInt = interestDuringGrace + amortTotalInt;
    const interestIncrease = Math.max(0, Math.round(graceTotalInt - baselineTotalInt));
    const baselineMonthly = output.annuityMonthlyPayment;
    const afterGraceMonthly = annuityMonthlyPayment(loanAmount, annualRate, amortMonths / 12);
    const paymentIncrease = Math.max(0, Math.round(afterGraceMonthly - baselineMonthly));
    const interestOnlyMonthly = loanAmount * m;
    return {
      interestIncrease,
      paymentIncrease,
      planAMonthly: Math.round(baselineMonthly),
      planATotalInterest: Math.round(baselineTotalInt),
      planBInterestOnlyMonthly: Math.round(interestOnlyMonthly),
      planBAfterGraceMonthly: Math.round(afterGraceMonthly),
      planBTotalInterest: Math.round(graceTotalInt),
      amortMonths,
    };
  }, [graceEffectiveMonths, annualRate, loanAmount, baselineMonths, output.annuityTotalInterest, output.annuityMonthlyPayment]);

  const commitGraceYearsField = () => {
    const y = parseAndClamp(graceYearsText, graceYM.y, 0, 600, true);
    const m = parseAndClamp(graceMonthsPartText, graceYM.m, 0, graceMaxMonths, true);
    const rawTotal = Math.min(graceMaxMonths, Math.max(0, y * 12 + m));
    setGraceYM(graceTotalToYM(rawTotal, graceMaxMonths));
  };

  const commitGraceMonthsPartField = () => {
    const y = parseAndClamp(graceYearsText, graceYM.y, 0, 600, true);
    const m = parseAndClamp(graceMonthsPartText, graceYM.m, 0, graceMaxMonths, true);
    const rawTotal = Math.min(graceMaxMonths, Math.max(0, y * 12 + m));
    setGraceYM(graceTotalToYM(rawTotal, graceMaxMonths));
  };

  const bumpGraceYears = (deltaYears: number) => {
    setGraceYM((prev) =>
      graceTotalToYM(prev.y * 12 + prev.m + deltaYears * 12, graceMaxMonths),
    );
  };

  const bumpGraceMonthsPart = (deltaMonths: number) => {
    setGraceYM((prev) => graceTotalToYM(prev.y * 12 + prev.m + deltaMonths, graceMaxMonths));
  };

  const warning = useMemo(() => {
    if (dtiRatio < 0.35) {
      return {
        label: "安全區",
        message: "銀行還不是你家，先守住現金流再談加碼。",
        wrapClass: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
        meterClass: "bg-emerald-400",
      };
    }
    if (dtiRatio <= 0.5) {
      return {
        label: "壓力偏高",
        message: "你正在為房東與銀行打工，建議優先降月付壓力。",
        wrapClass: "border-amber-500/50 bg-amber-500/10 text-amber-200",
        meterClass: "bg-amber-400",
      };
    }
    return {
      label: "破產預警",
      message: "準備吃土。先減貸款、拉高自備款，或改走財富自由方案。",
      wrapClass: "border-red-500/70 bg-red-500/15 text-red-100",
      meterClass: "bg-red-500",
    };
  }, [dtiRatio]);

  const initialLoanParamsRef = useRef({
    loanAmount: anchor?.loanAmount ?? 12_000_000,
    annualRate: anchor?.annualRate ?? 2.2,
    loanYears: anchor?.loanYears ?? 30,
    monthlyIncome: anchor?.monthlyIncome ?? 80_000,
  });
  const [pagesViewedCount, setPagesViewedCount] = useState(1);
  const pagesSeenRef = useRef(
    new Set<number>([
      (() => {
        const tab = anchor?.initialPage;
        if (tab == null || !Number.isFinite(tab)) return 0;
        const t = Math.round(tab);
        return t >= 0 && t <= 8 ? t : 0;
      })(),
    ]),
  );
  const [detailDeepUsed, setDetailDeepUsed] = useState(false);

  useEffect(() => {
    const seen = pagesSeenRef.current;
    if (seen.has(currentPage)) return;
    seen.add(currentPage);
    setPagesViewedCount(seen.size);
  }, [currentPage]);

  useEffect(() => {
    if (isSheetOpen || rateShowdownOpen) setDetailDeepUsed(true);
  }, [isSheetOpen, rateShowdownOpen]);

  const nudgeEngagement = useMemo(() => {
    const init = initialLoanParamsRef.current;
    return {
      isHighDtiWarning: dtiRatio >= 0.35,
      deepTabCompare: pagesViewedCount >= 2,
      paramsTouched:
        loanAmount !== init.loanAmount ||
        annualRate !== init.annualRate ||
        loanYears !== init.loanYears ||
        monthlyIncome !== init.monthlyIncome,
      detailDeepUsed,
    };
  }, [dtiRatio, pagesViewedCount, loanAmount, annualRate, loanYears, monthlyIncome, detailDeepUsed]);

  const idleNudge = useQuick11IdleNudge({
    enabled: !embeddedInMiniBlog,
    wizardOpen,
    engagement: nudgeEngagement,
  });

  const shareSnapshotRef = useQuick11ShareSnapshotRef();
  const shareSnapshotData = useMemo<Quick11ShareSnapshotData>(
    () => ({
      loanAmount,
      annualRate,
      loanYears,
      monthlyIncome,
      method,
      monthlyPayment:
        method === "annuity" ? (output.annuityRows[0]?.payment ?? 0) : (output.equalPrincipalRows[0]?.payment ?? 0),
      monthlyInterest: rows[0]?.interest ?? 0,
      totalInterest: method === "annuity" ? output.annuityTotalInterest : output.equalPrincipalTotalInterest,
      totalRepayment:
        loanAmount + (method === "annuity" ? output.annuityTotalInterest : output.equalPrincipalTotalInterest),
      dtiPct,
      warningLabel: warning.label,
      warningMessage: warning.message,
      warningWrapClass: warning.wrapClass,
      warningMeterClass: warning.meterClass,
    }),
    [
      loanAmount,
      annualRate,
      loanYears,
      monthlyIncome,
      method,
      output.annuityRows,
      output.equalPrincipalRows,
      output.annuityTotalInterest,
      output.equalPrincipalTotalInterest,
      rows,
      dtiPct,
      warning.label,
      warning.message,
      warning.wrapClass,
      warning.meterClass,
    ],
  );

  const topInterestPeriods = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      const ra = a.payment <= 0 ? 0 : a.interest / a.payment;
      const rb = b.payment <= 0 ? 0 : b.interest / b.payment;
      return rb - ra;
    });
    return new Set(sorted.slice(0, Math.min(12, sorted.length)).map((row) => row.period));
  }, [rows]);

  const pageTabs = [
    { id: 0, title: "首頁", hint: "總覽" },
    { id: 1, title: "本息均攤", hint: "穩定但利息高" },
    { id: 2, title: "本金平均", hint: "內行人首選，利息最省" },
    { id: 3, title: "提前還款", hint: "贖回自由加速器" },
    { id: 4, title: "大額還款", hint: "單筆還本情境" },
    { id: 5, title: "延遲還款代價", hint: "晚還的利息成本" },
    { id: 6, title: "各種貸款 vs 存股", hint: "槓桿與報酬對照" },
    { id: 7, title: "風險模擬", hint: "升息壓力測試" },
    { id: 8, title: "財富翻轉", hint: "省下利息變資產" },
  ] as const;

  /** 可捲動區只顯示目前分頁左右各 N 個，避免標題被裁成半字；首頁時只顯示前幾個。下方點點仍可切換全部分頁。 */
  const scrollableTabNeighborRadius = 2;
  const visibleScrollableTabs = useMemo(() => {
    const scrollable = pageTabs.slice(1);
    const windowSize = scrollableTabNeighborRadius * 2 + 1;
    if (currentPage === 0) {
      return scrollable.slice(0, Math.min(windowSize, scrollable.length));
    }
    const idx = scrollable.findIndex((t) => t.id === currentPage);
    if (idx < 0) {
      return scrollable.slice(0, Math.min(windowSize, scrollable.length));
    }
    const start = Math.max(0, idx - scrollableTabNeighborRadius);
    const end = Math.min(scrollable.length, idx + scrollableTabNeighborRadius + 1);
    return scrollable.slice(start, end);
  }, [currentPage]);

  const loanPresetActions: LoanPresetAction[] = QUICK11_LOAN_PRESETS.map((p) => ({
    key: p.key,
    icon: p.icon,
    label: p.label,
    amount: p.amount,
    annualRate: p.annualRate,
    years: p.years,
    monthlyIncome: p.monthlyIncome,
  }));

  const switchPage = (nextPage: number) => {
    const bounded = Math.max(0, Math.min(pageTabs.length - 1, nextPage));
    setPageDirection(bounded > currentPage ? 1 : -1);
    setCurrentPage(bounded);
    if (bounded === 1) setMethod("annuity");
    if (bounded === 2) setMethod("equalPrincipal");
  };

  const applyLoanPreset = (preset: LoanPresetAction) => {
    setLoanAmount(preset.amount);
    setLoanAmountText(formatMoney(preset.amount));
    setAnnualRate(preset.annualRate);
    setAnnualRateText(String(preset.annualRate));
    setLoanYears(preset.years);
    setLoanYearsText(String(preset.years));
    setMonthlyIncome(preset.monthlyIncome);
    setMonthlyIncomeText(formatMoney(preset.monthlyIncome));
  };

  const bottomCta = useMemo((): {
    show: boolean;
    title: string;
    body: string;
    button: string;
    subtitle?: string;
    highlight?: string;
  } => {
    const savedByEqual = Math.max(0, output.annuityTotalInterest - output.equalPrincipalTotalInterest);
    const graceG = graceEffectiveMonths;
    const graceTitle = graceG <= 0 ? "0 個月" : graceG % 12 === 0 ? `${graceG / 12} 年` : `${graceG} 個月`;

    switch (currentPage) {
      case 0:
        return {
          show: true,
          title: "厭倦了被銀行抽走利息？",
          subtitle: "你的試算結果顯示：",
          highlight: `最高可少付 NT$${formatMoney(savedByEqual)}`,
          body: "",
          button: "前往存股複利計算機",
        };
      case 1:
        return {
          show: true,
          title: "本息均攤看似平順，前期利息其實很重。",
          body: "想把利息差距換成資產成長？",
          button: "前往存股複利計算機",
        };
      case 2:
        return {
          show: true,
          title: "本金平均的核心：早點還本金，利息才會一路降。",
          body: "省下的利息，能變成你的複利籌碼。",
          button: "前往存股複利計算機",
        };
      case 3:
        return {
          show: true,
          title: "提前還款不是省小錢，是省『未來的利息年份』。",
          body: "把省下的利息拿去滾，才叫加速器。",
          button: "前往存股複利計算機",
        };
      case 4:
        return {
          show: true,
          title: "大額還款最有感的不是『少繳一次』，是『少滾很多利息』。",
          body: "想看省下利息的長期複利差距？",
          button: "前往存股複利計算機",
        };
      case 5:
        return {
          show: true,
          title: `寬限期 ${graceTitle} 看起來輕鬆，代價通常是後面更痛。`,
          body: "把『多付的利息』當成現金流風險看待。",
          button: "前往存股複利計算機",
        };
      case 6:
        return {
          show: true,
          title: "貸款 vs 存股：重點不是一句話，而是同一套假設。",
          body: "把報酬與利息放在同一條時間軸比較。",
          button: "前往存股複利計算機",
        };
      case 7:
        return {
          show: true,
          title: "升息不是『多 0.25%』，是整段年期的利息放大器。",
          body: "想看更長期的資產成長對照？",
          button: "前往存股複利計算機",
        };
      case 8:
        return {
          show: false,
          title: "省下利息只是第一步，關鍵是『再投入』。",
          body: "把利息差距換成長期複利。",
          button: "前往存股複利計算機",
        };
      default:
        return { show: true, title: "想把利息差距變成資產？", body: "用同一套假設看長期複利。", button: "前往存股複利計算機" };
    }
  }, [currentPage, output.annuityTotalInterest, output.equalPrincipalTotalInterest, graceEffectiveMonths]);

  useEffect(() => {
    const el = tabButtonRefs.current[currentPage];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [currentPage]);

  const inputContextValue = useMemo<Quick11InputStore>(
    () => ({ loanAmount, annualRate, loanYears, monthlyIncome }),
    [loanAmount, annualRate, loanYears, monthlyIncome],
  );

  return (
    <main
      className={`px-3 ${embeddedInMiniBlog ? "min-h-0" : "min-h-screen"} py-4 ${
        embeddedInMiniBlog
          ? isLight
            ? "bg-transparent text-slate-900"
            : "bg-transparent text-slate-100"
          : isLight
            ? "bg-white text-slate-900"
            : "bg-[#020817] text-slate-100"
      }`}
    >
      <Quick11InputContext.Provider value={inputContextValue}>
        <div className="mx-auto w-full max-w-[440px]">
          
          <style jsx global>{`
            @keyframes quick11CrackRedFlow {
              0% {
                background-position:
                  0% 50%,
                  0% 0%,
                  100% 100%;
              }
              100% {
                background-position:
                  140% 50%,
                  120% 0%,
                  0% 100%;
              }
            }

            @keyframes quick11CrackFlicker {
              0%,
              100% {
                text-shadow:
                  0 0 8px rgba(248, 113, 113, 0.35),
                  0 0 16px rgba(239, 68, 68, 0.25);
              }
              50% {
                text-shadow:
                  0 0 10px rgba(248, 113, 113, 0.48),
                  0 0 22px rgba(239, 68, 68, 0.35);
              }
            }

            .quick11-cracked-title {
              background-image:
                linear-gradient(95deg, #fecaca 0%, #f87171 22%, #ef4444 45%, #b91c1c 70%, #7f1d1d 100%),
                repeating-linear-gradient(
                  -62deg,
                  rgba(255, 255, 255, 0) 0 9px,
                  rgba(255, 245, 245, 0.92) 9px 10px,
                  rgba(255, 255, 255, 0) 10px 18px
                ),
                repeating-linear-gradient(
                  68deg,
                  rgba(0, 0, 0, 0) 0 12px,
                  rgba(127, 29, 29, 0.85) 12px 13px,
                  rgba(0, 0, 0, 0) 13px 25px
                );
              background-size:
                220% 100%,
                180% 100%,
                190% 100%;
              -webkit-background-clip: text;
              background-clip: text;
              -webkit-text-fill-color: transparent;
              color: transparent;
              animation:
                quick11CrackRedFlow 4.8s linear infinite,
                quick11CrackFlicker 1.9s ease-in-out infinite;
              will-change: background-position, text-shadow;
            }
          `}</style>
          <header
            className={`mb-3 rounded-xl border p-3 ${
              isLight
                ? "border border-slate-200 bg-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
                : "border-slate-700 bg-[#0f172a]"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="quick-brand-gold-shimmer text-[20px] font-black" style={{ ["--quick-brand-duration" as string]: "2.2s" }}>
                財富自由計算機
              </p>
              <button
                type="button"
                onClick={() => setIsLight((v) => !v)}
                className={`rounded-md border px-2 py-1 text-[11px] font-bold transition ${
                  isLight
                    ? "border-slate-200 bg-white text-slate-900 shadow-[0_1px_4px_rgba(0,0,0,0.05)] hover:bg-slate-100"
                    : "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
                }`}
                aria-label="黑白切換"
              >
                {isLight ? "黑" : "白"}
              </button>
            </div>
            <h1 className={`quick11-cracked-title mt-1 text-[32px] font-black leading-tight ${isLight ? "opacity-90" : ""}`}>破產計算機</h1>
            <p className={`mt-1 text-[13px] tracking-[0.05em] ${isLight ? "text-slate-600" : "text-slate-400"}`}>先看月付與預警，再決定你是不是要把自由賣給銀行。</p>
          </header>

          <section
            className={`space-y-3 rounded-xl border p-2.5 ${
              isLight
                ? "border border-slate-200 bg-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
                : "border-slate-700 bg-[#0f172a]"
            }`}
          >
            <div
              className={`sticky top-2 z-20 rounded-lg border p-2.5 backdrop-blur-md ${
                isLight
                  ? "border border-slate-200 bg-slate-100/95 backdrop-blur-md shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
                  : "border-slate-700 bg-[#0f172a]/95"
              }`}
            >
              <div className={`relative flex items-stretch border-b pb-1 ${isLight ? "border-slate-200" : "border-slate-700"}`}>
                <div
                  className={`relative flex shrink-0 items-center border-r pl-0.5 pr-2 ${
                    isLight ? "border-slate-200 bg-white" : "border-slate-700 bg-[#0f172a]/95"
                  }`}
                >
                  {(() => {
                    const tab = pageTabs[0];
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        ref={(el) => {
                          tabButtonRefs.current[tab.id] = el;
                        }}
                        onClick={() => switchPage(tab.id)}
                        className={`relative min-w-[2.75rem] appearance-none border-0 bg-transparent px-1.5 py-1.5 text-[14px] tracking-[0.02em] shadow-none transition whitespace-nowrap ${
                          currentPage === tab.id
                            ? isLight
                              ? "font-black text-slate-900"
                              : "font-black text-white"
                            : isLight
                              ? "font-bold text-slate-600 hover:text-slate-900"
                              : "font-bold text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {tab.title}
                        {currentPage === tab.id ? (
                          <span className={`absolute inset-x-1 -bottom-1 h-[2.5px] rounded-full ${isLight ? "bg-sky-600" : "bg-sky-500"}`} />
                        ) : null}
                      </button>
                    );
                  })()}
                </div>
                <div
                  className="relative z-0 min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  <div className="flex min-w-max items-center gap-0.5 pl-2">
                    {visibleScrollableTabs.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        ref={(el) => {
                          tabButtonRefs.current[tab.id] = el;
                        }}
                        onClick={() => switchPage(tab.id)}
                        className={`relative appearance-none border-0 bg-transparent px-1.5 py-1.5 text-[14px] tracking-[0.02em] shadow-none transition whitespace-nowrap ${
                          currentPage === tab.id
                            ? isLight
                              ? "font-black text-slate-900"
                              : "font-black text-white"
                            : isLight
                              ? "font-bold text-slate-600 hover:text-slate-900"
                              : "font-bold text-slate-400 hover:text-slate-200"
                        } ${tab.id === 2 ? "rounded-md ring-1 ring-sky-500/55 shadow-[0_0_10px_rgba(14,165,233,0.22)]" : ""}`}
                      >
                        {tab.title}
                        {tab.id === 2 ? <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-sky-600 shadow-[0_0_8px_rgba(14,165,233,0.55)]" /> : null}
                        {currentPage === tab.id ? <span className={`absolute inset-x-1 -bottom-1 h-[2.5px] rounded-full ${isLight ? "bg-sky-600" : "bg-sky-500"}`} /> : null}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-2 flex min-h-[8px] justify-center overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex min-w-max justify-center gap-1.5 px-1">
                  {pageTabs.map((tab) => (
                    <button
                      key={`dot-${tab.id}`}
                      type="button"
                      onClick={() => switchPage(tab.id)}
                      className={`shrink-0 appearance-none border-0 bg-transparent p-0 rounded-full transition-all duration-200 ${
                        currentPage === tab.id
                          ? "h-px w-6 bg-sky-500"
                          : isLight
                            ? "h-px w-4 bg-slate-400/90 hover:bg-slate-500/80"
                            : "h-px w-4 bg-slate-500/85 hover:bg-slate-300/70"
                      }`}
                      aria-label={`切換到${tab.title}`}
                    />
                  ))}
                </div>
              </div>

              <AnimatePresence>{currentPage > 0 ? <MiniSettingsHeader key="quick11-mini-settings" isLight={isLight} /> : null}</AnimatePresence>
            </div>

            {currentPage === 0 ? (
              <div
                className={`space-y-2 rounded-lg border p-2 ${
                  isLight
                    ? "border border-slate-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
                    : "border-slate-800 bg-sky-950/55"
                }`}
              >
                <InputField
                  inputRef={loanInputRef}
                  label="貸款總額"
                  unit="NT$"
                  isLight={isLight}
                  presetActions={loanPresetActions}
                  onApplyPreset={applyLoanPreset}
                  sliderMin={LOAN_PRINCIPAL_MIN}
                  sliderMax={LOAN_PRINCIPAL_MAX}
                  sliderStep={10_000}
                  value={loanAmount}
                  text={loanAmountText}
                  onTextChange={(next) => {
                    setLoanAmountText(next);
                    setLoanAmount(parseAndClamp(next, loanAmount, LOAN_PRINCIPAL_MIN, LOAN_PRINCIPAL_MAX, true));
                  }}
                  onCommit={(next) => {
                    const normalized = parseAndClamp(next, loanAmount, LOAN_PRINCIPAL_MIN, LOAN_PRINCIPAL_MAX, true);
                    setLoanAmount(normalized);
                    setLoanAmountText(formatMoney(normalized));
                  }}
                  onBump={(delta) => {
                    const next = Math.min(LOAN_PRINCIPAL_MAX, Math.max(LOAN_PRINCIPAL_MIN, loanAmount + delta));
                    setLoanAmount(next);
                    setLoanAmountText(formatMoney(next));
                  }}
                  onSlider={(next) => {
                    setLoanAmount(next);
                    setLoanAmountText(formatMoney(next));
                  }}
                  bumpStep={100_000}
                  quickActions={[
                    { label: "+5萬", delta: 50_000 },
                    { label: "+10萬", delta: 100_000 },
                    { label: "+20萬", delta: 200_000 },
                    { label: "+50萬", delta: 500_000 },
                    { label: "+100萬", delta: 1_000_000 },
                  ]}
                  onEnterNext={() => incomeInputRef.current?.focus()}
                />

                <div className="grid gap-2" style={{ gridTemplateColumns: "minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 0.9fr)" }}>
                  <InputField
                    compact
                    inputRef={incomeInputRef}
                    label="月收入（預警）"
                    unit="NT$"
                    isLight={isLight}
                    sliderMin={20_000}
                    sliderMax={10_000_000}
                    sliderStep={10_000}
                    value={monthlyIncome}
                    text={monthlyIncomeText}
                    onTextChange={(next) => {
                      setMonthlyIncomeText(next);
                      setMonthlyIncome(parseAndClamp(next, monthlyIncome, 20_000, 10_000_000, true));
                    }}
                    onCommit={(next) => {
                      const normalized = parseAndClamp(next, monthlyIncome, 20_000, 10_000_000, true);
                      setMonthlyIncome(normalized);
                      setMonthlyIncomeText(formatMoney(normalized));
                    }}
                    onBump={(delta) => {
                      const next = Math.min(10_000_000, Math.max(20_000, monthlyIncome + delta));
                      setMonthlyIncome(next);
                      setMonthlyIncomeText(formatMoney(next));
                    }}
                    onSlider={(next) => {
                      setMonthlyIncome(next);
                      setMonthlyIncomeText(formatMoney(next));
                    }}
                    bumpStep={10_000}
                    onEnterNext={() => rateInputRef.current?.focus()}
                  />

                  <InputField
                    inputRef={rateInputRef}
                    compact
                    label="年利率"
                    unit="%"
                    isLight={isLight}
                    sliderMin={0}
                    sliderMax={15}
                    sliderStep={0.05}
                    value={annualRate}
                    text={annualRateText}
                    onTextChange={(next) => {
                      setAnnualRateText(next);
                      setAnnualRate(parseAndClamp(next, annualRate, 0, 15));
                    }}
                    onCommit={(next) => {
                      const normalized = parseAndClamp(next, annualRate, 0, 15);
                      setAnnualRate(normalized);
                      setAnnualRateText(String(normalized));
                    }}
                    onBump={(delta) => {
                      const next = Number(Math.min(15, Math.max(0, annualRate + delta)).toFixed(2));
                      setAnnualRate(next);
                      setAnnualRateText(String(next));
                    }}
                    onSlider={(next) => {
                      const fixed = Number(next.toFixed(2));
                      setAnnualRate(fixed);
                      setAnnualRateText(String(fixed));
                    }}
                    bumpStep={0.1}
                    onEnterNext={() => yearsInputRef.current?.focus()}
                  />

                  <InputField
                    compact
                    inputRef={yearsInputRef}
                    label="貸款年期"
                    unit="年"
                    isLight={isLight}
                    sliderMin={1}
                    sliderMax={50}
                    sliderStep={1}
                    value={loanYears}
                    text={loanYearsText}
                    onTextChange={(next) => {
                      setLoanYearsText(next);
                      setLoanYears(parseAndClamp(next, loanYears, 1, 50, true));
                    }}
                    onCommit={(next) => {
                      const normalized = parseAndClamp(next, loanYears, 1, 50, true);
                      setLoanYears(normalized);
                      setLoanYearsText(String(normalized));
                    }}
                    onBump={(delta) => {
                      const next = Math.min(50, Math.max(1, loanYears + delta));
                      setLoanYears(next);
                      setLoanYearsText(String(next));
                    }}
                    onSlider={(next) => {
                      setLoanYears(next);
                      setLoanYearsText(String(next));
                    }}
                    bumpStep={1}
                  />
                </div>
              </div>
            ) : null}

            <div
              className={`overflow-hidden rounded-lg border ${
                isLight
                  ? "border border-slate-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
                  : "border-slate-700 bg-slate-900/60"
              }`}
            >
              <AnimatePresence mode="wait" custom={pageDirection}>
                <motion.section
                  key={currentPage}
                  custom={pageDirection}
                  variants={{
                    enter: (dir: number) => ({ x: dir >= 0 ? 90 : -90, opacity: 0 }),
                    center: { x: 0, opacity: 1 },
                    exit: (dir: number) => ({ x: dir >= 0 ? -90 : 90, opacity: 0 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.24, ease: "easeOut" }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.1}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -55) switchPage(currentPage + 1);
                    else if (info.offset.x > 55) switchPage(currentPage - 1);
                  }}
                  className="p-2.5"
                >
                  {currentPage === 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-lg font-black text-sky-100">首頁總覽</p>
                        <div className="mr-5 inline-flex items-center gap-1.5 rounded-md border border-slate-600 bg-transparent px-1.5 py-1">
                          <button
                            type="button"
                            onClick={() => setMethod("annuity")}
                            className={`rounded border bg-transparent px-3 py-1 text-[14px] font-bold transition ${
                              method === "annuity"
                                ? "border-sky-400/70 text-sky-200"
                                : "border-transparent text-slate-300 hover:border-slate-500 hover:text-slate-100"
                            }`}
                          >
                            本息均攤
                          </button>
                          <button
                            type="button"
                            onClick={() => setMethod("equalPrincipal")}
                            className={`rounded border bg-transparent px-3 py-1 text-[14px] font-bold transition ${
                              method === "equalPrincipal"
                                ? "border-amber-300 text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.2)]"
                                : "border-amber-400/70 text-slate-200 hover:text-amber-100"
                            }`}
                          >
                            本金平均
                          </button>
                          <span className="whitespace-nowrap text-[12px] font-bold tracking-[0.02em] text-amber-200">推薦使用</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <InfoCard
                          title="每月繳款"
                          value={method === "annuity" ? `NT$ ${formatMoney(output.annuityRows[0]?.payment ?? 0)}` : `NT$ ${formatMoney(output.equalPrincipalRows[0]?.payment ?? 0)}`}
                          tone="text-slate-100 border-slate-600 bg-slate-800/80"
                          shrinkValue
                          isLight={isLight}
                        />
                        <InfoCard
                          title="每月利息"
                          value={`NT$ ${formatMoney(rows[0]?.interest ?? 0)}`}
                          tone="text-slate-100 border-slate-600 bg-slate-800/80"
                          shrinkValue
                          isLight={isLight}
                        />
                        <InfoCard
                          title="總繳利息"
                          value={`NT$ ${formatMoney(method === "annuity" ? output.annuityTotalInterest : output.equalPrincipalTotalInterest)}`}
                          tone="text-sky-100 border-sky-500/35 bg-sky-500/10"
                          shrinkValue
                          isLight={isLight}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <TotalRepaymentCard
                          principal={loanAmount}
                          totalInterest={method === "annuity" ? output.annuityTotalInterest : output.equalPrincipalTotalInterest}
                          totalRepayment={loanAmount + (method === "annuity" ? output.annuityTotalInterest : output.equalPrincipalTotalInterest)}
                          delay={0.2}
                          isLight={isLight}
                        />
                        <div
                          className={`min-w-0 rounded-lg border p-2 ${
                            isLight
                              ? "border-amber-300 bg-amber-50 text-amber-950 shadow-[0_1px_6px_rgba(245,158,11,0.22)] ring-1 ring-amber-400/35"
                              : `border-slate-600 bg-slate-800/80 text-slate-100 ${goldStat.q11GoldStat}`
                          }`}
                        >
                          <div className={goldStat.q11GoldInner}>
                            <p
                              className={`truncate whitespace-nowrap text-[16px] font-bold tracking-[0.04em] ${isLight ? "text-amber-900" : "text-slate-300"}`}
                            >
                              多出多少
                            </p>
                            <ShrinkFitCardAmount
                              animKey={`home-overpay-${Math.round(method === "annuity" ? output.annuityTotalInterest : output.equalPrincipalTotalInterest)}`}
                              maxPx={20}
                            >
                              {`NT$ ${formatMoney(method === "annuity" ? output.annuityTotalInterest : output.equalPrincipalTotalInterest)}`}
                            </ShrinkFitCardAmount>
                            <p className={`mt-1 text-[10px] ${isLight ? "text-amber-800/90" : "text-slate-400"}`}>相較本金多付</p>
                          </div>
                        </div>
                      </div>
                      <RateShowdownTeaser rows={rateShowdownRows} isLight={isLight} onOpen={() => setRateShowdownOpen(true)} />
                    </div>
                  ) : null}

                  {currentPage === 1 ? (
                    <ResultPage
                      label="本息均攤（穩定但利息高）"
                      payment={`NT$ ${formatMoney(output.annuityRows[0]?.payment ?? 0)}`}
                      paymentDiffVsCompare={(output.annuityRows[0]?.payment ?? 0) - (output.equalPrincipalRows[0]?.payment ?? 0)}
                      compareLabel="本金平均"
                      totalInterest={output.annuityTotalInterest}
                      totalRepayment={loanAmount + output.annuityTotalInterest}
                      warning={warning}
                      dtiPct={dtiPct}
                      dtiRatio={dtiRatio}
                      rows={output.annuityRows}
                      compareRows={output.equalPrincipalRows}
                      showPkSection
                      isLight={isLight}
                    />
                  ) : null}

                  {currentPage === 2 ? (
                    <ResultPage
                      label="本金平均（內行人首選，利息最省）"
                      payment={`NT$ ${formatMoney(output.equalPrincipalRows[0]?.payment ?? 0)} → ${formatMoney(output.equalPrincipalRows.at(-1)?.payment ?? 0)}`}
                      paymentDiffVsCompare={(output.equalPrincipalRows[0]?.payment ?? 0) - (output.annuityRows[0]?.payment ?? 0)}
                      compareLabel="本息均攤"
                      totalInterest={output.equalPrincipalTotalInterest}
                      totalRepayment={loanAmount + output.equalPrincipalTotalInterest}
                      warning={warning}
                      dtiPct={dtiPct}
                      dtiRatio={dtiRatio}
                      recommend
                      rows={output.equalPrincipalRows}
                      compareRows={output.annuityRows}
                      showPkSection
                      isLight={isLight}
                    />
                  ) : null}

                  {currentPage === 3 ? (
                    <div className="space-y-5">
                      <p className={`text-lg font-black ${isLight ? "text-slate-900" : "text-sky-100"}`}>提前還款計畫（贖回自由的加速器）</p>
                      <div
                        className={`rounded-lg border p-2.5 ${
                          isLight
                            ? "border border-slate-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
                            : "border-slate-700 bg-slate-900/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-[16px] font-black tracking-[0.02em] ${isLight ? "text-slate-600" : "text-slate-200"}`}>額外月還款</p>
                          <div className={`inline-flex w-full max-w-[220px] items-center gap-1 rounded-xl border p-1 ${isLight ? "border-slate-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]" : "border-slate-700 bg-slate-900/60"}`}>
                            <button
                              type="button"
                              onClick={() => setEarlyRepayMethod("annuity")}
                              className={`min-w-0 flex-1 rounded-lg px-2.5 py-1 text-[13px] font-bold transition ${
                                earlyRepayMethod === "annuity"
                                  ? isLight
                                    ? "border border-sky-500 bg-transparent text-slate-900 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
                                    : "border border-amber-300 bg-transparent text-slate-100 shadow-[0_0_10px_rgba(251,191,36,0.18)]"
                                  : isLight
                                    ? "border border-slate-200 bg-transparent text-slate-600 hover:text-slate-900"
                                    : "border border-slate-600 bg-transparent text-slate-300 hover:border-slate-400"
                              }`}
                            >
                              本息均攤
                            </button>
                            <button
                              type="button"
                              onClick={() => setEarlyRepayMethod("equalPrincipal")}
                              className={`min-w-0 flex-1 rounded-lg px-2.5 py-1 text-[13px] font-bold transition ${
                                earlyRepayMethod === "equalPrincipal"
                                  ? isLight
                                    ? "border border-sky-500 bg-transparent text-slate-900 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
                                    : "border border-amber-300 bg-transparent text-slate-100 shadow-[0_0_10px_rgba(251,191,36,0.18)]"
                                  : isLight
                                    ? "border border-slate-200 bg-transparent text-slate-600 hover:text-slate-900"
                                    : "border border-slate-600 bg-transparent text-slate-300 hover:border-slate-400"
                              }`}
                            >
                              本金平均
                            </button>
                          </div>
                        </div>
                        <p className={`mt-1 font-mono text-[clamp(24px,7vw,34px)] font-black leading-none ${isLight ? "text-slate-900" : "text-lime-300 drop-shadow-[0_0_10px_rgba(173,255,47,0.32)]"}`}>
                          NT$ {formatMoney(extraMonthlyPayment)}
                        </p>
                        <input
                          type="range"
                          min={0}
                          max={100_000}
                          step={1_000}
                          value={extraMonthlyPayment}
                          onChange={(e) => setExtraMonthlyPayment(Number(e.currentTarget.value))}
                          className={`mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg ${isLight ? "bg-slate-200 accent-sky-600" : "bg-slate-700 accent-lime-400"}`}
                        />
                      </div>
                      <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-5">
                        <motion.div
                          className={`min-h-[102px] min-w-0 rounded-lg border p-2 ${isLight ? "border border-sky-500/35 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]" : "border-lime-300/45 bg-lime-500/10"}`}
                          animate={{ boxShadow: [isLight ? "0 0 0px rgba(132,204,22,0.06)" : "0 0 0px rgba(173,255,47,0.05)", isLight ? "0 0 14px rgba(132,204,22,0.18)" : "0 0 14px rgba(173,255,47,0.25)", isLight ? "0 0 0px rgba(132,204,22,0.06)" : "0 0 0px rgba(173,255,47,0.05)"] }}
                          transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <p className={`text-[16px] font-bold tracking-[0.04em] ${isLight ? "text-slate-600" : "text-lime-200"}`}>省下總利息</p>
                          <div className="mt-1 min-w-0 w-full overflow-x-auto overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                            <AnimatePresence mode="wait">
                              <motion.p
                                key={`early-saved-interest-${earlyRepayMethod}`}
                                initial={{ rotateX: -86, opacity: 0.65, y: -4 }}
                                animate={{ rotateX: 0, opacity: 1, y: 0 }}
                                exit={{ rotateX: 86, opacity: 0.8, y: 3 }}
                                transition={{ duration: 0.28, ease: "easeOut" }}
                                style={{ transformPerspective: 760, transformOrigin: "50% 55%" }}
                                className={`w-max max-w-none whitespace-nowrap text-[clamp(15px,4.2vw,22px)] font-black leading-none tracking-normal tabular-nums ${isLight ? "text-slate-900" : "text-lime-100"}`}
                              >
                                NT$ {formatMoney(earlySavedInterest)}
                              </motion.p>
                            </AnimatePresence>
                          </div>
                        </motion.div>
                        <motion.div
                          className={`min-h-[102px] min-w-0 rounded-lg border p-2 ${isLight ? "border border-sky-500/35 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]" : "border-lime-300/45 bg-lime-500/10"}`}
                          animate={{ boxShadow: [isLight ? "0 0 0px rgba(132,204,22,0.06)" : "0 0 0px rgba(173,255,47,0.05)", isLight ? "0 0 14px rgba(132,204,22,0.18)" : "0 0 14px rgba(173,255,47,0.25)", isLight ? "0 0 0px rgba(132,204,22,0.06)" : "0 0 0px rgba(173,255,47,0.05)"] }}
                          transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut", delay: 0.28 }}
                        >
                          <p className={`text-[16px] font-bold tracking-[0.04em] ${isLight ? "text-slate-600" : "text-lime-200"}`}>提早還清月數</p>
                          <div className="mt-1 min-w-0 w-full overflow-x-auto overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                            <AnimatePresence mode="wait">
                              <motion.p
                                key={`early-saved-months-${earlyRepayMethod}`}
                                initial={{ rotateX: -86, opacity: 0.65, y: -4 }}
                                animate={{ rotateX: 0, opacity: 1, y: 0 }}
                                exit={{ rotateX: 86, opacity: 0.8, y: 3 }}
                                transition={{ duration: 0.28, ease: "easeOut" }}
                                style={{ transformPerspective: 760, transformOrigin: "50% 55%" }}
                                className={`flex w-max max-w-none items-baseline gap-x-0.5 whitespace-nowrap text-[clamp(15px,4.2vw,22px)] font-black leading-none tracking-normal ${isLight ? "text-slate-900" : "text-lime-100"}`}
                              >
                                <span className="tabular-nums">{formatMoney(earlySavedMonths)}</span>
                                <span className="font-sans font-black">月</span>
                              </motion.p>
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      </div>
                      <div className="rounded-lg border border-slate-800 bg-sky-950/55 p-3">
                        <div className="flex items-center justify-between text-[14px] font-black tracking-[0.04em] text-slate-200">
                          <span>原還款期 {formatMoney(baselineMonths)} 月</span>
                          <span>新還款期 {formatMoney(prepayResult.months)} 月</span>
                        </div>
                        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-700">
                          <motion.div
                            className="h-full bg-gradient-to-r from-lime-400 to-lime-200"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(0, Math.min(100, (prepayResult.months / Math.max(1, baselineMonths)) * 100))}%` }}
                            transition={{ duration: 0.45, ease: "easeOut" }}
                          />
                        </div>
                        <p className="mt-2 text-[14px] font-black text-lime-200">已切除 {formatMoney(earlySavedMonths)} 個月的債務人生。</p>
                      </div>
                      <div className="rounded-lg border border-slate-800 bg-sky-950/55 p-2">
                        <p className="text-[16px] font-black text-lime-200">提前還款分期明細（{earlyRepayMethod === "annuity" ? "本息均攤" : "本金平均"}）</p>
                        <details className="group mt-2">
                          <summary
                            className={`flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-[15px] font-black tracking-[0.02em] transition ${
                              isLight
                                ? "border-slate-200 bg-white text-slate-900 hover:border-sky-500 hover:bg-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
                                : "border-transparent bg-[#1F5FA7] text-sky-100 hover:bg-[#2A6DBB]"
                            }`}
                          >
                            <span className="min-w-0 truncate text-sky-100">展開看每一期：還款 / 利息 / 比原方案少付</span>
                            <span
                              aria-hidden
                              className="shrink-0 text-sky-100 transition-transform duration-200 group-open:rotate-180"
                            >
                              ▼
                            </span>
                          </summary>
                          <div className="mt-2 max-h-[280px] overflow-auto rounded-md border border-slate-700">
                            <table className="w-max min-w-[760px] table-auto text-left text-sm">
                              <colgroup>
                                <col className="w-[70px]" />
                                <col className="w-[120px]" />
                                <col className="w-[170px]" />
                                <col className="w-[130px]" />
                                <col className="w-[120px]" />
                                <col className="w-[140px]" />
                              </colgroup>
                              <thead className="sticky top-0 bg-slate-900">
                                <tr className="border-b border-slate-700 text-slate-300">
                                  <th className="whitespace-nowrap px-2 py-1.5">期數</th>
                                  <th className="whitespace-nowrap px-2 py-1.5">每期還款</th>
                                  <th className="whitespace-nowrap px-2 py-1.5">每期利息</th>
                                  <th className="whitespace-nowrap px-2 py-1.5">比原方案少付</th>
                                  <th className="whitespace-nowrap px-2 py-1.5">每期本金</th>
                                  <th className="whitespace-nowrap px-2 py-1.5">剩餘本金</th>
                                </tr>
                              </thead>
                              <tbody>
                                {prepayResult.rows.map((row, idx) => {
                                  const baseInterest = earlyBaseRows[idx]?.interest ?? row.interest;
                                  const savedVsBase = Math.max(0, baseInterest - row.interest);
                                  const interestPct = row.payment <= 0 ? 0 : (row.interest / row.payment) * 100;
                                  const isFirst = row.period === 1;
                                  return (
                                    <tr
                                      key={`early-repay-row-${row.period}`}
                                      className={`border-b border-slate-800 text-slate-200 ${idx % 2 === 0 ? "bg-slate-950/80" : "bg-slate-900/55"}`}
                                    >
                                      <td className="whitespace-nowrap px-2 py-2 font-semibold">{row.period}</td>
                                      <td className="whitespace-nowrap px-2 py-2">{formatMoney(row.payment)}</td>
                                      <td className={`whitespace-nowrap px-2 py-2 ${isFirst ? "font-black text-amber-200" : ""}`}>
                                        {formatMoney(row.interest)}
                                        <span className="ml-1 text-[11px] text-slate-400">({interestPct.toFixed(0)}%)</span>
                                        {isFirst ? <span className="ml-1 rounded bg-amber-400/20 px-1 py-0.5 text-[10px] font-bold text-amber-200">最高利息期</span> : null}
                                      </td>
                                      <td className="whitespace-nowrap px-2 py-2 font-bold text-emerald-300">NT$ {formatMoney(savedVsBase)}</td>
                                      <td className="whitespace-nowrap px-2 py-2">{formatMoney(row.principal)}</td>
                                      <td className="whitespace-nowrap px-2 py-2">{formatMoney(row.balance)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      </div>
                      <div className="rounded-lg border border-sky-500/35 bg-sky-500/10 p-2.5">
                        <p className="text-[16px] font-bold leading-relaxed tracking-[0.06em] text-slate-200">
                          把省下的利息拿去複利，20 年後約是
                        </p>
                        <p className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[clamp(18px,5.2vw,26px)] font-black tracking-[0.02em] text-sky-100">
                          NT$ {formatMoney(earlyFreedomProjected)}
                        </p>
                        <Link href="/quick-1" className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-sky-500 px-3 py-2 text-[20px] font-black tracking-[0.06em] text-white transition hover:bg-sky-400">
                          前往 財富自由計算機
                        </Link>
                      </div>
                    </div>
                  ) : null}

                  {currentPage === 4 ? (
                    <div className="space-y-5">
                      <p className={`text-lg font-black ${isLight ? "text-slate-900" : "text-sky-100"}`}>大額還款（單筆還本情境）</p>
                      <div
                        className={`rounded-lg border p-2.5 ${
                          isLight
                            ? "border border-slate-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
                            : "border-slate-700 bg-sky-950/65 shadow-[inset_0_1px_0_rgba(56,189,248,0.12)] ring-1 ring-sky-500/15"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-[16px] font-black tracking-[0.02em] ${isLight ? "text-slate-600" : "text-slate-200"}`}>試算基礎</p>
                          <div
                            className={`inline-flex w-full max-w-[220px] items-center gap-1 rounded-xl border p-1 ${
                              isLight
                                ? "border-slate-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
                                : "border-slate-600/90 bg-slate-950/55 ring-1 ring-sky-500/10"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setLumpSumMethod("annuity")}
                              className={`min-w-0 flex-1 rounded-lg px-2.5 py-1 text-[13px] font-bold transition ${
                                lumpSumMethod === "annuity"
                                  ? isLight
                                    ? "border border-sky-500 bg-transparent text-slate-900 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
                                    : "border border-amber-300 bg-transparent text-slate-100 shadow-[0_0_10px_rgba(251,191,36,0.18)]"
                                  : isLight
                                    ? "border border-slate-200 bg-transparent text-slate-600 hover:text-slate-900"
                                    : "border border-slate-600 bg-transparent text-slate-300 hover:border-slate-400"
                              }`}
                            >
                              本息均攤
                            </button>
                            <button
                              type="button"
                              onClick={() => setLumpSumMethod("equalPrincipal")}
                              className={`min-w-0 flex-1 rounded-lg px-2.5 py-1 text-[13px] font-bold transition ${
                                lumpSumMethod === "equalPrincipal"
                                  ? isLight
                                    ? "border border-sky-500 bg-transparent text-slate-900 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
                                    : "border border-amber-300 bg-transparent text-slate-100 shadow-[0_0_10px_rgba(251,191,36,0.18)]"
                                  : isLight
                                    ? "border border-slate-200 bg-transparent text-slate-600 hover:text-slate-900"
                                    : "border border-slate-600 bg-transparent text-slate-300 hover:border-slate-400"
                              }`}
                            >
                              本金平均
                            </button>
                          </div>
                        </div>
                        <p className={`mt-2 text-[16px] font-black tracking-[0.02em] ${isLight ? "text-slate-600" : "text-slate-200"}`}>大額還款金額</p>
                        <p className={`mt-1 font-mono text-[clamp(24px,7vw,34px)] font-black leading-none ${isLight ? "text-slate-900" : "text-lime-300 drop-shadow-[0_0_10px_rgba(173,255,47,0.32)]"}`}>
                          NT$ {formatMoney(lumpEffective)}
                          {lumpEffective < lumpSumAmount ? (
                            <span className={`ml-1 block text-[11px] font-semibold ${isLight ? "text-amber-700" : "text-amber-200"}`}>（已依貸款本金上限調整）</span>
                          ) : null}
                        </p>
                        <div
                          className={`mt-2 flex min-w-0 items-stretch overflow-hidden rounded-lg border shadow-[0_1px_4px_rgba(0,0,0,0.05)] ${
                            isLight ? "border-slate-200 bg-white" : "border-sky-500/25 bg-[#0c1629]"
                          }`}
                        >
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            value={lumpSumText}
                            onChange={(e) => {
                              const next = sanitizeCalcInputLite(e.currentTarget.value);
                              setLumpSumText(next);
                            }}
                            onBlur={() => {
                              commitLumpSumInput();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                commitLumpSumInput();
                                (e.currentTarget as HTMLInputElement).blur();
                              }
                            }}
                            className={`min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-[clamp(18px,4.8vw,22px)] font-black tabular-nums outline-none ring-0 focus:ring-0 ${
                              isLight ? "text-slate-900 placeholder:text-slate-500/80" : "text-slate-100 placeholder:text-slate-500"
                            }`}
                            aria-label="大額還款金額"
                          />
                          <div
                            className={`flex shrink-0 flex-col divide-y ${isLight ? "divide-slate-200 border-l border-slate-200" : "divide-slate-600 border-l border-slate-600"}`}
                          >
                            <button
                              type="button"
                              aria-label={`大額還款增加 ${formatMoney(lumpBumpStep)}`}
                              disabled={loanAmount <= 0}
                              onClick={() => bumpLumpSum(lumpBumpStep)}
                              className={`flex min-h-[1.5rem] min-w-[1.75rem] items-center justify-center px-1 py-0.5 text-[12px] font-black leading-none transition disabled:opacity-40 ${
                                isLight ? "bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-200" : "bg-slate-900 text-lime-300/90 hover:bg-slate-800 active:bg-slate-950"
                              }`}
                            >
                              +
                            </button>
                            <button
                              type="button"
                              aria-label={`大額還款減少 ${formatMoney(lumpBumpStep)}`}
                              disabled={loanAmount <= 0}
                              onClick={() => bumpLumpSum(-lumpBumpStep)}
                              className={`flex min-h-[1.5rem] min-w-[1.75rem] items-center justify-center px-1 py-0.5 text-[12px] font-black leading-none transition disabled:opacity-40 ${
                                isLight ? "bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-200" : "bg-slate-900 text-lime-300/90 hover:bg-slate-800 active:bg-slate-950"
                              }`}
                            >
                              −
                            </button>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={loanAmount}
                          step={lumpSliderStep}
                          value={lumpSumAmount}
                          onChange={(e) => {
                            const v = Number(e.currentTarget.value);
                            const clamped = Math.min(loanAmount, Math.max(0, Math.round(v)));
                            setLumpSumAmount(clamped);
                            setLumpSumText(formatMoney(clamped));
                          }}
                          className={`mt-2 h-2 w-full min-w-0 cursor-pointer appearance-none rounded-lg ${isLight ? "bg-slate-200 accent-sky-600" : "bg-slate-700 accent-lime-400"}`}
                          aria-label="大額還款金額拉條"
                        />
                        <div className="mt-2 flex flex-wrap gap-2">
                          {[
                            { label: "+10萬", delta: 100_000 },
                            { label: "+50萬", delta: 500_000 },
                            { label: "+100萬", delta: 1_000_000 },
                          ].map((b) => (
                            <button
                              key={b.label}
                              type="button"
                              onClick={() => bumpLumpSum(b.delta)}
                              className={`rounded-lg border px-3 py-1.5 text-[13px] font-black transition ${
                                isLight
                                  ? "border-slate-400 bg-white text-slate-800 hover:border-amber-400 hover:bg-amber-50"
                                  : "border-slate-600/90 bg-slate-950/70 text-slate-100 ring-1 ring-sky-500/10 hover:border-amber-400/80 hover:bg-slate-900/90"
                              }`}
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-5">
                        <motion.div
                          className={`min-h-[102px] min-w-0 rounded-lg border p-2 ${isLight ? "border border-sky-500/35 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]" : "border-lime-300/45 bg-lime-500/10"}`}
                          animate={{ boxShadow: [isLight ? "0 0 0px rgba(132,204,22,0.06)" : "0 0 0px rgba(173,255,47,0.05)", isLight ? "0 0 14px rgba(132,204,22,0.18)" : "0 0 14px rgba(173,255,47,0.25)", isLight ? "0 0 0px rgba(132,204,22,0.06)" : "0 0 0px rgba(173,255,47,0.05)"] }}
                          transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <p className={`text-[16px] font-bold tracking-[0.04em] ${isLight ? "text-slate-600" : "text-lime-200"}`}>大額還款省下利息</p>
                          <div className="mt-1 min-w-0 w-full overflow-x-auto overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                            <AnimatePresence mode="wait">
                              <motion.p
                                key={`lump-saved-interest-${lumpSumMethod}-${lumpEffective}`}
                                initial={{ rotateX: -86, opacity: 0.65, y: -4 }}
                                animate={{ rotateX: 0, opacity: 1, y: 0 }}
                                exit={{ rotateX: 86, opacity: 0.8, y: 3 }}
                                transition={{ duration: 0.28, ease: "easeOut" }}
                                style={{ transformPerspective: 760, transformOrigin: "50% 55%" }}
                                className={`w-max max-w-none whitespace-nowrap text-[clamp(15px,4.2vw,22px)] font-black leading-none tracking-normal tabular-nums ${isLight ? "text-slate-900" : "text-lime-100"}`}
                              >
                                NT$ {formatMoney(lumpSavedInterest)}
                              </motion.p>
                            </AnimatePresence>
                          </div>
                        </motion.div>
                        <motion.div
                          className={`min-h-[102px] min-w-0 rounded-lg border p-2 ${isLight ? "border border-sky-500/35 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]" : "border-lime-300/45 bg-lime-500/10"}`}
                          animate={{ boxShadow: [isLight ? "0 0 0px rgba(132,204,22,0.06)" : "0 0 0px rgba(173,255,47,0.05)", isLight ? "0 0 14px rgba(132,204,22,0.18)" : "0 0 14px rgba(173,255,47,0.25)", isLight ? "0 0 0px rgba(132,204,22,0.06)" : "0 0 0px rgba(173,255,47,0.05)"] }}
                          transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut", delay: 0.28 }}
                        >
                          <p className={`text-[16px] font-bold tracking-[0.04em] ${isLight ? "text-slate-600" : "text-lime-200"}`}>預計提早還清月數</p>
                          <div className="mt-1 min-w-0 w-full overflow-x-auto overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                            <AnimatePresence mode="wait">
                              <motion.p
                                key={`lump-saved-months-${lumpSumMethod}-${lumpEffective}`}
                                initial={{ rotateX: -86, opacity: 0.65, y: -4 }}
                                animate={{ rotateX: 0, opacity: 1, y: 0 }}
                                exit={{ rotateX: 86, opacity: 0.8, y: 3 }}
                                transition={{ duration: 0.28, ease: "easeOut" }}
                                style={{ transformPerspective: 760, transformOrigin: "50% 55%" }}
                                className={`flex w-max max-w-none items-baseline gap-x-0.5 whitespace-nowrap text-[clamp(15px,4.2vw,22px)] font-black leading-none tracking-normal ${isLight ? "text-slate-900" : "text-lime-100"}`}
                              >
                                <span className="tabular-nums">{formatMoney(lumpSavedMonths)}</span>
                                <span className="font-sans font-black">月</span>
                              </motion.p>
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      </div>
                      <div className="rounded-lg border border-slate-800 bg-sky-950/55 p-3">
                        <div className="flex items-center justify-between text-[14px] font-black tracking-[0.04em] text-slate-200">
                          <span>原還款期 {formatMoney(baselineMonths)} 月</span>
                          <span>新還款期 {formatMoney(lumpResult.months)} 月</span>
                        </div>
                        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-700">
                          <motion.div
                            className="h-full bg-gradient-to-r from-lime-400 to-lime-200"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(0, Math.min(100, (lumpResult.months / Math.max(1, baselineMonths)) * 100))}%` }}
                            transition={{ duration: 0.45, ease: "easeOut" }}
                          />
                        </div>
                        <p className="mt-2 text-[14px] font-black text-lime-200">已切除 {formatMoney(lumpSavedMonths)} 個月的債務人生。</p>
                      </div>
                      <div className="rounded-lg border border-slate-800 bg-sky-950/55 p-2">
                        <p className="text-[16px] font-black text-lime-200">大額還款後分期明細（{lumpSumMethod === "annuity" ? "本息均攤" : "本金平均"}）</p>
                        <details className="group mt-2">
                          <summary
                            className={`flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-[15px] font-black tracking-[0.02em] transition ${
                              isLight
                                ? "border-slate-200 bg-white text-slate-900 hover:border-sky-500 hover:bg-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
                                : "border-transparent bg-[#1F5FA7] text-sky-100 hover:bg-[#2A6DBB]"
                            }`}
                          >
                            <span className="min-w-0 truncate text-sky-100">展開看每一期：還款 / 利息 / 比原方案少付</span>
                            <span aria-hidden className="shrink-0 text-sky-100 transition-transform duration-200 group-open:rotate-180">
                              ▼
                            </span>
                          </summary>
                          <div className="mt-2 max-h-[280px] overflow-auto rounded-md border border-slate-700">
                            <table className="w-max min-w-[760px] table-auto text-left text-sm">
                              <colgroup>
                                <col className="w-[70px]" />
                                <col className="w-[120px]" />
                                <col className="w-[170px]" />
                                <col className="w-[130px]" />
                                <col className="w-[120px]" />
                                <col className="w-[140px]" />
                              </colgroup>
                              <thead className="sticky top-0 bg-slate-900">
                                <tr className="border-b border-slate-700 text-slate-300">
                                  <th className="whitespace-nowrap px-2 py-1.5">期數</th>
                                  <th className="whitespace-nowrap px-2 py-1.5">每期還款</th>
                                  <th className="whitespace-nowrap px-2 py-1.5">每期利息</th>
                                  <th className="whitespace-nowrap px-2 py-1.5">比原方案少付</th>
                                  <th className="whitespace-nowrap px-2 py-1.5">每期本金</th>
                                  <th className="whitespace-nowrap px-2 py-1.5">剩餘本金</th>
                                </tr>
                              </thead>
                              <tbody>
                                {lumpResult.rows.map((row, idx) => {
                                  const baseInterest = lumpBaseRows[idx]?.interest ?? row.interest;
                                  const savedVsBase = Math.max(0, baseInterest - row.interest);
                                  const interestPct = row.payment <= 0 ? 0 : (row.interest / row.payment) * 100;
                                  const isFirst = row.period === 1;
                                  return (
                                    <tr
                                      key={`lump-row-${row.period}`}
                                      className={`border-b border-slate-800 text-slate-200 ${idx % 2 === 0 ? "bg-slate-950/80" : "bg-slate-900/55"}`}
                                    >
                                      <td className="whitespace-nowrap px-2 py-2 font-semibold">{row.period}</td>
                                      <td className="whitespace-nowrap px-2 py-2">{formatMoney(row.payment)}</td>
                                      <td className={`whitespace-nowrap px-2 py-2 ${isFirst ? "font-black text-amber-200" : ""}`}>
                                        {formatMoney(row.interest)}
                                        <span className="ml-1 text-[11px] text-slate-400">({interestPct.toFixed(0)}%)</span>
                                        {isFirst ? <span className="ml-1 rounded bg-amber-400/20 px-1 py-0.5 text-[10px] font-bold text-amber-200">最高利息期</span> : null}
                                      </td>
                                      <td className="whitespace-nowrap px-2 py-2 font-bold text-emerald-300">NT$ {formatMoney(savedVsBase)}</td>
                                      <td className="whitespace-nowrap px-2 py-2">{formatMoney(row.principal)}</td>
                                      <td className="whitespace-nowrap px-2 py-2">{formatMoney(row.balance)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      </div>
                      <div className="rounded-lg border border-sky-500/35 bg-sky-500/10 p-2.5">
                        <p className="text-[16px] font-bold leading-relaxed tracking-[0.06em] text-slate-200">把省下的利息拿去複利，20 年後約是</p>
                        <p className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[clamp(18px,5.2vw,26px)] font-black tracking-[0.02em] text-sky-100">
                          NT$ {formatMoney(lumpFreedomProjected)}
                        </p>
                        <Link href="/quick-1" className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-sky-500 px-3 py-2 text-[20px] font-black tracking-[0.06em] text-white transition hover:bg-sky-400">
                          前往 財富自由計算機
                        </Link>
                      </div>
                    </div>
                  ) : null}

                  {currentPage === 5 ? (
                    <div className="space-y-5">
                      <p className={`text-lg font-black ${isLight ? "text-slate-900" : "text-sky-100"}`}>延遲還款代價</p>
                      <div
                        className={`rounded-lg border p-2.5 ${
                          isLight
                            ? "border border-slate-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
                            : "border-slate-700 bg-slate-900/60"
                        }`}
                      >
                        <p className={`text-[16px] font-black tracking-[0.02em] ${isLight ? "text-slate-600" : "text-slate-200"}`}>預計寬限期（年／月）</p>
                        <div className="mt-2 grid min-w-0 grid-cols-2 items-start gap-3">
                          <div className="flex min-w-0 flex-col gap-4 overflow-x-clip">
                            <div
                              className={`flex min-w-0 items-stretch overflow-hidden rounded-lg border shadow-[0_1px_4px_rgba(0,0,0,0.05)] ${
                                isLight ? "border-slate-200 bg-white" : "border-slate-600 bg-slate-900/80"
                              }`}
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-1.5 px-2.5 py-2">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  autoComplete="off"
                                  value={graceYearsText}
                                  onChange={(e) => {
                                    const next = sanitizeCalcInputLite(e.currentTarget.value);
                                    setGraceYearsText(next);
                                  }}
                                  onBlur={() => {
                                    commitGraceYearsField();
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      commitGraceYearsField();
                                      (e.currentTarget as HTMLInputElement).blur();
                                    }
                                  }}
                                  className={`min-w-0 flex-1 border-0 bg-transparent text-right text-[24px] font-black tabular-nums leading-none outline-none ring-0 focus:ring-0 ${
                                    isLight ? "text-slate-900 placeholder:text-slate-500/80" : "text-slate-100 placeholder:text-slate-500"
                                  }`}
                                  aria-label="預計寬限期年數"
                                />
                                <span
                                  className={`shrink-0 text-[15px] font-bold leading-none tabular-nums ${
                                    isLight ? "text-slate-500" : "text-slate-400"
                                  }`}
                                  aria-hidden
                                >
                                  年
                                </span>
                              </div>
                              <div
                                className={`flex w-[2.35rem] shrink-0 flex-col self-stretch overflow-hidden ${isLight ? "bg-slate-300" : "bg-slate-700"}`}
                              >
                                <button
                                  type="button"
                                  aria-label="寬限期年數加 1"
                                  disabled={graceMaxMonths <= 0 || graceEffectiveMonths + 12 > graceMaxMonths}
                                  onClick={() => bumpGraceYears(1)}
                                  className={isLight ? graceStepperBtnLight : graceStepperBtnDark}
                                >
                                  +
                                </button>
                                <button
                                  type="button"
                                  aria-label="寬限期年數減 1"
                                  disabled={graceEffectiveMonths < 12}
                                  onClick={() => bumpGraceYears(-1)}
                                  className={isLight ? graceStepperBtnLight : graceStepperBtnDark}
                                >
                                  −
                                </button>
                              </div>
                            </div>
                            <div className="w-full pt-1 [-webkit-tap-highlight-color:transparent]">
                              <input
                                type="range"
                                min={0}
                                max={graceYearsSliderMax}
                                step={1}
                                value={graceYearsSliderValue}
                                onInput={(e) => {
                                  const newY = Number(e.currentTarget.value);
                                  setGraceYM((prev) => clampGraceYM(newY, prev.m, graceMaxMonths));
                                }}
                                onChange={(e) => {
                                  const newY = Number(e.currentTarget.value);
                                  setGraceYM((prev) => clampGraceYM(newY, prev.m, graceMaxMonths));
                                }}
                                disabled={graceMaxMonths <= 0}
                                className={`h-3 w-full min-w-0 cursor-pointer touch-pan-x appearance-none rounded-lg align-middle disabled:cursor-not-allowed disabled:opacity-50 ${isLight ? "bg-slate-200 accent-sky-600" : "bg-slate-700 accent-lime-400"}`}
                                aria-label="寬限期年數拉條（對齊上方「年」）"
                              />
                            </div>
                          </div>
                          <div className="flex min-w-0 flex-col gap-4 overflow-x-clip">
                            <div
                              className={`flex min-w-0 items-stretch overflow-hidden rounded-lg border shadow-[0_1px_4px_rgba(0,0,0,0.05)] ${
                                isLight ? "border-slate-200 bg-white" : "border-slate-600 bg-slate-900/80"
                              }`}
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-1.5 px-2.5 py-2">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  autoComplete="off"
                                  value={graceMonthsPartText}
                                  onChange={(e) => {
                                    const next = sanitizeCalcInputLite(e.currentTarget.value);
                                    setGraceMonthsPartText(next);
                                  }}
                                  onBlur={() => {
                                    commitGraceMonthsPartField();
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      commitGraceMonthsPartField();
                                      (e.currentTarget as HTMLInputElement).blur();
                                    }
                                  }}
                                  className={`min-w-0 flex-1 border-0 bg-transparent text-right text-[24px] font-black tabular-nums leading-none outline-none ring-0 focus:ring-0 ${
                                    isLight ? "text-slate-900 placeholder:text-slate-500/80" : "text-slate-100 placeholder:text-slate-500"
                                  }`}
                                  aria-label="預計寬限期月數（與年數合計總月數）"
                                />
                                <span
                                  className={`shrink-0 text-[15px] font-bold leading-none tabular-nums ${
                                    isLight ? "text-slate-500" : "text-slate-400"
                                  }`}
                                  aria-hidden
                                >
                                  月
                                </span>
                              </div>
                              <div
                                className={`flex w-[2.35rem] shrink-0 flex-col self-stretch overflow-hidden ${isLight ? "bg-slate-300" : "bg-slate-700"}`}
                              >
                                <button
                                  type="button"
                                  aria-label="寬限期月數加 1"
                                  disabled={graceMaxMonths <= 0 || graceEffectiveMonths >= graceMaxMonths}
                                  onClick={() => bumpGraceMonthsPart(1)}
                                  className={isLight ? graceStepperBtnLight : graceStepperBtnDark}
                                >
                                  +
                                </button>
                                <button
                                  type="button"
                                  aria-label="寬限期月數減 1"
                                  disabled={graceEffectiveMonths <= 0}
                                  onClick={() => bumpGraceMonthsPart(-1)}
                                  className={isLight ? graceStepperBtnLight : graceStepperBtnDark}
                                >
                                  −
                                </button>
                              </div>
                            </div>
                            <div className="w-full pt-1 [-webkit-tap-highlight-color:transparent]">
                              <input
                                type="range"
                                min={0}
                                max={graceMonthsSliderMax}
                                step={1}
                                value={graceMonthsSliderValue}
                                onInput={(e) => {
                                  const newM = Number(e.currentTarget.value);
                                  setGraceYM((prev) => clampGraceYM(prev.y, newM, graceMaxMonths));
                                }}
                                onChange={(e) => {
                                  const newM = Number(e.currentTarget.value);
                                  setGraceYM((prev) => clampGraceYM(prev.y, newM, graceMaxMonths));
                                }}
                                disabled={graceMaxMonths <= 0 || graceMonthsSliderMax <= 0}
                                className={`h-3 w-full min-w-0 cursor-pointer touch-pan-x appearance-none rounded-lg align-middle disabled:cursor-not-allowed disabled:opacity-50 ${isLight ? "bg-slate-300 accent-emerald-500" : "bg-slate-700 accent-emerald-400"}`}
                                aria-label="寬限期月數拉條（對齊上方「月」，不含整年）"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-5">
                        <motion.div
                          className={`min-h-[102px] min-w-0 rounded-lg border p-2 ${isLight ? "border border-sky-500/35 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]" : "border-lime-300/45 bg-lime-500/10"}`}
                          animate={{ boxShadow: [isLight ? "0 0 0px rgba(132,204,22,0.06)" : "0 0 0px rgba(173,255,47,0.05)", isLight ? "0 0 14px rgba(132,204,22,0.18)" : "0 0 14px rgba(173,255,47,0.25)", isLight ? "0 0 0px rgba(132,204,22,0.06)" : "0 0 0px rgba(173,255,47,0.05)"] }}
                          transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <p className={`min-w-0 text-[15px] font-bold leading-tight tracking-[0.04em] ${isLight ? "text-slate-600" : "text-lime-200"}`}>
                            總利息將增加
                            <span className={`block text-[13px] font-bold ${isLight ? "text-lime-800/90" : "text-lime-100/85"}`}>（多付冤枉錢）</span>
                          </p>
                          <div className="mt-1 min-w-0 w-full overflow-x-auto overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                            <AnimatePresence mode="wait">
                              <motion.p
                                key={`grace-int-${graceEffectiveMonths}`}
                                initial={{ rotateX: -86, opacity: 0.65, y: -4 }}
                                animate={{ rotateX: 0, opacity: 1, y: 0 }}
                                exit={{ rotateX: 86, opacity: 0.8, y: 3 }}
                                transition={{ duration: 0.28, ease: "easeOut" }}
                                style={{ transformPerspective: 760, transformOrigin: "50% 55%" }}
                                className={`w-max max-w-none whitespace-nowrap text-[clamp(15px,4.2vw,22px)] font-black leading-none tracking-normal tabular-nums ${isLight ? "text-slate-900" : "text-lime-100"}`}
                              >
                                NT$ {formatMoney(graceDelayMetrics.interestIncrease)}
                              </motion.p>
                            </AnimatePresence>
                          </div>
                        </motion.div>
                        <motion.div
                          className={`min-h-[102px] min-w-0 rounded-lg border p-2 ${isLight ? "border border-sky-500/35 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]" : "border-lime-300/45 bg-lime-500/10"}`}
                          animate={{ boxShadow: [isLight ? "0 0 0px rgba(132,204,22,0.06)" : "0 0 0px rgba(173,255,47,0.05)", isLight ? "0 0 14px rgba(132,204,22,0.18)" : "0 0 14px rgba(173,255,47,0.25)", isLight ? "0 0 0px rgba(132,204,22,0.06)" : "0 0 0px rgba(173,255,47,0.05)"] }}
                          transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut", delay: 0.28 }}
                        >
                          <p className={`min-w-0 text-[15px] font-bold leading-tight tracking-[0.04em] ${isLight ? "text-slate-600" : "text-lime-200"}`}>寬限期後每月還款增加額</p>
                          <div className="mt-1 min-w-0 w-full overflow-x-auto overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                            <AnimatePresence mode="wait">
                              <motion.p
                                key={`grace-pay-${graceEffectiveMonths}`}
                                initial={{ rotateX: -86, opacity: 0.65, y: -4 }}
                                animate={{ rotateX: 0, opacity: 1, y: 0 }}
                                exit={{ rotateX: 86, opacity: 0.8, y: 3 }}
                                transition={{ duration: 0.28, ease: "easeOut" }}
                                style={{ transformPerspective: 760, transformOrigin: "50% 55%" }}
                                className={`w-max max-w-none whitespace-nowrap text-[clamp(15px,4.2vw,22px)] font-black leading-none tracking-normal tabular-nums ${isLight ? "text-slate-900" : "text-lime-100"}`}
                              >
                                NT$ {formatMoney(graceDelayMetrics.paymentIncrease)}
                              </motion.p>
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      </div>
                      <div
                        className={`rounded-lg border p-3.5 ${isLight ? "border-slate-200 bg-white text-slate-900 shadow-[0_1px_4px_rgba(0,0,0,0.05)]" : "border-slate-700 bg-slate-900/55 text-slate-100"}`}
                      >
                        {(() => {
                          const g = graceEffectiveMonths;
                          const amortM = graceDelayMetrics.amortMonths;
                          const graceTitle =
                            g <= 0 ? "0 個月" : g % 12 === 0 ? `${g / 12} 年` : `${g} 個月`;
                          const frontPhase =
                            g <= 0 ? "寬限期 0 個月" : g % 12 === 0 ? `前 ${g / 12} 年` : `前 ${g} 個月`;
                          const afterPhase =
                            amortM % 12 === 0 ? `後 ${amortM / 12} 年` : `後 ${amortM} 個月`;
                          const planANum = isLight ? "text-sky-600" : "text-sky-300";
                          const planBNum = isLight ? "text-amber-600" : "text-amber-300";
                          const numCls = `font-black tabular-nums text-[15px] ${planANum}`;
                          const numBCls = `font-black tabular-nums text-[15px] ${planBNum}`;
                          return (
                            <div className="space-y-4">
                              <section>
                                <h3 className={`text-[15px] font-black leading-snug ${isLight ? "text-slate-900" : "text-slate-100"}`}>方案 A：正常還（沒有寬限期）</h3>
                                <ul className={`mt-2 list-disc space-y-2 pl-5 text-[14px] leading-relaxed ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                                  <li>
                                    <strong className={isLight ? "text-slate-900" : "text-slate-100"}>每個月還：</strong>
                                    約{" "}
                                    <span className={numCls}>{formatWanYuanCompare(graceDelayMetrics.planAMonthly, "monthly")}</span>{" "}
                                    萬元。
                                  </li>
                                  <li>
                                    <strong className={isLight ? "text-slate-900" : "text-slate-100"}>{loanYears} 年總利息：</strong>
                                    約{" "}
                                    <span className={numCls}>{formatWanYuanCompare(graceDelayMetrics.planATotalInterest, "interestTotal")}</span>{" "}
                                    萬元。
                                  </li>
                                </ul>
                              </section>
                              <section>
                                <h3 className={`text-[15px] font-black leading-snug ${isLight ? "text-slate-900" : "text-slate-100"}`}>
                                  方案 B：延遲還（使用 {graceTitle}寬限期）
                                </h3>
                                <ul className={`mt-2 list-disc space-y-2 pl-5 text-[14px] leading-relaxed ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                                  <li>
                                    <strong className={isLight ? "text-slate-900" : "text-slate-100"}>{frontPhase}：</strong>
                                    每個月只還利息約{" "}
                                    <span className={numBCls}>{formatWanYuanCompare(graceDelayMetrics.planBInterestOnlyMonthly, "monthly")}</span>{" "}
                                    萬元（感覺很輕鬆）。
                                  </li>
                                  <li>
                                    <strong className={isLight ? "text-slate-900" : "text-slate-100"}>{afterPhase}：</strong>
                                    因為前面都沒還本金，剩下的本金要在更短時間還完，每個月跳升到約{" "}
                                    <span className={numBCls}>{formatWanYuanCompare(graceDelayMetrics.planBAfterGraceMonthly, "monthly")}</span>{" "}
                                    萬元。
                                  </li>
                                  <li>
                                    <strong className={isLight ? "text-slate-900" : "text-slate-100"}>{loanYears} 年總利息：</strong>
                                    約{" "}
                                    <span className={numBCls}>{formatWanYuanCompare(graceDelayMetrics.planBTotalInterest, "interestTotal")}</span>{" "}
                                    萬元。
                                  </li>
                                </ul>
                              </section>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ) : null}

                  {currentPage === 6 ? (
                    <div className="space-y-2">
                      <p className={`text-lg font-black ${isLight ? "text-slate-900" : "text-sky-100"}`}>各種貸款 vs 存股</p>
                      <div
                        className={`rounded-lg border p-2 ${isLight ? "border border-slate-200 bg-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)]" : "border-slate-700 bg-slate-900/60"}`}
                      >
                        <div className="overflow-x-auto pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                          <LoanPresetChipRow presets={loanPresetActions} onApply={applyLoanPreset} />
                        </div>
                      </div>
                      <div className="grid min-w-0 grid-cols-2 gap-2">
                        <InfoCard
                          title="省下利息"
                          value={`NT$ ${formatMoney(stockVsLoanInterestBaseline)}`}
                          tone={
                            isLight
                              ? "text-slate-900 border-slate-200 bg-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
                              : "text-slate-100 border-slate-600 bg-slate-800/80"
                          }
                          subtitle="本金平均方式下，預估總利息"
                          shrinkValue
                          isLight={isLight}
                        />
                        <InfoCard
                          title="預估收益"
                          value={`NT$ ${formatMoney(stockVsLoanEstimatedGain)}`}
                          tone={
                            isLight
                              ? "text-sky-900 border-sky-400 bg-sky-50 shadow-[0_1px_4px_rgba(0,0,0,0.05)] ring-1 ring-sky-400/30"
                              : "text-sky-100 border-sky-500/35 bg-sky-500/10"
                          }
                          subtitle={`複利 ${loanYears} 年 · 不含交易成本`}
                          shrinkValue
                          isLight={isLight}
                        />
                      </div>

                      <InputField
                        compact
                        label="預計存股年化報酬率"
                        unit="%"
                        isLight={isLight}
                        sliderMin={0}
                        sliderMax={50}
                        sliderStep={0.1}
                        value={stockVsInvestPctVal}
                        text={stockVsInvestPctText}
                        onTextChange={(next) => {
                          setStockVsInvestPctText(next);
                          setStockVsInvestPctVal(parseAndClamp(next, stockVsInvestPctVal, 0, 50));
                        }}
                        onCommit={(next) => {
                          const normalized = parseAndClamp(next, stockVsInvestPctVal, 0, 50);
                          setStockVsInvestPctVal(normalized);
                          setStockVsInvestPctText(String(Number(normalized.toFixed(2))));
                        }}
                        onBump={(delta) => {
                          const next = Number(Math.min(50, Math.max(0, stockVsInvestPctVal + delta)).toFixed(2));
                          setStockVsInvestPctVal(next);
                          setStockVsInvestPctText(String(next));
                        }}
                        onSlider={(next) => {
                          const fixed = Number(Math.min(50, Math.max(0, next)).toFixed(2));
                          setStockVsInvestPctVal(fixed);
                          setStockVsInvestPctText(String(fixed));
                        }}
                        bumpStep={0.5}
                      />

                      <div
                        className={`rounded-lg border p-3 ${
                          stockVsLoanPreferInvest
                            ? isLight
                              ? "border-emerald-400 bg-emerald-50 text-emerald-950"
                              : "border-emerald-500/45 bg-emerald-500/10 text-emerald-100"
                            : isLight
                              ? "border-amber-400 bg-amber-50 text-amber-950"
                              : "border-amber-500/45 bg-amber-500/10 text-amber-100"
                        }`}
                      >
                        <p className="text-[14px] font-black leading-snug tracking-[0.03em] break-words [text-wrap:balance]">
                          {stockVsLoanPreferInvest
                            ? "✅ 存股報酬大於貸款利息：建議分批投入股市。"
                            : "⚠️ 貸款利息負擔較重：建議優先進行大額還款。"}
                        </p>
                      </div>

                    </div>
                  ) : null}

                  {currentPage === 7 ? (
                    <div className="space-y-2">
                      <p className="text-lg font-black text-amber-100">風險模擬（升息壓力測試）</p>
                      <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-2">
                        <div className="grid gap-2" style={{ gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)" }}>
                          <InputField
                            compact
                            label="升息模擬"
                            unit="%"
                            isLight={false}
                            sliderMin={0}
                            sliderMax={8}
                            sliderStep={0.25}
                            value={rateShockPctVal}
                            text={rateShockPctText}
                            onTextChange={(next) => {
                              setRateShockPctText(next);
                              setRateShockPctVal(parseAndClamp(next, rateShockPctVal, 0, 8));
                            }}
                            onCommit={(next) => {
                              const normalized = parseAndClamp(next, rateShockPctVal, 0, 8);
                              setRateShockPctVal(normalized);
                              setRateShockPctText(String(Number(normalized.toFixed(2))));
                            }}
                            onBump={(delta) => {
                              const next = Number(Math.min(8, Math.max(0, rateShockPctVal + delta)).toFixed(2));
                              setRateShockPctVal(next);
                              setRateShockPctText(String(next));
                            }}
                            onSlider={(next) => {
                              const fixed = Number(Math.min(8, Math.max(0, next)).toFixed(2));
                              setRateShockPctVal(fixed);
                              setRateShockPctText(String(fixed));
                            }}
                            bumpStep={0.25}
                          />
                          <div className="min-w-0 rounded-lg border border-slate-700 bg-slate-950/40 p-2">
                            <div>
                              <p className="truncate whitespace-nowrap text-[16px] font-bold tracking-[0.04em] text-slate-300">升息後年利率</p>
                              <p className="mt-1 whitespace-nowrap font-mono text-[clamp(16px,4.2vw,22px)] font-black leading-none tracking-[-0.01em] text-sky-200 tabular-nums">
                                {shockedAnnualRate.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <InfoCard
                          title="利息增加"
                          value={`NT$ ${formatMoney(shockedInterestIncrease)}`}
                          tone="text-amber-100 border-amber-500/35 bg-amber-500/10"
                          isLight={false}
                        />
                        <InfoCard
                          title="新每月繳款"
                          value={`NT$ ${formatMoney(shockedOutput.annuityRows[0]?.payment ?? 0)}`}
                          tone="text-orange-100 border-orange-500/35 bg-orange-500/10"
                          isLight={false}
                        />
                      </div>
                    </div>
                  ) : null}

                  {currentPage === 8 ? (
                    <div className="space-y-3">
                      <p className="text-lg font-black text-indigo-100">財富翻轉（把省下利息變資產）</p>
                      <div className="rounded-lg border border-sky-500/35 bg-sky-500/10 p-3">
                        <p className="text-[16px] font-black tracking-[0.03em] text-sky-100">把「少付的利息」當成你的投資本金</p>
                        <p className="mt-2 text-[13px] font-semibold leading-relaxed text-slate-200">
                          這頁會把你在「提前還款」省下的利息，假設改成投入市場，用固定年化去估計多年後可能長到多少（情境試算）。
                        </p>
                        <div className="mt-3 rounded-md border border-sky-500/25 bg-slate-950/30 p-2.5">
                          <p className="text-[13px] font-bold tracking-[0.03em] text-slate-200">
                            省下利息：<span className="font-black text-sky-100">NT$ {formatMoney(prepaySavedInterest)}</span>
                          </p>
                          <p className="mt-1 text-[13px] font-bold tracking-[0.03em] text-slate-200">
                            以 7% 複利 20 年：<span className="font-black text-sky-100">NT$ {formatMoney(freedomProjected)}</span>
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/quick-1"
                        className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-sky-500 px-4 py-3 text-[16px] font-black text-white transition hover:bg-sky-400"
                      >
                        <span aria-hidden>🤖</span>
                        <span>前往存股複利計算機</span>
                      </Link>
                    </div>
                  ) : null}
                </motion.section>
              </AnimatePresence>
            </div>

            <div
              className={`sticky bottom-2 z-20 -mx-0.5 rounded-lg border px-1 py-1.5 shadow-lg ${
                isLight
                  ? "border-slate-200 bg-slate-100/95 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
                  : "border-slate-700 bg-[#0f172a]/95"
              }`}
            >
              <div className={`relative flex items-stretch border-b pb-1 ${isLight ? "border-slate-200" : "border-slate-700"}`}>
                <div
                  className={`relative flex shrink-0 items-center border-r pl-0.5 pr-2 ${
                    isLight ? "border-slate-200 bg-white" : "border-slate-700 bg-[#0f172a]/95"
                  }`}
                >
                  {(() => {
                    const tab = pageTabs[0];
                    return (
                      <button
                        key={`sticky-bottom-nav-${tab.id}`}
                        type="button"
                        onClick={() => switchPage(tab.id)}
                        className={`relative min-w-[2.75rem] appearance-none border-0 bg-transparent px-1.5 py-1.5 text-[14px] tracking-[0.02em] shadow-none transition whitespace-nowrap ${
                          currentPage === tab.id
                            ? isLight
                              ? "font-black text-slate-900"
                              : "font-black text-white"
                            : isLight
                              ? "font-bold text-slate-600 hover:text-slate-900"
                              : "font-bold text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {tab.title}
                        {currentPage === tab.id ? (
                          <span className={`absolute inset-x-1 -bottom-1 h-[2.5px] rounded-full ${isLight ? "bg-sky-600" : "bg-sky-500"}`} />
                        ) : null}
                      </button>
                    );
                  })()}
                </div>
                <div
                  className="relative z-0 min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  <div className="flex min-w-max items-center gap-0.5 pl-2">
                    {visibleScrollableTabs.map((tab) => (
                      <button
                        key={`sticky-bottom-nav-${tab.id}`}
                        type="button"
                        onClick={() => switchPage(tab.id)}
                        className={`relative appearance-none border-0 bg-transparent px-1.5 py-1.5 whitespace-nowrap text-[14px] tracking-[0.02em] shadow-none transition ${
                          currentPage === tab.id
                            ? isLight
                              ? "font-black text-slate-900"
                              : "font-black text-white"
                            : isLight
                              ? "font-bold text-slate-600 hover:text-slate-900"
                              : "font-bold text-slate-400 hover:text-slate-200"
                        } ${tab.id === 2 ? "rounded-md ring-1 ring-sky-500/55 shadow-[0_0_10px_rgba(14,165,233,0.22)]" : ""}`}
                      >
                        {tab.title}
                        {tab.id === 2 ? <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-sky-600 shadow-[0_0_8px_rgba(14,165,233,0.55)]" /> : null}
                        {currentPage === tab.id ? <span className={`absolute inset-x-1 -bottom-1 h-[2.5px] rounded-full ${isLight ? "bg-sky-600" : "bg-sky-500"}`} /> : null}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {!embeddedInMiniBlog ? (
              <div id="quick11-excel-lead" className="mt-2 flex flex-col gap-2.5">
                <Quick11ExcelLeadBlock isLight={isLight} compact onOpenWizard={() => setWizardOpen(true)} />
              </div>
            ) : null}

            {!embeddedInMiniBlog ? (
              <div className="mt-2.5">
                <Quick11BottomToolsCard isLight={isLight} />
              </div>
            ) : null}

            {!embeddedInMiniBlog ? (
              <>
                <Quick11ShareSnapshotCapture snapshotRef={shareSnapshotRef} data={shareSnapshotData} />
                <Quick11ExcelWizardModal open={wizardOpen} onClose={() => setWizardOpen(false)} snapshotRef={shareSnapshotRef} />
                <Quick11ExitIntentModal
                  blocked={wizardOpen}
                  onOpenWizard={() => setWizardOpen(true)}
                />
                {bottomCta.show ? (
                  <Quick11IdleNudgeCard
                    visible={idleNudge.visible}
                    copy={{
                      title: bottomCta.title,
                      body: bottomCta.body,
                      button: bottomCta.button,
                      subtitle: bottomCta.subtitle,
                      highlight: bottomCta.highlight,
                    }}
                    onDismiss={idleNudge.dismiss}
                  />
                ) : null}
                <div id="quick11-bankruptcy-blog" className="mt-2">
                  <QuickBlogLinksToggle quickRoute="/quick-11" title="📚 破產計算機延伸文章（點我展開）" />
                  <div className="mt-3">
                    <QuickSeoExtras id={11} />
                    <QuickSeoArticle id={11} />
                  </div>
                </div>
              </>
            ) : null}
          </section>
        </div>

        <RateShowdownModal
          open={rateShowdownOpen}
          onClose={() => setRateShowdownOpen(false)}
          isLight={isLight}
          baselineRatePct={annualRate}
          methodLabel={rateShowdownMethodLabel}
          rows={rateShowdownRows}
        />

        <AnimatePresence>
          {isSheetOpen ? (
            <motion.button
              key="quick11-detail-backdrop"
              type="button"
              aria-label="關閉明細"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70"
              onClick={() => setIsSheetOpen(false)}
            />
          ) : null}
          {isSheetOpen ? (
              <motion.section
                key="quick11-detail-panel"
                initial={{ y: 48, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 48, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className={`fixed inset-x-0 bottom-0 z-50 max-h-[86vh] rounded-t-xl border p-4 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] ${
                  isLight ? "border-slate-200 bg-white" : "border-slate-700 bg-[#0b1220]"
                }`}
              >
                <div className="mx-auto w-full max-w-4xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                        {method === "annuity" ? "本息均攤明細" : "本金平均攤還明細"}
                      </p>
                      <h3 className={`mt-1 text-lg font-black ${isLight ? "text-slate-900" : "text-slate-100"}`}>銀行每一期怎麼拿走你的錢</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSheetOpen(false)}
                      className={`rounded-md border px-3 py-1.5 text-sm font-bold transition ${
                        isLight ? "border-slate-200 bg-slate-100 text-slate-900 shadow-[0_1px_4px_rgba(0,0,0,0.05)] hover:bg-slate-200" : "border-slate-600 text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      關閉
                    </button>
                  </div>

                  <div className={`mt-3 overflow-auto rounded-xl border ${isLight ? "border-slate-200" : "border-slate-700"}`}>
                    <table className="min-w-full text-left text-sm">
                      <thead className={`sticky top-0 ${isLight ? "bg-white" : "bg-slate-900"}`}>
                        <tr className={`border-b ${isLight ? "border-slate-200 text-slate-600" : "border-slate-700 text-slate-400"}`}>
                    <th className="px-3 py-2 font-semibold">期數</th>
                    <th className="px-3 py-2 font-semibold">每期還款</th>
                          <th className="px-3 py-2 font-semibold">該期本金</th>
                          <th className="px-3 py-2 font-semibold">該期利息（銀行拿走的錢）</th>
                          <th className="px-3 py-2 font-semibold">剩餘本金</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, idx) => {
                          const isTop = topInterestPeriods.has(row.period);
                          return (
                            <tr
                              key={row.period}
                              className={`border-b ${isLight ? "border-slate-200" : "border-slate-700"} ${
                                isTop ? "bg-red-500/10" : isLight ? (idx % 2 === 0 ? "bg-white" : "bg-[#CBD5E1]") : "bg-slate-950"
                              }`}
                            >
                              <td className={`px-3 py-2 font-semibold ${isTop ? (isLight ? "text-red-700" : "text-red-200") : isLight ? "text-slate-600" : "text-slate-300"}`}>
                                {row.period}
                              </td>
                        <td className={`px-3 py-2 ${isLight ? "text-slate-900" : "text-slate-200"}`}>{formatMoney(row.payment)}</td>
                              <td className={`px-3 py-2 ${isLight ? "text-slate-900" : "text-slate-200"}`}>{formatMoney(row.principal)}</td>
                              <td className={`px-3 py-2 font-semibold ${isTop ? (isLight ? "text-red-700" : "text-red-300") : isLight ? "text-slate-900" : "text-amber-200"}`}>
                                {formatMoney(row.interest)}
                              </td>
                              <td className={`px-3 py-2 ${isLight ? "text-slate-600" : "text-slate-400"}`}>{formatMoney(row.balance)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <Link
                    href="/quick-1"
                    className={`mt-3 inline-flex w-full items-center justify-center gap-1 rounded-md px-4 py-2.5 text-base font-black text-white transition ${
                      isLight ? "bg-slate-900 hover:bg-slate-800" : "bg-sky-500 hover:bg-sky-400"
                    }`}
                  >
                    <span aria-hidden>🤖</span>
                    <span>前往存股複利計算機</span>
                  </Link>
                </div>
              </motion.section>
          ) : null}
        </AnimatePresence>
      </Quick11InputContext.Provider>
    </main>
  );
}

function MiniSettingsHeader(props: { isLight: boolean }) {
  const { isLight } = props;
  const { loanAmount, annualRate, loanYears, monthlyIncome } = useQuick11Input();
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className={`mt-2 rounded-md border px-2 py-1.5 backdrop-blur-md ${
        isLight
          ? "border border-slate-200 bg-slate-100 text-slate-900 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
          : "border-slate-700 bg-sky-950/65 shadow-[inset_0_1px_0_rgba(56,189,248,0.12)] ring-1 ring-sky-500/15"
      }`}
    >
      <div
        className={`grid grid-cols-2 gap-x-2 gap-y-1 text-[13px] font-semibold tracking-[0.04em] ${
          isLight ? "text-slate-600" : "text-slate-200"
        }`}
      >
        <p>貸款 {formatMoney(loanAmount)}</p>
        <p>利率 {annualRate.toFixed(2)}%</p>
        <p>年期 {loanYears} 年</p>
        <p>月收 {formatMoney(monthlyIncome)}</p>
      </div>
    </motion.div>
  );
}

function ResultPage(props: {
  label: string;
  payment: string;
  paymentDiffVsCompare?: number;
  compareLabel?: string;
  totalInterest: number;
  totalRepayment: number;
  dtiPct: number;
  dtiRatio: number;
  warning: { label: string; message: string; wrapClass: string; meterClass: string };
  recommend?: boolean;
  rows: PaymentRow[];
  compareRows?: PaymentRow[];
  showPkSection?: boolean;
  isLight?: boolean;
}) {
  const { label, payment, paymentDiffVsCompare, compareLabel = "另一方案", totalInterest, totalRepayment, dtiPct, dtiRatio, warning, recommend = false, rows, compareRows, showPkSection = false, isLight = false } = props;
  const diffValue = paymentDiffVsCompare ?? 0;
  const diffPrefix = diffValue >= 0 ? "+" : "-";
  const pkSeries = useMemo(() => {
    if (!showPkSection || !compareRows?.length) return null;
    return buildInterestPkSeries(rows, compareRows);
  }, [showPkSection, rows, compareRows]);
  return (
    <div className="space-y-2">
      <p className={`text-lg font-black ${isLight ? "text-slate-900" : recommend ? "text-sky-200" : "text-slate-200"}`}>{label}</p>
      <div className={`grid gap-2 ${paymentDiffVsCompare != null ? "grid-cols-2" : "grid-cols-1"}`}>
        <div
          className={`rounded-lg border p-2.5 ${
            isLight ? "border border-slate-200 bg-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)]" : "border-slate-700 bg-slate-900/70"
          }`}
        >
          <div>
            <p className={`truncate whitespace-nowrap text-[16px] font-bold tracking-[0.04em] ${isLight ? "text-slate-600" : "text-slate-300"}`}>每月繳款（首月）</p>
            <AnimatePresence mode="wait">
              <motion.div
                key={`payment-${payment}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className={`mt-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[clamp(17px,4.4vw,24px)] font-black leading-none tracking-[-0.01em] ${isLight ? "text-slate-900" : "text-sky-200"}`}
              >
                {payment}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        {paymentDiffVsCompare != null ? (
          <motion.div
            className={`rounded-lg border p-2.5 ${isLight ? "border-amber-300 bg-amber-50 shadow-[0_1px_4px_rgba(0,0,0,0.05)]" : "border-amber-400/50 bg-amber-500/10"}`}
            animate={{
              rotateX: [0, 88, 0],
              scale: [1, 0.985, 1],
            }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              repeatDelay: 0.5,
              ease: "easeInOut",
            }}
            style={{ transformPerspective: 900, transformOrigin: "50% 55%" }}
          >
            <div>
              <p className={`truncate whitespace-nowrap text-[16px] font-bold tracking-[0.04em] ${isLight ? "text-amber-800" : "text-amber-200"}`}>比{compareLabel}多(少)多少</p>
              <p className={`mt-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[clamp(16px,4.1vw,22px)] font-black leading-none tracking-[-0.01em] ${isLight ? "text-amber-900" : "text-amber-100"}`}>
                {diffPrefix}NT$ {formatMoney(Math.abs(diffValue))}
              </p>
            </div>
          </motion.div>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <InfoCard
          title="送給銀行利息"
          value={`NT$ ${formatMoney(totalInterest)}`}
          tone={
            isLight
              ? "text-amber-950 border-amber-300 bg-amber-50 shadow-[0_1px_6px_rgba(245,158,11,0.22)] ring-1 ring-amber-400/35"
              : "text-slate-100 border-slate-700 bg-slate-900/60"
          }
          shrinkValue
          isLight={isLight}
          goldGlow={!isLight}
        />
        <InfoCard
          title="總還款金額"
          value={`NT$ ${formatMoney(totalRepayment)}`}
          tone={
            isLight
              ? "text-slate-900 border-slate-200 bg-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
              : "text-slate-100 border-slate-700 bg-slate-900/60"
          }
          isLight={isLight}
        />
      </div>
      {showPkSection && pkSeries ? (
        <div
          className={`rounded-lg border p-2 ${
            isLight ? "border border-slate-200 bg-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)]" : "border-slate-700 bg-slate-900/70"
          }`}
        >
          <p className={`text-[14px] font-black ${isLight ? "text-slate-900" : "text-sky-100"}`}>跟{compareLabel} PK</p>
          <p className={`mt-1 text-[11px] ${isLight ? "text-slate-600" : "text-slate-300"}`}>紅線是目前方案累積利息，藍線是{compareLabel}累積利息。</p>
          <div className="mt-2">
            <QuickDualLineChart
              years={pkSeries.years}
              seriesA={pkSeries.annuityCum}
              seriesB={pkSeries.equalCum}
              legendA="目前方案：累積利息"
              legendB={`${compareLabel}：累積利息`}
              title="累積利息走勢比較"
            />
          </div>
          <details className={`mt-2 rounded-md border p-2 ${isLight ? "border-slate-200 bg-white" : "border-slate-700 bg-slate-950/70"}`}>
            <summary className={`cursor-pointer text-[13px] font-bold ${isLight ? "text-slate-800" : "text-slate-200"}`}>展開看每一期利息 / 本金 / 剩餘本金</summary>
            <div className="mt-2 max-h-[260px] overflow-auto rounded-md border border-slate-700">
              <table className="w-max min-w-[760px] table-auto text-left text-sm">
                <colgroup>
                  <col className="w-[70px]" />
                  <col className="w-[120px]" />
                  <col className="w-[190px]" />
                  <col className="w-[120px]" />
                  <col className="w-[120px]" />
                  <col className="w-[140px]" />
                </colgroup>
                <thead className="sticky top-0 bg-slate-900">
                  <tr className="border-b border-slate-700 text-slate-300">
                    <th className="whitespace-nowrap px-2 py-1.5">期數</th>
                    <th className="whitespace-nowrap px-2 py-1.5">每期還款</th>
                    <th className="whitespace-nowrap px-2 py-1.5">每期利息</th>
                    <th className="whitespace-nowrap px-2 py-1.5">比{compareLabel}多(少)利息</th>
                    <th className="whitespace-nowrap px-2 py-1.5">每期本金</th>
                    <th className="whitespace-nowrap px-2 py-1.5">剩餘本金</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const peerInterest = compareRows?.[idx]?.interest ?? row.interest;
                    const pkDiff = row.interest - peerInterest;
                    const interestPct = row.payment <= 0 ? 0 : (row.interest / row.payment) * 100;
                    const isFirst = row.period === 1;
                    return (
                      <tr
                        key={`annuity-row-${row.period}`}
                        className={`border-b border-slate-800 text-slate-200 ${idx % 2 === 0 ? "bg-slate-950/80" : "bg-slate-900/55"}`}
                      >
                        <td className="whitespace-nowrap px-2 py-3 font-semibold">{row.period}</td>
                        <td className="whitespace-nowrap px-2 py-3">{formatMoney(row.payment)}</td>
                        <td className={`whitespace-nowrap px-2 py-3 ${isFirst ? "font-black text-amber-200" : ""}`}>
                          {formatMoney(row.interest)}
                          <span className="ml-1 text-[11px] text-slate-400">({interestPct.toFixed(0)}%)</span>
                          {isFirst ? <span className="ml-1 rounded bg-amber-400/20 px-1 py-0.5 text-[10px] font-bold text-amber-200">最高利息期</span> : null}
                        </td>
                        <td className={`whitespace-nowrap px-2 py-3 font-bold ${pkDiff > 0 ? "text-rose-300" : pkDiff < 0 ? "text-emerald-300" : "text-slate-300"}`}>
                          {pkDiff > 0 ? "+" : pkDiff < 0 ? "-" : ""}
                          NT$ {formatMoney(Math.abs(pkDiff))}
                        </td>
                        <td className="whitespace-nowrap px-2 py-3">{formatMoney(row.principal)}</td>
                        <td className="whitespace-nowrap px-2 py-3">{formatMoney(row.balance)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-2 rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-2 text-[13px] font-semibold text-sky-100">
              看完了 {rows.length} 期的代價，想提早結束這場賽跑嗎？
              <Link href="/quick-1" className="ml-1 underline underline-offset-2">
                前往財富自由計算機
              </Link>
            </div>
          </details>
        </div>
      ) : null}
      <div className={`rounded-lg border px-2 py-2 ${warning.wrapClass}`}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-black">預警</p>
          {dtiRatio > 0.5 ? (
            <motion.p className="text-sm font-black" animate={{ scale: [1, 1.08, 1], opacity: [1, 0.75, 1] }} transition={{ duration: 1.35, repeat: Infinity, ease: "easeInOut" }}>
              DTI {dtiPct.toFixed(1)}%
            </motion.p>
          ) : (
            <p className="text-sm font-black">DTI {dtiPct.toFixed(1)}%</p>
          )}
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
          <motion.div className={`h-full ${warning.meterClass}`} initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(0, dtiPct))}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>
    </div>
  );
}

function fitTextToContainerWidth(line: HTMLElement, containerWidth: number, minPx: number, maxPx: number) {
  if (containerWidth <= 0) return;
  line.style.fontSize = `${maxPx}px`;
  if (line.scrollWidth <= containerWidth) return;
  let lo = minPx;
  let hi = maxPx;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    line.style.fontSize = `${mid}px`;
    if (line.scrollWidth <= containerWidth) lo = mid;
    else hi = mid;
  }
  line.style.fontSize = `${lo}px`;
}

/** 依容器寬度縮放字級（標題、欄位名等），避免手機上變成 … */
function ShrinkFitText(props: { children: string; className?: string; minPx?: number; maxPx?: number }) {
  const { children, className = "", minPx = 9, maxPx = 16 } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);

  const fit = useCallback(() => {
    const container = containerRef.current;
    const line = lineRef.current;
    if (!container || !line) return;
    fitTextToContainerWidth(line, container.clientWidth, minPx, maxPx);
  }, [minPx, maxPx]);

  useLayoutEffect(() => {
    fit();
    const id = requestAnimationFrame(() => fit());
    return () => cancelAnimationFrame(id);
  }, [children, fit]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => fit());
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  return (
    <div ref={containerRef} className="min-w-0 w-full flex-1 overflow-hidden">
      <span ref={lineRef} className={`block whitespace-nowrap leading-tight ${className}`} style={{ fontSize: maxPx }}>
        {children}
      </span>
    </div>
  );
}

/** 依容器寬度縮放字級，避免大數字被 ellipsis 截斷（首頁總繳利息等）。 */
function ShrinkFitCardAmount(props: { animKey: string; children: string; minPx?: number; maxPx?: number }) {
  const { animKey, children, minPx = 9, maxPx = 21 } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLParagraphElement>(null);

  const fit = useCallback(() => {
    const container = containerRef.current;
    const line = lineRef.current;
    if (!container || !line) return;
    fitTextToContainerWidth(line, container.clientWidth, minPx, maxPx);
  }, [minPx, maxPx]);

  useLayoutEffect(() => {
    fit();
    const id = requestAnimationFrame(() => fit());
    return () => cancelAnimationFrame(id);
  }, [children, fit]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => fit());
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  return (
    <div ref={containerRef} className="mt-1 min-w-0 w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={animKey}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
        >
          <p
            ref={lineRef}
            className="whitespace-nowrap font-mono font-black leading-none tracking-[-0.015em] tabular-nums text-inherit"
            style={{ fontSize: maxPx }}
          >
            {children}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function InfoCard(props: {
  title: string;
  value: string;
  tone: string;
  subtitle?: string;
  shrinkValue?: boolean;
  /** 深色主題：金邊光暈 + 輕掃光（淺色主題不套用，避免對比過花） */
  goldGlow?: boolean;
  isLight?: boolean;
}) {
  const { title, value, tone, subtitle, shrinkValue = false, goldGlow = false, isLight = false } = props;
  const ring = goldGlow && !isLight ? goldStat.q11GoldStat : "";
  return (
    <div className={`min-w-0 rounded-lg border p-2 ${tone} flex min-h-[94px] flex-col ${ring}`.trim()}>
      <div className={ring ? goldStat.q11GoldInner : "contents"}>
        <ShrinkFitText minPx={10} maxPx={16} className={`font-bold tracking-[0.04em] ${isLight ? "text-slate-600" : "text-slate-300"}`}>
          {title}
        </ShrinkFitText>
        {shrinkValue ? (
          <ShrinkFitCardAmount animKey={`${title}-${value}`}>{value}</ShrinkFitCardAmount>
        ) : (
          <AnimatePresence mode="wait">
            <motion.p
              key={`${title}-${value}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(14px,3.8vw,21px)] font-black leading-none tracking-[-0.015em]"
            >
              {value}
            </motion.p>
          </AnimatePresence>
        )}
        {subtitle ? <p className={`mt-1 text-[11px] leading-snug ${isLight ? "text-slate-500" : "text-slate-400"}`}>{subtitle}</p> : null}
      </div>
    </div>
  );
}

function TotalRepaymentCard(props: {
  principal: number;
  totalInterest: number;
  totalRepayment: number;
  delay?: number;
  isLight?: boolean;
}) {
  const { principal, totalInterest, totalRepayment, delay = 0, isLight = false } = props;
  const [displayValue, setDisplayValue] = useState(Math.round(totalRepayment));
  const previousValueRef = useRef(Math.round(totalRepayment));
  const [flipToken, setFlipToken] = useState(0);

  useEffect(() => {
    const from = previousValueRef.current;
    const to = Math.round(totalRepayment);
    setFlipToken((n) => n + 1);
    const controls = animate(from, to, {
      duration: 0.5,
      delay,
      ease: "easeOut",
      onUpdate: (v) => setDisplayValue(Math.round(v)),
    });
    previousValueRef.current = to;
    return () => controls.stop();
  }, [totalRepayment, delay]);

  const warnMedium = totalInterest > principal / 2;
  const warnHigh = totalInterest > principal;
  const titleClass = warnMedium ? "text-orange-300" : "text-slate-400";
  /** 金黃脈動僅保留「多出多少」格；總繳金額維持藍色重點或紅色警示 */
  const cardBorder = warnHigh ? "rgba(239,68,68,0.65)" : "#3b82f6";
  const cardGlowA = warnHigh ? "rgba(127,29,29,0.55)" : "rgba(59,130,246,0.35)";
  const cardGlowB = warnHigh ? "rgba(69,10,10,0.45)" : "rgba(8,47,73,0.25)";
  const bgClass = warnHigh ? "bg-red-950/35" : "bg-sky-500/12";

  return (
    <motion.div
      className={`rounded-lg border p-2 ${bgClass}`}
      animate={{
        borderColor: [cardBorder, "#1e3a8a", cardBorder],
        boxShadow: [`0 0 0px ${cardGlowA}`, `0 0 12px ${cardGlowA}`, `0 0 0px ${cardGlowB}`],
      }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      whileHover={{ scale: 1.012 }}
      whileTap={{ scale: 0.985 }}
    >
      <div>
        <p className={`truncate whitespace-nowrap text-[16px] font-bold tracking-[0.04em] ${titleClass}`}>總繳金額</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={`total-repayment-flip-${flipToken}`}
            initial={{ opacity: 0.72, rotateX: -88, y: -4 }}
            animate={{ opacity: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0.9, rotateX: 86, y: 3 }}
            transition={{ duration: 0.28, ease: "easeOut", delay }}
            style={{ transformPerspective: 700, transformOrigin: "50% 60%" }}
            className={`mt-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[clamp(16px,4.1vw,22px)] font-black leading-none tracking-[-0.01em] ${warnHigh ? "text-red-200" : "text-sky-100"}`}
          >
            NT$ {formatMoney(displayValue)}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/** 首頁貸款總額與「各種貸款 vs 存股」共用：六種情境捷徑（樣式與首頁 InputField 內一致）。 */
function LoanPresetChipRow(props: { presets: LoanPresetAction[]; onApply: (preset: LoanPresetAction) => void }) {
  const { presets, onApply } = props;
  if (!presets.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {presets.map((preset) => (
        <button
          key={preset.key}
          type="button"
          onClick={() => onApply(preset)}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-600 bg-slate-800 px-1.5 py-1 text-[11px] font-semibold text-slate-100 transition hover:border-sky-400 hover:text-sky-200"
          title={`${preset.label}：NT$ ${formatMoney(preset.amount)} / ${preset.annualRate}% / ${preset.years}年 / 月收 NT$ ${formatMoney(preset.monthlyIncome)}`}
        >
          <span aria-hidden>{preset.icon}</span>
          <span>{preset.label}</span>
        </button>
      ))}
    </div>
  );
}

type InputFieldProps = {
  compact?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  label: string;
  unit: string;
  value: number;
  text: string;
  sliderMin: number;
  sliderMax: number;
  sliderStep: number;
  bumpStep: number;
  quickActions?: Array<{ label: string; delta: number }>;
  presetActions?: LoanPresetAction[];
  onApplyPreset?: (preset: LoanPresetAction) => void;
  onTextChange: (raw: string) => void;
  onCommit: (raw: string) => void;
  onBump: (delta: number) => void;
  onSlider: (value: number) => void;
  onEnterNext?: () => void;
  isLight?: boolean;
};

function InputField(props: InputFieldProps) {
  const { compact = false, label, unit, inputRef, value, text, sliderMin, sliderMax, sliderStep, bumpStep, quickActions, presetActions, onApplyPreset, onTextChange, onCommit, onBump, onSlider, onEnterNext, isLight = false } = props;
  const localInputRef = useRef<HTMLInputElement>(null);
  const labelMaxPx = compact ? 13 : 16;
  const labelMinPx = compact ? 9 : 11;
  const inputMaxPx = compact ? 15 : 22;
  const inputMinPx = compact ? 10 : 14;

  const fitInputFont = useCallback(() => {
    const input = localInputRef.current;
    if (!input) return;
    fitTextToContainerWidth(input, input.clientWidth, inputMinPx, inputMaxPx);
  }, [inputMinPx, inputMaxPx]);

  useLayoutEffect(() => {
    fitInputFont();
    const id = requestAnimationFrame(() => fitInputFont());
    return () => cancelAnimationFrame(id);
  }, [text, fitInputFont]);

  useEffect(() => {
    const input = localInputRef.current;
    if (!input || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => fitInputFont());
    ro.observe(input);
    return () => ro.disconnect();
  }, [fitInputFont]);

  const setInputRefs = useCallback(
    (el: HTMLInputElement | null) => {
      localInputRef.current = el;
      if (inputRef) inputRef.current = el;
    },
    [inputRef],
  );

  return (
    <label
      className={`block rounded-lg border ${compact ? "p-1.5" : "p-2"} ${
        isLight ? "border border-slate-200 bg-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)]" : "border-slate-700 bg-slate-900/55"
      }`}
    >
      {presetActions?.length ? (
        <div className="mb-1.5">
          <LoanPresetChipRow presets={presetActions} onApply={(p) => onApplyPreset?.(p)} />
        </div>
      ) : null}
      <div className={`mb-1.5 flex items-center justify-between gap-1.5 ${compact ? "min-h-[20px]" : "min-h-[22px]"}`}>
        <ShrinkFitText
          minPx={labelMinPx}
          maxPx={labelMaxPx}
          className={`font-semibold tracking-[0.03em] ${isLight ? "text-slate-900" : "text-slate-200"}`}
        >
          {label}
        </ShrinkFitText>
        <span
          className={`shrink-0 whitespace-nowrap font-semibold tracking-[0.03em] ${compact ? "text-[12px]" : "text-[15px]"} ${
            isLight ? "text-slate-600" : "text-slate-300"
          }`}
        >
          {unit}
        </span>
      </div>
      <div className="flex min-w-0 items-stretch gap-1.5">
        <input
          ref={setInputRefs}
          value={text}
          onChange={(e) => onTextChange(sanitizeCalcInputLite(e.target.value))}
          onBlur={(e) => onCommit(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onCommit((e.currentTarget as HTMLInputElement).value);
              if (onEnterNext) onEnterNext();
              else (e.currentTarget as HTMLInputElement).blur();
            }
          }}
          className={`min-w-0 w-full rounded-md border font-black outline-none ${compact ? "h-9 px-1.5 tracking-[-0.015em]" : "h-10 px-3 tracking-[-0.01em]"} ${
            isLight
              ? "border-slate-200 bg-white text-slate-900 placeholder:text-slate-500/80 focus:border-sky-500"
              : "border-slate-600 bg-[#0b1220] text-slate-100 placeholder:text-slate-500 focus:border-sky-400"
          }`}
          style={{ fontSize: inputMaxPx }}
          inputMode="decimal"
          placeholder="支援 +-*/"
        />
        <div className={`grid shrink-0 grid-rows-2 gap-1 ${compact ? "w-8" : "w-9"}`}>
          <button
            type="button"
            onClick={() => onBump(bumpStep)}
            className={`rounded-sm border font-bold ${compact ? "h-[19px] text-[12px]" : "h-[21px] text-[13px]"} ${
              isLight ? "border-slate-200 bg-white text-slate-900 hover:bg-slate-100" : "border-slate-600 bg-slate-900/80 text-slate-100 hover:bg-slate-800"
            }`}
          >
            +
          </button>
          <button
            type="button"
            onClick={() => onBump(-bumpStep)}
            className={`rounded-sm border font-bold ${compact ? "h-[19px] text-[12px]" : "h-[21px] text-[13px]"} ${
              isLight ? "border-slate-200 bg-white text-slate-900 hover:bg-slate-100" : "border-slate-600 bg-slate-900/80 text-slate-100 hover:bg-slate-800"
            }`}
          >
            -
          </button>
        </div>
      </div>
      <input
        type="range"
        min={sliderMin}
        max={sliderMax}
        step={sliderStep}
        value={value}
        onChange={(e) => onSlider(Number(e.currentTarget.value))}
        className={`mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-lg ${isLight ? "bg-slate-200 accent-sky-600" : "bg-slate-700 accent-sky-500"}`}
      />
      {quickActions?.length ? (
        <div className="mt-1.5 flex w-full gap-1 overflow-x-auto pb-0.5">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => onBump(action.delta)}
              className={`shrink-0 rounded-sm border px-2.5 py-1.5 text-[12px] font-semibold tracking-[0.03em] transition ${
                isLight
                  ? "border-slate-200 bg-white text-slate-900 shadow-[0_1px_4px_rgba(0,0,0,0.05)] hover:bg-slate-100"
                  : "border-slate-600 bg-slate-900/80 text-slate-100 hover:bg-slate-800"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </label>
  );
}

export default QuickCalculator11Content;
