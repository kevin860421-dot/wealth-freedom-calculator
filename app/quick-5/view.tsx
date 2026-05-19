"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { QuickBlogLinksToggle } from "@/app/components/quick-blog-links-toggle";
import { QuickMainCalculatorCta } from "@/app/components/quick-main-calculator-cta";
import { QuickDualLineChart } from "@/app/components/quick-dual-line-chart";
import { QuickSeoArticle } from "@/app/components/quick-seo-article";
import { QuickSeoExtras } from "@/app/components/quick-seo-extras";
import { buildPrincipalVsCompoundSeries } from "@/lib/quick-chart-series";
import { clampNum, futureValueMonthlyContribution } from "@/lib/quick-calculator-math";
import {
  INVEST_ANNUAL_PCT,
  MONEY_MAX,
  MONEY_MIN,
  YEARS_MAX,
  YEARS_MIN,
  commitMoney,
  commitYearsValue,
  formatTwd,
  parseMoneyInputToInt,
  sanitizeCalcInput,
} from "./logic";

export default function QuickCalculator5View() {
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [monthlyInvest, setMonthlyInvest] = useState(20_000);
  const [monthlyInvestText, setMonthlyInvestText] = useState(formatTwd(20_000));
  const [years, setYears] = useState(20);
  const [yearsText, setYearsText] = useState("20");

  const { directPrincipal, compoundedFv } = useMemo(() => {
    const m = Math.max(0, monthlyInvest);
    const y = clampNum(years, YEARS_MIN, YEARS_MAX);
    const months = Math.round(y * 12);
    const direct = Math.round(m * months);
    const fv = futureValueMonthlyContribution(m, INVEST_ANNUAL_PCT, y);
    return { directPrincipal: direct, compoundedFv: Math.round(fv) };
  }, [monthlyInvest, years]);

  const principalCompoundChart = useMemo(() => {
    const y = clampNum(years, YEARS_MIN, YEARS_MAX);
    return buildPrincipalVsCompoundSeries(monthlyInvest, INVEST_ANNUAL_PCT, y);
  }, [monthlyInvest, years]);

  useEffect(() => {
    queueMicrotask(() => {
      const sp = new URLSearchParams(window.location.search);
      const mRaw = sp.get("m") ?? sp.get("monthly");
      const yRaw = sp.get("y") ?? sp.get("years");
      if (mRaw != null) {
        const v = Number(mRaw.replace(/,/g, ""));
        if (Number.isFinite(v)) {
          const next = Math.round(clampNum(v, MONEY_MIN, MONEY_MAX) / 100) * 100;
          setMonthlyInvest(next);
          setMonthlyInvestText(formatTwd(next));
        }
      }
      if (yRaw != null) {
        const v = Number(yRaw);
        if (Number.isFinite(v)) {
          const next = Math.round(clampNum(v, YEARS_MIN, YEARS_MAX));
          setYears(next);
          setYearsText(String(next));
        }
      }
    });
  }, []);

  const onShare = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("m", String(monthlyInvest));
      url.searchParams.set("y", String(years));
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

  const commitMonthlyInvest = () => {
    const next = commitMoney(monthlyInvestText, monthlyInvest);
    setMonthlyInvest(next);
    setMonthlyInvestText(formatTwd(next));
  };

  const bumpMonthlyInvest = (delta: number) => {
    const next = Math.round(clampNum(monthlyInvest + delta, MONEY_MIN, MONEY_MAX) / 100) * 100;
    setMonthlyInvest(next);
    setMonthlyInvestText(formatTwd(next));
  };

  const commitYears = () => {
    const next = commitYearsValue(yearsText, years);
    setYears(next);
    setYearsText(String(next));
  };

  const bumpYears = (delta: number) => {
    const v = parseMoneyInputToInt(yearsText) ?? years;
    const next = Math.round(clampNum(v + delta, YEARS_MIN, YEARS_MAX));
    setYears(next);
    setYearsText(String(next));
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
      }}
    >
      <style jsx global>{`
        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }
        @keyframes quick5TitleGradientShift {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 100% 50%;
          }
        }
        .quick5-title-gradient {
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
          animation: quick5TitleGradientShift 7s ease-in-out infinite alternate;
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 400, margin: "0 auto", boxSizing: "border-box", minWidth: 0, overflowX: "hidden" }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div className="quick-brand-gold-shimmer" style={{ fontSize: 20, fontWeight: 900, opacity: 0.95, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", ["--quick-brand-duration" as string]: "1.9s" }}>
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
            className="quick5-title-gradient"
            style={{
              fontSize: 30,
              fontWeight: 950,
              marginTop: 10,
              lineHeight: 1.12,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            雪球效應：本金 vs 複利
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
            <div style={{ padding: 10, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
              <div style={{ fontSize: 16, opacity: 0.9, fontWeight: 900 }}>月投金額</div>
              <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, width: "100%", minWidth: 0 }}>
                <input
                  inputMode="numeric"
                  value={monthlyInvestText}
                  onChange={(e) => setMonthlyInvestText(sanitizeCalcInput(e.target.value))}
                  onBlur={commitMonthlyInvest}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitMonthlyInvest();
                      (e.currentTarget as HTMLInputElement).blur();
                    }
                  }}
                  aria-label="月投金額"
                  style={{
                    flex: "1 1 160px",
                    minWidth: 0,
                    height: 48,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.20)",
                    color: "#e8eefc",
                    padding: "0 12px",
                    outline: "none",
                    fontSize: 22,
                    fontWeight: 950,
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
                <button type="button" onClick={() => bumpMonthlyInvest(1000)} aria-label="月投加 1000" style={pillBtn}>
                  +
                </button>
                <button type="button" onClick={() => bumpMonthlyInvest(-1000)} aria-label="月投減 1000" style={pillBtn}>
                  –
                </button>
              </div>
              <input
                type="range"
                min={MONEY_MIN}
                max={MONEY_MAX}
                step={100}
                value={clampNum(monthlyInvest, MONEY_MIN, MONEY_MAX)}
                onChange={(e) => {
                  const v = Math.round(clampNum(Number(e.target.value), MONEY_MIN, MONEY_MAX) / 100) * 100;
                  setMonthlyInvest(v);
                  setMonthlyInvestText(formatTwd(v));
                }}
                aria-label="月投金額拉條"
                style={rangeStyle}
              />
            </div>

            <div style={{ padding: 10, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
              <div style={{ fontSize: 16, opacity: 0.9, fontWeight: 900 }}>預計幾年</div>
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
                          if (n !== null) setYears(Math.round(clampNum(n, YEARS_MIN, YEARS_MAX)));
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
                  <button type="button" onClick={() => bumpYears(1)} aria-label="年數加 1" style={yearBtn}>
                    +
                  </button>
                  <button type="button" onClick={() => bumpYears(-1)} aria-label="年數減 1" style={yearBtn}>
                    –
                  </button>
                </div>
                <div style={{ fontSize: 12, opacity: 0.82, fontWeight: 800, whiteSpace: "nowrap", flexShrink: 0 }}>
                  上限 {YEARS_MAX} 年 · 年化 {INVEST_ANNUAL_PCT}%
                </div>
              </div>
              <input
                type="range"
                min={YEARS_MIN}
                max={YEARS_MAX}
                step={1}
                value={clampNum(years, YEARS_MIN, YEARS_MAX)}
                onChange={(e) => {
                  const v = Math.round(clampNum(Number(e.target.value), YEARS_MIN, YEARS_MAX));
                  setYears(v);
                  setYearsText(String(v));
                }}
                aria-label="年數拉條"
                style={rangeStyle}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                gap: 10,
                minWidth: 0,
              }}
            >
              <div style={{ padding: 12, borderRadius: 14, background: "rgba(0,0,0,0.16)", border: "1px solid rgba(255,255,255,0.12)", minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, opacity: 0.9 }}>直接存本金</div>
                <div style={{ marginTop: 8, fontSize: 22, fontWeight: 950, color: "#e5e7eb", fontVariantNumeric: "tabular-nums", wordBreak: "break-all" }}>
                  {formatTwd(directPrincipal)}
                </div>
              </div>
              <div style={{ padding: 12, borderRadius: 14, background: "rgba(0,0,0,0.16)", border: "1px solid rgba(74,222,128,0.35)", minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, opacity: 0.95, color: "rgba(187,247,208,0.95)" }}>股市利滾利</div>
                <div style={{ marginTop: 8, fontSize: 22, fontWeight: 950, color: "#4ade80", fontVariantNumeric: "tabular-nums", wordBreak: "break-all" }}>
                  {formatTwd(compoundedFv)}
                </div>
              </div>
            </div>

            <QuickDualLineChart
              years={principalCompoundChart.ticks}
              seriesA={principalCompoundChart.principal}
              seriesB={principalCompoundChart.compound}
              legendA="直接存本金（不累積報酬）"
              legendB={`複利期末（年化 ${INVEST_ANNUAL_PCT}%）`}
              showPointValues
              formatPointValue={formatTwd}
            />

            <QuickMainCalculatorCta quickId={5} style={{ marginTop: 4 }} />
            <QuickBlogLinksToggle quickRoute="/quick-5" />
            <QuickSeoExtras id={5} />
            <QuickSeoArticle id={5} />
          </div>
        </section>
      </div>
    </main>
  );
}

const pillBtn: CSSProperties = {
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
};

const yearBtn: CSSProperties = {
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
};

const rangeStyle: CSSProperties = {
  display: "block",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  marginTop: 6,
  height: 28,
  accentColor: "#3b82f6",
};
