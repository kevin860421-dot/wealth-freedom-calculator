"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { QuickBlogLinksToggle } from "@/app/components/quick-blog-links-toggle";
import { computeLoanCostScenario } from "./logic";
import styles from "./quick-12.module.css";

function fmt(n: number) {
  return Math.round(Number.isFinite(n) ? n : 0).toLocaleString("zh-TW");
}

function parseNum(raw: string, fallback: number): number {
  const v = Number(String(raw).replace(/,/g, "").trim());
  return Number.isFinite(v) ? v : fallback;
}

export function QuickCalculator12View() {
  const [principalText, setPrincipalText] = useState("500,000");
  const [periodsText, setPeriodsText] = useState("84");
  const [loanRateText, setLoanRateText] = useState("6");
  const [investRateText, setInvestRateText] = useState("7");
  const [taxRateText, setTaxRateText] = useState("5");
  const [useCredit, setUseCredit] = useState(true);

  const principal = Math.max(0, parseNum(principalText, 500_000));
  const periods = Math.min(360, Math.max(1, Math.round(parseNum(periodsText, 84))));
  const loanAnnual = Math.min(36, Math.max(0, parseNum(loanRateText, 6)));
  const investAnnual = Math.min(30, Math.max(0, parseNum(investRateText, 7)));
  const marginalTax = Math.min(40, Math.max(0, parseNum(taxRateText, 5))) / 100;

  const out = useMemo(
    () =>
      computeLoanCostScenario({
        principal,
        periods,
        loanAnnualPct: loanAnnual,
        investAnnualPct: investAnnual,
        marginalTaxRate: marginalTax,
        useDividendCredit: useCredit,
      }),
    [principal, periods, loanAnnual, investAnnual, marginalTax, useCredit],
  );

  return (
    <main
      className={styles.root}
      style={{
        minHeight: "100vh",
        background: "#0b1220",
        padding: "14px 14px 32px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: 14 }}>
        <header>
          <div style={{ fontSize: "inherit", fontWeight: 950, letterSpacing: "0.06em", color: "rgba(147,197,253,0.95)" }}>
            第 12 台
          </div>
          <h1 style={{ margin: "6px 0 0", fontSize: "1.25em", fontWeight: 950, lineHeight: 1.25, color: "#f8fafc" }}>
            小額貸款代價計算機
          </h1>
          <p style={{ margin: "8px 0 0", opacity: 0.88, fontWeight: 650 }}>
            本息攤還、總利息；本金若同期改投（月複利、每月孳息依大計算機合併課稅 + 二代健保 2.11%）。參考：主計總處薪資中位數約 4.5 萬／月、年終常見約 1.5 個月；單筆執行過 2 萬之二代健保門檻。
          </p>
        </header>

        <section
          style={{
            borderRadius: 14,
            border: "1px solid rgba(148,163,184,0.22)",
            background: "rgba(15,23,42,0.55)",
            padding: 14,
            display: "grid",
            gap: 12,
          }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontWeight: 850 }}>貸款金額（元）</span>
            <input
              value={principalText}
              onChange={(e) => setPrincipalText(e.target.value)}
              inputMode="decimal"
              style={inp}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontWeight: 850 }}>分期期數（月）</span>
            <input value={periodsText} onChange={(e) => setPeriodsText(e.target.value)} inputMode="numeric" style={inp} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontWeight: 850 }}>貸款年利率（%）</span>
              <input value={loanRateText} onChange={(e) => setLoanRateText(e.target.value)} inputMode="decimal" style={inp} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontWeight: 850 }}>預期投資年化（%）</span>
              <input value={investRateText} onChange={(e) => setInvestRateText(e.target.value)} inputMode="decimal" style={inp} />
            </label>
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontWeight: 850 }}>合併課稅邊際稅率（%）</span>
            <input value={taxRateText} onChange={(e) => setTaxRateText(e.target.value)} inputMode="decimal" style={inp} />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800, cursor: "pointer" }}>
            <input type="checkbox" checked={useCredit} onChange={(e) => setUseCredit(e.target.checked)} />
            股利 8.5% 抵減（與大計算機合併課稅預設一致）
          </label>
        </section>

        <section
          style={{
            borderRadius: 14,
            border: "1px solid rgba(148,163,184,0.22)",
            background: "rgba(0,0,0,0.22)",
            padding: 14,
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 10, color: "rgba(252,211,77,0.95)" }}>試算結果</div>
          <table className={styles.table}>
            <tbody>
              <tr>
                <th scope="row">每月還款金額</th>
                <td className={styles.mono}>{fmt(out.monthlyPayment)} 元</td>
              </tr>
              <tr>
                <th scope="row">總還款</th>
                <td className={styles.mono}>{fmt(out.totalPaid)} 元</td>
              </tr>
              <tr>
                <th scope="row">總利息（顯性成本）</th>
                <td className={styles.mono}>{fmt(out.totalInterest)} 元</td>
              </tr>
              <tr>
                <th scope="row">本金同期稅後複利終值</th>
                <td className={styles.mono}>{fmt(out.fvInvestNet)} 元</td>
              </tr>
              <tr>
                <th scope="row">稅前複利終值（對照）</th>
                <td className={styles.mono}>{fmt(out.fvInvestGross)} 元</td>
              </tr>
              <tr>
                <th scope="row">孳息課徵所得稅累計</th>
                <td className={styles.mono}>{fmt(out.sumTaxOnGains)} 元</td>
              </tr>
              <tr>
                <th scope="row">二代健保補充保費累計</th>
                <td className={styles.mono}>{fmt(out.sumNhi2OnGains)} 元</td>
              </tr>
              <tr>
                <th scope="row">稅後機會利得（終值 − 本金）</th>
                <td className={styles.mono}>{fmt(out.opportunityNetGain)} 元</td>
              </tr>
              <tr>
                <th scope="row">示意「少賺」合計（利息 + 稅後機會利得）</th>
                <td className={`${styles.mono}`} style={{ color: "rgba(248,113,113,0.95)", fontWeight: 900 }}>
                  {fmt(out.headlineTotalCost)} 元
                </td>
              </tr>
            </tbody>
          </table>
          <p style={{ marginTop: 12, opacity: 0.82, fontWeight: 700 }}>
            稅後影響備註：單月孳息未達 2 萬時不扣所得稅；達門檻時依合併課稅與 2.11% 補充保費計入。本頁假設「若未借貸、同額本金可全數投入」之機會成本，實際現金流與申貸用途因人而異。
          </p>
        </section>

        <QuickBlogLinksToggle quickRoute="/quick-12" />

        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            textDecoration: "none",
            padding: "18px 16px",
            borderRadius: 14,
            background: "#2563eb",
            color: "#fff",
            fontWeight: 900,
            fontSize: "inherit",
          }}
        >
          進入財富自由計算機
        </Link>

        <p style={{ margin: 0, opacity: 0.65, fontSize: "0.92em", fontWeight: 650 }}>
          * 試算僅供教育討論，非放款或投資建議；稅負與費率以法令與個案為準。
        </p>
      </div>
    </main>
  );
}

const inp: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 10,
  border: "1px solid rgba(148,163,184,0.35)",
  background: "rgba(15,23,42,0.65)",
  color: "#e8eefc",
  padding: "10px 12px",
  fontSize: "inherit",
  fontWeight: 750,
  outline: "none",
};
