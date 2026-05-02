"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

function clampNum(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatTwd(n: number) {
  const v = Math.round(Number.isFinite(n) ? n : 0);
  return v.toLocaleString("en-US");
}

function formatWan1(n: number) {
  const v = Math.round(Number.isFinite(n) ? n : 0);
  const wan = v / 10000;
  const s = wan.toFixed(1).replace(/\.0$/, "");
  return s;
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

function simulateVariableContribution({
  annualReturnPct,
  months,
  initial,
  monthlyContributionAt,
}: {
  annualReturnPct: number;
  months: number;
  initial: number;
  monthlyContributionAt: (m: number) => number;
}) {
  const r = clampNum(annualReturnPct, 0, 99) / 100 / 12;
  let bal = Math.max(0, Number.isFinite(initial) ? initial : 0);
  const mMax = Math.max(0, Math.trunc(months));
  for (let m = 1; m <= mMax; m++) {
    const c = Math.max(0, Number.isFinite(monthlyContributionAt(m)) ? monthlyContributionAt(m) : 0);
    bal = bal * (1 + r) + c;
  }
  return bal;
}

type SeriesPoint = { y: number; a: number; b: number };

export default function QuickCalculator9Page() {
  const [totalBudget, setTotalBudget] = useState<number>(20000);
  const [totalBudgetText, setTotalBudgetText] = useState<string>(formatTwd(20000));

  const [monthlyInstallment, setMonthlyInstallment] = useState<number>(12000);
  const [monthlyInstallmentText, setMonthlyInstallmentText] = useState<string>(formatTwd(12000));

  const [investmentBase, setInvestmentBase] = useState<number>(8000);
  const [investmentBaseText, setInvestmentBaseText] = useState<string>(formatTwd(8000));

  const [installmentYears, setInstallmentYears] = useState<number>(2);
  const [delayYears, setDelayYears] = useState<number>(2);

  const [annualPct, setAnnualPct] = useState<number>(7);

  const commitMoney = (raw: string, current: number, min: number, max: number) => {
    const hasOps = /[+\-*/()]/.test(raw);
    const v = hasOps ? evalCalcInputToNumber(raw) : parseMoneyInputToInt(raw);
    return Math.round(clampNum(v ?? current, min, max) / 100) * 100;
  };

  const applySplitFromInstallment = (instRaw: number, total: number) => {
    const safeTotal = Math.max(0, total);
    const inst = Math.round(clampNum(instRaw, 0, safeTotal) / 100) * 100;
    const inv = Math.max(0, safeTotal - inst);
    setMonthlyInstallment(inst);
    setMonthlyInstallmentText(formatTwd(inst));
    setInvestmentBase(inv);
    setInvestmentBaseText(formatTwd(inv));
  };

  const applySplitFromInvest = (invRaw: number, total: number) => {
    const safeTotal = Math.max(0, total);
    const inv = Math.round(clampNum(invRaw, 0, safeTotal) / 100) * 100;
    const inst = Math.max(0, safeTotal - inv);
    setInvestmentBase(inv);
    setInvestmentBaseText(formatTwd(inv));
    setMonthlyInstallment(inst);
    setMonthlyInstallmentText(formatTwd(inst));
  };

  const commitTotalBudget = () => {
    const raw = totalBudgetText;
    const hasOps = /[+\-*/()]/.test(raw);
    const v = hasOps ? evalCalcInputToNumber(raw) : parseMoneyInputToInt(raw);
    const next = Math.round(clampNum(v ?? totalBudget, 0, 500000) / 100) * 100;
    setTotalBudget(next);
    setTotalBudgetText(formatTwd(next));
    applySplitFromInstallment(Math.min(monthlyInstallment, next), next);
  };

  const bumpTotalBudget = (delta: number) => {
    const v = parseMoneyInputToInt(totalBudgetText) ?? totalBudget;
    const next = Math.round(clampNum(v + delta, 0, 500000) / 100) * 100;
    setTotalBudgetText(formatTwd(next));
    setTotalBudget(next);
    applySplitFromInstallment(Math.min(monthlyInstallment, next), next);
  };

  const monthsTotal = 50 * 12;
  const instMonths = Math.round(clampNum(installmentYears, 1, 10) * 12);
  const delayMonths = Math.round(clampNum(delayYears, 1, 10) * 12);

  const scenarioAContributionAt = useMemo(() => {
    const base = Math.max(0, totalBudget);
    const inv = Math.max(0, base - Math.max(0, monthlyInstallment));
    return (m: number) => (m <= instMonths ? inv : base);
  }, [totalBudget, monthlyInstallment, instMonths]);

  const scenarioBContributionAt = useMemo(() => {
    const base = Math.max(0, totalBudget);
    const inv = Math.max(0, base - Math.max(0, monthlyInstallment));
    const startInst = delayMonths + 1;
    const endInst = delayMonths + instMonths;
    return (m: number) => (m < startInst ? base : m <= endInst ? inv : base);
  }, [totalBudget, monthlyInstallment, delayMonths, instMonths]);

  const keyYears = useMemo(() => [1, 5, 20, 50] as const, []);

  const keyAssets = useMemo(() => {
    const at = (y: number, which: "a" | "b") => {
      const m = y * 12;
      return simulateVariableContribution({
        annualReturnPct: annualPct,
        months: m,
        initial: 0,
        monthlyContributionAt: which === "a" ? scenarioAContributionAt : scenarioBContributionAt,
      });
    };
    return {
      y1: { a: at(1, "a"), b: at(1, "b") },
      y5: { a: at(5, "a"), b: at(5, "b") },
      y20: { a: at(20, "a"), b: at(20, "b") },
      y50: { a: at(50, "a"), b: at(50, "b") },
    };
  }, [annualPct, scenarioAContributionAt, scenarioBContributionAt]);

  const series = useMemo(() => {
    // follow quick-8 pattern: ~7 points + current selections
    const ys = [1, 5, 10, 20, 30, 40, 50];
    const set = new Set<number>(ys);
    set.add(installmentYears);
    set.add(delayYears);
    const yearsList = Array.from(set)
      .map((y) => Math.round(clampNum(y, 1, 50)))
      .sort((x, y) => x - y);
    const points: SeriesPoint[] = yearsList.map((y) => {
      const m = y * 12;
      const a = simulateVariableContribution({
        annualReturnPct: annualPct,
        months: m,
        initial: 0,
        monthlyContributionAt: scenarioAContributionAt,
      });
      const b = simulateVariableContribution({
        annualReturnPct: annualPct,
        months: m,
        initial: 0,
        monthlyContributionAt: scenarioBContributionAt,
      });
      return { y, a, b };
    });
    const maxV = Math.max(1, ...points.map((p) => Math.max(p.a, p.b)));
    return { points, maxV };
  }, [annualPct, scenarioAContributionAt, scenarioBContributionAt, installmentYears, delayYears]);

  const delta20 = Math.max(0, keyAssets.y20.b - keyAssets.y20.a);

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
      `}</style>

      <div style={{ width: "100%", maxWidth: 400, margin: "0 auto", boxSizing: "border-box", minWidth: 0, overflowX: "hidden" }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontSize: 20, fontWeight: 900, opacity: 0.95, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
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
                fontSize: 14,
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
              fontSize: 28,
              fontWeight: 950,
              marginTop: 10,
              lineHeight: 1.12,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            🧾 延遲消費價值計算機
          </div>
        </div>

        <div style={{ fontSize: 16, opacity: 0.9, fontWeight: 900, marginBottom: 10 }}>同一筆分期，只差「什麼時候付」會差多少？</div>

        <section
          style={{
            marginTop: 0,
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
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ padding: 8, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
              <div style={{ fontSize: 15, opacity: 0.9, fontWeight: 900 }}>總投資金額</div>
              <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 8, width: "100%", minWidth: 0 }}>
                <input
                  inputMode="numeric"
                  value={totalBudgetText}
                  onChange={(e) => {
                    const raw = sanitizeCalcInput(e.target.value);
                    setTotalBudgetText(raw);
                    const next = commitMoney(raw, totalBudget, 0, 500000);
                    setTotalBudget(next);
                    applySplitFromInstallment(Math.min(monthlyInstallment, next), next);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitTotalBudget();
                      (e.currentTarget as HTMLInputElement).blur();
                    }
                  }}
                  onBlur={commitTotalBudget}
                  style={{
                    flex: "1 1 220px",
                    height: 42,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.20)",
                    color: "#e8eefc",
                    padding: "0 12px",
                    outline: "none",
                    fontSize: 20,
                    fontWeight: 950,
                    width: "100%",
                    minWidth: 0,
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
                <button
                  type="button"
                  onClick={() => bumpTotalBudget(+1000)}
                  aria-label="增加 1000"
                  style={{
                    flex: "0 0 44px",
                    width: 44,
                    height: 42,
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
                  onClick={() => bumpTotalBudget(-1000)}
                  aria-label="減少 1000"
                  style={{
                    flex: "0 0 44px",
                    width: 44,
                    height: 42,
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
                <div style={{ fontSize: 16, opacity: 0.9, fontWeight: 900 }}>預計分期支出</div>
                <input
                  inputMode="numeric"
                  value={monthlyInstallmentText}
                  onChange={(e) => {
                    const raw = sanitizeCalcInput(e.target.value);
                    setMonthlyInstallmentText(raw);
                    const next = commitMoney(raw, monthlyInstallment, 0, totalBudget);
                    applySplitFromInstallment(next, totalBudget);
                  }}
                  onBlur={() => setMonthlyInstallmentText(formatTwd(monthlyInstallment))}
                  style={{
                    height: 42,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.20)",
                    color: "#e8eefc",
                    padding: "0 12px",
                    outline: "none",
                    fontSize: 20,
                    fontWeight: 950,
                    width: "100%",
                    minWidth: 0,
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: 6, minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 16, opacity: 0.9, fontWeight: 900 }}>可投資金額</div>
                <input
                  inputMode="numeric"
                  value={investmentBaseText}
                  onChange={(e) => {
                    const raw = sanitizeCalcInput(e.target.value);
                    setInvestmentBaseText(raw);
                    const next = commitMoney(raw, investmentBase, 0, totalBudget);
                    applySplitFromInvest(next, totalBudget);
                  }}
                  onBlur={() => setInvestmentBaseText(formatTwd(investmentBase))}
                  style={{
                    height: 42,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.20)",
                    color: "#e8eefc",
                    padding: "0 12px",
                    outline: "none",
                    fontSize: 20,
                    fontWeight: 950,
                    width: "100%",
                    minWidth: 0,
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
              </label>
            </div>

            {/* 分期 vs 可投資：單一雙向分配拉條（同 quick-8） */}
            <input
              type="range"
              min={0}
              max={Math.max(0, totalBudget)}
              step={100}
              value={investmentBase}
              onChange={(e) => {
                const inv = Math.round(clampNum(Number(e.target.value), 0, totalBudget) / 100) * 100;
                applySplitFromInvest(inv, totalBudget);
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
                marginBottom: 2,
                height: 28,
                accentColor: "#3B82F6",
              }}
            />

            <div style={{ display: "flex", gap: 12, width: "100%", minWidth: 0 }}>
              <label style={{ display: "grid", gap: 6, minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 15, opacity: 0.9, fontWeight: 900 }}>分期期限（年）</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setInstallmentYears((v) => Math.round(clampNum(v - 1, 1, 10)))}
                    style={miniBtn}
                    aria-label="分期期限減 1 年"
                  >
                    –
                  </button>
                  <div style={{ flex: 1, textAlign: "center", fontSize: 16, fontWeight: 950, fontVariantNumeric: "tabular-nums" }}>
                    {installmentYears} 年
                  </div>
                  <button
                    type="button"
                    onClick={() => setInstallmentYears((v) => Math.round(clampNum(v + 1, 1, 10)))}
                    style={miniBtn}
                    aria-label="分期期限加 1 年"
                  >
                    +
                  </button>
                </div>
              </label>

              <label style={{ display: "grid", gap: 6, minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 15, opacity: 0.9, fontWeight: 900 }}>延遲年數（年）</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setDelayYears((v) => Math.round(clampNum(v - 1, 1, 10)))}
                    style={miniBtn}
                    aria-label="延遲年數減 1 年"
                  >
                    –
                  </button>
                  <div style={{ flex: 1, textAlign: "center", fontSize: 16, fontWeight: 950, fontVariantNumeric: "tabular-nums" }}>
                    {delayYears} 年
                  </div>
                  <button
                    type="button"
                    onClick={() => setDelayYears((v) => Math.round(clampNum(v + 1, 1, 10)))}
                    style={miniBtn}
                    aria-label="延遲年數加 1 年"
                  >
                    +
                  </button>
                </div>
              </label>
            </div>

            <div style={{ padding: 8, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
              <div style={{ fontSize: 15, opacity: 0.9, fontWeight: 900 }}>年化利率（%）</div>
              <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                <button type="button" onClick={() => setAnnualPct((v) => Math.round(clampNum(v - 1, 0, 30)))} style={miniBtn} aria-label="年化利率減 1%">
                  –
                </button>
                <div style={{ flex: 1, textAlign: "center", fontSize: 16, fontWeight: 950, fontVariantNumeric: "tabular-nums" }}>{annualPct}%</div>
                <button type="button" onClick={() => setAnnualPct((v) => Math.round(clampNum(v + 1, 0, 30)))} style={miniBtn} aria-label="年化利率加 1%">
                  +
                </button>
              </div>
            </div>

            <div style={{ padding: 10, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
              <div style={{ fontSize: 16, opacity: 0.9, fontWeight: 900 }}>淨值折線圖</div>
              <div style={{ marginTop: 6 }}>
                {(() => {
                  const w = 360;
                  const h = 208;
                  const padL = 12;
                  const padR = 30;
                  const padT = 70;
                  const padB = 26;
                  const innerW = w - padL - padR;
                  const innerH = h - padT - padB;
                  const pts = series.points;
                  const enjoyColor = "rgba(196, 122, 122, 0.92)";
                  const delayColor = "rgba(106, 165, 184, 0.92)";

                  const xAt = (i: number) => padL + innerW * (i / Math.max(1, pts.length - 1));
                  // 壓縮比例尺（power/gamma）：抬高前期、但保留後期差距可見度（數字仍用原值顯示）
                  const gamma = 0.72;
                  const yScale = (v: number) => {
                    const x = Math.max(0, v) / Math.max(1e-9, series.maxV);
                    return Math.pow(x, gamma);
                  };
                  const yAt = (v: number) => padT + innerH * (1 - yScale(v));
                  const toPoints = (key: "a" | "b") =>
                    pts
                      .map((p, i) => {
                        const v = key === "a" ? p.a : p.b;
                        return `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`;
                      })
                      .join(" ");
                  const grid = [0.25, 0.5, 0.75];

                  const label1 = "rgba(252, 211, 77, 0.98)";
                  const label5 = "rgba(134, 239, 172, 0.98)";
                  const label20 = "rgba(167, 139, 250, 0.98)";
                  const label50 = "rgba(147, 197, 253, 0.98)";

                  return (
                    <div style={{ width: "95%", margin: "0 auto", borderRadius: 12 }}>
                      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label="淨值折線圖" style={{ display: "block" }}>
                        <defs>
                          <filter id="q9GlowA" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="2.2" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                          <filter id="q9GlowB" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="2.2" result="blur" />
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
                        {/* A：實線（紅），B：虛線（青）＋不同端點，避免重疊看不出差異 */}
                        <polyline
                          points={toPoints("a")}
                          fill="none"
                          stroke={enjoyColor}
                          strokeWidth="3.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter="url(#q9GlowA)"
                        />
                        <polyline
                          points={toPoints("b")}
                          fill="none"
                          stroke={delayColor}
                          strokeWidth="3.2"
                          strokeDasharray="7 6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter="url(#q9GlowB)"
                        />

                        <g transform={`translate(${padL}, 8)`}>
                          <text x="0" y="16" fontSize="13" fill={label1} fontWeight="900">
                            1年資產：A {formatWan1(keyAssets.y1.a)}萬 / B {formatWan1(keyAssets.y1.b)}萬
                          </text>
                          <text x="0" y="34" fontSize="13" fill={label5} fontWeight="900">
                            5年資產：A {formatWan1(keyAssets.y5.a)}萬 / B {formatWan1(keyAssets.y5.b)}萬
                          </text>
                          <text x="0" y="52" fontSize="13" fill={label20} fontWeight="900">
                            20年資產：A {formatWan1(keyAssets.y20.a)}萬 / B {formatWan1(keyAssets.y20.b)}萬
                          </text>
                          <text x="0" y="70" fontSize="13" fill={label50} fontWeight="900">
                            50年資產：A {formatWan1(keyAssets.y50.a)}萬 / B {formatWan1(keyAssets.y50.b)}萬
                          </text>
                        </g>

                        {pts.map((p, i) => {
                          const x = xAt(i);
                          const y1 = yAt(p.a);
                          const y2 = yAt(p.b);
                          const labelY = h - 8;
                          return (
                            <g key={p.y}>
                              <circle cx={x} cy={y1} r="3.8" fill={enjoyColor} stroke="rgba(255,255,255,0.65)" strokeWidth="0.7" />
                              <circle cx={x} cy={y2} r="3.8" fill={delayColor} stroke="rgba(255,255,255,0.65)" strokeWidth="0.7" />
                              <text x={x} y={labelY} fontSize="10" textAnchor="middle" fill="rgba(232,238,252,0.70)" fontWeight="800">
                                {p.y}年
                              </text>
                            </g>
                          );
                        })}
                      </svg>

                      <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 13, opacity: 0.92, fontWeight: 800 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 99, background: enjoyColor, display: "inline-block" }} />
                          現在就買（立即分期）
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 99, background: delayColor, display: "inline-block" }} />
                          延遲購買（先投資再分期）
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div style={{ padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
              <div style={{ fontSize: "clamp(12px, 3.8vw, 18px)", opacity: 0.98, fontWeight: 950, lineHeight: 1.15, whiteSpace: "normal", wordBreak: "break-all" }}>
                這筆分期延後 <span style={{ color: "rgba(252, 211, 77, 0.96)" }}>{delayYears}</span> 年再買，未來 20 年後將多賺{" "}
                <span style={{ color: "rgba(106, 165, 184, 0.98)" }}>{formatWan1(delta20)} 萬</span>
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
              <span style={{ fontSize: 16, fontWeight: 800, opacity: 0.95, lineHeight: 1.4, letterSpacing: "0.12em" }}>壓力測試與精確設定</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

const miniBtn: React.CSSProperties = {
  flex: "0 0 44px",
  width: 44,
  height: 40,
  boxSizing: "border-box",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
  color: "#e8eefc",
  fontSize: 20,
  fontWeight: 900,
  cursor: "pointer",
};

