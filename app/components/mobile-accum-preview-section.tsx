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
  /** 近一期（當月） */
  recent: MobileAccumPeriodPreview | null;
  /** 自當月起算，往後最多 10 期（不含近一期） */
  nextTen: MobileAccumPeriodPreview[];
  /** 試算表列索引：當月錨點（近一期＝第 1 期） */
  periodBaseIndex: number;
  showNextTen: boolean;
  onToggleNextTen: () => void;
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

/** 手機：累積金額與股數表精簡預覽（當月近一期 → 可展開未來10期） */
export function MobileAccumPreviewSection({
  recent,
  nextTen,
  periodBaseIndex,
  showNextTen,
  onToggleNextTen,
  onOpenFullTable,
}: MobileAccumPreviewSectionProps) {
  if (!recent) return null;

  const toDisplayPeriod = (rowIndex: number) => rowIndex - periodBaseIndex + 1;
  const recentPeriodNum = toDisplayPeriod(recent.i);
  const nextCount = nextTen.length;
  const futureHeading = nextCount >= 10 ? "未來10期" : `未來${nextCount}期`;
  const toggleLabel = showNextTen
    ? nextCount >= 10
      ? "▲ 收合未來10期"
      : `▲ 收合未來${nextCount}期`
    : nextCount >= 10
      ? "▼ 展開未來10期"
      : `▼ 展開未來${nextCount}期`;

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

      {nextTen.length > 0 ? (
        <div className={styles.futureBlock}>
          <button type="button" className={styles.toggleFuture} onClick={onToggleNextTen}>
            {toggleLabel}
          </button>
          {showNextTen ? (
            <div className={styles.futureList}>
              <h3 className={styles.futureHeading}>{futureHeading}</h3>
              {nextTen.map((d) => (
                <PeriodCard key={d.i} d={d} periodNum={toDisplayPeriod(d.i)} />
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
