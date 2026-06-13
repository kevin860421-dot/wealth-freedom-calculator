"use client";

import { useMemo } from "react";
import styles from "./quick11-bank-report-panel.module.css";

const CHECKLIST = [
  { id: "amort", template: (periods: number) => `${periods} 期房貸本息均攤攤銷明細表` },
  { id: "airbag", label: "財務安全氣囊抗風險壓力測試報告" },
  { id: "inflation", label: "通膨折現與機會成本複利翻轉模型" },
] as const;

export type Quick11BankReportPanelProps = {
  isLight?: boolean;
  loanYears: number;
};

export function Quick11BankReportPanel(props: Quick11BankReportPanelProps) {
  const { isLight = false, loanYears } = props;

  const periods = useMemo(() => Math.max(1, Math.round(loanYears * 12)), [loanYears]);

  const items = useMemo(
    () =>
      CHECKLIST.map((item) => ({
        id: item.id,
        label: "template" in item ? item.template(periods) : item.label,
      })),
    [periods],
  );

  return (
    <div className={styles.wrap}>
      <div className={`${styles.reportCard} ${isLight ? styles.reportCardLight : styles.reportCardDark}`}>
        <p className={`${styles.cardTitle} ${isLight ? styles.cardTitleLight : styles.cardTitleDark}`}>完整財務報告內含</p>
        <ul className={styles.checklist}>
          {items.map((item) => (
            <li key={item.id} className={`${styles.checkItem} ${isLight ? styles.checkItemLight : styles.checkItemDark}`}>
              <span className={styles.checkMark} aria-hidden>
                ✓
              </span>
              <span className={styles.checkText}>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className={`${styles.hook} ${isLight ? styles.hookLight : styles.hookDark}`}>
        💡 網頁僅供初步壓力測試。如需作為買房規劃或提供銀行審查，建議匯出完整數據報表。
      </p>
    </div>
  );
}
