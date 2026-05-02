"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

function clampNum(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatTwd(n: number) {
  const v = Math.round(Number.isFinite(n) ? n : 0);
  return v.toLocaleString("en-US");
}

function sanitizeCalcInput(s: string) {
  return s.replace(/[^\d+\-*/().,%\s]/g, "");
}

function evalCalcInputToNumber(s: string): number | null {
  try {
    const cleaned = s.replace(/,/g, "").trim();
    if (!cleaned) return null;
    if (/[^0-9+\-*/().%\s]/.test(cleaned)) return null;
    const expr = cleaned.replace(/(\d+(?:\.\d+)?)\s*%/g, "($1/100)");
    // eslint-disable-next-line no-new-func
    const v = Function(`"use strict"; return (${expr});`)();
    const num = Number(v);
    if (!Number.isFinite(num)) return null;
    return num;
  } catch {
    return null;
  }
}

function parseMoneyInputToInt(s: string): number | null {
  const cleaned = s.replace(/,/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function simulateMonthlyBalances({
  annualReturnPct,
  months,
  initial,
  monthlyContribution,
}: {
  annualReturnPct: number;
  months: number;
  initial: number;
  monthlyContribution: number;
}): number[] {
  const r = clampNum(annualReturnPct, 0, 99) / 100 / 12;
  let bal = Math.max(0, Number.isFinite(initial) ? initial : 0);
  const c = Math.max(0, Number.isFinite(monthlyContribution) ? monthlyContribution : 0);
  const mMax = Math.max(0, Math.trunc(months));
  const out: number[] = [];
  for (let m = 1; m <= mMax; m++) {
    bal = bal * (1 + r) + c;
    out.push(bal);
  }
  return out;
}

const SEO_ARTICLE =
  "定期定額投資大盤型資產，多數人只看年化報酬的假設，卻忽略「持有途中一定會遇到回撤」這件事。這台小計算機用簡化情境：先依月扣款與年化報酬，複利滾出期末資產；再把期末一次性乘上（1＋跌幅），模擬在最後一刻遭遇類似金融海嘯、疫情或升息循環造成的大幅修正。它不是預言未來，而是用可調參數提醒：長期持有資產的波動，往往不等於原本就以消費分期換來的確定性支出——車輛折舊與利息成本通常不可逆，而資產即便是大幅回撤後，仍可能保留一部分過去累積的本金與報酬。你可以把每月投入、年期、報酬率與跌幅當成壓力測試：若期末暴跌三成，帳面剩下多少？是否仍高於同等現金流拿去買消耗品的機會成本？建議搭配完整財富自由計算機，把股利課稅、二代健保、手續費與領息頻率納入同一條時間軸，得到更接近真實現金的每期須扣除與達標年期。投資有風險，情境試算僅供教育與自我檢視，個案仍以實際法令與契約為準。";
const currentMarketIndex = 38926;
const historicalLowReference = 20000;

export default function QuickCalculator10Page() {
  const [monthly, setMonthly] = useState(10000);
  const [monthlyText, setMonthlyText] = useState(formatTwd(10000));

  const [years, setYears] = useState(10);
  const [yearsText, setYearsText] = useState("10");

  const [annualPct, setAnnualPct] = useState(7);
  const [annualPctText, setAnnualPctText] = useState("7");

  /** 大盤重挫幅度，例如 -30 代表期末資產 ×0.7 */
  const [crashPct, setCrashPct] = useState(-30);
  const [crashPctText, setCrashPctText] = useState("-30");
  const [showScenarioHelp, setShowScenarioHelp] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<"principal" | "normal" | "crash" | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [chartTip, setChartTip] = useState<{ x: number; y: number; title: string; value: number; color: string; marketPoints: number } | null>(null);
  const prevToastConditionRef = useRef(false);

  const evalInput = (raw: string, current: number, min: number, max: number, integer = false) => {
    const hasOps = /[+\-*/()]/.test(raw);
    const plain = raw.replace(/,/g, "").trim();
    const parsed: number | null = hasOps ? evalCalcInputToNumber(raw) : plain === "" ? null : Number(plain);
    if (parsed === null || !Number.isFinite(parsed)) return current;
    const clamped = clampNum(parsed, min, max);
    return integer ? Math.round(clamped) : clamped;
  };

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

  useEffect(() => {
    const isPositiveShock = result.afterCrash > principalTotal;
    if (isPositiveShock && !prevToastConditionRef.current) {
      setShowToast(true);
      const t = window.setTimeout(() => setShowToast(false), 2200);
      prevToastConditionRef.current = true;
      return () => window.clearTimeout(t);
    }
    if (!isPositiveShock) {
      prevToastConditionRef.current = false;
      setShowToast(false);
    }
    return undefined;
  }, [result.afterCrash, principalTotal]);

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
      `}</style>

      <div style={{ width: "100%", maxWidth: 420, margin: "0 auto", minWidth: 0, overflowX: "hidden", boxSizing: "border-box" }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontSize: 22, fontWeight: 900, opacity: 0.95, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
              財富自由計算機
            </div>
            <Link
              href="/"
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
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              返回
            </Link>
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 950,
              marginTop: 10,
              lineHeight: 1.12,
              whiteSpace: "normal",
            }}
          >
            資產抗壓模擬器
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 15, opacity: 0.9, fontWeight: 800, lineHeight: 1.4, flex: 1 }}>
            模擬如果 10 年後遇到股市大崩盤，你還剩多少錢？
          </div>
          <button
            type="button"
            onClick={() => setShowScenarioHelp((v) => !v)}
            aria-label="展開或收合說明"
            style={{
              width: 22,
              height: 22,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.26)",
              background: "rgba(255,255,255,0.08)",
              color: "#e8eefc",
              fontSize: 14,
              fontWeight: 900,
              cursor: "pointer",
              flexShrink: 0,
              lineHeight: "20px",
              padding: 0,
            }}
          >
            ?
          </button>
        </div>
        {showScenarioHelp && (
          <div style={{ fontSize: 13, opacity: 0.82, marginBottom: 8, lineHeight: 1.5 }}>
            輸入每月投入、年數、報酬與大跌幅，系統會同步比較本金、順風與崩盤後結果。
          </div>
        )}

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

            <div style={{ padding: 10, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
              <div style={{ fontSize: 18, opacity: 0.95, fontWeight: 900 }}>淨值走勢</div>
              <div style={{ fontSize: 13, opacity: 0.82, marginTop: 2 }}>滑過終點圓點可看該點數值</div>
              <div style={{ marginTop: 6 }}>
                {(() => {
                  const w = 360;
                  const h = 162;
                  const padL = 12;
                  const padR = 28;
                  const padT = 14;
                  const padB = 20;
                  const innerW = w - padL - padR;
                  const innerH = h - padT - padB;
                  const pts = result.normalSeries;
                  const crashPts = result.crashSeries;
                  if (pts.length === 0) return null;

                  const padFrac = 0.06;
                  const spanRaw = result.maxV - result.minV;
                  const yLo = result.minV - spanRaw * padFrac;
                  const yHi = result.maxV + spanRaw * padFrac;
                  const span = Math.max(1e-9, yHi - yLo);

                  const xAt = (i: number) => padL + innerW * (i / Math.max(1, pts.length - 1));
                  const yAt = (v: number) => padT + innerH * (1 - (v - yLo) / span);
                  const toPoly = (arr: number[]) =>
                    arr.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(" ");

                  const windColor = "rgba(134, 239, 172, 0.92)";
                  const stormColor = "rgba(251, 146, 60, 0.92)";
                  const grid = [0.25, 0.5, 0.75];
                  const crashPointX = xAt(crashPts.length - 1);
                  const crashPointY = yAt(crashPts[crashPts.length - 1]);
                  const crashLabelText = `跌至 ${crashMarketPoints.toLocaleString("en-US")} 點`;
                  const labelWidth = Math.max(98, crashLabelText.length * 7.2);
                  const forceNudgeRight = 120;
                  const canPlaceRight = crashPointX + 10 + labelWidth <= w - padR - 2;
                  const labelDx = canPlaceRight ? 48 : -48 - labelWidth;
                  const preferTopY = crashPointY + 30;
                  const labelDy = preferTopY > h - padB - 6 ? -15 : 30;
                  const rawLabelX = crashPointX + labelDx + forceNudgeRight;
                  const crashLabelX = Math.max(padL + 4, Math.min(rawLabelX, w - padR - labelWidth - 4));
                  const crashLabelY = crashPointY + labelDy;
                  const lineEndX = crashLabelX >= crashPointX ? crashLabelX - 3 : crashLabelX + labelWidth + 3;
                  const lineEndY = labelDy > 0 ? crashLabelY - 8 : crashLabelY + 2;

                  return (
                    <div style={{ width: "95%", margin: "0 auto", borderRadius: 12 }}>
                      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label="順風與期末大跌資產" style={{ display: "block" }}>
                        <defs>
                          <filter id="q10GlowN" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                          <filter id="q10GlowC" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>
                        <rect x="0" y="0" width={w} height={h} rx="12" fill="rgba(0,0,0,0.16)" />
                        {grid.map((t) => (
                          <line
                            key={t}
                            x1={padL}
                            x2={w - padR}
                            y1={padT + innerH * t}
                            y2={padT + innerH * t}
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth="1"
                          />
                        ))}
                        <line
                          x1={padL}
                          x2={w - padR}
                          y1={yAt(principalTotal)}
                          y2={yAt(principalTotal)}
                          stroke="rgba(229,231,235,0.72)"
                          strokeWidth="1.2"
                          strokeDasharray="5 4"
                        />
                        <polyline
                          points={toPoly(pts)}
                          fill="none"
                          stroke={windColor}
                          strokeWidth="3.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter="url(#q10GlowN)"
                        />
                        {pts.length >= 2 && (
                          <line
                            x1={xAt(pts.length - 2)}
                            y1={yAt(pts[pts.length - 2])}
                            x2={xAt(crashPts.length - 1)}
                            y2={yAt(crashPts[crashPts.length - 1])}
                            stroke={stormColor}
                            strokeWidth="3.2"
                            strokeDasharray="6 5"
                            strokeLinecap="round"
                            filter="url(#q10GlowC)"
                          />
                        )}
                        <circle
                          cx={xAt(pts.length - 1)}
                          cy={yAt(pts[pts.length - 1])}
                          r="6"
                          fill="transparent"
                          onMouseEnter={() =>
                            setChartTip({
                              x: xAt(pts.length - 1),
                              y: yAt(pts[pts.length - 1]),
                              title: "原本的終點",
                              value: pts[pts.length - 1],
                              color: windColor,
                              marketPoints: currentMarketIndex,
                            })
                          }
                          onMouseLeave={() => setChartTip(null)}
                        />
                        <circle cx={xAt(pts.length - 1)} cy={yAt(pts[pts.length - 1])} r="4" fill={windColor} stroke="rgba(255,255,255,0.6)" strokeWidth="0.6" />
                        <circle
                          cx={xAt(crashPts.length - 1)}
                          cy={yAt(crashPts[crashPts.length - 1])}
                          r="6"
                          fill="transparent"
                          onMouseEnter={() =>
                            setChartTip({
                              x: xAt(crashPts.length - 1),
                              y: yAt(crashPts[crashPts.length - 1]),
                              title: "崩盤後的現實",
                              value: crashPts[crashPts.length - 1],
                              color: stormColor,
                              marketPoints: crashMarketPoints,
                            })
                          }
                          onMouseLeave={() => setChartTip(null)}
                        />
                        <circle cx={xAt(crashPts.length - 1)} cy={yAt(crashPts[crashPts.length - 1])} r="4" fill={stormColor} stroke="rgba(255,255,255,0.6)" strokeWidth="0.6" />
                        <g style={{ pointerEvents: "none", transition: "all 180ms ease", opacity: 0.98 }}>
                          <line
                            x1={crashPointX}
                            y1={crashPointY}
                            x2={lineEndX}
                            y2={lineEndY}
                            stroke="rgba(255,255,255,0.42)"
                            strokeWidth="0.8"
                          />
                          <text
                            x={crashLabelX}
                            y={crashLabelY}
                            fontSize="14"
                            fontWeight="950"
                            fill="rgba(251,146,60,0.98)"
                            style={{ filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.8))" }}
                          >
                            {crashLabelText}
                          </text>
                        </g>
                        <text
                          x={padL + 6}
                          y={Math.max(padT + 12, yAt(principalTotal) - 6)}
                          fontSize="16"
                          fontWeight="950"
                          fill="rgba(229,231,235,0.9)"
                        >
                          本金線 {formatTwd(principalTotal)}
                        </text>
                        {chartTip && (
                          <g>
                            <rect
                              x={Math.max(padL + 4, chartTip.x - 84)}
                              y={Math.max(6, chartTip.y - 42)}
                              width="168"
                              height="46"
                              rx="8"
                              fill="rgba(2,6,23,0.9)"
                              stroke="rgba(255,255,255,0.22)"
                            />
                            <text x={Math.max(padL + 12, chartTip.x - 76)} y={Math.max(20, chartTip.y - 28)} fontSize="10" fontWeight="900" fill={chartTip.color}>
                              {chartTip.title}
                            </text>
                            <text x={Math.max(padL + 12, chartTip.x - 76)} y={Math.max(33, chartTip.y - 15)} fontSize="10" fontWeight="800" fill="rgba(226,232,240,0.95)">
                              {formatTwd(chartTip.value)} 元
                            </text>
                            <text x={Math.max(padL + 12, chartTip.x - 76)} y={Math.max(45, chartTip.y - 3)} fontSize="10" fontWeight="800" fill="rgba(147,197,253,0.98)">
                              大盤：{chartTip.marketPoints.toLocaleString("en-US")} 點
                            </text>
                          </g>
                        )}
                      </svg>
                      <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 14, opacity: 0.95, fontWeight: 800, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 12, borderTop: "2px dashed rgba(229,231,235,0.9)", display: "inline-block" }} />
                          本金線（投入總額：{formatTwd(principalTotal)} 元）
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 99, background: windColor, display: "inline-block" }} />
                          順風複利（一路假設年化 {annualPct}%）
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 99, background: stormColor, display: "inline-block" }} />
                          同一條路徑，期末瞬間 {crashPct}%
                        </div>
                      </div>
                    </div>
                  );
                })()}
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
                fontSize: 20,
                fontWeight: 900,
                lineHeight: 1.4,
                letterSpacing: "0.12em",
              }}
            >
              <span style={{ lineHeight: 1.4, letterSpacing: "0.12em" }}>🔍 進入財富自由計算機</span>
              <span style={{ fontSize: 18, fontWeight: 800, opacity: 0.95, lineHeight: 1.4, letterSpacing: "0.12em" }}>壓力測試與精確設定</span>
            </Link>

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

            <div
              aria-hidden
              style={{
                position: "fixed",
                left: 0,
                top: 0,
                width: 1,
                height: 1,
                overflow: "hidden",
                clipPath: "inset(50%)",
                whiteSpace: "pre-wrap",
                pointerEvents: "none",
                userSelect: "none",
                opacity: 0,
              }}
            >
              {SEO_ARTICLE}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  flexShrink: 1,
  height: 44,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.20)",
  color: "#e8eefc",
  padding: "0 8px",
  outline: "none",
  fontSize: 18,
  fontWeight: 950,
  fontVariantNumeric: "tabular-nums",
  boxSizing: "border-box",
};

const miniBtn: CSSProperties = {
  minWidth: 34,
  width: 34,
  height: 44,
  flexShrink: 0,
  padding: 0,
  boxSizing: "border-box",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
  color: "#e8eefc",
  fontSize: 18,
  fontWeight: 900,
  cursor: "pointer",
};

