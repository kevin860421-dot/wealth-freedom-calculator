"use client";

import type { CSSProperties } from "react";
import styles from "./tax-settings-panel.module.css";

type TooltipWhich = "merge" | "separate" | "nhi2" | null;

type TaxBracketOption = { value: number; label: string };

type DeductionEstimateForPanel = {
  bracketLabel: string;
  taxMethod: "separate" | "merge";
  taxRatePct: number;
  estimatedDividend: number;
  taxAmount: number;
  nhi2Amount: number;
  nhi2Countable?: number;
  ratioPct: number;
  taxBeforeCredit?: number;
  credit?: number;
  netPerPeriod: number;
};

export type ManualTaxBlockProps = {
  applyTaxInTable: boolean;
  setApplyTaxInTable: (v: boolean) => void;
  taxBracketRate: number;
  setTaxBracketRate: (v: number) => void;
  annualIncome: string;
  setAnnualIncome: (v: string) => void;
  annualIncomeYuan: number | null;
  mergeTaxOpen: boolean;
  setMergeTaxOpen: (v: boolean) => void;
  separateTaxOpen: boolean;
  setSeparateTaxOpen: (v: boolean) => void;
  taxBracketOptions: readonly TaxBracketOption[];
  inputStyle: CSSProperties;
  deductionEstimate: DeductionEstimateForPanel | null;
  tooltipWhich: TooltipWhich;
  setTooltipWhich: (v: TooltipWhich) => void;
  totalPriceForEstimateStr: string;
  setTotalPriceForEstimateStr: (v: string) => void;
  computedTotalForEstimate: number;
  commitFormula: (raw: string) => string;
  sharesForTaxThreshold: number | null;
  sharesForCreditCap80k: {
    shares: number;
    ratioPct: number;
    dividendPerPeriod: number;
    periodsPerYear: number;
    annualDividendTotal: number;
    annual54C: number;
  } | null;
  selectedEtfInfo: { id: string; label: string } | null;
  taxThreshold: number;
  /** 桌機版試算區與合併／分開欄的間距（與重構前 inline 一致） */
  estimateMarginTop?: number;
};

/** 合併／分開計稅與試算（稅金設定手動區；供手機手動模式與桌機經典版面共用） */
export function ManualTaxBlock(props: ManualTaxBlockProps) {
  const {
    estimateMarginTop = 0,
    applyTaxInTable,
    setApplyTaxInTable,
    taxBracketRate,
    setTaxBracketRate,
    annualIncome,
    setAnnualIncome,
    annualIncomeYuan,
    mergeTaxOpen,
    setMergeTaxOpen,
    separateTaxOpen,
    setSeparateTaxOpen,
    taxBracketOptions,
    inputStyle,
    deductionEstimate,
    tooltipWhich,
    setTooltipWhich,
    totalPriceForEstimateStr,
    setTotalPriceForEstimateStr,
    computedTotalForEstimate,
    commitFormula,
    sharesForTaxThreshold,
    sharesForCreditCap80k,
    selectedEtfInfo,
    taxThreshold,
  } = props;

  const estimatePriceRow = deductionEstimate && (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "6px 0", borderTop: "1px dashed rgba(255,255,255,0.08)", borderBottom: "1px dashed rgba(255,255,255,0.08)" }}>
      <span>總股價</span>
      <input
        type="text"
        inputMode="numeric"
        placeholder="可輸入算式"
        value={totalPriceForEstimateStr}
        onChange={(e) => setTotalPriceForEstimateStr(e.target.value)}
        onBlur={() => {
          const raw = totalPriceForEstimateStr.replace(/,/g, "").trim();
          if (raw === "") setTotalPriceForEstimateStr(String(computedTotalForEstimate));
          else setTotalPriceForEstimateStr(commitFormula(raw));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const raw = totalPriceForEstimateStr.replace(/,/g, "").trim();
            if (raw === "") setTotalPriceForEstimateStr(String(computedTotalForEstimate));
            else setTotalPriceForEstimateStr(commitFormula(raw));
            (e.target as HTMLInputElement).blur();
          }
        }}
        style={{ ...inputStyle, width: 120, boxSizing: "border-box", height: 24 }}
      />
      <span>元</span>
      <span style={{ color: "#9ca3af" }}>→</span>
      <span>
        預估當期股利 <strong>{Math.round(deductionEstimate.estimatedDividend).toLocaleString("zh-TW")}</strong> 元
      </span>
    </div>
  );

  const manualEstimateDetail = deductionEstimate && (
    <div className={styles.estimateBlock} style={estimateMarginTop ? { marginTop: estimateMarginTop } : undefined}>
      <div style={{ fontWeight: 600, color: "#e5e7eb", marginBottom: 4, fontSize: 12 }}>以目前本金+投入+額外試算</div>
      <div style={{ display: "grid", gap: 3 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4 }}>
          <span style={{ color: "#9ca3af" }}>年收入級距</span>
          <span>{deductionEstimate.bracketLabel}</span>
          <span style={{ color: "#6b7280", marginLeft: 8 }}>｜</span>
          <span style={{ color: "#9ca3af" }}>稅金依</span>
          <strong>{deductionEstimate.taxMethod === "separate" ? "分開計稅" : "合併計稅"}</strong>
          <span>{deductionEstimate.taxMethod === "separate" ? "（28%）" : "（級距 " + deductionEstimate.taxRatePct + "%）"}</span>
        </div>
        {estimatePriceRow}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div>
            稅金約扣 <strong style={{ color: "#f5c451" }}>{deductionEstimate.taxAmount.toLocaleString("zh-TW")}</strong> 元
            {deductionEstimate.estimatedDividend < taxThreshold ? "（未達 2 萬門檻）" : ""}
          </div>
          {deductionEstimate.taxMethod === "merge" && deductionEstimate.estimatedDividend >= taxThreshold && (
            <div style={{ fontSize: 10, color: "#9ca3af" }}>
              公式：股利×54C×級距＝應繳稅金；股利×54C×8.5%＝抵減額（上限 8 萬）｜本例：
              {Math.round(deductionEstimate.estimatedDividend).toLocaleString("zh-TW")}×{deductionEstimate.ratioPct}%×{deductionEstimate.taxRatePct}%＝
              {deductionEstimate.taxBeforeCredit?.toLocaleString("zh-TW")} 元應繳；抵減 {deductionEstimate.credit?.toLocaleString("zh-TW")} 元 → 實繳{" "}
              <strong style={{ color: "#f5c451" }}>{deductionEstimate.taxAmount.toLocaleString("zh-TW")}</strong> 元
            </div>
          )}
          {sharesForTaxThreshold != null && selectedEtfInfo && (
            <div style={{ fontSize: 10, color: "#9ca3af" }}>
              約 <strong style={{ color: "#e5e7eb" }}>{sharesForTaxThreshold.toLocaleString("zh-TW")}</strong> 股以上需繳所得稅（{selectedEtfInfo.id}）
            </div>
          )}
          {sharesForCreditCap80k != null && deductionEstimate.taxMethod === "merge" && selectedEtfInfo && (
            <div style={{ fontSize: 10, color: "#9ca3af", lineHeight: 1.5 }}>
              <div>
                約 <strong style={{ color: "#39ff14" }}>{sharesForCreditCap80k.shares.toLocaleString("zh-TW")}</strong> 股可達 8 萬抵減上限（{selectedEtfInfo.id}，54C {sharesForCreditCap80k.ratioPct}%）
              </div>
              <div>
                <div>
                  整年：{sharesForCreditCap80k.shares.toLocaleString("zh-TW")} 股 × {sharesForCreditCap80k.dividendPerPeriod} 元 × {sharesForCreditCap80k.periodsPerYear} 期 ≈{" "}
                  {sharesForCreditCap80k.annualDividendTotal.toLocaleString("zh-TW")} 元年股息（54C 約 {sharesForCreditCap80k.annual54C.toLocaleString("zh-TW")} 元）
                </div>
                <div>→ {sharesForCreditCap80k.annual54C.toLocaleString("zh-TW")} × 8.5% ＝ 年抵減 8 萬</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className={styles.manualTopRow}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#d1d5db", cursor: "pointer" }}>
          <input type="checkbox" checked={applyTaxInTable} onChange={(e) => setApplyTaxInTable(e.target.checked)} />
          <span>稅金</span>
        </label>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>稅金級距</span>
        <select
          value={taxBracketRate}
          onChange={(e) => setTaxBracketRate(Number(e.target.value))}
          style={{
            fontSize: 11,
            padding: "4px 8px",
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(0,0,0,0.5)",
            color: "#e5e7eb",
          }}
        >
          {taxBracketOptions.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
        <span style={{ fontSize: 11, color: "#9ca3af" }}>年收入</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="text"
            value={annualIncome}
            onChange={(e) => setAnnualIncome(e.target.value)}
            placeholder=""
            style={{
              ...inputStyle,
              width: 72,
              boxSizing: "border-box",
              height: 26,
              background: "rgba(0,0,0,0.5)",
              borderColor: "rgba(255,255,255,0.1)",
            }}
          />
          <span style={{ fontSize: 11, color: "#9ca3af" }}>萬</span>
          {annualIncomeYuan != null && (
            <span style={{ fontSize: 10, color: "#6b7280" }}>= {annualIncomeYuan.toLocaleString("zh-TW")} 元</span>
          )}
        </div>
      </div>

      <div className={styles.twoColTax}>
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
              padding: "6px 8px",
              background: "rgba(0,0,0,0.35)",
              borderRadius: 6,
              opacity: taxBracketRate >= 0.30 ? 1 : 0.5,
            }}
          >
            <input
              type="checkbox"
              checked={mergeTaxOpen}
              onChange={(e) => {
                const v = e.target.checked;
                setMergeTaxOpen(v);
                if (v) setSeparateTaxOpen(false);
              }}
              style={{
                cursor: "pointer",
                accentColor: taxBracketRate >= 0.30 ? "#3b82f6" : "#374151",
                opacity: taxBracketRate >= 0.30 ? 1 : 0.6,
              }}
            />
            <span style={{ fontSize: 12, color: taxBracketRate >= 0.30 ? "#d1d5db" : "#4b5563" }}>合併計稅</span>
          </div>
          <div style={{ fontSize: 11, lineHeight: 1.6, color: taxBracketRate >= 0.30 ? "#e5e7eb" : "#9ca3af" }}>
            <div
              style={{
                fontWeight: 600,
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: taxBracketRate >= 0.30 ? "#e5e7eb" : "#9ca3af",
              }}
            >
              合併計稅（適合小資、一般上班族）
              <span
                onMouseEnter={() => setTooltipWhich("merge")}
                onMouseLeave={() => setTooltipWhich(null)}
                style={{
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.4)",
                  color: "#9ca3af",
                  fontSize: 10,
                  cursor: "help",
                }}
              >
                i
                {tooltipWhich === "merge" && (
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "100%",
                      marginTop: 4,
                      zIndex: 10,
                      padding: "10px 12px",
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      fontSize: 11,
                      color: "#1f2937",
                      lineHeight: 1.65,
                      whiteSpace: "normal",
                      width: 340,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                  >
                    <strong>方式A：合併計稅</strong>
                    <br />
                    做法：股利加進總所得一起算稅。應繳稅金＝股利×54C×級距；抵減額＝股利×54C×8.5%，上限 8 萬；實繳＝應繳−抵減。
                    <br />
                    <strong>舉例：股利 100 萬</strong>（可抵減 8 萬）
                    <br />
                    <span style={{ color: "#374151" }}>依你的綜所稅率，股利約繳：</span>
                    <br />
                    5% → 5萬−8萬＝退稅（合併）｜分開固定 28萬
                    <br />
                    12% → 12萬−8萬＝<strong>4萬</strong>（合併）｜分開 28萬
                    <br />
                    20% → 20萬−8萬＝<strong>12萬</strong>（合併）｜分開 28萬
                    <br />
                    30% → 30萬−8萬＝<strong>22萬</strong>（合併）｜分開 28萬
                    <br />
                    40% → 40萬−8萬＝<strong>32萬</strong>（合併）｜分開 <strong>28萬</strong>
                    <br />
                    → 稅率 30%、40% 時分開計稅繳較少。
                  </span>
                )}
              </span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>優點：享有 8.5% 的可抵減稅額，上限 8 萬元（約股利 94 萬以內），小資／一般上班族通常較有利。</li>
            </ul>
          </div>
        </div>
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
              padding: "6px 8px",
              background: "rgba(0,0,0,0.35)",
              borderRadius: 6,
              opacity: taxBracketRate >= 0.30 ? 1 : 0.5,
            }}
          >
            <input
              type="checkbox"
              checked={separateTaxOpen}
              onChange={(e) => {
                const v = e.target.checked;
                setSeparateTaxOpen(v);
                if (v) setMergeTaxOpen(false);
              }}
              style={{
                cursor: "pointer",
                accentColor: taxBracketRate >= 0.30 ? "#3b82f6" : "#374151",
                opacity: taxBracketRate >= 0.30 ? 1 : 0.6,
              }}
            />
            <span style={{ fontSize: 12, color: taxBracketRate >= 0.30 ? "#d1d5db" : "#4b5563" }}>分開計稅</span>
            <span style={{ fontSize: 12, color: taxBracketRate >= 0.30 ? "#39ff14" : "#374151", fontWeight: 600 }}>推薦使用</span>
          </div>
          <div style={{ fontSize: 11, lineHeight: 1.6, color: taxBracketRate >= 0.30 ? "#e5e7eb" : "#9ca3af" }}>
            <div
              style={{
                fontWeight: 600,
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: taxBracketRate >= 0.30 ? "#e5e7eb" : "#9ca3af",
              }}
            >
              分開計稅（單獨列出 28%）
              <span
                onMouseEnter={() => setTooltipWhich("separate")}
                onMouseLeave={() => setTooltipWhich(null)}
                style={{
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.4)",
                  color: "#9ca3af",
                  fontSize: 10,
                  cursor: "help",
                }}
              >
                i
                {tooltipWhich === "separate" && (
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "100%",
                      marginTop: 4,
                      zIndex: 10,
                      padding: "10px 12px",
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      fontSize: 11,
                      color: "#1f2937",
                      lineHeight: 1.65,
                      whiteSpace: "normal",
                      width: 340,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                  >
                    <strong>方式B：分開計稅</strong>
                    <br />
                    做法：股利不併入其他所得，直接 股利×28%＝應納稅額。
                    <br />
                    <strong>舉例：股利 100 萬</strong> → 固定繳 100×28%＝<strong>28 萬</strong>
                    <br />
                    <span style={{ color: "#374151" }}>與合併計稅對照：</span>
                    <br />
                    稅率 5% → 合併退稅｜分開 28萬
                    <br />
                    稅率 12% → 合併 4萬｜分開 28萬
                    <br />
                    稅率 20% → 合併 12萬｜分開 28萬
                    <br />
                    稅率 30% → 合併 22萬｜分開 <strong>28萬</strong>（分開計稅較省）
                    <br />
                    稅率 40% → 合併 32萬｜分開 <strong>28萬</strong>（分開計稅較省）
                    <br />
                    → 稅率 30%、40% 選分開計稅；5%、12% 選合併計稅。
                  </span>
                )}
              </span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>優點：高所得者可用固定 28% 稅率，避免綜合所得被股利推到更高級距。</li>
            </ul>
          </div>
        </div>
      </div>

      {manualEstimateDetail}
    </>
  );
}

/** 桌機寬度專用：重構前「股金設定」左欄外殼 + 完整手動稅金 UI */
export function TaxSettingsDesktopClassicLeftColumn(props: ManualTaxBlockProps) {
  return (
    <div
      style={{
        flex: "1 1 0",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        padding: "10px 12px",
        background: "rgba(0,0,0,0.45)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
      }}
    >
      <ManualTaxBlock {...props} estimateMarginTop={props.estimateMarginTop ?? 38} />
    </div>
  );
}
