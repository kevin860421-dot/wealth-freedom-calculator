"use client";

import { useMemo } from "react";
import { Quick11BankReportPanel } from "./quick11-bank-report-panel";
import { Quick11EmergencyAirbagPanel } from "./quick11-emergency-airbag-panel";
import { Quick11InflationOpportunityPanel } from "./quick11-inflation-opportunity-panel";
import { Quick11RateHikePanel } from "./quick11-rate-hike-panel";
import { Quick11OverlapChart, Quick11OverlapDesc } from "./quick11-overlap-chart";
import { Quick11OverlapControls } from "./quick11-overlap-controls";
import {
  buildPrincipalInterestOverlapSeries,
  padPaymentRowsToContractYears,
  resolveRateHikeScenarioRate,
  type RateHikePreset,
} from "./quick11-advanced-calculations";
import { buildLoanSchedules, type LoanMethod, type PaymentRow } from "./logic";
import { simulateEarlyRepaymentFromMonth } from "./repay-simulations";
import { getQ11Theme } from "./quick11-white-theme";

export type Quick11AdvancedTabPanelsProps = {
  page: 9 | 10 | 11 | 12 | 13;
  isLight?: boolean;
  rows: PaymentRow[];
  loanAmount: number;
  loanYears: number;
  annualRate: number;
  monthlyIncome: number;
  methodLabel: string;
  monthlyPayment: number;
  dtiPct: number;
  totalInterest: number;
  totalRepayment: number;
  equalPrincipalInterest: number;
  prepaySavedInterest: number;
  rateShockPct: number;
  shockedMonthlyPayment: number;
  shockedDtiPct: number;
  inflationPct: number;
  onInflationPctChange: (v: number) => void;
  opportunityReturnPct: number;
  onOpportunityReturnPctChange: (v: number) => void;
  emergencySavings: number;
  emergencyText: string;
  onEmergencyText: (v: string) => void;
  onEmergencyCommit: () => void;
  monthlyLivingExpense: number;
  onMonthlyLivingExpenseChange: (v: number) => void;
  incomeRetentionPct: number;
  onIncomeRetentionPctChange: (v: number) => void;
  rateHikePreset: RateHikePreset;
  onRateHikePreset: (p: RateHikePreset) => void;
  hikeMonthlyPayment: number;
  hikeDtiPct: number;
  hikeTotalInterest: number;
  hikeInterestDelta: number;
  onOpenExcelWizard: () => void;
  method: LoanMethod;
  onMethodChange: (m: LoanMethod) => void;
  extraMonthlyPayment: number;
  onExtraMonthlyPaymentChange: (v: number) => void;
  onLoanAmountChange: (v: number) => void;
  onAnnualRateChange: (v: number) => void;
  onLoanYearsChange: (v: number) => void;
};

export function Quick11AdvancedTabPanels(props: Quick11AdvancedTabPanelsProps) {
  const {
    page,
    isLight = true,
    rows,
    loanAmount,
    loanYears,
    annualRate,
    monthlyIncome,
    methodLabel,
    monthlyPayment,
    dtiPct,
    totalInterest,
    totalRepayment,
    equalPrincipalInterest,
    prepaySavedInterest,
    rateShockPct,
    shockedMonthlyPayment,
    shockedDtiPct,
    inflationPct,
    onInflationPctChange,
    opportunityReturnPct,
    onOpportunityReturnPctChange,
    emergencySavings,
    emergencyText,
    onEmergencyText,
    onEmergencyCommit,
    monthlyLivingExpense,
    onMonthlyLivingExpenseChange,
    incomeRetentionPct,
    onIncomeRetentionPctChange,
    rateHikePreset,
    onRateHikePreset,
    hikeMonthlyPayment,
    hikeDtiPct,
    hikeTotalInterest,
    hikeInterestDelta,
    onOpenExcelWizard,
    method,
    onMethodChange,
    extraMonthlyPayment,
    onExtraMonthlyPaymentChange,
    onLoanAmountChange,
    onAnnualRateChange,
    onLoanYearsChange,
  } = props;

  const methodLabelLocal = method === "annuity" ? "本息均攤" : "本金平均";

  const theme = getQ11Theme(isLight);

  const overlapRows = useMemo(() => {
    let rows: PaymentRow[];
    if (extraMonthlyPayment > 0) {
      rows = simulateEarlyRepaymentFromMonth(
        loanAmount,
        annualRate,
        loanYears,
        extraMonthlyPayment,
        1,
        method,
      ).rows as PaymentRow[];
    } else {
      const schedules = buildLoanSchedules(loanAmount, annualRate, loanYears);
      rows = method === "annuity" ? schedules.annuityRows : schedules.equalPrincipalRows;
    }
    return padPaymentRowsToContractYears(rows, loanYears);
  }, [loanAmount, annualRate, loanYears, extraMonthlyPayment, method]);

  const overlap = useMemo(() => buildPrincipalInterestOverlapSeries(overlapRows), [overlapRows]);

  if (page === 9) {
    return (
      <div className="space-y-3">
        <div>
          <p className={theme.pageTitle}>{loanYears} 年交疊圖（本金 vs 利息）</p>
          <Quick11OverlapDesc isLight={isLight} />
        </div>
        {overlap.years.length ? (
          <>
            <Quick11OverlapControls
              isLight={isLight}
              method={method}
              onMethodChange={onMethodChange}
              annualRate={annualRate}
              onAnnualRateChange={onAnnualRateChange}
              loanYears={loanYears}
              onLoanYearsChange={onLoanYearsChange}
              loanAmount={loanAmount}
              onLoanAmountChange={onLoanAmountChange}
              extraMonthlyPrepay={extraMonthlyPayment}
              onExtraMonthlyPrepayChange={onExtraMonthlyPaymentChange}
            />
            <Quick11OverlapChart
              isLight={isLight}
              title={`${methodLabelLocal} · 本金與利息消長`}
              years={overlap.years}
              cumInterestSeries={overlap.cumInterestSeries}
              balanceSeries={overlap.balanceSeries}
              crossoverYear={overlap.crossoverYear}
            />
          </>
        ) : (
          <div className={`${theme.card} text-sm ${descMuted}`}>請先在首頁輸入貸款條件。</div>
        )}
      </div>
    );
  }

  if (page === 10) {
    return (
      <div className="space-y-2">
        <p className={theme.pageTitle}>通膨縮水 × 機會成本</p>
        <Quick11InflationOpportunityPanel
          isLight={isLight}
          loanAmount={loanAmount}
          annualRate={annualRate}
          method={method}
          loanYears={loanYears}
          inflationPct={inflationPct}
          onInflationPctChange={onInflationPctChange}
          opportunityReturnPct={opportunityReturnPct}
          onOpportunityReturnPctChange={onOpportunityReturnPctChange}
        />
      </div>
    );
  }

  if (page === 11) {
    return (
      <div className="space-y-2">
        <p className={theme.pageTitle}>財務安全氣囊</p>
        <Quick11EmergencyAirbagPanel
          isLight={isLight}
          theme={theme}
          emergencySavings={emergencySavings}
          emergencyText={emergencyText}
          onEmergencyText={onEmergencyText}
          onEmergencyCommit={onEmergencyCommit}
          monthlyLivingExpense={monthlyLivingExpense}
          onMonthlyLivingExpenseChange={onMonthlyLivingExpenseChange}
          incomeRetentionPct={incomeRetentionPct}
          onIncomeRetentionPctChange={onIncomeRetentionPctChange}
        />
      </div>
    );
  }

  if (page === 12) {
    return (
      <div className="space-y-2">
        <p className={theme.pageTitle}>銀行談判健檢報告</p>
        <Quick11BankReportPanel isLight={isLight} loanYears={loanYears} />
      </div>
    );
  }

  if (page === 13) {
    return (
      <div className="space-y-2">
        <p className={theme.pageTitle}>央行升息連鎖反應</p>
        <Quick11RateHikePanel
          isLight={isLight}
          rateHikePreset={rateHikePreset}
          onRateHikePreset={onRateHikePreset}
          hikeMonthlyPayment={hikeMonthlyPayment}
          hikeDtiPct={hikeDtiPct}
          hikeTotalInterest={hikeTotalInterest}
          hikeInterestDelta={hikeInterestDelta}
          annualRate={annualRate}
          scenarioRate={resolveRateHikeScenarioRate(annualRate, rateHikePreset)}
        />
      </div>
    );
  }

  return null;
}
