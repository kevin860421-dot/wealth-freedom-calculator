/// <reference lib="webworker" />

import {
  EMPTY_SIMULATION,
  computeRequiredMonthlyToAchieveInYears,
  getPeriodSnapshots,
  simulate,
  targetPayoutPerPeriod,
  type HeavySimWorkerRequest,
  type HeavySimWorkerResponse,
  type PayoutFrequency,
} from "./home-simulation-engine";

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<HeavySimWorkerRequest>) => {
  const { id, payload } = event.data;
  try {
    const targetPerPeriod = targetPayoutPerPeriod(payload.targetQuarterIncomeNum, payload.payoutFrequency);

    const simulation = simulate({
      initialPrincipal: payload.principalForCalc,
      monthlyContribution: payload.monthlyContributionNum,
      monthlyExtra: payload.monthlyExtraNum,
      annualReturnRate: payload.effectiveAnnualRate,
      reinvestRatio: payload.reinvestRatio,
      payoutFrequency: payload.payoutFrequency as PayoutFrequency,
      targetPayoutPerPeriod: targetPerPeriod,
      taxRate: payload.effectiveTaxRateForSim,
    });

    const simulationAtTargetYears = simulate({
      initialPrincipal: payload.principalForCalc,
      monthlyContribution: payload.monthlyContributionNum,
      monthlyExtra: payload.monthlyExtraNum,
      annualReturnRate: payload.effectiveAnnualRate,
      reinvestRatio: payload.reinvestRatio,
      payoutFrequency: payload.payoutFrequency as PayoutFrequency,
      targetPayoutPerPeriod: targetPerPeriod,
      maxMonths: Math.max(1, payload.targetYearsNum) * 12,
      taxRate: payload.effectiveTaxRateForSim,
    });

    const periodSnapshots = getPeriodSnapshots(
      {
        initialPrincipal: payload.currentPrincipalNum,
        monthlyContribution: payload.monthlyContributionNum,
        monthlyExtra: payload.monthlyExtraNum,
        annualReturnRate: payload.effectiveAnnualRate,
        reinvestRatio: payload.reinvestRatio,
        payoutFrequency: payload.payoutFrequency as PayoutFrequency,
        dividendMonths: payload.dividendMonths,
      },
      payload.sharePrice,
      20,
      payload.initialYear,
      payload.initialMonth,
    );

    const requiredMonthlyToAchieveInYears = computeRequiredMonthlyToAchieveInYears(payload);

    const response: HeavySimWorkerResponse = {
      id,
      ok: true,
      simulation,
      simulationAtTargetYears,
      periodSnapshots,
      requiredMonthlyToAchieveInYears,
    };
    ctx.postMessage(response);
  } catch (error) {
    const response: HeavySimWorkerResponse = {
      id,
      ok: false,
      simulation: EMPTY_SIMULATION,
      simulationAtTargetYears: EMPTY_SIMULATION,
      periodSnapshots: [],
      requiredMonthlyToAchieveInYears: null,
      error: error instanceof Error ? error.message : String(error),
    };
    ctx.postMessage(response);
  }
};
