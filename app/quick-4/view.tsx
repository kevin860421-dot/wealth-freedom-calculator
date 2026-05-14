"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { QuickBlogLinksToggle } from "@/app/components/quick-blog-links-toggle";
import { QuickSeoArticle } from "@/app/components/quick-seo-article";
import { clampNum } from "@/lib/quick-calculator-math";
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
  evalCalcInputToNumber,
  formatTwd,
  parseMoneyInputToInt,
  parseYearMonth,
  sanitizeCalcInput,
  shiftCalendar,
} from "./logic";

export default function QuickCalculator4View() {
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [monthlyInvest, setMonthlyInvest] = useState(20000);
  const [monthlyInvestText, setMonthlyInvestText] = useState(formatTwd(20000));
  const [years, setYears] = useState(20);
  const [yearsText, setYearsText] = useState("20");
  const [etfCodeInput, setEtfCodeInput] = useState("0050");
  const [selectedCode, setSelectedCode] = useState("0050");

  const [startYM, setStartYM] = useState({ y: DEFAULT_START_YEAR, m: DEFAULT_START_MONTH });
  const [nthPeriod, setNthPeriod] = useState(1);
  const [nthText, setNthText] = useState("1");
  const [periodYearText, setPeriodYearText] = useState(String(DEFAULT_START_YEAR));
  const [periodMonthText, setPeriodMonthText] = useState(String(DEFAULT_START_MONTH));

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
  const ratio54cPct = useMemo(() => {
    const parsed = Number(selected?.ratio54c ?? "100");
    return Number.isFinite(parsed) ? clampNum(parsed, 0, 100) : 100;
  }, [selected]);

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
        ratio54cPct,
      ),
    [monthlyInvest, annualPct, dividendMonths, startYM, nthClamped, ratio54cPct],
  );

  const periodOptions = useMemo(() => {
    return Array.from({ length: maxMonths }, (_, i) => {
      const nth = i + 1;
      const calMonth = ((startYM.m - 1 + i) % 12) + 1;
      const calYear = startYM.y + Math.floor((startYM.m - 1 + i) / 12);
      return { nth, calYear, calMonth };
    });
  }, [maxMonths, startYM]);
  const selectedPeriodOption = periodOptions[nthClamped - 1] ?? periodOptions[0];
  const selectedYear = selectedPeriodOption?.calYear ?? startYM.y;
  const selectedMonth = selectedPeriodOption?.calMonth ?? startYM.m;

  const totalAsset = useMemo(() => periodResult.balanceEnd, [periodResult.balanceEnd]);

  const monthlyPayout = useMemo(() => periodResult.afterTaxDividend, [periodResult.afterTaxDividend]);

  useEffect(() => {
    // Keep period selection valid when year range shrinks.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (nthPeriod > maxMonths) setNthPeriod(maxMonths);
  }, [maxMonths, nthPeriod]);

  useEffect(() => {
    setNthText(String(nthClamped));
    setPeriodYearText(String(selectedYear));
    setPeriodMonthText(String(selectedMonth));
  }, [nthClamped, selectedYear, selectedMonth]);

  useEffect(() => {
    queueMicrotask(() => {
      const sp = new URLSearchParams(window.location.search);
      const miRaw = sp.get("mi") ?? sp.get("monthly");
      const yRaw = sp.get("y") ?? sp.get("years");
      const etfRaw = sp.get("etf");
      const sy = sp.get("sy") ?? sp.get("start_year");
      const sm = sp.get("sm") ?? sp.get("start_month");
      const nRaw = sp.get("n") ?? sp.get("nth");
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

  const bumpNth = (d: number) => {
    setNthPeriod((n) => Math.round(clampNum(n + d, 1, maxMonths)));
  };

  const evalIntInput = (raw: string, fallback: number, min: number, max: number) => {
    const hasOps = /[+\-*/()]/.test(raw);
    const parsed = hasOps ? evalCalcInputToNumber(raw) : parseMoneyInputToInt(raw);
    return Math.round(clampNum(parsed ?? fallback, min, max));
  };

  const syncNthByYearMonth = (yy: number, mm: number) => {
    const targetYear = Math.round(clampNum(yy, YEAR_MIN, YEAR_MAX));
    const targetMonth = Math.round(clampNum(mm, 1, 12));
    const hit =
      periodOptions.find((p) => p.calYear === targetYear && p.calMonth === targetMonth) ??
      periodOptions.find((p) => p.calYear === targetYear) ??
      periodOptions[periodOptions.length - 1];
    if (hit) setNthPeriod(hit.nth);
  };

  const commitNthInput = () => {
    const next = evalIntInput(nthText, nthClamped, 1, maxMonths);
    setNthPeriod(next);
    setNthText(String(next));
  };

  const commitPeriodYearInput = () => {
    const nextYear = evalIntInput(periodYearText, selectedYear, YEAR_MIN, YEAR_MAX);
    syncNthByYearMonth(nextYear, selectedMonth);
  };

  const commitPeriodMonthInput = () => {
    const nextMonth = evalIntInput(periodMonthText, selectedMonth, 1, 12);
    syncNthByYearMonth(selectedYear, nextMonth);
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
          📈 ETF 領息夢想模擬器
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
                gridTemplateColumns: "minmax(0, 0.82fr) minmax(0, 1.18fr)",
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
                <div style={{ fontSize: 15, fontWeight: 800 }}>標的</div>
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

            <div style={{ ...cardStyle, borderColor: "rgba(251,191,36,0.35)", display: "grid", gap: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>期別設定（直接選）</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
                  <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>第幾次投入</span>
                  <div style={periodPickerRowStyle}>
                    <input
                      inputMode="numeric"
                      value={nthText}
                      onChange={(e) => {
                        const raw = sanitizeCalcInput(e.target.value);
                        setNthText(raw);
                        if (!/[+\-*/()]/.test(raw)) {
                          const n = parseMoneyInputToInt(raw);
                          if (n != null) setNthPeriod(Math.round(clampNum(n, 1, maxMonths)));
                        }
                      }}
                      onBlur={commitNthInput}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          commitNthInput();
                          (e.currentTarget as HTMLInputElement).blur();
                        }
                      }}
                      style={{ ...inputStyle, height: 36, fontSize: 14, padding: "0 8px", minWidth: 0, width: "100%" }}
                    />
                    <div style={periodPickerStepperColStyle}>
                      <button type="button" onClick={() => bumpNth(1)} style={periodPickerStepperBtnStyle} aria-label="期數加 1">
                        +
                      </button>
                      <button type="button" onClick={() => bumpNth(-1)} style={periodPickerStepperBtnStyle} aria-label="期數減 1">
                        −
                      </button>
                    </div>
                  </div>
                </label>
                <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
                  <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>年份</span>
                  <div style={periodPickerRowStyle}>
                    <input
                      inputMode="numeric"
                      value={periodYearText}
                      onChange={(e) => {
                        const raw = sanitizeCalcInput(e.target.value);
                        setPeriodYearText(raw);
                        if (!/[+\-*/()]/.test(raw)) {
                          const n = parseMoneyInputToInt(raw);
                          if (n != null) syncNthByYearMonth(Math.round(clampNum(n, YEAR_MIN, YEAR_MAX)), selectedMonth);
                        }
                      }}
                      onBlur={commitPeriodYearInput}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          commitPeriodYearInput();
                          (e.currentTarget as HTMLInputElement).blur();
                        }
                      }}
                      style={{ ...inputStyle, height: 36, fontSize: 14, padding: "0 8px", minWidth: 0, width: "100%" }}
                    />
                    <div style={periodPickerStepperColStyle}>
                      <button type="button" onClick={() => syncNthByYearMonth(selectedYear + 1, selectedMonth)} style={periodPickerStepperBtnStyle} aria-label="年份加 1">
                        +
                      </button>
                      <button type="button" onClick={() => syncNthByYearMonth(selectedYear - 1, selectedMonth)} style={periodPickerStepperBtnStyle} aria-label="年份減 1">
                        −
                      </button>
                    </div>
                  </div>
                </label>
                <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
                  <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>月份</span>
                  <div style={periodPickerRowStyle}>
                    <input
                      inputMode="numeric"
                      value={periodMonthText}
                      onChange={(e) => {
                        const raw = sanitizeCalcInput(e.target.value);
                        setPeriodMonthText(raw);
                        if (!/[+\-*/()]/.test(raw)) {
                          const n = parseMoneyInputToInt(raw);
                          if (n != null) syncNthByYearMonth(selectedYear, Math.round(clampNum(n, 1, 12)));
                        }
                      }}
                      onBlur={commitPeriodMonthInput}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          commitPeriodMonthInput();
                          (e.currentTarget as HTMLInputElement).blur();
                        }
                      }}
                      style={{ ...inputStyle, height: 36, fontSize: 14, padding: "0 8px", minWidth: 0, width: "100%" }}
                    />
                    <div style={periodPickerStepperColStyle}>
                      <button type="button" onClick={() => syncNthByYearMonth(selectedYear, selectedMonth + 1)} style={periodPickerStepperBtnStyle} aria-label="月份加 1">
                        +
                      </button>
                      <button type="button" onClick={() => syncNthByYearMonth(selectedYear, selectedMonth - 1)} style={periodPickerStepperBtnStyle} aria-label="月份減 1">
                        −
                      </button>
                    </div>
                  </div>
                </label>
              </div>

              <div style={{ fontSize: 13, color: "#fef08a", fontWeight: 800 }}>
                對應：第 {periodResult.nth} 次投入（{corrLabel}）
              </div>
            </div>

            <div style={{ ...cardStyle, borderColor: "rgba(147,197,253,0.4)" }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>可月領多少</div>
              <div style={{ marginTop: 8, fontSize: 32, fontWeight: 950, color: "#93c5fd" }}>{formatTwd(monthlyPayout)}</div>
              <div style={{ marginTop: 4, fontSize: 12, color: "rgba(191,219,254,0.9)" }}>依標的配息月份；非配息月為 0</div>
            </div>

            <div style={{ ...cardStyle, borderColor: "rgba(74,222,128,0.4)" }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>總資產</div>
              <div style={{ marginTop: 8, fontSize: 32, fontWeight: 950, color: "#4ade80" }}>{formatTwd(totalAsset)}</div>
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

const periodPickerRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 26px",
  alignItems: "center",
  gap: 6,
  minWidth: 0,
};

const periodPickerStepperColStyle: CSSProperties = {
  display: "grid",
  gridTemplateRows: "1fr 1fr",
  gap: 4,
  width: 26,
  minWidth: 26,
};

const periodPickerStepperBtnStyle: CSSProperties = {
  width: 26,
  height: 16,
  borderRadius: 6,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
  color: "#e8eefc",
  fontSize: 12,
  fontWeight: 900,
  lineHeight: 1,
  padding: 0,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

