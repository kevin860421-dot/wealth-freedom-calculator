/** 大計算機長期試算核心（純函式，可供 Web Worker 與主執行緒共用） */

export type PayoutFrequency = "month" | "quarter" | "semiannual" | "year";

export type SimulationResult = {
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

export type PeriodSnapshot = {
  periodLabel: string;
  year: number;
  periodInYear: number;
  balance: number;
  shares: number;
  lastPeriodDividend: number;
  afterTaxDividend: number;
  reinvestPct: number;
  reinvestAmount: number;
  sharesBoughtThisPeriod: number;
  previousBalance: number;
  fixedAddThisPeriod: number;
  contributionFee: number;
  reinvestFee: number;
};

export type SimulateParams = {
  initialPrincipal: number;
  monthlyContribution: number;
  monthlyExtra: number;
  annualReturnRate: number;
  reinvestRatio: number;
  payoutFrequency: PayoutFrequency;
  targetPayoutPerPeriod: number;
  maxMonths?: number;
  taxRate: number;
};

const MONTHS = 40 * 12;
const TARGET_Q1 = 30000;
const TARGET_Q2 = 150000;
const TAX_THRESHOLD = 20000;
const TAX_RATE = 0.28;
const NHI2_THRESHOLD = 20000;
const NHI2_RATE = 0.0211;
const FEE_RATE = 0.001425;
const FEE_MIN = 20;

export const EMPTY_SIMULATION: SimulationResult = {
  milestone30000Index: null,
  milestone150000Index: null,
  milestoneUserTargetIndex: null,
  milestone30000QuarterDividend: null,
  milestone150000QuarterDividend: null,
  totalDividends: 0,
  finalBalance: 0,
  nzProgressPercent: 0,
  yearsTo30000: null,
  monthsTo30000: null,
  yearsTo150000: null,
  monthsTo150000: null,
  yearsToUserTarget: null,
  monthsToUserTarget: null,
};

function getBuyFee(amount: number): number {
  if (amount <= 0) return 0;
  return Math.max(FEE_MIN, Math.round(amount * FEE_RATE));
}

function getAfterTaxAndNhi2(
  grossPerPeriod: number,
  taxRate: number = TAX_RATE,
): { tax: number; nhi2: number; net: number } {
  if (grossPerPeriod < TAX_THRESHOLD) return { tax: 0, nhi2: 0, net: grossPerPeriod };
  const tax = grossPerPeriod * taxRate;
  const nhi2 = grossPerPeriod >= NHI2_THRESHOLD ? grossPerPeriod * NHI2_RATE : 0;
  return { tax, nhi2, net: grossPerPeriod - tax - nhi2 };
}

export function simulate({
  initialPrincipal,
  monthlyContribution,
  monthlyExtra,
  annualReturnRate,
  reinvestRatio,
  payoutFrequency,
  targetPayoutPerPeriod,
  maxMonths: maxMonthsParam,
  taxRate,
}: SimulateParams): SimulationResult {
  const annualRate = annualReturnRate / 100;
  const limitMonths = maxMonthsParam ?? MONTHS;
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

    if (month % intervalMonths === 0) {
      const grossReturn = balance * periodRate;
      const { net } = getAfterTaxAndNhi2(grossReturn, taxRate);
      const reinvest = net * (reinvestRatio / 100);
      const payout = net - reinvest;
      const reinvestFee = getBuyFee(reinvest);

      balance += Math.max(0, reinvest - reinvestFee);
      totalDividends += payout;

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

  const getTimeTo = (milestoneIndex: number | null): { years: number | null; months: number | null } => {
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
  const nzProgress = Math.max(0, Math.min(1, finalBalance / requiredFor30000)) * 100;

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

export function getPeriodSnapshots(
  params: {
    initialPrincipal: number;
    monthlyContribution: number;
    monthlyExtra: number;
    annualReturnRate: number;
    reinvestRatio: number;
    payoutFrequency: PayoutFrequency;
    dividendMonths?: number[];
  },
  sharePrice: number,
  maxYears: number = 20,
  startYear: number = new Date().getFullYear(),
  startMonth: number = new Date().getMonth() + 1,
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
        const label = payoutFrequency === "year" ? `${calYear}年` : `${calYear}年${calMonth}月`;
        const periodInYear = (Math.floor((month - 1) / intervalMonths) % periodsPerYear) + 1;
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

export function targetPayoutPerPeriod(monthlyTarget: number, payoutFrequency: PayoutFrequency): number {
  if (payoutFrequency === "month") return monthlyTarget;
  if (payoutFrequency === "quarter") return monthlyTarget * 3;
  if (payoutFrequency === "semiannual") return monthlyTarget * 6;
  return monthlyTarget * 12;
}

export type HeavySimPayload = {
  principalForCalc: number;
  monthlyContributionNum: number;
  monthlyExtraNum: number;
  effectiveAnnualRate: number;
  reinvestRatio: number;
  payoutFrequency: PayoutFrequency;
  targetQuarterIncomeNum: number;
  effectiveTaxRateForSim: number;
  targetYearsNum: number;
  targetYearsToAchieveEmpty: boolean;
  targetYearsToAchieveNum: number;
  currentPrincipalNum: number;
  sharePrice: number;
  dividendMonths?: number[];
  initialYear: number;
  initialMonth: number;
};

/** 供 worker 去重：參數相同則不重送試算 */
export function serializeHeavySimPayload(payload: HeavySimPayload): string {
  const months = payload.dividendMonths?.length ? [...payload.dividendMonths].sort((a, b) => a - b) : null;
  return JSON.stringify({ ...payload, dividendMonths: months });
}

/** 建議每月投入（二分搜尋）；與 page 原 useMemo 邏輯一致 */
export function computeRequiredMonthlyToAchieveInYears(payload: HeavySimPayload): number | null {
  const {
    principalForCalc: pfc,
    monthlyExtraNum: me,
    effectiveAnnualRate: ear,
    reinvestRatio: rr,
    payoutFrequency: pf,
    targetQuarterIncomeNum: tqi,
    effectiveTaxRateForSim: etr,
    targetYearsToAchieveEmpty,
    targetYearsToAchieveNum,
  } = payload;

  if (targetYearsToAchieveEmpty || targetYearsToAchieveNum <= 0) return null;
  const targetMonths = Math.floor(targetYearsToAchieveNum * 12);
  if (tqi <= 0 || ear <= 0) return null;

  const requiredAssetsForTarget = Math.round((tqi * 12) / (ear / 100));
  const targetPerPeriod = targetPayoutPerPeriod(tqi, pf);

  let low = 0;
  let high = 500000;
  for (let i = 0; i < 35; i++) {
    const mid = Math.round((low + high) / 2);
    const res = simulate({
      initialPrincipal: pfc,
      monthlyContribution: mid,
      monthlyExtra: me,
      annualReturnRate: ear,
      reinvestRatio: rr,
      payoutFrequency: pf,
      targetPayoutPerPeriod: targetPerPeriod,
      maxMonths: targetMonths,
      taxRate: etr,
    });
    const totalMonths =
      res.milestoneUserTargetIndex != null ? res.milestoneUserTargetIndex + 1 : targetMonths + 1;
    if (totalMonths <= targetMonths) high = mid;
    else low = mid + 1;
  }

  const final = simulate({
    initialPrincipal: pfc,
    monthlyContribution: high,
    monthlyExtra: me,
    annualReturnRate: ear,
    reinvestRatio: rr,
    payoutFrequency: pf,
    targetPayoutPerPeriod: targetPerPeriod,
    maxMonths: targetMonths,
    taxRate: etr,
  });
  const reachMonths =
    final.milestoneUserTargetIndex != null ? final.milestoneUserTargetIndex + 1 : null;
  if (reachMonths == null || reachMonths > targetMonths) return null;

  if (high < 15000 && requiredAssetsForTarget > 500000) {
    let l = 0;
    let h = 500000;
    for (let i = 0; i < 35; i++) {
      const mid = Math.round((l + h) / 2);
      const res = simulate({
        initialPrincipal: 0,
        monthlyContribution: mid,
        monthlyExtra: 0,
        annualReturnRate: ear,
        reinvestRatio: rr,
        payoutFrequency: pf,
        targetPayoutPerPeriod: targetPerPeriod,
        maxMonths: targetMonths,
        taxRate: etr,
      });
      const totalMonths =
        res.milestoneUserTargetIndex != null ? res.milestoneUserTargetIndex + 1 : targetMonths + 1;
      if (totalMonths <= targetMonths) h = mid;
      else l = mid + 1;
    }
    const verify = simulate({
      initialPrincipal: 0,
      monthlyContribution: h,
      monthlyExtra: 0,
      annualReturnRate: ear,
      reinvestRatio: rr,
      payoutFrequency: pf,
      targetPayoutPerPeriod: targetPerPeriod,
      maxMonths: targetMonths,
      taxRate: etr,
    });
    if (verify.milestoneUserTargetIndex != null && verify.milestoneUserTargetIndex + 1 <= targetMonths) return h;
  }

  return high;
}

export type HeavySimWorkerRequest = {
  id: number;
  payload: HeavySimPayload;
};

export type HeavySimWorkerResponse = {
  id: number;
  ok: boolean;
  simulation: SimulationResult;
  simulationAtTargetYears: SimulationResult;
  periodSnapshots: PeriodSnapshot[];
  requiredMonthlyToAchieveInYears: number | null;
  error?: string;
};
