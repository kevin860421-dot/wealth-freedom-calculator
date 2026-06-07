"use client";

import Link from "next/link";
import {
  QUICK11_SUCCESS_BLOG_PATH,
  QUICK11_SUCCESS_BLOG_TITLE,
} from "@/lib/quick11-marketing";
import styles from "./quick11-excel-lead-block.module.css";
import { isQuick11WizardStepDone, useQuick11WizardProgress } from "./quick11-wizard-state";

/** Excel 內容實際有的試算表（不夸大 ETF 等未含工作表） */
const EXCEL_FEATURES = [
  { icon: "🛡️", bg: "bg-emerald-500/20 ring-1 ring-emerald-400/25", title: "破產預警", desc: "負債比一目了然" },
  { icon: "🏦", bg: "bg-sky-500/20 ring-1 ring-sky-400/25", title: "本息攤還", desc: "均攤／本金平均" },
  { icon: "✏️", bg: "bg-amber-500/20 ring-1 ring-amber-400/25", title: "Excel 公式", desc: "離線改參數" },
] as const;

type Quick11ExcelLeadBlockProps = {
  isLight?: boolean;
  compact?: boolean;
  onOpenWizard: () => void;
};

/** 破產計算機底部：領取公式版 Excel 入口 → 四步驟彈窗 */
export function Quick11ExcelLeadBlock({ isLight = false, compact = false, onOpenWizard }: Quick11ExcelLeadBlockProps) {
  const { progress } = useQuick11WizardProgress();
  const started = progress.screenshotDone || progress.shareDone || progress.copyDone || progress.fbOpened;
  const finished = progress.activeStep >= 5;

  const ctaLabel = finished
    ? "🎉 四步驟已完成 · 查看進度"
    : started
      ? "▶ 繼續四步驟領取 Excel"
      : "🎁 立即領取完整版 Excel ›";

  return (
    <div className={`${styles.card} ${isLight ? styles.cardLight : ""}`}>
      <div className={styles.head}>
        <span className={styles.giftIcon} aria-hidden>
          🎁
        </span>
        <div className="min-w-0 flex-1">
          <p className={`${styles.title} ${isLight ? styles.titleLight : ""}`}>
            免費領取 <span className={styles.titleAccent}>完整版 Excel</span>
          </p>
        </div>
      </div>

      <div className={styles.featureGrid}>
        {EXCEL_FEATURES.map((item) => (
          <div key={item.title} className={styles.featureItem}>
            <div className={`${styles.featureIcon} ${item.bg}`}>{item.icon}</div>
            <p className={`${styles.featureTitle} ${isLight ? styles.featureTitleLight : ""}`}>{item.title}</p>
            <p className={`${styles.featureDesc} ${isLight ? styles.featureDescLight : ""}`}>{item.desc}</p>
          </div>
        ))}
      </div>

      <button type="button" onClick={onOpenWizard} className={`${styles.cta} ${isLight ? styles.ctaLight : ""}`}>
        {ctaLabel}
      </button>

      {started && !finished ? (
        <p className={styles.progress}>
          進行中：步驟 {Math.min(progress.activeStep, 4)} / 4
          {isQuick11WizardStepDone(2, progress) ? " · 回來可繼續第三步" : ""}
        </p>
      ) : null}

      {!compact ? (
        <p className={`${styles.blogLink} ${isLight ? styles.blogLinkLight : ""}`}>
          📌 延伸閱讀「
          <Link href={QUICK11_SUCCESS_BLOG_PATH} className="font-bold underline underline-offset-2">
            {QUICK11_SUCCESS_BLOG_TITLE}
          </Link>
          」——用時間軸拆扣款，邏輯可套回 DTI 與總利息。
        </p>
      ) : null}
    </div>
  );
}
