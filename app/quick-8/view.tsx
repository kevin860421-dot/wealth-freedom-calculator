"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { QuickBlogLinksToggle } from "@/app/components/quick-blog-links-toggle";
import { QuickDualLineChart } from "@/app/components/quick-dual-line-chart";
import { QuickSeoArticle } from "@/app/components/quick-seo-article";
import { QuickSeoExtras } from "@/app/components/quick-seo-extras";
import { clampNum } from "@/lib/quick-calculator-math";
import { quickChartYearTicks } from "@/lib/quick-chart-series";
import {
  buildInstallmentTipContent,
  evalCalcInputToNumber,
  formatSmartUnit,
  formatTwd,
  INSTALLMENT_TIPS,
  measureTipFitPx,
  parseMoneyInputToInt,
  sanitizeCalcInput,
  TIP_FONT_MAX_PX,
} from "./logic";

const DEFAULT_INVEST_ANNUAL_PCT = 7;
const DEFAULT_TAIWAN_PERCEIVED_INFLATION_PCT = 3;
const DEFAULT_QUICK8_TOTAL_PRICE = 20000;

type Quick8InitialScenario = {
  name?: string;
  single?: number;
  monthly?: number;
  years?: number;
  rate?: number;
};

function fvMonthlyQuick8({
  annualReturnPct,
  months,
  monthlyContribution,
}: {
  annualReturnPct: number;
  months: number;
  monthlyContribution: number;
}): number {
  const r = clampNum(annualReturnPct, -99, 99) / 100 / 12;
  const c = Math.max(0, Number.isFinite(monthlyContribution) ? monthlyContribution : 0);
  const mMax = Math.max(0, Math.trunc(months));
  let bal = 0;
  for (let m = 1; m <= mMax; m++) {
    bal = bal * (1 + r) + c;
  }
  return Math.max(0, bal);
}

export function QuickCalculator8View({
  initialInflationAdjusted = false,
  initialInflationPct = DEFAULT_TAIWAN_PERCEIVED_INFLATION_PCT,
  initialScenario,
}: {
  initialInflationAdjusted?: boolean;
  initialInflationPct?: number;
  initialScenario?: Quick8InitialScenario;
}) {
  const initialTotalPrice = Math.round(
    clampNum(
      initialScenario?.single ?? Math.max(DEFAULT_QUICK8_TOTAL_PRICE, initialScenario?.monthly ?? 0),
      0,
      500000,
    ) / 100,
  ) * 100;
  const initialMonthlyInstallment = Math.round(
    clampNum(initialScenario?.monthly ?? 0, 0, initialTotalPrice) / 100,
  ) * 100;
  const initialMonthlyInvest = Math.max(0, initialTotalPrice - initialMonthlyInstallment);
  const initialYears = Math.round(clampNum(initialScenario?.years ?? 20, 1, 50));
  const scenarioName = initialScenario?.name;
  const hasScenarioPreset = Boolean(
    scenarioName || initialScenario?.single != null || initialScenario?.monthly != null || initialScenario?.rate != null,
  );

  const [investAnnualPct, setInvestAnnualPct] = useState(
    clampNum(initialScenario?.rate ?? DEFAULT_INVEST_ANNUAL_PCT, 0, 15),
  );
  const [inflationPct, setInflationPct] = useState(() => clampNum(initialInflationPct, 0, 10));
  const [inflationAdjusted, setInflationAdjusted] = useState(initialInflationAdjusted);
  const effectiveAnnualPct = inflationAdjusted
    ? Math.max(0, investAnnualPct - inflationPct)
    : investAnnualPct;

  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  /** 首屏固定 0 避免 SSR/CSR 隨機不一致；掛載後再抽一句（不輪播） */
  const [randomTipIndex, setRandomTipIndex] = useState(0);
  useEffect(() => {
    queueMicrotask(() => {
      setRandomTipIndex(Math.floor(Math.random() * INSTALLMENT_TIPS.length));
    });
  }, []);

  // total monthly budget
  const [totalPrice, setTotalPrice] = useState<number>(initialTotalPrice);
  const [totalPriceText, setTotalPriceText] = useState<string>(formatTwd(initialTotalPrice));

  // monthly installment expense (counts as spending)
  const [monthlyInstallment, setMonthlyInstallment] = useState<number>(initialMonthlyInstallment);
  const [monthlyInstallmentText, setMonthlyInstallmentText] = useState<string>(formatTwd(initialMonthlyInstallment));

  // investable cashflow per month (paired with installment; sums to totalPrice)
  const [monthlyInvest, setMonthlyInvest] = useState<number>(initialMonthlyInvest);
  const [monthlyInvestText, setMonthlyInvestText] = useState<string>(formatTwd(initialMonthlyInvest));

  const [years, setYears] = useState<number>(initialYears);
  const [yearsText, setYearsText] = useState<string>(String(initialYears));
  const yearsClamped = Math.round(clampNum(years, 1, 50));
  const installmentInvestRatio = monthlyInvest > 0 ? monthlyInstallment / monthlyInvest : 1;
  const extraRedRightShift =
    installmentInvestRatio <= 0.2 ? 40 : installmentInvestRatio <= 0.35 ? 24 : installmentInvestRatio <= 0.5 ? 14 : 4;
  const extraRedDrop =
    installmentInvestRatio <= 0.2 ? 24 : installmentInvestRatio <= 0.35 ? 16 : installmentInvestRatio <= 0.5 ? 10 : 3;
  const isInstallmentNearInvest = monthlyInstallment > 0 && monthlyInstallment >= monthlyInvest * 0.85;
  const shouldForceRedLabelBelow = !isInstallmentNearInvest;

  const commitMoney = (raw: string, current: number, min: number, max: number) => {
    const hasOps = /[+\-*/()]/.test(raw);
    const v = hasOps ? evalCalcInputToNumber(raw) : parseMoneyInputToInt(raw);
    return Math.round(clampNum(v ?? current, min, max) / 100) * 100;
  };

  const commitYears = () => {
    const raw = yearsText;
    const hasOps = /[+\-*/()]/.test(raw);
    const v = hasOps ? evalCalcInputToNumber(raw) : parseMoneyInputToInt(raw);
    const next = Math.round(clampNum(v ?? years, 1, 50));
    setYears(next);
    setYearsText(String(next));
  };

  const bumpYears = (delta: number) => {
    const v = parseMoneyInputToInt(yearsText) ?? years;
    const next = Math.round(clampNum(v + delta, 1, 50));
    setYears(next);
    setYearsText(String(next));
  };

  const monthlyTotal = totalPrice;

  const applySplitFromInstallment = (instRaw: number, total: number) => {
    const safeTotal = Math.max(0, total);
    const inst = Math.round(clampNum(instRaw, 0, safeTotal) / 100) * 100;
    const inv = Math.max(0, safeTotal - inst);
    setMonthlyInstallment(inst);
    setMonthlyInstallmentText(formatTwd(inst));
    setMonthlyInvest(inv);
    setMonthlyInvestText(formatTwd(inv));
  };

  const applySplitFromInvest = (invRaw: number, total: number) => {
    const safeTotal = Math.max(0, total);
    const inv = Math.round(clampNum(invRaw, 0, safeTotal) / 100) * 100;
    const inst = Math.max(0, safeTotal - inv);
    setMonthlyInvest(inv);
    setMonthlyInvestText(formatTwd(inv));
    setMonthlyInstallment(inst);
    setMonthlyInstallmentText(formatTwd(inst));
  };

  const onShare = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("total", String(totalPrice));
      url.searchParams.set("inst", String(monthlyInstallment));
      url.searchParams.set("invest", String(monthlyInvest));
      url.searchParams.set("y", String(years));
      url.searchParams.set("rate", String(investAnnualPct));
      if (scenarioName) url.searchParams.set("etf", scenarioName);
      if (initialScenario?.single != null) url.searchParams.set("single", String(totalPrice));
      if (monthlyInstallment > 0) url.searchParams.set("monthly", String(monthlyInstallment));
      if (inflationAdjusted) {
        url.searchParams.set("inflation", "true");
        url.searchParams.set("inflation_rate", String(inflationPct));
      } else {
        url.searchParams.delete("inflation");
        url.searchParams.delete("inflation_rate");
      }
      const nav = navigator as unknown as { share?: (v: { url?: string }) => Promise<void> };
      if (typeof nav.share === "function") {
        await nav.share({ url: url.toString() });
        return;
      }

      await navigator.clipboard.writeText(url.toString());
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 1200);
    } catch {}
  };

  const commitTotalPrice = () => {
    const raw = totalPriceText;
    const hasOps = /[+\-*/()]/.test(raw);
    const v = hasOps ? evalCalcInputToNumber(raw) : parseMoneyInputToInt(raw);
    const next = Math.round(clampNum(v ?? totalPrice, 0, 500000) / 100) * 100;
    setTotalPrice(next);
    setTotalPriceText(formatTwd(next));
    applySplitFromInstallment(Math.min(monthlyInstallment, next), next);
  };

  const bumpTotalPrice = (delta: number) => {
    const v = parseMoneyInputToInt(totalPriceText) ?? totalPrice;
    const next = Math.round(clampNum(v + delta, 0, 500000) / 100) * 100;
    setTotalPriceText(formatTwd(next));
    setTotalPrice(next);
    applySplitFromInstallment(Math.min(monthlyInstallment, next), next);
  };

  const monthlyContribution = Math.max(0, totalPrice - monthlyInstallment);
  const dynamicHeroTitle = useMemo(() => {
    if (!scenarioName) {
      return inflationAdjusted ? "⏳【慘遭通膨考驗】延遲享樂計算機" : "⏳ 延遲享樂計算機";
    }
    if (inflationAdjusted && (monthlyInstallment > 0 || initialScenario?.single != null)) {
      return `⏳【慘遭通膨考驗！${scenarioName} 專用】延遲享樂計算機`;
    }
    if (monthlyInstallment > 0) {
      return `⏳【${scenarioName} 定期定額 ${formatTwd(monthlyInstallment)}元 專用】延遲享樂計算機`;
    }
    if (initialScenario?.single != null || totalPrice > 0) {
      return `⏳【${scenarioName} 單筆投入 ${formatTwd(totalPrice)}元 專用】延遲享樂計算機`;
    }
    return `⏳【${scenarioName} 專用】延遲享樂計算機`;
  }, [inflationAdjusted, initialScenario?.single, monthlyInstallment, scenarioName, totalPrice]);

  // 核心邏輯（照你指定）
  const result = useMemo(() => {
    const m = yearsClamped * 12;
    const currentAssets = fvMonthlyQuick8({ annualReturnPct: effectiveAnnualPct, months: m, monthlyContribution });
    const delayedAssets = fvMonthlyQuick8({ annualReturnPct: effectiveAnnualPct, months: m, monthlyContribution: totalPrice });
    const loss = delayedAssets - currentAssets;
    return { currentAssets, delayedAssets, loss };
  }, [effectiveAnnualPct, monthlyContribution, totalPrice, yearsClamped]);

  /** 橫軸僅顯示 ≤ 設定年限之刻度（與主試算終點一致） */
  const yearsList = useMemo(() => quickChartYearTicks(yearsClamped), [yearsClamped]);

  const series = useMemo(() => {
    const a = yearsList.map((y) => fvMonthlyQuick8({ annualReturnPct: effectiveAnnualPct, months: y * 12, monthlyContribution }));
    const b = yearsList.map((y) => fvMonthlyQuick8({ annualReturnPct: effectiveAnnualPct, months: y * 12, monthlyContribution: totalPrice }));
    return { a, b };
  }, [effectiveAnnualPct, monthlyContribution, totalPrice, yearsList]);

  /** 圖上方里程碑：1 年、5 年（若未超過上限）、以及「設定年限」終點 */
  const chartMilestoneRows = useMemo(() => {
    const at = (y: number) => {
      const months = y * 12;
      const normal = fvMonthlyQuick8({ annualReturnPct: effectiveAnnualPct, months, monthlyContribution });
      const delayed = fvMonthlyQuick8({ annualReturnPct: effectiveAnnualPct, months, monthlyContribution: totalPrice });
      return { year: y, normal, delayed };
    };
    const cap = yearsClamped;
    const ys = [...new Set([1, Math.min(5, cap), cap].filter((y) => y >= 1 && y <= cap))].sort((a, b) => a - b);
    return ys.map((y) => at(y));
  }, [effectiveAnnualPct, monthlyContribution, totalPrice, yearsClamped]);

  const chartMilestoneColors = [
    "rgba(252, 211, 77, 0.98)",
    "rgba(134, 239, 172, 0.98)",
    "rgba(147, 197, 253, 0.98)",
  ] as const;

  const deltaYuan = Math.max(0, Math.round(result.loss));

  const resolvedRandomTip = useMemo(
    () => buildInstallmentTipContent(randomTipIndex, monthlyInstallment, deltaYuan),
    [randomTipIndex, monthlyInstallment, deltaYuan],
  );

  const tipTextRef = useRef<HTMLDivElement>(null);
  const [tipFontPx, setTipFontPx] = useState(TIP_FONT_MAX_PX);
  const [tipAllowWrap, setTipAllowWrap] = useState(false);

  useLayoutEffect(() => {
    const el = tipTextRef.current;
    if (!el) return;

    const run = () => {
      if (el.clientWidth < 4) return;
      const { px, wrap } = measureTipFitPx(el);
      setTipFontPx((prev) => (Math.abs(prev - px) < 0.05 ? prev : px));
      setTipAllowWrap((prev) => (prev === wrap ? prev : wrap));
    };

    run();
    const ro = new ResizeObserver(() => {
      window.requestAnimationFrame(run);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [randomTipIndex, monthlyInstallment, deltaYuan]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b1220",
        padding: "12px 12px 28px",
        color: "#e8eefc",
        display: "flex",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      <style jsx global>{`
        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }
        @keyframes quick8TitleGradientShift {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 100% 50%;
          }
        }
        .quick8-title-gradient {
          background: linear-gradient(
            90deg,
            rgba(196, 210, 240, 0.88),
            #e8eefc,
            rgba(120, 190, 210, 0.95),
            rgba(200, 180, 235, 0.88),
            rgba(196, 210, 240, 0.88)
          );
          background-size: 240% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          animation: quick8TitleGradientShift 7s ease-in-out infinite alternate;
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 400, margin: "0 auto", boxSizing: "border-box", minWidth: 0, overflowX: "hidden" }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div className="quick-brand-gold-shimmer" style={{ fontSize: 20, fontWeight: 900, opacity: 0.95, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", ["--quick-brand-duration" as string]: "3.6s" }}>
              財富自由計算機
            </div>
            <button
              type="button"
              onClick={onShare}
              style={{
                height: 40,
                padding: "0 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.08)",
                color: "#e8eefc",
                fontSize: 16,
                fontWeight: 900,
                cursor: "pointer",
                flexShrink: 0,
              }}
              aria-label="分享"
            >
              {shareState === "copied" ? "已複製" : "分享"}
            </button>
          </div>
          <div
            className="quick8-title-gradient"
            style={{
              fontSize: dynamicHeroTitle.length > 28 ? 22 : inflationAdjusted ? 23 : 30,
              fontWeight: 950,
              marginTop: 10,
              lineHeight: 1.12,
              minHeight: 60,
              display: "flex",
              alignItems: "center",
              whiteSpace: dynamicHeroTitle.length > 28 ? "normal" : inflationAdjusted ? "normal" : "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              wordBreak: "keep-all",
            }}
          >
            {dynamicHeroTitle}
          </div>
        </div>

        <section
          style={{
            marginTop: 0,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 16,
            padding: 10,
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            width: "100%",
            boxSizing: "border-box",
            minWidth: 0,
          }}
        >
          <div style={{ display: "grid", gap: 10 }}>
            {hasScenarioPreset ? (
              <div
                role="note"
                style={{
                  borderRadius: 14,
                  border: "1px solid rgba(252,211,77,0.35)",
                  background: "linear-gradient(135deg, rgba(120,53,15,0.34), rgba(15,23,42,0.55))",
                  color: "#fde68a",
                  padding: "10px 12px",
                  fontSize: 12,
                  fontWeight: 900,
                  lineHeight: 1.55,
                }}
              >
                已為您自動載入專屬財務情境！這正是您延遲享樂的真實代價，請查看下方一千萬資產折線圖，亦可自由調整滑桿。
              </div>
            ) : null}
            <div style={{ padding: 10, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
              <div style={{ fontSize: 16, opacity: 0.9, fontWeight: 900 }}>總投資金額</div>
              <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8, width: "100%", minWidth: 0 }}>
                <input
                  inputMode="numeric"
                  value={totalPriceText}
                  onChange={(e) => {
                    const raw = sanitizeCalcInput(e.target.value);
                    setTotalPriceText(raw);
                    const next = commitMoney(raw, totalPrice, 0, 500000);
                    setTotalPrice(next);
                    applySplitFromInstallment(Math.min(monthlyInstallment, next), next);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitTotalPrice();
                      (e.currentTarget as HTMLInputElement).blur();
                    }
                  }}
                  onBlur={commitTotalPrice}
                  style={{
                    flex: "1 1 220px",
                    height: 48,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.20)",
                    color: "#e8eefc",
                    padding: "0 12px",
                    outline: "none",
                    fontSize: 22,
                    fontWeight: 950,
                    width: "100%",
                    minWidth: 0,
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
                <button
                  type="button"
                  onClick={() => bumpTotalPrice(+1000)}
                  aria-label="增加 1000"
                  style={{
                    flex: "0 0 44px",
                    width: 44,
                    height: 48,
                    boxSizing: "border-box",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.08)",
                    color: "#e8eefc",
                    fontSize: 20,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => bumpTotalPrice(-1000)}
                  aria-label="減少 1000"
                  style={{
                    flex: "0 0 44px",
                    width: 44,
                    height: 48,
                    boxSizing: "border-box",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.08)",
                    color: "#e8eefc",
                    fontSize: 20,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  –
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, width: "100%", minWidth: 0 }}>
              <label style={{ display: "grid", gap: 6, minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 18, opacity: 0.9, fontWeight: 900 }}>每月分期支出</div>
                <input
                  inputMode="numeric"
                  value={monthlyInstallmentText}
                  onChange={(e) => {
                    const raw = sanitizeCalcInput(e.target.value);
                    setMonthlyInstallmentText(raw);
                    const next = commitMoney(raw, monthlyInstallment, 0, totalPrice);
                    applySplitFromInstallment(next, totalPrice);
                  }}
                  onBlur={() => setMonthlyInstallmentText(formatTwd(monthlyInstallment))}
                  style={{
                    height: 48,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.20)",
                    color: "#e8eefc",
                    padding: "0 12px",
                    outline: "none",
                    fontSize: 22,
                    fontWeight: 950,
                    width: "100%",
                    minWidth: 0,
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: 6, minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 18, opacity: 0.9, fontWeight: 900 }}>可投資金額</div>
                <input
                  inputMode="numeric"
                  value={monthlyInvestText}
                  onChange={(e) => {
                    const raw = sanitizeCalcInput(e.target.value);
                    setMonthlyInvestText(raw);
                    const next = commitMoney(raw, monthlyInvest, 0, totalPrice);
                    applySplitFromInvest(next, totalPrice);
                  }}
                  onBlur={() => setMonthlyInvestText(formatTwd(monthlyInvest))}
                  style={{
                    height: 48,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.20)",
                    color: "#e8eefc",
                    padding: "0 12px",
                    outline: "none",
                    fontSize: 22,
                    fontWeight: 950,
                    width: "100%",
                    minWidth: 0,
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
              </label>
            </div>

            <input
              type="range"
              min={0}
              max={monthlyTotal}
              step={100}
              value={monthlyInvest}
              onChange={(e) => {
                const inv = Math.round(clampNum(Number(e.target.value), 0, totalPrice) / 100) * 100;
                applySplitFromInvest(inv, totalPrice);
              }}
              aria-label="可投資金額與分期支出分配拉條"
              style={{
                display: "block",
                width: "90%",
                maxWidth: "100%",
                minWidth: 0,
                boxSizing: "border-box",
                marginLeft: "auto",
                marginRight: "auto",
                marginTop: 2,
                marginBottom: 4,
                height: 28,
              }}
            />

            <div style={{ padding: 10, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
              <div style={{ fontSize: 16, opacity: 0.9, fontWeight: 900 }}>設定幾年</div>
              <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, rowGap: 8, justifyContent: "space-between", width: "100%", minWidth: 0 }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, flex: "1 1 auto", minWidth: 0 }}>
                  <div style={{ position: "relative", flex: "1 1 64px", minWidth: 48 }}>
                    <input
                      inputMode="numeric"
                      value={yearsText}
                      onChange={(e) => {
                        const raw = sanitizeCalcInput(e.target.value);
                        setYearsText(raw);
                        if (!/[+\-*/()]/.test(raw)) {
                          const n = parseMoneyInputToInt(raw);
                          if (n !== null) setYears(Math.round(clampNum(n, 1, 50)));
                        }
                      }}
                      onBlur={commitYears}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          commitYears();
                          (e.currentTarget as HTMLInputElement).blur();
                        }
                      }}
                      aria-label="年數"
                      style={{
                        width: "100%",
                        height: 44,
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(0,0,0,0.20)",
                        color: "#e8eefc",
                        padding: "0 36px 0 10px",
                        outline: "none",
                        fontSize: 20,
                        fontWeight: 950,
                        fontVariantNumeric: "tabular-nums",
                        boxSizing: "border-box",
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: 16,
                        opacity: 0.85,
                        fontWeight: 900,
                        pointerEvents: "none",
                      }}
                    >
                      年
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => bumpYears(+1)}
                    aria-label="增加 1 年"
                    style={{
                      flex: "0 0 44px",
                      width: 44,
                      height: 44,
                      boxSizing: "border-box",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.14)",
                      background: "rgba(255,255,255,0.08)",
                      color: "#e8eefc",
                      fontSize: 20,
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => bumpYears(-1)}
                    aria-label="減少 1 年"
                    style={{
                      flex: "0 0 44px",
                      width: 44,
                      height: 44,
                      boxSizing: "border-box",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.14)",
                      background: "rgba(255,255,255,0.08)",
                      color: "#e8eefc",
                      fontSize: 20,
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    –
                  </button>
                </div>
                <div style={{ fontSize: 12, opacity: 0.82, fontWeight: 800, whiteSpace: "nowrap", flexShrink: 0 }}>
                  目前年化{investAnnualPct.toFixed(1).replace(/\.0$/, "")}%
                </div>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                step={1}
                value={years}
                onChange={(e) => {
                  const v = Math.round(clampNum(Number(e.target.value), 1, 50));
                  setYears(v);
                  setYearsText(String(v));
                }}
                aria-label="年數拉條"
                style={{
                  display: "block",
                  width: "100%",
                  maxWidth: "100%",
                  minWidth: 0,
                  boxSizing: "border-box",
                  marginTop: 10,
                  height: 28,
                }}
              />
            </div>

            <div style={{ padding: 9, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                <div style={{ fontSize: 16, opacity: 0.9, fontWeight: 900 }}>年化利率</div>
                <div style={{ fontSize: 16, opacity: 0.82, fontWeight: 800, whiteSpace: "nowrap" }}>
                  {inflationAdjusted
                    ? `實質 ${effectiveAnnualPct.toFixed(1).replace(/\.0$/, "")}%`
                    : `預估 ${investAnnualPct.toFixed(1).replace(/\.0$/, "")}%`}
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={15}
                step={0.5}
                value={investAnnualPct}
                onChange={(e) => setInvestAnnualPct(Number(e.target.value))}
                aria-label="年化利率拉條"
                style={{
                  display: "block",
                  width: "100%",
                  maxWidth: "100%",
                  minWidth: 0,
                  boxSizing: "border-box",
                  marginTop: 6,
                  height: 24,
                }}
              />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 2 }}>
                <div style={{ fontSize: 14, opacity: inflationAdjusted ? 0.95 : 0.74, fontWeight: 900 }}>通膨率</div>
                <div style={{ fontSize: 14, opacity: inflationAdjusted ? 0.95 : 0.74, fontWeight: 900, whiteSpace: "nowrap" }}>
                  {inflationPct.toFixed(1).replace(/\.0$/, "")}%
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={inflationPct}
                onChange={(e) => setInflationPct(Number(e.target.value))}
                aria-label="通膨率拉條"
                style={{
                  display: "block",
                  width: "100%",
                  maxWidth: "100%",
                  minWidth: 0,
                  boxSizing: "border-box",
                  marginTop: 4,
                  height: 22,
                  opacity: inflationAdjusted ? 1 : 0.72,
                }}
              />
              <div
                role="tablist"
                aria-label="資產顯示模式"
                style={{
                  marginTop: 6,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 4,
                  width: "100%",
                  height: 50,
                  padding: 4,
                  borderRadius: 999,
                  background: "rgba(2,6,23,0.72)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxSizing: "border-box",
                }}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={!inflationAdjusted}
                  onClick={() => setInflationAdjusted(false)}
                  style={{
                    minWidth: 0,
                    height: 42,
                    borderRadius: 999,
                    border: "none",
                    background: !inflationAdjusted ? "linear-gradient(135deg, rgba(59,130,246,0.95), rgba(14,165,233,0.82))" : "transparent",
                    color: !inflationAdjusted ? "#ffffff" : "rgba(226,232,240,0.78)",
                    fontSize: 14,
                    fontWeight: 950,
                    lineHeight: 1.15,
                    cursor: "pointer",
                    padding: "0 8px",
                    boxShadow: !inflationAdjusted ? "0 8px 18px rgba(37,99,235,0.28)" : "none",
                  }}
                >
                  預估資產金額
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={inflationAdjusted}
                  onClick={() => setInflationAdjusted(true)}
                  style={{
                    minWidth: 0,
                    height: 42,
                    borderRadius: 999,
                    border: "none",
                    background: inflationAdjusted ? "linear-gradient(135deg, rgba(245,158,11,0.95), rgba(239,68,68,0.78))" : "transparent",
                    color: inflationAdjusted ? "#ffffff" : "rgba(226,232,240,0.78)",
                    fontSize: 13,
                    fontWeight: 950,
                    lineHeight: 1.12,
                    cursor: "pointer",
                    padding: "0 8px",
                    boxShadow: inflationAdjusted ? "0 8px 18px rgba(245,158,11,0.24)" : "none",
                    textShadow: inflationAdjusted ? "0 1px 2px rgba(0,0,0,0.55)" : "none",
                  }}
                >
                  扣除通膨
                  <br />
                  （換算真實購買力）
                </button>
              </div>
              <div style={{ marginTop: 6, fontSize: 11, lineHeight: 1.35, color: inflationAdjusted ? "rgba(252,211,77,0.95)" : "rgba(148,163,184,0.9)", fontWeight: 800 }}>
                {inflationAdjusted
                  ? `實質利率 = ${investAnnualPct.toFixed(1).replace(/\.0$/, "")}% - ${inflationPct.toFixed(1).replace(/\.0$/, "")}%`
                  : "通膨率可先調好，切換右邊才扣除。"}
              </div>
            </div>

            <QuickDualLineChart
              years={yearsList}
              seriesA={series.a}
              seriesB={series.b}
              title={inflationAdjusted ? `淨值折線圖（扣除${inflationPct.toFixed(1).replace(/\.0$/, "")}%通膨）` : "淨值折線圖"}
              legendA={inflationAdjusted ? "照買照付（實質購買力）" : "照買照付（照常月投入）"}
              legendB={inflationAdjusted ? "延遲享樂（實質購買力）" : "延遲享樂（分期改投入）"}
              colorA="rgba(196, 122, 122, 0.92)"
              colorB="rgba(106, 165, 184, 0.92)"
              showPointValues
              showPointValuesScope="last"
              pointLabelMode="legacy"
              formatPointValue={formatTwd}
              redLabelBelowYearThreshold={shouldForceRedLabelBelow ? 999 : yearsClamped}
              redLabelExtraDrop={(yearsClamped <= 3 ? 42 : yearsClamped <= 10 ? 24 : 14) + extraRedDrop}
              redLabelXOffset={(yearsClamped <= 3 ? 30 : yearsClamped <= 10 ? 14 : 8) + extraRedRightShift}
              topNotes={
                <>
                  {chartMilestoneRows.map((row, i) => (
                    <text
                      key={row.year}
                      x="0"
                      y={16 + i * 18}
                      fontSize="14"
                      fill={chartMilestoneColors[i % chartMilestoneColors.length]}
                      fontWeight="900"
                    >
                      {row.year}年{inflationAdjusted ? "實質購買力" : "資產"}：{formatSmartUnit(row.normal)} / {formatSmartUnit(row.delayed)}
                    </text>
                  ))}
                </>
              }
            />

            <div
              style={{
                padding: "12px 10px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.10)",
                minWidth: 0,
                maxWidth: "100%",
                boxSizing: "border-box",
              }}
            >
              <div
                ref={tipTextRef}
                style={{
                  width: "100%",
                  minWidth: 0,
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  fontSize: `${tipFontPx}px`,
                  opacity: 0.98,
                  fontWeight: 950,
                  lineHeight: 1.35,
                  whiteSpace: tipAllowWrap ? "normal" : "nowrap",
                  wordBreak: tipAllowWrap ? "break-word" : "normal",
                  overflowWrap: tipAllowWrap ? "break-word" : "normal",
                  overflowX: "hidden",
                }}
              >
                {resolvedRandomTip}
              </div>
            </div>

            <Link
              href="/"
              style={{
                marginTop: 6,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                alignItems: "center",
                textAlign: "center",
                textDecoration: "none",
                padding: "22px 22px",
                borderRadius: 14,
                background: "#2563eb",
                color: "white",
                fontSize: 18,
                fontWeight: 900,
                lineHeight: 1.4,
                letterSpacing: "0.12em",
              }}
            >
              <span style={{ lineHeight: 1.4, letterSpacing: "0.12em" }}>🔍 進入財富自由計算機</span>
            </Link>
            <QuickBlogLinksToggle quickRoute="/quick-8" />
            <QuickSeoExtras id={8} />
            <QuickSeoArticle id={8} />
          </div>
        </section>
      </div>
    </main>
  );
}
