"use client";

import styles from "./mobile-fire-countdown-section.module.css";

export type MobileFireCountdownSectionProps = {
  fireEtaStr: string;
  fireEtaTargetDateStr: string;
  freedomAchieved: boolean;
  showMonthlySuggestion: boolean;
  targetYearsToAchieveNum: number;
  requiredMonthlyToAchieveInYears: number | null;
  compareYears: number;
  noInvestBalance: number;
  investBalance: number;
  diffVsNoInvest: number;
};

/** 手機：達成目標＋存股比較（固定於目標 Tab 下方，切換模式不隱藏） */
export function MobileFireCountdownSection({
  fireEtaStr,
  fireEtaTargetDateStr,
  freedomAchieved,
  showMonthlySuggestion,
  targetYearsToAchieveNum,
  requiredMonthlyToAchieveInYears,
  compareYears,
  noInvestBalance,
  investBalance,
  diffVsNoInvest,
}: MobileFireCountdownSectionProps) {
  return (
    <div className={styles.root} aria-label="達成目標與存股比較">
      <div className={styles.goalCol}>
        <h2 className={styles.heading}>達成目標</h2>
        <p className={styles.countdown}>
          {fireEtaStr !== "—" ? `剩下 ${fireEtaStr}` : fireEtaStr}
        </p>
        <p className={styles.targetDate}>預計 {fireEtaTargetDateStr} 達成</p>
        {freedomAchieved ? <p className={styles.achieved}>已達成</p> : null}
        {showMonthlySuggestion && requiredMonthlyToAchieveInYears != null ? (
          <p className={styles.suggestion}>
            若要在 {targetYearsToAchieveNum} 年內達成，建議每月投入約{" "}
            {requiredMonthlyToAchieveInYears.toLocaleString("zh-TW")} 元
          </p>
        ) : null}
      </div>
      <div className={styles.compareCol}>
        <h2 className={styles.headingCompare}>{compareYears} 年存股比較</h2>
        <div className={styles.compareRows}>
          <div className={styles.compareRow}>
            <span className={styles.compareLabel}>不存股</span>
            <strong className={styles.compareValueNeutral}>
              {noInvestBalance.toLocaleString("zh-TW")} 元
            </strong>
          </div>
          <div className={styles.compareRow}>
            <span className={styles.compareLabel}>存股</span>
            <strong className={styles.compareValueGreen}>
              {investBalance.toLocaleString("zh-TW")} 元
            </strong>
          </div>
          <div className={`${styles.compareRow} ${styles.compareRowDivider}`}>
            <span className={styles.compareLabel}>差額</span>
            <strong
              className={diffVsNoInvest >= 0 ? styles.compareValueGreen : styles.compareValueRed}
            >
              {diffVsNoInvest >= 0 ? "+" : ""}
              {diffVsNoInvest.toLocaleString("zh-TW")} 元
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
