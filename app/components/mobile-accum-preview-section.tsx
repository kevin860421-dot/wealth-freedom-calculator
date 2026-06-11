"use client";

import styles from "./mobile-accum-preview-section.module.css";

export type MobileAccumPeriodPreview = {
  row: { periodLabel: string };
  i: number;
  dividendThisGross: number;
  totalInflowThisPeriod: number;
  balanceBalVal: number;
};

export type MobileAccumPreviewSectionProps = {
  /** 最近一期（預設顯示） */
  recent: MobileAccumPeriodPreview | null;
  /** 近一期之前的最多 10 期 */
  priorTen: MobileAccumPeriodPreview[];
  showPriorTen: boolean;
  onTogglePriorTen: () => void;
  onOpenFullTable: () => void;
};

function PeriodFields({ d }: { d: MobileAccumPeriodPreview }) {
  const hasDiv = d.dividendThisGross > 0;
  return (
    <div className={styles.fields}>
      <div className={styles.field}>
        <div className={styles.fieldLabel}>股利</div>
        <div className={styles.fieldValue}>
          {hasDiv ? Math.round(d.dividendThisGross).toLocaleString("zh-TW") : "—"}
          {hasDiv ? <span className={styles.fieldUnit}> 元</span> : null}
        </div>
      </div>
      <div className={styles.field}>
        <div className={styles.fieldLabel}>本期投入</div>
        <div className={styles.fieldValue}>
          {Math.round(d.totalInflowThisPeriod).toLocaleString("zh-TW")}
          <span className={styles.fieldUnit}> 元</span>
        </div>
      </div>
      <div className={styles.field}>
        <div className={styles.fieldLabel}>總資產</div>
        <div className={styles.fieldValue}>
          {Math.round(d.balanceBalVal).toLocaleString("zh-TW")}
          <span className={styles.fieldUnit}> 元</span>
        </div>
      </div>
    </div>
  );
}

function PeriodCard({ d, periodNum }: { d: MobileAccumPeriodPreview; periodNum: number }) {
  const hasDiv = d.dividendThisGross > 0;
  return (
    <div className={`${styles.recentCard} ${hasDiv ? styles.recentCardDividend : ""}`}>
      <div className={styles.recentHead}>
        <div className={styles.recentTitle}>
          <span className={styles.periodLabel}>{d.row.periodLabel}</span>
        </div>
        <span className={styles.periodBadge} aria-label={`試算第 ${periodNum} 期`}>
          第 {periodNum} 期
        </span>
      </div>
      <PeriodFields d={d} />
    </div>
  );
}

/** 手機：累積金額與股數表精簡預覽（近一期 → 可展開最近10期 → 展開後才顯示查看完整明細） */
export function MobileAccumPreviewSection({
  recent,
  priorTen,
  showPriorTen,
  onTogglePriorTen,
  onOpenFullTable,
}: MobileAccumPreviewSectionProps) {
  if (!recent) return null;

  const recentPeriodNum = recent.i + 1;

  const openFull = () => {
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("calc-engagement"));
    onOpenFullTable();
  };

  const hasDiv = recent.dividendThisGross > 0;

  return (
    <section className={styles.root} aria-label="累積金額與股數表">
      <h2 className={styles.title}>累積金額與股數表</h2>

      <div className={`${styles.recentCard} ${hasDiv ? styles.recentCardDividend : ""}`}>
        <div className={styles.recentHead}>
          <div className={styles.recentTitle}>
            近一期
            <span className={styles.periodLabel}>{recent.row.periodLabel}</span>
          </div>
          <span className={styles.periodBadge} aria-label={`試算第 ${recentPeriodNum} 期`}>
            第 {recentPeriodNum} 期
          </span>
        </div>
        <PeriodFields d={recent} />
      </div>

      {priorTen.length > 0 ? (
        <div className={styles.futureBlock}>
          <button type="button" className={styles.toggleFuture} onClick={onTogglePriorTen}>
            {showPriorTen ? "▲ 收合最近10期" : "▼ 展開最近10期"}
          </button>
          {showPriorTen ? (
            <div className={styles.futureList}>
              <h3 className={styles.futureHeading}>最近10期</h3>
              {priorTen.map((d) => (
                <PeriodCard key={d.i} d={d} periodNum={d.i + 1} />
              ))}
              <button type="button" className={styles.primaryBtn} onClick={openFull}>
                查看完整明細
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
