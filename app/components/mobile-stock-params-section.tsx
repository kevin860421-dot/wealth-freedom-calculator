"use client";

import { useEffect, useRef, useState } from "react";
import { StockParamsAdvancedBlock, type StockParamsAdvancedBlockProps } from "./stock-params-advanced-block";
import styles from "./mobile-stock-params-section.module.css";

export type MobileStockParamsSectionProps = {
  onRestoreDefaults: () => void;
  onOpenSaveTarget: () => void;
  onOpenLoadTarget: () => void;
  currentPrincipalStr: string;
  setCurrentPrincipalStr: (s: string) => void;
  commitFormulaWithCommas: (s: string) => string;
  parseFormula: (s: string) => number;
  monthlyContribution: string;
  setMonthlyContribution: (s: string) => void;
  monthlyExtra: string;
  setMonthlyExtra: (s: string) => void;
  commitFormula: (s: string) => string;
  annualReturnRate: number;
  setAnnualReturnRate: (n: number) => void;
  setRateSource: StockParamsAdvancedBlockProps["setRateSource"];
  rateSource: StockParamsAdvancedBlockProps["rateSource"];
  dividendYieldPct: StockParamsAdvancedBlockProps["dividendYieldPct"];
  stockDividendPct: StockParamsAdvancedBlockProps["stockDividendPct"];
  currentPrincipalNum: number;
  selectedEtfInfo: StockParamsAdvancedBlockProps["selectedEtfInfo"];
  advancedProps: StockParamsAdvancedBlockProps;
};

type FeedbackField = "principal" | "monthly" | "extra";

function formatDeltaYuan(delta: number): string {
  const n = Math.round(Math.abs(delta));
  const s = n.toLocaleString("zh-TW");
  if (delta > 0) return `+${s} 元`;
  if (delta < 0) return `−${s} 元`;
  return "";
}

/**
 * 手機版「存股參數設定」：基本四欄＋摘要卡＋摺疊進階（與 StockParamsAdvancedBlock 同源資料）。
 */
export function MobileStockParamsSection({
  onRestoreDefaults,
  onOpenSaveTarget,
  onOpenLoadTarget,
  currentPrincipalStr,
  setCurrentPrincipalStr,
  commitFormulaWithCommas,
  parseFormula,
  monthlyContribution,
  setMonthlyContribution,
  monthlyExtra,
  setMonthlyExtra,
  commitFormula,
  annualReturnRate,
  setAnnualReturnRate,
  setRateSource,
  rateSource,
  dividendYieldPct,
  stockDividendPct,
  currentPrincipalNum,
  selectedEtfInfo,
  advancedProps,
}: MobileStockParamsSectionProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const targetPrincipal = Math.floor(currentPrincipalNum);
  const displayRef = useRef(targetPrincipal);
  const [displayPrincipal, setDisplayPrincipal] = useState(targetPrincipal);
  const [summaryPulse, setSummaryPulse] = useState(false);
  const rafPrincipal = useRef<number | null>(null);

  const [feedback, setFeedback] = useState<{ field: FeedbackField; text: string } | null>(null);
  const feedbackHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFeedbackSnap = useRef(true);
  const prevSnap = useRef({ p: targetPrincipal, m: 0, e: 0 });

  const rateFromDividend =
    rateSource === "dividend" && (dividendYieldPct !== "" || stockDividendPct !== "");

  const sharesLine =
    selectedEtfInfo?.price != null && selectedEtfInfo.price > 0
      ? `約 ${Math.floor(currentPrincipalNum / selectedEtfInfo.price).toLocaleString("zh-TW")} 股`
      : "—";

  /** 摘要金額：數字 count-up（緩動），不變更計算邏輯 */
  useEffect(() => {
    const target = targetPrincipal;
    const from = displayRef.current;
    if (target === from) return;
    if (rafPrincipal.current != null) cancelAnimationFrame(rafPrincipal.current);
    const start = performance.now();
    const dur = 380;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - (1 - t) ** 3;
      const v = Math.round(from + (target - from) * eased);
      displayRef.current = v;
      setDisplayPrincipal(v);
      if (t < 1) rafPrincipal.current = requestAnimationFrame(step);
      else {
        rafPrincipal.current = null;
        displayRef.current = target;
        setDisplayPrincipal(target);
      }
    };
    rafPrincipal.current = requestAnimationFrame(step);
    setSummaryPulse(true);
    return () => {
      if (rafPrincipal.current != null) cancelAnimationFrame(rafPrincipal.current);
    };
  }, [targetPrincipal]);

  useEffect(() => {
    if (!summaryPulse) return;
    const t = window.setTimeout(() => setSummaryPulse(false), 420);
    return () => window.clearTimeout(t);
  }, [summaryPulse]);

  /** 即時變化提示（僅 UI，比對上一筆數值） */
  useEffect(() => {
    const m = parseFormula(monthlyContribution.replace(/,/g, ""));
    const e = parseFormula(monthlyExtra.replace(/,/g, ""));
    if (skipFeedbackSnap.current) {
      skipFeedbackSnap.current = false;
      prevSnap.current = { p: targetPrincipal, m, e };
      return;
    }
    const prev = prevSnap.current;
    let next: { field: FeedbackField; text: string } | null = null;
    const dp = targetPrincipal - prev.p;
    if (Math.abs(dp) >= 1) {
      next = { field: "principal", text: formatDeltaYuan(dp) };
    } else {
      const dm = m - prev.m;
      if (Math.abs(dm) >= 1) {
        next = dm >= 0 ? { field: "monthly", text: `每月多 ${Math.abs(dm).toLocaleString("zh-TW")} 元` } : { field: "monthly", text: `每月少 ${Math.abs(dm).toLocaleString("zh-TW")} 元` };
      } else {
        const de = e - prev.e;
        if (Math.abs(de) >= 1) {
          next =
            de >= 0
              ? { field: "extra", text: `加碼 +${Math.abs(de).toLocaleString("zh-TW")} 元` }
              : { field: "extra", text: `加碼 ${formatDeltaYuan(de)}` };
        }
      }
    }
    prevSnap.current = { p: targetPrincipal, m, e };
    if (next) {
      if (feedbackHideTimer.current) clearTimeout(feedbackHideTimer.current);
      setFeedback(next);
      feedbackHideTimer.current = setTimeout(() => setFeedback(null), 2200);
    }
  }, [targetPrincipal, monthlyContribution, monthlyExtra, parseFormula]);

  return (
    <section id="mobile-stock-params" className={styles.root} aria-labelledby="mobile-stock-params-title">
      <div className={styles.headRow}>
        <h2 id="mobile-stock-params-title" className={styles.title}>
          存股參數設定
        </h2>
        <div className={styles.headActions}>
          <button type="button" className={`${styles.linkText} ${styles.linkSave}`} onClick={onOpenSaveTarget}>
            加入標的
          </button>
          <button type="button" className={`${styles.linkText} ${styles.linkLoad}`} onClick={onOpenLoadTarget}>
            使用我的標的
          </button>
          <button type="button" className={`${styles.linkText} ${styles.linkRestore}`} onClick={onRestoreDefaults}>
            恢復預設值
          </button>
        </div>
      </div>

      <div className={styles.basicCard}>
        <p className={styles.sectionLabel}>① 基本設定</p>
        <div className={styles.basicFields}>
          <div className={styles.field}>
            <span className={styles.label}>當前本金 (TWD)</span>
            <div className={styles.fieldInputWrap}>
              {feedback?.field === "principal" ? (
                <span className={styles.feedbackPop} key={feedback.text}>
                  {feedback.text}
                </span>
              ) : null}
              <div className={`${styles.inputRow} ${styles.inputRowPrincipal}`}>
                <input
                  type="text"
                  inputMode="decimal"
                  value={currentPrincipalStr}
                  onChange={(e) => setCurrentPrincipalStr(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setCurrentPrincipalStr(commitFormulaWithCommas(currentPrincipalStr));
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  onBlur={() => setCurrentPrincipalStr(commitFormulaWithCommas(currentPrincipalStr))}
                  onFocus={(e) => e.target.select()}
                  className={`${styles.inputField} ${styles.inputFieldPrincipal}`}
                  placeholder="例如：200000"
                />
                <div className={`${styles.steps} ${styles.stepsPrincipal}`}>
                  <button
                    type="button"
                    aria-label="增加"
                    className={`${styles.stepBtn} ${styles.stepBtnPrincipal}`}
                    onClick={() => {
                      const n = Math.max(0, parseFormula(currentPrincipalStr) || 0);
                      const step = n > 100000 ? 5000 : 1000;
                      setCurrentPrincipalStr(Math.floor(n + step).toLocaleString("zh-TW"));
                    }}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label="減少"
                    className={`${styles.stepBtn} ${styles.stepBtnPrincipal}`}
                    onClick={() => {
                      const n = Math.max(0, parseFormula(currentPrincipalStr) || 0);
                      const step = n > 100000 ? 5000 : 1000;
                      setCurrentPrincipalStr(Math.floor(Math.max(0, n - step)).toLocaleString("zh-TW"));
                    }}
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>
            <p className={styles.hint}>可手動覆蓋，預設依起始本金＋第幾次投入累積計算</p>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>每月固定投入額 (TWD)</span>
            <div className={styles.fieldInputWrap}>
              {feedback?.field === "monthly" ? (
                <span className={styles.feedbackPop} key={feedback.text}>
                  {feedback.text}
                </span>
              ) : null}
              <div className={styles.inputRow}>
                <input
                  type="text"
                  inputMode="decimal"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setMonthlyContribution(commitFormula(monthlyContribution));
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className={styles.inputField}
                  placeholder="例如：12000"
                />
                <div className={styles.steps}>
                  <button
                    type="button"
                    aria-label="增加"
                    className={styles.stepBtn}
                    onClick={() => {
                      const n = Math.max(0, parseFormula(monthlyContribution) || 0);
                      const step = n > 100000 ? 5000 : 1000;
                      setMonthlyContribution(String(n + step));
                    }}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label="減少"
                    className={styles.stepBtn}
                    onClick={() => {
                      const n = Math.max(0, parseFormula(monthlyContribution) || 0);
                      const step = n > 100000 ? 5000 : 1000;
                      setMonthlyContribution(String(Math.max(0, n - step)));
                    }}
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>每月額外加碼／加班費 (TWD)</span>
            <div className={styles.fieldInputWrap}>
              {feedback?.field === "extra" ? (
                <span className={styles.feedbackPop} key={feedback.text}>
                  {feedback.text}
                </span>
              ) : null}
              <div className={styles.inputRow}>
                <input
                  type="text"
                  inputMode="decimal"
                  value={monthlyExtra}
                  onChange={(e) => setMonthlyExtra(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setMonthlyExtra(commitFormula(monthlyExtra));
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className={styles.inputField}
                  placeholder="例如：6000"
                />
                <div className={styles.steps}>
                  <button
                    type="button"
                    aria-label="增加"
                    className={styles.stepBtn}
                    onClick={() => {
                      const n = Math.max(0, parseFormula(monthlyExtra) || 0);
                      const step = n > 100000 ? 5000 : 1000;
                      setMonthlyExtra(String(n + step));
                    }}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label="減少"
                    className={styles.stepBtn}
                    onClick={() => {
                      const n = Math.max(0, parseFormula(monthlyExtra) || 0);
                      const step = n > 100000 ? 5000 : 1000;
                      setMonthlyExtra(String(Math.max(0, n - step)));
                    }}
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>年化報酬率 (%)</span>
            <div
              className={`${styles.inputRow} ${styles.inputRowRate} ${rateFromDividend ? styles.inputRowDimmed : ""}`}
            >
              <input
                type="number"
                min={0}
                step={0.1}
                value={annualReturnRate === 0 ? "" : annualReturnRate}
                onChange={(e) => {
                  const v = e.target.value;
                  setAnnualReturnRate(v === "" ? 0 : Number(v) || 0);
                  setRateSource("annual");
                }}
                onFocus={(e) => e.target.select()}
                className={`${styles.inputField} ${styles.inputFieldRate}`}
              />
            </div>
            <p className={styles.rateHint}>7%～10% 約為長期市場常見區間；7.2% 約 10 年翻倍（複利示意）。</p>
          </div>
        </div>
      </div>

      <div className={`${styles.summaryCard} ${summaryPulse ? styles.summaryPulse : ""}`}>
        <p className={styles.summaryLabel}>當前本金</p>
        <p className={styles.summaryAmount}>{displayPrincipal.toLocaleString("zh-TW")} 元</p>
        <p className={styles.summarySub}>({sharesLine})</p>
      </div>

      <div className={styles.advancedShell}>
        <button
          type="button"
          className={styles.advancedToggle}
          aria-expanded={advancedOpen}
          onClick={() => setAdvancedOpen((o) => !o)}
        >
          <span className={styles.advancedToggleText}>
            進階設定（選填）
            <span className={styles.advancedToggleSub}>一般可略過</span>
          </span>
          <span className={`${styles.chevron} ${advancedOpen ? styles.chevronOpen : ""}`} aria-hidden>
            ▼
          </span>
        </button>
        <p className={styles.advancedLead}>不調整也可正常計算 · 預設已適用多數情境</p>
        <div
          className={`${styles.advancedPanel} ${advancedOpen ? styles.advancedPanelOpen : ""}`}
          aria-hidden={!advancedOpen}
        >
          <div className={styles.advancedPanelInner}>
            <StockParamsAdvancedBlock
              {...advancedProps}
              showAnnualInEtfRow={false}
              showInlinePrincipalCard={false}
              stackEtfRow
              mobileGrouped
            />
          </div>
        </div>
      </div>
    </section>
  );
}
