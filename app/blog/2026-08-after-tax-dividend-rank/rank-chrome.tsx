"use client";

import type { ReactNode } from "react";
import { BlogAfterTaxRankPeriodPicker } from "../blog-after-tax-rank-period-picker";
import styles from "./report.module.css";

type Props = {
  headline: string;
  defaultYear: number;
  defaultMonth: number;
  author: string;
  asOf: string;
  children: ReactNode;
};

export function BlogAfterTaxRankChrome({
  headline,
  defaultYear,
  defaultMonth,
  author,
  asOf,
  children,
}: Props) {
  return (
    <>
      <header className={styles.reportHeader}>
        <p className={styles.meta}>
          <span>作者 {author}</span>
          <span className={styles.metaRail}>
            {defaultYear}年{defaultMonth}月榜單 · 資料截止 {asOf}
          </span>
        </p>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{headline}</h1>
          <div className={styles.headerRail}>
            <BlogAfterTaxRankPeriodPicker
              currentYear={defaultYear}
              currentMonth={defaultMonth}
            />
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
