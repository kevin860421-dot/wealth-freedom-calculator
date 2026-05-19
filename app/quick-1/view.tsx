"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { QuickDualLineChart } from "@/app/components/quick-dual-line-chart";
import { QuickBlogLinksToggle } from "@/app/components/quick-blog-links-toggle";
import { QuickMainCalculatorCta } from "@/app/components/quick-main-calculator-cta";
import { QuickSeoArticle } from "@/app/components/quick-seo-article";
import { QuickSeoExtras } from "@/app/components/quick-seo-extras";
import { buildPrincipalVsCompoundSeries } from "@/lib/quick-chart-series";
import { clampNum, estimatedMonthlyPayoutFromBalance, fvMonthly } from "@/lib/quick-calculator-math";
import {
  ANNUAL_PCT,
  MONEY_BUMP,
  MONEY_MAX,
  MONEY_MIN,
  YEARS_MAX,
  YEARS_MIN,
  commitMoneyFromRaw,
  commitYearsFromRaw,
  formatTwd,
  sanitizeCalcInput,
} from "./logic";

type QuickCalculator1ViewProps = {
  showArticleToggle?: boolean;
};

export default function QuickCalculator1View({ showArticleToggle = true }: QuickCalculator1ViewProps) {
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [monthlyInvest, setMonthlyInvest] = useState(20_000);
  const [monthlyInvestText, setMonthlyInvestText] = useState(formatTwd(20_000));
  const [years, setYears] = useState(20);
  const [yearsText, setYearsText] = useState("20");

  const months = useMemo(() => Math.max(1, Math.round(clampNum(years, YEARS_MIN, YEARS_MAX) * 12)), [years]);

  const accumulatedFv = useMemo(() => {
    const bal = fvMonthly({
      annualReturnPct: ANNUAL_PCT,
      months,
      initial: 0,
      monthlyContribution: Math.max(0, monthlyInvest),
    });
    return Math.max(0, Math.round(bal / 100) * 100);
  }, [months, monthlyInvest]);

  const estimatedMonthlyPayout = useMemo(() => {
    const v = estimatedMonthlyPayoutFromBalance(accumulatedFv, ANNUAL_PCT);
    return Math.max(0, Math.round(v / 100) * 100);
  }, [accumulatedFv]);

  const principalCompoundChart = useMemo(
    () => buildPrincipalVsCompoundSeries(Math.max(0, monthlyInvest), ANNUAL_PCT, years),
    [monthlyInvest, years],
  );

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

  const commitMonthlyInvest = () => {
    const next = commitMoneyFromRaw(monthlyInvestText, monthlyInvest);
    setMonthlyInvest(next);
    setMonthlyInvestText(formatTwd(next));
  };

  const bumpMonthlyInvest = (delta: number) => {
    const next = Math.round(clampNum(monthlyInvest + delta, MONEY_MIN, MONEY_MAX) / 100) * 100;
    setMonthlyInvest(next);
    setMonthlyInvestText(formatTwd(next));
  };

  const commitYears = () => {
    const next = commitYearsFromRaw(yearsText, years);
    setYears(next);
    setYearsText(String(next));
  };

  const bumpYears = (delta: number) => {
    const next = Math.round(clampNum(years + delta, YEARS_MIN, YEARS_MAX));
    setYears(next);
    setYearsText(String(next));
  };

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
        @keyframes quick1TitleGradientShift {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 100% 50%;
          }
        }
        .quick1-title-gradient {
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
          animation: quick1TitleGradientShift 7s ease-in-out infinite alternate;
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
            className="quick1-title-gradient"
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
            📈 存股複利計算機
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
          <div style={{ display: "grid", gap: 12 }}>
            <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>月投金額</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", minWidth: 0 }}>
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
                  style={{ ...inputStyle, flex: "1 1 0", minWidth: 0 }}
                />
                <button type="button" onClick={() => bumpMonthlyInvest(-MONEY_BUMP)} style={miniBtn} aria-label={`月投金額減 ${MONEY_BUMP.toLocaleString("en-US")}`}>
                  –
                </button>
                <button type="button" onClick={() => bumpMonthlyInvest(MONEY_BUMP)} style={miniBtn} aria-label={`月投金額加 ${MONEY_BUMP.toLocaleString("en-US")}`}>
                  +
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
                style={sliderStyle}
              />
            </label>

            <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>預計幾年內達成</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", minWidth: 0 }}>
                <input
                  inputMode="numeric"
                  value={yearsText}
                  onChange={(e) => setYearsText(sanitizeCalcInput(e.target.value))}
                  onBlur={commitYears}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitYears();
                      (e.currentTarget as HTMLInputElement).blur();
                    }
                  }}
                  style={{ ...inputStyle, flex: "1 1 0", minWidth: 0 }}
                />
                <button type="button" onClick={() => bumpYears(-1)} style={miniBtn} aria-label="年數減 1">
                  –
                </button>
                <button type="button" onClick={() => bumpYears(1)} style={miniBtn} aria-label="年數加 1">
                  +
                </button>
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
                aria-label="預計年數拉條"
                style={sliderStyle}
              />
            </label>

            <div style={{ ...cardStyle, borderColor: "rgba(147,197,253,0.45)" }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>預計月領金額</div>
              <div style={{ marginTop: 8, fontSize: 32, fontWeight: 950, color: "#93c5fd" }}>{formatTwd(estimatedMonthlyPayout)}</div>
            </div>

            <QuickDualLineChart
              years={principalCompoundChart.ticks}
              seriesA={principalCompoundChart.principal}
              seriesB={principalCompoundChart.compound}
              legendA="直接存本金（不累積報酬）"
              legendB={`複利期末（年化 ${ANNUAL_PCT}%）`}
              showPointValues
              formatPointValue={formatTwd}
            />

            <QuickMainCalculatorCta quickId={1} />

            {showArticleToggle ? (
              <>
                <QuickBlogLinksToggle quickRoute="/quick-1" />
                <QuickSeoExtras id={1} />
                <QuickSeoArticle id={1} />
              </>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

const inputStyle: CSSProperties = {
  height: 44,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.2)",
  color: "#e8eefc",
  padding: "0 12px",
  fontSize: 20,
  fontWeight: 900,
  outline: "none",
  fontVariantNumeric: "tabular-nums",
};

const miniBtn: CSSProperties = {
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
  flexShrink: 0,
};

const sliderStyle: CSSProperties = {
  display: "block",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  marginTop: 4,
  height: 28,
  accentColor: "#3b82f6",
};

const cardStyle: CSSProperties = {
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.16)",
  padding: 12,
};

