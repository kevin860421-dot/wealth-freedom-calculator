"use client";

import Link from "next/link";
import { FooterStatsStrip } from "./footer-stats-strip";
import {
  buildSnapshotFromInputs,
  getDefaultCalculatorRepository,
  type CalculatorSnapshotV1,
  type PayoutFrequencyPersist,
} from "../lib/calculator-persistence";
import { OPEN_LOAD_TARGET_MODAL_EVENT } from "../lib/watchlist-modal-events";
import { LoadTargetModal, SaveTargetModal } from "./components/saved-target-modals";
import {
  TICKER_PRESETS,
  buildTickerDividendMonthsMap,
  buildDefault54cRatioMap,
} from "./ticker-presets";
import {
  blogPostPath,
  getBlogPostBySlug,
  getHomeFooterBlogPosts,
  isBlogPostPublished,
} from "./blog/posts/registry";
import { HomeFooterWatchlistSection } from "./components/home-footer-watchlist-section";
import { MobileGoalSettingSection } from "./components/mobile-goal-setting-section";
import { MobileHeroSection } from "./components/mobile-hero-section";
import { MobileStockParamsSection } from "./components/mobile-stock-params-section";
import type { StockParamsAdvancedBlockProps } from "./components/stock-params-advanced-block";
import { TaxSettingsDesktopClassicLeftColumn } from "./components/manual-tax-block";
import { MobileNhi2ImpactBlock } from "./components/mobile-nhi2-impact-block";
import { TaxSettingsLeftPanel, type TaxSettingsMode } from "./components/tax-settings-panel";

/** 各標的除息月份（與 ticker-presets 同步） */
const ETF_DIVIDEND_MONTHS = buildTickerDividendMonthsMap();

/** 首次載入與「恢復預設」時使用的預設標的（與 ticker-presets 第一檔一致） */
const DEFAULT_SELECTED_ETF_ID = "0050";
const DEFAULT_ETF_PRESET = TICKER_PRESETS.find((p) => p.id === DEFAULT_SELECTED_ETF_ID) ?? TICKER_PRESETS[0]!;
/** 試算起始年月預設（與 getPeriodSnapshots 之 startYear／startMonth 預設一致） */
const DEFAULT_SIM_START_YEAR = 2026;
const DEFAULT_SIM_START_MONTH = 3;
/** 標的代碼篩選僅供當次操作；不寫入快照，避免還原後下拉只剩子集合 */
const ETF_CODE_FILTER_PERSIST = "";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";

/** 頁尾「版權說明」版本號（請與 package.json 的 version 對齊） */
const APP_VERSION = "0.1.0";

const homeFooterBlogPosts = getHomeFooterBlogPosts();

/** 首頁 Hero：專欄「第一篇」slug；僅已達公開時間時顯示一條文字超連結（非按鈕） */
const HOME_HERO_FIRST_SLUG = "2026-dividend-tax-guide" as const;
const homeHeroFirstEntry = getBlogPostBySlug(HOME_HERO_FIRST_SLUG);
const showHomeHeroFirstLink =
  homeHeroFirstEntry != null && isBlogPostPublished(homeHeroFirstEntry.publishAtIso);

const MONTHS = 40 * 12; // 模擬 40 年
const TARGET_Q1 = 30000; // 每季 3 萬
const TARGET_Q2 = 150000; // 每季 15 萬
const NZ_TARGET_YEAR = 2028;

type PayoutFrequency = "month" | "quarter" | "semiannual" | "year";

type SimulationResult = {
  milestone30000Index: number | null;
  milestone150000Index: number | null;
  milestoneUserTargetIndex: number | null;
  milestone30000QuarterDividend: number | null;
  milestone150000QuarterDividend: number | null;
  totalDividends: number;
  finalBalance: number;
  nzProgressPercent: number;
  yearsTo30000: number | null;
  monthsTo30000: number | null;
  yearsTo150000: number | null;
  monthsTo150000: number | null;
  yearsToUserTarget: number | null;
  monthsToUserTarget: number | null;
};

type PeriodSnapshot = {
  periodLabel: string;
  year: number;
  periodInYear: number;
  balance: number;
  shares: number;
  lastPeriodDividend: number;
  /** 扣所得稅與二代健保後實領（用於顯示） */
  afterTaxDividend: number;
  reinvestPct: number;
  reinvestAmount: number;
  sharesBoughtThisPeriod: number;
  /** 該期初總資產（發息前） */
  previousBalance: number;
  /** 該期固定投入總額（月投+額外，已扣手續費） */
  fixedAddThisPeriod: number;
  /** 該期投入（買入）時的手續費 */
  contributionFee: number;
  /** 再投入時的手續費 */
  reinvestFee: number;
};

const TAX_THRESHOLD = 20000; // 單期股利達 2 萬才計入扣稅
const TAX_RATE = 0.28;
const NHI2_THRESHOLD = 20000; // 二代健保：單筆 > 2 萬按 2.11%
const NHI2_RATE = 0.0211;
const TAX_CREDIT_RATE = 0.085; // 股利可抵減稅額 8.5%
const TAX_CREDIT_CAP = 80000; // 每年可抵減稅額上限 8 萬
/** 買入手續費：0.1425%，最低 20 元 */
const FEE_RATE = 0.001425;
const FEE_MIN = 20;
function getBuyFee(amount: number): number {
  if (amount <= 0) return 0;
  return Math.max(FEE_MIN, Math.round(amount * FEE_RATE));
}
function safeNumber(value: number | null | undefined): number {
  return Number.isFinite(value as number) ? (value as number) : 0;
}
function getAfterTaxAndNhi2(
  grossPerPeriod: number,
  taxRate: number = TAX_RATE
): { tax: number; nhi2: number; net: number } {
  if (grossPerPeriod < TAX_THRESHOLD) return { tax: 0, nhi2: 0, net: grossPerPeriod };
  const tax = grossPerPeriod * taxRate;
  const nhi2 = grossPerPeriod >= NHI2_THRESHOLD ? grossPerPeriod * NHI2_RATE : 0;
  return { tax, nhi2, net: grossPerPeriod - tax - nhi2 };
}
/** 可指定稅率級距（用於表格與估算區）：含 54C 應稅基數、8.5% 抵減、二代健保
 * 依用戶表格：應稅股利所得(54C)=B×C，稅金與 8.5% 抵減皆以應稅基數計算；二代健保亦以應稅基數(54C)≥2萬為門檻
 */
function getAfterTaxAndNhi2WithRate(
  grossPerPeriod: number,
  taxRate: number,
  applyNhi2: boolean,
  periodsPerYear: number,
  useCredit: boolean,
  /** 54C 股利占比：個股 1.0，ETF 填實際占比如 0.5、0.62 */
  ratio54C: number = 1
): { tax: number; nhi2: number; credit: number; net: number; taxableBase: number } {
  if (grossPerPeriod <= 0) return { tax: 0, nhi2: 0, credit: 0, net: grossPerPeriod, taxableBase: 0 };
  const taxableBase = grossPerPeriod * ratio54C; // 應稅股利所得(54C) = B × C

  if (taxableBase < TAX_THRESHOLD) {
    const nhi2 = applyNhi2 && taxableBase >= NHI2_THRESHOLD ? taxableBase * NHI2_RATE : 0;
    return { tax: 0, nhi2, credit: 0, net: Math.max(0, grossPerPeriod - nhi2), taxableBase };
  }

  // 8 萬抵減額：依配息頻率平均分攤到每期
  const creditLimitPerPeriod = TAX_CREDIT_CAP / Math.max(1, periodsPerYear);
  const rawCredit = taxableBase * TAX_CREDIT_RATE;
  const credit = useCredit ? Math.min(rawCredit, creditLimitPerPeriod) : 0;
  const taxBeforeCredit = taxableBase * taxRate;
  const tax = Math.max(0, taxBeforeCredit - credit);

  // 二代健保：應稅基數(54C)≥2 萬，對應稅基數課徵 2.11%
  const nhi2 = applyNhi2 && taxableBase >= NHI2_THRESHOLD ? taxableBase * NHI2_RATE : 0;

  const net = grossPerPeriod - tax - nhi2;
  return { tax, nhi2, credit, net, taxableBase };
}
const TAX_BRACKETS = [
  { value: 0.05, label: "5% 年收 56萬以下", incomeLabel: "年收入 56萬以下" },
  { value: 0.12, label: "12% 年收 56～126萬", incomeLabel: "年收入 56～126萬" },
  { value: 0.20, label: "20% 年收 126～252萬", incomeLabel: "年收入 126～252萬" },
  { value: 0.30, label: "30% 年收 252～472萬", incomeLabel: "年收入 252～472萬" },
  { value: 0.40, label: "40% 年收 472萬以上", incomeLabel: "年收入 472萬以上" },
] as const;

/** 依年收入（萬）回傳對應稅率 */
function getTaxBracketByIncomeWan(incomeWan: number): number {
  if (incomeWan < 56) return 0.05;
  if (incomeWan < 126) return 0.12;
  if (incomeWan < 252) return 0.20;
  if (incomeWan < 472) return 0.30;
  return 0.40;
}

function simulate({
  initialPrincipal,
  monthlyContribution,
  monthlyExtra,
  annualReturnRate,
  reinvestRatio,
  payoutFrequency,
  targetPayoutPerPeriod,
  maxMonths: maxMonthsParam,
  taxRate,
}: {
  initialPrincipal: number;
  monthlyContribution: number;
  monthlyExtra: number;
  annualReturnRate: number;
  reinvestRatio: number;
  payoutFrequency: PayoutFrequency;
  targetPayoutPerPeriod: number;
  maxMonths?: number;
  taxRate: number;
}): SimulationResult {
  const annualRate = annualReturnRate / 100;
  const limitMonths = maxMonthsParam ?? MONTHS;
  // 股利發放頻率：月 / 季 / 半年 / 年，決定複利週期
  const intervalMonths =
    payoutFrequency === "month"
      ? 1
      : payoutFrequency === "quarter"
      ? 3
      : payoutFrequency === "semiannual"
      ? 6
      : 12;
  const periodsPerYear = 12 / intervalMonths;
  const periodRate = annualRate / periodsPerYear;

  let balance = Math.max(0, initialPrincipal - getBuyFee(initialPrincipal));
  let totalDividends = 0;

  let milestone30000Index: number | null = null;
  let milestone150000Index: number | null = null;
  let milestoneUserTargetIndex: number | null = null;
  let milestone30000QuarterDividend: number | null = null;
  let milestone150000QuarterDividend: number | null = null;

  for (let month = 1; month <= limitMonths; month++) {
    const monthlyAdd = monthlyContribution + monthlyExtra;
    balance += Math.max(0, monthlyAdd - getBuyFee(monthlyAdd));

    // 在選定的配息週期點進行「配息＋再投入」（再投入以扣所得稅與二代健保後實領計算，含手續費）
    if (month % intervalMonths === 0) {
      const grossReturn = balance * periodRate;
      const { net } = getAfterTaxAndNhi2(grossReturn, taxRate);
      const reinvest = net * (reinvestRatio / 100);
      const payout = net - reinvest;
      const reinvestFee = getBuyFee(reinvest);

      balance += Math.max(0, reinvest - reinvestFee);
      totalDividends += payout;

      // ★ 用「總配息能力 grossReturn」判斷達標
      if (milestone30000Index === null && grossReturn >= TARGET_Q1 - 1) {
        milestone30000Index = month - 1;
        milestone30000QuarterDividend = grossReturn;
      }
      if (milestone150000Index === null && grossReturn >= TARGET_Q2 - 1) {
        milestone150000Index = month - 1;
        milestone150000QuarterDividend = grossReturn;
      }
      if (
        targetPayoutPerPeriod > 0 &&
        milestoneUserTargetIndex === null &&
        grossReturn >= targetPayoutPerPeriod - 1
      ) {
        milestoneUserTargetIndex = month - 1;
      }
    }
  }

  const getTimeTo = (
    milestoneIndex: number | null
  ): { years: number | null; months: number | null } => {
    if (milestoneIndex === null) return { years: null, months: null };
    const totalMonths = milestoneIndex + 1;
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    return { years, months };
  };

  const t30000 = getTimeTo(milestone30000Index);
  const t150000 = getTimeTo(milestone150000Index);
  const tUser = getTimeTo(milestoneUserTargetIndex);

  const finalBalance = balance;
  const requiredFor30000 = TARGET_Q1 / (periodRate || 0.0000001);
  const nzProgress =
    Math.max(0, Math.min(1, finalBalance / requiredFor30000)) * 100;

  return {
    milestone30000Index,
    milestone150000Index,
    milestoneUserTargetIndex,
    milestone30000QuarterDividend,
    milestone150000QuarterDividend,
    totalDividends,
    finalBalance,
    nzProgressPercent: Math.round(nzProgress),
    yearsTo30000: t30000.years,
    monthsTo30000: t30000.months,
    yearsTo150000: t150000.years,
    monthsTo150000: t150000.months,
    yearsToUserTarget: tUser.years,
    monthsToUserTarget: tUser.months,
  };
}

/** 安全解析算式（僅允許數字與 + - * / ( ) . 空格、千分位逗號），例如 4000+8000、10*2 */
function parseFormula(s: string): number {
  if (s == null || typeof s !== "string") return 0;
  const t = String(s).trim().replace(/\s/g, "").replace(/,/g, "");
  if (t === "") return 0;
  if (!/^[\d+\-*/().]+$/.test(t)) return NaN;
  try {
    const v = new Function("return (" + t + ")")();
    return typeof v === "number" && !Number.isNaN(v) ? v : NaN;
  } catch {
    return NaN;
  }
}

/** 按 Enter 時將算式換成計算結果字串（整數不帶小數） */
function commitFormula(s: string): string {
  const n = parseFormula(s.replace(/,/g, ""));
  if (typeof n === "number" && !Number.isNaN(n) && n >= 0) {
    return n % 1 === 0 ? String(Math.round(n)) : String(n);
  }
  return s;
}

/** 將算式換成計算結果並加上千分位（無條件捨去） */
function commitFormulaWithCommas(s: string): string {
  const n = parseFormula(s.replace(/,/g, ""));
  if (typeof n === "number" && !Number.isNaN(n) && n >= 0) {
    return Math.floor(n).toLocaleString("zh-TW");
  }
  return s;
}

function getPeriodSnapshots(
  params: {
    initialPrincipal: number;
    monthlyContribution: number;
    monthlyExtra: number;
    annualReturnRate: number;
    reinvestRatio: number;
    payoutFrequency: PayoutFrequency;
    /** 該檔 ETF 實際配息月份（1～12）；未提供時依 intervalMonths 從起始月起每期發息 */
    dividendMonths?: number[];
  },
  sharePrice: number,
  maxYears: number = 20,
  startYear: number = 2026,
  startMonth: number = 3
): PeriodSnapshot[] {
  const {
    initialPrincipal,
    monthlyContribution,
    monthlyExtra,
    annualReturnRate,
    reinvestRatio,
    payoutFrequency,
    dividendMonths,
  } = params;
  const annualRate = annualReturnRate / 100;
  const intervalMonths =
    payoutFrequency === "month"
      ? 1
      : payoutFrequency === "quarter"
      ? 3
      : payoutFrequency === "semiannual"
      ? 6
      : 12;
  const periodsPerYear = 12 / intervalMonths;
  const periodRate = annualRate / periodsPerYear;
  const maxMonths = Math.min(MONTHS, maxYears * 12);
  const snapshots: PeriodSnapshot[] = [];
  let balance = Math.max(0, initialPrincipal - getBuyFee(initialPrincipal));
  const monthlyAdd = monthlyContribution + monthlyExtra;
  const monthlyAddAfterFee = Math.max(0, monthlyAdd - getBuyFee(monthlyAdd));

  if (!dividendMonths || dividendMonths.length === 0) {
    // 自訂：依起始月起每 intervalMonths 一期，每期都發息
    let lastGrossReturn = 0;
    for (let month = 1; month <= maxMonths; month++) {
      balance += monthlyAddAfterFee;
      if (month % intervalMonths === 0) {
        const fixedAddThisPeriod = monthlyAddAfterFee * intervalMonths;
        const previousBalance = balance - fixedAddThisPeriod;
        const calMonth = ((month - 1 + startMonth - 1) % 12) + 1;
        const calYear = startYear + Math.floor((month - 1 + startMonth - 1) / 12);
        const grossReturn = balance * periodRate;
        const { net } = getAfterTaxAndNhi2(grossReturn);
        const reinvest = net * (reinvestRatio / 100);
        const reinvestFee = getBuyFee(reinvest);
        const reinvestAfterFee = Math.max(0, reinvest - reinvestFee);
        balance += reinvestAfterFee;
        const contributionFee = intervalMonths * getBuyFee(monthlyAdd);
        const label =
          payoutFrequency === "year"
            ? `${calYear}年`
            : `${calYear}年${calMonth}月`;
        const periodInYear = Math.floor((month - 1) / intervalMonths) % periodsPerYear + 1;
        const sharesBoughtThisPeriod = sharePrice > 0 ? Math.floor(reinvestAfterFee / sharePrice) : 0;
        const totalShares = sharePrice > 0 ? Math.floor(balance / sharePrice) : 0;
        snapshots.push({
          periodLabel: label,
          year: calYear,
          periodInYear,
          balance: Math.round(balance),
          shares: totalShares,
          lastPeriodDividend: lastGrossReturn,
          afterTaxDividend: Math.round(getAfterTaxAndNhi2(lastGrossReturn).net),
          reinvestPct: reinvestRatio,
          reinvestAmount: Math.round(reinvestAfterFee),
          sharesBoughtThisPeriod,
          previousBalance: Math.round(previousBalance),
          fixedAddThisPeriod: Math.round(fixedAddThisPeriod),
          contributionFee: Math.round(contributionFee),
          reinvestFee: Math.round(reinvestFee),
        });
        lastGrossReturn = grossReturn;
      }
    }
    return snapshots;
  }

  // 有 dividendMonths：每月一列，每列顯示該期投入；僅配息月有股息，其餘月股息為 0
  let lastDividendMonthIndex = -1;
  for (let monthIndex = 0; monthIndex < maxMonths; monthIndex++) {
    const calMonth = ((startMonth - 1 + monthIndex) % 12) + 1;
    const calYear = startYear + Math.floor((startMonth - 1 + monthIndex) / 12);
    const previousBalance = balance;
    balance += monthlyAddAfterFee;
    const fixedAddThisPeriod = monthlyAddAfterFee;

    let grossReturn = 0;
    let reinvestAfterFee = 0;
    let reinvestFee = 0;
    if (dividendMonths.includes(calMonth)) {
      const monthsSinceLast = lastDividendMonthIndex < 0 ? monthIndex + 1 : monthIndex - lastDividendMonthIndex;
      const periodRateForMonths = annualRate * (monthsSinceLast / 12);
      grossReturn = balance * periodRateForMonths;
      const { net } = getAfterTaxAndNhi2(grossReturn);
      const reinvest = net * (reinvestRatio / 100);
      reinvestFee = getBuyFee(reinvest);
      reinvestAfterFee = Math.max(0, reinvest - reinvestFee);
      balance += reinvestAfterFee;
      lastDividendMonthIndex = monthIndex;
    }

    const contributionFee = getBuyFee(monthlyAdd);
    const label = `${calYear}年${calMonth}月`;
    const periodInYear = calMonth;
    const sharesBoughtThisPeriod = sharePrice > 0 ? Math.floor(reinvestAfterFee / sharePrice) : 0;
    const totalShares = sharePrice > 0 ? Math.floor(balance / sharePrice) : 0;
    snapshots.push({
      periodLabel: label,
      year: calYear,
      periodInYear,
      balance: Math.round(balance),
      shares: totalShares,
      lastPeriodDividend: grossReturn,
      afterTaxDividend: grossReturn ? Math.round(getAfterTaxAndNhi2(grossReturn).net) : 0,
      reinvestPct: reinvestRatio,
      reinvestAmount: Math.round(reinvestAfterFee),
      sharesBoughtThisPeriod,
      previousBalance: Math.round(previousBalance),
      fixedAddThisPeriod: Math.round(fixedAddThisPeriod),
      contributionFee: Math.round(contributionFee),
      reinvestFee: Math.round(reinvestFee),
    });
  }
  return snapshots;
}

export default function Home() {
  const [initialPrincipal, setInitialPrincipal] = useState("0");
  const [monthlyContribution, setMonthlyContribution] = useState("12000");
  const [monthlyExtra, setMonthlyExtra] = useState("6000");
  // 預設標的 0050：年化、配息頻率、股息股利與 ticker-presets 一致
  const [annualReturnRate, setAnnualReturnRate] = useState(DEFAULT_ETF_PRESET.annualReturn);
  const [dividendYieldPct, setDividendYieldPct] = useState<number | "">(DEFAULT_ETF_PRESET.dividendYieldPct ?? "");
  const [stockDividendPct, setStockDividendPct] = useState<number | "">(DEFAULT_ETF_PRESET.stockDividendPct ?? "");
  const [rateSource, setRateSource] = useState<"annual" | "dividend" | null>("dividend");
  const [targetQuarterIncome, setTargetQuarterIncome] = useState("50000");
  const [reinvestRatio, setReinvestRatio] = useState(80);
  const [payoutFrequency, setPayoutFrequency] = useState<PayoutFrequency>(DEFAULT_ETF_PRESET.frequency);
  const [selectedEtf, setSelectedEtf] = useState<string>(DEFAULT_SELECTED_ETF_ID);
  const todayYear = new Date().getFullYear();
  const todayMonth = new Date().getMonth() + 1;
  const [defaultYearStr, setDefaultYearStr] = useState(() => String(DEFAULT_SIM_START_YEAR));
  const [defaultMonthStr, setDefaultMonthStr] = useState(() => String(DEFAULT_SIM_START_MONTH));
  const defaultYear = useMemo(() => {
    const n = parseInt(defaultYearStr, 10);
    return Number.isFinite(n) && n >= 2000 && n <= 2100 ? n : DEFAULT_SIM_START_YEAR;
  }, [defaultYearStr]);
  const defaultMonth = useMemo(() => {
    const n = parseInt(defaultMonthStr, 10);
    return Number.isFinite(n) && n >= 1 && n <= 12 ? n : DEFAULT_SIM_START_MONTH;
  }, [defaultMonthStr]);
  const [initialYearStr, setInitialYearStr] = useState(() => String(DEFAULT_SIM_START_YEAR));
  const [initialMonthStr, setInitialMonthStr] = useState(() => String(DEFAULT_SIM_START_MONTH));
  const initialYear = useMemo(() => {
    const n = parseInt(initialYearStr, 10);
    return Number.isFinite(n) && n >= 2000 && n <= 2100 ? n : defaultYear;
  }, [initialYearStr, defaultYear]);
  const initialMonth = useMemo(() => {
    const n = parseInt(initialMonthStr, 10);
    return Number.isFinite(n) && n >= 1 && n <= 12 ? n : defaultMonth;
  }, [initialMonthStr, defaultMonth]);
  const [nthPeriod, setNthPeriod] = useState(1);
  const [targetYearsToAchieve, setTargetYearsToAchieve] = useState("20");
  const [stickyBarPinned, setStickyBarPinned] = useState(false);
  const [stickyBarVisible, setStickyBarVisible] = useState(false);
  /** 僅在客戶端掛載後為 true，避免 createPortal 與 SSR 初次 HTML 不一致（Hydration error） */
  const [clientMounted, setClientMounted] = useState(false);
  useEffect(() => {
    setClientMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("mobile") === "1") {
      document.documentElement.setAttribute("data-preview-mobile", "true");
      return () => {
        document.documentElement.removeAttribute("data-preview-mobile");
      };
    }
  }, []);
  const [saveTargetModalOpen, setSaveTargetModalOpen] = useState(false);
  const [loadTargetModalOpen, setLoadTargetModalOpen] = useState(false);
  useEffect(() => {
    const onOpenLoad = () => setLoadTargetModalOpen(true);
    window.addEventListener(OPEN_LOAD_TARGET_MODAL_EVENT, onOpenLoad);
    return () => window.removeEventListener(OPEN_LOAD_TARGET_MODAL_EVENT, onOpenLoad);
  }, []);
  const lastScrollYRef = useRef(0);
  const goalSettingCardRef = useRef<HTMLDivElement | null>(null);
  const wasPastHeroRef = useRef(false);
  const [taxBracketRate, setTaxBracketRate] = useState(0.20);
  const [applyTaxInTable, setApplyTaxInTable] = useState(true);
  const [applyNhi2InTable, setApplyNhi2InTable] = useState(true);
  const [annualIncome, setAnnualIncome] = useState("");
  const [mergeTaxOpen, setMergeTaxOpen] = useState(false);
  /** 從 localStorage 還原快照時略過一次「依年薪重算級距」，避免覆寫已存稅率 */
  const skipTaxSyncFromIncomeRef = useRef(false);
  const annualIncomeWan = useMemo(() => {
    const n = parseFloat(annualIncome.replace(/,/g, ""));
    return Number.isFinite(n) ? n : NaN;
  }, [annualIncome]);
  const annualIncomeYuan = useMemo(() => (Number.isFinite(annualIncomeWan) ? Math.round(annualIncomeWan * 10000) : null), [annualIncomeWan]);
  useEffect(() => {
    if (skipTaxSyncFromIncomeRef.current) {
      skipTaxSyncFromIncomeRef.current = false;
      return;
    }
    if (Number.isFinite(annualIncomeWan) && annualIncomeWan >= 0) {
      setTaxBracketRate(getTaxBracketByIncomeWan(annualIncomeWan));
    }
  }, [annualIncomeWan]);
  const [separateTaxOpen, setSeparateTaxOpen] = useState(false);
  /** 稅務 UI：自動依級距套用合併／分開與試算；手動則顯示完整選項（僅手機版區塊；桌機經典版面不受此同步影響） */
  const [taxSettingsMode, setTaxSettingsMode] = useState<TaxSettingsMode>("auto");
  const [mobileTaxLayoutActive, setMobileTaxLayoutActive] = useState(false);
  /** 手機「累積金額與股數表」：是否展開「未來10期」卡片列 */
  const [mobileAccumShowNextTen, setMobileAccumShowNextTen] = useState(false);
  /** 手機：與 Excel 相同欄位的完整表格預覽彈窗 */
  const [mobileAccumFullTableModalOpen, setMobileAccumFullTableModalOpen] = useState(false);
  /** 手機：累積表「計算說明」收合 */
  const [mobileAccumCalcHelpOpen, setMobileAccumCalcHelpOpen] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const read = () => {
      const mq = window.matchMedia("(max-width: 768px)").matches;
      const preview = document.documentElement.getAttribute("data-preview-mobile") === "true";
      setMobileTaxLayoutActive(mq || preview);
    };
    read();
    const mq = window.matchMedia("(max-width: 768px)");
    mq.addEventListener("change", read);
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-preview-mobile"] });
    return () => {
      mq.removeEventListener("change", read);
      mo.disconnect();
    };
  }, []);
  useEffect(() => {
    if (!mobileTaxLayoutActive) return;
    if (taxSettingsMode !== "auto") return;
    setApplyTaxInTable(true);
    setApplyNhi2InTable(true);
    if (taxBracketRate >= 0.3) {
      setSeparateTaxOpen(true);
      setMergeTaxOpen(false);
    } else {
      setSeparateTaxOpen(false);
      setMergeTaxOpen(true);
    }
  }, [mobileTaxLayoutActive, taxSettingsMode, taxBracketRate]);
  /** 表格手動覆蓋：key = "rowIdx_colKey"，value = 覆蓋的數值（顯示優先於算式結果） */
  const [manualOverrides, setManualOverrides] = useState<Record<string, number>>({});
  const [editingCell, setEditingCell] = useState<{ key: string; value: string } | null>(null);
  const [tooltipWhich, setTooltipWhich] = useState<"merge" | "separate" | "nhi2" | null>(null);
  const [etfRatioEstimates, setEtfRatioEstimates] = useState<Record<string, string>>(() =>
    buildDefault54cRatioMap(),
  );
  const initialPrincipalNum = useMemo(() => Math.max(0, parseFormula(initialPrincipal) || 0), [initialPrincipal]);
  const monthlyContributionNum = useMemo(() => Math.max(0, parseFormula(monthlyContribution) || 0), [monthlyContribution]);
  const monthlyExtraNum = useMemo(() => Math.max(0, parseFormula(monthlyExtra) || 0), [monthlyExtra]);
  /** 每月投入，第幾次＝第幾個月；配息頻率僅影響股利發放月份與每期利率 */
  const periodMonthsForBalance = 1;
  const effectiveTaxRateForSim = separateTaxOpen ? 0.28 : taxBracketRate;

  const effectiveAnnualRateEarly = rateSource === "dividend" && (dividendYieldPct !== "" || stockDividendPct !== "")
    ? (Number(dividendYieldPct) || 0) + (Number(stockDividendPct) || 0)
    : annualReturnRate;

  const { currentPrincipalComputed, balanceForNthPeriodDividend } = useMemo(() => {
    let balance = initialPrincipalNum;
    let balanceForDividend = balance;
    const periodsPerYear = payoutFrequency === "month" ? 12 : payoutFrequency === "quarter" ? 4 : payoutFrequency === "semiannual" ? 2 : 1;
    const periodRate = (effectiveAnnualRateEarly / 100) / periodsPerYear;
    const fixedPerPeriod = (monthlyContributionNum + monthlyExtraNum) * periodMonthsForBalance;
    const divMonths = (selectedEtf && selectedEtf !== "none" ? ETF_DIVIDEND_MONTHS[selectedEtf] : null) ?? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    for (let i = 1; i <= nthPeriod; i++) {
      balance += fixedPerPeriod;
      const totalMonths = periodMonthsForBalance * i;
      const targetMonth = ((((initialMonth - 1) + totalMonths) % 12) + 12) % 12 + 1;
      const isDividendMonth = divMonths.includes(targetMonth);
      if (i === nthPeriod) balanceForDividend = balance;
      if (isDividendMonth && balance > 0 && effectiveAnnualRateEarly > 0) {
        const grossDividend = balance * periodRate;
        const { net } = getAfterTaxAndNhi2(grossDividend);
        const reinvest = net * (reinvestRatio / 100);
        const afterFee = Math.max(0, reinvest - getBuyFee(reinvest));
        balance += afterFee;
      }
    }
    return { currentPrincipalComputed: Math.floor(balance), balanceForNthPeriodDividend: balanceForDividend };
  }, [initialPrincipalNum, monthlyContributionNum, monthlyExtraNum, periodMonthsForBalance, nthPeriod, effectiveAnnualRateEarly, reinvestRatio, payoutFrequency, initialMonth, selectedEtf]);
  const [currentPrincipalStr, setCurrentPrincipalStr] = useState("");
  useEffect(() => {
    setCurrentPrincipalStr(currentPrincipalComputed.toLocaleString("zh-TW"));
  }, [currentPrincipalComputed]);
  const currentPrincipalNum = (() => {
    const parsed = parseFormula(currentPrincipalStr);
    const val = typeof parsed === "number" && !Number.isNaN(parsed) && parsed >= 0 ? parsed : currentPrincipalComputed;
    return Math.floor(val);
  })();
  // 當 currentPrincipalComputed 的輸入變更時，currentPrincipalStr 會晚一輪才同步，導致模擬／建議金額跑兩次。
  // 偵測到 computed 變更時強制使用 currentPrincipalComputed，其餘使用 currentPrincipalNum（含手動覆寫）
  const lastPrincipalComputedRef = useRef(currentPrincipalComputed);
  const principalForCalc = (() => {
    const justChanged = currentPrincipalComputed !== lastPrincipalComputedRef.current;
    lastPrincipalComputedRef.current = currentPrincipalComputed;
    return justChanged ? currentPrincipalComputed : currentPrincipalNum;
  })();
  /** 總股價（試算用）：當前本金+投入+額外×12，可手動改數字或輸入加減乘除算式 */
  const computedTotalForEstimate = currentPrincipalNum + (monthlyContributionNum + monthlyExtraNum) * 12;
  const [totalPriceForEstimateStr, setTotalPriceForEstimateStr] = useState("");
  useEffect(() => {
    setTotalPriceForEstimateStr(String(computedTotalForEstimate));
  }, [computedTotalForEstimate]);

  const maxNthPeriod = 1200; // 每月投入，最多 100 年
  const handlePayoutFrequencyChange = useCallback((v: PayoutFrequency) => {
    setPayoutFrequency(v);
    setNthPeriod((prev) => (prev > 1200 ? 1200 : prev));
  }, []);
  useEffect(() => {
    if (nthPeriod > maxNthPeriod) setNthPeriod(maxNthPeriod);
  }, [payoutFrequency, maxNthPeriod, nthPeriod]);

  const prevInitialRef = useRef({ year: initialYear, month: initialMonth });
  useEffect(() => {
    if (prevInitialRef.current.year !== initialYear || prevInitialRef.current.month !== initialMonth) {
      const prev = prevInitialRef.current;
      const totalMonths = nthPeriod; // 每月投入，第幾次＝第幾個月
      const targetMonth = ((((prev.month - 1) + totalMonths) % 12) + 12) % 12 + 1;
      const targetYear = prev.year + Math.floor(((prev.month - 1) + totalMonths) / 12);
      const newTotalMonths = (targetYear - initialYear) * 12 + (targetMonth - initialMonth);
      const newNth = Math.round(newTotalMonths); // 每月＝1 次
      const clamped = Math.max(1, Math.min(maxNthPeriod, newNth));
      if (clamped !== nthPeriod) setNthPeriod(clamped);
      prevInitialRef.current = { year: initialYear, month: initialMonth };
    } else {
      prevInitialRef.current = { year: initialYear, month: initialMonth };
    }
  }, [initialYear, initialMonth, nthPeriod, maxNthPeriod]);

  useEffect(() => {
    const onScroll = () => {
      const y = typeof window !== "undefined" ? window.scrollY : 0;
      if (stickyBarPinned) return;
      // 以「目標設定」卡片為準：只要區塊進入視窗就顯示（門檻放寬 95%），備用 y > 280
      const goalCard = goalSettingCardRef.current;
      const goalRect = goalCard?.getBoundingClientRect();
      const threshold = typeof window !== "undefined" ? window.innerHeight * 0.95 : 400;
      const reachedGoal = goalRect ? goalRect.top < threshold : y > 280;
      if (!reachedGoal) {
        wasPastHeroRef.current = false;
        setStickyBarVisible(false);
        lastScrollYRef.current = y;
        return;
      }
      if (!wasPastHeroRef.current) {
        wasPastHeroRef.current = true;
        setStickyBarVisible(true);
        lastScrollYRef.current = y;
        return;
      }
      // 要往下滾超過 200px 才隱藏、往上滾 60px 才再顯示
      if (y > lastScrollYRef.current + 200) setStickyBarVisible(false);
      else if (y < lastScrollYRef.current - 60) setStickyBarVisible(true);
      lastScrollYRef.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    const t = requestAnimationFrame(() => { onScroll(); });
    const t2 = window.setTimeout(onScroll, 100);
    return () => {
      cancelAnimationFrame(t);
      window.clearTimeout(t2);
      window.removeEventListener("scroll", onScroll);
    };
  }, [stickyBarPinned]);

  const totalPriceForEstimateNum = totalPriceForEstimateStr.trim() === ""
    ? computedTotalForEstimate
    : Math.max(0, parseFormula(totalPriceForEstimateStr.replace(/,/g, "")) || 0) || computedTotalForEstimate;
  const targetQuarterIncomeNum = useMemo(() => Math.max(0, parseFormula(targetQuarterIncome) || 0), [targetQuarterIncome]);
  const targetYearsToAchieveNum = useMemo(() => {
    const n = parseFormula(targetYearsToAchieve);
    return typeof n === "number" && !Number.isNaN(n) && n >= 0 ? n : 0;
  }, [targetYearsToAchieve]);
  const targetYearsToAchieveEmpty = targetYearsToAchieve.trim() === "";

  const payoutLabel =
    payoutFrequency === "month"
      ? "月"
      : payoutFrequency === "year"
      ? "年"
      : payoutFrequency === "semiannual"
      ? "半年"
      : "季";

  const [etfCodeFilter, setEtfCodeFilter] = useState("");
  /** 完成 localStorage 讀取（或確認無存檔）後才允許防抖寫入，避免以預設值覆蓋舊資料 */
  const [storageReady, setStorageReady] = useState(false);

  const formatEtfOptionLabel = useCallback((etf: { id: string; label: string }) => {
    const preset = TICKER_PRESETS.find((p) => p.id === etf.id);
    if (!preset) return etf.label;
    const annual = Number.isFinite(preset.annualReturn) ? `${preset.annualReturn}%` : "—";
    const cash = preset.dividendYieldPct != null && Number.isFinite(preset.dividendYieldPct) ? `${preset.dividendYieldPct}%` : "—";
    const stock = preset.stockDividendPct != null && Number.isFinite(preset.stockDividendPct) ? `${preset.stockDividendPct}%` : "—";
    return `${etf.label}｜年化 ${annual}｜股息 ${cash}｜股利 ${stock}`;
  }, []);

  const formatEtfOptionLabelCompact = useCallback((etf: { id: string; label: string }) => {
    // 上方橫幅：維持原本簡潔，只補代號；避免選單太長擠版
    const short = etf.label.split("（")[0];
    return `${etf.id} ${short}`;
  }, []);

  const filteredEtfs = useMemo(() => {
    const code = etfCodeFilter.replace(/\s/g, "").slice(0, 5);
    const list = !code
      ? TICKER_PRESETS
      : TICKER_PRESETS.filter(
          (p) => p.id.includes(code) || p.id.startsWith(code) || p.label.includes(code),
        );
    if (selectedEtf && selectedEtf !== "none") {
      const cur = TICKER_PRESETS.find((p) => p.id === selectedEtf);
      if (cur && !list.some((p) => p.id === selectedEtf)) {
        return [cur, ...list];
      }
    }
    return list;
  }, [etfCodeFilter, selectedEtf]);

  useEffect(() => {
    if (!clientMounted) return;
    const repo = getDefaultCalculatorRepository();
    const s = repo.load();
    if (s) {
      skipTaxSyncFromIncomeRef.current = true;
      setInitialPrincipal(s.initialPrincipal);
      setMonthlyContribution(commitFormulaWithCommas(s.monthlyContribution));
      setMonthlyExtra(commitFormulaWithCommas(s.monthlyExtra));
      setAnnualReturnRate(s.annualReturnRate);
      setDividendYieldPct(s.dividendYieldPct === null ? "" : s.dividendYieldPct);
      setStockDividendPct(s.stockDividendPct === null ? "" : s.stockDividendPct);
      setRateSource(s.rateSource);
      setTargetQuarterIncome(commitFormulaWithCommas(s.targetQuarterIncome));
      setReinvestRatio(s.reinvestRatio);
      setPayoutFrequency(s.payoutFrequency as PayoutFrequency);
      setSelectedEtf(s.selectedEtf);
      setDefaultYearStr(s.defaultYearStr);
      setDefaultMonthStr(s.defaultMonthStr);
      setInitialYearStr(s.initialYearStr);
      setInitialMonthStr(s.initialMonthStr);
      const clampedNth = Math.max(1, Math.min(maxNthPeriod, Math.floor(s.nthPeriod) || 1));
      setNthPeriod(clampedNth);
      setTargetYearsToAchieve(s.targetYearsToAchieve);
      setTaxBracketRate(s.taxBracketRate);
      setApplyTaxInTable(s.applyTaxInTable);
      setApplyNhi2InTable(s.applyNhi2InTable);
      setAnnualIncome(s.annualIncome);
      setSeparateTaxOpen(s.separateTaxOpen);
      setManualOverrides(s.manualOverrides && typeof s.manualOverrides === "object" ? s.manualOverrides : {});
      setEtfRatioEstimates(
        s.etfRatioEstimates && typeof s.etfRatioEstimates === "object" ? s.etfRatioEstimates : buildDefault54cRatioMap(),
      );
      // 篩選只用於縮小選項，不應隨「已選標的」鎖死清單；否則會看起來像 100 檔預設消失
      setEtfCodeFilter("");
    } else {
      // 無存檔時也先把預設值套千分位（避免一開始顯示 12000/50000 這種）
      setMonthlyContribution((v) => commitFormulaWithCommas(v));
      setMonthlyExtra((v) => commitFormulaWithCommas(v));
      setTargetQuarterIncome((v) => commitFormulaWithCommas(v));
    }
    setStorageReady(true);
  }, [clientMounted, maxNthPeriod]);

  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * 自動存 localStorage：刻意不傳依賴陣列，每次 commit 後以 debounce 寫入最新快照。
   * 若使用長依賴陣列，在熱更新／部分裝置上曾出現「依賴陣列長度變動」的 React 執行期錯誤。
   * 篩選字不寫入：etfCodeFilter 固定 ETF_CODE_FILTER_PERSIST。
   */
  useEffect(() => {
    if (!clientMounted || !storageReady) return;
    const snap = buildSnapshotFromInputs({
      initialPrincipal,
      monthlyContribution,
      monthlyExtra,
      annualReturnRate,
      dividendYieldPct,
      stockDividendPct,
      rateSource,
      targetQuarterIncome,
      reinvestRatio,
      payoutFrequency: payoutFrequency as PayoutFrequencyPersist,
      selectedEtf,
      defaultYearStr,
      defaultMonthStr,
      initialYearStr,
      initialMonthStr,
      nthPeriod,
      targetYearsToAchieve,
      taxBracketRate,
      applyTaxInTable,
      applyNhi2InTable,
      annualIncome,
      separateTaxOpen,
      manualOverrides,
      etfRatioEstimates,
      etfCodeFilter: ETF_CODE_FILTER_PERSIST,
    });
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      getDefaultCalculatorRepository().save(snap);
    }, 600);
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  });

  const currentCalculatorSnapshot = useMemo(
    () =>
      buildSnapshotFromInputs({
        initialPrincipal,
        monthlyContribution,
        monthlyExtra,
        annualReturnRate,
        dividendYieldPct,
        stockDividendPct,
        rateSource,
        targetQuarterIncome,
        reinvestRatio,
        payoutFrequency: payoutFrequency as PayoutFrequencyPersist,
        selectedEtf,
        defaultYearStr,
        defaultMonthStr,
        initialYearStr,
        initialMonthStr,
        nthPeriod,
        targetYearsToAchieve,
        taxBracketRate,
        applyTaxInTable,
        applyNhi2InTable,
        annualIncome,
        separateTaxOpen,
        manualOverrides,
        etfRatioEstimates,
        etfCodeFilter: ETF_CODE_FILTER_PERSIST,
      }),
    [
      initialPrincipal,
      monthlyContribution,
      monthlyExtra,
      annualReturnRate,
      dividendYieldPct,
      stockDividendPct,
      rateSource,
      targetQuarterIncome,
      reinvestRatio,
      payoutFrequency,
      selectedEtf,
      defaultYearStr,
      defaultMonthStr,
      initialYearStr,
      initialMonthStr,
      nthPeriod,
      targetYearsToAchieve,
      taxBracketRate,
      applyTaxInTable,
      applyNhi2InTable,
      annualIncome,
      separateTaxOpen,
      manualOverrides,
      etfRatioEstimates,
    ],
  );

  /** 輸入接近時自動選到 ETF：完全符合或篩選後僅一檔則自動選取 */
  const handleEtfCodeChange = useCallback((raw: string) => {
    setEtfCodeFilter(raw);
    const code = raw.replace(/\s/g, "").slice(0, 5);
    const exact = TICKER_PRESETS.find((p) => p.id === code);
    if (exact) {
      setSelectedEtf(exact.id);
      setAnnualReturnRate(exact.annualReturn);
      handlePayoutFrequencyChange(exact.frequency as PayoutFrequency);
      setDividendYieldPct(exact.dividendYieldPct ?? "");
      setStockDividendPct(exact.stockDividendPct ?? "");
      setRateSource("dividend");
      return;
    }
    const byPrefix = TICKER_PRESETS.filter((p) => p.id.startsWith(code) || p.id.includes(code));
    if (byPrefix.length === 1) {
      const one = byPrefix[0];
      setSelectedEtf(one.id);
      setAnnualReturnRate(one.annualReturn);
      handlePayoutFrequencyChange(one.frequency as PayoutFrequency);
      setDividendYieldPct(one.dividendYieldPct ?? "");
      setStockDividendPct(one.stockDividendPct ?? "");
      setRateSource("dividend");
    }
  }, []);

  /** 從任一處「選擇 ETF」下拉選單變更：同步篩選碼＋套用預設參數，避免手機多區塊代碼／選單不同步 */
  const selectEtfFromMenu = useCallback(
    (id: string) => {
      // 選單變更不改篩選字：避免清單被鎖死只剩 1 檔（看起來像預設消失）
      if (id === "none") setEtfCodeFilter("");
      setSelectedEtf(id);
      const preset = TICKER_PRESETS.find((p) => p.id === id);
      if (preset) {
        setAnnualReturnRate(preset.annualReturn);
        handlePayoutFrequencyChange(preset.frequency as PayoutFrequency);
        setDividendYieldPct(preset.dividendYieldPct ?? "");
        setStockDividendPct(preset.stockDividendPct ?? "");
        setRateSource("dividend");
      }
    },
    [handlePayoutFrequencyChange],
  );

  const selectedEtfInfo = useMemo(
    () => (selectedEtf && selectedEtf !== "none" ? TICKER_PRESETS.find((p) => p.id === selectedEtf) : null),
    [selectedEtf],
  );

  /** 依所選 ETF 配息頻率顯示標籤（有選 ETF 時用 ETF 的頻率，否則用下拉選的頻率） */
  const effectivePayoutLabel = selectedEtfInfo
    ? (selectedEtfInfo.frequency === "month"
        ? "月"
        : selectedEtfInfo.frequency === "year"
        ? "年"
        : selectedEtfInfo.frequency === "semiannual"
        ? "半年"
        : "季")
    : payoutLabel;

  /** 依所選 ETF + 54C 占比試算：約多少股利以內不用繳二代健保、約幾股、約市值 */
  const nhi2FreeEstimate = useMemo(() => {
    if (!selectedEtfInfo || selectedEtf === "none") return null;
    const ratioRaw = etfRatioEstimates[selectedEtf];
    const ratioPct = ratioRaw !== undefined && ratioRaw !== "" ? parseFloat(String(ratioRaw).replace(/,/g, "")) : NaN;
    if (!Number.isFinite(ratioPct) || ratioPct <= 0) return null;
    const ratio = ratioPct / 100;
    const maxDividend = 20000 / ratio;
    const dp = selectedEtfInfo.dividendPerPeriod;
    const price = selectedEtfInfo.price;
    const shares = dp != null && dp > 0 ? Math.floor(maxDividend / dp) : null;
    const marketValue = shares != null && price != null ? Math.round(shares * price) : null;
    return { maxDividend: Math.floor(maxDividend), ratioPct, shares, price, dividendPerPeriod: dp, marketValue };
  }, [selectedEtf, selectedEtfInfo, etfRatioEstimates]);

  const effectiveAnnualRate = useMemo(() => {
    if (rateSource === "dividend" && (dividendYieldPct !== "" || stockDividendPct !== "")) {
      return (Number(dividendYieldPct) || 0) + (Number(stockDividendPct) || 0);
    }
    return annualReturnRate;
  }, [rateSource, dividendYieldPct, stockDividendPct, annualReturnRate]);

  /** 以「總股價」（可編輯、支援加減乘除，表格來源變動時會同步）試算：預估當期股利、稅金、二代健保扣多少 */
  const deductionEstimate = useMemo(() => {
    const raw = totalPriceForEstimateStr.replace(/,/g, "").trim();
    const total = raw === "" ? computedTotalForEstimate : Math.max(0, parseFormula(raw) || 0) || computedTotalForEstimate;
    if (total <= 0 || effectiveAnnualRate <= 0) return null;
    const periodsPerYear = payoutFrequency === "month" ? 12 : payoutFrequency === "quarter" ? 4 : payoutFrequency === "semiannual" ? 2 : 1;
    const estimatedDividend = Math.round((total * (effectiveAnnualRate / 100)) / periodsPerYear);
    const taxMethod: "separate" | "merge" = separateTaxOpen ? "separate" : "merge";
    const taxRate = separateTaxOpen ? 0.28 : taxBracketRate;
    const taxRatePct = separateTaxOpen ? 28 : Math.round(taxBracketRate * 100);
    const bracketLabel = TAX_BRACKETS.find((b) => b.value === taxBracketRate)?.label ?? "";
    const ratioPct = selectedEtf !== "none" ? (parseFloat(String(etfRatioEstimates[selectedEtf] || "0").replace(/,/g, "")) || 50) : 100; // 個股 100%，ETF 依占比
    const nhi2Countable = Math.round(estimatedDividend * (ratioPct / 100));
    const ratio = ratioPct / 100;
    const { tax: taxAmount, nhi2: nhi2Amount, credit, taxableBase, net } = getAfterTaxAndNhi2WithRate(
      estimatedDividend,
      taxRate,
      true,
      periodsPerYear,
      taxMethod === "merge",
      ratio
    );
    const taxBeforeCredit = taxableBase * taxRate;
    return {
      totalAssets: total,
      estimatedDividend,
      taxAmount: Math.round(taxAmount),
      taxRatePct,
      taxMethod,
      bracketLabel,
      nhi2Amount: Math.round(nhi2Amount),
      nhi2Countable,
      ratioPct,
      taxableBase: Math.round(taxableBase),
      credit: Math.round(credit),
      taxBeforeCredit: Math.round(taxBeforeCredit),
      periodsPerYear,
      netPerPeriod: Math.round(net),
    };
  }, [totalPriceForEstimateStr, computedTotalForEstimate, effectiveAnnualRate, payoutFrequency, taxBracketRate, separateTaxOpen, selectedEtf, etfRatioEstimates]);

  /** 自動模式 UI：相對另一種課稅方式的預估「多拿／多省」金額（與 getAfterTaxAndNhi2WithRate 一致，僅供展示） */
  const taxAutoSavingsYuan = useMemo(() => {
    const raw = totalPriceForEstimateStr.replace(/,/g, "").trim();
    const total = raw === "" ? computedTotalForEstimate : Math.max(0, parseFormula(raw) || 0) || computedTotalForEstimate;
    if (total <= 0 || effectiveAnnualRate <= 0) return null;
    const periodsPerYear = payoutFrequency === "month" ? 12 : payoutFrequency === "quarter" ? 4 : payoutFrequency === "semiannual" ? 2 : 1;
    const estimatedDividend = Math.round((total * (effectiveAnnualRate / 100)) / periodsPerYear);
    const ratioPct = selectedEtf !== "none" ? (parseFloat(String(etfRatioEstimates[selectedEtf] || "0").replace(/,/g, "")) || 50) : 100;
    const ratio = ratioPct / 100;
    const { net: netMerge } = getAfterTaxAndNhi2WithRate(estimatedDividend, taxBracketRate, true, periodsPerYear, true, ratio);
    const { net: netSep } = getAfterTaxAndNhi2WithRate(estimatedDividend, 0.28, true, periodsPerYear, false, ratio);
    const nMerge = Math.round(netMerge);
    const nSep = Math.round(netSep);
    const autoPickSeparate = taxBracketRate >= 0.3;
    const chosen = autoPickSeparate ? nSep : nMerge;
    const alternate = autoPickSeparate ? nMerge : nSep;
    return Math.max(0, chosen - alternate);
  }, [totalPriceForEstimateStr, computedTotalForEstimate, effectiveAnnualRate, payoutFrequency, taxBracketRate, selectedEtf, etfRatioEstimates]);

  /** 依所選 ETF 每股每期股利：約幾股以上需繳所得稅（單期股利 ≥ 2 萬） */
  const sharesForTaxThreshold = useMemo(() => {
    if (!selectedEtfInfo?.dividendPerPeriod || selectedEtfInfo.dividendPerPeriod <= 0) return null;
    return Math.ceil(TAX_THRESHOLD / selectedEtfInfo.dividendPerPeriod);
  }, [selectedEtfInfo]);

  /** 依所選 ETF + 54C 占比：約幾股以上需繳二代健保（54C 計入 ≥ 2 萬） */
  const sharesForNhi2Threshold = useMemo(() => {
    if (!nhi2FreeEstimate?.shares) return null;
    return nhi2FreeEstimate.shares + 1;
  }, [nhi2FreeEstimate]);

  /** 依所選 ETF + 54C 占比：約幾股可達 8 萬抵減上限（合併計稅 8.5% 抵減，年上限 8 萬）— 財政部：股利×8.5% 可抵減，上限 8 萬，約 94 萬以下全額享有 */
  const sharesForCreditCap80k = useMemo(() => {
    if (!selectedEtfInfo?.dividendPerPeriod || selectedEtfInfo.dividendPerPeriod <= 0) return null;
    const ratioPct = selectedEtf !== "none" ? (parseFloat(String(etfRatioEstimates[selectedEtf] || "50").replace(/,/g, "")) || 50) : 100;
    const ratio = ratioPct / 100;
    const periodsPerYear = selectedEtfInfo.frequency === "month" ? 12 : selectedEtfInfo.frequency === "quarter" ? 4 : selectedEtfInfo.frequency === "semiannual" ? 2 : 1;
    const periodLabel = selectedEtfInfo.frequency === "month" ? "月" : selectedEtfInfo.frequency === "quarter" ? "季" : selectedEtfInfo.frequency === "semiannual" ? "半年" : "年";
    const annual54CTarget = TAX_CREDIT_CAP / TAX_CREDIT_RATE;
    const shares = Math.ceil(annual54CTarget / (selectedEtfInfo.dividendPerPeriod * periodsPerYear * ratio));
    const dividendPerPeriodTotal = Math.round(shares * selectedEtfInfo.dividendPerPeriod);
    const annualDividendTotal = Math.round(shares * selectedEtfInfo.dividendPerPeriod * periodsPerYear);
    const period54C = Math.round(dividendPerPeriodTotal * ratio);
    const annual54C = Math.round(annualDividendTotal * ratio);
    const creditPerPeriod = Math.round(period54C * TAX_CREDIT_RATE);
    return { shares, ratioPct, periodLabel, dividendPerPeriodTotal, dividendPerPeriod: selectedEtfInfo.dividendPerPeriod, periodsPerYear, period54C, annual54C, annualDividendTotal, creditPerPeriod };
  }, [selectedEtf, selectedEtfInfo, etfRatioEstimates]);

  /** 當期投入標籤（用於約可買說明） */
  const periodLabelForBalance = "當月"; // 每月投入

  const currentBalanceForShares = currentPrincipalNum + (monthlyContributionNum + monthlyExtraNum) * 12;
  /** 當前本金＋當期（當月/當季等）投入的總和，用於「約可買」試算 */
  const balanceWithPeriodInvestment = currentPrincipalNum + (monthlyContributionNum + monthlyExtraNum) * periodMonthsForBalance;

  /** 第 N 次投入對應的目標月份（1～12），用於判斷是否為配息月 */
  const nthPeriodTargetMonth = useMemo(() => {
    const totalMonths = periodMonthsForBalance * nthPeriod;
    return ((((initialMonth - 1) + totalMonths) % 12) + 12) % 12 + 1;
  }, [initialMonth, periodMonthsForBalance, nthPeriod]);

  /** 當月是否為所選 ETF 的配息月（非配息月則股利=0、可再投入=0） */
  const isNthPeriodDividendMonth = useMemo(() => {
    const months = selectedEtfInfo?.dividendMonths;
    if (!months || months.length === 0) return true;
    return months.includes(nthPeriodTargetMonth);
  }, [selectedEtfInfo?.dividendMonths, nthPeriodTargetMonth]);

  /** 第 N 次投入的試算：當期股利、固定投入、可再投入（balance 含以往再投入） */
  const nthPeriodEstimate = useMemo(() => {
    const balance = balanceForNthPeriodDividend;
    const periodsPerYear = payoutFrequency === "month" ? 12 : payoutFrequency === "quarter" ? 4 : payoutFrequency === "semiannual" ? 2 : 1;
    const grossDividend = balance > 0 && effectiveAnnualRate > 0 ? (balance * (effectiveAnnualRate / 100)) / periodsPerYear : 0;
    const { net: afterTax } = getAfterTaxAndNhi2(grossDividend);
    const reinvestAmount = afterTax * (reinvestRatio / 100);
    const afterFee = Math.max(0, reinvestAmount - getBuyFee(reinvestAmount));
    const fixedForPeriod = (monthlyContributionNum + monthlyExtraNum) * periodMonthsForBalance;
    return { balance, grossDividend, afterTax, reinvestAmount, afterFee, fixedForPeriod };
  }, [balanceForNthPeriodDividend, effectiveAnnualRate, reinvestRatio, payoutFrequency, monthlyContributionNum, monthlyExtraNum, periodMonthsForBalance]);

  const sharesInfo = useMemo(() => {
    if (!selectedEtfInfo?.price || selectedEtfInfo.price <= 0) return null;
    const shares = Math.floor(balanceWithPeriodInvestment / selectedEtfInfo.price);
    const zhang = Math.floor(shares / 1000);
    return { shares, zhang };
  }, [selectedEtfInfo, balanceWithPeriodInvestment]);

  const sharesInfoNow = useMemo(() => {
    if (!selectedEtfInfo?.price || selectedEtfInfo.price <= 0) return null;
    const shares = Math.floor(currentPrincipalNum / selectedEtfInfo.price);
    const zhang = Math.floor(shares / 1000);
    return { shares, zhang };
  }, [selectedEtfInfo, currentPrincipalNum]);

  /** 依「本季股利(一張)稅後 × 再投入比例」計算可再投入股數（扣手續費後）— 用於無選 ETF 時的參考 */
  const sharesFromReinvest = useMemo(() => {
    if (!selectedEtfInfo?.price || selectedEtfInfo.price <= 0 || selectedEtfInfo.dividendPerPeriod == null) return null;
    const grossPerZhang = selectedEtfInfo.dividendPerPeriod * 1000;
    const { net: afterTaxPerZhang } = getAfterTaxAndNhi2(grossPerZhang);
    const reinvestAmount = afterTaxPerZhang * (reinvestRatio / 100);
    const afterFee = Math.max(0, reinvestAmount - getBuyFee(reinvestAmount));
    const shares = Math.floor(afterFee / selectedEtfInfo.price);
    const zhang = Math.floor(shares / 1000);
    return { shares, zhang };
  }, [selectedEtfInfo, reinvestRatio]);

  /** 依「本{月/季/半年/年}股利」實際金額計算可再投入股數（與半年股利連動） */
  const sharesFromActualDividend = useMemo(() => {
    if (!selectedEtfInfo?.price || selectedEtfInfo.price <= 0) return null;
    const afterFee = nthPeriodEstimate.afterFee;
    const shares = Math.floor(afterFee / selectedEtfInfo.price);
    const zhang = Math.floor(shares / 1000);
    return { shares, zhang };
  }, [selectedEtfInfo, nthPeriodEstimate.afterFee]);

  const simulation = useMemo(
    () =>
      simulate({
        initialPrincipal: principalForCalc,
        monthlyContribution: monthlyContributionNum,
        monthlyExtra: monthlyExtraNum,
        annualReturnRate: effectiveAnnualRate,
        reinvestRatio,
        payoutFrequency,
        // 目標一律為「每月想領多少」，依配息頻率換算成每期目標
        targetPayoutPerPeriod:
          payoutFrequency === "month"
            ? targetQuarterIncomeNum
            : payoutFrequency === "quarter"
            ? targetQuarterIncomeNum * 3
            : payoutFrequency === "semiannual"
            ? targetQuarterIncomeNum * 6
            : targetQuarterIncomeNum * 12,
        taxRate: effectiveTaxRateForSim,
      }),
    [
      principalForCalc,
      monthlyContributionNum,
      monthlyExtraNum,
      effectiveAnnualRate,
      reinvestRatio,
      payoutFrequency,
      targetQuarterIncomeNum,
      effectiveTaxRateForSim,
    ]
  );

  // 以「目標年數」為止的模擬，用於 KPI 卡顯示（期末資產／累積股利）
  const targetYearsNum = targetYearsToAchieveEmpty || targetYearsToAchieveNum <= 0 ? 20 : targetYearsToAchieveNum;
  const simulationAtTargetYears = useMemo(
    () =>
      simulate({
        initialPrincipal: principalForCalc,
        monthlyContribution: monthlyContributionNum,
        monthlyExtra: monthlyExtraNum,
        annualReturnRate: effectiveAnnualRate,
        reinvestRatio,
        payoutFrequency,
        targetPayoutPerPeriod:
          payoutFrequency === "month"
            ? targetQuarterIncomeNum
            : payoutFrequency === "quarter"
            ? targetQuarterIncomeNum * 3
            : payoutFrequency === "semiannual"
            ? targetQuarterIncomeNum * 6
            : targetQuarterIncomeNum * 12,
        maxMonths: Math.max(1, targetYearsNum) * 12,
        taxRate: effectiveTaxRateForSim,
      }),
    [
      principalForCalc,
      monthlyContributionNum,
      monthlyExtraNum,
      effectiveAnnualRate,
      reinvestRatio,
      payoutFrequency,
      targetQuarterIncomeNum,
      targetYearsNum,
      effectiveTaxRateForSim,
    ]
  );

  // 達成目標「每月等值」targetQuarterIncome 時，約需總資產（與配息頻率無關：皆為 月目標×12÷年化）
  const requiredAssetsForTarget = useMemo(() => {
    if (targetQuarterIncomeNum <= 0 || effectiveAnnualRate <= 0) return null;
    const annualRate = effectiveAnnualRate / 100;
    return Math.round((targetQuarterIncomeNum * 12) / annualRate);
  }, [targetQuarterIncomeNum, effectiveAnnualRate]);

  const requiredMonthlyToAchieveInYears = useMemo(() => {
    if (targetYearsToAchieveEmpty || targetYearsToAchieveNum <= 0)
      return null;
    const targetMonths = Math.floor(targetYearsToAchieveNum * 12);
    if (targetQuarterIncomeNum <= 0) return null;
    let low = 0;
    let high = 500000;
    const targetPerPeriod =
      payoutFrequency === "month"
        ? targetQuarterIncomeNum
        : payoutFrequency === "quarter"
        ? targetQuarterIncomeNum * 3
        : payoutFrequency === "semiannual"
        ? targetQuarterIncomeNum * 6
        : targetQuarterIncomeNum * 12;
    for (let i = 0; i < 35; i++) {
      const mid = Math.round((low + high) / 2);
      const res = simulate({
        initialPrincipal: principalForCalc,
        monthlyContribution: mid,
        monthlyExtra: monthlyExtraNum,
        annualReturnRate: effectiveAnnualRate,
        reinvestRatio,
        payoutFrequency,
        targetPayoutPerPeriod: targetPerPeriod,
        maxMonths: targetMonths,
        taxRate: effectiveTaxRateForSim,
      });
      const totalMonths =
        res.milestoneUserTargetIndex != null
          ? res.milestoneUserTargetIndex + 1
          : targetMonths + 1;
      if (totalMonths <= targetMonths) {
        high = mid;
      } else {
        low = mid + 1;
      }
    }
    const final = simulate({
      initialPrincipal: principalForCalc,
      monthlyContribution: high,
      monthlyExtra: monthlyExtraNum,
      annualReturnRate: effectiveAnnualRate,
      reinvestRatio,
      payoutFrequency,
      targetPayoutPerPeriod: targetPerPeriod,
      maxMonths: targetMonths,
      taxRate: effectiveTaxRateForSim,
    });
    const reachMonths =
      final.milestoneUserTargetIndex != null
        ? final.milestoneUserTargetIndex + 1
        : null;
    if (reachMonths == null || reachMonths > targetMonths) return null;
    // 若算出的「固定投入」過小（例如因已有高額外或本金），改以「從零開始」試算作為建議，讓數字合理
    if (high < 15000 && requiredAssetsForTarget != null && requiredAssetsForTarget > 500000) {
      let l = 0;
      let h = 500000;
      for (let i = 0; i < 35; i++) {
        const mid = Math.round((l + h) / 2);
        const res = simulate({
          initialPrincipal: 0,
          monthlyContribution: mid,
          monthlyExtra: 0,
          annualReturnRate: effectiveAnnualRate,
          reinvestRatio,
          payoutFrequency,
          targetPayoutPerPeriod: targetPerPeriod,
          maxMonths: targetMonths,
          taxRate: effectiveTaxRateForSim,
        });
        const totalMonths =
          res.milestoneUserTargetIndex != null
            ? res.milestoneUserTargetIndex + 1
            : targetMonths + 1;
        if (totalMonths <= targetMonths) h = mid;
        else l = mid + 1;
      }
      const verify = simulate({
        initialPrincipal: 0,
        monthlyContribution: h,
        monthlyExtra: 0,
        annualReturnRate: effectiveAnnualRate,
        reinvestRatio,
        payoutFrequency,
        targetPayoutPerPeriod: targetPerPeriod,
        maxMonths: targetMonths,
        taxRate: effectiveTaxRateForSim,
      });
      if (verify.milestoneUserTargetIndex != null && verify.milestoneUserTargetIndex + 1 <= targetMonths)
        return h;
    }
    return high;
  }, [
    targetYearsToAchieveEmpty,
    targetYearsToAchieveNum,
    targetQuarterIncomeNum,
    principalForCalc,
    monthlyExtraNum,
    effectiveAnnualRate,
    effectiveTaxRateForSim,
    reinvestRatio,
    payoutFrequency,
    requiredAssetsForTarget,
  ]);

  const intervalMonths =
    payoutFrequency === "month"
      ? 1
      : payoutFrequency === "quarter"
      ? 3
      : payoutFrequency === "semiannual"
      ? 6
      : 12;
  const periodsPerYear = 12 / intervalMonths;
  const periodRate = effectiveAnnualRate / 100 / periodsPerYear;

  const taxMessage = useMemo(() => {
    const grossPerPeriod = simulation.finalBalance * periodRate;
    if (grossPerPeriod < TAX_THRESHOLD) {
      return "因未達扣稅門檻，無須扣所得稅與二代健保補充保費。買入手續費 0.1425%（最低 20 元）已計入試算。";
    }
    const { tax, nhi2, net } = getAfterTaxAndNhi2(grossPerPeriod);
    const afterTaxReinvest = net * (reinvestRatio / 100);
    const fee = getBuyFee(afterTaxReinvest);
    const actualReinvest = Math.max(0, afterTaxReinvest - fee);
    return `扣所得稅 28% 與二代健保 2.11% 後實領約 ${Math.round(net).toLocaleString("zh-TW")} 元／期，再投入約 ${Math.round(actualReinvest).toLocaleString("zh-TW")} 元／期（扣手續費約 ${fee.toLocaleString("zh-TW")} 元）`;
  }, [simulation.finalBalance, periodRate, reinvestRatio]);

  const reinvestNoteIsMet = useMemo(
    () => simulation.finalBalance * periodRate >= TAX_THRESHOLD,
    [simulation.finalBalance, periodRate]
  );

  const restoreStockParamsDefaults = useCallback(() => {
    setInitialPrincipal("0");
    setMonthlyContribution("12000");
    setMonthlyExtra("6000");
    setTargetQuarterIncome("50000");
    setReinvestRatio(80);
    setTargetYearsToAchieve("20");
    setNthPeriod(1);
    setInitialYearStr(String(DEFAULT_SIM_START_YEAR));
    setInitialMonthStr(String(DEFAULT_SIM_START_MONTH));
    setEtfCodeFilter("");
    setSelectedEtf(DEFAULT_SELECTED_ETF_ID);
    setAnnualReturnRate(DEFAULT_ETF_PRESET.annualReturn);
    handlePayoutFrequencyChange(DEFAULT_ETF_PRESET.frequency);
    setDividendYieldPct(DEFAULT_ETF_PRESET.dividendYieldPct ?? "");
    setStockDividendPct(DEFAULT_ETF_PRESET.stockDividendPct ?? "");
    setRateSource("dividend");
  }, [handlePayoutFrequencyChange]);

  const applyCalculatorSnapshot = useCallback(
    (s: CalculatorSnapshotV1) => {
      skipTaxSyncFromIncomeRef.current = true;
      setInitialPrincipal(s.initialPrincipal);
      setMonthlyContribution(commitFormulaWithCommas(s.monthlyContribution));
      setMonthlyExtra(commitFormulaWithCommas(s.monthlyExtra));
      setAnnualReturnRate(s.annualReturnRate);
      setDividendYieldPct(s.dividendYieldPct === null ? "" : s.dividendYieldPct);
      setStockDividendPct(s.stockDividendPct === null ? "" : s.stockDividendPct);
      setRateSource(s.rateSource);
      setTargetQuarterIncome(commitFormulaWithCommas(s.targetQuarterIncome));
      setReinvestRatio(s.reinvestRatio);
      setPayoutFrequency(s.payoutFrequency as PayoutFrequency);
      setSelectedEtf(s.selectedEtf);
      setDefaultYearStr(s.defaultYearStr);
      setDefaultMonthStr(s.defaultMonthStr);
      setInitialYearStr(s.initialYearStr);
      setInitialMonthStr(s.initialMonthStr);
      const clampedNth = Math.max(1, Math.min(maxNthPeriod, Math.floor(s.nthPeriod) || 1));
      setNthPeriod(clampedNth);
      setTargetYearsToAchieve(s.targetYearsToAchieve);
      setTaxBracketRate(s.taxBracketRate);
      setApplyTaxInTable(s.applyTaxInTable);
      setApplyNhi2InTable(s.applyNhi2InTable);
      setAnnualIncome(s.annualIncome);
      setSeparateTaxOpen(s.separateTaxOpen);
      setManualOverrides(s.manualOverrides && typeof s.manualOverrides === "object" ? s.manualOverrides : {});
      setEtfRatioEstimates(
        s.etfRatioEstimates && typeof s.etfRatioEstimates === "object" ? s.etfRatioEstimates : buildDefault54cRatioMap(),
      );
      // 還原快照不應鎖死篩選字，否則下拉清單會看起來像只剩一檔/消失
      setEtfCodeFilter("");
    },
    [maxNthPeriod],
  );

  const stockAdvancedBlockProps: StockParamsAdvancedBlockProps = useMemo(
    () => ({
      etfCodeFilter,
      handleEtfCodeChange,
      selectedEtf,
      setSelectedEtf: selectEtfFromMenu,
      filteredEtfs,
      payoutFrequency,
      handlePayoutFrequencyChange,
      annualReturnRate,
      setAnnualReturnRate,
      setRateSource,
      rateSource,
      dividendYieldPct,
      stockDividendPct,
      setDividendYieldPct,
      setStockDividendPct,
      currentPrincipalNum,
      selectedEtfInfo,
      initialYearStr,
      setInitialYearStr,
      initialMonthStr,
      setInitialMonthStr,
      initialYear,
      initialMonth,
      defaultYear,
      defaultMonth,
      nthPeriod,
      setNthPeriod,
      maxNthPeriod,
      defaultYearStr,
      setDefaultYearStr,
      defaultMonthStr,
      setDefaultMonthStr,
      todayYear,
      todayMonth,
      monthlyContributionNum,
      monthlyExtraNum,
      effectivePayoutLabel,
      isNthPeriodDividendMonth,
      nthPeriodEstimate: { grossDividend: nthPeriodEstimate.grossDividend },
      sharesFromActualDividend,
      reinvestRatio,
      setReinvestRatio,
      reinvestNoteIsMet,
      periodLabelForBalance,
      periodMonthsForBalance,
      showAnnualInEtfRow: false,
      showInlinePrincipalCard: false,
      stackEtfRow: true,
      mobileGrouped: true,
    }),
    [
      etfCodeFilter,
      handleEtfCodeChange,
      selectEtfFromMenu,
      selectedEtf,
      filteredEtfs,
      payoutFrequency,
      handlePayoutFrequencyChange,
      annualReturnRate,
      rateSource,
      dividendYieldPct,
      stockDividendPct,
      currentPrincipalNum,
      selectedEtfInfo,
      initialYearStr,
      initialMonthStr,
      initialYear,
      initialMonth,
      defaultYear,
      defaultMonth,
      nthPeriod,
      maxNthPeriod,
      defaultYearStr,
      defaultMonthStr,
      todayYear,
      todayMonth,
      monthlyContributionNum,
      monthlyExtraNum,
      effectivePayoutLabel,
      isNthPeriodDividendMonth,
      nthPeriodEstimate,
      sharesFromActualDividend,
      reinvestRatio,
      reinvestNoteIsMet,
      periodLabelForBalance,
      periodMonthsForBalance,
    ]
  );

  const periodSnapshots = useMemo(
    () =>
      getPeriodSnapshots(
        {
          initialPrincipal: currentPrincipalNum,
          monthlyContribution: monthlyContributionNum,
          monthlyExtra: monthlyExtraNum,
          annualReturnRate: effectiveAnnualRate,
          reinvestRatio,
          payoutFrequency,
          dividendMonths: selectedEtfInfo?.dividendMonths,
        },
        selectedEtfInfo?.price ?? 100,
        20,
        initialYear,
        initialMonth
      ),
    [
      currentPrincipalNum,
      monthlyContributionNum,
      monthlyExtraNum,
      effectiveAnnualRate,
      reinvestRatio,
      payoutFrequency,
      selectedEtfInfo?.price,
      selectedEtfInfo?.dividendMonths,
      initialYear,
      initialMonth,
    ]
  );

  useEffect(() => {
    setMobileAccumShowNextTen(false);
  }, [periodSnapshots.length]);

  const noInvestBalance20y = currentPrincipalNum + (monthlyContributionNum + monthlyExtraNum) * 240;
  const investBalance20y = periodSnapshots.length > 0 ? periodSnapshots[periodSnapshots.length - 1].balance : 0;
  const diffVsNoInvest = investBalance20y - noInvestBalance20y;

  /** 依年度彙總股息（1～12月加總） */
  const annualDividendByYear = useMemo(() => {
    const byYear: Record<number, number> = {};
    periodSnapshots.forEach((row) => {
      const y = row.year;
      const d = safeNumber(row.lastPeriodDividend);
      if (!byYear[y]) byYear[y] = 0;
      byYear[y] += d;
    });
    return byYear;
  }, [periodSnapshots]);

  /** 本次股息欄位動態寬度：依全表 max，數字大時不擠壓 */
  const lastPeriodDividendColWidth = useMemo(() => {
    let maxVal = periodSnapshots.reduce((m, r) => Math.max(m, safeNumber(r.lastPeriodDividend)), 0);
    periodSnapshots.forEach((_, i) => {
      const v = safeNumber(manualOverrides[`${i}_lastPeriodDividend`]);
      if (v > maxVal) maxVal = v;
    });
    const str = maxVal > 0 ? Math.round(maxVal).toLocaleString("zh-TW") : "—";
    return Math.max(48, Math.ceil(str.length * 5.5));
  }, [periodSnapshots, manualOverrides]);

  /** 整年股息欄位動態寬度：依全表 max，數字大時不擠壓 */
  const annualDividendColWidth = useMemo(() => {
    const maxVal = Object.values(annualDividendByYear).reduce((m, v) => Math.max(m, v ?? 0), 0);
    const str = maxVal > 0 ? Math.round(maxVal).toLocaleString("zh-TW") : "—";
    return Math.max(48, Math.ceil(str.length * 5.5));
  }, [annualDividendByYear]);

  /** 依年度彙總應稅基數（1～12月加總） */
  const annualTaxableBaseByYear = useMemo(() => {
    const ratio54C = selectedEtf !== "none" ? (parseFloat(String(etfRatioEstimates[selectedEtf] || "50").replace(/,/g, "")) || 50) / 100 : 1;
    const byYear: Record<number, number> = {};
    periodSnapshots.forEach((row) => {
      const y = row.year;
      const tb = safeNumber(row.lastPeriodDividend) * ratio54C;
      if (!byYear[y]) byYear[y] = 0;
      byYear[y] += tb;
    });
    return byYear;
  }, [periodSnapshots, selectedEtf, etfRatioEstimates]);

  /** 54C應稅額、54C應納稅額、扣抵稅額：取全表 max，數字大時不擠壓右欄 */
  const annualTaxableBaseForColWidth = useMemo(() => {
    const vals = Object.values(annualTaxableBaseByYear).filter((v): v is number => v != null && v > 0);
    return vals.length > 0 ? Math.max(...vals) : 0;
  }, [annualTaxableBaseByYear]);

  /** 54C應稅額欄位動態寬度：維持兩行，依內容寬度，緊湊顯示 */
  const annualTaxableBaseColWidth = useMemo(() => {
    const str = annualTaxableBaseForColWidth > 0 ? Number(Math.ceil(annualTaxableBaseForColWidth).toFixed(0)).toLocaleString("zh-TW") : "—";
    const formulaLen = "年股息×54C".length;
    return Math.min(80, Math.max(48, Math.ceil(Math.max(str.length, formulaLen) * 4)));
  }, [annualTaxableBaseForColWidth]);

  /** 54C應納稅額欄位動態寬度：算式 應稅額×級距=結果 */
  const annualOrigTaxColWidth = useMemo(() => {
    const effectiveRate = separateTaxOpen ? 0.28 : taxBracketRate;
    const maxBase = annualTaxableBaseForColWidth;
    const maxOrig = maxBase * effectiveRate;
    const baseStr = maxBase > 0 ? Number(Math.ceil(maxBase).toFixed(0)).toLocaleString("zh-TW") : "—";
    const origStr = maxOrig > 0 ? Number(Math.ceil(maxOrig).toFixed(0)).toLocaleString("zh-TW") : "—";
    const rateStr = effectiveRate === 0.28 ? "28%" : `${Math.round(effectiveRate * 100)}%`;
    const fullFormula = `${baseStr} × ${rateStr} = ${origStr}`;
    return Math.min(100, Math.max(48, Math.ceil(fullFormula.length * 4)));
  }, [annualTaxableBaseForColWidth, separateTaxOpen, taxBracketRate]);

  /** 扣抵稅額欄位動態寬度：算式 應稅額×8.5%=結果（上限8萬） */
  const taxCreditColWidth = useMemo(() => {
    const maxBase = annualTaxableBaseForColWidth;
    const rawCredit = maxBase * TAX_CREDIT_RATE;
    const baseStr = maxBase > 0 ? Number(Math.ceil(maxBase).toFixed(0)).toLocaleString("zh-TW") : "—";
    const rawDisplay = rawCredit > 0 ? Number(Math.ceil(rawCredit).toFixed(0)).toLocaleString("zh-TW") : "—";
    const fullFormula = `${baseStr} × 8.5% = ${rawDisplay}`;
    return Math.min(95, Math.max(48, Math.ceil(fullFormula.length * 4)));
  }, [annualTaxableBaseForColWidth]);

  /** 每期應扣補稅額欄位動態寬度：取全表 max，數字大時不擠壓 */
  const perPeriodTaxColWidth = useMemo(() => {
    const periodsPerYear = payoutFrequency === "month" ? 12 : payoutFrequency === "quarter" ? 4 : payoutFrequency === "semiannual" ? 2 : 1;
    const divisor = selectedEtfInfo?.dividendMonths?.length ?? periodsPerYear;
    const effectiveRate = separateTaxOpen ? 0.28 : taxBracketRate;
    let maxVal = 0;
    Object.values(annualTaxableBaseByYear).forEach((base) => {
      if (base == null || base <= 0) return;
      const annualOrig = base * effectiveRate;
      const creditAmt = Math.min(base * TAX_CREDIT_RATE, TAX_CREDIT_CAP);
      const diff = annualOrig - creditAmt;
      const buShuiE = diff >= 0 ? Math.ceil(diff) : 0;
      const perPeriod = Math.ceil(buShuiE / divisor);
      if (perPeriod > maxVal) maxVal = perPeriod;
    });
    const str = maxVal > 0 ? maxVal.toLocaleString("zh-TW") : "—";
    return Math.min(90, Math.max(54, Math.ceil(str.length * 5)));
  }, [annualTaxableBaseByYear, payoutFrequency, selectedEtfInfo, separateTaxOpen, taxBracketRate]);

  /** 54C計入金額欄位動態寬度：取全表 max，數字大時不擠壓 */
  const amount54CColWidth = useMemo(() => {
    const ratio54C = selectedEtf !== "none" ? (parseFloat(String(etfRatioEstimates[selectedEtf] || "50").replace(/,/g, "")) || 50) / 100 : 1;
    let maxLen = 0;
    periodSnapshots.forEach((row) => {
      if (row.lastPeriodDividend <= 0) return;
      const div = Math.round(safeNumber(row.lastPeriodDividend));
      const tb = Math.round(div * ratio54C);
      const line1 = `${div.toLocaleString("zh-TW")}×${Math.round(ratio54C * 100)}%=`;
      const line2 = tb.toLocaleString("zh-TW");
      maxLen = Math.max(maxLen, line1.length, line2.length);
    });
    return Math.min(100, Math.max(54, Math.ceil(maxLen * 5)));
  }, [periodSnapshots, selectedEtf, etfRatioEstimates]);

  /** 是否達標須繳二代健保欄位動態寬度：取全表 max，數字大時不擠壓 */
  const nhi2StatusColWidth = useMemo(() => {
    const ratio54C = selectedEtf !== "none" ? (parseFloat(String(etfRatioEstimates[selectedEtf] || "50").replace(/,/g, "")) || 50) / 100 : 1;
    let maxLen = 0;
    periodSnapshots.forEach((row) => {
      if (row.lastPeriodDividend <= 0) return;
      const tb = Math.round(safeNumber(row.lastPeriodDividend) * ratio54C);
      const str = tb >= NHI2_THRESHOLD ? `${tb.toLocaleString("zh-TW")}≥20,000` : `${tb.toLocaleString("zh-TW")}<20,000`;
      maxLen = Math.max(maxLen, str.length);
    });
    return Math.min(100, Math.max(54, Math.ceil(maxLen * 5)));
  }, [periodSnapshots, selectedEtf, etfRatioEstimates]);

  /** 二代健保補充保費欄位動態寬度：算式在「=」斷行，取兩行較長者定寬，版面較窄 */
  const nhi2AmountColWidth = useMemo(() => {
    const ratio54C = selectedEtf !== "none" ? (parseFloat(String(etfRatioEstimates[selectedEtf] || "50").replace(/,/g, "")) || 50) / 100 : 1;
    let maxLen = 12;
    periodSnapshots.forEach((row) => {
      if (row.lastPeriodDividend <= 0) return;
      const div = Math.round(safeNumber(row.lastPeriodDividend));
      const tb = div * ratio54C;
      if (tb < NHI2_THRESHOLD) return;
      const nhi2Val = Math.round(tb * NHI2_RATE);
      const line1 = `${div.toLocaleString("zh-TW")}×${Math.round(ratio54C * 100)}%×2.11%=`;
      const line2 = nhi2Val.toLocaleString("zh-TW");
      maxLen = Math.max(maxLen, line1.length, line2.length, "本次股息×54C佔比×2.11%".length);
    });
    return Math.min(140, Math.max(56, Math.ceil(maxLen * 4.2)));
  }, [periodSnapshots, selectedEtf, etfRatioEstimates]);

  /** 手續費欄位動態寬度：取全表 max，數字大時不擠壓 */
  const feeColWidth = useMemo(() => {
    let maxVal = 0;
    periodSnapshots.forEach((row) => {
      const fee = safeNumber(row.contributionFee) + safeNumber(row.reinvestFee);
      if (fee > maxVal) maxVal = fee;
    });
    periodSnapshots.forEach((_, i) => {
      const v = safeNumber(manualOverrides[`${i}_fee`]);
      if (v > maxVal) maxVal = v;
    });
    const str = maxVal > 0 ? Math.round(safeNumber(maxVal)).toLocaleString("zh-TW") : "—";
    const headerMin = 52;
    return Math.max(headerMin, Math.ceil(str.length * 5.5));
  }, [periodSnapshots, manualOverrides]);

  /** 須扣除資金欄位動態寬度：補稅+補充保費+手續費，取全表 max */
  const totalDeductionColWidth = useMemo(() => {
    const ratio54C = selectedEtf !== "none" ? (parseFloat(String(etfRatioEstimates[selectedEtf] || "50").replace(/,/g, "")) || 50) / 100 : 1;
    const divisor = selectedEtfInfo?.dividendMonths?.length ?? (payoutFrequency === "month" ? 12 : payoutFrequency === "quarter" ? 4 : payoutFrequency === "semiannual" ? 2 : 1);
    const effectiveRate = separateTaxOpen ? 0.28 : taxBracketRate;
    let maxVal = 0;
    periodSnapshots.forEach((row) => {
      const perPeriodTax = row.lastPeriodDividend > 0 && (annualTaxableBaseByYear[row.year] ?? 0) > 0 ? (() => {
        const base = annualTaxableBaseByYear[row.year] ?? 0;
        const annualOrig = base * effectiveRate;
        const creditAmt = Math.min(base * TAX_CREDIT_RATE, TAX_CREDIT_CAP);
        const diff = annualOrig - creditAmt;
        const buShuiE = diff >= 0 ? Math.ceil(diff) : 0;
        return Math.ceil(buShuiE / divisor);
      })() : 0;
      const taxableBase = safeNumber(row.lastPeriodDividend) * ratio54C;
      const nhi2Num = taxableBase >= NHI2_THRESHOLD && applyNhi2InTable ? Math.round(taxableBase * NHI2_RATE) : 0;
      const total = Math.round(perPeriodTax + nhi2Num + safeNumber(row.contributionFee) + safeNumber(row.reinvestFee));
      if (total > maxVal) maxVal = total;
    });
    periodSnapshots.forEach((_, i) => {
      const v = safeNumber(manualOverrides[`${i}_totalDeduction`]);
      if (v > maxVal) maxVal = v;
    });
    const str = maxVal > 0 ? Math.round(safeNumber(maxVal)).toLocaleString("zh-TW") : "—";
    const formulaLen = "補稅+補充保費+手續費".length;
    const headerMin = Math.max(95, Math.ceil(formulaLen * 7));
    return Math.max(headerMin, Math.ceil(str.length * 5.5));
  }, [periodSnapshots, annualTaxableBaseByYear, payoutFrequency, selectedEtfInfo, separateTaxOpen, taxBracketRate, manualOverrides, applyNhi2InTable, etfRatioEstimates, selectedEtf]);

  /** 再投入比例欄位動態寬度：如 80% */
  const reinvestPctColWidth = useMemo(() => {
    let maxLen = 4; // "100%"
    periodSnapshots.forEach((row) => {
      const s = `${row.reinvestPct}%`;
      if (s.length > maxLen) maxLen = s.length;
    });
    return Math.min(52, Math.max(44, Math.ceil(maxLen * 6)));
  }, [periodSnapshots]);

  /** 本次再投入欄位動態寬度：公式 (股息-扣除)×比例=結果 */
  const reinvestAmountColWidth = useMemo(() => {
    const ratio54C = selectedEtf !== "none" ? (parseFloat(String(etfRatioEstimates[selectedEtf] || "50").replace(/,/g, "")) || 50) / 100 : 1;
    const divisor = selectedEtfInfo?.dividendMonths?.length ?? (payoutFrequency === "month" ? 12 : payoutFrequency === "quarter" ? 4 : payoutFrequency === "semiannual" ? 2 : 1);
    const effectiveRate = separateTaxOpen ? 0.28 : taxBracketRate;
    let maxLen = 0;
    periodSnapshots.forEach((row, i) => {
      if (row.lastPeriodDividend <= 0) return;
      const perPeriodTax = row.lastPeriodDividend > 0 && (annualTaxableBaseByYear[row.year] ?? 0) > 0 ? (() => {
        const base = annualTaxableBaseByYear[row.year] ?? 0;
        const annualOrig = base * effectiveRate;
        const creditAmt = Math.min(base * TAX_CREDIT_RATE, TAX_CREDIT_CAP);
        const diff = annualOrig - creditAmt;
        const buShuiE = diff >= 0 ? Math.ceil(diff) : 0;
        return Math.ceil(buShuiE / divisor);
      })() : 0;
      const taxableBase = safeNumber(row.lastPeriodDividend) * ratio54C;
      const nhi2Num = taxableBase >= NHI2_THRESHOLD && applyNhi2InTable ? Math.round(taxableBase * NHI2_RATE) : 0;
      const totalDeduction = Math.round(perPeriodTax + nhi2Num + safeNumber(row.contributionFee) + safeNumber(row.reinvestFee));
      const deductionVal = safeNumber(manualOverrides[`${i}_totalDeduction`] ?? totalDeduction);
      const div = Math.round(safeNumber(row.lastPeriodDividend));
      const reinvestDisplayVal = Math.round(Math.max(0, safeNumber(row.lastPeriodDividend) - deductionVal) * (row.reinvestPct / 100));
      const str = `(${div.toLocaleString("zh-TW")}-${deductionVal.toLocaleString("zh-TW")})×${row.reinvestPct}%=${reinvestDisplayVal.toLocaleString("zh-TW")}`;
      if (str.length > maxLen) maxLen = str.length;
    });
    return Math.min(120, Math.max(72, Math.ceil(maxLen * 5)));
  }, [periodSnapshots, annualTaxableBaseByYear, payoutFrequency, selectedEtfInfo, separateTaxOpen, taxBracketRate, manualOverrides, applyNhi2InTable, etfRatioEstimates, selectedEtf]);

  /** 上期總資金欄位動態寬度 */
  const previousBalanceColWidth = useMemo(() => {
    let maxVal = 0;
    periodSnapshots.forEach((row, i) => {
      const v = safeNumber(manualOverrides[`${i}_previousBalance`] ?? row.previousBalance);
      if (v > maxVal) maxVal = v;
    });
    const str = maxVal > 0 ? Math.round(safeNumber(maxVal)).toLocaleString("zh-TW") : "—";
    const headerMin = 52;
    return Math.max(headerMin, Math.ceil(str.length * 5.5));
  }, [periodSnapshots, manualOverrides]);

  /** 固定月投入欄位動態寬度 */
  const contributionColWidth = useMemo(() => {
    const intervalMonths = payoutFrequency === "month" ? 1 : payoutFrequency === "quarter" ? 3 : payoutFrequency === "semiannual" ? 6 : 12;
    const isMonthlyRows = Boolean(selectedEtfInfo?.dividendMonths?.length);
    const base = isMonthlyRows ? Math.round(monthlyContributionNum) : Math.round(monthlyContributionNum * intervalMonths);
    let maxVal = base;
    periodSnapshots.forEach((_, i) => {
      const v = safeNumber(manualOverrides[`${i}_contribution`]);
      if (v > maxVal) maxVal = v;
    });
    const str = maxVal > 0 ? Math.round(safeNumber(maxVal)).toLocaleString("zh-TW") : "—";
    const headerMin = 52;
    return Math.max(headerMin, Math.ceil(str.length * 5.5));
  }, [periodSnapshots, manualOverrides, monthlyContributionNum, payoutFrequency, selectedEtfInfo?.dividendMonths?.length]);

  /** 每月額外加碼欄位動態寬度 */
  const extraColWidth = useMemo(() => {
    const intervalMonths = payoutFrequency === "month" ? 1 : payoutFrequency === "quarter" ? 3 : payoutFrequency === "semiannual" ? 6 : 12;
    const isMonthlyRows = Boolean(selectedEtfInfo?.dividendMonths?.length);
    const base = isMonthlyRows ? Math.round(monthlyExtraNum) : Math.round(monthlyExtraNum * intervalMonths);
    let maxVal = base;
    periodSnapshots.forEach((_, i) => {
      const v = safeNumber(manualOverrides[`${i}_extra`]);
      if (v > maxVal) maxVal = v;
    });
    const str = maxVal > 0 ? Math.round(safeNumber(maxVal)).toLocaleString("zh-TW") : "—";
    const headerMin = 52;
    return Math.max(headerMin, Math.ceil(str.length * 5.5));
  }, [periodSnapshots, manualOverrides, monthlyExtraNum, payoutFrequency, selectedEtfInfo?.dividendMonths?.length]);

  /** 本期再投入資金（股利再投入）欄位動態寬度 */
  const reinvestInflowColWidth = useMemo(() => {
    const ratio54C = selectedEtf !== "none" ? (parseFloat(String(etfRatioEstimates[selectedEtf] || "50").replace(/,/g, "")) || 50) / 100 : 1;
    const divisor = selectedEtfInfo?.dividendMonths?.length ?? (payoutFrequency === "month" ? 12 : payoutFrequency === "quarter" ? 4 : payoutFrequency === "semiannual" ? 2 : 1);
    const effectiveRate = separateTaxOpen ? 0.28 : taxBracketRate;
    let maxVal = 0;
    periodSnapshots.forEach((row, i) => {
      if (row.lastPeriodDividend <= 0) return;
      const perPeriodTax = row.lastPeriodDividend > 0 && (annualTaxableBaseByYear[row.year] ?? 0) > 0 ? (() => {
        const base = annualTaxableBaseByYear[row.year] ?? 0;
        const annualOrig = base * effectiveRate;
        const creditAmt = Math.min(base * TAX_CREDIT_RATE, TAX_CREDIT_CAP);
        const diff = annualOrig - creditAmt;
        const buShuiE = diff >= 0 ? Math.ceil(diff) : 0;
        return Math.ceil(buShuiE / divisor);
      })() : 0;
      const taxableBase = safeNumber(row.lastPeriodDividend) * ratio54C;
      const nhi2Num = taxableBase >= NHI2_THRESHOLD && applyNhi2InTable ? Math.round(taxableBase * NHI2_RATE) : 0;
      const totalDeduction = Math.round(perPeriodTax + nhi2Num + safeNumber(row.contributionFee) + safeNumber(row.reinvestFee));
      const deductionVal = safeNumber(manualOverrides[`${i}_totalDeduction`] ?? totalDeduction);
      const val = Math.round(Math.max(0, safeNumber(row.lastPeriodDividend) - deductionVal) * (row.reinvestPct / 100));
      if (val > maxVal) maxVal = val;
    });
    const str = maxVal > 0 ? maxVal.toLocaleString("zh-TW") : "0";
    const headerMin = 52;
    return Math.max(headerMin, Math.ceil(str.length * 5.5));
  }, [periodSnapshots, annualTaxableBaseByYear, payoutFrequency, selectedEtfInfo, separateTaxOpen, taxBracketRate, manualOverrides, applyNhi2InTable, etfRatioEstimates, selectedEtf]);

  const setCellOverride = useCallback((rowIdx: number, colKey: string, value: number | null) => {
    setManualOverrides((prev) => {
      const key = `${rowIdx}_${colKey}`;
      if (value === null) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      const numVal = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : null;
      if (numVal === null) return prev;
      return { ...prev, [key]: numVal };
    });
  }, []);

  const getCellVal = useCallback((rowIdx: number, colKey: string, calc: number) => safeNumber(manualOverrides[`${rowIdx}_${colKey}`] ?? calc), [manualOverrides]);

  /** 累積金額與股數表：桌機 tbody 與手機卡片共用之衍生欄位（不重複計算邏輯） */
  const accumulatedPeriodRowModels = useMemo(() => {
    let cumulativeDividend = 0;
    return periodSnapshots.map((row, i) => {
      const effectiveRateForTable = separateTaxOpen ? 0.28 : taxBracketRate;
      const intervalMonths =
        payoutFrequency === "month" ? 1 : payoutFrequency === "quarter" ? 3 : payoutFrequency === "semiannual" ? 6 : 12;
      const periodsPerYearForTable =
        payoutFrequency === "month" ? 12 : payoutFrequency === "quarter" ? 4 : payoutFrequency === "semiannual" ? 2 : 1;
      const divisorForPerPeriodTax = selectedEtfInfo?.dividendMonths?.length ?? periodsPerYearForTable;
      const ratio54C =
        selectedEtf !== "none" ? (parseFloat(String(etfRatioEstimates[selectedEtf] || "50").replace(/,/g, "")) || 50) / 100 : 1;
      const rate = applyTaxInTable ? effectiveRateForTable : 0;
      const { nhi2 } = getAfterTaxAndNhi2WithRate(
        row.lastPeriodDividend,
        rate,
        applyNhi2InTable,
        periodsPerYearForTable,
        applyTaxInTable && !separateTaxOpen,
        ratio54C
      );
      const isMonthlyRows = Boolean(selectedEtfInfo?.dividendMonths?.length);
      const contributionDisplay = isMonthlyRows ? Math.round(monthlyContributionNum) : Math.round(monthlyContributionNum * intervalMonths);
      const extraDisplay = isMonthlyRows ? Math.round(monthlyExtraNum) : Math.round(monthlyExtraNum * intervalMonths);
      const taxableBase = row.lastPeriodDividend * ratio54C;
      const annualTaxableBase = annualTaxableBaseByYear[row.year] ?? 0;
      const isLastPeriodOfYear = i === periodSnapshots.length - 1 || periodSnapshots[i + 1]?.year !== row.year;
      const hasAnnualData = isLastPeriodOfYear && annualDividendByYear[row.year] != null && annualDividendByYear[row.year] > 0;
      const perPeriodTax =
        row.lastPeriodDividend > 0 && annualTaxableBase > 0 && applyTaxInTable
          ? (() => {
              const annualOrig = annualTaxableBase * effectiveRateForTable;
              const creditAmt = Math.min(annualTaxableBase * TAX_CREDIT_RATE, TAX_CREDIT_CAP);
              const diff = annualOrig - creditAmt;
              const buShuiE = diff >= 0 ? Math.ceil(diff) : 0;
              return Math.ceil(buShuiE / divisorForPerPeriodTax);
            })()
          : 0;
      const nhi2Num = taxableBase >= NHI2_THRESHOLD && applyNhi2InTable ? nhi2 : 0;
      const totalDeduction = Math.round(perPeriodTax + nhi2Num + safeNumber(row.contributionFee) + safeNumber(row.reinvestFee));
      const deductionVal = getCellVal(i, "totalDeduction", totalDeduction);
      const reinvestDisplayVal =
        row.lastPeriodDividend > 0 ? Math.round(Math.max(0, safeNumber(row.lastPeriodDividend) - deductionVal) * (row.reinvestPct / 100)) : 0;
      const totalInflowThisPeriod = safeNumber(row.fixedAddThisPeriod) + reinvestDisplayVal;
      const isFirstPeriod = i === 0;
      const nhi2Val = taxableBase < NHI2_THRESHOLD || !applyNhi2InTable ? 0 : Math.round(nhi2);
      const feeVal = safeNumber(row.contributionFee) + safeNumber(row.reinvestFee);
      const balancePbVal = getCellVal(i, "previousBalance", safeNumber(row.previousBalance));
      const balanceTifVal = getCellVal(i, "totalInflow", totalInflowThisPeriod);
      const balanceBalVal = getCellVal(i, "balance", safeNumber(row.balance));
      const balanceDisplayStr = `${Math.round(balancePbVal).toLocaleString("zh-TW")}+${Math.round(balanceTifVal).toLocaleString("zh-TW")}=${Math.round(balanceBalVal).toLocaleString("zh-TW")}`;
      const bracketDisplay = applyTaxInTable ? (separateTaxOpen ? "28%" : `${Math.round(taxBracketRate * 100)}%`) : "—";

      const dividendThisGross = getCellVal(i, "lastPeriodDividend", row.lastPeriodDividend);
      cumulativeDividend += dividendThisGross;
      const netTakeHome = Math.max(0, dividendThisGross - deductionVal);

      let sheetTax54CLine = "—";
      let sheetRefundLine = "—";
      if (hasAnnualData) {
        sheetTax54CLine = `${Number(Math.ceil(annualTaxableBase).toFixed(0)).toLocaleString("zh-TW")} × ${
          effectiveRateForTable === 0.28 ? "28%" : `${Math.round(effectiveRateForTable * 100)}%`
        } = ${Number(Math.ceil(annualTaxableBase * effectiveRateForTable).toFixed(0)).toLocaleString("zh-TW")}（54C應稅額×級距）`;
        const annualOrig = annualTaxableBase * effectiveRateForTable;
        const credit = Math.min(annualTaxableBase * TAX_CREDIT_RATE, TAX_CREDIT_CAP);
        const diff = annualOrig - credit;
        const isRefund = diff < 0;
        const origDisplay = Number(Math.ceil(annualOrig).toFixed(0)).toLocaleString("zh-TW");
        const creditDisplay = Number(Math.ceil(credit).toFixed(0)).toLocaleString("zh-TW");
        const displayVal = isRefund ? Math.abs(Math.floor(diff)) : Math.ceil(Math.max(diff, 0));
        sheetRefundLine = `${origDisplay} － ${creditDisplay} = ${displayVal.toLocaleString("zh-TW")} ${isRefund ? "(退稅額)" : "(補稅額)"}`;
      }

      return {
        row,
        i,
        effectiveRateForTable,
        intervalMonths,
        periodsPerYearForTable,
        divisorForPerPeriodTax,
        ratio54C,
        nhi2,
        isMonthlyRows,
        contributionDisplay,
        extraDisplay,
        taxableBase,
        annualTaxableBase,
        isLastPeriodOfYear,
        hasAnnualData,
        perPeriodTax,
        nhi2Num,
        totalDeduction,
        deductionVal,
        reinvestDisplayVal,
        totalInflowThisPeriod,
        isFirstPeriod,
        nhi2Val,
        feeVal,
        balancePbVal,
        balanceTifVal,
        balanceBalVal,
        balanceDisplayStr,
        bracketDisplay,
        cumulativeDividend,
        netTakeHome,
        dividendThisGross,
        sheetRatio54cPct: Math.round(ratio54C * 100),
        sheetTax54CLine,
        sheetRefundLine,
      };
    });
  }, [
    periodSnapshots,
    getCellVal,
    payoutFrequency,
    selectedEtfInfo?.dividendMonths,
    separateTaxOpen,
    taxBracketRate,
    applyTaxInTable,
    applyNhi2InTable,
    selectedEtf,
    etfRatioEstimates,
    annualDividendByYear,
    annualTaxableBaseByYear,
    monthlyContributionNum,
    monthlyExtraNum,
  ]);

  /** 手機版「累積金額與股數表」卡片：試算時間軸第 1 期（與試算起始年月一致，例如 2026/3） */
  const accumulatedPeriodRecentMobile = useMemo(() => {
    if (accumulatedPeriodRowModels.length === 0) return null;
    return accumulatedPeriodRowModels[0]!;
  }, [accumulatedPeriodRowModels]);

  /**
   * 手機「未來10期」：接續第 1 期之後的第 2～11 期，依時間正序（例如 2026/4 起），不含倒數或從表末回推。
   */
  const accumulatedPeriodNextTenMobile = useMemo(() => {
    const m = accumulatedPeriodRowModels;
    if (m.length <= 1) return [];
    return m.slice(1, 11);
  }, [accumulatedPeriodRowModels]);

  /** 本期總投入欄寬：依數字長度（含手動覆蓋） */
  const totalInflowColWidthDyn = useMemo(() => {
    let maxLen = "本期總投入".length;
    periodSnapshots.forEach((row, i) => {
      const upper = safeNumber(row.fixedAddThisPeriod) + safeNumber(row.lastPeriodDividend);
      maxLen = Math.max(maxLen, Math.round(upper).toLocaleString("zh-TW").length);
      const v = manualOverrides[`${i}_totalInflow`];
      if (typeof v === "number" && Number.isFinite(v)) {
        maxLen = Math.max(maxLen, Math.round(v).toLocaleString("zh-TW").length);
      }
    });
    return Math.min(150, Math.max(64, Math.ceil(maxLen * 5)));
  }, [periodSnapshots, manualOverrides]);

  /** 總資產欄寬：含「上期+本期=總資產」算式與中文公式 */
  const balanceColWidthDyn = useMemo(() => {
    const ratio54C = selectedEtf !== "none" ? (parseFloat(String(etfRatioEstimates[selectedEtf] || "50").replace(/,/g, "")) || 50) / 100 : 1;
    const divisorForPerPeriodTax =
      selectedEtfInfo?.dividendMonths?.length ??
      (payoutFrequency === "month" ? 12 : payoutFrequency === "quarter" ? 4 : payoutFrequency === "semiannual" ? 2 : 1);
    const effectiveRateForTable = separateTaxOpen ? 0.28 : taxBracketRate;
    let maxLen = "上期餘額＋本期總投入".length;
    periodSnapshots.forEach((row, i) => {
      const taxableBase = row.lastPeriodDividend * ratio54C;
      const annualTaxableBase = annualTaxableBaseByYear[row.year] ?? 0;
      const perPeriodTax =
        row.lastPeriodDividend > 0 && annualTaxableBase > 0 && applyTaxInTable
          ? (() => {
              const annualOrig = annualTaxableBase * effectiveRateForTable;
              const creditAmt = Math.min(annualTaxableBase * TAX_CREDIT_RATE, TAX_CREDIT_CAP);
              const diff = annualOrig - creditAmt;
              const buShuiE = diff >= 0 ? Math.ceil(diff) : 0;
              return Math.ceil(buShuiE / divisorForPerPeriodTax);
            })()
          : 0;
      const nhi2Num = taxableBase >= NHI2_THRESHOLD && applyNhi2InTable ? Math.round(taxableBase * NHI2_RATE) : 0;
      const totalDeduction = Math.round(perPeriodTax + nhi2Num + safeNumber(row.contributionFee) + safeNumber(row.reinvestFee));
      const deductionVal = safeNumber(manualOverrides[`${i}_totalDeduction`] ?? totalDeduction);
      const reinvestDisplayVal =
        row.lastPeriodDividend > 0 ? Math.round(Math.max(0, safeNumber(row.lastPeriodDividend) - deductionVal) * (row.reinvestPct / 100)) : 0;
      const totalInflowThisPeriod = safeNumber(row.fixedAddThisPeriod) + reinvestDisplayVal;
      const pb = safeNumber(manualOverrides[`${i}_previousBalance`] ?? safeNumber(row.previousBalance));
      const tif = safeNumber(manualOverrides[`${i}_totalInflow`] ?? totalInflowThisPeriod);
      const bal = safeNumber(manualOverrides[`${i}_balance`] ?? safeNumber(row.balance));
      const s = `${Math.round(pb).toLocaleString("zh-TW")}+${Math.round(tif).toLocaleString("zh-TW")}=${Math.round(bal).toLocaleString("zh-TW")}`;
      maxLen = Math.max(maxLen, s.length);
    });
    return Math.min(280, Math.max(96, Math.ceil(maxLen * 4.2)));
  }, [
    periodSnapshots,
    manualOverrides,
    annualTaxableBaseByYear,
    payoutFrequency,
    selectedEtfInfo,
    separateTaxOpen,
    taxBracketRate,
    applyNhi2InTable,
    applyTaxInTable,
    etfRatioEstimates,
    selectedEtf,
  ]);

  /** 與「下載 Excel」相同的二維陣列（含表頭），供手機完整明細彈窗預覽 */
  const accumulatedSheetExcelMatrix = useMemo(() => {
    const intervalMonths = payoutFrequency === "month" ? 1 : payoutFrequency === "quarter" ? 3 : payoutFrequency === "semiannual" ? 6 : 12;
    const periodsPerYearForTable = payoutFrequency === "month" ? 12 : payoutFrequency === "quarter" ? 4 : payoutFrequency === "semiannual" ? 2 : 1;
    const divisorForPerPeriodTax = selectedEtfInfo?.dividendMonths?.length ?? periodsPerYearForTable;
    const effectiveRateForTable = separateTaxOpen ? 0.28 : taxBracketRate;
    const isMonthlyRows = Boolean(selectedEtfInfo?.dividendMonths?.length);
    const contributionDisplay = isMonthlyRows ? Math.round(monthlyContributionNum) : Math.round(monthlyContributionNum * intervalMonths);
    const extraDisplay = isMonthlyRows ? Math.round(monthlyExtraNum) : Math.round(monthlyExtraNum * intervalMonths);

    const headers = ["期數", "所得級距", "本次股息", "整年股息", "×", "54C 股利佔比", "=", "54C應稅額", "54C應納稅額", "扣抵稅額", "補退稅淨額", "每期補稅", "54C計入金額", "二代健保門檻", "補充保費", "手續費", "=", "須扣除資金", "再投入股利比例", "本次再投入股利/股息", "上期餘額", "固定投入", "+", "額外加碼(加班費等)", "+", "股利再投入", "=", "本期總投入", "總資產"];

    const ratio54C = selectedEtf !== "none" ? (parseFloat(String(etfRatioEstimates[selectedEtf] || "50").replace(/,/g, "")) || 50) / 100 : 1;
    const rows: (string | number)[][] = [headers];
    periodSnapshots.forEach((row, i) => {
      const rate = applyTaxInTable ? effectiveRateForTable : 0;
      const { nhi2 } = getAfterTaxAndNhi2WithRate(
        row.lastPeriodDividend,
        rate,
        applyNhi2InTable,
        periodsPerYearForTable,
        applyTaxInTable && !separateTaxOpen,
        ratio54C
      );
      const taxableBase = row.lastPeriodDividend * ratio54C;
      const annualTaxableBase = annualTaxableBaseByYear[row.year] ?? 0;
      const isLastPeriodOfYear = i === periodSnapshots.length - 1 || periodSnapshots[i + 1]?.year !== row.year;
      const hasAnnualData = isLastPeriodOfYear && annualDividendByYear[row.year] != null && annualDividendByYear[row.year] > 0;
      const perPeriodTax =
        row.lastPeriodDividend > 0 && annualTaxableBase > 0 && applyTaxInTable
          ? (() => {
              const annualOrig = annualTaxableBase * effectiveRateForTable;
              const creditAmt = Math.min(annualTaxableBase * TAX_CREDIT_RATE, TAX_CREDIT_CAP);
              const diff = annualOrig - creditAmt;
              const buShuiE = diff >= 0 ? Math.ceil(diff) : 0;
              return Math.ceil(buShuiE / divisorForPerPeriodTax);
            })()
          : 0;
      const nhi2Num = taxableBase >= NHI2_THRESHOLD && applyNhi2InTable ? nhi2 : 0;
      const totalDeduction = Math.round(perPeriodTax + nhi2Num + safeNumber(row.contributionFee) + safeNumber(row.reinvestFee));
      const deductionVal = getCellVal(i, "totalDeduction", totalDeduction);
      const reinvestDisplayVal =
        row.lastPeriodDividend > 0 ? Math.round(Math.max(0, safeNumber(row.lastPeriodDividend) - deductionVal) * (row.reinvestPct / 100)) : 0;
      const totalInflowThisPeriod = safeNumber(row.fixedAddThisPeriod) + reinvestDisplayVal;
      const isFirstPeriod = i === 0;

      const nhi2Val = taxableBase < NHI2_THRESHOLD || !applyNhi2InTable ? 0 : Math.round(nhi2);
      const feeVal = safeNumber(row.contributionFee) + safeNumber(row.reinvestFee);
      const bracketDisplay = applyTaxInTable ? (separateTaxOpen ? "28%" : `${Math.round(taxBracketRate * 100)}%`) : "—";

      rows.push([
        row.periodLabel,
        bracketDisplay,
        getCellVal(i, "lastPeriodDividend", row.lastPeriodDividend > 0 ? Math.round(safeNumber(row.lastPeriodDividend)) : 0),
        isLastPeriodOfYear && annualDividendByYear[row.year] != null ? Math.round(annualDividendByYear[row.year]) : "—",
        "×",
        `${Math.round(ratio54C * 100)}%`,
        "=",
        hasAnnualData ? Math.ceil(annualTaxableBase) : "—",
        hasAnnualData ? Math.ceil(annualTaxableBase * effectiveRateForTable) : "—",
        hasAnnualData ? Math.ceil(Math.min(annualTaxableBase * TAX_CREDIT_RATE, TAX_CREDIT_CAP)) : "—",
        hasAnnualData
          ? (() => {
              const annualOrig = annualTaxableBase * effectiveRateForTable;
              const credit = Math.min(annualTaxableBase * TAX_CREDIT_RATE, TAX_CREDIT_CAP);
              const diff = annualOrig - credit;
              const isRefund = diff < 0;
              const displayVal = isRefund ? Math.abs(Math.floor(diff)) : Math.ceil(Math.max(diff, 0));
              const note = isRefund ? " (退稅額)" : " (補稅額)";
              return `${displayVal}${note}`;
            })()
          : "—",
        (() => {
          if (row.lastPeriodDividend <= 0) return "—";
          const annualOrig = annualTaxableBase * effectiveRateForTable;
          const credit = Math.min(annualTaxableBase * TAX_CREDIT_RATE, TAX_CREDIT_CAP);
          const diff = annualOrig - credit;
          const buShuiE = diff >= 0 ? Math.ceil(diff) : 0;
          return Math.ceil(buShuiE / divisorForPerPeriodTax);
        })(),
        row.lastPeriodDividend > 0 ? Math.round(taxableBase) : "—",
        !applyNhi2InTable ? "—" : taxableBase >= NHI2_THRESHOLD ? "達標" : "未達標",
        getCellVal(i, "nhi2", nhi2Val),
        getCellVal(i, "fee", feeVal),
        "=",
        getCellVal(i, "totalDeduction", totalDeduction),
        `${row.reinvestPct}%`,
        row.lastPeriodDividend > 0
          ? (() => {
              const dv = getCellVal(i, "totalDeduction", totalDeduction);
              const afterTax = Math.max(0, safeNumber(row.lastPeriodDividend) - dv);
              return Math.round(afterTax * (row.reinvestPct / 100));
            })()
          : "—",
        getCellVal(i, "previousBalance", isFirstPeriod ? 0 : safeNumber(row.previousBalance)),
        getCellVal(i, "contribution", contributionDisplay),
        "+",
        getCellVal(i, "extra", extraDisplay),
        "+",
        reinvestDisplayVal,
        "=",
        getCellVal(i, "totalInflow", totalInflowThisPeriod),
        getCellVal(i, "balance", safeNumber(row.balance)),
      ]);
    });

    return rows;
  }, [
    periodSnapshots,
    payoutFrequency,
    selectedEtfInfo?.dividendMonths,
    monthlyContributionNum,
    monthlyExtraNum,
    separateTaxOpen,
    taxBracketRate,
    applyTaxInTable,
    applyNhi2InTable,
    getCellVal,
    selectedEtf,
    etfRatioEstimates,
    annualDividendByYear,
    annualTaxableBaseByYear,
  ]);

  const downloadTableExcel = useCallback(() => {
    const ws = XLSX.utils.aoa_to_sheet(accumulatedSheetExcelMatrix);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "累積金額與股數");
    XLSX.writeFile(wb, `累積金額與股數表_${new Date().toISOString().slice(0, 10)}.xlsx`, { cellStyles: false });
  }, [accumulatedSheetExcelMatrix]);

  useEffect(() => {
    if (!mobileAccumFullTableModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileAccumFullTableModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileAccumFullTableModalOpen]);

  const fireEtaYears = simulation.yearsToUserTarget;
  const fireEtaMonths = simulation.monthsToUserTarget;
  const fireEtaStr =
    fireEtaYears != null && fireEtaMonths != null
      ? `${fireEtaYears} 年 ${fireEtaMonths} 個月`
      : "—";
  const fireEtaTargetDateStr =
    fireEtaYears != null && fireEtaMonths != null
      ? (() => {
          const totalMonthsToNow = nthPeriod; // 每月投入，第幾次＝第幾個月
          const currentYear = initialYear + Math.floor(((initialMonth - 1) + totalMonthsToNow) / 12);
          const currentMonth = (((initialMonth - 1) + totalMonthsToNow) % 12) + 1;
          const totalMonths = (currentMonth - 1) + fireEtaYears * 12 + fireEtaMonths;
          const targetYear = currentYear + Math.floor(totalMonths / 12);
          const targetMonth = (totalMonths % 12) + 1;
          return `${targetYear} 年 ${targetMonth} 月`;
        })()
      : "—";
  const achievementPercent =
    requiredAssetsForTarget != null && requiredAssetsForTarget > 0
      ? Math.min(
          100,
          Math.round(
            ((currentPrincipalNum + (monthlyContributionNum + monthlyExtraNum) * 12) /
              requiredAssetsForTarget) *
              100
          )
        )
      : 0;

  const freedomAchievedBySim =
    simulation.yearsToUserTarget === 0 &&
    simulation.monthsToUserTarget != null &&
    simulation.monthsToUserTarget <= 12;
  const freedomAchieved = achievementPercent >= 100 || freedomAchievedBySim;

  const renderCountdown = (
    title: string,
    years: number | null,
    months: number | null
  ) => {
    if (years === null || months === null) {
      return (
        <div style={{ fontSize: 12, color: "#9ca3af" }}>
          {title}：以目前參數在 40 年內尚無法達成
        </div>
      );
    }
    return (
      <div style={{ fontSize: 13, color: "#e5e7eb" }}>
        {title}：大約還需要{" "}
        <span style={{ color: "#39ff14", fontWeight: 600 }}>
          {years} 年 {months} 個月
        </span>
        <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 6 }}>
          （假設此時停止再投入、將該期報酬全數領出）
        </span>
      </div>
    );
  };

  // 右側大圖示：依達成年數顯示心情（笑臉 / 不笑 / 哭 / 靈魂+墳墓）
  const yearsForMood =
    simulation.yearsToUserTarget != null && simulation.monthsToUserTarget != null
      ? simulation.yearsToUserTarget + simulation.monthsToUserTarget / 12
      : simulation.yearsTo150000 != null && simulation.monthsTo150000 != null
      ? simulation.yearsTo150000 + simulation.monthsTo150000 / 12
      : null;

  const moodIcon =
    yearsForMood == null
      ? "ghost"
      : yearsForMood <= 10
      ? "smile"
      : yearsForMood <= 20
      ? "neutral"
      : yearsForMood <= 30
      ? "cry"
      : "ghost";

  const currentYear = new Date().getFullYear();

  const cardStyle: React.CSSProperties = {
    padding: 20,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(15,23,42,0.6)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    backdropFilter: "blur(12px)",
  };
  const tableCellBase: React.CSSProperties = {
    padding: "1px 1px",
    textAlign: "center",
    whiteSpace: "nowrap",
  };

  const TableEditableCell = useCallback(
    ({
      rowIdx,
      colKey,
      calcNum,
      displayStr,
      color,
      overrideColor = "#60a5fa",
      formula,
      wrap,
      nowrap,
      breakAtEquals,
    }: {
      rowIdx: number;
      colKey: string;
      calcNum: number;
      displayStr: string;
      color: string;
      overrideColor?: string;
      formula?: string;
      wrap?: boolean;
      nowrap?: boolean;
      breakAtEquals?: boolean;
    }) => {
      const cellKey = `${rowIdx}_${colKey}`;
      const v = manualOverrides[cellKey];
      const isValidNum = typeof v === "number" && Number.isFinite(v);
      const display = isValidNum ? v.toLocaleString("zh-TW") : displayStr;
      const hasOverride = isValidNum;
      const isEditing = editingCell?.key === cellKey;
      const inputValue = isEditing ? editingCell.value : display;
      const useDivDisplay = wrap && formula && !hasOverride && !isEditing && (displayStr.includes("×") || Boolean(breakAtEquals));
      const renderDisplayStr = () => {
        if (breakAtEquals && displayStr.includes("=")) {
          const eqIdx = displayStr.lastIndexOf("=");
          const beforeEq = displayStr.slice(0, eqIdx + 1);
          const afterEq = displayStr.slice(eqIdx + 1);
          return (
            <div style={{ lineHeight: 1.25, margin: 0, padding: 0, textAlign: "center" }}>
              <div style={{ lineHeight: 1.25 }}>{beforeEq}</div>
              <div style={{ lineHeight: 1.25 }}>{afterEq}</div>
            </div>
          );
        }
        return displayStr;
      };
      return (
        <td style={{ ...tableCellBase, color: hasOverride ? overrideColor : color, borderBottom: hasOverride ? "1px solid rgba(96,165,250,0.4)" : undefined, ...(wrap ? { whiteSpace: "normal", wordBreak: "break-word", overflow: "visible", minWidth: 0, maxWidth: "100%" } : {}), ...(nowrap ? { whiteSpace: "nowrap" } : {}) }}>
          <div style={{ lineHeight: breakAtEquals ? 1.25 : 1.25, minWidth: 0 }}>
            {useDivDisplay ? (
              <div style={{ fontSize: 11, padding: 0 }}>{renderDisplayStr()}</div>
            ) : (
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setEditingCell({ key: cellKey, value: e.target.value })}
              onFocus={() => setEditingCell({ key: cellKey, value: isValidNum ? String(v) : (displayStr === "—" || displayStr === "未達標" ? "" : String(calcNum)) })}
              onBlur={(e) => {
                const t = e.target.value.replace(/,/g, "");
                const n = parseFloat(t);
                if (t === "") setCellOverride(rowIdx, colKey, null);
                else if (Number.isFinite(n) && n >= 0) setCellOverride(rowIdx, colKey, Math.round(n));
                setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  (e.target as HTMLInputElement).blur();
                }
              }}
              style={{
                width: "100%",
                minWidth: 40,
                padding: 1,
                fontSize: 11,
                background: isEditing ? "rgba(245, 196, 81, 0.15)" : "transparent",
                border: isEditing ? "2px solid #f5c451" : "1px solid transparent",
                borderRadius: 4,
                color: "inherit",
                textAlign: "center",
              }}
            />
            )}
            {formula && <span style={{ fontSize: 9, color: "#6b7280", lineHeight: 1.15, display: "block", marginTop: 1, overflow: "visible", maxWidth: "100%", wordBreak: "break-word", whiteSpace: "pre-line" }}>{formula}</span>}
          </div>
        </td>
      );
    },
    [manualOverrides, editingCell, setEditingCell, setCellOverride]
  );

  const showStickyBar = stickyBarPinned || stickyBarVisible;

  const renderAccumulatedDesktopTable = () => (
            <table style={{ width: "fit-content", minWidth: 1056 + lastPeriodDividendColWidth + annualDividendColWidth + annualTaxableBaseColWidth + annualOrigTaxColWidth + taxCreditColWidth + perPeriodTaxColWidth + amount54CColWidth + nhi2StatusColWidth + nhi2AmountColWidth + feeColWidth + totalDeductionColWidth + reinvestPctColWidth + reinvestAmountColWidth + previousBalanceColWidth + contributionColWidth + extraColWidth + reinvestInflowColWidth + totalInflowColWidthDyn + balanceColWidthDyn, tableLayout: "fixed", borderCollapse: "collapse", fontSize: 11 }}>
              <colgroup>
                <col style={{ width: 48 }} />
                <col style={{ width: 40 }} />
                <col style={{ width: lastPeriodDividendColWidth }} />
                <col style={{ width: annualDividendColWidth }} />
                <col style={{ width: 4 }} />
                <col style={{ width: 38 }} />
                <col style={{ width: 4 }} />
                <col style={{ width: annualTaxableBaseColWidth }} />
                <col style={{ width: annualOrigTaxColWidth }} />
                <col style={{ width: taxCreditColWidth }} />
                <col style={{ width: 72 }} />
                <col style={{ width: perPeriodTaxColWidth }} />
                <col style={{ width: amount54CColWidth }} />
                <col style={{ width: nhi2StatusColWidth }} />
                <col style={{ width: nhi2AmountColWidth }} />
                <col style={{ width: feeColWidth }} />
                <col style={{ width: 4 }} />
                <col style={{ width: totalDeductionColWidth }} />
                <col style={{ width: reinvestPctColWidth }} />
                <col style={{ width: reinvestAmountColWidth }} />
                <col style={{ width: previousBalanceColWidth }} />
                <col style={{ width: contributionColWidth }} />
                <col style={{ width: 4 }} />
                <col style={{ width: extraColWidth }} />
                <col style={{ width: 4 }} />
                <col style={{ width: reinvestInflowColWidth }} />
                <col style={{ width: 4 }} />
                <col style={{ width: totalInflowColWidthDyn }} />
                <col style={{ width: balanceColWidthDyn }} />
              </colgroup>
              <thead style={{ position: "sticky", top: 0, background: "rgba(15,23,42,0.95)", zIndex: 1 }}>
                <tr>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "nowrap", lineHeight: 1.3, textAlign: "center" }}>期數</th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "nowrap", lineHeight: 1.3 }}>所得級距</th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "nowrap", lineHeight: 1.3 }}>本次股息</th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "nowrap", lineHeight: 1.4 }}>整年股息<br /><span style={{ color: "#6b7280", fontWeight: 400 }}>該年加總</span></th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", color: "#34d399" }}>×</th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "normal", lineHeight: 1.3 }}>54C<br />股利佔比</th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", color: "#34d399" }}>=</th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "normal", lineHeight: 1.4, wordBreak: "keep-all" }}>54C應稅額<br /><span style={{ color: "#6b7280", fontWeight: 400 }}>年股息×54C</span></th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "normal", lineHeight: 1.4, wordBreak: "keep-all" }}>54C應納稅額<br /><span style={{ color: "#6b7280", fontWeight: 400 }}>54C應稅額×級距</span></th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "normal", lineHeight: 1.4, wordBreak: "keep-all" }}>扣抵稅額<br /><span style={{ color: "#6b7280", fontWeight: 400 }}>應稅額×8.5%（上限8萬）</span></th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "normal", lineHeight: 1.4, wordBreak: "keep-all" }}>補退稅淨額<br /><span style={{ color: "#6b7280", fontWeight: 400 }}>應納稅額－扣抵稅額</span></th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "normal", lineHeight: 1.4, wordBreak: "keep-all" }}>每期補稅<br /><span style={{ color: "#6b7280", fontWeight: 400 }}>補稅額÷配息次數</span></th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "normal", lineHeight: 1.4, wordBreak: "keep-all" }}>54C計入金額<br /><span style={{ color: "#6b7280", fontWeight: 400 }}>本次股息×54C佔比</span></th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "normal", lineHeight: 1.3, wordBreak: "break-word" }}>二代健保門檻<br /><span style={{ color: "#6b7280", fontWeight: 400 }}>須繳二代健保</span></th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "normal", lineHeight: 1.3 }}>補充保費<br /><span style={{ color: "#6b7280", fontWeight: 400 }}>二代健保</span></th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "nowrap", lineHeight: 1.4 }}>手續費<br /><span style={{ color: "#6b7280", fontWeight: 400 }}>投入×0.1425%</span></th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", color: "#34d399" }}>=</th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "normal", lineHeight: 1.4, wordBreak: "keep-all", overflow: "hidden" }}>須扣除資金<br /><span style={{ color: "#6b7280", fontWeight: 400 }}>補稅+補充保費+手續費</span></th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "normal", lineHeight: 1.4, wordBreak: "keep-all", overflow: "hidden" }}>再投入比例<br /><span style={{ color: "#6b7280", fontWeight: 400 }}>股利再投入%</span></th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "normal", lineHeight: 1.4, wordBreak: "keep-all" }}>本次再投入<br /><span style={{ color: "#6b7280", fontWeight: 400 }}>(股息-扣除)×再投入比例</span></th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "normal", lineHeight: 1.4, wordBreak: "keep-all" }}>上期餘額</th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "normal", lineHeight: 1.4, wordBreak: "keep-all" }}>固定投入</th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", color: "#34d399" }}>+</th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "normal", lineHeight: 1.4, wordBreak: "keep-all" }}>額外加碼<br /><span style={{ color: "#6b7280", fontWeight: 400 }}>加班費等</span></th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", color: "#34d399" }}>+</th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "normal", lineHeight: 1.4, wordBreak: "keep-all" }}>股利再投入</th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", color: "#34d399" }}>=</th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "nowrap", lineHeight: 1.4 }}>本期總投入</th>
                  <th style={{ ...tableCellBase, borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "normal", lineHeight: 1.2, wordBreak: "keep-all", padding: "2px 2px" }}>總資產<br /><span style={{ color: "#6b7280", fontWeight: 400, fontSize: 10 }}>上期餘額＋本期總投入</span></th>
                </tr>
              </thead>
              <tbody>
                {accumulatedPeriodRowModels.map((d) => {
                  const {
                    row,
                    i,
                    effectiveRateForTable,
                    divisorForPerPeriodTax,
                    ratio54C,
                    nhi2,
                    taxableBase,
                    annualTaxableBase,
                    isLastPeriodOfYear,
                    hasAnnualData,
                    totalDeduction,
                    deductionVal,
                    reinvestDisplayVal,
                    totalInflowThisPeriod,
                    isFirstPeriod,
                    nhi2Val,
                    feeVal,
                    balanceDisplayStr,
                    bracketDisplay,
                    contributionDisplay,
                    extraDisplay,
                  } = d;
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <td style={{ ...tableCellBase, color: "#d1d5db", textAlign: "center", whiteSpace: "nowrap" }}>{row.periodLabel}</td>
                      <td style={{ ...tableCellBase, color: "#9ca3af", textAlign: "center", whiteSpace: "nowrap" }}>{bracketDisplay}</td>
                      <TableEditableCell rowIdx={i} colKey="lastPeriodDividend" calcNum={row.lastPeriodDividend} displayStr={row.lastPeriodDividend > 0 ? Math.round(safeNumber(row.lastPeriodDividend)).toLocaleString("zh-TW") : "—"} color="#9ca3af" nowrap />
                      <td style={{ ...tableCellBase, color: "#9ca3af", textAlign: "center", whiteSpace: "nowrap" }}>
                        {isLastPeriodOfYear && annualDividendByYear[row.year] != null ? Number(Math.floor(annualDividendByYear[row.year]).toFixed(0)).toLocaleString("zh-TW") : "—"}
                      </td>
                      <td style={{ ...tableCellBase, color: "#34d399", textAlign: "center" }}>×</td>
                      <td style={{ ...tableCellBase, color: "#9ca3af", textAlign: "center" }}>{Math.round(ratio54C * 100)}%</td>
                      <td style={{ ...tableCellBase, color: "#34d399", textAlign: "center" }}>=</td>
                      <td style={{ ...tableCellBase, color: "#9ca3af", textAlign: "center", lineHeight: 1.4, whiteSpace: "normal", wordBreak: "keep-all" }}>
                        {hasAnnualData ? (
                          <>
                            {Number(Math.ceil(annualTaxableBase).toFixed(0)).toLocaleString("zh-TW")}
                            <br />
                            <span style={{ fontSize: 10, color: "#6b7280" }}>年股息×54C</span>
                          </>
                        ) : "—"}
                      </td>
                      <td style={{ ...tableCellBase, color: "#9ca3af", textAlign: "center", lineHeight: 1.4, whiteSpace: "normal", wordBreak: "keep-all" }}>
                        {hasAnnualData ? (
                          <>
                            {Number(Math.ceil(annualTaxableBase).toFixed(0)).toLocaleString("zh-TW")} × {effectiveRateForTable === 0.28 ? "28%" : `${Math.round(effectiveRateForTable * 100)}%`} = {Number(Math.ceil(annualTaxableBase * effectiveRateForTable).toFixed(0)).toLocaleString("zh-TW")}
                            <br />
                            <span style={{ fontSize: 10, color: "#6b7280" }}>54C應稅額×級距</span>
                          </>
                        ) : "—"}
                      </td>
                      <td style={{ ...tableCellBase, color: "#9ca3af", textAlign: "center", lineHeight: 1.4, whiteSpace: "normal", wordBreak: "keep-all" }}>
                        {hasAnnualData ? (() => {
                          const rawCredit = annualTaxableBase * TAX_CREDIT_RATE;
                          const cappedCredit = Math.min(rawCredit, TAX_CREDIT_CAP);
                          const rawDisplay = Number(Math.ceil(rawCredit).toFixed(0)).toLocaleString("zh-TW");
                          const cappedDisplay = Number(Math.ceil(cappedCredit).toFixed(0)).toLocaleString("zh-TW");
                          const hitCap = rawCredit >= TAX_CREDIT_CAP;
                          return (
                            <>
                              {Number(Math.ceil(annualTaxableBase).toFixed(0)).toLocaleString("zh-TW")} × 8.5% = {rawDisplay}
                              {hitCap && (
                                <>
                                  <br />
                                  <span style={{ fontSize: 10, color: "#6b7280" }}>→ 取上限 {cappedDisplay}</span>
                                </>
                              )}
                              <br />
                              <span style={{ fontSize: 10, color: "#6b7280" }}>應稅額×8.5%（上限8萬）</span>
                            </>
                          );
                        })() : "—"}
                      </td>
                      <td style={{ ...tableCellBase, textAlign: "center", lineHeight: 1.4, whiteSpace: "normal", wordBreak: "keep-all" }}>
                        {hasAnnualData ? (() => {
                          const annualOrig = annualTaxableBase * effectiveRateForTable;
                          const credit = Math.min(annualTaxableBase * TAX_CREDIT_RATE, TAX_CREDIT_CAP);
                          const diff = annualOrig - credit;
                          const isRefund = diff < 0;
                          const displayVal = isRefund ? Math.abs(Math.floor(diff)) : -Math.ceil(Math.max(diff, 0));
                          const origDisplay = Number(Math.ceil(annualOrig).toFixed(0)).toLocaleString("zh-TW");
                          const creditDisplay = Number(Math.ceil(credit).toFixed(0)).toLocaleString("zh-TW");
                          const resultColor = isRefund ? "#34d399" : "#ef4444";
                          return (
                            <>
                              <span style={{ color: "#9ca3af" }}>{origDisplay} － {creditDisplay} = </span>
                              <span style={{ color: resultColor }}>{Math.abs(displayVal).toLocaleString("zh-TW")}</span>
                              <br />
                              <span style={{ fontSize: 10, color: resultColor }}>{isRefund ? "(退稅額)" : "(補稅額)"}</span>
                            </>
                          );
                        })() : "—"}
                      </td>
                      <td style={{ ...tableCellBase, color: row.lastPeriodDividend > 0 ? "#ef4444" : "#9ca3af", textAlign: "center" }}>
                        {row.lastPeriodDividend > 0 ? (() => {
                          const annualOrig = annualTaxableBase * effectiveRateForTable;
                          const creditAmt = Math.min(annualTaxableBase * TAX_CREDIT_RATE, TAX_CREDIT_CAP);
                          const diff = annualOrig - creditAmt;
                          const buShuiE = diff >= 0 ? Math.ceil(diff) : 0;
                          const val = Math.ceil(buShuiE / divisorForPerPeriodTax);
                          return val.toLocaleString("zh-TW");
                        })() : "—"}
                      </td>
                      <td style={{ ...tableCellBase, color: "#9ca3af", textAlign: "center", whiteSpace: "normal", wordBreak: "keep-all", lineHeight: 1.4 }}>
                        {row.lastPeriodDividend > 0 ? (
                          <>
                            {Math.round(safeNumber(row.lastPeriodDividend)).toLocaleString("zh-TW")}×{Math.round(ratio54C * 100)}%=
                            <br />
                            {Math.round(taxableBase).toLocaleString("zh-TW")}
                            <br />
                            <span style={{ fontSize: 10, color: "#6b7280" }}>本次股息×54C佔比</span>
                          </>
                        ) : "—"}
                      </td>
                      <td style={{ ...tableCellBase, textAlign: "center", whiteSpace: "normal", wordBreak: "keep-all", lineHeight: 1.4 }}>
                        {!applyNhi2InTable || !row.lastPeriodDividend || row.lastPeriodDividend <= 0 ? (
                          <span style={{ color: "#9ca3af" }}>—</span>
                        ) : taxableBase >= NHI2_THRESHOLD ? (
                          <>
                            <span style={{ color: "#ef4444", fontWeight: 600 }}>達標</span>
                            <br />
                            <span style={{ color: "#ef4444" }}>{Math.round(taxableBase).toLocaleString("zh-TW")}≥20,000</span>
                            <br />
                            <span style={{ fontSize: 10, color: "#6b7280" }}>54C計入金額≥20,000</span>
                          </>
                        ) : (
                          <>
                            <span style={{ color: "#34d399", fontWeight: 600 }}>未達標</span>
                            <br />
                            <span style={{ color: "#34d399" }}>{Math.round(taxableBase).toLocaleString("zh-TW")}&lt;20,000</span>
                            <br />
                            <span style={{ fontSize: 10, color: "#6b7280" }}>54C計入金額&lt;20,000</span>
                          </>
                        )}
                      </td>
                      <TableEditableCell rowIdx={i} colKey="nhi2" calcNum={nhi2Val} displayStr={taxableBase >= NHI2_THRESHOLD && applyNhi2InTable ? `${Math.round(safeNumber(row.lastPeriodDividend)).toLocaleString("zh-TW")}×${Math.round(ratio54C * 100)}%×2.11%=${Math.round(nhi2).toLocaleString("zh-TW")}` : "—"} color={taxableBase >= NHI2_THRESHOLD && applyNhi2InTable ? "#ef4444" : "#9ca3af"} formula={taxableBase >= NHI2_THRESHOLD && applyNhi2InTable ? "本次股息×54C佔比×2.11%" : undefined} wrap breakAtEquals />
                      <TableEditableCell rowIdx={i} colKey="fee" calcNum={feeVal} displayStr={feeVal.toLocaleString("zh-TW")} color="#ef4444" formula="投入×0.1425%" />
                      <td style={{ ...tableCellBase, color: "#34d399" }}>=</td>
                      <TableEditableCell rowIdx={i} colKey="totalDeduction" calcNum={totalDeduction} displayStr={totalDeduction.toLocaleString("zh-TW")} color="#ef4444" formula="補稅+補充保費+手續費" wrap />
                      <td style={{ ...tableCellBase, color: "#f5c451" }}>{`${row.reinvestPct}%`}</td>
                      <td style={{ ...tableCellBase, color: "#f5c451", textAlign: "center", whiteSpace: "normal", wordBreak: "keep-all", lineHeight: 1.4 }}>
                        {row.lastPeriodDividend > 0 ? (() => {
                          const div = Math.round(safeNumber(row.lastPeriodDividend));
                          const formulaStr = `(${div.toLocaleString("zh-TW")}-${deductionVal.toLocaleString("zh-TW")})×${row.reinvestPct}%=`;
                          const resultStr = reinvestDisplayVal.toLocaleString("zh-TW");
                          return (
                            <div style={{ lineHeight: 1.3 }}>
                              <div>{formulaStr}</div>
                              <div>{resultStr}</div>
                              <span style={{ fontSize: 10, color: "#6b7280" }}>(股息-扣除)×再投入比例</span>
                            </div>
                          );
                        })() : "—"}
                      </td>
                      <TableEditableCell rowIdx={i} colKey="previousBalance" calcNum={safeNumber(row.previousBalance)} displayStr={isFirstPeriod ? "—" : safeNumber(row.previousBalance).toLocaleString("zh-TW")} color="#d1d5db" />
                      <TableEditableCell rowIdx={i} colKey="contribution" calcNum={contributionDisplay} displayStr={contributionDisplay.toLocaleString("zh-TW")} color="#e5e7eb" />
                      <td style={{ ...tableCellBase, color: "#34d399", fontWeight: 600 }}>+</td>
                      <TableEditableCell rowIdx={i} colKey="extra" calcNum={extraDisplay} displayStr={extraDisplay.toLocaleString("zh-TW")} color="#e5e7eb" />
                      <td style={{ ...tableCellBase, color: "#34d399", fontWeight: 600 }}>+</td>
                      <td style={{ ...tableCellBase, color: "#f5c451", textAlign: "center" }}>{reinvestDisplayVal.toLocaleString("zh-TW")}</td>
                      <td style={{ ...tableCellBase, color: "#34d399", fontWeight: 600 }}>=</td>
                      <TableEditableCell rowIdx={i} colKey="totalInflow" calcNum={totalInflowThisPeriod} displayStr={totalInflowThisPeriod.toLocaleString("zh-TW")} color="#e5e7eb" />
                      <TableEditableCell
                        rowIdx={i}
                        colKey="balance"
                        calcNum={safeNumber(row.balance)}
                        displayStr={balanceDisplayStr}
                        color="#39ff14"
                        formula="上期餘額＋本期總投入＝期末總資產"
                        wrap
                        breakAtEquals
                      />
                    </tr>
                  );
                })}
              </tbody>
            </table>
  );

  const homeHeroBlogHref = blogPostPath(HOME_HERO_FIRST_SLUG);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #020617 0%, #0f172a 50%, #020617 100%)",
        color: "#e5e7eb",
        padding: "100px 16px 24px",
      }}
    >
      {/* 頂部橫幅：隱藏時 pointerEvents: none 才不會擋住右下角「打開」按鈕 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          transform: showStickyBar ? "translateY(0)" : "translateY(-100%)",
          transition: "transform 0.25s ease",
          background: "linear-gradient(180deg, rgba(22,26,52,0.98) 0%, rgba(14,18,42,0.97) 100%)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(120,140,200,0.12)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.25), 0 1px 0 rgba(255,255,255,0.03) inset",
          padding: "8px 16px",
          boxSizing: "border-box",
          pointerEvents: showStickyBar ? "auto" : "none",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            width: "100%",
            maxWidth: 1600,
            margin: "0 auto",
            position: "relative",
            paddingBottom: 4,
            overflow: "hidden",
          }}
        >
          {/* 右上角浮層：固定在最上層，不跟左右滑內容重疊 */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              zIndex: 5,
              width: "auto",
              display: "flex",
              justifyContent: "flex-end",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                width: "fit-content",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 4,
                padding: "0 0 4px 0",
                pointerEvents: "auto",
                background: "rgba(14,18,42,0.97)",
                border: "1px solid rgba(120,140,200,0.12)",
                borderTop: "none",
                borderRight: "none",
                borderRadius: "0 0 0 12px",
                boxShadow: "-6px 6px 18px rgba(0,0,0,0.22)",
                paddingLeft: 8,
                paddingRight: 8,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setInitialPrincipal("0");
                  setMonthlyContribution("12000");
                  setMonthlyExtra("6000");
                  setTargetQuarterIncome("50000");
                  setReinvestRatio(80);
                  setTargetYearsToAchieve("20");
                  setNthPeriod(1);
                  setInitialYearStr(String(DEFAULT_SIM_START_YEAR));
                  setInitialMonthStr(String(DEFAULT_SIM_START_MONTH));
                  setEtfCodeFilter("");
                  setSelectedEtf(DEFAULT_SELECTED_ETF_ID);
                  setAnnualReturnRate(DEFAULT_ETF_PRESET.annualReturn);
                  handlePayoutFrequencyChange(DEFAULT_ETF_PRESET.frequency);
                  setDividendYieldPct(DEFAULT_ETF_PRESET.dividendYieldPct ?? "");
                  setStockDividendPct(DEFAULT_ETF_PRESET.stockDividendPct ?? "");
                  setRateSource("dividend");
                }}
                style={{
                  padding: "4px 10px",
                  fontSize: 11,
                  borderRadius: 6,
                  border: "1px solid rgba(57,255,20,0.6)",
                  background: "rgba(57,255,20,0.16)",
                  color: "#39ff14",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                恢復預設
              </button>
              <button
                type="button"
                onClick={() => setStickyBarPinned((p) => !p)}
                title={stickyBarPinned ? "取消釘選" : "釘選"}
                style={{
                  padding: "4px 8px",
                  fontSize: 11,
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: stickyBarPinned ? "rgba(57,255,20,0.2)" : "rgba(255,255,255,0.08)",
                  color: stickyBarPinned ? "#39ff14" : "#9ca3af",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 12 }}>📌</span>
                {stickyBarPinned ? "已釘選" : "釘選"}
              </button>
            </div>
          </div>

          {/* 內容區：手機可左右滑（右側保留空間避免被遮住） */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              paddingRight: 182,
              overflowX: "auto",
              overflowY: "hidden",
              WebkitOverflowScrolling: "touch",
              touchAction: "pan-x",
              overscrollBehaviorX: "contain",
            }}
          >
            {/* 第一行：Grid 兩欄 — 左 本金～達成年、右 ETF、稅金 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "nowrap",
                width: "max-content",
              }}
            >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "nowrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>本金</span>
              <div style={{ display: "flex", alignItems: "stretch", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.4)", width: 88 }}>
                <input
                  type="text"
                  inputMode="decimal"
                  value={currentPrincipalStr}
                  onChange={(e) => setCurrentPrincipalStr(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    setCurrentPrincipalStr(commitFormulaWithCommas(currentPrincipalStr));
                    (e.target as HTMLInputElement).blur();
                  }}
                  onBlur={() => setCurrentPrincipalStr(commitFormulaWithCommas(currentPrincipalStr))}
                  onFocus={(e) => e.target.select()}
                  style={{ ...inputStyle, flex: 1, width: 0, border: "none", borderRadius: 0, padding: "4px 6px", fontSize: 11 }}
                />
                <div style={{ display: "flex", flexDirection: "column", width: 20, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                  <button type="button" aria-label="+1k" onClick={() => { const n = Math.max(0, parseFormula(currentPrincipalStr) || 0); setCurrentPrincipalStr(Math.floor(n + (n > 100000 ? 5000 : 1000)).toLocaleString("zh-TW")); }} style={{ flex: 1, minHeight: 12, padding: 0, border: "none", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 9 }}>▲</button>
                  <button type="button" aria-label="-1k" onClick={() => { const n = Math.max(0, parseFormula(currentPrincipalStr) || 0); setCurrentPrincipalStr(Math.floor(Math.max(0, n - (n > 100000 ? 5000 : 1000))).toLocaleString("zh-TW")); }} style={{ flex: 1, minHeight: 12, padding: 0, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 9 }}>▼</button>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>月投</span>
              <div style={{ display: "flex", alignItems: "stretch", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.4)", width: 72 }}>
                <input
                  type="text"
                  inputMode="decimal"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    setMonthlyContribution(commitFormulaWithCommas(monthlyContribution));
                    (e.target as HTMLInputElement).blur();
                  }}
                  onBlur={() => setMonthlyContribution(commitFormulaWithCommas(monthlyContribution))}
                  onFocus={(e) => e.target.select()}
                  style={{ ...inputStyle, flex: 1, width: 0, border: "none", borderRadius: 0, padding: "4px 6px", fontSize: 11 }}
                />
                <div style={{ display: "flex", flexDirection: "column", width: 20, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                  <button type="button" aria-label="+1k" onClick={() => { const n = Math.max(0, parseFormula(monthlyContribution) || 0); setMonthlyContribution(Math.floor(n + (n > 100000 ? 5000 : 1000)).toLocaleString("zh-TW")); }} style={{ flex: 1, minHeight: 12, padding: 0, border: "none", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 9 }}>▲</button>
                  <button type="button" aria-label="-1k" onClick={() => { const n = Math.max(0, parseFormula(monthlyContribution) || 0); setMonthlyContribution(Math.floor(Math.max(0, n - (n > 100000 ? 5000 : 1000))).toLocaleString("zh-TW")); }} style={{ flex: 1, minHeight: 12, padding: 0, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 9 }}>▼</button>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>額外</span>
              <div style={{ display: "flex", alignItems: "stretch", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.4)", width: 64 }}>
                <input
                  type="text"
                  inputMode="decimal"
                  value={monthlyExtra}
                  onChange={(e) => setMonthlyExtra(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    setMonthlyExtra(commitFormulaWithCommas(monthlyExtra));
                    (e.target as HTMLInputElement).blur();
                  }}
                  onBlur={() => setMonthlyExtra(commitFormulaWithCommas(monthlyExtra))}
                  onFocus={(e) => e.target.select()}
                  style={{ ...inputStyle, flex: 1, width: 0, border: "none", borderRadius: 0, padding: "4px 6px", fontSize: 11 }}
                />
                <div style={{ display: "flex", flexDirection: "column", width: 20, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                  <button type="button" aria-label="+1k" onClick={() => { const n = Math.max(0, parseFormula(monthlyExtra) || 0); setMonthlyExtra(Math.floor(n + (n > 100000 ? 5000 : 1000)).toLocaleString("zh-TW")); }} style={{ flex: 1, minHeight: 12, padding: 0, border: "none", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 9 }}>▲</button>
                  <button type="button" aria-label="-1k" onClick={() => { const n = Math.max(0, parseFormula(monthlyExtra) || 0); setMonthlyExtra(Math.floor(Math.max(0, n - (n > 100000 ? 5000 : 1000))).toLocaleString("zh-TW")); }} style={{ flex: 1, minHeight: 12, padding: 0, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 9 }}>▼</button>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>建議</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#f5c451" }}>{requiredMonthlyToAchieveInYears != null ? `${requiredMonthlyToAchieveInYears.toLocaleString("zh-TW")}` : "—"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>目標</span>
              <div style={{ display: "flex", alignItems: "stretch", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.4)", width: 90 }}>
                <input
                  type="text"
                  inputMode="decimal"
                  value={targetQuarterIncome}
                  onChange={(e) => setTargetQuarterIncome(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    setTargetQuarterIncome(commitFormulaWithCommas(targetQuarterIncome));
                    (e.target as HTMLInputElement).blur();
                  }}
                  onBlur={() => setTargetQuarterIncome(commitFormulaWithCommas(targetQuarterIncome))}
                  onFocus={(e) => e.target.select()}
                  style={{ ...inputStyle, flex: 1, width: 0, border: "none", borderRadius: 0, padding: "4px 6px", fontSize: 11 }}
                />
                <div style={{ display: "flex", flexDirection: "column", width: 18, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                  <button
                    type="button"
                    aria-label="目標+"
                    onClick={() => {
                      const n = Math.max(0, parseFormula(targetQuarterIncome) || 0);
                      const step = n > 100000 ? 10000 : 5000;
                      setTargetQuarterIncome(Math.floor(n + step).toLocaleString("zh-TW"));
                    }}
                    style={{ flex: 1, minHeight: 12, padding: 0, border: "none", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 8 }}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label="目標-"
                    onClick={() => {
                      const n = Math.max(0, parseFormula(targetQuarterIncome) || 0);
                      const step = n > 100000 ? 10000 : 5000;
                      setTargetQuarterIncome(Math.floor(Math.max(0, n - step)).toLocaleString("zh-TW"));
                    }}
                    style={{ flex: 1, minHeight: 12, padding: 0, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 8 }}
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>達成年</span>
              <div style={{ display: "flex", alignItems: "stretch", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.4)", width: 66 }}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={targetYearsToAchieve}
                  onChange={(e) => setTargetYearsToAchieve(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    setTargetYearsToAchieve(commitFormula(targetYearsToAchieve));
                    (e.target as HTMLInputElement).blur();
                  }}
                  onBlur={() => setTargetYearsToAchieve(commitFormula(targetYearsToAchieve))}
                  onFocus={(e) => e.target.select()}
                  style={{ ...inputStyle, flex: 1, width: 0, border: "none", borderRadius: 0, padding: "4px 6px", fontSize: 11, textAlign: "center" }}
                />
                <div style={{ display: "flex", flexDirection: "column", width: 18, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                  <button
                    type="button"
                    aria-label="達成年+1"
                    onClick={() => {
                      const n = Math.max(0, Math.round(parseFormula(targetYearsToAchieve) || 0));
                      setTargetYearsToAchieve(String(Math.min(99, n + 1)));
                    }}
                    style={{ flex: 1, minHeight: 12, padding: 0, border: "none", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 8 }}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label="達成年-1"
                    onClick={() => {
                      const n = Math.max(0, Math.round(parseFormula(targetYearsToAchieve) || 0));
                      setTargetYearsToAchieve(String(Math.max(0, n - 1)));
                    }}
                    style={{ flex: 1, minHeight: 12, padding: 0, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 8 }}
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "nowrap", justifyContent: "flex-start", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>ETF</span>
                <input type="text" placeholder="篩選" maxLength={5} value={etfCodeFilter} title={`輸入 1–5 碼縮小清單；刪空可顯示全部 ${TICKER_PRESETS.length} 檔`} onChange={(e) => handleEtfCodeChange(e.target.value)} style={{ ...inputStyle, width: 52, padding: "4px 6px", fontSize: 11 }} />
                <select value={selectedEtf} onChange={(e) => selectEtfFromMenu(e.target.value)} style={{ ...inputStyle, padding: "4px 6px", fontSize: 11, minWidth: 110, height: 26 }}>
                  <option value="none">自訂</option>
                  {filteredEtfs.map((etf) => <option key={etf.id} value={etf.id}>{formatEtfOptionLabelCompact(etf)}</option>)}
                </select>
              </div>
              <label className="tax-sticky-desktop-only" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#d1d5db", cursor: "pointer", whiteSpace: "nowrap", marginLeft: 36 }}>
                <input type="checkbox" checked={applyTaxInTable} onChange={(e) => setApplyTaxInTable(e.target.checked)} style={{ cursor: "pointer" }} />
                <span>稅金</span>
              </label>
              {taxSettingsMode === "manual" ? (
                <label className="tax-sticky-mobile-only" style={{ alignItems: "center", gap: 4, fontSize: 11, color: "#d1d5db", cursor: "pointer", whiteSpace: "nowrap", marginLeft: 36 }}>
                  <input type="checkbox" checked={applyTaxInTable} onChange={(e) => setApplyTaxInTable(e.target.checked)} style={{ cursor: "pointer" }} />
                  <span>稅金</span>
                </label>
              ) : (
                <span className="tax-sticky-mobile-only" style={{ fontSize: 11, color: "#6ee7b7", whiteSpace: "nowrap", marginLeft: 36 }}>稅金（自動）</span>
              )}
            </div>
            </div>
            {/* 第二行：不換行；手機可左右滑 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "nowrap",
                paddingBottom: 4,
                width: "max-content",
              }}
            >
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>年化%</span>
              <div style={{ display: "flex", alignItems: "stretch", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.4)", width: 72 }}>
                <input
                  type="number"
                  min={0}
                  step={0.2}
                  value={annualReturnRate === 0 ? "" : annualReturnRate}
                  onChange={(e) => {
                    const v = e.target.value;
                    setAnnualReturnRate(v === "" ? 0 : Number(v) || 0);
                    setRateSource("annual");
                  }}
                  style={{ ...inputStyle, flex: 1, width: 0, border: "none", borderRadius: 0, padding: "4px 6px", fontSize: 11, textAlign: "center", opacity: rateSource === "dividend" && (dividendYieldPct !== "" || stockDividendPct !== "") ? 0.6 : 1 }}
                />
                <div style={{ display: "flex", flexDirection: "column", width: 20, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                  <button
                    type="button"
                    aria-label="年化+0.2"
                    onClick={() => {
                      const step = 0.2;
                      const next = Math.max(0, Number((annualReturnRate + step).toFixed(1)));
                      setAnnualReturnRate(next);
                      setRateSource("annual");
                    }}
                    style={{ flex: 1, minHeight: 12, padding: 0, border: "none", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 9 }}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label="年化-0.2"
                    onClick={() => {
                      const step = 0.2;
                      const next = Math.max(0, Number((annualReturnRate - step).toFixed(1)));
                      setAnnualReturnRate(next);
                      setRateSource("annual");
                    }}
                    style={{ flex: 1, minHeight: 12, padding: 0, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 9 }}
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>股息%</span>
              <div style={{ display: "flex", alignItems: "stretch", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.4)", width: 64 }}>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={dividendYieldPct === "" ? "" : dividendYieldPct}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDividendYieldPct(v === "" ? "" : Number(v) || 0);
                    setRateSource("dividend");
                  }}
                  style={{ ...inputStyle, flex: 1, width: 0, border: "none", borderRadius: 0, padding: "4px 6px", fontSize: 11, textAlign: "center" }}
                />
                <div style={{ display: "flex", flexDirection: "column", width: 20, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                  <button
                    type="button"
                    aria-label="股息+0.1"
                    onClick={() => {
                      const cur = dividendYieldPct === "" ? 0 : Number(dividendYieldPct) || 0;
                      setDividendYieldPct(Number((Math.max(0, cur + 0.1)).toFixed(1)));
                      setRateSource("dividend");
                    }}
                    style={{ flex: 1, minHeight: 12, padding: 0, border: "none", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 9 }}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label="股息-0.1"
                    onClick={() => {
                      const cur = dividendYieldPct === "" ? 0 : Number(dividendYieldPct) || 0;
                      setDividendYieldPct(Number((Math.max(0, cur - 0.1)).toFixed(1)));
                      setRateSource("dividend");
                    }}
                    style={{ flex: 1, minHeight: 12, padding: 0, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 9 }}
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>股利%</span>
              <div style={{ display: "flex", alignItems: "stretch", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.4)", width: 64 }}>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={stockDividendPct === "" ? "" : stockDividendPct}
                  onChange={(e) => {
                    const v = e.target.value;
                    setStockDividendPct(v === "" ? "" : Number(v) || 0);
                    setRateSource("dividend");
                  }}
                  style={{ ...inputStyle, flex: 1, width: 0, border: "none", borderRadius: 0, padding: "4px 6px", fontSize: 11, textAlign: "center" }}
                />
                <div style={{ display: "flex", flexDirection: "column", width: 20, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                  <button
                    type="button"
                    aria-label="股利+0.1"
                    onClick={() => {
                      const cur = stockDividendPct === "" ? 0 : Number(stockDividendPct) || 0;
                      setStockDividendPct(Number((Math.max(0, cur + 0.1)).toFixed(1)));
                      setRateSource("dividend");
                    }}
                    style={{ flex: 1, minHeight: 12, padding: 0, border: "none", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 9 }}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label="股利-0.1"
                    onClick={() => {
                      const cur = stockDividendPct === "" ? 0 : Number(stockDividendPct) || 0;
                      setStockDividendPct(Number((Math.max(0, cur - 0.1)).toFixed(1)));
                      setRateSource("dividend");
                    }}
                    style={{ flex: 1, minHeight: 12, padding: 0, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 9 }}
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>頻率</span>
              <select value={payoutFrequency} onChange={(e) => handlePayoutFrequencyChange(e.target.value as PayoutFrequency)} style={{ ...inputStyle, padding: "4px 6px", fontSize: 11, height: 26, minWidth: 64 }}>
                <option value="month">月</option>
                <option value="quarter">季</option>
                <option value="semiannual">半年</option>
                <option value="year">年</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>起始</span>
              <div style={{ display: "flex", alignItems: "stretch", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.4)" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={initialYearStr}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    if (v === "" || (v.length <= 4 && parseInt(v, 10) <= 2100)) setInitialYearStr(v);
                  }}
                  onBlur={() => {
                    const n = parseInt(initialYearStr, 10);
                    if (!Number.isFinite(n) || n < 2000) setInitialYearStr(String(defaultYear));
                    else if (n > 2100) setInitialYearStr("2100");
                  }}
                  style={{ ...inputStyle, width: 46, height: 24, padding: "4px 6px", fontSize: 11, textAlign: "center", border: "none", borderRadius: 0 }}
                />
                <div style={{ display: "flex", flexDirection: "column", width: 18, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                  <button type="button" aria-label="年+1" onClick={() => setInitialYearStr(String(Math.min(2100, initialYear + 1)))} style={{ flex: 1, minHeight: 10, padding: 0, border: "none", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 8 }}>▲</button>
                  <button type="button" aria-label="年-1" onClick={() => setInitialYearStr(String(Math.max(2000, initialYear - 1)))} style={{ flex: 1, minHeight: 10, padding: 0, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 8 }}>▼</button>
                </div>
              </div>
              <span style={{ fontSize: 10, color: "#9ca3af" }}>年</span>
              <div style={{ display: "flex", alignItems: "stretch", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.4)" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={initialMonthStr}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    if (v === "" || v.length <= 2) setInitialMonthStr(v);
                  }}
                  onBlur={() => {
                    const n = parseInt(initialMonthStr, 10);
                    if (!Number.isFinite(n) || n < 1) setInitialMonthStr(String(defaultMonth));
                    else if (n > 12) setInitialMonthStr("12");
                  }}
                  style={{ ...inputStyle, width: 34, height: 24, padding: "4px 6px", fontSize: 11, textAlign: "center", border: "none", borderRadius: 0 }}
                />
                <div style={{ display: "flex", flexDirection: "column", width: 18, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                  <button
                    type="button"
                    aria-label="月+1"
                    onClick={() => {
                      if (initialMonth >= 12) {
                        setInitialMonthStr("1");
                        setInitialYearStr(String(Math.min(2100, initialYear + 1)));
                      } else {
                        setInitialMonthStr(String(initialMonth + 1));
                      }
                    }}
                    style={{ flex: 1, minHeight: 10, padding: 0, border: "none", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 8 }}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label="月-1"
                    onClick={() => {
                      if (initialMonth <= 1) {
                        setInitialMonthStr("12");
                        setInitialYearStr(String(Math.max(2000, initialYear - 1)));
                      } else {
                        setInitialMonthStr(String(initialMonth - 1));
                      }
                    }}
                    style={{ flex: 1, minHeight: 10, padding: 0, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 8 }}
                  >
                    ▼
                  </button>
                </div>
              </div>
              <span style={{ fontSize: 10, color: "#9ca3af" }}>月</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>第幾次</span>
              <div style={{ display: "flex", alignItems: "stretch", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.4)", width: 48 }}>
                <input type="text" inputMode="numeric" value={nthPeriod} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); if (v === "") setNthPeriod(1); else { const n = parseInt(v, 10); if (Number.isFinite(n)) setNthPeriod(Math.max(1, Math.min(maxNthPeriod, n))); } }} style={{ ...inputStyle, flex: 1, width: 0, border: "none", borderRadius: 0, padding: "4px 6px", fontSize: 11, textAlign: "center" }} />
                <div style={{ display: "flex", flexDirection: "column", width: 18, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                  <button type="button" onClick={() => setNthPeriod(Math.min(maxNthPeriod, nthPeriod + 1))} style={{ flex: 1, minHeight: 10, padding: 0, border: "none", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 8 }}>▲</button>
                  <button type="button" onClick={() => setNthPeriod(Math.max(1, nthPeriod - 1))} style={{ flex: 1, minHeight: 10, padding: 0, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 8 }}>▼</button>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "nowrap" }}>
              <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>預設</span>
              <div style={{ display: "flex", alignItems: "stretch", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.4)" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={defaultYearStr}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    if (v === "" || (v.length <= 4 && parseInt(v, 10) <= 2100)) setDefaultYearStr(v);
                  }}
                  onBlur={() => {
                    const n = parseInt(defaultYearStr, 10);
                    if (!Number.isFinite(n) || n < 2000) setDefaultYearStr(String(DEFAULT_SIM_START_YEAR));
                    else if (n > 2100) setDefaultYearStr("2100");
                  }}
                  style={{ ...inputStyle, width: 46, height: 24, padding: "4px 6px", fontSize: 11, textAlign: "center", border: "none", borderRadius: 0 }}
                />
                <div style={{ display: "flex", flexDirection: "column", width: 18, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                  <button type="button" aria-label="年+1" onClick={() => setDefaultYearStr(String(Math.min(2100, defaultYear + 1)))} style={{ flex: 1, minHeight: 10, padding: 0, border: "none", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 8 }}>▲</button>
                  <button type="button" aria-label="年-1" onClick={() => setDefaultYearStr(String(Math.max(2000, defaultYear - 1)))} style={{ flex: 1, minHeight: 10, padding: 0, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 8 }}>▼</button>
                </div>
              </div>
              <span style={{ fontSize: 10, color: "#9ca3af" }}>年</span>
              <div style={{ display: "flex", alignItems: "stretch", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.4)" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={defaultMonthStr}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    if (v === "" || v.length <= 2) setDefaultMonthStr(v);
                  }}
                  onBlur={() => {
                    const n = parseInt(defaultMonthStr, 10);
                    if (!Number.isFinite(n) || n < 1) setDefaultMonthStr(String(DEFAULT_SIM_START_MONTH));
                    else if (n > 12) setDefaultMonthStr("12");
                  }}
                  style={{ ...inputStyle, width: 34, height: 24, padding: "4px 6px", fontSize: 11, textAlign: "center", border: "none", borderRadius: 0 }}
                />
                <div style={{ display: "flex", flexDirection: "column", width: 18, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                  <button
                    type="button"
                    aria-label="月+1"
                    onClick={() => {
                      if (defaultMonth >= 12) {
                        setDefaultMonthStr("1");
                        setDefaultYearStr(String(Math.min(2100, defaultYear + 1)));
                      } else {
                        setDefaultMonthStr(String(defaultMonth + 1));
                      }
                    }}
                    style={{ flex: 1, minHeight: 10, padding: 0, border: "none", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 8 }}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label="月-1"
                    onClick={() => {
                      if (defaultMonth <= 1) {
                        setDefaultMonthStr("12");
                        setDefaultYearStr(String(Math.max(2000, defaultYear - 1)));
                      } else {
                        setDefaultMonthStr(String(defaultMonth - 1));
                      }
                    }}
                    style={{ flex: 1, minHeight: 10, padding: 0, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 8 }}
                  >
                    ▼
                  </button>
                </div>
              </div>
              <span style={{ fontSize: 10, color: "#9ca3af" }}>月</span>
              <button type="button" onClick={() => { const d = new Date(); setInitialYearStr(String(d.getFullYear())); setInitialMonthStr(String(d.getMonth() + 1)); }} style={{ padding: "4px 8px", fontSize: 10, borderRadius: 6, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "#e5e7eb", cursor: "pointer", flexShrink: 0 }}>恢復</button>
              <label className="tax-sticky-desktop-only" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#d1d5db", cursor: "pointer", whiteSpace: "nowrap" }}>
                <input type="checkbox" checked={applyNhi2InTable} onChange={(e) => setApplyNhi2InTable(e.target.checked)} style={{ cursor: "pointer" }} />
                <span>二代健保</span>
              </label>
              {taxSettingsMode === "manual" ? (
                <label className="tax-sticky-mobile-only" style={{ alignItems: "center", gap: 4, fontSize: 11, color: "#d1d5db", cursor: "pointer", whiteSpace: "nowrap" }}>
                  <input type="checkbox" checked={applyNhi2InTable} onChange={(e) => setApplyNhi2InTable(e.target.checked)} style={{ cursor: "pointer" }} />
                  <span>二代健保</span>
                </label>
              ) : (
                <span className="tax-sticky-mobile-only" style={{ fontSize: 11, color: "#6ee7b7", whiteSpace: "nowrap" }}>二代（自動）</span>
              )}
            </div>
            </div>
          </div>
        </div>
        {/* 約定：收回＝▲ 打開＝▼。只在橫幅顯示時渲染收回鈕，隱藏時不露▲在畫面上方 */}
        {showStickyBar && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setStickyBarVisible(false); setStickyBarPinned(false); }}
            title="收回"
            style={{
              position: "absolute",
              bottom: -10,
              right: 16,
              width: 24,
              height: 14,
              padding: 0,
              border: "none",
              borderTop: "none",
              borderRadius: "0 0 6px 6px",
              background: "rgba(22,26,52,0.98)",
              color: "#9ca3af",
              fontSize: 10,
              lineHeight: 1,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              zIndex: 1001,
              outline: "none",
            }}
            aria-label="收回橫幅"
          >
            ▲
          </button>
        )}
      </div>

      {/* 約定：收回＝▲ 打開＝▼。收回後：右上角顯示 ▼ 按鈕，點擊往下展開橫幅，Portal 僅在 clientMounted 後渲染避免 Hydration 錯誤 */}
      {clientMounted &&
        !showStickyBar &&
        createPortal(
          <button
            type="button"
            onClick={() => {
              setStickyBarVisible(true);
              setStickyBarPinned(true);
            }}
            title="打開參數橫幅（▼ 往下展開）"
            style={{
              position: "fixed",
              top: 0,
              right: 16,
              width: 36,
              height: 22,
              padding: 0,
              border: "none",
              borderTop: "none",
              borderRadius: "0 0 6px 6px",
              background: "rgba(22,26,52,0.98)",
              color: "#9ca3af",
              fontSize: 14,
              lineHeight: 1,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              zIndex: 2147483647,
              outline: "none",
            }}
            aria-label="打開橫幅"
          >
            ▼
          </button>,
          document.body
        )}

      <div style={{ width: "100%", maxWidth: 1600, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
        <div id="desktop-app-view">
        {/* 1️⃣ HERO HEADER */}
        <header
          style={{
            ...cardStyle,
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            alignItems: "flex-start",
            gap: 24,
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: "#39ff14", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>
              WEALTH FREEDOM
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#e5e7eb", margin: 0 }}>
              財富自由計算機
            </h1>
            <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 8, marginBottom: 0 }}>
              月領 {targetQuarterIncomeNum.toLocaleString("zh-TW")}，不是夢，是複利紀律。
            </p>
            {showHomeHeroFirstLink && homeHeroFirstEntry ? (
              <p style={{ marginTop: 10, marginBottom: 0 }}>
                <Link
                  href={blogPostPath(HOME_HERO_FIRST_SLUG)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12,
                    color: "#6ee7b7",
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                    transition: "none",
                  }}
                >
                  {homeHeroFirstEntry.homeHeroLabel ?? homeHeroFirstEntry.listTitle}
                </Link>
              </p>
            ) : null}
          </div>
          <div style={{ padding: "10px 0", background: "transparent", fontSize: 12, color: "#6b7280", lineHeight: 1.85 }}>
            <p style={{ margin: "0 0 6px 0" }}>◆ 月領 50,000 不是夢。年化 7%～10% 情境下，最快約 15 年可達成。</p>
            <p style={{ margin: "0 0 6px 0" }}>◆ 不是 3 年翻倍，而是長期複利。</p>
            <p style={{ margin: 0 }}>◆ 模擬每月投入與股利再投入，提早達到屬於你的退休生活，用數據畫出財富自由時間表。</p>
          </div>
          <div style={{ textAlign: "right", minWidth: 200 }}>
            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>FIRE ETA</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#39ff14" }}>只需{fireEtaStr}</div>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 4 }}>目標 {targetQuarterIncomeNum.toLocaleString("zh-TW")} 元/月 · 達成率 {achievementPercent}%</div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, achievementPercent)}%`, height: "100%", background: "#39ff14", borderRadius: 3 }} />
              </div>
            </div>
          </div>
        </header>

        {/* 2️⃣ MAIN KPI CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          <div
            style={{
              padding: 20,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(15,23,42,0.7)",
              backgroundImage: "linear-gradient(to top, rgba(57,255,20,0.08) 0%, transparent 40%), radial-gradient(circle at 20% 88%, rgba(255,255,255,0.04) 0%, transparent 5%), radial-gradient(circle at 80% 92%, rgba(57,255,20,0.05) 0%, transparent 6%)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 -2px 16px 2px rgba(57,255,20,0.12)",
              borderBottom: "2px solid rgba(57,255,20,0.35)",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>預計達成年數</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#e5e7eb" }}>
              {fireEtaStr}
            </div>
          </div>
          <div
            style={{
              padding: 20,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(15,23,42,0.7)",
              backgroundImage: "linear-gradient(to top, rgba(57,255,20,0.08) 0%, transparent 40%), radial-gradient(circle at 20% 88%, rgba(255,255,255,0.04) 0%, transparent 5%), radial-gradient(circle at 80% 92%, rgba(57,255,20,0.05) 0%, transparent 6%)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 -2px 16px 2px rgba(57,255,20,0.12)",
              borderBottom: "2px solid rgba(57,255,20,0.35)",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>模擬期末資產</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#39ff14" }}>
              {Math.round(simulationAtTargetYears.finalBalance).toLocaleString("zh-TW")} 元
            </div>
          </div>
          <div
            style={{
              padding: 20,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(15,23,42,0.7)",
              backgroundImage: "linear-gradient(to top, rgba(57,255,20,0.08) 0%, transparent 40%), radial-gradient(circle at 20% 88%, rgba(255,255,255,0.04) 0%, transparent 5%), radial-gradient(circle at 80% 92%, rgba(57,255,20,0.05) 0%, transparent 6%)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 -2px 16px 2px rgba(57,255,20,0.12)",
              borderBottom: "2px solid rgba(57,255,20,0.35)",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>累積股利</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#f5c451" }}>
              {Math.round(simulationAtTargetYears.totalDividends).toLocaleString("zh-TW")} 元
            </div>
          </div>
        </div>

        {/* 3️⃣ GOAL SETTING CARD - 滾超過此區才顯示懸停橫幅（建議每月投入／達成所需資產／目標月領拉桿） */}
        <div id="desktop-goal-setting" ref={(el) => { goalSettingCardRef.current = el; }} style={{ ...cardStyle }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, color: "#e5e7eb", margin: 0 }}>目標設定</h2>

            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
              <div>
                <label style={{ fontSize: 14, color: "#d1d5db", display: "block", marginBottom: 6 }}>目標月領多少 (TWD)</label>
                <div style={{ display: "flex", alignItems: "stretch", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.35)", width: 96 }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    min={0}
                    value={targetQuarterIncome}
                    onChange={(e) => setTargetQuarterIncome(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setTargetQuarterIncome(commitFormulaWithCommas(targetQuarterIncome)); (e.target as HTMLInputElement).blur(); } }}
                    onFocus={(e) => e.target.select()}
                    style={{
                      ...inputStyle,
                      flex: 1,
                      width: 0,
                      border: "none",
                      borderRadius: 0,
                      padding: "6px 8px",
                      fontSize: 11,
                      backgroundColor: "transparent",
                    }}
                    placeholder="50,000"
                  />
                  <div style={{ display: "flex", flexDirection: "column", width: 26, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.12)" }}>
                    <button type="button" aria-label="增加" onClick={() => { const n = Math.max(0, parseFormula(targetQuarterIncome) || 0); const step = n > 100000 ? 5000 : 1000; setTargetQuarterIncome(Math.floor(n + step).toLocaleString("zh-TW")); }} style={{ flex: 1, minHeight: 14, padding: 0, border: "none", background: "rgba(255,255,255,0.08)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}>▲</button>
                    <button type="button" aria-label="減少" onClick={() => { const n = Math.max(0, parseFormula(targetQuarterIncome) || 0); const step = n > 100000 ? 5000 : 1000; setTargetQuarterIncome(Math.floor(Math.max(0, n - step)).toLocaleString("zh-TW")); }} style={{ flex: 1, minHeight: 14, padding: 0, border: "none", borderTop: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.08)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}>▼</button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                title="月領 50,000"
                onClick={() => { setTargetQuarterIncome("50000"); handlePayoutFrequencyChange("month"); setTargetYearsToAchieve("20"); }}
                style={{ fontSize: 11, padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(245,196,81,0.5)", background: "rgba(245,196,81,0.12)", color: "#f5c451", cursor: "pointer", whiteSpace: "nowrap", marginBottom: 2 }}
              >
                財富自由預設值
              </button>
              <div style={{ marginLeft: 20, display: "flex", flexDirection: "column" }}>
                <label style={{ fontSize: 14, color: "#d1d5db", display: "block", marginBottom: 6 }}>預計達成年數</label>
                <div style={{ display: "flex", alignItems: "stretch", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.35)", width: 56 }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="15"
                    value={targetYearsToAchieve}
                    onChange={(e) => setTargetYearsToAchieve(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setTargetYearsToAchieve(commitFormula(targetYearsToAchieve)); (e.target as HTMLInputElement).blur(); } }}
                    onFocus={(e) => e.target.select()}
                    style={{
                      ...inputStyle,
                      flex: 1,
                      width: 0,
                      height: 28,
                      boxSizing: "border-box",
                      padding: "6px 8px",
                      borderRadius: 0,
                      border: "none",
                      fontSize: 12,
                      backgroundColor: "transparent",
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", width: 24, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.12)" }}>
                    <button type="button" aria-label="增加一年" onClick={() => { const n = Math.max(0, Math.round(parseFormula(targetYearsToAchieve) || 0)); setTargetYearsToAchieve(String(n + 1)); }} style={{ flex: 1, minHeight: 14, padding: 0, border: "none", background: "rgba(255,255,255,0.08)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}>▲</button>
                    <button type="button" aria-label="減少一年" onClick={() => { const n = Math.max(0, Math.round(parseFormula(targetYearsToAchieve) || 0)); setTargetYearsToAchieve(String(Math.max(0, n - 1))); }} style={{ flex: 1, minHeight: 14, padding: 0, border: "none", borderTop: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.08)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}>▼</button>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 14, color: "#d1d5db", display: "block", marginBottom: 6 }}>領息頻率</span>
                <div style={{ display: "flex", gap: 0, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)", width: "fit-content", height: 28, boxSizing: "border-box" }}>
                  {(["month", "quarter", "semiannual", "year"] as const).map((v) => (
                    <label
                      key={v}
                      style={{
                        padding: "6px 8px",
                        fontSize: 12,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        background: payoutFrequency === v ? "rgba(57,255,20,0.25)" : "rgba(0,0,0,0.2)",
                        color: payoutFrequency === v ? "#39ff14" : "#9ca3af",
                        borderRight: v !== "year" ? "1px solid rgba(255,255,255,0.08)" : "none",
                        fontWeight: payoutFrequency === v ? 600 : 400,
                      }}
                    >
                      <input type="radio" name="payoutFreq" checked={payoutFrequency === v} onChange={() => handlePayoutFrequencyChange(v)} style={{ display: "none" }} />
                      {v === "month" ? "月" : v === "quarter" ? "季" : v === "semiannual" ? "半年" : "年"}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "stretch" }}>
              {/* 左欄：建議每月投入 */}
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(245,196,81,0.18) 0%, rgba(245,196,81,0.08) 100%)",
                  borderRadius: 12,
                  border: "1px solid rgba(245,196,81,0.4)",
                  padding: "14px 18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  boxShadow: "0 0 20px rgba(245,196,81,0.1)",
                }}
              >
                <span style={{ fontSize: 14, color: "#d1d5db" }}>建議每月投入</span>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#f5c451", marginTop: 6 }}>
                  {requiredMonthlyToAchieveInYears != null ? `${requiredMonthlyToAchieveInYears.toLocaleString("zh-TW")} 元` : "—"}
                </div>
              </div>
              {/* 右欄：達成所需資產 */}
              <div style={{ background: "rgba(0,0,0,0.35)", borderRadius: 12, border: "1px solid rgba(57,255,20,0.25)", padding: "14px 18px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <span style={{ fontSize: 14, color: "#d1d5db" }}>達成所需資產</span>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#39ff14", marginTop: 6 }}>
                  {requiredAssetsForTarget != null ? `${requiredAssetsForTarget.toLocaleString("zh-TW")} 元` : "—"}
                </div>
              </div>
            </div>
            {/* 目標月領拉條：可輸入也可拉桿調整，與上方「目標月領多少」同步 */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 14, color: "#d1d5db", marginBottom: 8 }}>目標月領（拉桿可調，上限 20 萬）</div>
              <input
                type="range"
                min={0}
                max={200000}
                step={5000}
                value={Math.min(200000, Math.max(0, targetQuarterIncomeNum))}
                onChange={(e) => setTargetQuarterIncome(e.target.value)}
                style={{ width: "100%", accentColor: "#f5c451" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                <span>0 元/月</span>
                <span>{targetQuarterIncomeNum.toLocaleString("zh-TW")} 元/月</span>
                <span>200,000 元/月</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: -8, marginBottom: 8 }}>
          ・複利以年化 {effectiveAnnualRate}% ・每月投入 {monthlyContributionNum.toLocaleString("zh-TW")} ・額外加碼 {monthlyExtraNum.toLocaleString("zh-TW")} ・{reinvestRatio}% 再投入 ・含買入手續費 0.1425%（最低 20 元）
        </div>

        {/* 4️⃣ INVESTMENT PARAMETER SETTINGS */}
          <div id="desktop-stock-params" style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <h2 style={{ fontSize: 24, fontWeight: 600, color: "#e5e7eb", margin: 0 }}>
                存股參數設定
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setSaveTargetModalOpen(true)}
                  style={{
                    display: "inline-flex",
                    width: "fit-content",
                    boxSizing: "border-box",
                    fontSize: 11,
                    padding: "6px 10px",
                    border: "1px solid rgba(192, 132, 252, 0.55)",
                    borderRadius: 8,
                    background: "rgba(0, 0, 0, 0.2)",
                    fontWeight: 600,
                    color: "#c084fc",
                    cursor: "pointer",
                  }}
                >
                  加入標的
                </button>
                <button
                  type="button"
                  onClick={() => setLoadTargetModalOpen(true)}
                  style={{
                    display: "inline-flex",
                    width: "fit-content",
                    boxSizing: "border-box",
                    fontSize: 11,
                    padding: "6px 10px",
                    border: "1px solid rgba(96, 165, 250, 0.55)",
                    borderRadius: 8,
                    background: "rgba(0, 0, 0, 0.2)",
                    fontWeight: 600,
                    color: "#60a5fa",
                    cursor: "pointer",
                  }}
                >
                  使用我的標的
                </button>
                <button
                  type="button"
                  onClick={restoreStockParamsDefaults}
                  style={{
                    display: "inline-flex",
                    width: "fit-content",
                    boxSizing: "border-box",
                    fontSize: 11,
                    padding: "6px 10px",
                    border: "1px solid rgba(57, 255, 20, 0.5)",
                    borderRadius: 8,
                    background: "rgba(0, 0, 0, 0.2)",
                    fontWeight: 600,
                    color: "#39ff14",
                    cursor: "pointer",
                  }}
                >
                  恢復預設值
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* 一、投入金額相關：同一行三欄 */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <label style={{ fontSize: 12, color: "#d1d5db" }}>當前本金 (TWD)</label>
                  <div style={{ display: "flex", alignItems: "stretch", borderRadius: 10, border: "1px solid rgba(57,255,20,0.4)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.4)" }}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={currentPrincipalStr}
                      onChange={(e) => setCurrentPrincipalStr(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setCurrentPrincipalStr(commitFormulaWithCommas(currentPrincipalStr)); (e.target as HTMLInputElement).blur(); } }}
                      onBlur={() => setCurrentPrincipalStr(commitFormulaWithCommas(currentPrincipalStr))}
                      onFocus={(e) => e.target.select()}
                      style={{ ...inputStyle, flex: 1, border: "none", borderRadius: 0, color: "#39ff14", fontWeight: 600 }}
                      placeholder="例如：200000 或 100000+50000"
                    />
                    <div style={{ display: "flex", flexDirection: "column", width: 28, flexShrink: 0, borderLeft: "1px solid rgba(57,255,20,0.3)" }}>
                      <button
                        type="button"
                        aria-label="增加 1000 或 5000"
                        onClick={() => {
                          const n = Math.max(0, parseFormula(currentPrincipalStr) || 0);
                          const step = n > 100000 ? 5000 : 1000;
                          setCurrentPrincipalStr(Math.floor(n + step).toLocaleString("zh-TW"));
                        }}
                        style={{ flex: 1, minHeight: 16, padding: 0, border: "none", background: "rgba(57,255,20,0.15)", color: "#39ff14", cursor: "pointer", fontSize: 10 }}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        aria-label="減少 1000 或 5000"
                        onClick={() => {
                          const n = Math.max(0, parseFormula(currentPrincipalStr) || 0);
                          const step = n > 100000 ? 5000 : 1000;
                          setCurrentPrincipalStr(Math.floor(Math.max(0, n - step)).toLocaleString("zh-TW"));
                        }}
                        style={{ flex: 1, minHeight: 16, padding: 0, border: "none", borderTop: "1px solid rgba(57,255,20,0.3)", background: "rgba(57,255,20,0.15)", color: "#39ff14", cursor: "pointer", fontSize: 10 }}
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>可手動覆蓋，預設依起始本金＋第幾次投入累積計算</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <label style={{ fontSize: 12, color: "#d1d5db" }}>每月固定投入額 (TWD)</label>
                  <div style={{ display: "flex", alignItems: "stretch", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.4)" }}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={monthlyContribution}
                      onChange={(e) => setMonthlyContribution(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setMonthlyContribution(commitFormulaWithCommas(monthlyContribution)); (e.target as HTMLInputElement).blur(); } }}
                      onFocus={(e) => e.target.select()}
                      style={{ ...inputStyle, flex: 1, border: "none", borderRadius: 0 }}
                      placeholder="例如：12000 或 4000+8000"
                    />
                    <div style={{ display: "flex", flexDirection: "column", width: 28, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                      <button type="button" aria-label="增加" onClick={() => { const n = Math.max(0, parseFormula(monthlyContribution) || 0); const step = n > 100000 ? 5000 : 1000; setMonthlyContribution(Math.floor(n + step).toLocaleString("zh-TW")); }} style={{ flex: 1, minHeight: 16, padding: 0, border: "none", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}>▲</button>
                      <button type="button" aria-label="減少" onClick={() => { const n = Math.max(0, parseFormula(monthlyContribution) || 0); const step = n > 100000 ? 5000 : 1000; setMonthlyContribution(Math.floor(Math.max(0, n - step)).toLocaleString("zh-TW")); }} style={{ flex: 1, minHeight: 16, padding: 0, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}>▼</button>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <label style={{ fontSize: 12, color: "#d1d5db" }}>每月額外加碼 / 加班費 (TWD)</label>
                  <div style={{ display: "flex", alignItems: "stretch", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.4)" }}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={monthlyExtra}
                      onChange={(e) => setMonthlyExtra(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setMonthlyExtra(commitFormulaWithCommas(monthlyExtra)); (e.target as HTMLInputElement).blur(); } }}
                      onFocus={(e) => e.target.select()}
                      style={{ ...inputStyle, flex: 1, border: "none", borderRadius: 0 }}
                      placeholder="例如：6000 或 3000+3000"
                    />
                    <div style={{ display: "flex", flexDirection: "column", width: 28, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                      <button type="button" aria-label="增加" onClick={() => { const n = Math.max(0, parseFormula(monthlyExtra) || 0); const step = n > 100000 ? 5000 : 1000; setMonthlyExtra(Math.floor(n + step).toLocaleString("zh-TW")); }} style={{ flex: 1, minHeight: 16, padding: 0, border: "none", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}>▲</button>
                      <button type="button" aria-label="減少" onClick={() => { const n = Math.max(0, parseFormula(monthlyExtra) || 0); const step = n > 100000 ? 5000 : 1000; setMonthlyExtra(Math.floor(Math.max(0, n - step)).toLocaleString("zh-TW")); }} style={{ flex: 1, minHeight: 16, padding: 0, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}>▼</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 二、ETF + 股利發放頻率：左側篩選輸入 + 選擇 ETF 下拉 */}
              <div style={{ display: "flex", flexDirection: "row", gap: 10, alignItems: "flex-start", width: "100%", minWidth: 0, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 0%", minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <label style={{ fontSize: 12, color: "#d1d5db", lineHeight: 1.2 }} title={`清單共 ${TICKER_PRESETS.length} 檔（ETF 與股票）；篩選僅縮小選項`}>
                    標的篩選（1–5 碼，共 {TICKER_PRESETS.length} 檔）
                  </label>
                  <input
                    type="text"
                    placeholder="例：0050、00919"
                    value={etfCodeFilter}
                    maxLength={5}
                    title={`刪空篩選可顯示全部 ${TICKER_PRESETS.length} 檔`}
                    onChange={(e) => {
                      const raw = e.target.value;
                      handleEtfCodeChange(raw);
                    }}
                    style={{ ...inputStyle, width: "100%", boxSizing: "border-box", height: 28 }}
                  />
                </div>
                <div style={{ flex: "1.2 1 0%", minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <label style={{ fontSize: 12, color: "#d1d5db", lineHeight: 1.2 }}>選擇 ETF</label>
                  <select
                    value={selectedEtf}
                    onChange={(e) => selectEtfFromMenu(e.target.value)}
                    style={{ ...inputStyle, paddingRight: 24, width: "100%", boxSizing: "border-box", minWidth: 0, height: 28 }}
                  >
                    <option value="none">不使用預設（自行輸入年化）</option>
                    {filteredEtfs.map((etf) => (
                      <option key={etf.id} value={etf.id}>{formatEtfOptionLabel(etf)}</option>
                    ))}
                  </select>
                  {selectedEtfInfo && selectedEtf !== "none" && selectedEtfInfo.dividendMonths && selectedEtfInfo.dividendMonths.length > 0 && selectedEtfInfo.frequency !== "month" && (
                    <div style={{ display: "flex", flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                      {selectedEtfInfo.dividendMonths.map((m, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", padding: "4px 10px", background: "rgba(0,0,0,0.2)", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", fontSize: 12, color: "#e5e7eb" }}>
                          {m} 月
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ flex: "0 0 140px", display: "flex", flexDirection: "column", gap: 2 }}>
                  <label style={{ fontSize: 12, color: "#d1d5db", lineHeight: 1.2 }}>股利發放頻率</label>
                  <select value={payoutFrequency} onChange={(e) => handlePayoutFrequencyChange(e.target.value as PayoutFrequency)} style={{ ...inputStyle, paddingRight: 24, width: "100%", boxSizing: "border-box", height: 28 }}>
                    <option value="month">月領</option>
                    <option value="quarter">季領</option>
                    <option value="semiannual">半年領</option>
                    <option value="year">年領</option>
                  </select>
                </div>
                <div style={{ flex: "0 0 90px", display: "flex", flexDirection: "column", gap: 2 }}>
                  <label style={{ fontSize: 12, color: "#d1d5db", lineHeight: 1.2 }}>年化報酬率 (%)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={annualReturnRate === 0 ? "" : annualReturnRate}
                    onChange={(e) => { const v = e.target.value; setAnnualReturnRate(v === "" ? 0 : Number(v) || 0); setRateSource("annual"); }}
                    onFocus={(e) => e.target.select()}
                    style={{ ...inputStyle, opacity: rateSource === "dividend" && (dividendYieldPct !== "" || stockDividendPct !== "") ? 0.6 : 1, color: rateSource === "dividend" && (dividendYieldPct !== "" || stockDividendPct !== "") ? "#9ca3af" : "#e5e7eb", height: 28 }}
                  />
                  <span style={{ fontSize: 10, color: "#6b7280" }}>7.2%≈10年翻倍</span>
                </div>
              </div>
              {/* 起始本金、初始年月、第幾次投入（可調整，分開顯示），下方顯示當期股利、固定投入、可再投入 */}
              <div style={{ display: "flex", flexDirection: "row", gap: 12, alignItems: "flex-end", flexWrap: "wrap", padding: "10px 0", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ flexShrink: 0, textAlign: "left", padding: "8px 16px", background: "rgba(0,0,0,0.25)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", alignSelf: "stretch", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>當前本金</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "#e5e7eb", letterSpacing: "0.02em" }}>
                    {Math.floor(currentPrincipalNum).toLocaleString("zh-TW")} 元
                  </div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                    {selectedEtfInfo?.price != null && selectedEtfInfo.price > 0
                      ? `約 ${Math.floor(currentPrincipalNum / selectedEtfInfo.price).toLocaleString("zh-TW")} 股`
                      : ""}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "row", gap: 12, alignItems: "flex-end", flexWrap: "wrap", flex: "1 1 auto", minWidth: 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                    <label style={{ fontSize: 12, color: "#d1d5db", lineHeight: 1.2 }}>初始年月</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "stretch", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.4)" }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={initialYearStr}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, "");
                            if (v === "" || (v.length <= 4 && parseInt(v, 10) <= 2100)) setInitialYearStr(v);
                          }}
                          onBlur={() => {
                            const n = parseInt(initialYearStr, 10);
                            if (!Number.isFinite(n) || n < 2000) setInitialYearStr(String(defaultYear));
                            else if (n > 2100) setInitialYearStr("2100");
                          }}
                          style={{ ...inputStyle, width: 72, height: 28, textAlign: "center", border: "none", borderRadius: 0 }}
                        />
                        <div style={{ display: "flex", flexDirection: "column", width: 22, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                          <button type="button" aria-label="年+1" onClick={() => setInitialYearStr(String(Math.min(2100, initialYear + 1)))} style={{ flex: 1, minHeight: 14, padding: 0, border: "none", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}>▲</button>
                          <button type="button" aria-label="年-1" onClick={() => setInitialYearStr(String(Math.max(2000, initialYear - 1)))} style={{ flex: 1, minHeight: 14, padding: 0, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}>▼</button>
                        </div>
                      </div>
                      <span style={{ fontSize: 13, color: "#9ca3af" }}>年</span>
                      <div style={{ display: "flex", alignItems: "stretch", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.4)" }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={initialMonthStr}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, "");
                            if (v === "" || v.length <= 2) setInitialMonthStr(v);
                          }}
                          onBlur={() => {
                            const n = parseInt(initialMonthStr, 10);
                            if (!Number.isFinite(n) || n < 1) setInitialMonthStr(String(defaultMonth));
                            else if (n > 12) setInitialMonthStr("12");
                          }}
                          style={{ ...inputStyle, width: 56, height: 28, textAlign: "center", border: "none", borderRadius: 0 }}
                        />
                        <div style={{ display: "flex", flexDirection: "column", width: 22, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                          <button
                            type="button"
                            aria-label="月+1"
                            onClick={() => {
                              if (initialMonth >= 12) {
                                setInitialMonthStr("1");
                                setInitialYearStr(String(Math.min(2100, initialYear + 1)));
                              } else {
                                setInitialMonthStr(String(initialMonth + 1));
                              }
                            }}
                            style={{ flex: 1, minHeight: 14, padding: 0, border: "none", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            aria-label="月-1"
                            onClick={() => {
                              if (initialMonth <= 1) {
                                setInitialMonthStr("12");
                                setInitialYearStr(String(Math.max(2000, initialYear - 1)));
                              } else {
                                setInitialMonthStr(String(initialMonth - 1));
                              }
                            }}
                            style={{ flex: 1, minHeight: 14, padding: 0, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                      <span style={{ fontSize: 13, color: "#9ca3af" }}>月</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                    <label style={{ fontSize: 12, color: "#d1d5db", lineHeight: 1.2 }}>第幾次投入</label>
                    <div style={{ display: "flex", alignItems: "stretch", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.4)" }}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={nthPeriod}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "");
                          if (v === "") setNthPeriod(1);
                          else {
                            const n = parseInt(v, 10);
                            if (Number.isFinite(n)) setNthPeriod(Math.max(1, Math.min(maxNthPeriod, n)));
                          }
                        }}
                        onBlur={() => { if (nthPeriod < 1 || nthPeriod > maxNthPeriod) setNthPeriod(Math.max(1, Math.min(maxNthPeriod, nthPeriod))); }}
                        style={{ ...inputStyle, width: 56, height: 28, textAlign: "center", border: "none", borderRadius: 0 }}
                      />
                      <div style={{ display: "flex", flexDirection: "column", width: 22, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                        <button type="button" aria-label="次+1" onClick={() => setNthPeriod(Math.min(maxNthPeriod, nthPeriod + 1))} style={{ flex: 1, minHeight: 14, padding: 0, border: "none", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}>▲</button>
                        <button type="button" aria-label="次-1" onClick={() => setNthPeriod(Math.max(1, nthPeriod - 1))} style={{ flex: 1, minHeight: 14, padding: 0, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}>▼</button>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <label style={{ fontSize: 12, color: "#d1d5db", lineHeight: 1.2 }}>對應年月</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, height: 28 }}>
                      <span style={{ fontSize: 14, color: "#e5e7eb", fontWeight: 500 }}>
                        {(() => {
                          const totalMonths = nthPeriod; // 每月投入，第幾次＝第幾個月
                          const targetMonth = ((((initialMonth - 1) + totalMonths) % 12) + 12) % 12 + 1;
                          const targetYear = initialYear + Math.floor(((initialMonth - 1) + totalMonths) / 12);
                          return `${targetYear} 年 ${targetMonth} 月`;
                        })()}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingLeft: 10, borderLeft: "1px solid rgba(255,255,255,0.1)", minWidth: 0 }}>
                    <label style={{ fontSize: 12, color: "#d1d5db", lineHeight: 1.2 }}>預設年月</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "stretch", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.4)" }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={defaultYearStr}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, "");
                            if (v === "" || (v.length <= 4 && parseInt(v, 10) <= 2100)) setDefaultYearStr(v);
                          }}
                          onBlur={() => {
                            const n = parseInt(defaultYearStr, 10);
                            if (!Number.isFinite(n) || n < 2000) setDefaultYearStr(String(DEFAULT_SIM_START_YEAR));
                            else if (n > 2100) setDefaultYearStr("2100");
                          }}
                          style={{ ...inputStyle, width: 72, height: 28, textAlign: "center", border: "none", borderRadius: 0 }}
                        />
                        <div style={{ display: "flex", flexDirection: "column", width: 22, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                          <button type="button" aria-label="年+1" onClick={() => setDefaultYearStr(String(Math.min(2100, defaultYear + 1)))} style={{ flex: 1, minHeight: 14, padding: 0, border: "none", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}>▲</button>
                          <button type="button" aria-label="年-1" onClick={() => setDefaultYearStr(String(Math.max(2000, defaultYear - 1)))} style={{ flex: 1, minHeight: 14, padding: 0, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}>▼</button>
                        </div>
                      </div>
                      <span style={{ fontSize: 13, color: "#9ca3af" }}>年</span>
                      <div style={{ display: "flex", alignItems: "stretch", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.4)" }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={defaultMonthStr}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, "");
                            if (v === "" || v.length <= 2) setDefaultMonthStr(v);
                          }}
                          onBlur={() => {
                            const n = parseInt(defaultMonthStr, 10);
                            if (!Number.isFinite(n) || n < 1) setDefaultMonthStr(String(DEFAULT_SIM_START_MONTH));
                            else if (n > 12) setDefaultMonthStr("12");
                          }}
                          style={{ ...inputStyle, width: 56, height: 28, textAlign: "center", border: "none", borderRadius: 0 }}
                        />
                        <div style={{ display: "flex", flexDirection: "column", width: 22, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                          <button
                            type="button"
                            aria-label="月+1"
                            onClick={() => {
                              if (defaultMonth >= 12) {
                                setDefaultMonthStr("1");
                                setDefaultYearStr(String(Math.min(2100, defaultYear + 1)));
                              } else {
                                setDefaultMonthStr(String(defaultMonth + 1));
                              }
                            }}
                            style={{ flex: 1, minHeight: 14, padding: 0, border: "none", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            aria-label="月-1"
                            onClick={() => {
                              if (defaultMonth <= 1) {
                                setDefaultMonthStr("12");
                                setDefaultYearStr(String(Math.max(2000, defaultYear - 1)));
                              } else {
                                setDefaultMonthStr(String(defaultMonth - 1));
                              }
                            }}
                            style={{ flex: 1, minHeight: 14, padding: 0, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                      <span style={{ fontSize: 13, color: "#9ca3af" }}>月</span>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          setInitialYearStr(String(d.getFullYear()));
                          setInitialMonthStr(String(d.getMonth() + 1));
                        }}
                        style={{
                          padding: "6px 14px",
                          fontSize: 13,
                          borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.2)",
                          background: "rgba(255,255,255,0.1)",
                          color: "#e5e7eb",
                          cursor: "pointer",
                          marginLeft: 4,
                          alignSelf: "flex-end",
                        }}
                      >
                        恢復
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {selectedEtfInfo && selectedEtf !== "none" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 10, borderRadius: 8, background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 13 }}>
                    {/* 股息、股價、本{月/季/半年/年}股利(本金+第一次領息前投入)、固定投入(含加班費)、可再投入 五欄，全部置中 */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>股息</div>
                        <div style={{ fontSize: 18, fontWeight: 600, color: "#f5c451" }}>
                          {selectedEtfInfo?.dividendPerPeriod != null ? `${selectedEtfInfo.dividendPerPeriod.toFixed(2)}` : "—"} 元/股
                        </div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>股價</div>
                        <div style={{ fontSize: 18, fontWeight: 600, color: "#e5e7eb" }}>
                          {selectedEtfInfo?.price != null ? `${selectedEtfInfo.price.toLocaleString("zh-TW")}` : "—"} 元
                        </div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>{effectivePayoutLabel === "半年" ? "半年股利" : `本${effectivePayoutLabel}股利`}</div>
                        <div style={{ fontSize: 18, fontWeight: 600, color: "#39ff14" }}>
                          {isNthPeriodDividendMonth ? `${Math.round(nthPeriodEstimate.grossDividend).toLocaleString("zh-TW")} 元` : "0 元"}
                        </div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>固定投入（含加班費）</div>
                        <div style={{ fontSize: 18, fontWeight: 600, color: "#e5e7eb" }}>
                          {selectedEtfInfo?.price != null && selectedEtfInfo.price > 0
                            ? `${Math.floor((monthlyContributionNum + monthlyExtraNum) / selectedEtfInfo.price).toLocaleString("zh-TW")} 股/月`
                            : "—"}
                        </div>
                        <span style={{ fontSize: 11, color: "#d1d5db", display: "block", marginTop: 4, lineHeight: 1.25, textAlign: "center", width: "100%", paddingLeft: 0, paddingRight: 0, boxSizing: "border-box" }}>（試算：本金＋{periodLabelForBalance}(固定+額外)×{periodMonthsForBalance}月÷股價＝約可買股數）</span>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>可再投入</div>
                        <div style={{ fontSize: 18, fontWeight: 600, color: "#39ff14" }}>
                          {isNthPeriodDividendMonth && sharesFromActualDividend
                            ? (sharesFromActualDividend.zhang > 0 ? `${sharesFromActualDividend.zhang} 張` + (sharesFromActualDividend.shares % 1000 > 0 ? `又 ${sharesFromActualDividend.shares % 1000} 股` : "") : `${sharesFromActualDividend.shares} 股`)
                            : "0 股"}
                        </div>
                        <span style={{ fontSize: 11, color: "#d1d5db", display: "block", marginTop: 2 }}>股利再投入</span>
                      </div>
                    </div>
                    {/* 股價與股利說明：不置中，往上貼齊 */}
                    <div style={{ marginTop: 2, fontSize: 11, color: "#d1d5db", lineHeight: 1.4 }}>
                      <span>股價與股利為示意值，可自行修正；真實數據請以券商為準。</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 三、股利再投入比例置頂，其下為股息、股利 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* 股利再投入比例：往上移到股息股利上方，下方說明一整行、字改大 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 13, color: "#d1d5db", display: "flex", justifyContent: "space-between", alignItems: "center" }}><span>股利再投入比例</span><span style={{ color: "#39ff14", fontWeight: 600, fontSize: 14 }}>{reinvestRatio}%</span></label>
                  <input type="range" min={0} max={100} step={5} value={reinvestRatio} onChange={(e) => setReinvestRatio(Number(e.target.value) || 0)} style={{ width: "100%" }} />
                  <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.5, padding: "4px 0" }}>
                    {reinvestNoteIsMet ? (
                      <>每次投入時扣除已達標稅金、二代健保與手續費，扣除後金額即為實際可再投入之資金。</>
                    ) : (
                      <>每次投入時未達扣稅門檻無須扣所得稅與二代健保，僅扣除買入手續費，扣除後金額即為實際可再投入之資金。</>
                    )}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 13, color: "#d1d5db" }}>股息 (%){(!rateSource || rateSource === "annual") && <span style={{ fontSize: 10, color: "#6b7280", marginLeft: 6 }}>（以年化報酬率為準）</span>}</label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={dividendYieldPct === "" ? "" : dividendYieldPct}
                    onChange={(e) => { const v = e.target.value; setDividendYieldPct(v === "" ? "" : (Number(v) || 0)); setRateSource("dividend"); }}
                    onFocus={(e) => e.target.select()}
                    style={{ ...inputStyle, opacity: (!rateSource || rateSource === "annual") ? 0.6 : 1, color: (!rateSource || rateSource === "annual") ? "#9ca3af" : "#e5e7eb" }}
                    placeholder="例：4"
                  />
                  <div style={{ fontSize: 11, padding: "6px 8px", background: "rgba(57,255,20,0.12)", borderRadius: 6, border: "1px solid rgba(57,255,20,0.3)", color: "#b4f8c4", display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontWeight: 600 }}>【股息】一張（1000 股）本{effectivePayoutLabel}可領現金</span>
                    {selectedEtfInfo?.price != null && selectedEtfInfo?.dividendPerPeriod != null ? (
                      <><span>{(selectedEtfInfo.dividendPerPeriod * 1000).toLocaleString("zh-TW")} 元</span><span style={{ fontSize: 10, opacity: 0.9 }}>計算式：{selectedEtfInfo.dividendPerPeriod} 元/股 × 1000 股 ＝ {(selectedEtfInfo.dividendPerPeriod * 1000).toLocaleString("zh-TW")} 元</span></>
                    ) : (() => {
                      const price = selectedEtfInfo?.price ?? 100;
                      const pct = (Number(dividendYieldPct) || 4) / 100;
                      const periodsPerYear = payoutFrequency === "month" ? 12 : payoutFrequency === "quarter" ? 4 : payoutFrequency === "semiannual" ? 2 : 1;
                      const perPeriod = (price * 1000 * pct) / periodsPerYear;
                      const pctDisplay = dividendYieldPct !== "" && dividendYieldPct !== null ? Number(dividendYieldPct) : 4;
                      return <><span>{Math.round(perPeriod).toLocaleString("zh-TW")} 元</span><span style={{ fontSize: 10, opacity: 0.9 }}>計算式：股價 {price} 元 × 1000 股 × {pctDisplay}% ÷ {periodsPerYear} 期/年 ＝ {Math.round(perPeriod).toLocaleString("zh-TW")} 元{pctDisplay === 4 && (dividendYieldPct === "" || dividendYieldPct === null) ? "（預設股息 4%）" : ""}</span></>;
                    })()}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 13, color: "#d1d5db" }}>股利 (%){(!rateSource || rateSource === "annual") && <span style={{ fontSize: 10, color: "#6b7280", marginLeft: 6 }}>（以年化報酬率為準）</span>}</label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={stockDividendPct === "" ? "" : stockDividendPct}
                    onChange={(e) => { const v = e.target.value; setStockDividendPct(v === "" ? "" : (Number(v) || 0)); setRateSource("dividend"); }}
                    onFocus={(e) => e.target.select()}
                    style={{ ...inputStyle, opacity: (!rateSource || rateSource === "annual") ? 0.6 : 1, color: (!rateSource || rateSource === "annual") ? "#9ca3af" : "#e5e7eb" }}
                    placeholder="例：3"
                  />
                  <div style={{ fontSize: 11, padding: "6px 8px", background: "rgba(245,196,81,0.12)", borderRadius: 6, border: "1px solid rgba(245,196,81,0.3)", color: "#f5c451", display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontWeight: 600 }}>【股利】一張（1000 股）本{effectivePayoutLabel}可領（現金等值）</span>
                    {selectedEtfInfo?.price != null && selectedEtfInfo?.dividendPerPeriod != null ? (
                      <><span>{(selectedEtfInfo.dividendPerPeriod * 1000).toLocaleString("zh-TW")} 元</span><span style={{ fontSize: 10, opacity: 0.9 }}>計算式：{selectedEtfInfo.dividendPerPeriod} 元/股 × 1000 股 ＝ {(selectedEtfInfo.dividendPerPeriod * 1000).toLocaleString("zh-TW")} 元（股利以現金等值估算）</span></>
                    ) : (() => {
                      const price = selectedEtfInfo?.price ?? 100;
                      const pct = (Number(stockDividendPct) || 3) / 100;
                      const periodsPerYear = payoutFrequency === "month" ? 12 : payoutFrequency === "quarter" ? 4 : payoutFrequency === "semiannual" ? 2 : 1;
                      const perPeriod = (price * 1000 * pct) / periodsPerYear;
                      const pctDisplay = stockDividendPct !== "" && stockDividendPct !== null ? Number(stockDividendPct) : 3;
                      return <><span>{Math.round(perPeriod).toLocaleString("zh-TW")} 元</span><span style={{ fontSize: 10, opacity: 0.9 }}>計算式：股價 {price} 元 × 1000 股 × {pctDisplay}% ÷ {periodsPerYear} 期/年 ＝ {Math.round(perPeriod).toLocaleString("zh-TW")} 元{pctDisplay === 3 && (stockDividendPct === "" || stockDividendPct === null) ? "（預設股利 3%）" : ""}（股數依該檔公告）</span></>;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        <div id="mobile-app-view">
          <MobileHeroSection
            fireEtaStr={fireEtaStr}
            achievementPercent={achievementPercent}
            targetQuarterIncomeNum={targetQuarterIncomeNum}
            showHomeHeroFirstLink={showHomeHeroFirstLink}
            homeHeroFirstEntry={homeHeroFirstEntry}
            blogHref={homeHeroBlogHref}
            simulationAtTargetYears={{
              finalBalance: simulationAtTargetYears.finalBalance,
              totalDividends: simulationAtTargetYears.totalDividends,
            }}
          />
          <MobileGoalSettingSection
            targetQuarterIncome={targetQuarterIncome}
            setTargetQuarterIncome={setTargetQuarterIncome}
            targetQuarterIncomeNum={targetQuarterIncomeNum}
            targetYearsToAchieve={targetYearsToAchieve}
            setTargetYearsToAchieve={setTargetYearsToAchieve}
            payoutFrequency={payoutFrequency}
            handlePayoutFrequencyChange={handlePayoutFrequencyChange}
            requiredMonthlyToAchieveInYears={requiredMonthlyToAchieveInYears}
            requiredAssetsForTarget={requiredAssetsForTarget}
            commitFormula={commitFormula}
            parseFormula={parseFormula}
          />
          <MobileStockParamsSection
            onRestoreDefaults={restoreStockParamsDefaults}
            onOpenSaveTarget={() => setSaveTargetModalOpen(true)}
            onOpenLoadTarget={() => setLoadTargetModalOpen(true)}
            currentPrincipalStr={currentPrincipalStr}
            setCurrentPrincipalStr={setCurrentPrincipalStr}
            commitFormulaWithCommas={commitFormulaWithCommas}
            parseFormula={parseFormula}
            monthlyContribution={monthlyContribution}
            setMonthlyContribution={setMonthlyContribution}
            monthlyExtra={monthlyExtra}
            setMonthlyExtra={setMonthlyExtra}
            commitFormula={commitFormula}
            annualReturnRate={annualReturnRate}
            setAnnualReturnRate={setAnnualReturnRate}
            setRateSource={setRateSource}
            rateSource={rateSource}
            dividendYieldPct={dividendYieldPct}
            stockDividendPct={stockDividendPct}
            currentPrincipalNum={currentPrincipalNum}
            selectedEtfInfo={selectedEtfInfo}
            advancedProps={stockAdvancedBlockProps}
          />

          {/* 手機：我的自選股 / PWA 安裝引導（往上移到主流程中） */}
          <div className="mt-2">
            <HomeFooterWatchlistSection />
          </div>
        </div>

        {/* 6️⃣ FIRE COUNTDOWN */}
        <div style={{ ...cardStyle, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 600, color: "#e5e7eb", marginBottom: 12 }}>達成目標</h2>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#39ff14" }}>{fireEtaStr !== "—" ? `剩下 ${fireEtaStr}` : fireEtaStr}</div>
            <div style={{ fontSize: 16, color: "#9ca3af", marginTop: 6, fontWeight: 500 }}>預計 {fireEtaTargetDateStr} 達成</div>
            {simulation.yearsToUserTarget === 0 && simulation.monthsToUserTarget != null && simulation.monthsToUserTarget <= 12 && (
              <div style={{ fontSize: 16, color: "#39ff14", marginTop: 8 }}>已達成</div>
            )}
            {!targetYearsToAchieveEmpty && targetYearsToAchieveNum > 0 && requiredMonthlyToAchieveInYears != null && fireEtaYears != null && fireEtaYears >= 20 && (
              <div style={{ fontSize: 12, color: "#f5c451", marginTop: 8 }}>
                若要在 {targetYearsToAchieveNum} 年內達成，建議每月投入約 {requiredMonthlyToAchieveInYears.toLocaleString("zh-TW")} 元
              </div>
            )}
          </div>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#e5e7eb", marginBottom: 12 }}>20 年存股比較</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#9ca3af" }}>不存股</span>
                <strong style={{ color: "#e5e7eb" }}>{noInvestBalance20y.toLocaleString("zh-TW")} 元</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#9ca3af" }}>存股</span>
                <strong style={{ color: "#39ff14" }}>{investBalance20y.toLocaleString("zh-TW")} 元</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                <span style={{ color: "#9ca3af" }}>差額</span>
                <strong style={{ color: diffVsNoInvest >= 0 ? "#39ff14" : "#f87171" }}>{diffVsNoInvest >= 0 ? "+" : ""}{diffVsNoInvest.toLocaleString("zh-TW")} 元</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 8️⃣ 累積金額與股數表（稅金級距 + 二代健保 + 如何減稅 + 股票選單與占比 + 自訂比值）— 往上移 */}
        <div style={{ ...cardStyle }}>
          {/* 股金設定與試算 */}
          <div style={{ marginBottom: 0 }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, color: "#e5e7eb", margin: "0 0 8px 0" }}>股金設定與試算</h2>
            {/* 桌機：重構前經典稅金版面（與 sticky 勾選一致，不受稅務模式自動同步影響） */}
            <div id="desktop-tax-settings-row">
              <TaxSettingsDesktopClassicLeftColumn
                applyTaxInTable={applyTaxInTable}
                setApplyTaxInTable={setApplyTaxInTable}
                taxBracketRate={taxBracketRate}
                setTaxBracketRate={setTaxBracketRate}
                annualIncome={annualIncome}
                setAnnualIncome={setAnnualIncome}
                annualIncomeYuan={annualIncomeYuan}
                mergeTaxOpen={mergeTaxOpen}
                setMergeTaxOpen={setMergeTaxOpen}
                separateTaxOpen={separateTaxOpen}
                setSeparateTaxOpen={setSeparateTaxOpen}
                taxBracketOptions={TAX_BRACKETS}
                inputStyle={inputStyle}
                deductionEstimate={deductionEstimate}
                tooltipWhich={tooltipWhich}
                setTooltipWhich={setTooltipWhich}
                totalPriceForEstimateStr={totalPriceForEstimateStr}
                setTotalPriceForEstimateStr={setTotalPriceForEstimateStr}
                computedTotalForEstimate={computedTotalForEstimate}
                commitFormula={commitFormula}
                sharesForTaxThreshold={sharesForTaxThreshold}
                sharesForCreditCap80k={sharesForCreditCap80k}
                selectedEtfInfo={selectedEtfInfo ?? null}
                taxThreshold={TAX_THRESHOLD}
              />
              <div
                style={{
                  flex: "1 1 0",
                  minWidth: 200,
                  display: "flex",
                  flexDirection: "column",
                  padding: "10px 12px",
                  background: "rgba(0,0,0,0.15)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  gap: 2,
                }}
              >
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#d1d5db", cursor: "pointer" }}>
                  <input type="checkbox" checked={applyNhi2InTable} onChange={(e) => setApplyNhi2InTable(e.target.checked)} />
                  <span>二代健保</span>
                </label>
                <div style={{ display: "flex", flexDirection: "row", flexWrap: "nowrap", gap: 8, alignItems: "flex-end" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.3 }}>輸入代碼</label>
                    <input
                      type="text"
                      placeholder="例: 0050、00919"
                      value={etfCodeFilter}
                      maxLength={5}
                      title={`刪空篩選可顯示全部 ${TICKER_PRESETS.length} 檔`}
                      onChange={(e) => {
                        const raw = e.target.value;
                        handleEtfCodeChange(raw);
                      }}
                      style={{ ...inputStyle, width: 72, boxSizing: "border-box", height: 26 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.3 }}>選擇 ETF</label>
                    <select
                      value={selectedEtf}
                      onChange={(e) => selectEtfFromMenu(e.target.value)}
                      style={{ ...inputStyle, paddingRight: 24, width: 260, boxSizing: "border-box", height: 26 }}
                    >
                      <option value="none">不使用預設（自行輸入年化）</option>
                      {filteredEtfs.map((etf) => (
                        <option key={etf.id} value={etf.id}>
                          {formatEtfOptionLabel(etf)}｜54C 占比 {etfRatioEstimates[etf.id] !== undefined && etfRatioEstimates[etf.id] !== "" ? etfRatioEstimates[etf.id] + "%" : "?"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.3 }}>54C 占比(手動調整)</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <input
                        type="text"
                        value={selectedEtf !== "none" ? (etfRatioEstimates[selectedEtf] ?? "") : ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (selectedEtf !== "none") setEtfRatioEstimates((prev) => ({ ...prev, [selectedEtf]: v }));
                        }}
                        placeholder="—"
                        style={{ ...inputStyle, width: 40, boxSizing: "border-box", height: 26, textAlign: "center" }}
                      />
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>%</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 11, lineHeight: 1.5, color: "#9ca3af", marginTop: 2, paddingTop: 2, borderTop: "1px dashed rgba(255,255,255,0.08)" }}>
                  <span style={{ color: "#d1d5db" }}>單筆股利 &gt; 2 萬按 2.11% 計收；</span>僅「54C 股利」計入，平準金與資本利得免計。
                  <span
                    onMouseEnter={() => setTooltipWhich("nhi2")}
                    onMouseLeave={() => setTooltipWhich(null)}
                    style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 14, height: 14, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.4)", color: "#9ca3af", fontSize: 10, cursor: "help", marginLeft: 4, verticalAlign: "middle" }}
                  >i
                    {tooltipWhich === "nhi2" && (
                      <span style={{ position: "absolute", right: 0, bottom: "100%", marginBottom: 6, zIndex: 10, padding: "12px 14px", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 11, color: "#1f2937", lineHeight: 1.7, whiteSpace: "normal", width: 340, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                        <strong>二代健保補充保費怎麼算？</strong><br />
                        單筆股利超過 2 萬的部分，要繳 2.11% 補充保費。但<strong>不是整筆股利都算</strong>：只有「54C 股利」要計入，收益平準金、資本利得不用算。<br /><br />
                        <strong>實際例子（數字）</strong><br />
                        假設這筆領到股利 <strong>10 萬</strong>，54C 占比 <strong>50%</strong>：<br />
                        · 要計入的金額＝10 萬×50%＝<strong>5 萬</strong><br />
                        · 5 萬 &gt; 2 萬門檻 → 補充保費＝5 萬×2.11%＝<strong>1,055 元</strong><br /><br />
                        若誤把整筆 10 萬都算：10 萬×2.11%＝2,110 元，多算了 <strong>1,055 元</strong>。                        所以上面「占比」就是在填 54C 大概占幾成，算出來才不會高估。
                      </span>
                    )}
                  </span>
                </div>
                {nhi2FreeEstimate && selectedEtfInfo ? (
                  <div style={{ marginTop: 2, padding: "6px 8px", background: "rgba(0,0,0,0.15)", borderRadius: 8, fontSize: 11, color: "#d1d5db", lineHeight: 1.5, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontWeight: 600, color: "#e5e7eb", marginBottom: 4, fontSize: 12 }}>{selectedEtf}-{selectedEtfInfo.label.split("（")[0].trim()}</div>
                    <div>約 <strong style={{ color: "#39ff14" }}>{nhi2FreeEstimate.maxDividend.toLocaleString("zh-TW")}</strong> 元股利以內不用繳（54C {nhi2FreeEstimate.ratioPct}%）</div>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>試算：2 萬 ÷ {nhi2FreeEstimate.ratioPct}% ＝ {nhi2FreeEstimate.maxDividend.toLocaleString("zh-TW")} 元</div>
                    {nhi2FreeEstimate.shares != null && nhi2FreeEstimate.price != null && nhi2FreeEstimate.dividendPerPeriod != null && (
                      <div style={{ marginTop: 4, fontSize: 10, color: "#9ca3af" }}>
                        約 <strong style={{ color: "#d1d5db" }}>{nhi2FreeEstimate.shares.toLocaleString("zh-TW")}</strong> 股（股價 {nhi2FreeEstimate.price} 元、每股 {nhi2FreeEstimate.dividendPerPeriod} 元/期）
                        {nhi2FreeEstimate.marketValue != null && <> · 市值約 <strong>{nhi2FreeEstimate.marketValue.toLocaleString("zh-TW")}</strong> 元</>}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ marginTop: 12, fontSize: 11, color: "#6b7280" }}>請選擇 ETF 並輸入 54C 占比，即可試算。</div>
                )}
                {deductionEstimate && (
                  <div style={{ marginTop: 2, padding: "6px 8px", background: "rgba(0,0,0,0.2)", borderRadius: 8, fontSize: 11, color: "#d1d5db", lineHeight: 1.5, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ fontWeight: 600, color: "#e5e7eb", marginBottom: 4, fontSize: 12 }}>以目前本金+投入+額外試算</div>
                    <div style={{ display: "grid", gap: 3 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4 }}>
                        <span style={{ color: "#9ca3af" }}>年收入級距</span>
                        <span>{deductionEstimate.bracketLabel}</span>
                        <span style={{ color: "#6b7280", marginLeft: 8 }}>｜</span>
                        <span style={{ color: "#9ca3af" }}>稅金依</span>
                        <strong>{deductionEstimate.taxMethod === "separate" ? "分開計稅" : "合併計稅"}</strong>
                        <span>{deductionEstimate.taxMethod === "separate" ? "（28%）" : "（級距 " + deductionEstimate.taxRatePct + "%）"}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap", padding: "6px 0", borderTop: "1px dashed rgba(255,255,255,0.08)", borderBottom: "1px dashed rgba(255,255,255,0.08)" }}>
                        <span>總股價</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="可輸入算式"
                          value={totalPriceForEstimateStr}
                          onChange={(e) => setTotalPriceForEstimateStr(e.target.value)}
                          onBlur={() => {
                            const raw = totalPriceForEstimateStr.replace(/,/g, "").trim();
                            if (raw === "") setTotalPriceForEstimateStr(String(computedTotalForEstimate));
                            else setTotalPriceForEstimateStr(commitFormula(raw));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const raw = totalPriceForEstimateStr.replace(/,/g, "").trim();
                              if (raw === "") setTotalPriceForEstimateStr(String(computedTotalForEstimate));
                              else setTotalPriceForEstimateStr(commitFormula(raw));
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          style={{ ...inputStyle, width: 120, boxSizing: "border-box", height: 24 }}
                        />
                        <span>元</span>
                        <span style={{ color: "#9ca3af" }}>→</span>
                        <span>預估當期股利 <strong>{Math.round(deductionEstimate.estimatedDividend).toLocaleString("zh-TW")}</strong> 元</span>
                      </div>
                      {deductionEstimate.nhi2Countable != null && (
                        <div style={{ fontSize: 10, color: "#9ca3af" }}>54C 計入約 <strong>{Math.round(deductionEstimate.nhi2Countable).toLocaleString("zh-TW")}</strong> 元（{deductionEstimate.ratioPct}%）</div>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <div>二代健保約扣 <strong style={{ color: "#f5c451" }}>{deductionEstimate.nhi2Amount.toLocaleString("zh-TW")}</strong> 元{deductionEstimate.nhi2Amount === 0 ? "（未達 2 萬門檻）" : "（2.11%）"}</div>
                        {sharesForNhi2Threshold != null && selectedEtfInfo && (
                          <div style={{ fontSize: 10, color: "#9ca3af" }}>約 <strong style={{ color: "#e5e7eb" }}>{sharesForNhi2Threshold.toLocaleString("zh-TW")}</strong> 股以上需繳二代健保（{selectedEtfInfo.id}）</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 手機：稅務模式 + 簡化／手動 UI（與 ?mobile=1 預覽一致） */}
            <div id="mobile-tax-settings-row">
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "stretch", gap: 12, marginBottom: 0 }}>
                <div style={{ flex: "1 1 280px", minWidth: 0, display: "flex", flexDirection: "column", padding: "10px 12px", background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10 }}>
                  <TaxSettingsLeftPanel
                    taxSettingsMode={taxSettingsMode}
                    onTaxSettingsModeChange={setTaxSettingsMode}
                    applyTaxInTable={applyTaxInTable}
                    setApplyTaxInTable={setApplyTaxInTable}
                    taxBracketRate={taxBracketRate}
                    setTaxBracketRate={setTaxBracketRate}
                    annualIncome={annualIncome}
                    setAnnualIncome={setAnnualIncome}
                    annualIncomeYuan={annualIncomeYuan}
                    mergeTaxOpen={mergeTaxOpen}
                    setMergeTaxOpen={setMergeTaxOpen}
                    separateTaxOpen={separateTaxOpen}
                    setSeparateTaxOpen={setSeparateTaxOpen}
                    taxBracketOptions={TAX_BRACKETS}
                    inputStyle={inputStyle}
                    deductionEstimate={deductionEstimate}
                    tooltipWhich={tooltipWhich}
                    setTooltipWhich={setTooltipWhich}
                    totalPriceForEstimateStr={totalPriceForEstimateStr}
                    setTotalPriceForEstimateStr={setTotalPriceForEstimateStr}
                    computedTotalForEstimate={computedTotalForEstimate}
                    commitFormula={commitFormula}
                    sharesForTaxThreshold={sharesForTaxThreshold}
                    sharesForCreditCap80k={sharesForCreditCap80k}
                    selectedEtfInfo={selectedEtfInfo ?? null}
                    taxThreshold={TAX_THRESHOLD}
                    taxAutoSavingsYuan={taxAutoSavingsYuan}
                  />
                </div>
                <div
                  style={{
                    flex: "1 1 280px",
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    padding: "10px 12px",
                    background: taxSettingsMode === "manual" ? "rgba(0,0,0,0.22)" : "rgba(0,0,0,0.15)",
                    border: taxSettingsMode === "manual" ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    gap: 2,
                    opacity: taxSettingsMode === "manual" ? 0.92 : 1,
                  }}
                >
                    <MobileNhi2ImpactBlock
                    taxSettingsMode={taxSettingsMode}
                    applyNhi2InTable={applyNhi2InTable}
                    setApplyNhi2InTable={setApplyNhi2InTable}
                    inputStyle={inputStyle}
                    etfCodeFilter={etfCodeFilter}
                    onEtfCodeChange={handleEtfCodeChange}
                    tickersCount={TICKER_PRESETS.length}
                    selectedEtf={selectedEtf}
                    onSelectEtf={selectEtfFromMenu}
                    filteredEtfs={filteredEtfs}
                    etfRatioEstimates={etfRatioEstimates}
                    onRatioChange={(etfId, value) => setEtfRatioEstimates((prev) => ({ ...prev, [etfId]: value }))}
                    deductionEstimate={deductionEstimate}
                    selectedEtfInfo={selectedEtfInfo}
                    manualDetailSlot={
                      taxSettingsMode === "manual" && deductionEstimate ? (
                    <div style={{ marginTop: 2, padding: "6px 8px", background: "rgba(0,0,0,0.2)", borderRadius: 8, fontSize: 11, color: "#d1d5db", lineHeight: 1.5, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ fontWeight: 600, color: "#e5e7eb", marginBottom: 4, fontSize: 12 }}>以目前本金+投入+額外試算</div>
                      <div style={{ display: "grid", gap: 3 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4 }}>
                          <span style={{ color: "#9ca3af" }}>年收入級距</span>
                          <span>{deductionEstimate.bracketLabel}</span>
                          <span style={{ color: "#6b7280", marginLeft: 8 }}>｜</span>
                          <span style={{ color: "#9ca3af" }}>稅金依</span>
                          <strong>{deductionEstimate.taxMethod === "separate" ? "分開計稅" : "合併計稅"}</strong>
                          <span>{deductionEstimate.taxMethod === "separate" ? "（28%）" : "（級距 " + deductionEstimate.taxRatePct + "%）"}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap", padding: "6px 0", borderTop: "1px dashed rgba(255,255,255,0.08)", borderBottom: "1px dashed rgba(255,255,255,0.08)" }}>
                          <span>總股價</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="可輸入算式"
                            value={totalPriceForEstimateStr}
                            onChange={(e) => setTotalPriceForEstimateStr(e.target.value)}
                            onBlur={() => {
                              const raw = totalPriceForEstimateStr.replace(/,/g, "").trim();
                              if (raw === "") setTotalPriceForEstimateStr(String(computedTotalForEstimate));
                              else setTotalPriceForEstimateStr(commitFormula(raw));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const raw = totalPriceForEstimateStr.replace(/,/g, "").trim();
                                if (raw === "") setTotalPriceForEstimateStr(String(computedTotalForEstimate));
                                else setTotalPriceForEstimateStr(commitFormula(raw));
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            style={{ ...inputStyle, width: 120, boxSizing: "border-box", height: 24 }}
                          />
                          <span>元</span>
                          <span style={{ color: "#9ca3af" }}>→</span>
                          <span>預估當期股利 <strong>{Math.round(deductionEstimate.estimatedDividend).toLocaleString("zh-TW")}</strong> 元</span>
                        </div>
                        {deductionEstimate.nhi2Countable != null && (
                          <div style={{ fontSize: 10, color: "#9ca3af" }}>54C 計入約 <strong>{Math.round(deductionEstimate.nhi2Countable).toLocaleString("zh-TW")}</strong> 元（{deductionEstimate.ratioPct}%）</div>
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <div>二代健保約扣 <strong style={{ color: "#f5c451" }}>{deductionEstimate.nhi2Amount.toLocaleString("zh-TW")}</strong> 元{deductionEstimate.nhi2Amount === 0 ? "（未達 2 萬門檻）" : "（2.11%）"}</div>
                          {sharesForNhi2Threshold != null && selectedEtfInfo && (
                            <div style={{ fontSize: 10, color: "#9ca3af" }}>約 <strong style={{ color: "#e5e7eb" }}>{sharesForNhi2Threshold.toLocaleString("zh-TW")}</strong> 股以上需繳二代健保（{selectedEtfInfo.id}）</div>
                          )}
                        </div>
                      </div>
                    </div>
                      ) : null
                    }
                  />
                </div>
              </div>
            </div>
            <div className="md:hidden mt-5 flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl bg-white/[0.04] px-4 py-3 text-left text-sm font-medium text-slate-300"
                  onClick={() => setMobileAccumCalcHelpOpen((o) => !o)}
                  aria-expanded={mobileAccumCalcHelpOpen}
                >
                  <span>ℹ️ 計算說明</span>
                  <span className="text-slate-500">{mobileAccumCalcHelpOpen ? "▲" : "▼"}</span>
                </button>
                {mobileAccumCalcHelpOpen ? (
                  <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-500">
                    <li>期數依配息頻率（月／季／半年／年）對照。</li>
                    <li>本次股息為該期 gross；再投入比例為股利再投入％。</li>
                    <li>須扣除資金＝補稅＋二代健保＋手續費（二代門檻 2 萬）。</li>
                    <li>手續費：投入／再投入各 0.1425%（最低 20 元）。</li>
                    <li>本期總投入＝固定投入（已扣手續費）＋股利再投入；股數依標的股價試算。</li>
                  </ul>
                ) : null}
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-4 text-sm leading-relaxed text-slate-500">
                <div className="mb-2 font-semibold text-slate-200">每檔稅金說明</div>
                <div>{taxMessage}</div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "nowrap",
              alignItems: "center",
              gap: 12,
              marginBottom: mobileTaxLayoutActive ? 12 : 8,
              overflowX: "auto",
              ...(mobileTaxLayoutActive ? { paddingTop: 16, paddingBottom: 16 } : {}),
            }}
          >
            <h2 style={{ fontSize: 24, fontWeight: 600, color: "#e5e7eb", margin: 0, flexShrink: 0 }}>累積金額與股數表</h2>
          </div>
          <div
            className="hidden md:block"
            style={{ overflowX: "auto", maxHeight: 360, overflowY: "auto", paddingRight: 10, boxSizing: "border-box" }}
          >
            {!mobileAccumFullTableModalOpen ? renderAccumulatedDesktopTable() : null}
          </div>
          <div className="flex flex-col gap-5 md:gap-4">
          <div className="md:hidden flex flex-col gap-6">
            {accumulatedPeriodRecentMobile ? (
              <>
                <div
                  className={
                    accumulatedPeriodRecentMobile.dividendThisGross > 0
                      ? "rounded-xl border border-emerald-500/35 bg-emerald-950/25 p-4 shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
                      : "rounded-xl border border-white/10 bg-slate-950/40 p-4 shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
                  }
                >
                  <div className="mb-3 border-b border-white/10 pb-2 text-lg font-bold text-slate-100">
                    試算第1期 · {accumulatedPeriodRecentMobile.row.periodLabel}
                  </div>
                  <div className="flex flex-col gap-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">股利</div>
                      <div className="text-xl font-bold text-slate-100">
                        {accumulatedPeriodRecentMobile.dividendThisGross > 0
                          ? Math.round(accumulatedPeriodRecentMobile.dividendThisGross).toLocaleString("zh-TW")
                          : "—"}
                        {accumulatedPeriodRecentMobile.dividendThisGross > 0 ? (
                          <span className="text-sm font-bold text-slate-400"> 元</span>
                        ) : null}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">本期投入</div>
                      <div className="text-xl font-bold text-slate-100">
                        {Math.round(accumulatedPeriodRecentMobile.totalInflowThisPeriod).toLocaleString("zh-TW")}
                        <span className="text-sm font-bold text-slate-400"> 元</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">總資產</div>
                      <div className="text-xl font-bold text-slate-100">
                        {Math.round(accumulatedPeriodRecentMobile.balanceBalVal).toLocaleString("zh-TW")}
                        <span className="text-sm font-bold text-slate-400"> 元</span>
                      </div>
                    </div>
                  </div>
                </div>
                {accumulatedPeriodNextTenMobile.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    <button
                      type="button"
                      className="w-full rounded-xl bg-transparent px-0 py-2.5 text-left text-sm font-medium text-slate-500 transition-colors hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
                      onClick={() => setMobileAccumShowNextTen((v) => !v)}
                    >
                      {mobileAccumShowNextTen ? "▲ 收合未來10期" : "▼ 展開未來10期"}
                    </button>
                    {mobileAccumShowNextTen ? (
                      <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-4">
                          <h3 className="text-center text-sm font-bold text-slate-300">未來10期</h3>
                          <div className="flex flex-col gap-4">
                            {accumulatedPeriodNextTenMobile.map((d) => {
                              const hasDiv = d.dividendThisGross > 0;
                              return (
                                <div
                                  key={d.i}
                                  className={
                                    hasDiv
                                      ? "rounded-xl border border-emerald-500/35 bg-emerald-950/25 p-4 shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
                                      : "rounded-xl border border-white/10 bg-slate-950/40 p-4 shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
                                  }
                                >
                                  <div className="mb-2 border-b border-white/10 pb-2 text-base font-bold text-slate-100">{d.row.periodLabel}</div>
                                  <div className="flex flex-col gap-3">
                                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                                      <span className="text-xs font-semibold text-slate-500">股利</span>
                                      <span className="text-lg font-bold text-slate-100">
                                        {d.dividendThisGross > 0 ? Math.round(d.dividendThisGross).toLocaleString("zh-TW") : "—"}
                                        {d.dividendThisGross > 0 ? <span className="text-sm font-bold text-slate-400"> 元</span> : null}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                                      <span className="text-xs font-semibold text-slate-500">本期投入</span>
                                      <span className="text-lg font-bold text-slate-100">
                                        {Math.round(d.totalInflowThisPeriod).toLocaleString("zh-TW")}
                                        <span className="text-sm font-bold text-slate-400"> 元</span>
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                                      <span className="text-xs font-semibold text-slate-500">總資產</span>
                                      <span className="text-lg font-bold text-slate-100">
                                        {Math.round(d.balanceBalVal).toLocaleString("zh-TW")}
                                        <span className="text-sm font-bold text-slate-400"> 元</span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="flex min-h-[3.5rem] w-full items-center justify-center rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-700 px-4 py-3.5 text-base font-medium text-white shadow-lg shadow-emerald-950/30 transition hover:scale-[1.01] hover:brightness-110 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
                          onClick={() => {
                            if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("calc-engagement"));
                            setMobileAccumFullTableModalOpen(true);
                          }}
                        >
                          查看完整明細
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="flex min-h-[3.5rem] w-full items-center justify-center rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-700 px-4 py-3.5 text-base font-medium text-white shadow-lg shadow-emerald-950/30 transition hover:scale-[1.01] hover:brightness-110 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
                        onClick={() => {
                          if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("calc-engagement"));
                          setMobileAccumFullTableModalOpen(true);
                        }}
                      >
                        查看完整明細
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="flex min-h-[3.5rem] w-full items-center justify-center rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-700 px-4 py-3.5 text-base font-medium text-white shadow-lg shadow-emerald-950/30 transition hover:scale-[1.01] hover:brightness-110 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
                    onClick={() => {
                      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("calc-engagement"));
                      setMobileAccumFullTableModalOpen(true);
                    }}
                  >
                    查看完整明細
                  </button>
                )}
              </>
            ) : null}
            <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("calc-engagement"));
                  downloadTableExcel();
                }}
                className="min-h-[3rem] w-full rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200/95 transition hover:border-emerald-500/35 hover:bg-emerald-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              >
                下載 Excel
              </button>
            </div>
          </div>
          <div className="hidden md:block">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#6b7280" }}>藍色數字為手動覆蓋，算式不變</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => { setManualOverrides({}); setEditingCell(null); }}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 500,
                color: "#9ca3af",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              清除覆蓋
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("calc-engagement"));
                downloadTableExcel();
              }}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 500,
                color: "#0f172a",
                background: "#34d399",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              下載 Excel
            </button>
            </div>
          </div>
          <p style={{ fontSize: 11, color: "#6b7280", marginTop: 8, marginBottom: 0 }}>期數依配息頻率（月／季／半年／年）對照；本次股息＝該期 gross 股利；再投入股利比例＝股利再投入的百分比；扣除稅金／二代健保未達 2 萬門檻顯示「未達標」；須扣除資金＝補稅＋補充保費＋手續費；手續費每期皆有：投入買入與股利再投入皆 0.1425%（最低 20 元）；上期餘額＝上期結餘；固定投入／額外加碼＝該期固定投入（依配息頻率換算期數）；股利再投入＝股息扣除稅費後再投入金額；本期總投入＝固定投入（已扣手續費）＋股利再投入。股數以選定 ETF 股價試算。</p>
          <div style={{ marginTop: 12, padding: "6px 8px", background: "rgba(0,0,0,0.25)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", fontSize: 11, color: "#9ca3af", lineHeight: 1.5 }}>
            <div style={{ fontWeight: 600, color: "#e5e7eb", marginBottom: 6 }}>每檔稅金說明</div>
            <div>{taxMessage}</div>
          </div>
          </div>
          </div>
        </div>

        {/* 7️⃣ ASSET GROWTH CHART - 預留 Chart.js（往下移） */}
        <div style={{ ...cardStyle }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: "#e5e7eb", marginBottom: 12 }}>資產成長曲線</h2>
          <div style={{ height: 280, background: "rgba(0,0,0,0.2)", borderRadius: 12, border: "1px dashed rgba(57,255,20,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", fontSize: 12 }}>
            X 軸：年份 · Y 軸：資產（Chart.js 預留區塊）
          </div>
        </div>

        {/* 9️⃣ 法律聲明 / FOOTER */}
        <footer style={{ padding: "20px 0 24px", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <Link href="/blog" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#9ca3af" }}>
              部落格
            </Link>
            <span style={{ color: "#4b5563", margin: "0 10px" }} aria-hidden>
              ·
            </span>
            <Link href="/privacy.txt" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#9ca3af" }}>
              隱私權政策
            </Link>
            {homeFooterBlogPosts.map((post) => (
              <span key={post.slug}>
                <span style={{ color: "#4b5563", margin: "0 10px" }} aria-hidden>
                  ·
                </span>
                <Link
                  href={blogPostPath(post.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 13, color: "#6ee7b7" }}
                >
                  {post.homeFooterLabel ?? post.listTitle}
                </Link>
              </span>
            ))}
          </div>
          <FooterStatsStrip />
          <div className="hidden md:block">
            <HomeFooterWatchlistSection />
          </div>
          {/* 廣告預留區（僅佔位，日後可替換為廣告元件） */}
          <div
            role="complementary"
            aria-label="廣告預留區"
            style={{
              position: "relative",
              marginBottom: 24,
              minHeight: 120,
              padding: "32px 20px",
              borderRadius: 12,
              border: "1px dashed rgba(148,163,184,0.35)",
              background:
                "linear-gradient(165deg, rgba(15,23,42,0.55), rgba(2,6,23,0.5))",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              color: "#64748b",
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: "0.2em",
            }}
          >
            {/* 視覺隱藏 SEO 文案（仍於 HTML 中；螢幕助讀略過）— 搜尋引擎可能視隱藏內容為不當操作，請自行評估 */}
            <p
              aria-hidden="true"
              style={{
                position: "absolute",
                width: "1px",
                height: "1px",
                padding: 0,
                margin: "-1px",
                overflow: "hidden",
                clipPath: "inset(50%)",
                whiteSpace: "nowrap",
                border: 0,
              }}
            >
              財富自由計算機
              財務自由規劃工具，協助台灣投資人以台股 ETF（如 0050、0056、006208、00878、00929、00934、00935
              等）及自訂標的進行長期複利與被動收入模擬。支援定期定額、額外加碼投入、股利再投入比例、月配／季配／半年配／年配與自訂配息月份，並可試算年化報酬、股利殖利率與 FIRE
              達標年期。試算表整合股利所得課稅、54C 應稅股利占比、8.5% 股利抵減與上限、分離課稅選項、二代健保補充保費門檻與費率、申購與再投入手續費等假設，提供累積金額、每期扣除與總資產欄位，並可匯出
              Excel 做情境比較。本頁內容僅供教育與參考，不構成投資、稅務或法律建議；實際申報與交易請以主管機關、稽徵機關、券商及基金公司公告與您個案事實為準。建議同步檢視緊急預備金、保險保障與整體資產配置。
            </p>
            <span style={{ fontSize: 28, lineHeight: 1, opacity: 0.85 }} aria-hidden>
              ✦
            </span>
            <span>敬請期待</span>
            <span style={{ fontSize: 11, letterSpacing: "0.06em", color: "#475569", fontWeight: 500 }}>
              合作／廣告欄位預留
            </span>
          </div>
          <section
            aria-labelledby="legal-disclaimer-heading"
            style={{
              marginBottom: 20,
              padding: "16px 18px",
              borderRadius: 12,
              border: "1px solid rgba(251,191,36,0.35)",
              background: "rgba(30,27,15,0.55)",
              color: "#d1d5db",
              fontSize: 12,
              lineHeight: 1.65,
              textAlign: "left",
            }}
          >
            <h2
              id="legal-disclaimer-heading"
              style={{
                margin: "0 0 12px",
                fontSize: 14,
                fontWeight: 700,
                color: "#fcd34d",
                letterSpacing: "0.02em",
              }}
            >
              法律聲明與免責條款
            </h2>
            <p style={{ margin: "0 0 10px", color: "#e5e7eb" }}>
              您使用本網頁（含試算表、圖表、匯出檔案及所有顯示之數字與文字說明，以下合稱「本工具」）前，請詳閱下列條款。一經使用本工具，即表示您已閱讀、理解並同意受下列條款拘束；若您不同意，請勿使用本工具。
            </p>
            <ol style={{ margin: "0 0 10px", paddingLeft: 20, color: "#cbd5e1" }}>
              <li style={{ marginBottom: 8 }}>
                <strong style={{ color: "#fbbf24" }}>僅供參考，非專業建議：</strong>
                本工具所產出之試算、模擬、預估報酬、稅費、股數、FIRE 時程及其他數值，均係依您輸入之假設與簡化模型計算，<strong>僅供一般性參考</strong>，不構成投資理財、資產配置、證券買賣、稅務申報、法律、會計或其他專業意見或建議，亦不代表對任何標的之推介、保證或預測。
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong style={{ color: "#fbbf24" }}>實際狀況以法令與機構為準：</strong>
                所得稅、股利課稅、二代健保補充保費、抵減上限、級距、申報方式、ETF 實際配息、淨值、手續費、匯率及金融市場報酬等，均可能隨法規、政策、契約或市場而變動；<strong>請以中華民國現行法令、主管機關函釋、稽徵機關認定、券商／基金公司公告及您個案之事實為準。</strong>
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong style={{ color: "#fbbf24" }}>資料與正確性：</strong>
                本工具可能使用預設參數、歷史或第三方資訊作為輸入便利，該等資訊<strong>未必即時、完整或正確</strong>；開發者未就試算結果之正確性、完整性、適用性或可達成性為任何明示或默示之擔保。
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong style={{ color: "#fbbf24" }}>持續優化與微調：</strong>
                本工具將不定期優化與更新；對於計算邏輯、參數、介面或說明中可能之錯誤、疏漏或不一致，開發者得隨時酌情微調或修正。<strong>惟該等優化與微調並不保證</strong>試算結果之準確度、完整性，亦不擔保與法令、稽徵實務或市場實況完全一致。
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong style={{ color: "#fbbf24" }}>責任限制：</strong>
                因使用或無法使用本工具、信賴本工具之輸出、或依該輸出所為之任何決定，所致之任何直接、間接、附隨、特別或衍生性損害（包含但不限於投資損失、稅務爭議、機會成本），<strong>使用者應自行評估並承擔全部風險與責任</strong>；在法律允許之最大範圍內，本工具之開發者與提供方不就前述事項負賠償或補償責任。
              </li>
              <li style={{ marginBottom: 0 }}>
                <strong style={{ color: "#fbbf24" }}>條款變更：</strong>
                得隨時修改本聲明內容；修改後於本頁公告即視為您知悉，請定期查閱。
              </li>
            </ol>
            <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>
              若您需要個人化之投資、稅務或法律諮詢，請洽具合格證照之專業人員。
            </p>
          </section>

          <section
            aria-labelledby="copyright-notice-heading"
            style={{
              position: "relative",
              marginBottom: 20,
              padding: "14px 18px 36px",
              borderRadius: 12,
              border: "1px solid rgba(148, 163, 184, 0.22)",
              background: "rgba(15, 23, 42, 0.42)",
              textAlign: "left",
            }}
          >
            <h2
              id="copyright-notice-heading"
              style={{
                margin: "0 0 10px",
                fontSize: 13,
                fontWeight: 700,
                color: "#94a3b8",
                letterSpacing: "0.04em",
              }}
            >
              版權說明
            </h2>
            <div style={{ fontSize: 11, lineHeight: 1.72, color: "#9ca3af" }}>
              <p style={{ margin: "0 0 10px" }}>
                本網頁之<strong style={{ color: "#a1a1aa" }}>程式碼、試算邏輯與專案檔案</strong>
                係以<strong style={{ color: "#a1a1aa" }}>開放原始碼（Open Source）</strong>
                方式提供；具體授權條件以公開儲存庫內之{" "}
                <strong style={{ color: "#a1a1aa" }}>LICENSE</strong> 及各檔案標頭為準（常見為 MIT
                等寬鬆授權，惟以前開文件為準）。
              </p>
              <p style={{ margin: "0 0 10px" }}>
                在遵守該授權條款之前提下，您得<strong style={{ color: "#a1a1aa" }}>免費使用、研究、修改、重製與再散布</strong>
                本專案（含商業與非商業用途），無須另行取得個別書面同意；仍請依所適用之授權保留或重製著作權與授權聲明（例如 MIT
                之「License」與「Copyright」文字）。
              </p>
              <p style={{ margin: "0 0 10px" }}>
                <strong style={{ color: "#a1a1aa" }}>開放授權不代表任何擔保：</strong>
                本專案係依現狀（AS IS）提供，開發者不就正確性、完整性、可商用性、不侵權或符合特定目的為任何明示或默示之保證；亦不承擔因使用或無法使用所生之損害賠償責任，於法律允許之最大範圍內為限。
              </p>
              <p style={{ margin: "0 0 10px" }}>
                <strong style={{ color: "#a1a1aa" }}>不得據以主張對開發者之訴追：</strong>
                您同意：不得以「曾使用本開源專案／本工具」「信賴本工具輸出」或「本專案為開源可自由使用」等事由，單獨或主要作為對本專案作者、維護者或提供方提起民事、刑事、行政程序、仲裁、檢舉或索賠之依據；相關爭議與風險之評估仍應依上方「法律聲明與免責條款」及您所在地法令，由您自行承擔。
              </p>
              <p style={{ margin: 0, fontSize: 10.5, color: "#6b7280" }}>
                本工具所依賴之第三方套件（例如 React、Next.js、試算相關函式庫等）各依其原專案授權條款；再散布或商用時請一併遵守。
              </p>
            </div>
            <div
              style={{
                position: "absolute",
                right: 14,
                bottom: 10,
                fontSize: 10,
                color: "#6b7280",
                letterSpacing: "0.02em",
              }}
            >
              版本　第 {APP_VERSION} 版
            </div>
          </section>

          <div style={{ fontSize: 11, color: "#6b7280", textAlign: "center" }}>
            <span>財富自由計算機</span>
          </div>
        </footer>
      </div>
      {clientMounted ? (
        <>
          <SaveTargetModal
            open={saveTargetModalOpen}
            onClose={() => setSaveTargetModalOpen(false)}
            snapshot={currentCalculatorSnapshot}
          />
          <LoadTargetModal
            open={loadTargetModalOpen}
            onClose={() => setLoadTargetModalOpen(false)}
            onApply={applyCalculatorSnapshot}
          />
          {mobileAccumFullTableModalOpen
            ? createPortal(
                <div className="fixed inset-0 z-[100000] flex flex-col" role="dialog" aria-modal="true" aria-labelledby="mobile-accum-full-table-title">
                  <button
                    type="button"
                    className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
                    aria-label="關閉試算表"
                    onClick={() => setMobileAccumFullTableModalOpen(false)}
                  />
                  <div className="pointer-events-none relative flex min-h-0 flex-1 flex-col items-center justify-center px-3 py-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <div className="pointer-events-auto w-full max-w-xl sm:max-w-4xl">
                      <div className="flex max-h-[min(52vh,420px)] w-full flex-col overflow-hidden rounded-2xl border border-slate-500/50 bg-slate-950 shadow-2xl shadow-black/60">
                        <div className="flex shrink-0 items-center gap-2 border-b border-slate-600/90 bg-[#185c37] px-3 py-2.5 sm:px-4">
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <h2 id="mobile-accum-full-table-title" className="truncate text-sm font-semibold text-white sm:text-base">
                              累積金額與股數表
                            </h2>
                          </div>
                          <div className="flex shrink-0 flex-col items-stretch gap-1.5 sm:flex-row sm:items-center">
                            <div className="flex flex-row items-center justify-end gap-1.5 sm:justify-start">
                              <button
                                type="button"
                                className="rounded-md border border-white/30 bg-white/[0.08] px-2 py-1 text-[10px] font-medium leading-tight text-white/90 shadow-sm active:bg-white/20 sm:text-xs"
                                onClick={() => {
                                  setManualOverrides({});
                                  setEditingCell(null);
                                }}
                              >
                                清除覆蓋
                              </button>
                              <button
                                type="button"
                                className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#185c37] shadow-sm active:bg-emerald-50"
                                onClick={() => {
                                  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("calc-engagement"));
                                  downloadTableExcel();
                                }}
                              >
                                下載 Excel
                              </button>
                            </div>
                            <button
                              type="button"
                              className="rounded-lg border border-white/35 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white shadow-sm active:bg-white/20"
                              onClick={() => setMobileAccumFullTableModalOpen(false)}
                            >
                              關閉
                            </button>
                          </div>
                        </div>
                        <div
                          className="shrink-0 overflow-x-auto overflow-y-scroll bg-[#0c1222] p-2 sm:p-3"
                          style={{
                            height: "min(240px, 38vh)",
                            WebkitOverflowScrolling: "touch",
                            overscrollBehavior: "contain",
                          }}
                        >
                          {renderAccumulatedDesktopTable()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>,
                document.body
              )
            : null}
        </>
      ) : null}
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  backgroundColor: "rgba(0,0,0,0.4)",
  borderRadius: 6,
  border: "1px solid rgba(255,255,255,0.1)",
  padding: "4px 8px",
  fontSize: 11,
  color: "#e5e7eb",
  outline: "none",
};

type KpiCardProps = {
  label: string;
  value: string;
  color: string;
};

function KpiCard({ label, value, color }: KpiCardProps) {
  return (
    <div
      style={{
        padding: 10,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.1)",
        backgroundColor: "rgba(15,23,42,0.7)",
      }}
    >
      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color }}>{value}</div>
    </div>
  );
}