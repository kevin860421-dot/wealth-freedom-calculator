"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { QuickBlogLinksToggle } from "@/app/components/quick-blog-links-toggle";
import { QuickDualLineChart } from "@/app/components/quick-dual-line-chart";
import { QuickSeoArticle } from "@/app/components/quick-seo-article";
import { buildPrincipalVsCompoundSeries } from "@/lib/quick-chart-series";
import { clampNum, estimatedMonthlyPayoutFromBalance, futureValueMonthlyContribution } from "@/lib/quick-calculator-math";
import { quickEtfNthMonthSnapshot, resolveDividendMonths } from "@/lib/quick-etf-period-dividend";
import { TICKER_PRESETS } from "../ticker-presets";
import {
  DEFAULT_START_MONTH,
  DEFAULT_START_YEAR,
  MONEY_MAX,
  MONEY_MIN,
  YEAR_MAX,
  YEAR_MIN,
  YEARS_MAX,
  YEARS_MIN,
  commitMoneyFromRaw,
  commitYearsFromRaw,
  formatTwd,
  parseYearMonth,
  sanitizeCalcInput,
  shiftCalendar,
} from "./logic";

export default function QuickCalculator4View() {
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [monthlyInvest, setMonthlyInvest] = useState(30000);
  const [monthlyInvestText, setMonthlyInvestText] = useState(formatTwd(30000));
  const [years, setYears] = useState(20);
  const [yearsText, setYearsText] = useState("20");
  const [etfCodeInput, setEtfCodeInput] = useState("0050");
  const [selectedCode, setSelectedCode] = useState("0050");

  const [startYM, setStartYM] = useState({ y: DEFAULT_START_YEAR, m: DEFAULT_START_MONTH });
  const [presetYM, setPresetYM] = useState({ y: DEFAULT_START_YEAR, m: DEFAULT_START_MONTH });
  const [nthPeriod, setNthPeriod] = useState(1);

  const filtered = useMemo(() => {
    const q = etfCodeInput.trim();
    if (!q) return TICKER_PRESETS.slice(0, 30);
    return TICKER_PRESETS.filter((p) => p.id.includes(q)).slice(0, 50);
  }, [etfCodeInput]);

  const selected = useMemo(
    () => TICKER_PRESETS.find((p) => p.id === selectedCode) ?? TICKER_PRESETS[0],
    [selectedCode],
  );

  const annualPct = selected?.annualReturn ?? 7;
  const dividendMonths = useMemo(() => resolveDividendMonths(selected), [selected]);

  const maxMonths = Math.max(1, years * 12);
  const nthClamped = useMemo(() => clampNum(nthPeriod, 1, maxMonths), [nthPeriod, maxMonths]);

  const periodResult = useMemo(
    () =>
      quickEtfNthMonthSnapshot(
        monthlyInvest,
        annualPct,
        dividendMonths,
        startYM.y,
        startYM.m,
        nthClamped,
      ),
    [monthlyInvest, annualPct, dividendMonths, startYM, nthClamped],
  );

  const totalAsset = useMemo(
    () => futureValueMonthlyContribution(monthlyInvest, annualPct, years),
    [monthlyInvest, annualPct, years],
  );

  const monthlyPayout = useMemo(
    () => estimatedMonthlyPayoutFromBalance(totalAsset, annualPct),
    [totalAsset, annualPct],
  );

  const principalCompoundChart = useMemo(() => {
    const y = clampNum(years, YEARS_MIN, YEARS_MAX);
    return buildPrincipalVsCompoundSeries(monthlyInvest, annualPct, y);
  }, [monthlyInvest, annualPct, years]);

  useEffect(() => {
    // Keep period selection valid when year range shrinks.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (nthPeriod > maxMonths) setNthPeriod(maxMonths);
  }, [maxMonths, nthPeriod]);

  useEffect(() => {
    queueMicrotask(() => {
      const sp = new URLSearchParams(window.location.search);
      const miRaw = sp.get("mi");
      const yRaw = sp.get("y");
      const etfRaw = sp.get("etf");
      const sy = sp.get("sy");
      const sm = sp.get("sm");
      const py = sp.get("py");
      const pm = sp.get("pm");
      const nRaw = sp.get("n");
      if (miRaw != null) {
        const v = Number(miRaw.replace(/,/g, ""));
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
      if (etfRaw != null && etfRaw.trim()) {
        const id = etfRaw.toUpperCase().trim();
        const hit = TICKER_PRESETS.find((p) => p.id === id);
        if (hit) {
          setSelectedCode(id);
          setEtfCodeInput(id);
        }
      }
      const s = parseYearMonth(sy, sm, DEFAULT_START_YEAR, DEFAULT_START_MONTH);
      setStartYM({ y: s.yy, m: s.mm });
      const p = parseYearMonth(py, pm, DEFAULT_START_YEAR, DEFAULT_START_MONTH);
      setPresetYM({ y: p.yy, m: p.mm });
      if (nRaw != null) {
        const v = Number(nRaw);
        if (Number.isFinite(v)) setNthPeriod(Math.max(1, Math.trunc(v)));
      }
    });
  }, []);

  const onShare = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("mi", String(monthlyInvest));
      url.searchParams.set("y", String(years));
      url.searchParams.set("etf", selectedCode);
      url.searchParams.set("sy", String(startYM.y));
      url.searchParams.set("sm", String(startYM.m));
      url.searchParams.set("py", String(presetYM.y));
      url.searchParams.set("pm", String(presetYM.m));
      url.searchParams.set("n", String(nthClamped));
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

  const bumpStartYear = (d: number) => {
    setStartYM((prev) => ({ y: Math.round(clampNum(prev.y + d, YEAR_MIN, YEAR_MAX)), m: prev.m }));
  };
  const bumpStartMonth = (d: number) => {
    setStartYM((prev) => {
      const next = shiftCalendar(prev.y, prev.m, d);
      return { y: next.y, m: next.m };
    });
  };

  const bumpPresetYear = (d: number) => {
    setPresetYM((prev) => ({ y: Math.round(clampNum(prev.y + d, YEAR_MIN, YEAR_MAX)), m: prev.m }));
  };
  const bumpPresetMonth = (d: number) => {
    setPresetYM((prev) => {
      const next = shiftCalendar(prev.y, prev.m, d);
      return { y: next.y, m: next.m };
    });
  };

  const restoreStartFromPreset = () => {
    setStartYM({ y: presetYM.y, m: presetYM.m });
  };

  const bumpNth = (d: number) => {
    setNthPeriod((n) => Math.round(clampNum(n + d, 1, maxMonths)));
  };

  const corrLabel = `${periodResult.calYear}年${periodResult.calMonth}月`;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b1220",
        padding: "12px",
        color: "#e8eefc",
        display: "flex",
        justifyContent: "center",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <style jsx global>{`
        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }
      `}</style>
      <div style={{ width: "100%", maxWidth: 420, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div className="quick-brand-gold-shimmer" style={{ fontSize: 20, fontWeight: 900, ["--quick-brand-duration" as string]: "2.6s" }}>財富自由計算機</div>
          <button
            type="button"
            onClick={onShare}
            aria-label="分享"
            style={{
              color: "#e8eefc",
              fontWeight: 800,
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              font: "inherit",
            }}
          >
            {shareState === "copied" ? "已複製" : "分享"}
          </button>
        </div>

        <div style={{ fontSize: 28, fontWeight: 950, marginBottom: 8 }}>
          📈 ETF 月領試算器
        </div>

        <section style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: 10, background: "rgba(255,255,255,0.05)" }}>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 8, minWidth: 0 }}>
              <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>每月投入金額</div>
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
                  <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 4, flex: "0 0 34px" }}>
                    <button
                      type="button"
                      onClick={() => bumpMonthlyInvest(1000)}
                      style={{ ...miniBtn, width: 34, height: 20, fontSize: 14, borderRadius: 8 }}
                      aria-label="每月投入加 1000"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => bumpMonthlyInvest(-1000)}
                      style={{ ...miniBtn, width: 34, height: 20, fontSize: 14, borderRadius: 8 }}
                      aria-label="每月投入減 1000"
                    >
                      –
                    </button>
                  </div>
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
                  aria-label="每月投入金額拉條"
                  style={sliderStyle}
                />
              </label>

              <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>預計幾年（上限 {YEARS_MAX}）</div>
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
                  <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 4, flex: "0 0 34px" }}>
                    <button
                      type="button"
                      onClick={() => bumpYears(1)}
                      style={{ ...miniBtn, width: 34, height: 20, fontSize: 14, borderRadius: 8 }}
                      aria-label="預計年數加 1"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => bumpYears(-1)}
                      style={{ ...miniBtn, width: 34, height: 20, fontSize: 14, borderRadius: 8 }}
                      aria-label="預計年數減 1"
                    >
                      –
                    </button>
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
                  aria-label="預計幾年拉條"
                  style={sliderStyle}
                />
              </label>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                gap: 8,
                minWidth: 0,
              }}
            >
              <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>ETF 代碼</div>
                <input
                  value={etfCodeInput}
                  onChange={(e) => setEtfCodeInput(e.target.value.toUpperCase().trim())}
                  style={{ ...inputStyle, width: "100%", minWidth: 0 }}
                />
              </label>
              <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>標的下拉</div>
                <select
                  value={selectedCode}
                  onChange={(e) => {
                    setSelectedCode(e.target.value);
                    setEtfCodeInput(e.target.value);
                  }}
                  style={{ ...inputStyle, width: "100%", minWidth: 0 }}
                >
                  {filtered.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id}｜{p.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <details style={{ ...cardStyle, borderColor: "rgba(251,191,36,0.35)" }}>
              <summary style={{ fontSize: 15, fontWeight: 800, cursor: "pointer" }}>期別設定</summary>
              <div style={{ marginTop: 10, display: "grid", gap: 10, background: "rgba(2,6,23,0.30)", borderRadius: 10, padding: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
                  <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>第一欄（初始點）</div>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>計畫開始</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button type="button" onClick={() => bumpStartYear(-1)} style={miniBtn} aria-label="開始年減 1">
                        −
                      </button>
                      <span style={{ fontSize: 18, fontWeight: 900, minWidth: 52, textAlign: "center" }}>{startYM.y}</span>
                      <button type="button" onClick={() => bumpStartYear(1)} style={miniBtn} aria-label="開始年加 1">
                        +
                      </button>
                      <span style={{ fontSize: 14, opacity: 0.9 }}>年</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button type="button" onClick={() => bumpStartMonth(-1)} style={miniBtn} aria-label="開始月減 1">
                        −
                      </button>
                      <span style={{ fontSize: 18, fontWeight: 900, minWidth: 36, textAlign: "center" }}>{startYM.m}</span>
                      <button type="button" onClick={() => bumpStartMonth(1)} style={miniBtn} aria-label="開始月加 1">
                        +
                      </button>
                      <span style={{ fontSize: 14, opacity: 0.9 }}>月</span>
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>第二欄（進度）</div>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>模擬進度</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button type="button" onClick={() => bumpNth(-1)} style={miniBtn} aria-label="期數減 1">
                        −
                      </button>
                      <span style={{ fontSize: 18, fontWeight: 900, minWidth: 44, textAlign: "center" }}>{nthClamped}</span>
                      <button type="button" onClick={() => bumpNth(1)} style={miniBtn} aria-label="期數加 1">
                        +
                      </button>
                      <span style={{ fontSize: 14, opacity: 0.9 }}>次</span>
                    </div>
                    <div style={{ fontSize: 14, color: "#fde68a", fontWeight: 900 }}>
                      對應年月：{corrLabel}
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>第三欄（檢視點）</div>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>目標月份</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button type="button" onClick={() => bumpPresetYear(-1)} style={miniBtn} aria-label="預設年減 1">
                        −
                      </button>
                      <span style={{ fontSize: 18, fontWeight: 900, minWidth: 52, textAlign: "center" }}>{presetYM.y}</span>
                      <button type="button" onClick={() => bumpPresetYear(1)} style={miniBtn} aria-label="預設年加 1">
                        +
                      </button>
                      <span style={{ fontSize: 14, opacity: 0.9 }}>年</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button type="button" onClick={() => bumpPresetMonth(-1)} style={miniBtn} aria-label="預設月減 1">
                        −
                      </button>
                      <span style={{ fontSize: 18, fontWeight: 900, minWidth: 36, textAlign: "center" }}>{presetYM.m}</span>
                      <button type="button" onClick={() => bumpPresetMonth(1)} style={miniBtn} aria-label="預設月加 1">
                        +
                      </button>
                      <span style={{ fontSize: 14, opacity: 0.9 }}>月</span>
                      <button
                        type="button"
                        onClick={restoreStartFromPreset}
                        style={{
                          marginLeft: "auto",
                          padding: "8px 12px",
                          borderRadius: 10,
                          border: "1px solid rgba(255,255,255,0.2)",
                          background: "rgba(255,255,255,0.08)",
                          color: "#e8eefc",
                          fontWeight: 800,
                          cursor: "pointer",
                          fontSize: 14,
                        }}
                      >
                        恢復
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 6, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>該期股利（粗估）</div>
                  <div style={{ marginTop: 6, fontSize: 26, fontWeight: 950, color: "#fcd34d", fontVariantNumeric: "tabular-nums" }}>
                    {formatTwd(periodResult.grossDividend)}
                  </div>
                </div>
              </div>
            </details>

            <div style={{ ...cardStyle, borderColor: "rgba(147,197,253,0.4)" }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>可月領多少</div>
              <div style={{ marginTop: 8, fontSize: 32, fontWeight: 950, color: "#93c5fd" }}>{formatTwd(monthlyPayout)}</div>
            </div>

            <div style={{ ...cardStyle, borderColor: "rgba(74,222,128,0.4)" }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>總資產</div>
              <div style={{ marginTop: 8, fontSize: 32, fontWeight: 950, color: "#4ade80" }}>{formatTwd(totalAsset)}</div>
            </div>

            <QuickDualLineChart
              years={principalCompoundChart.ticks}
              seriesA={principalCompoundChart.principal}
              seriesB={principalCompoundChart.compound}
              legendA="直接存本金（不累積報酬）"
              legendB={`複利期末（年化 ${annualPct}% · ${selected.label}）`}
            />

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
                boxShadow: "0 10px 24px rgba(37,99,235,0.45)",
                color: "white",
                fontSize: 18,
                fontWeight: 900,
                lineHeight: 1.4,
                letterSpacing: "0.12em",
              }}
            >
              <span style={{ lineHeight: 1.4, letterSpacing: "0.12em" }}>🔍 進入財富自由計算機</span>
            </Link>
            <QuickBlogLinksToggle quickRoute="/quick-4" />
            <QuickSeoArticle id={4} />
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
