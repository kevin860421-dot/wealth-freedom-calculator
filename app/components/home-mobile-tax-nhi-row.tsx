"use client";

import { MobileNhi2ImpactBlock } from "@/app/components/mobile-nhi2-impact-block";
import { TaxSettingsLeftPanel } from "@/app/components/tax-settings-panel";
import { Quick13ManualDetailSlot } from "@/app/quick-13/Quick13ManualDetailSlot";
import { QUICK13_INPUT_STYLE, TAX_BRACKETS, TAX_THRESHOLD } from "@/lib/home-tax-nhi-shared";
import { TICKER_PRESETS } from "@/app/ticker-presets";
import type { Quick13TaxNhiState } from "@/app/quick-13/use-quick13-tax-nhi-state";
import styles from "./home-mobile-tax-nhi-row.module.css";

/** 首頁手機版「二代健保與稅金」同一套 UI（第 13 台小計算機） */
export function HomeMobileTaxNhiRow(props: Quick13TaxNhiState) {
  return (
    <div id="quick-13-tax-nhi-row" className={styles.row}>
      <div className={styles.inner}>
        <div className={styles.taxCol}>
          <TaxSettingsLeftPanel
            taxSettingsMode={props.taxSettingsMode}
            onTaxSettingsModeChange={props.setTaxSettingsMode}
            applyTaxInTable={props.applyTaxInTable}
            setApplyTaxInTable={props.setApplyTaxInTable}
            taxBracketRate={props.taxBracketRate}
            setTaxBracketRate={props.setTaxBracketRate}
            annualIncome={props.annualIncome}
            setAnnualIncome={props.setAnnualIncome}
            annualIncomeYuan={props.annualIncomeYuan}
            mergeTaxOpen={props.mergeTaxOpen}
            setMergeTaxOpen={props.setMergeTaxOpen}
            separateTaxOpen={props.separateTaxOpen}
            setSeparateTaxOpen={props.setSeparateTaxOpen}
            taxBracketOptions={TAX_BRACKETS}
            inputStyle={QUICK13_INPUT_STYLE}
            deductionEstimate={props.deductionEstimate}
            tooltipWhich={props.tooltipWhich}
            setTooltipWhich={props.setTooltipWhich}
            totalPriceForEstimateStr={props.totalPriceForEstimateStr}
            setTotalPriceForEstimateStr={props.setTotalPriceForEstimateStr}
            computedTotalForEstimate={props.computedTotalForEstimate}
            commitFormula={props.commitFormula}
            sharesForTaxThreshold={props.sharesForTaxThreshold}
            sharesForCreditCap80k={props.sharesForCreditCap80k}
            selectedEtfInfo={props.selectedEtfInfo ?? null}
            taxThreshold={TAX_THRESHOLD}
            taxAutoSavingsYuan={props.taxAutoSavingsYuan}
          />
        </div>
        <div
          className={styles.nhiCol}
          style={{
            opacity: props.taxSettingsMode === "manual" ? 0.92 : 1,
          }}
        >
          <MobileNhi2ImpactBlock
            taxSettingsMode={props.taxSettingsMode}
            applyNhi2InTable={props.applyNhi2InTable}
            setApplyNhi2InTable={props.setApplyNhi2InTable}
            inputStyle={QUICK13_INPUT_STYLE}
            etfCodeFilter={props.etfCodeFilter}
            onEtfCodeChange={props.handleEtfCodeChange}
            tickersCount={TICKER_PRESETS.length}
            selectedEtf={props.selectedEtf}
            onSelectEtf={props.selectEtfFromMenu}
            filteredEtfs={props.filteredEtfs}
            etfRatioEstimates={props.etfRatioEstimates}
            onRatioChange={props.onRatioChange}
            deductionEstimate={props.deductionEstimate}
            selectedEtfInfo={props.selectedEtfInfo}
            manualDetailSlot={
              <Quick13ManualDetailSlot
                taxSettingsMode={props.taxSettingsMode}
                deductionEstimate={props.deductionEstimate}
                totalPriceForEstimateStr={props.totalPriceForEstimateStr}
                setTotalPriceForEstimateStr={props.setTotalPriceForEstimateStr}
                computedTotalForEstimate={props.computedTotalForEstimate}
                sharesForNhi2Threshold={props.sharesForNhi2Threshold}
                selectedEtfInfo={props.selectedEtfInfo}
              />
            }
          />
        </div>
      </div>
    </div>
  );
}
