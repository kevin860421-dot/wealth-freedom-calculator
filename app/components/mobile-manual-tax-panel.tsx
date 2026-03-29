"use client";

import { useState } from "react";
import { ManualTaxTopControls, type ManualTaxBlockProps } from "./manual-tax-block";
import { MobileTaxEstimateDetails } from "./mobile-tax-estimate-details";
import panelStyles from "./tax-settings-panel.module.css";
import styles from "./mobile-manual-tax-panel.module.css";

export function MobileManualTaxPanel(props: ManualTaxBlockProps) {
  const { mergeTaxOpen, setMergeTaxOpen, separateTaxOpen, setSeparateTaxOpen, deductionEstimate } = props;
  const [detailOpen, setDetailOpen] = useState(false);
  const net = deductionEstimate?.netPerPeriod;

  return (
    <div className={panelStyles.manualShell}>
      <div className={styles.innerPad}>
        <ManualTaxTopControls {...props} />

        <div className={styles.cardRow} role="group" aria-label="課稅方式">
          <button
            type="button"
            className={`${styles.taxCard} ${mergeTaxOpen ? styles.taxCardSelected : ""}`}
            onClick={() => {
              setMergeTaxOpen(true);
              setSeparateTaxOpen(false);
            }}
          >
            <span className={styles.taxCardTitle}>合併課稅</span>
            <span className={styles.taxCardSub}>適合一般上班族</span>
          </button>
          <button
            type="button"
            className={`${styles.taxCard} ${separateTaxOpen ? styles.taxCardSelected : ""}`}
            onClick={() => {
              setSeparateTaxOpen(true);
              setMergeTaxOpen(false);
            }}
          >
            <span className={styles.taxCardTitle}>分離課稅</span>
            <span className={styles.taxCardSub}>適合高收入者</span>
          </button>
        </div>

        <div className={styles.youGet}>
          <span className={styles.youGetLabel}>你實拿</span>
          <div className={styles.youGetNum}>{net != null ? `${Math.round(net).toLocaleString("zh-TW")} 元` : "—"}</div>
        </div>

        <button type="button" className={styles.disclosureBtn} onClick={() => setDetailOpen((o) => !o)} aria-expanded={detailOpen}>
          {detailOpen ? "收合說明" : "ℹ️ 查看計算方式"}
        </button>
        <div className={`${styles.disclosureWrap} ${detailOpen ? styles.disclosureOpen : styles.disclosureCollapsed}`} aria-hidden={!detailOpen}>
          <div className={styles.disclosureInner}>
            <MobileTaxEstimateDetails {...props} />
          </div>
        </div>
      </div>
    </div>
  );
}
