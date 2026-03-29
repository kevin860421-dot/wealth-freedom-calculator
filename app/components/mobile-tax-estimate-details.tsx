"use client";

import { useState, type ReactNode } from "react";
import {
  ManualTaxEstimateBracketRow,
  ManualTaxEstimatePriceRow,
  ManualTaxEstimateTaxAndSharesColumn,
  type DeductionEstimateForPanel,
  type ManualTaxBlockProps,
} from "./manual-tax-block";
import styles from "./mobile-tax-estimate-details.module.css";

function SimplifiedSteps({ de, taxThreshold }: { de: DeductionEstimateForPanel; taxThreshold: number }) {
  const div = Math.round(de.estimatedDividend);
  const parts: ReactNode[] = [];
  parts.push(
    <p key="div">
      👉 預估當期股利：<strong>{div.toLocaleString("zh-TW")}</strong> 元
    </p>,
  );
  if (de.nhi2Countable != null) {
    parts.push(
      <p key="cnt">
        👉 計入股利（試算）：<strong>{Math.round(de.nhi2Countable).toLocaleString("zh-TW")}</strong> 元（{de.ratioPct}%）
      </p>,
    );
  }
  if (de.estimatedDividend < taxThreshold) {
    parts.push(
      <p key="taxb">
        👉 → 單期股利未達 {taxThreshold.toLocaleString("zh-TW")} 元門檻 → 稅金試算 <strong>{de.taxAmount.toLocaleString("zh-TW")}</strong> 元
      </p>,
    );
  } else {
    parts.push(
      <p key="taxa">
        👉 → 稅金試算：<strong>{de.taxAmount.toLocaleString("zh-TW")}</strong> 元
      </p>,
    );
  }
  if (de.nhi2Amount === 0) {
    parts.push(<p key="nhi">👉 → 未達門檻 → 不扣二代健保</p>);
  } else {
    parts.push(
      <p key="nhi2">
        👉 → 二代健保：<strong>{de.nhi2Amount.toLocaleString("zh-TW")}</strong> 元
      </p>,
    );
  }
  return <div className={styles.simpleLines}>{parts}</div>;
}

export function MobileTaxEstimateDetails(props: ManualTaxBlockProps) {
  const { deductionEstimate, taxThreshold } = props;
  const [fullOpen, setFullOpen] = useState(false);

  if (!deductionEstimate) {
    return <p className={styles.empty}>調整總股價或年化後，會顯示試算明細。</p>;
  }

  const de = deductionEstimate;
  const net = Math.round(de.netPerPeriod);
  const tax = de.taxAmount;

  return (
    <div className={styles.root}>
      <div className={styles.resultCard}>
        <span className={styles.resultPrimaryLabel}>實拿（試算）</span>
        <p className={styles.resultPrimary}>{net.toLocaleString("zh-TW")} 元</p>
        <p className={styles.resultSecondary}>
          <span className={styles.resultSecondaryLabel}>稅金</span>
          {tax.toLocaleString("zh-TW")} 元
        </p>
      </div>

      <div className={styles.inputBlock}>
        <span className={styles.inputLabel}>總股價（試算）</span>
        <ManualTaxEstimatePriceRow
          {...props}
          rowClassName={styles.priceRow}
          stacked
          priceInputStyle={{ width: "100%", minHeight: 36, fontSize: 14 }}
        />
        <p className={styles.hint}>👉 即時更新結果</p>
      </div>

      <div className={styles.simpleBlock}>
        <div className={styles.simpleHead}>👉 簡單步驟：</div>
        <SimplifiedSteps de={de} taxThreshold={taxThreshold} />
      </div>

      <button type="button" className={styles.fullBtn} onClick={() => setFullOpen((o) => !o)} aria-expanded={fullOpen}>
        {fullOpen ? "收合完整計算" : "ℹ️ 查看完整計算"}
      </button>
      <div className={`${styles.fullPanel} ${fullOpen ? styles.fullOpen : styles.fullCollapsed}`} aria-hidden={!fullOpen}>
        <div className={styles.fullInner}>
          <ManualTaxEstimateBracketRow {...props} />
          <div style={{ marginTop: 8 }}>
            <ManualTaxEstimateTaxAndSharesColumn {...props} />
          </div>
        </div>
      </div>
    </div>
  );
}
