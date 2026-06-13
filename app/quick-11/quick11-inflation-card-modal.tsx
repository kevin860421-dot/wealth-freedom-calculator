"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatMoney } from "./logic";
import styles from "./quick11-inflation-card-modal.module.css";

export type InflationCardModalKind = "nominal" | "real" | "opportunity";

export type Quick11InflationCardModalProps = {
  open: boolean;
  kind: InflationCardModalKind | null;
  onClose: () => void;
  isLight?: boolean;
  scenarioYears: number;
  inflationPct: number;
  returnPct: number;
  nominalTotal: number;
  realPresentValue: number;
  opportunityFv: number;
  monthlyPayment: number;
};

function fmtWan(n: number) {
  const wan = Math.round(n / 10_000);
  return `${wan.toLocaleString("zh-TW")} 萬`;
}

function ModalCopy(props: Quick11InflationCardModalProps) {
  const {
    kind,
    isLight = false,
    scenarioYears,
    inflationPct,
    returnPct,
    nominalTotal,
    realPresentValue,
    opportunityFv,
    monthlyPayment,
  } = props;

  const hl = isLight ? styles.highlightLight : styles.highlightDark;

  if (kind === "nominal") {
    return (
      <>
        <h2 id="q11-inflation-modal-title" className={`${styles.title} ${isLight ? styles.titleLight : styles.titleDark}`}>
          🧾 {scenarioYears} 年名義總還款細節
        </h2>
        <p className={`${styles.body} ${isLight ? styles.bodyLight : styles.bodyDark}`}>
          這是您 {scenarioYears} 年來實打實從口袋掏出、還給銀行的「本金 + 利息」總和。目前試算約{" "}
          <span className={`${styles.highlight} ${hl}`}>NT$ {formatMoney(nominalTotal)}</span>。
        </p>
        <p className={`${styles.formula} ${isLight ? styles.formulaLight : styles.formulaDark}`}>
          房貸月付金 NT$ {formatMoney(monthlyPayment)} × 12 個月 × {scenarioYears} 年 ≈ 名義總還款（本息均攤／本金平均明細加總）。
        </p>
      </>
    );
  }

  if (kind === "real") {
    return (
      <>
        <h2 id="q11-inflation-modal-title" className={`${styles.title} ${isLight ? styles.titleLight : styles.titleDark}`}>
          📉 什麼是通膨折現？
        </h2>
        <p className={`${styles.body} ${isLight ? styles.bodyLight : styles.bodyDark}`}>
          因為通貨膨脹，未來的錢會越來越「薄」。以年通膨 {inflationPct.toFixed(1)}% 試算，{scenarioYears} 年累計名義還款約{" "}
          <span className={`${styles.highlight} ${hl}`}>{fmtWan(nominalTotal)}</span>，折成今日購買力約{" "}
          <span className={`${styles.highlight} ${hl}`}>{fmtWan(realPresentValue)}</span>。通膨會悄悄降低您實質還款壓力（示意）。
        </p>
        <p className={`${styles.formula} ${isLight ? styles.formulaLight : styles.formulaDark}`}>
          PV = Σ 每月月付 ÷ (1 + 月通膨率)^期數
        </p>
      </>
    );
  }

  return (
    <>
      <h2 id="q11-inflation-modal-title" className={`${styles.title} ${isLight ? styles.titleLight : styles.titleDark}`}>
        🚀 錯過的機會成本（複利魔術）
      </h2>
      <p className={`${styles.body} ${isLight ? styles.bodyLight : styles.bodyDark}`}>
        如果您不買這間房，而是把每個月原本要繳的房貸月付金（約 NT$ {formatMoney(monthlyPayment)}）固定拿去投資（如台股／美股
        ETF），在年化 {returnPct.toFixed(1)}% 的設定下，{scenarioYears} 年後這筆錢會滾成約{" "}
        <span className={`${styles.highlight} ${hl}`}>{fmtWan(opportunityFv)}</span> 的終極資產（示意，未含稅費與波動）！
      </p>
      <p className={`${styles.formula} ${isLight ? styles.formulaLight : styles.formulaDark}`}>
        每期月付逐月複利累積 FV；報酬率愈高，終值呈幾何級成長。
      </p>
    </>
  );
}

export function Quick11InflationCardModal(props: Quick11InflationCardModalProps) {
  const { open, kind, onClose, isLight = false } = props;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && kind ? (
        <div className={styles.overlay} role="presentation">
          <motion.button
            type="button"
            aria-label="關閉說明"
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="q11-inflation-modal-title"
            className={`${styles.panel} ${isLight ? styles.panelLight : styles.panelDark}`}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={`${styles.closeBtn} ${isLight ? styles.closeBtnLight : styles.closeBtnDark}`}
              aria-label="關閉"
              onClick={onClose}
            >
              ✕
            </button>
            <ModalCopy {...props} />
            <p className={`${styles.footerNote} ${isLight ? styles.footerNoteLight : styles.footerNoteDark}`}>
              * 以上為情境試算白話說明，個案以實際合約與法令為準。
            </p>
          </motion.section>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
