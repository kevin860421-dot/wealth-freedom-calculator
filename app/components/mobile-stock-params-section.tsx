"use client";

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatApproxSharesLine, type TickerPreset } from "../ticker-presets";
import { StockParamsAdvancedBlock, type StockParamsAdvancedBlockProps } from "./stock-params-advanced-block";
import { MobileSmartVoiceBlock } from "./mobile-smart-voice-block";
import { moneyStep, StepperTextField, type MoneySliderConfig } from "./mobile-stepper-fields";
import styles from "./mobile-stock-params-section.module.css";

export type MobileStockParamsSectionProps = {
  fireEtaYears: number | null;
  fireEtaMonths: number | null;
  etaComputing?: boolean;
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

function hasFilledAmount(raw: string, parseFormula: (s: string) => number): boolean {
  const t = raw.trim().replace(/,/g, "");
  if (t === "") return false;
  const n = parseFormula(t);
  return Number.isFinite(n) && n >= 0;
}

/**
 * 手機版「存股參數設定」：基本四欄＋摘要卡＋摺疊進階（與 StockParamsAdvancedBlock 同源資料）。
 */
function formatEtaBracket(years: number | null, months: number | null): string {
  if (years == null) return "40 年內尚難達成";
  if (months != null && months > 0) return `${years} 年 ${months} 個月`;
  return `${years} 年`;
}

type StockParamsActionButtonsProps = {
  saveTargetReady: boolean;
  onOpenSaveTarget: () => void;
  onOpenLoadTarget: () => void;
  onRestoreDefaults: () => void;
  className?: string;
  id?: string;
};

const actionBtnLayout = "w-full min-w-0 text-center text-xs py-2 leading-tight";

const StockParamsActionButtons = forwardRef<HTMLDivElement, StockParamsActionButtonsProps>(function StockParamsActionButtons(
  {
    saveTargetReady,
    onOpenSaveTarget,
    onOpenLoadTarget,
    onRestoreDefaults,
    className,
    id,
  },
  ref,
) {
  return (
    <div ref={ref} id={id} className={`grid w-full grid-cols-3 gap-2 items-stretch ${className ?? ""}`}>
      <button
        type="button"
        className={`${actionBtnLayout} ${styles.linkText} ${saveTargetReady ? styles.linkSave : styles.linkSavePending}`}
        disabled={!saveTargetReady}
        aria-disabled={!saveTargetReady}
        title={
          saveTargetReady
            ? "將目前試算存入籃位"
            : "請先選擇 ETF，並填完下方本金、月投、加碼與報酬／殖利率"
        }
        onClick={() => {
          if (saveTargetReady) onOpenSaveTarget();
        }}
      >
        加入標的
      </button>
      <button
        type="button"
        className={`${actionBtnLayout} ${styles.linkText} ${styles.linkLoad}`}
        onClick={onOpenLoadTarget}
      >
        使用我的標的
      </button>
      <button
        type="button"
        className={`${actionBtnLayout} ${styles.linkText} ${styles.linkRestore}`}
        onClick={onRestoreDefaults}
      >
        恢復預設值
      </button>
    </div>
  );
});

export function MobileStockParamsSection({
  fireEtaYears,
  fireEtaMonths,
  etaComputing = false,
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
  annualReturnRate,
  rateSource,
  dividendYieldPct,
  stockDividendPct,
  currentPrincipalNum,
  selectedEtfInfo,
  advancedProps,
}: MobileStockParamsSectionProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [clientMounted, setClientMounted] = useState(false);
  const [mobileLayout, setMobileLayout] = useState(false);
  const [headActionsInView, setHeadActionsInView] = useState(true);
  const [dockActiveZoneInView, setDockActiveZoneInView] = useState(true);
  const [pastBlock3, setPastBlock3] = useState(false);
  const [etaPulse, setEtaPulse] = useState(false);
  const headActionsRef = useRef<HTMLDivElement>(null);
  const dockActiveZoneRef = useRef<HTMLDivElement>(null);
  const block3Ref = useRef<HTMLDivElement>(null);
  const dockIoRef = useRef<IntersectionObserver | null>(null);
  const prevEtaBracketRef = useRef(formatEtaBracket(fireEtaYears, fireEtaMonths));

  const etaBracket = formatEtaBracket(fireEtaYears, fireEtaMonths);
  const etaReady = fireEtaYears != null;

  useEffect(() => {
    if (prevEtaBracketRef.current === etaBracket) return;
    prevEtaBracketRef.current = etaBracket;
    setEtaPulse(true);
    const t = window.setTimeout(() => setEtaPulse(false), 520);
    return () => window.clearTimeout(t);
  }, [etaBracket]);

  const targetPrincipal = Math.floor(currentPrincipalNum);
  const displayRef = useRef(targetPrincipal);
  const [displayPrincipal, setDisplayPrincipal] = useState(targetPrincipal);
  const [summaryPulse, setSummaryPulse] = useState(false);
  const rafPrincipal = useRef<number | null>(null);

  const [feedback, setFeedback] = useState<{ field: FeedbackField; text: string } | null>(null);
  const feedbackHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFeedbackSnap = useRef(true);
  const prevSnap = useRef({ p: targetPrincipal, m: 0, e: 0 });

  const { selectedEtf } = advancedProps;

  const moneySlider = (trackDefault: number, step: number): MoneySliderConfig => ({
    min: 0,
    trackDefault,
    step,
    parse: (raw) => Math.max(0, parseFormula(raw) || 0),
    format: (n) => Math.floor(Math.max(0, n)).toLocaleString("zh-TW"),
  });

  /** 下方標的＋基本欄位齊全時，「加入標的」才亮起 */
  const saveTargetReady = useMemo(() => {
    const principalOk = hasFilledAmount(currentPrincipalStr, parseFormula);
    const monthlyOk = hasFilledAmount(monthlyContribution, parseFormula);
    const extraOk = hasFilledAmount(monthlyExtra, parseFormula);
    const etfOk = selectedEtf !== "none";
    const rateOk =
      rateSource === "dividend"
        ? dividendYieldPct !== "" &&
          stockDividendPct !== "" &&
          Number(dividendYieldPct) > 0 &&
          Number(stockDividendPct) > 0
        : annualReturnRate > 0;
    return principalOk && monthlyOk && extraOk && etfOk && rateOk;
  }, [
    currentPrincipalStr,
    monthlyContribution,
    monthlyExtra,
    selectedEtf,
    rateSource,
    dividendYieldPct,
    stockDividendPct,
    annualReturnRate,
    parseFormula,
  ]);

  const sharesLine =
    formatApproxSharesLine(currentPrincipalNum, selectedEtfInfo as TickerPreset | null | undefined) || "—";

  /** 摘要金額：數字 count-up（緩動），不變更計算邏輯 */
  useEffect(() => {
    const target = targetPrincipal;
    const from = displayRef.current;
    if (target === from) return;
    if (rafPrincipal.current != null) cancelAnimationFrame(rafPrincipal.current);
    let cancelled = false;
    const start = performance.now();
    const dur = 380;
    const step = (now: number) => {
      if (cancelled) return;
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
      cancelled = true;
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

  useEffect(() => {
    setClientMounted(true);
  }, []);

  useEffect(() => {
    const syncMobile = () => {
      const preview = document.documentElement.getAttribute("data-preview-mobile") === "true";
      setMobileLayout(preview || window.matchMedia("(max-width: 768px)").matches);
    };
    syncMobile();
    const mq = window.matchMedia("(max-width: 768px)");
    mq.addEventListener("change", syncMobile);
    const mo = new MutationObserver(syncMobile);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-preview-mobile"] });
    return () => {
      mq.removeEventListener("change", syncMobile);
      mo.disconnect();
    };
  }, []);

  /**
   * 手機：頂部三鍵滑出視窗 → 底部浮動列出現；
   * 仍在語音／①②③ 操作區內可顯示；一旦整段滑過 ③ 配息區即自動隱藏。
   * （僅在值變更時 setState，避免與版面 padding 互相觸發無限更新。）
   */
  useEffect(() => {
    if (!mobileLayout || !clientMounted) {
      setHeadActionsInView((prev) => (prev ? prev : true));
      setDockActiveZoneInView((prev) => (prev ? prev : true));
      setPastBlock3((prev) => (prev ? false : prev));
      dockIoRef.current?.disconnect();
      dockIoRef.current = null;
      return;
    }

    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      const headEl = headActionsRef.current;
      const zoneEl = dockActiveZoneRef.current;
      const block3El = block3Ref.current;
      if (!headEl || !zoneEl || !block3El) return;

      dockIoRef.current?.disconnect();
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.target === headEl) {
              const next = entry.isIntersecting;
              setHeadActionsInView((prev) => (prev === next ? prev : next));
            }
            if (entry.target === zoneEl) {
              const next = entry.isIntersecting;
              setDockActiveZoneInView((prev) => (prev === next ? prev : next));
            }
            if (entry.target === block3El) {
              const next = !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
              setPastBlock3((prev) => (prev === next ? prev : next));
            }
          }
        },
        { root: null, rootMargin: "0px", threshold: 0 },
      );
      dockIoRef.current = io;
      io.observe(headEl);
      io.observe(zoneEl);
      io.observe(block3El);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      dockIoRef.current?.disconnect();
      dockIoRef.current = null;
    };
  }, [mobileLayout, clientMounted]);

  const showFloatingDock = mobileLayout && !headActionsInView && dockActiveZoneInView && !pastBlock3;

  useEffect(() => {
    if (!mobileLayout || !showFloatingDock) {
      if (document.documentElement.getAttribute("data-stock-params-dock") === "visible") {
        document.documentElement.removeAttribute("data-stock-params-dock");
      }
      return;
    }
    if (document.documentElement.getAttribute("data-stock-params-dock") !== "visible") {
      document.documentElement.setAttribute("data-stock-params-dock", "visible");
    }
    return () => {
      if (document.documentElement.getAttribute("data-stock-params-dock") === "visible") {
        document.documentElement.removeAttribute("data-stock-params-dock");
      }
    };
  }, [mobileLayout, showFloatingDock]);

  const actionButtonProps = {
    saveTargetReady,
    onOpenSaveTarget,
    onOpenLoadTarget,
    onRestoreDefaults,
  };

  const fixedDock =
    clientMounted && mobileLayout && showFloatingDock && typeof document !== "undefined"
      ? createPortal(
          <div className={`${styles.floatingDock} ${styles.floatingDockVisible}`} role="toolbar" aria-label="標的快捷操作">
            <StockParamsActionButtons {...actionButtonProps} />
          </div>,
          document.body,
        )
      : null;

  return (
    <section
      id="mobile-stock-params"
      className={`${styles.root} scroll-mt-24`}
      aria-labelledby="mobile-stock-params-title"
    >
      <div
        className={`${styles.etaDashboard} ${etaPulse ? styles.etaDashboardPulse : ""} ${etaComputing ? styles.etaDashboardComputing : ""}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <p className={styles.etaDashboardLead}>
          <span className={styles.etaDashboardIcon} aria-hidden>
            🚀
          </span>
          您的財富自由航程預估：
        </p>
        <p className={styles.etaDashboardMain}>
          【{" "}
          <span key={etaBracket} className={styles.etaDashboardHighlight}>
            {etaBracket}
          </span>{" "}
          】{etaReady ? "達成" : ""}
        </p>
      </div>

      <div className={styles.headRow}>
        <h2 id="mobile-stock-params-title" className={styles.title}>
          存股參數設定
        </h2>
        <StockParamsActionButtons ref={headActionsRef} id="mobile-stock-params-head-actions" {...actionButtonProps} />
      </div>

      <div ref={dockActiveZoneRef} className={styles.dockActiveZone} aria-label="存股參數操作區">
      <MobileSmartVoiceBlock />

      <div className={styles.paramsStack} aria-label="起始資金、投資標的與配息設定">
      <div className={styles.basicCard}>
        <p className={styles.sectionLabel}>
          ① 起始資金設定
          <span className={styles.sectionLabelSub}>（當前本金與月投入）</span>
        </p>
        <div className={styles.basicFields}>
          <StepperTextField
            label="當前本金 (TWD)"
            value={currentPrincipalStr}
            placeholder="例如：200000"
            principal
            feedback={feedback?.field === "principal" ? feedback.text : null}
            onChange={setCurrentPrincipalStr}
            onBlur={() => setCurrentPrincipalStr(commitFormulaWithCommas(currentPrincipalStr))}
            onEnter={() => setCurrentPrincipalStr(commitFormulaWithCommas(currentPrincipalStr))}
            onStep={(dir) => {
              const n = Math.max(0, parseFormula(currentPrincipalStr) || 0);
              const step = moneyStep(n);
              const next = Math.max(0, n + dir * step);
              setCurrentPrincipalStr(Math.floor(next).toLocaleString("zh-TW"));
            }}
            slider={moneySlider(2_000_000, 1_000)}
          />

          <StepperTextField
            label="每月固定投入額 (TWD)"
            value={monthlyContribution}
            placeholder="例如：12000"
            feedback={feedback?.field === "monthly" ? feedback.text : null}
            onBlur={() => setMonthlyContribution(commitFormulaWithCommas(monthlyContribution))}
            onChange={setMonthlyContribution}
            onEnter={() => setMonthlyContribution(commitFormulaWithCommas(monthlyContribution))}
            onStep={(dir) => {
              const n = Math.max(0, parseFormula(monthlyContribution) || 0);
              const step = moneyStep(n);
              const next = Math.max(0, n + dir * step);
              setMonthlyContribution(Math.floor(next).toLocaleString("zh-TW"));
            }}
            slider={moneySlider(80_000, 1_000)}
          />

          <StepperTextField
            label="每月額外加碼／加班費 (TWD)"
            value={monthlyExtra}
            placeholder="例如：6000"
            feedback={feedback?.field === "extra" ? feedback.text : null}
            onChange={setMonthlyExtra}
            onBlur={() => setMonthlyExtra(commitFormulaWithCommas(monthlyExtra))}
            onEnter={() => setMonthlyExtra(commitFormulaWithCommas(monthlyExtra))}
            onStep={(dir) => {
              const n = Math.max(0, parseFormula(monthlyExtra) || 0);
              const step = moneyStep(n);
              const next = Math.max(0, n + dir * step);
              setMonthlyExtra(Math.floor(next).toLocaleString("zh-TW"));
            }}
            slider={moneySlider(40_000, 1_000)}
          />
        </div>
      </div>

      {/* ② 投資標的 ＋ ③ 配息：接在起始資金設定之後 */}
      <div ref={block3Ref} className={styles.etfLeadWrap} aria-label="投資標的與股利配息">
        <StockParamsAdvancedBlock
          {...advancedProps}
          showAnnualInEtfRow={false}
          showInlinePrincipalCard={false}
          stackEtfRow
          mobileGrouped
          mobileEtfLeadOnly
        />
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
          <span className={styles.advancedToggleText}>進階設定</span>
          <span className={`${styles.chevron} ${advancedOpen ? styles.chevronOpen : ""}`} aria-hidden>
            ▼
          </span>
        </button>
        <div
          className={`${styles.advancedPanel} ${advancedOpen ? styles.advancedPanelOpen : ""}`}
          aria-hidden={!advancedOpen}
        >
          <div className={styles.advancedPanelInner}>
            {advancedOpen ? (
              <StockParamsAdvancedBlock
                {...advancedProps}
                showAnnualInEtfRow={false}
                showInlinePrincipalCard={false}
                stackEtfRow
                mobileGrouped
                mobileOmitEtfPayoutLead
              />
            ) : null}
          </div>
        </div>
      </div>

      {fixedDock}
    </section>
  );
}
