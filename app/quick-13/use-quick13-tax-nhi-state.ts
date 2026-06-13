"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PayoutFrequencyPersist } from "@/lib/calculator-persistence";
import {
  TAX_BRACKETS,
  TAX_CREDIT_CAP,
  TAX_CREDIT_RATE,
  TAX_THRESHOLD,
  commitFormula,
  getTaxBracketByIncomeWan,
  parseFormula,
} from "@/lib/home-tax-nhi-shared";
import { getAfterTaxAndNhi2WithRate } from "@/lib/table-calculator";
import { TICKER_PRESETS, buildDefault54cRatioMap } from "@/app/ticker-presets";
import { filterTickerPresetsByQuery } from "@/app/etf-fuzzy-search";
import type { TaxSettingsMode } from "@/app/components/tax-settings-panel";

type PayoutFrequency = PayoutFrequencyPersist;
const DEFAULT_ETF_ID = "0050";
const DEFAULT_ETF = TICKER_PRESETS.find((p) => p.id === DEFAULT_ETF_ID) ?? TICKER_PRESETS[0]!;
const DEFAULT_TOTAL_PRICE = "500000";

export function useQuick13TaxNhiState() {
  const [taxSettingsMode, setTaxSettingsMode] = useState<TaxSettingsMode>("auto");
  const [applyTaxInTable, setApplyTaxInTable] = useState(true);
  const [applyNhi2InTable, setApplyNhi2InTable] = useState(true);
  const [taxBracketRate, setTaxBracketRate] = useState(0.2);
  const [annualIncome, setAnnualIncome] = useState("");
  const [mergeTaxOpen, setMergeTaxOpen] = useState(true);
  const [separateTaxOpen, setSeparateTaxOpen] = useState(false);
  const [tooltipWhich, setTooltipWhich] = useState<"merge" | "separate" | "nhi2" | null>(null);
  const [etfCodeFilter, setEtfCodeFilter] = useState("");
  const [selectedEtf, setSelectedEtf] = useState(DEFAULT_ETF_ID);
  const [etfRatioEstimates, setEtfRatioEstimates] = useState<Record<string, string>>(() => buildDefault54cRatioMap());
  const [totalPriceForEstimateStr, setTotalPriceForEstimateStr] = useState(DEFAULT_TOTAL_PRICE);
  const [annualReturnRate, setAnnualReturnRate] = useState(DEFAULT_ETF.annualReturn);
  const [dividendYieldPct, setDividendYieldPct] = useState<number | "">(DEFAULT_ETF.dividendYieldPct ?? "");
  const [stockDividendPct, setStockDividendPct] = useState<number | "">(DEFAULT_ETF.stockDividendPct ?? "");
  const [rateSource, setRateSource] = useState<"annual" | "dividend">("dividend");
  const [payoutFrequency, setPayoutFrequency] = useState<PayoutFrequency>(DEFAULT_ETF.frequency as PayoutFrequency);

  const annualIncomeWan = useMemo(() => {
    const n = parseFloat(annualIncome.replace(/,/g, ""));
    return Number.isFinite(n) ? n : NaN;
  }, [annualIncome]);
  const annualIncomeYuan = useMemo(
    () => (Number.isFinite(annualIncomeWan) ? Math.round(annualIncomeWan * 10000) : null),
    [annualIncomeWan],
  );

  useEffect(() => {
    if (Number.isFinite(annualIncomeWan) && annualIncomeWan >= 0) {
      setTaxBracketRate(getTaxBracketByIncomeWan(annualIncomeWan));
    }
  }, [annualIncomeWan]);

  useEffect(() => {
    if (taxSettingsMode !== "auto") return;
    setApplyTaxInTable((prev) => (prev ? prev : true));
    setApplyNhi2InTable((prev) => (prev ? prev : true));
    if (taxBracketRate >= 0.3) {
      setSeparateTaxOpen((prev) => (prev ? prev : true));
      setMergeTaxOpen((prev) => (prev ? false : prev));
    } else {
      setSeparateTaxOpen((prev) => (prev ? false : prev));
      setMergeTaxOpen((prev) => (prev ? prev : true));
    }
  }, [taxSettingsMode, taxBracketRate]);

  const handlePayoutFrequencyChange = useCallback((freq: PayoutFrequency) => {
    setPayoutFrequency(freq);
  }, []);

  const handleEtfCodeChange = useCallback(
    (raw: string) => {
      const safeRaw = typeof raw === "string" ? raw : String(raw ?? "");
      setEtfCodeFilter(safeRaw);
      const code = safeRaw.replace(/\s/g, "");
      const exact = TICKER_PRESETS.find((p) => p.id === code);
      if (exact) {
        setSelectedEtf(exact.id);
        setAnnualReturnRate(exact.annualReturn);
        handlePayoutFrequencyChange(exact.frequency as PayoutFrequency);
        setDividendYieldPct(exact.dividendYieldPct ?? "");
        setStockDividendPct(exact.stockDividendPct ?? "");
        setRateSource("dividend");
        return;
      }
      if (/^\d+$/.test(code)) {
        const byPrefix = TICKER_PRESETS.filter((p) => p.id.startsWith(code) || p.id.includes(code));
        if (byPrefix.length === 1) {
          const one = byPrefix[0];
          setSelectedEtf(one.id);
          setAnnualReturnRate(one.annualReturn);
          handlePayoutFrequencyChange(one.frequency as PayoutFrequency);
          setDividendYieldPct(one.dividendYieldPct ?? "");
          setStockDividendPct(one.stockDividendPct ?? "");
          setRateSource("dividend");
        }
      }
    },
    [handlePayoutFrequencyChange],
  );

  const selectEtfFromMenu = useCallback(
    (id: string) => {
      if (id === "none") setEtfCodeFilter("");
      setSelectedEtf(id);
      const preset = TICKER_PRESETS.find((p) => p.id === id);
      if (preset) {
        setAnnualReturnRate(preset.annualReturn);
        handlePayoutFrequencyChange(preset.frequency as PayoutFrequency);
        setDividendYieldPct(preset.dividendYieldPct ?? "");
        setStockDividendPct(preset.stockDividendPct ?? "");
        setRateSource("dividend");
      }
    },
    [handlePayoutFrequencyChange],
  );

  const filteredEtfs = useMemo(() => {
    const query = typeof etfCodeFilter === "string" ? etfCodeFilter : "";
    const list = filterTickerPresetsByQuery(query);
    if (selectedEtf && selectedEtf !== "none") {
      const cur = TICKER_PRESETS.find((p) => p.id === selectedEtf);
      if (cur && !list.some((p) => p.id === selectedEtf)) {
        return [cur, ...list].map((p) => ({ id: p.id, label: p.label }));
      }
    }
    return list.map((p) => ({ id: p.id, label: p.label }));
  }, [etfCodeFilter, selectedEtf]);

  const selectedEtfInfo = useMemo(
    () => (selectedEtf && selectedEtf !== "none" ? TICKER_PRESETS.find((p) => p.id === selectedEtf) : null),
    [selectedEtf],
  );

  const effectiveAnnualRate = useMemo(() => {
    if (rateSource === "dividend" && (dividendYieldPct !== "" || stockDividendPct !== "")) {
      return (Number(dividendYieldPct) || 0) + (Number(stockDividendPct) || 0);
    }
    return annualReturnRate;
  }, [rateSource, dividendYieldPct, stockDividendPct, annualReturnRate]);

  const computedTotalForEstimate = useMemo(() => {
    const raw = totalPriceForEstimateStr.replace(/,/g, "").trim();
    const parsed = raw === "" ? parseFormula(DEFAULT_TOTAL_PRICE) : parseFormula(raw);
    return Math.max(0, parsed || parseFormula(DEFAULT_TOTAL_PRICE) || 0);
  }, [totalPriceForEstimateStr]);

  const deductionEstimate = useMemo(() => {
    const raw = totalPriceForEstimateStr.replace(/,/g, "").trim();
    const total = raw === "" ? computedTotalForEstimate : Math.max(0, parseFormula(raw) || 0) || computedTotalForEstimate;
    if (total <= 0 || effectiveAnnualRate <= 0) return null;
    const periodsPerYear =
      payoutFrequency === "month" ? 12 : payoutFrequency === "quarter" ? 4 : payoutFrequency === "semiannual" ? 2 : 1;
    const estimatedDividend = Math.round((total * (effectiveAnnualRate / 100)) / periodsPerYear);
    const taxMethod: "separate" | "merge" = separateTaxOpen ? "separate" : "merge";
    const taxRate = separateTaxOpen ? 0.28 : taxBracketRate;
    const taxRatePct = separateTaxOpen ? 28 : Math.round(taxBracketRate * 100);
    const bracketLabel = TAX_BRACKETS.find((b) => b.value === taxBracketRate)?.label ?? "";
    const ratioPct =
      selectedEtf !== "none" ? parseFloat(String(etfRatioEstimates[selectedEtf] || "0").replace(/,/g, "")) || 50 : 100;
    const nhi2Countable = Math.round(estimatedDividend * (ratioPct / 100));
    const ratio = ratioPct / 100;
    const { tax: taxAmount, nhi2: nhi2Amount, credit, taxableBase, net } = getAfterTaxAndNhi2WithRate(
      estimatedDividend,
      taxRate,
      applyNhi2InTable,
      periodsPerYear,
      taxMethod === "merge",
      ratio,
    );
    const taxBeforeCredit = taxableBase * taxRate;
    return {
      totalAssets: total,
      estimatedDividend,
      taxAmount: Math.round(taxAmount),
      taxRatePct,
      taxMethod,
      bracketLabel,
      nhi2Amount: Math.round(nhi2Amount),
      nhi2Countable,
      ratioPct,
      taxableBase: Math.round(taxableBase),
      credit: Math.round(credit),
      taxBeforeCredit: Math.round(taxBeforeCredit),
      periodsPerYear,
      netPerPeriod: Math.round(net),
    };
  }, [
    totalPriceForEstimateStr,
    computedTotalForEstimate,
    effectiveAnnualRate,
    payoutFrequency,
    taxBracketRate,
    separateTaxOpen,
    selectedEtf,
    etfRatioEstimates,
    applyNhi2InTable,
  ]);

  const taxAutoSavingsYuan = useMemo(() => {
    const raw = totalPriceForEstimateStr.replace(/,/g, "").trim();
    const total = raw === "" ? computedTotalForEstimate : Math.max(0, parseFormula(raw) || 0) || computedTotalForEstimate;
    if (total <= 0 || effectiveAnnualRate <= 0) return null;
    const periodsPerYear =
      payoutFrequency === "month" ? 12 : payoutFrequency === "quarter" ? 4 : payoutFrequency === "semiannual" ? 2 : 1;
    const estimatedDividend = Math.round((total * (effectiveAnnualRate / 100)) / periodsPerYear);
    const ratioPct =
      selectedEtf !== "none" ? parseFloat(String(etfRatioEstimates[selectedEtf] || "0").replace(/,/g, "")) || 50 : 100;
    const ratio = ratioPct / 100;
    const { net: netMerge } = getAfterTaxAndNhi2WithRate(
      estimatedDividend,
      taxBracketRate,
      applyNhi2InTable,
      periodsPerYear,
      true,
      ratio,
    );
    const { net: netSep } = getAfterTaxAndNhi2WithRate(
      estimatedDividend,
      0.28,
      applyNhi2InTable,
      periodsPerYear,
      false,
      ratio,
    );
    const autoPickSeparate = taxBracketRate >= 0.3;
    const chosen = autoPickSeparate ? Math.round(netSep) : Math.round(netMerge);
    const alternate = autoPickSeparate ? Math.round(netMerge) : Math.round(netSep);
    return Math.max(0, chosen - alternate);
  }, [
    totalPriceForEstimateStr,
    computedTotalForEstimate,
    effectiveAnnualRate,
    payoutFrequency,
    taxBracketRate,
    selectedEtf,
    etfRatioEstimates,
    applyNhi2InTable,
  ]);

  const sharesForTaxThreshold = useMemo(() => {
    if (!selectedEtfInfo?.dividendPerPeriod || selectedEtfInfo.dividendPerPeriod <= 0) return null;
    return Math.ceil(TAX_THRESHOLD / selectedEtfInfo.dividendPerPeriod);
  }, [selectedEtfInfo]);

  const nhi2FreeEstimate = useMemo(() => {
    if (!selectedEtfInfo || selectedEtf === "none") return null;
    const ratioRaw = etfRatioEstimates[selectedEtf];
    const ratioPct = ratioRaw !== undefined && ratioRaw !== "" ? parseFloat(String(ratioRaw).replace(/,/g, "")) : NaN;
    if (!Number.isFinite(ratioPct) || ratioPct <= 0) return null;
    const ratio = ratioPct / 100;
    const maxDividend = 20000 / ratio;
    const dp = selectedEtfInfo.dividendPerPeriod;
    const price = selectedEtfInfo.price;
    const shares = dp != null && dp > 0 ? Math.floor(maxDividend / dp) : null;
    const marketValue = shares != null && price != null ? Math.round(shares * price) : null;
    return { maxDividend: Math.floor(maxDividend), ratioPct, shares, price, dividendPerPeriod: dp, marketValue };
  }, [selectedEtf, selectedEtfInfo, etfRatioEstimates]);

  const sharesForNhi2Threshold = useMemo(() => {
    if (!nhi2FreeEstimate?.shares) return null;
    return nhi2FreeEstimate.shares + 1;
  }, [nhi2FreeEstimate]);

  const sharesForCreditCap80k = useMemo(() => {
    if (!selectedEtfInfo?.dividendPerPeriod || selectedEtfInfo.dividendPerPeriod <= 0) return null;
    const ratioPct =
      selectedEtf !== "none" ? parseFloat(String(etfRatioEstimates[selectedEtf] || "50").replace(/,/g, "")) || 50 : 100;
    const ratio = ratioPct / 100;
    const periodsPerYear =
      selectedEtfInfo.frequency === "month"
        ? 12
        : selectedEtfInfo.frequency === "quarter"
          ? 4
          : selectedEtfInfo.frequency === "semiannual"
            ? 2
            : 1;
    const periodLabel =
      selectedEtfInfo.frequency === "month"
        ? "月"
        : selectedEtfInfo.frequency === "quarter"
          ? "季"
          : selectedEtfInfo.frequency === "semiannual"
            ? "半年"
            : "年";
    const annual54CTarget = TAX_CREDIT_CAP / TAX_CREDIT_RATE;
    const shares = Math.ceil(annual54CTarget / (selectedEtfInfo.dividendPerPeriod * periodsPerYear * ratio));
    const dividendPerPeriodTotal = Math.round(shares * selectedEtfInfo.dividendPerPeriod);
    const annualDividendTotal = Math.round(shares * selectedEtfInfo.dividendPerPeriod * periodsPerYear);
    const period54C = Math.round(dividendPerPeriodTotal * ratio);
    const annual54C = Math.round(annualDividendTotal * ratio);
    const creditPerPeriod = Math.round(period54C * TAX_CREDIT_RATE);
    return {
      shares,
      ratioPct,
      periodLabel,
      dividendPerPeriodTotal,
      dividendPerPeriod: selectedEtfInfo.dividendPerPeriod,
      periodsPerYear,
      period54C,
      annual54C,
      annualDividendTotal,
      creditPerPeriod,
    };
  }, [selectedEtf, selectedEtfInfo, etfRatioEstimates]);

  return {
    taxSettingsMode,
    setTaxSettingsMode,
    applyTaxInTable,
    setApplyTaxInTable,
    applyNhi2InTable,
    setApplyNhi2InTable,
    taxBracketRate,
    setTaxBracketRate,
    annualIncome,
    setAnnualIncome,
    annualIncomeYuan,
    mergeTaxOpen,
    setMergeTaxOpen,
    separateTaxOpen,
    setSeparateTaxOpen,
    tooltipWhich,
    setTooltipWhich,
    totalPriceForEstimateStr,
    setTotalPriceForEstimateStr,
    computedTotalForEstimate,
    commitFormula,
    sharesForTaxThreshold,
    sharesForCreditCap80k,
    sharesForNhi2Threshold,
    selectedEtfInfo,
    etfCodeFilter,
    handleEtfCodeChange,
    selectedEtf,
    selectEtfFromMenu,
    filteredEtfs,
    etfRatioEstimates,
    onRatioChange: (etfId: string, value: string) => setEtfRatioEstimates((prev) => ({ ...prev, [etfId]: value })),
    deductionEstimate,
    taxAutoSavingsYuan,
  };
}

export type Quick13TaxNhiState = ReturnType<typeof useQuick13TaxNhiState>;
