"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { QuickBlogLinksToggle } from "@/app/components/quick-blog-links-toggle";
import { QuickMainCalculatorCta } from "@/app/components/quick-main-calculator-cta";
import { QuickDualLineChart } from "@/app/components/quick-dual-line-chart";
import { QuickSeoArticle } from "@/app/components/quick-seo-article";
import { QuickSeoExtras } from "@/app/components/quick-seo-extras";
import { quickChartYearTicks } from "@/lib/quick-chart-series";
import { clampNum, simulateMonthlyBalances } from "@/lib/quick-calculator-math";
import {
  currentMarketIndex,
  evalInput,
  formatTwd,
  historicalLowReference,
  inputStyle,
  miniBtn,
  sanitizeCalcInput,
} from "./logic";

export function QuickCalculator10View() {
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
  const prevToastConditionRef = useRef(false);

  const commitMoney = (raw: string) => {
    const next = Math.round(evalInput(raw, monthly, 0, 500000) / 100) * 100;
    setMonthly(next);
    setMonthlyText(formatTwd(next));
  };

  const commitYears = (raw = yearsText) => {
    const next = evalInput(raw, years, 1, 40, true);
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
    const next = Math.round(clampNum(years + delta, 1, 40));
    setYears(next);
    setYearsText(String(next));
  };

  const months = Math.round(clampNum(years, 1, 40) * 12);
  const principalTotal = Math.max(0, monthly * 12 * years);
  const crashMarketPoints = Math.max(0, Math.round(currentMarketIndex * (1 + crashPct / 100)));

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
  const tickYears = useMemo(() => quickChartYearTicks(horizonYears), [horizonYears]);
  const windCrashChart = useMemo(() => {
    const normal = result.normalSeries;
    const monthsTotal = months;
    const hy = horizonYears;
    const a = tickYears.map((y) => {
      const mi = Math.min(y * 12, monthsTotal);
      const idx = mi - 1;
      return idx >= 0 && idx < normal.length ? normal[idx] : 0;
    });
    const b = tickYears.map((y) => {
      const mi = Math.min(y * 12, monthsTotal);
      const idx = mi - 1;
      if (idx < 0) return 0;
      if (y >= hy) return result.afterCrash;
      return normal[idx];
    });
    return { a, b };
  }, [result, months, horizonYears, tickYears]);

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
          const next = Math.round(clampNum(v, 1, 40));
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
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
      }}
    >
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
          <div
            className="quick10-title-gradient"
            style={{
              fontSize: 30,
              fontWeight: 950,
              marginTop: 10,
              lineHeight: 1.12,
              whiteSpace: "normal",
            }}
          >
            複利美夢 VS 崩盤現實 計算機
          </div>
        </div>

        <section
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 14,
            padding: 8,
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            width: "100%",
            boxSizing: "border-box",
            minWidth: 0,
          }}
        >
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, width: "100%", minWidth: 0 }}>
              <div style={{ padding: 8, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", minWidth: 0 }}>
                <div style={{ fontSize: 17, opacity: 0.95, fontWeight: 900 }}>每月投入金額</div>
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, width: "100%", minWidth: 0 }}>
                  <button type="button" onClick={() => commitMoney(String(monthly - 1000))} style={miniBtn} aria-label="減 1000">
                    –
                  </button>
                  <input
                    inputMode="numeric"
                    value={monthlyText}
                    onChange={(e) => {
                      const raw = sanitizeCalcInput(e.target.value);
                      setMonthlyText(raw);
                      const next = Math.round(evalInput(raw, monthly, 0, 500000) / 100) * 100;
                      setMonthly(next);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitMoney((e.currentTarget as HTMLInputElement).value);
                        (e.currentTarget as HTMLInputElement).blur();
                      }
                    }}
                    onBlur={(e) => commitMoney((e.currentTarget as HTMLInputElement).value)}
                    style={{ ...inputStyle, textAlign: "center" }}
                  />
                  <button type="button" onClick={() => commitMoney(String(monthly + 1000))} style={miniBtn} aria-label="加 1000">
                    +
                  </button>
                </div>
              </div>

              <div style={{ padding: 8, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", minWidth: 0 }}>
                <div style={{ fontSize: 17, opacity: 0.95, fontWeight: 900 }}>預計投入年數</div>
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, width: "100%", minWidth: 0 }}>
                  <button type="button" onClick={() => bumpYears(-1)} style={miniBtn} aria-label="年數減 1">
                    –
                  </button>
                  <input
                    inputMode="numeric"
                    value={yearsText}
                    onChange={(e) => {
                      const raw = sanitizeCalcInput(e.target.value);
                      setYearsText(raw);
                      const next = evalInput(raw, years, 1, 40, true);
                      setYears(next);
                    }}
                    onBlur={(e) => commitYears((e.currentTarget as HTMLInputElement).value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitYears((e.currentTarget as HTMLInputElement).value);
                        (e.currentTarget as HTMLInputElement).blur();
                      }
                    }}
                    style={{ ...inputStyle, textAlign: "center" }}
                  />
                  <button type="button" onClick={() => bumpYears(1)} style={miniBtn} aria-label="年數加 1">
                    +
                  </button>
                </div>
              </div>

              <label style={{ display: "grid", gap: 6, minWidth: 0, padding: 8, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
                <div style={{ fontSize: 17, opacity: 0.95, fontWeight: 900 }}>預期年化報酬率（%）</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", minWidth: 0 }}>
                  <button type="button" onClick={() => commitAnnualPct(String(annualPct - 1))} style={miniBtn} aria-label="年化減 1%">
                    –
                  </button>
                  <input
                    inputMode="decimal"
                    value={annualPctText}
                    onChange={(e) => {
                      const raw = sanitizeCalcInput(e.target.value);
                      setAnnualPctText(raw);
                      const next = Number(evalInput(raw, annualPct, 0, 30).toFixed(2));
                      setAnnualPct(next);
                    }}
                    onBlur={(e) => commitAnnualPct((e.currentTarget as HTMLInputElement).value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitAnnualPct((e.currentTarget as HTMLInputElement).value);
                        (e.currentTarget as HTMLInputElement).blur();
                      }
                    }}
                    style={{ ...inputStyle, textAlign: "center", fontSize: 18, height: 44 }}
                  />
                  <button type="button" onClick={() => commitAnnualPct(String(annualPct + 1))} style={miniBtn} aria-label="年化加 1%">
                    +
                  </button>
                </div>
              </label>
              <label style={{ display: "grid", gap: 6, minWidth: 0, padding: 8, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
                <div style={{ fontSize: 17, opacity: 0.95, fontWeight: 900 }}>期末大跌（%）</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", minWidth: 0 }}>
                  <button type="button" onClick={() => commitCrashPct(String(crashPct - 1))} style={miniBtn} aria-label="跌幅多 1%">
                    –
                  </button>
                  <input
                    inputMode="decimal"
                    value={crashPctText}
                    onChange={(e) => {
                      const raw = sanitizeCalcInput(e.target.value);
                      setCrashPctText(raw);
                      const next = Number(evalInput(raw, crashPct, -99, 0).toFixed(2));
                      setCrashPct(next);
                    }}
                    onBlur={(e) => commitCrashPct((e.currentTarget as HTMLInputElement).value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitCrashPct((e.currentTarget as HTMLInputElement).value);
                        (e.currentTarget as HTMLInputElement).blur();
                      }
                    }}
                    style={{ ...inputStyle, textAlign: "center", fontSize: 18, height: 44 }}
                  />
                  <button type="button" onClick={() => commitCrashPct(String(crashPct + 1))} style={miniBtn} aria-label="跌幅少 1%">
                    +
                  </button>
                </div>
                <div style={{ fontSize: 14, color: "#93c5fd", fontWeight: 800, lineHeight: 1.35 }}>
                  📉 對應大盤：{crashMarketPoints.toLocaleString("en-US")} 點
                </div>
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
              <div
                onMouseEnter={() => setHoveredCard("principal")}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.16)",
                  background: "rgba(15,23,42,0.55)",
                  transition: "transform 140ms ease, box-shadow 140ms ease",
                  transform: hoveredCard === "principal" ? "translateY(-2px)" : "translateY(0)",
                  boxShadow: hoveredCard === "principal" ? "0 8px 20px rgba(0,0,0,0.25)" : "none",
                }}
              >
                <div style={{ fontSize: 13, opacity: 0.9, fontWeight: 900, color: "rgba(229,231,235,0.95)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>投入本金</div>
                <div style={{ marginTop: 6, fontSize: 19, fontWeight: 950, color: "#e5e7eb", overflowWrap: "anywhere" }}>{formatTwd(principalTotal)}</div>
              </div>
              <div
                onMouseEnter={() => setHoveredCard("normal")}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid rgba(134,239,172,0.35)",
                  background: "rgba(20,83,45,0.26)",
                  transition: "transform 140ms ease, box-shadow 140ms ease",
                  transform: hoveredCard === "normal" ? "translateY(-2px)" : "translateY(0)",
                  boxShadow: hoveredCard === "normal" ? "0 10px 22px rgba(16,185,129,0.22)" : "none",
                }}
              >
                <div style={{ fontSize: 13, opacity: 0.95, fontWeight: 900, color: "rgba(134,239,172,0.98)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>順風時，你擁有的財富</div>
                <div style={{ marginTop: 6, fontSize: 19, fontWeight: 950, color: "rgba(134,239,172,0.98)", overflowWrap: "anywhere" }}>{formatTwd(result.terminal)}</div>
              </div>
              <div
                onMouseEnter={() => setHoveredCard("crash")}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid rgba(251,146,60,0.35)",
                  background: "rgba(124,45,18,0.26)",
                  transition: "transform 140ms ease, box-shadow 140ms ease",
                  transform: hoveredCard === "crash" ? "translateY(-2px)" : "translateY(0)",
                  boxShadow: hoveredCard === "crash" ? "0 10px 22px rgba(251,146,60,0.24)" : "none",
                }}
              >
                <div style={{ fontSize: 13, opacity: 0.95, fontWeight: 900, color: "rgba(251,146,60,0.98)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>最慘時，你還保有的底氣</div>
                <div style={{ marginTop: 6, fontSize: 19, fontWeight: 950, color: "rgba(251,146,60,0.98)", overflowWrap: "anywhere" }}>{formatTwd(result.afterCrash)}</div>
              </div>
            </div>

            {result.normalSeries.length > 0 ? (
              <QuickDualLineChart
                title="淨值走勢"
                years={tickYears}
                seriesA={windCrashChart.a}
                seriesB={windCrashChart.b}
                legendA={`順風複利（年化 ${annualPct}%）`}
                legendB={`期末大跌（${crashPct}%）`}
                colorA="rgba(134, 239, 172, 0.92)"
                colorB="rgba(251, 146, 60, 0.92)"
                dashSeriesB
                referenceLineY={principalTotal}
                showPointValues
                showPointValuesScope="last"
                pointLabelMode="smart"
                formatPointValue={formatTwd}
                topNotes={
                  <text x="0" y="16" fontSize="13" fill="rgba(251,146,60,0.95)" fontWeight="900">
                    情境大盤約 {crashMarketPoints.toLocaleString("en-US")} 點（對照）
                  </text>
                }
                legendFooter={
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 12, borderTop: "2px dashed rgba(229,231,235,0.9)", display: "inline-block" }} />
                      灰虚線為本金線（投入 {formatTwd(principalTotal)} 元）
                    </span>
                  </span>
                }
              />
            ) : null}

            <QuickMainCalculatorCta quickId={10} style={{ fontSize: 20 }} />
            <QuickBlogLinksToggle quickRoute="/quick-10" />
            <QuickSeoExtras id={10} />
            <QuickSeoArticle id={10} />

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
          </div>
        </section>
      </div>
    </main>
  );
}
