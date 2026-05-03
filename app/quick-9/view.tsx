"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { QuickBlogLinksToggle } from "@/app/components/quick-blog-links-toggle";
import { QuickDualLineChart } from "@/app/components/quick-dual-line-chart";
import { QuickSeoArticle } from "@/app/components/quick-seo-article";
import { clampNum, simulateVariableContribution } from "@/lib/quick-calculator-math";
import {
  evalCalcInputToNumber,
  formatTwd,
  formatWan1,
  miniBtn,
  parseMoneyInputToInt,
  sanitizeCalcInput,
  type SeriesPoint,
} from "./logic";

export function QuickCalculator9View() {
  const chartSpanOptions = [3, 5, 10] as const;
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [totalBudget, setTotalBudget] = useState<number>(20000);
  const [totalBudgetText, setTotalBudgetText] = useState<string>(formatTwd(20000));

  const [monthlyInstallment, setMonthlyInstallment] = useState<number>(12000);
  const [monthlyInstallmentText, setMonthlyInstallmentText] = useState<string>(formatTwd(12000));

  const [investmentBase, setInvestmentBase] = useState<number>(8000);
  const [investmentBaseText, setInvestmentBaseText] = useState<string>(formatTwd(8000));

  const [installmentYears, setInstallmentYears] = useState<number>(2);
  const [delayYears, setDelayYears] = useState<number>(2);

  const [annualPct, setAnnualPct] = useState<number>(7);
  const [chartSpanYears, setChartSpanYears] = useState<(typeof chartSpanOptions)[number]>(10);
  const installmentInvestRatio = investmentBase > 0 ? monthlyInstallment / investmentBase : 1;
  const extraRedRightShift =
    installmentInvestRatio <= 0.2 ? 40 : installmentInvestRatio <= 0.35 ? 24 : installmentInvestRatio <= 0.5 ? 14 : 4;
  const extraRedDrop =
    installmentInvestRatio <= 0.2 ? 24 : installmentInvestRatio <= 0.35 ? 16 : installmentInvestRatio <= 0.5 ? 10 : 3;
  const isInstallmentNearInvest = monthlyInstallment > 0 && monthlyInstallment >= investmentBase * 0.85;
  const shouldForceRedLabelBelow = !isInstallmentNearInvest;

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
      y3: { a: at(3, "a"), b: at(3, "b") },
      y5: { a: at(5, "a"), b: at(5, "b") },
      y10: { a: at(10, "a"), b: at(10, "b") },
    };
  }, [annualPct, scenarioAContributionAt, scenarioBContributionAt]);

  const series = useMemo(() => {
    const yearsList = Array.from({ length: chartSpanYears }, (_, i) => i + 1);
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
    return { points };
  }, [annualPct, scenarioAContributionAt, scenarioBContributionAt, chartSpanYears]);

  const deltaBySpan = useMemo(() => {
    const picked = chartSpanYears === 3 ? keyAssets.y3 : chartSpanYears === 5 ? keyAssets.y5 : keyAssets.y10;
    return Math.max(0, picked.b - picked.a);
  }, [chartSpanYears, keyAssets]);

  useEffect(() => {
    queueMicrotask(() => {
      const sp = new URLSearchParams(window.location.search);
      const tbRaw = sp.get("tb");
      const instRaw = sp.get("inst");
      const iyRaw = sp.get("iy");
      const dyRaw = sp.get("dy");
      const apRaw = sp.get("ap");

      let tb = totalBudget;
      if (tbRaw != null) {
        const v = Number(tbRaw.replace(/,/g, ""));
        if (Number.isFinite(v)) {
          tb = Math.round(clampNum(v, 0, 500000) / 100) * 100;
          setTotalBudget(tb);
          setTotalBudgetText(formatTwd(tb));
        }
      }
      if (instRaw != null) {
        const v = Number(instRaw.replace(/,/g, ""));
        if (Number.isFinite(v)) {
          const inst = Math.round(clampNum(v, 0, tb) / 100) * 100;
          applySplitFromInstallment(inst, tb);
        }
      }
      if (iyRaw != null) {
        const v = Number(iyRaw);
        if (Number.isFinite(v)) setInstallmentYears(Math.round(clampNum(v, 1, 10)));
      }
      if (dyRaw != null) {
        const v = Number(dyRaw);
        if (Number.isFinite(v)) setDelayYears(Math.round(clampNum(v, 1, 10)));
      }
      if (apRaw != null) {
        const v = Number(apRaw);
        if (Number.isFinite(v)) setAnnualPct(Math.round(clampNum(v, 0, 30)));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 僅首次掛載時由網址還原一次
  }, []);

  const onShare = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tb", String(totalBudget));
      url.searchParams.set("inst", String(monthlyInstallment));
      url.searchParams.set("iy", String(installmentYears));
      url.searchParams.set("dy", String(delayYears));
      url.searchParams.set("ap", String(annualPct));
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
      `}</style>

      <div style={{ width: "100%", maxWidth: 400, margin: "0 auto", boxSizing: "border-box", minWidth: 0, overflowX: "hidden" }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div className="quick-brand-gold-shimmer" style={{ fontSize: 20, fontWeight: 900, opacity: 0.95, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", ["--quick-brand-duration" as string]: "3.9s" }}>
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
                fontSize: 14,
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

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div style={{ fontSize: 13, opacity: 0.9, fontWeight: 900 }}>幅度切換</div>
              <div style={{ display: "flex", gap: 6 }}>
                {chartSpanOptions.map((yy) => {
                  const active = chartSpanYears === yy;
                  return (
                    <button
                      key={yy}
                      type="button"
                      onClick={() => setChartSpanYears(yy)}
                      style={{
                        height: 30,
                        minWidth: 44,
                        padding: "0 10px",
                        borderRadius: 999,
                        border: active ? "1px solid rgba(96,165,250,0.75)" : "1px solid rgba(255,255,255,0.14)",
                        background: active ? "rgba(37,99,235,0.28)" : "rgba(255,255,255,0.06)",
                        color: active ? "#dbeafe" : "#e8eefc",
                        fontSize: 13,
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                    >
                      {yy}年
                    </button>
                  );
                })}
              </div>
            </div>

            <QuickDualLineChart
              years={series.points.map((p) => p.y)}
              seriesA={series.points.map((p) => p.a)}
              seriesB={series.points.map((p) => p.b)}
              legendA="現在就買（立即分期）"
              legendB="延遲購買（先投資再分期）"
              topNotesSlotLines={4}
              yGamma={0.72}
              dashSeriesB
              showPointValues
              showPointValuesScope="last"
              pointLabelMode="legacy"
              formatPointValue={formatTwd}
              redLabelBelowYearThreshold={shouldForceRedLabelBelow ? 999 : 20}
              redLabelExtraDrop={14 + extraRedDrop}
              redLabelXOffset={8 + extraRedRightShift}
              topNotes={
                <>
                  <text x="0" y="16" fontSize="13" fill="rgba(252, 211, 77, 0.98)" fontWeight="900">
                    1年資產：{formatWan1(keyAssets.y1.a)}萬 / {formatWan1(keyAssets.y1.b)}萬
                  </text>
                  <text x="0" y="34" fontSize="13" fill="rgba(134, 239, 172, 0.98)" fontWeight="900">
                    3年資產：{formatWan1(keyAssets.y3.a)}萬 / {formatWan1(keyAssets.y3.b)}萬
                  </text>
                  <text x="0" y="52" fontSize="13" fill="rgba(167, 139, 250, 0.98)" fontWeight="900">
                    5年資產：{formatWan1(keyAssets.y5.a)}萬 / {formatWan1(keyAssets.y5.b)}萬
                  </text>
                  <text x="0" y="70" fontSize="13" fill="rgba(147, 197, 253, 0.98)" fontWeight="900">
                    10年資產：{formatWan1(keyAssets.y10.a)}萬 / {formatWan1(keyAssets.y10.b)}萬
                  </text>
                </>
              }
            />

            <div style={{ padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}>
              <div style={{ fontSize: "clamp(12px, 3.8vw, 18px)", opacity: 0.98, fontWeight: 950, lineHeight: 1.15, whiteSpace: "normal", wordBreak: "break-all" }}>
                這筆分期延後 <span style={{ color: "rgba(252, 211, 77, 0.96)" }}>{delayYears}</span> 年再買，未來 {chartSpanYears} 年後將多賺{" "}
                <span style={{ color: "rgba(106, 165, 184, 0.98)" }}>{formatWan1(deltaBySpan)} 萬</span>
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
            <QuickBlogLinksToggle quickRoute="/quick-9" />
            <QuickSeoArticle id={9} />
          </div>
        </section>
      </div>
    </main>
  );
}
