"use client";

import { useId, type CSSProperties } from "react";
import { MobileManualTaxPanel } from "./mobile-manual-tax-panel";
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
  /** 自動模式：相對另一種課稅方式的預估多省金額（與試算公式一致，僅展示） */
  taxAutoSavingsYuan: number | null;
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
    taxAutoSavingsYuan,
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
            <p className={styles.autoPickLead}>👉 已為你選擇：</p>
            <p className={styles.autoPickMethod}>
              「{deductionEstimate != null ? (deductionEstimate.taxMethod === "separate" ? "分離課稅" : "合併課稅") : "—"}」
            </p>
            <p className={styles.autoSaveLead}>👉 幫你多省：</p>
            <p className={styles.autoSaveAmt}>
              {taxAutoSavingsYuan != null ? `${taxAutoSavingsYuan.toLocaleString("zh-TW")} 元` : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* 手動：完整選項 */}
      <div
        className={`${styles.panelAnim} ${taxSettingsMode === "manual" ? styles.panelAnimOpen : styles.panelAnimCollapsed}`}
        aria-hidden={taxSettingsMode !== "manual"}
      >
        <div className={styles.panelAnimInner} style={{ pointerEvents: taxSettingsMode === "manual" ? undefined : "none" }}>
          <MobileManualTaxPanel {...manualBlockProps} />
        </div>
      </div>
    </div>
  );
}
