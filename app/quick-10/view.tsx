"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QuickBlogLinksToggle } from "@/app/components/quick-blog-links-toggle";
import { QuickBottomCtaStack } from "@/app/components/quick-bottom-cta-stack";
import { Quick10HomeConsole } from "./quick10-home-console";
import { Quick10NetWorthChart } from "./quick10-net-worth-chart";
import { QuickSeoArticle } from "@/app/components/quick-seo-article";
import { QuickSeoExtras } from "@/app/components/quick-seo-extras";
import { clampNum, simulateMonthlyBalances } from "@/lib/quick-calculator-math";
import { evalInput, formatTwd, historicalLowReference, HOME_YEARS_MAX, HOME_YEARS_MIN } from "./logic";
import { QUICK10_DISPLAY_NAME } from "./quick10-brand";
import { downloadQuick10ChartExcel } from "./quick10-excel-export";
import { useQuick10MarketIndex } from "./use-quick10-market-index";

export function Quick10HomePanel({ embedded = false }: { embedded?: boolean } = {}) {
  const { marketIndex } = useQuick10MarketIndex();
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [monthly, setMonthly] = useState(20000);
  const [monthlyText, setMonthlyText] = useState(formatTwd(20000));

  const [years, setYears] = useState(10);
  const [yearsText, setYearsText] = useState("10");

  const [annualPct, setAnnualPct] = useState(7);
  const [annualPctText, setAnnualPctText] = useState("7");

  /** 大盤重挫幅度，例如 -30 代表期末資產 ×0.7 */
  const [crashPct, setCrashPct] = useState(-30);
  const [crashPctText, setCrashPctText] = useState("-30");
  const [hoveredCard, setHoveredCard] = useState<"principal" | "normal" | "crash" | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [excelDownloadBusy, setExcelDownloadBusy] = useState(false);
  const prevToastConditionRef = useRef(false);

  const commitMoney = (raw: string) => {
    const next = Math.round(evalInput(raw, monthly, 0, 500000) / 100) * 100;
    setMonthly(next);
    setMonthlyText(formatTwd(next));
  };

  const commitYears = (raw = yearsText) => {
    const next = evalInput(raw, years, HOME_YEARS_MIN, HOME_YEARS_MAX, true);
    setYears(next);
    setYearsText(String(next));
  };

  const commitAnnualPct = (raw = annualPctText) => {
    const next = Number(evalInput(raw, annualPct, 0, 30).toFixed(2));
    setAnnualPct(next);
    setAnnualPctText(String(next));
  };

  const commitCrashPct = (raw = crashPctText) => {
    const next = Number(evalInput(raw, crashPct, -99, 0).toFixed(2));
    setCrashPct(next);
    setCrashPctText(String(next));
  };

  const bumpYears = (delta: number) => {
    const next = Math.round(clampNum(years + delta, HOME_YEARS_MIN, HOME_YEARS_MAX));
    setYears(next);
    setYearsText(String(next));
  };

  const bumpMonthly = (delta: number) => {
    const next = Math.round(clampNum(monthly + delta, 0, 500_000) / 100) * 100;
    setMonthly(next);
    setMonthlyText(formatTwd(next));
  };

  const bumpAnnualPct = (delta: number) => {
    const next = Number(clampNum(annualPct + delta, 0, 30).toFixed(2));
    setAnnualPct(next);
    setAnnualPctText(String(next));
  };

  const bumpCrashPct = (delta: number) => {
    const next = Number(clampNum(crashPct + delta, -99, 0).toFixed(2));
    setCrashPct(next);
    setCrashPctText(String(next));
  };

  const months = Math.round(clampNum(years, HOME_YEARS_MIN, HOME_YEARS_MAX) * 12);
  const principalTotal = Math.max(0, monthly * 12 * years);
  const crashMarketPoints = Math.max(0, Math.round(marketIndex * (1 + crashPct / 100)));

  const result = useMemo(() => {
    const normalSeries = simulateMonthlyBalances({
      annualReturnPct: annualPct,
      months,
      initial: 0,
      monthlyContribution: monthly,
    });
    const terminal = normalSeries.length ? normalSeries[normalSeries.length - 1] : 0;
    const mult = 1 + clampNum(crashPct, -99, 0) / 100;
    const afterCrash = Math.max(0, terminal * mult);

    const crashSeries =
      normalSeries.length === 0
        ? []
        : normalSeries.map((v, i) => (i < normalSeries.length - 1 ? v : afterCrash));

    const maxV = Math.max(1, terminal, afterCrash, principalTotal, ...normalSeries);
    const minV = Math.min(0, ...normalSeries, afterCrash, principalTotal);

    return { normalSeries, crashSeries, terminal, afterCrash, maxV, minV };
  }, [annualPct, months, monthly, crashPct, principalTotal]);

  const horizonYears = Math.round(months / 12);
  /** 圖表每年一點，十字線可滑動 1～N 年（不只 1/5/10 三格） */
  const chartYears = useMemo(
    () => Array.from({ length: Math.max(1, horizonYears) }, (_, i) => i + 1),
    [horizonYears],
  );
  const windCrashChart = useMemo(() => {
    const normal = result.normalSeries;
    const monthsTotal = months;
    const hy = horizonYears;
    const a = chartYears.map((y) => {
      const mi = Math.min(y * 12, monthsTotal);
      const idx = mi - 1;
      return idx >= 0 && idx < normal.length ? normal[idx] : 0;
    });
    const b = chartYears.map((y) => {
      const mi = Math.min(y * 12, monthsTotal);
      const idx = mi - 1;
      if (idx < 0) return 0;
      if (y >= hy) return result.afterCrash;
      return normal[idx];
    });
    return { a, b };
  }, [result, months, horizonYears, chartYears]);

  const handleDownloadExcelChart = useCallback(() => {
    if (excelDownloadBusy || result.normalSeries.length === 0) return;
    setExcelDownloadBusy(true);
    try {
      downloadQuick10ChartExcel({
        monthly,
        horizonYears,
        annualPct,
        crashPct,
        marketIndex,
        crashMarketPoints,
        principalTotal,
        terminal: result.terminal,
        afterCrash: result.afterCrash,
        years: chartYears,
        windSeries: windCrashChart.a,
        crashSeries: windCrashChart.b,
      });
    } finally {
      window.setTimeout(() => setExcelDownloadBusy(false), 400);
    }
  }, [
    excelDownloadBusy,
    monthly,
    horizonYears,
    annualPct,
    crashPct,
    marketIndex,
    crashMarketPoints,
    principalTotal,
    result.terminal,
    result.afterCrash,
    result.normalSeries.length,
    chartYears,
    windCrashChart.a,
    windCrashChart.b,
  ]);

  useEffect(() => {
    const isPositiveShock = result.afterCrash > principalTotal;
    if (isPositiveShock && !prevToastConditionRef.current) {
      prevToastConditionRef.current = true;
      let hideTimer: number | undefined;
      const showTimer = window.setTimeout(() => {
        setShowToast(true);
        hideTimer = window.setTimeout(() => setShowToast(false), 2200);
      }, 0);
      return () => {
        window.clearTimeout(showTimer);
        if (hideTimer !== undefined) window.clearTimeout(hideTimer);
      };
    }
    if (!isPositiveShock) {
      prevToastConditionRef.current = false;
      const t = window.setTimeout(() => setShowToast(false), 0);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [result.afterCrash, principalTotal]);

  useEffect(() => {
    queueMicrotask(() => {
      const sp = new URLSearchParams(window.location.search);
      const mRaw = sp.get("m") ?? sp.get("monthly");
      const yRaw = sp.get("y") ?? sp.get("years");
      const apRaw = sp.get("ap") ?? sp.get("rate");
      const crashRaw = sp.get("crash");
      if (mRaw != null) {
        const v = Number(mRaw.replace(/,/g, ""));
        if (Number.isFinite(v)) {
          const next = Math.round(clampNum(v, 0, 500000) / 100) * 100;
          setMonthly(next);
          setMonthlyText(formatTwd(next));
        }
      }
      if (yRaw != null) {
        const v = Number(yRaw);
        if (Number.isFinite(v)) {
          const next = Math.round(clampNum(v, HOME_YEARS_MIN, HOME_YEARS_MAX));
          setYears(next);
          setYearsText(String(next));
        }
      }
      if (apRaw != null) {
        const v = Number(apRaw);
        if (Number.isFinite(v)) {
          const next = Number(clampNum(v, 0, 30).toFixed(2));
          setAnnualPct(next);
          setAnnualPctText(String(next));
        }
      }
      if (crashRaw != null) {
        const v = Number(crashRaw);
        if (Number.isFinite(v)) {
          const next = Number(clampNum(v, -99, 0).toFixed(2));
          setCrashPct(next);
          setCrashPctText(String(next));
        }
      }
    });
  }, []);

  const onShare = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("m", String(monthly));
      url.searchParams.set("y", String(years));
      url.searchParams.set("ap", String(annualPct));
      url.searchParams.set("crash", String(crashPct));
      const nav = navigator as unknown as { share?: (v: { url?: string }) => Promise<void> };
      if (typeof nav.share === "function") {
        await nav.share({ url: url.toString() });
        return;
      }
      await navigator.clipboard.writeText(url.toString());
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 1200);
    } catch {
      /* noop */
    }
  };

  const homeSection = (
    <>
      <style jsx global>{`
        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }
        @keyframes quick10TitleGradientShift {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 100% 50%;
          }
        }
        .quick10-title-gradient {
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
          animation: quick10TitleGradientShift 7s ease-in-out infinite alternate;
        }
      `}</style>

        <section
          className={embedded ? "space-y-3" : undefined}
          style={
            embedded
              ? { width: "100%", minWidth: 0, boxSizing: "border-box" }
              : {
                  background: "rgba(15,23,42,0.6)",
                  border: "1px solid rgb(51, 65, 85)",
                  borderRadius: 14,
                  padding: 8,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                  width: "100%",
                  boxSizing: "border-box",
                  minWidth: 0,
                }
          }
        >
          <Quick10HomeConsole
            crashMarketPoints={crashMarketPoints}
            principalTotal={principalTotal}
            terminal={result.terminal}
            afterCrash={result.afterCrash}
            monthly={monthly}
            years={years}
            annualPct={annualPct}
            crashPct={crashPct}
            monthlyText={monthlyText}
            yearsText={yearsText}
            annualPctText={annualPctText}
            crashPctText={crashPctText}
            onMonthlyTextChange={(raw) => {
              setMonthlyText(raw);
              const next = Math.round(evalInput(raw, monthly, 0, 500_000) / 100) * 100;
              setMonthly(next);
            }}
            onYearsTextChange={(raw) => {
              setYearsText(raw);
              setYears(evalInput(raw, years, HOME_YEARS_MIN, HOME_YEARS_MAX, true));
            }}
            onAnnualPctTextChange={(raw) => {
              setAnnualPctText(raw);
              setAnnualPct(Number(evalInput(raw, annualPct, 0, 30).toFixed(2)));
            }}
            onCrashPctTextChange={(raw) => {
              setCrashPctText(raw);
              setCrashPct(Number(evalInput(raw, crashPct, -99, 0).toFixed(2)));
            }}
            commitMoney={commitMoney}
            commitYears={commitYears}
            commitAnnualPct={commitAnnualPct}
            commitCrashPct={commitCrashPct}
            bumpMonthly={bumpMonthly}
            bumpYears={bumpYears}
            bumpAnnualPct={bumpAnnualPct}
            bumpCrashPct={bumpCrashPct}
            onMonthlySlider={(v) => {
              const next = Math.round(clampNum(v, 0, 500_000) / 100) * 100;
              setMonthly(next);
              setMonthlyText(formatTwd(next));
            }}
            onYearsSlider={(v) => {
          const next = Math.round(clampNum(v, HOME_YEARS_MIN, HOME_YEARS_MAX));
          setYears(next);
          setYearsText(String(next));
        }}
            onAnnualPctSlider={(v) => {
              const next = Number(clampNum(v, 0, 30).toFixed(2));
              setAnnualPct(next);
              setAnnualPctText(String(next));
            }}
            onCrashPctSlider={(v) => {
              const next = Number(clampNum(v, -99, 0).toFixed(2));
              setCrashPct(next);
              setCrashPctText(String(next));
            }}
            hoveredCard={hoveredCard}
            setHoveredCard={setHoveredCard}
            onDownloadExcelChart={result.normalSeries.length > 0 ? handleDownloadExcelChart : undefined}
            excelDownloadBusy={excelDownloadBusy}
            chartSlot={
              result.normalSeries.length > 0 ? (
                <Quick10NetWorthChart
                  title="淨值走勢"
                  subtitle={`情境大盤約 ${crashMarketPoints.toLocaleString("en-US")} 點（對照）`}
                  years={chartYears}
                  seriesA={windCrashChart.a}
                  seriesB={windCrashChart.b}
                  principal={principalTotal}
                  legendA={`順風複利（年化 ${annualPct}%）`}
                  legendB={`期末大跌（${crashPct}%）`}
                />
              ) : null
            }
            footerSlot={
              <>
            {showToast && result.afterCrash > principalTotal && (
              <div
                style={{
                  position: "fixed",
                  left: "50%",
                  bottom: 18,
                  transform: "translateX(-50%)",
                  width: "min(92vw, 380px)",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(16,185,129,0.4)",
                  background: "rgba(6,78,59,0.9)",
                  color: "#d1fae5",
                  fontSize: 14,
                  fontWeight: 900,
                  lineHeight: 1.45,
                  boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
                  zIndex: 50,
                }}
              >
                👉 即便遇到大崩盤，你依然沒虧到本金，且多賺了 {formatTwd(result.afterCrash - principalTotal)} 元。
              </div>
            )}
            {crashMarketPoints <= historicalLowReference && (
              <div
                style={{
                  marginTop: 2,
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(250,204,21,0.35)",
                  background: "rgba(120,53,15,0.25)",
                  color: "#fde68a",
                  fontSize: 14,
                  fontWeight: 900,
                  lineHeight: 1.4,
                }}
              >
                即便跌回兩年前的水平，你的資產依然比多數「沒投資只消費」情境更有防禦力。
              </div>
            )}
              </>
            }
          />
        </section>
    </>
  );

  if (embedded) return homeSection;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020817",
        padding: "12px 12px 28px",
        color: "#e8eefc",
        display: "flex",
        justifyContent: "center",
        boxSizing: "border-box",
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420, margin: "0 auto", minWidth: 0, overflowX: "hidden", boxSizing: "border-box" }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div className="quick-brand-gold-shimmer" style={{ fontSize: 22, fontWeight: 900, opacity: 0.95, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", ["--quick-brand-duration" as string]: "4.2s" }}>
              財富自由計算機
            </div>
            <button
              type="button"
              onClick={onShare}
              aria-label="分享"
              style={{
                height: 40,
                padding: "0 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.08)",
                color: "#e8eefc",
                fontSize: 16,
                fontWeight: 900,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                cursor: "pointer",
              }}
            >
              {shareState === "copied" ? "已複製" : "分享"}
            </button>
          </div>
          <div className="quick10-title-gradient" style={{ fontSize: 30, fontWeight: 950, marginTop: 10, lineHeight: 1.12 }}>
            {QUICK10_DISPLAY_NAME}
          </div>
        </div>
        {homeSection}
        <QuickBottomCtaStack quickId={10} style={{ fontSize: 20 }} />
        <QuickBlogLinksToggle quickRoute="/quick-10" />
        <QuickSeoExtras id={10} />
        <QuickSeoArticle id={10} />
      </div>
    </main>
  );
}

export function QuickCalculator10View() {
  return <Quick10HomePanel />;
}
