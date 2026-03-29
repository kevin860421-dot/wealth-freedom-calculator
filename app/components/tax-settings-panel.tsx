"use client";

import { useId, type CSSProperties } from "react";
import { ManualTaxBlock } from "./manual-tax-block";
import styles from "./tax-settings-panel.module.css";

export type TaxSettingsMode = "auto" | "manual";

export type TaxBracketOption = { value: number; label: string };

export type DeductionEstimateForPanel = {
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

type TooltipWhich = "merge" | "separate" | "nhi2" | null;

type Props = {
  taxSettingsMode: TaxSettingsMode;
  onTaxSettingsModeChange: (mode: TaxSettingsMode) => void;
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
  sharesForCreditCap80k: { shares: number; ratioPct: number; dividendPerPeriod: number; periodsPerYear: number; annualDividendTotal: number; annual54C: number } | null;
  selectedEtfInfo: { id: string; label: string } | null;
  taxThreshold: number;
};

export function TaxSettingsLeftPanel(props: Props) {
  const {
    taxSettingsMode,
    onTaxSettingsModeChange,
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
  const manualBlockProps = {
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
  };

  const modeGroupId = useId();

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

  return (
    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
      <div className={styles.modeRow} role="radiogroup" aria-labelledby={modeGroupId}>
        <div id={modeGroupId} className={styles.modeLabel}>
          稅務模式
        </div>
        <label className={styles.radioOption}>
          <input
            type="radio"
            name="tax-settings-mode"
            checked={taxSettingsMode === "auto"}
            onChange={() => onTaxSettingsModeChange("auto")}
          />
          <span>自動最佳化（推薦）</span>
        </label>
        <label className={styles.radioOption}>
          <input
            type="radio"
            name="tax-settings-mode"
            checked={taxSettingsMode === "manual"}
            onChange={() => onTaxSettingsModeChange("manual")}
          />
          <span>手動設定</span>
        </label>
      </div>

      {/* 自動：精簡結果 + 試算輸入 */}
      <div
        className={`${styles.panelAnim} ${taxSettingsMode === "auto" ? styles.panelAnimOpen : styles.panelAnimCollapsed}`}
        aria-hidden={taxSettingsMode !== "auto"}
      >
        <div className={styles.panelAnimInner}>
          <div className={styles.autoCard} style={{ pointerEvents: taxSettingsMode === "auto" ? undefined : "none" }}>
            <div className={styles.autoLead}>已自動計算最省稅方式</div>
            <p className={styles.autoSub}>依年收入級距，系統已選擇較有利的合併或分開計稅；稅金與二代健保皆納入試算。</p>
            <span className={styles.netLabel}>預估當期實拿（扣稅與補充保費後）</span>
            <div className={styles.netBig}>
              {deductionEstimate != null ? `${deductionEstimate.netPerPeriod.toLocaleString("zh-TW")} 元` : "—"}
            </div>
            <ul className={styles.includedList}>
              <li>股利抵減 8.5%</li>
              <li>分離課稅 28%（高所得時）</li>
              <li>二代健保 2.11%</li>
            </ul>
            {deductionEstimate && (
              <div className={`${styles.estimateBlock} ${styles.autoEstimateTight}`}>
                <div style={{ fontWeight: 600, color: "#e5e7eb", marginBottom: 6, fontSize: 12 }}>試算</div>
                {estimatePriceRow}
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
                  稅金約 <strong style={{ color: "#f5c451" }}>{deductionEstimate.taxAmount.toLocaleString("zh-TW")}</strong> 元 · 二代健保約{" "}
                  <strong style={{ color: "#f5c451" }}>{deductionEstimate.nhi2Amount.toLocaleString("zh-TW")}</strong> 元
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 手動：完整選項 */}
      <div
        className={`${styles.panelAnim} ${taxSettingsMode === "manual" ? styles.panelAnimOpen : styles.panelAnimCollapsed}`}
        aria-hidden={taxSettingsMode !== "manual"}
      >
        <div className={styles.panelAnimInner}>
          <div className={styles.manualShell} style={{ pointerEvents: taxSettingsMode === "manual" ? undefined : "none" }}>
            <ManualTaxBlock {...manualBlockProps} />
          </div>
        </div>
      </div>
    </div>
  );
}
