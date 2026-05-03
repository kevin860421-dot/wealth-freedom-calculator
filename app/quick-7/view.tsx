"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { QuickBlogLinksToggle } from "@/app/components/quick-blog-links-toggle";
import { QuickDualLineChart } from "@/app/components/quick-dual-line-chart";
import { QuickSeoArticle } from "@/app/components/quick-seo-article";
import { clampNum, futureValueMonthlyContribution } from "@/lib/quick-calculator-math";
import {
  carLoanVsStockPath,
  CAR_LOAN_EQUITY_SHARE,
  evalCalcInputToNumber,
  formatSmartUnit,
  formatTwd,
  INVEST_ANNUAL_PCT,
  MILESTONE_YEARS,
  MONEY_MAX,
  MONEY_MIN,
  parseMoneyInputToInt,
  pillBtn,
  rangeStyle,
  sanitizeCalcInput,
  YEARS_MAX,
  YEARS_MIN,
  yearBtn,
} from "./logic";

export function QuickCalculator7View() {
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [monthlyInvest, setMonthlyInvest] = useState(30_000);
  const [monthlyInvestText, setMonthlyInvestText] = useState(formatTwd(30_000));
  const [years, setYears] = useState(5);
  const [yearsText, setYearsText] = useState("5");

  const yearsClamped = Math.round(clampNum(years, YEARS_MIN, YEARS_MAX));

  const yearsList = useMemo(() => {
    const base = [1, 5, 10, 20, 30, 40];
    const set = new Set<number>(base);
    set.add(yearsClamped);
    return Array.from(set).sort((a, b) => a - b);
  }, [yearsClamped]);

  const series = useMemo(() => {
    const m = Math.max(0, monthlyInvest);
    const stock = yearsList.map((yy) => Math.round(futureValueMonthlyContribution(m, INVEST_ANNUAL_PCT, yy)));
    const carPath = yearsList.map((yy) =>
      carLoanVsStockPath(m, yearsClamped, yy, CAR_LOAN_EQUITY_SHARE, INVEST_ANNUAL_PCT),
    );
    return { stock, carPath };
  }, [monthlyInvest, yearsClamped, yearsList]);

  const milestoneGaps = useMemo(() => {
    const m = Math.max(0, monthlyInvest);
    return MILESTONE_YEARS.map((yy) => {
      const stock = Math.round(futureValueMonthlyContribution(m, INVEST_ANNUAL_PCT, yy));
      const car = carLoanVsStockPath(m, yearsClamped, yy, CAR_LOAN_EQUITY_SHARE, INVEST_ANNUAL_PCT);
      const delta = stock - car;
      return { year: yy, stock, carLoan: car, delta };
    });
  }, [monthlyInvest, yearsClamped]);

  useEffect(() => {
    queueMicrotask(() => {
      const sp = new URLSearchParams(window.location.search);
      const mRaw = sp.get("m");
      const yRaw = sp.get("y");
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

  const commitMoney = (raw: string, current: number) => {
    const hasOps = /[+\-*/()]/.test(raw);
    const v = hasOps ? evalCalcInputToNumber(raw) : parseMoneyInputToInt(raw);
    return Math.round(clampNum(v ?? current, MONEY_MIN, MONEY_MAX) / 100) * 100;
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
    const raw = yearsText;
    const hasOps = /[+\-*/()]/.test(raw);
    const v = hasOps ? evalCalcInputToNumber(raw) : parseMoneyInputToInt(raw);
    const next = Math.round(clampNum(v ?? years, YEARS_MIN, YEARS_MAX));
    setYears(next);
    setYearsText(String(next));
  };

  const bumpYears = (delta: number) => {
    const v = parseMoneyInputToInt(yearsText) ?? years;
    const next = Math.round(clampNum(v + delta, YEARS_MIN, YEARS_MAX));
    setYears(next);
    setYearsText(String(next));
  };

  const onShare = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("m", String(monthlyInvest));
      url.searchParams.set("y", String(yearsClamped));
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
        @keyframes quick7TitleGradientShift {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 100% 50%;
          }
        }
        .quick7-title-gradient {
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
          animation: quick7TitleGradientShift 7s ease-in-out infinite alternate;
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 400, margin: "0 auto", boxSizing: "border-box", minWidth: 0, overflowX: "hidden" }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div className="quick-brand-gold-shimmer" style={{ fontSize: 20, fontWeight: 900, opacity: 0.95, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", ["--quick-brand-duration" as string]: "3.35s" }}>
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
            className="quick7-title-gradient"
            style={{
              fontSize: 28,
              fontWeight: 950,
              marginTop: 10,
              lineHeight: 1.12,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            車貸 VS 直接投入股市
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
              <div style={{ fontSize: 16, opacity: 0.9, fontWeight: 900 }}>月投入金額</div>
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
                  aria-label="月投入金額"
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
                <button type="button" onClick={() => bumpMonthlyInvest(-1000)} aria-label="月投減 1000" style={pillBtn}>
                  –
                </button>
                <button type="button" onClick={() => bumpMonthlyInvest(1000)} aria-label="月投加 1000" style={pillBtn}>
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
                aria-label="月投入金額拉條"
                style={rangeStyle}
              />
            </div>

            <div style={{ padding: 10, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
              <div style={{ fontSize: 16, opacity: 0.9, fontWeight: 900 }}>車貸年數／投入年數（同步）</div>
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
                      aria-label="車貸與試算年數"
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
                  <button type="button" onClick={() => bumpYears(-1)} aria-label="年數減 1" style={yearBtn}>
                    –
                  </button>
                  <button type="button" onClick={() => bumpYears(1)} aria-label="年數加 1" style={yearBtn}>
                    +
                  </button>
                </div>
                <div style={{ fontSize: 12, opacity: 0.82, fontWeight: 800, whiteSpace: "nowrap", flexShrink: 0 }}>
                  年化 {INVEST_ANNUAL_PCT}%（股市示意）
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

            <QuickDualLineChart
              years={yearsList}
              seriesA={series.carPath}
              seriesB={series.stock}
              legendA={`車貸情境（繳款中示意 ×${CAR_LOAN_EQUITY_SHARE}；結清後全進股市）`}
              legendB={`直接投入股市（複利 ${INVEST_ANNUAL_PCT}%）`}
              colorA="rgba(196, 122, 122, 0.92)"
              colorB="rgba(106, 165, 184, 0.92)"
              showPointValues
              formatPointValue={formatTwd}
              redLabelBelowYearThreshold={yearsClamped < 20 ? 999 : 20}
              redLabelExtraDrop={yearsClamped <= 3 ? 42 : yearsClamped <= 10 ? 24 : 14}
              redLabelXOffset={yearsClamped <= 3 ? 30 : yearsClamped <= 10 ? 14 : 8}
              topNotes={
                <>
                  <text x="0" y="16" fontSize="13" fill="rgba(252, 211, 77, 0.96)" fontWeight="900">
                    車貸／分界：{yearsClamped} 年結清後每月全額投入
                  </text>
                  <text x="0" y="34" fontSize="13" fill="rgba(134, 239, 172, 0.96)" fontWeight="900">
                    每月：{formatTwd(monthlyInvest)} 元
                  </text>
                </>
              }
            />

            <div style={{ padding: 12, borderRadius: 14, background: "rgba(0,0,0,0.20)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <div style={{ fontSize: 16, fontWeight: 900, opacity: 0.95 }}>固定里程碑·差距（股市 − 車貸路徑）</div>
              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                {milestoneGaps.map((row) => (
                  <div
                    key={row.year}
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      gap: 8,
                      padding: "8px 10px",
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <span style={{ fontWeight: 900, color: "rgba(226,232,240,0.95)" }}>{row.year} 年</span>
                    <span style={{ fontWeight: 850, color: row.delta >= 0 ? "rgba(134,239,172,0.98)" : "rgba(248,113,113,0.95)", fontVariantNumeric: "tabular-nums" }}>
                      差距 {row.delta >= 0 ? "+" : ""}
                      {formatSmartUnit(row.delta)}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, opacity: 0.65, fontWeight: 700, lineHeight: 1.4 }}>
                * 情境試算僅供教育討論；車貸利率、期數與投資報酬因人而異。
              </div>
            </div>

            <Link
              href="/"
              style={{
                marginTop: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
              🔍 進入財富自由計算機
            </Link>
            <QuickBlogLinksToggle quickRoute="/quick-7" />
            <QuickSeoArticle id={7} />
          </div>
        </section>
      </div>
    </main>
  );
}
