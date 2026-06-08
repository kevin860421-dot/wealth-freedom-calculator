"use client";

import { formatMoney } from "./logic";
import {
  Quick11EarlyRepayWhitePage,
  Quick11GraceDelayWhitePage,
  Quick11LumpSumWhitePage,
} from "./quick11-white-repay-pages";
import { getQ11Theme } from "./quick11-white-theme";

type Props = {
  page: 3 | 4 | 5;
  isLight?: boolean;
  /** 提前還款 */
  earlyStartMonth: number;
  earlyStartMonthText: string;
  extraMonthlyPayment: number;
  extraMonthlyText: string;
  earlySavedMonths: number;
  earlySavedInterest: number;
  maxStartMonth: number;
  loanYears: number;
  prepayMonths: number;
  onEarlyStartMonthText: (v: string) => void;
  onEarlyStartMonthCommit: () => void;
  onEarlyStartMonthSlider: (v: number) => void;
  onExtraChange: (v: number) => void;
  onExtraTextChange: (v: string) => void;
  /** 大額還款 */
  lumpAtYear: number;
  lumpAtYearText: string;
  lumpSumAmount: number;
  lumpSumText: string;
  loanAmount: number;
  lumpSavedMonths: number;
  lumpSavedInterest: number;
  lumpSliderStep: number;
  onLumpAtYearText: (v: string) => void;
  onLumpAtYearCommit: () => void;
  onLumpTextChange: (v: string) => void;
  onLumpCommit: () => void;
  onLumpSlider: (v: number) => void;
  /** 寬限期 */
  graceYears: number;
  graceYearsText: string;
  graceMaxYears: number;
  graceDelayMetrics: {
    planBInterestOnlyMonthly: number;
    planBAfterGraceMonthly: number;
    paymentIncreasePct: number;
    interestIncrease: number;
  };
  onGraceYearsText: (v: string) => void;
  onGraceYearsCommit: () => void;
  onGraceYearsSlider: (y: number) => void;
};

const PAGE_TITLE: Record<3 | 4 | 5, string> = {
  3: "提前還款",
  4: "大額還款",
  5: "延遲還款代價",
};

export function Quick11RepayTabPanels(props: Props) {
  const { page, isLight = true } = props;
  const theme = getQ11Theme(isLight);

  return (
    <div className="space-y-3 font-['Microsoft_JhengHei','微軟正黑體',sans-serif]">
      <p className={theme.pageTitle}>{PAGE_TITLE[page]}</p>

      {page === 3 ? (
        <Quick11EarlyRepayWhitePage
          isLight={isLight}
          startMonth={props.earlyStartMonth}
          startMonthText={props.earlyStartMonthText}
          maxStartMonth={props.maxStartMonth}
          extraMonthly={props.extraMonthlyPayment}
          extraText={props.extraMonthlyText}
          loanYears={props.loanYears}
          prepayMonths={props.prepayMonths}
          savedMonths={props.earlySavedMonths}
          savedInterest={props.earlySavedInterest}
          onStartMonthText={props.onEarlyStartMonthText}
          onStartMonthCommit={props.onEarlyStartMonthCommit}
          onStartMonthSlider={props.onEarlyStartMonthSlider}
          onExtraChange={(v) => {
            props.onExtraChange(v);
            props.onExtraTextChange(formatMoney(v));
          }}
        />
      ) : null}

      {page === 4 ? (
        <Quick11LumpSumWhitePage
          isLight={isLight}
          lumpAtYear={props.lumpAtYear}
          lumpAtYearText={props.lumpAtYearText}
          lumpAmount={props.lumpSumAmount}
          lumpText={props.lumpSumText}
          loanAmount={props.loanAmount}
          savedMonths={props.lumpSavedMonths}
          savedInterest={props.lumpSavedInterest}
          onYearText={props.onLumpAtYearText}
          onYearCommit={props.onLumpAtYearCommit}
          onLumpText={props.onLumpTextChange}
          onLumpCommit={props.onLumpCommit}
          onLumpSlider={props.onLumpSlider}
          lumpSliderStep={props.lumpSliderStep}
        />
      ) : null}

      {page === 5 ? (
        <Quick11GraceDelayWhitePage
          isLight={isLight}
          graceYears={props.graceYears}
          graceYearsText={props.graceYearsText}
          graceMaxYears={props.graceMaxYears}
          interestOnlyMonthly={props.graceDelayMetrics.planBInterestOnlyMonthly}
          afterGraceMonthly={props.graceDelayMetrics.planBAfterGraceMonthly}
          paymentIncreasePct={props.graceDelayMetrics.paymentIncreasePct}
          interestIncrease={props.graceDelayMetrics.interestIncrease}
          onYearsText={props.onGraceYearsText}
          onYearsCommit={props.onGraceYearsCommit}
          onYearsSlider={props.onGraceYearsSlider}
        />
      ) : null}
    </div>
  );
}
