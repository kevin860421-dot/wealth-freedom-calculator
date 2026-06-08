import { clampNum } from "@/lib/quick-calculator-math";

export const MARGIN_MAINTENANCE_THRESHOLD = 130;
export const MARGIN_SAFE_TARGET = 166;
export const PLEDGE_MAINTENANCE_THRESHOLD = 130;
export const PLEDGE_SAFE_TARGET = 160;

export type MarginStressInput = {
  buyPrice: number;
  marginRatioPct: number;
  latestPrice: number;
  lots: number;
  extraDropPct: number;
};

export type MarginStressResult = {
  simulatedPrice: number;
  loanAmount: number;
  collateralValue: number;
  maintenancePct: number;
  isMarginCall: boolean;
  marginCallCriticalPrice: number;
  cashToSafe166: number;
};

export function computeMarginStress(input: MarginStressInput): MarginStressResult {
  const buyPrice = Math.max(0.01, input.buyPrice);
  const latestBase = Math.max(0, input.latestPrice);
  const lots = Math.max(0, input.lots);
  const marginRatio = clampNum(input.marginRatioPct, 1, 99) / 100;
  const extraDrop = clampNum(input.extraDropPct, -99, 0) / 100;
  const simulatedPrice = Math.max(0, latestBase * (1 + extraDrop));

  const loanAmount = buyPrice * 1000 * lots * marginRatio;
  const collateralValue = simulatedPrice * 1000 * lots;
  const maintenancePct = loanAmount > 0 ? (collateralValue / loanAmount) * 100 : 0;
  const marginCallCriticalPrice = buyPrice * marginRatio * (MARGIN_MAINTENANCE_THRESHOLD / 100);
  const cashToSafe166 = Math.max(0, loanAmount * (MARGIN_SAFE_TARGET / 100) - collateralValue);

  return {
    simulatedPrice,
    loanAmount,
    collateralValue,
    maintenancePct,
    isMarginCall: maintenancePct < MARGIN_MAINTENANCE_THRESHOLD,
    marginCallCriticalPrice,
    cashToSafe166,
  };
}

export type PledgeStressInput = {
  marketValue: number;
  loanAmount: number;
  crashPct: number;
  pledgeLots: number;
};

export type PledgeStressResult = {
  crashedMarketValue: number;
  maintenancePct: number;
  isPledgeCall: boolean;
  cashPlanA: number;
  extraLotsPlanB: number;
};

export function computePledgeStress(input: PledgeStressInput): PledgeStressResult {
  const marketValue = Math.max(0, input.marketValue);
  const loanAmount = Math.max(0, input.loanAmount);
  const crash = clampNum(input.crashPct, -99, 0) / 100;
  const pledgeLots = Math.max(1, input.pledgeLots);
  const crashedMarketValue = marketValue * (1 + crash);
  const maintenancePct = loanAmount > 0 ? (crashedMarketValue / loanAmount) * 100 : 0;
  const gap = Math.max(0, loanAmount * (PLEDGE_SAFE_TARGET / 100) - crashedMarketValue);
  const valuePerLot = crashedMarketValue > 0 ? crashedMarketValue / pledgeLots : 0;
  const extraLotsPlanB = valuePerLot > 0 ? Math.ceil(gap / valuePerLot) : 0;

  return {
    crashedMarketValue,
    maintenancePct,
    isPledgeCall: maintenancePct < PLEDGE_MAINTENANCE_THRESHOLD,
    cashPlanA: gap,
    extraLotsPlanB,
  };
}

export type LeverageStressInput = {
  monthlyLoanPayment: number;
  investmentTotal: number;
  emergencyReserve: number;
  marketReturnPct: number;
};

export type LeverageStressResult = {
  monthlyStockIncome: number;
  monthlyNetBleed: number;
  defenseMonthsLoanOnly: number;
  defenseMonthsNetBleed: number | null;
  annualLossEstimate: number;
};

export function computeLeverageStress(input: LeverageStressInput): LeverageStressResult {
  const monthlyLoanPayment = Math.max(0, input.monthlyLoanPayment);
  const investmentTotal = Math.max(0, input.investmentTotal);
  const emergencyReserve = Math.max(0, input.emergencyReserve);
  const monthlyStockIncome = (investmentTotal * (input.marketReturnPct / 100)) / 12;
  const monthlyNetBleed = monthlyLoanPayment - monthlyStockIncome;
  const defenseMonthsLoanOnly =
    monthlyLoanPayment > 0 ? emergencyReserve / monthlyLoanPayment : Number.POSITIVE_INFINITY;
  const defenseMonthsNetBleed =
    monthlyNetBleed > 0 ? emergencyReserve / monthlyNetBleed : null;

  return {
    monthlyStockIncome,
    monthlyNetBleed,
    defenseMonthsLoanOnly,
    defenseMonthsNetBleed,
    annualLossEstimate: Math.max(0, monthlyNetBleed) * 12,
  };
}

export type DayTradeStressInput = {
  buyTotal: number;
  accountBalance: number;
};

export type DayTradeStressResult = {
  fundingGap: number;
  isUnderfunded: boolean;
};

export function computeDayTradeStress(input: DayTradeStressInput): DayTradeStressResult {
  const buyTotal = Math.max(0, input.buyTotal);
  const accountBalance = Math.max(0, input.accountBalance);
  const fundingGap = Math.max(0, buyTotal - accountBalance);
  return {
    fundingGap,
    isUnderfunded: fundingGap > 0,
  };
}

export function inferPledgeLotsFromMarketValue(marketValue: number, fallback = 5): number {
  const perLot = 200_000;
  if (marketValue <= 0) return fallback;
  return Math.max(1, Math.round(marketValue / perLot));
}
