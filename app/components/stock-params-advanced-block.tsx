"use client";

import type { CSSProperties } from "react";
import { TICKER_PRESETS } from "../ticker-presets";

export type PayoutFrequency = "month" | "quarter" | "semiannual" | "year";
export type RateSource = "annual" | "dividend" | null;

const inputStyleBase: CSSProperties = {
  backgroundColor: "rgba(0,0,0,0.4)",
  borderRadius: 6,
  border: "1px solid rgba(255,255,255,0.1)",
  padding: "4px 8px",
  fontSize: 11,
  color: "#e5e7eb",
  outline: "none",
};

type EtfOption = { id: string; label: string };

type SelectedEtfInfo = {
  price?: number;
  dividendPerPeriod?: number;
  dividendMonths?: number[];
  frequency?: PayoutFrequency;
} | null;

export type StockParamsAdvancedBlockProps = {
  etfCodeFilter: string;
  handleEtfCodeChange: (raw: string) => void;
  selectedEtf: string;
  setSelectedEtf: (id: string) => void;
  filteredEtfs: EtfOption[];
  payoutFrequency: PayoutFrequency;
  handlePayoutFrequencyChange: (v: PayoutFrequency) => void;
  annualReturnRate: number;
  setAnnualReturnRate: (n: number) => void;
  setRateSource: (s: RateSource) => void;
  rateSource: RateSource;
  dividendYieldPct: number | "";
  stockDividendPct: number | "";
  setDividendYieldPct: (v: number | "") => void;
  setStockDividendPct: (v: number | "") => void;
  currentPrincipalNum: number;
  /** 與首頁 TICKER_PRESETS 選項一致；未選檔時可為 null／undefined */
  selectedEtfInfo: SelectedEtfInfo | undefined;
  initialYearStr: string;
  setInitialYearStr: (s: string) => void;
  initialMonthStr: string;
  setInitialMonthStr: (s: string) => void;
  initialYear: number;
  initialMonth: number;
  defaultYear: number;
  defaultMonth: number;
  nthPeriod: number;
  setNthPeriod: (n: number) => void;
  maxNthPeriod: number;
  defaultYearStr: string;
  setDefaultYearStr: (s: string) => void;
  defaultMonthStr: string;
  setDefaultMonthStr: (s: string) => void;
  todayYear: number;
  todayMonth: number;
  monthlyContributionNum: number;
  monthlyExtraNum: number;
  effectivePayoutLabel: string;
  isNthPeriodDividendMonth: boolean;
  nthPeriodEstimate: { grossDividend: number };
  sharesFromActualDividend: { zhang: number; shares: number } | null;
  reinvestRatio: number;
  setReinvestRatio: (n: number) => void;
  reinvestNoteIsMet: boolean;
  periodLabelForBalance: string;
  periodMonthsForBalance: number;
  /** 桌機：顯示 ETF 列最右「年化」；手機基本區已填時設 false */
  showAnnualInEtfRow?: boolean;
  /** 桌機：顯示「當前本金」小卡；手機改為摘要卡時設 false */
  showInlinePrincipalCard?: boolean;
  /** 手機：ETF 列改直向堆疊 */
  stackEtfRow?: boolean;
  /** 手機進階：分組標題（①ETF／②配息／③時間／④試算），不改欄位邏輯 */
  mobileGrouped?: boolean;
};

/**
 * 存股參數「進階」區：ETF／頻率／（選）年化、日期列、試算五欄、再投入、股息股利。
 * 由 page 傳入狀態，不內含業務邏輯。
 */
export function StockParamsAdvancedBlock({
  etfCodeFilter,
  handleEtfCodeChange,
  selectedEtf,
  setSelectedEtf,
  filteredEtfs,
  payoutFrequency,
  handlePayoutFrequencyChange,
  annualReturnRate,
  setAnnualReturnRate,
  setRateSource,
  rateSource,
  dividendYieldPct,
  stockDividendPct,
  setDividendYieldPct,
  setStockDividendPct,
  currentPrincipalNum,
  selectedEtfInfo,
  initialYearStr,
  setInitialYearStr,
  initialMonthStr,
  setInitialMonthStr,
  initialYear,
  initialMonth,
  defaultYear,
  defaultMonth,
  nthPeriod,
  setNthPeriod,
  maxNthPeriod,
  defaultYearStr,
  setDefaultYearStr,
  defaultMonthStr,
  setDefaultMonthStr,
  todayYear,
  todayMonth,
  monthlyContributionNum,
  monthlyExtraNum,
  effectivePayoutLabel,
  isNthPeriodDividendMonth,
  nthPeriodEstimate,
  sharesFromActualDividend,
  reinvestRatio,
  setReinvestRatio,
  reinvestNoteIsMet,
  periodLabelForBalance,
  periodMonthsForBalance,
  showAnnualInEtfRow = true,
  showInlinePrincipalCard = true,
  stackEtfRow = false,
  mobileGrouped = false,
}: StockParamsAdvancedBlockProps) {
  const m = mobileGrouped && stackEtfRow;
  const inputStyle: CSSProperties = m
    ? {
        ...inputStyleBase,
        fontSize: 13,
        padding: "8px 10px",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.12)",
      }
    : inputStyleBase;

  const mobileGroupBox = (accent: string): CSSProperties => ({
    padding: "8px 10px 10px",
    borderRadius: 12,
    background: "linear-gradient(165deg, rgba(15, 23, 42, 0.55), rgba(0, 0, 0, 0.42))",
    border: "1px solid rgba(255, 255, 255, 0.07)",
    borderLeft: `3px solid ${accent}`,
    marginBottom: 8,
  });
  const mobileSubTitle = (color: string): CSSProperties => ({
    fontSize: 13,
    fontWeight: 700,
    color,
    letterSpacing: "0.02em",
    margin: "0 0 6px 0",
  });
  const mobileHintLine: CSSProperties = {
    fontSize: 11,
    color: "#94a3b8",
    lineHeight: 1.45,
    margin: "0 0 8px 0",
  };
  const labelMobile: CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: "#cbd5e1",
    lineHeight: 1.25,
  };

  const tickerPresetCount = TICKER_PRESETS.length;
  const default0050Hint = (() => {
    const p = TICKER_PRESETS.find((x) => x.id === "0050");
    if (!p) return "預設標的：0050";
    const fl =
      p.frequency === "month" ? "月配" : p.frequency === "quarter" ? "季配" : p.frequency === "semiannual" ? "半年配" : "年配";
    return `預設標的：0050（${fl}）`;
  })();
  const etfFilterTitle = `輸入 1–5 碼篩選標的，清單共 ${tickerPresetCount} 檔（ETF 與股票）`;

  const showDividendMonthBadges =
    !!selectedEtfInfo &&
    selectedEtf !== "none" &&
    !!selectedEtfInfo.dividendMonths &&
    selectedEtfInfo.dividendMonths.length > 0 &&
    selectedEtfInfo.frequency !== "month";

  const dividendMonthBadgesEl = showDividendMonthBadges ? (
    <div style={{ display: "flex", flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
      {selectedEtfInfo!.dividendMonths!.map((m, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "4px 10px",
            background: "rgba(0,0,0,0.2)",
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.1)",
            fontSize: 12,
            color: "#e5e7eb",
          }}
        >
          {m} 月
        </div>
      ))}
    </div>
  ) : null;

  const etfRowStyle: CSSProperties = {
    display: "flex",
    flexDirection: stackEtfRow ? "column" : "row",
    gap: stackEtfRow ? 12 : 10,
    alignItems: stackEtfRow ? "stretch" : "flex-start",
    width: "100%",
    minWidth: 0,
    flexWrap: stackEtfRow ? "nowrap" : "wrap",
  };

  const etfMobileTwoCol: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
    gap: 10,
    alignItems: "start",
    width: "100%",
    minWidth: 0,
  };

  const fieldH = m ? 42 : stackEtfRow ? 40 : 28;
  const stepH = m ? 36 : 28;

  return (
    <>
      {mobileGrouped && stackEtfRow ? (
        <>
          <div style={mobileGroupBox("#a78bfa")}>
            <p style={mobileSubTitle("#e9d5ff")}>① ETF 設定</p>
            <p style={mobileHintLine}>{default0050Hint}</p>
            <div style={etfMobileTwoCol}>
              <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={labelMobile} title={etfFilterTitle}>
                  ETF 篩選（1–5 碼，共 {tickerPresetCount} 檔）
                </label>
                <input
                  type="text"
                  placeholder="例：0050"
                  value={etfCodeFilter}
                  maxLength={5}
                  onChange={(e) => handleEtfCodeChange(e.target.value)}
                  style={{ ...inputStyle, width: "100%", boxSizing: "border-box", height: fieldH }}
                />
              </div>
              <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={labelMobile}>選擇 ETF</label>
                <select
                  value={selectedEtf}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedEtf(id);
                    const preset = TICKER_PRESETS.find((p) => p.id === id);
                    if (preset) {
                      setAnnualReturnRate(preset.annualReturn);
                      handlePayoutFrequencyChange(preset.frequency as PayoutFrequency);
                      setDividendYieldPct(preset.dividendYieldPct ?? "");
                      setStockDividendPct(preset.stockDividendPct ?? "");
                      setRateSource("dividend");
                    }
                  }}
                  style={{ ...inputStyle, paddingRight: 24, width: "100%", boxSizing: "border-box", minWidth: 0, height: fieldH }}
                >
                  <option value="none">不使用預設（自行輸入年化）</option>
                  {filteredEtfs.map((etf) => (
                    <option key={etf.id} value={etf.id}>
                      {etf.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div style={mobileGroupBox("#38bdf8")}>
            <p style={mobileSubTitle("#bae6fd")}>② 配息設定</p>
            <p style={mobileHintLine}>{default0050Hint}</p>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 10, alignItems: "start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                <label style={labelMobile}>股利發放頻率</label>
                <select
                  value={payoutFrequency}
                  onChange={(e) => handlePayoutFrequencyChange(e.target.value as PayoutFrequency)}
                  style={{ ...inputStyle, paddingRight: 24, width: "100%", boxSizing: "border-box", height: fieldH }}
                >
                  <option value="month">月領</option>
                  <option value="quarter">季領</option>
                  <option value="semiannual">半年領</option>
                  <option value="year">年領</option>
                </select>
              </div>
              <div style={{ minWidth: 0 }}>
                <span style={{ ...labelMobile, display: "block", marginBottom: 4 }}>投入月份</span>
                {dividendMonthBadgesEl}
                {!showDividendMonthBadges ? (
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0", lineHeight: 1.45 }}>月配為每月；非月配顯示除息月</p>
                ) : null}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={etfRowStyle}>
          <div style={{ flex: stackEtfRow ? "none" : "1 1 0%", minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
            <label style={{ fontSize: 12, color: "#d1d5db", lineHeight: 1.2 }} title={etfFilterTitle}>
              標的篩選（1–5 碼，共 {tickerPresetCount} 檔）
            </label>
            <input
              type="text"
              placeholder="例：0050、00919"
              value={etfCodeFilter}
              maxLength={5}
              onChange={(e) => handleEtfCodeChange(e.target.value)}
              style={{ ...inputStyle, width: "100%", boxSizing: "border-box", height: stackEtfRow ? 40 : 28 }}
            />
          </div>
          <div style={{ flex: stackEtfRow ? "none" : "1.2 1 0%", minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
            <label style={{ fontSize: 12, color: "#d1d5db", lineHeight: 1.2 }}>選擇 ETF</label>
            <select
              value={selectedEtf}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedEtf(id);
                const preset = TICKER_PRESETS.find((p) => p.id === id);
                if (preset) {
                  setAnnualReturnRate(preset.annualReturn);
                  handlePayoutFrequencyChange(preset.frequency as PayoutFrequency);
                  setDividendYieldPct(preset.dividendYieldPct ?? "");
                  setStockDividendPct(preset.stockDividendPct ?? "");
                  setRateSource("dividend");
                }
              }}
              style={{ ...inputStyle, paddingRight: 24, width: "100%", boxSizing: "border-box", minWidth: 0, height: stackEtfRow ? 40 : 28 }}
            >
              <option value="none">不使用預設（自行輸入年化）</option>
              {filteredEtfs.map((etf) => (
                <option key={etf.id} value={etf.id}>
                  {etf.label}
                </option>
              ))}
            </select>
            {!mobileGrouped &&
              selectedEtfInfo &&
              selectedEtf !== "none" &&
              selectedEtfInfo.dividendMonths &&
              selectedEtfInfo.dividendMonths.length > 0 &&
              selectedEtfInfo.frequency !== "month" && (
                <div style={{ display: "flex", flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                  {selectedEtfInfo.dividendMonths.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "4px 10px",
                        background: "rgba(0,0,0,0.2)",
                        borderRadius: 6,
                        border: "1px solid rgba(255,255,255,0.1)",
                        fontSize: 12,
                        color: "#e5e7eb",
                      }}
                    >
                      {m} 月
                    </div>
                  ))}
                </div>
              )}
          </div>
          <div style={{ flex: stackEtfRow ? "none" : "0 0 140px", display: "flex", flexDirection: "column", gap: 2, width: stackEtfRow ? "100%" : undefined }}>
            <label style={{ fontSize: 12, color: "#d1d5db", lineHeight: 1.2 }}>股利發放頻率</label>
            <select
              value={payoutFrequency}
              onChange={(e) => handlePayoutFrequencyChange(e.target.value as PayoutFrequency)}
              style={{ ...inputStyle, paddingRight: 24, width: "100%", boxSizing: "border-box", height: stackEtfRow ? 40 : 28 }}
            >
              <option value="month">月領</option>
              <option value="quarter">季領</option>
              <option value="semiannual">半年領</option>
              <option value="year">年領</option>
            </select>
          </div>
          {showAnnualInEtfRow ? (
            <div style={{ flex: stackEtfRow ? "none" : "0 0 90px", display: "flex", flexDirection: "column", gap: 2, width: stackEtfRow ? "100%" : undefined }}>
              <label style={{ fontSize: 12, color: "#d1d5db", lineHeight: 1.2 }}>年化報酬率 (%)</label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={annualReturnRate === 0 ? "" : annualReturnRate}
                onChange={(e) => {
                  const v = e.target.value;
                  setAnnualReturnRate(v === "" ? 0 : Number(v) || 0);
                  setRateSource("annual");
                }}
                onFocus={(e) => e.target.select()}
                style={{
                  ...inputStyle,
                  opacity: rateSource === "dividend" && (dividendYieldPct !== "" || stockDividendPct !== "") ? 0.6 : 1,
                  color: rateSource === "dividend" && (dividendYieldPct !== "" || stockDividendPct !== "") ? "#9ca3af" : "#e5e7eb",
                  height: stackEtfRow ? 40 : 28,
                }}
              />
              <span style={{ fontSize: 10, color: "#6b7280" }}>7.2%≈10年翻倍</span>
            </div>
          ) : null}
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: stackEtfRow ? "column" : "row",
          gap: 12,
          alignItems: stackEtfRow ? "stretch" : "flex-end",
          flexWrap: "wrap",
          padding: mobileGrouped && stackEtfRow ? "4px 0 10px" : "10px 0",
          borderTop: mobileGrouped && stackEtfRow ? "none" : "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {showInlinePrincipalCard ? (
          <div style={{ flexShrink: 0, textAlign: "left", padding: "8px 16px", background: "rgba(0,0,0,0.25)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", alignSelf: "stretch", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>當前本金</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#e5e7eb", letterSpacing: "0.02em" }}>
              {Math.floor(currentPrincipalNum).toLocaleString("zh-TW")} 元
            </div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
              {selectedEtfInfo?.price != null && selectedEtfInfo.price > 0 ? `約 ${Math.floor(currentPrincipalNum / selectedEtfInfo.price).toLocaleString("zh-TW")} 股` : ""}
            </div>
          </div>
        ) : null}
        <div
          style={
            mobileGrouped && stackEtfRow
              ? { ...mobileGroupBox("#f59e0b"), marginBottom: 0 }
              : { display: "contents" }
          }
        >
          {mobileGrouped && stackEtfRow ? <p style={mobileSubTitle("#fde68a")}>③ 時間設定</p> : null}
          <div
            style={{
              display: m ? "grid" : "flex",
              gridTemplateColumns: m ? "minmax(0, 1fr) minmax(0, 1fr)" : undefined,
              flexDirection: m ? undefined : stackEtfRow ? "column" : "row",
              gap: m ? 10 : 12,
              alignItems: m ? "stretch" : stackEtfRow ? "stretch" : "flex-end",
              flexWrap: m ? undefined : "wrap",
              flex: "1 1 auto",
              minWidth: 0,
            }}
          >
          <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, gridColumn: m ? "1" : undefined }}>
            <label style={m ? labelMobile : { fontSize: 12, color: "#d1d5db", lineHeight: 1.2 }}>初始年月</label>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "stretch", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.4)" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={initialYearStr}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    if (v === "" || (v.length <= 4 && parseInt(v, 10) <= 2100)) setInitialYearStr(v);
                  }}
                  onBlur={() => {
                    const n = parseInt(initialYearStr, 10);
                    if (!Number.isFinite(n) || n < 2000) setInitialYearStr(String(defaultYear));
                    else if (n > 2100) setInitialYearStr("2100");
                  }}
                  style={{ ...inputStyle, width: 72, height: stepH, textAlign: "center", border: "none", borderRadius: 0 }}
                />
                <div style={{ display: "flex", flexDirection: "column", width: 22, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                  <button type="button" aria-label="年+1" onClick={() => setInitialYearStr(String(Math.min(2100, initialYear + 1)))} style={{ flex: 1, minHeight: m ? 17 : 14, padding: 0, border: "none", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}>▲</button>
                  <button type="button" aria-label="年-1" onClick={() => setInitialYearStr(String(Math.max(2000, initialYear - 1)))} style={{ flex: 1, minHeight: m ? 17 : 14, padding: 0, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}>▼</button>
                </div>
              </div>
              <span style={{ fontSize: 13, color: "#9ca3af" }}>年</span>
              <div style={{ display: "flex", alignItems: "stretch", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.4)" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={initialMonthStr}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    if (v === "" || v.length <= 2) setInitialMonthStr(v);
                  }}
                  onBlur={() => {
                    const n = parseInt(initialMonthStr, 10);
                    if (!Number.isFinite(n) || n < 1) setInitialMonthStr(String(defaultMonth));
                    else if (n > 12) setInitialMonthStr("12");
                  }}
                  style={{ ...inputStyle, width: 56, height: stepH, textAlign: "center", border: "none", borderRadius: 0 }}
                />
                <div style={{ display: "flex", flexDirection: "column", width: 22, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                  <button type="button" aria-label="月+1" onClick={() => setInitialMonthStr(String((initialMonth % 12) + 1))} style={{ flex: 1, minHeight: m ? 17 : 14, padding: 0, border: "none", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}>▲</button>
                  <button type="button" aria-label="月-1" onClick={() => setInitialMonthStr(String(((initialMonth + 10) % 12) + 1))} style={{ flex: 1, minHeight: m ? 17 : 14, padding: 0, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}>▼</button>
                </div>
              </div>
              <span style={{ fontSize: 13, color: "#9ca3af" }}>月</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, gridColumn: m ? "2" : undefined }}>
            <label style={m ? labelMobile : { fontSize: 12, color: "#d1d5db", lineHeight: 1.2 }}>第幾次投入</label>
            <div style={{ display: "flex", alignItems: "stretch", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.4)", maxWidth: m ? 120 : undefined }}>
              <input
                type="text"
                inputMode="numeric"
                value={nthPeriod}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  if (v === "") setNthPeriod(1);
                  else {
                    const n = parseInt(v, 10);
                    if (Number.isFinite(n)) setNthPeriod(Math.max(1, Math.min(maxNthPeriod, n)));
                  }
                }}
                onBlur={() => {
                  if (nthPeriod < 1 || nthPeriod > maxNthPeriod) setNthPeriod(Math.max(1, Math.min(maxNthPeriod, nthPeriod)));
                }}
                style={{ ...inputStyle, width: 56, height: stepH, textAlign: "center", border: "none", borderRadius: 0 }}
              />
              <div style={{ display: "flex", flexDirection: "column", width: 22, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                <button type="button" aria-label="次+1" onClick={() => setNthPeriod(Math.min(maxNthPeriod, nthPeriod + 1))} style={{ flex: 1, minHeight: m ? 17 : 14, padding: 0, border: "none", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}>▲</button>
                <button type="button" aria-label="次-1" onClick={() => setNthPeriod(Math.max(1, nthPeriod - 1))} style={{ flex: 1, minHeight: m ? 17 : 14, padding: 0, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}>▼</button>
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: m ? "row" : "column",
              justifyContent: m ? "space-between" : undefined,
              alignItems: m ? "center" : undefined,
              gap: m ? 8 : 2,
              gridColumn: m ? "1 / -1" : undefined,
              padding: m ? "10px 12px" : undefined,
              borderRadius: m ? 10 : undefined,
              background: m ? "rgba(245, 158, 11, 0.1)" : undefined,
              border: m ? "1px solid rgba(245, 158, 11, 0.28)" : undefined,
            }}
          >
            {!m ? <label style={{ fontSize: 12, color: "#d1d5db", lineHeight: 1.2 }}>對應年月</label> : null}
            <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: m ? undefined : 28, flex: m ? 1 : undefined, justifyContent: m ? "space-between" : undefined, width: m ? "100%" : undefined }}>
              {m ? (
                <span style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>對應年月</span>
              ) : null}
              <span style={{ fontSize: m ? 15 : 14, color: m ? "#fde68a" : "#e5e7eb", fontWeight: m ? 700 : 500 }}>
                {(() => {
                  const totalMonths = nthPeriod;
                  const targetMonth = ((((initialMonth - 1) + totalMonths) % 12) + 12) % 12 + 1;
                  const targetYear = initialYear + Math.floor(((initialMonth - 1) + totalMonths) / 12);
                  return `${targetYear} 年 ${targetMonth} 月`;
                })()}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: stackEtfRow ? 0 : 10, borderLeft: stackEtfRow ? "none" : "1px solid rgba(255,255,255,0.1)", minWidth: 0, gridColumn: m ? "1 / -1" : undefined }}>
            <label style={m ? labelMobile : { fontSize: 12, color: "#d1d5db", lineHeight: 1.2 }}>預設年月</label>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "stretch", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.4)" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={defaultYearStr}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    if (v === "" || (v.length <= 4 && parseInt(v, 10) <= 2100)) setDefaultYearStr(v);
                  }}
                  onBlur={() => {
                    const n = parseInt(defaultYearStr, 10);
                    if (!Number.isFinite(n) || n < 2000) setDefaultYearStr(String(todayYear));
                    else if (n > 2100) setDefaultYearStr("2100");
                  }}
                  style={{ ...inputStyle, width: 72, height: stepH, textAlign: "center", border: "none", borderRadius: 0 }}
                />
                <div style={{ display: "flex", flexDirection: "column", width: 22, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                  <button type="button" aria-label="年+1" onClick={() => setDefaultYearStr(String(Math.min(2100, defaultYear + 1)))} style={{ flex: 1, minHeight: m ? 17 : 14, padding: 0, border: "none", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}>▲</button>
                  <button type="button" aria-label="年-1" onClick={() => setDefaultYearStr(String(Math.max(2000, defaultYear - 1)))} style={{ flex: 1, minHeight: m ? 17 : 14, padding: 0, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}>▼</button>
                </div>
              </div>
              <span style={{ fontSize: 13, color: "#9ca3af" }}>年</span>
              <div style={{ display: "flex", alignItems: "stretch", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.4)" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={defaultMonthStr}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    if (v === "" || v.length <= 2) setDefaultMonthStr(v);
                  }}
                  onBlur={() => {
                    const n = parseInt(defaultMonthStr, 10);
                    if (!Number.isFinite(n) || n < 1) setDefaultMonthStr(String(todayMonth));
                    else if (n > 12) setDefaultMonthStr("12");
                  }}
                  style={{ ...inputStyle, width: 56, height: stepH, textAlign: "center", border: "none", borderRadius: 0 }}
                />
                <div style={{ display: "flex", flexDirection: "column", width: 22, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                  <button type="button" aria-label="月+1" onClick={() => setDefaultMonthStr(String(((defaultMonth % 12) + 1)))} style={{ flex: 1, minHeight: m ? 17 : 14, padding: 0, border: "none", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}>▲</button>
                  <button type="button" aria-label="月-1" onClick={() => setDefaultMonthStr(String(((defaultMonth + 10) % 12) + 1))} style={{ flex: 1, minHeight: m ? 17 : 14, padding: 0, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#e5e7eb", cursor: "pointer", fontSize: 10 }}>▼</button>
                </div>
              </div>
              <span style={{ fontSize: 13, color: "#9ca3af" }}>月</span>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  setInitialYearStr(String(d.getFullYear()));
                  setInitialMonthStr(String(d.getMonth() + 1));
                }}
                style={{
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 8,
                  border: "1px solid rgba(52, 211, 153, 0.45)",
                  background: "rgba(52, 211, 153, 0.12)",
                  color: "#6ee7b7",
                  cursor: "pointer",
                  marginLeft: 4,
                  alignSelf: "flex-end",
                }}
              >
                恢復
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>

      <div
        style={
          mobileGrouped && stackEtfRow
            ? { ...mobileGroupBox("#34d399"), marginTop: 4, marginBottom: 0 }
            : { display: "contents" }
        }
      >
        {mobileGrouped && stackEtfRow ? (
          <>
            <p style={mobileSubTitle("#a7f3d0")}>④ 試算與再投入</p>
            <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 10px 0", lineHeight: 1.45 }}>只影響模擬細節</p>
          </>
        ) : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {selectedEtfInfo && selectedEtf !== "none" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 10, borderRadius: 8, background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 13 }}>
            <div style={{ display: "grid", gridTemplateColumns: stackEtfRow ? "repeat(2, minmax(0, 1fr))" : "repeat(5, 1fr)", gap: 10, alignItems: "flex-start" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>股息</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#f5c451" }}>
                  {selectedEtfInfo?.dividendPerPeriod != null ? `${selectedEtfInfo.dividendPerPeriod.toFixed(2)}` : "—"} 元/股
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>股價</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#e5e7eb" }}>
                  {selectedEtfInfo?.price != null ? `${selectedEtfInfo.price.toLocaleString("zh-TW")}` : "—"} 元
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>{effectivePayoutLabel === "半年" ? "半年股利" : `本${effectivePayoutLabel}股利`}</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#39ff14" }}>
                  {isNthPeriodDividendMonth ? `${Math.round(nthPeriodEstimate.grossDividend).toLocaleString("zh-TW")} 元` : "0 元"}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>固定投入（含加班費）</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#e5e7eb" }}>
                  {selectedEtfInfo?.price != null && selectedEtfInfo.price > 0
                    ? `${Math.floor((monthlyContributionNum + monthlyExtraNum) / selectedEtfInfo.price).toLocaleString("zh-TW")} 股/月`
                    : "—"}
                </div>
                <span style={{ fontSize: 11, color: "#d1d5db", display: "block", marginTop: 4, lineHeight: 1.25, textAlign: "center", width: "100%", paddingLeft: 0, paddingRight: 0, boxSizing: "border-box" }}>（試算：本金＋{periodLabelForBalance}(固定+額外)×{periodMonthsForBalance}月÷股價＝約可買股數）</span>
              </div>
              <div style={{ textAlign: "center", gridColumn: stackEtfRow ? "1 / -1" : undefined }}>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>可再投入</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#39ff14" }}>
                  {isNthPeriodDividendMonth && sharesFromActualDividend
                    ? (sharesFromActualDividend.zhang > 0 ? `${sharesFromActualDividend.zhang} 張` + (sharesFromActualDividend.shares % 1000 > 0 ? `又 ${sharesFromActualDividend.shares % 1000} 股` : "") : `${sharesFromActualDividend.shares} 股`)
                    : "0 股"}
                </div>
                <span style={{ fontSize: 11, color: "#d1d5db", display: "block", marginTop: 2 }}>股利再投入</span>
              </div>
            </div>
            <div style={{ marginTop: 2, fontSize: 11, color: "#d1d5db", lineHeight: 1.4 }}>
              <span>股價與股利為示意值，可自行修正；真實數據請以券商為準。</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 13, color: "#d1d5db", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>股利再投入比例</span>
            <span style={{ color: "#39ff14", fontWeight: 600, fontSize: 14 }}>{reinvestRatio}%</span>
          </label>
          <input type="range" min={0} max={100} step={5} value={reinvestRatio} onChange={(e) => setReinvestRatio(Number(e.target.value) || 0)} style={{ width: "100%" }} />
          <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.5, padding: "4px 0" }}>
            {reinvestNoteIsMet ? (
              <>每次投入時扣除已達標稅金、二代健保與手續費，扣除後金額即為實際可再投入之資金。</>
            ) : (
              <>每次投入時未達扣稅門檻無須扣所得稅與二代健保，僅扣除買入手續費，扣除後金額即為實際可再投入之資金。</>
            )}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 13, color: "#d1d5db" }}>
              股息 (%)
              {(!rateSource || rateSource === "annual") && <span style={{ fontSize: 10, color: "#6b7280", marginLeft: 6 }}>（以年化報酬率為準）</span>}
            </label>
            <input
              type="number"
              min={0}
              step={0.1}
              value={dividendYieldPct === "" ? "" : dividendYieldPct}
              onChange={(e) => {
                const v = e.target.value;
                setDividendYieldPct(v === "" ? "" : (Number(v) || 0));
                setRateSource("dividend");
              }}
              onFocus={(e) => e.target.select()}
              style={{ ...inputStyle, opacity: (!rateSource || rateSource === "annual") ? 0.6 : 1, color: (!rateSource || rateSource === "annual") ? "#9ca3af" : "#e5e7eb" }}
              placeholder="例：4"
            />
            <div style={{ fontSize: 11, padding: "6px 8px", background: "rgba(57,255,20,0.12)", borderRadius: 6, border: "1px solid rgba(57,255,20,0.3)", color: "#b4f8c4", display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontWeight: 600 }}>【股息】一張（1000 股）本{effectivePayoutLabel}可領現金</span>
              {selectedEtfInfo?.price != null && selectedEtfInfo?.dividendPerPeriod != null ? (
                <>
                  <span>{(selectedEtfInfo.dividendPerPeriod * 1000).toLocaleString("zh-TW")} 元</span>
                  <span style={{ fontSize: 10, opacity: 0.9 }}>計算式：{selectedEtfInfo.dividendPerPeriod} 元/股 × 1000 股 ＝ {(selectedEtfInfo.dividendPerPeriod * 1000).toLocaleString("zh-TW")} 元</span>
                </>
              ) : (
                (() => {
                  const price = selectedEtfInfo?.price ?? 100;
                  const pct = (Number(dividendYieldPct) || 4) / 100;
                  const periodsPerYear = payoutFrequency === "month" ? 12 : payoutFrequency === "quarter" ? 4 : payoutFrequency === "semiannual" ? 2 : 1;
                  const perPeriod = (price * 1000 * pct) / periodsPerYear;
                  const pctDisplay = dividendYieldPct !== "" && dividendYieldPct !== null ? Number(dividendYieldPct) : 4;
                  return (
                    <>
                      <span>{Math.round(perPeriod).toLocaleString("zh-TW")} 元</span>
                      <span style={{ fontSize: 10, opacity: 0.9 }}>
                        計算式：股價 {price} 元 × 1000 股 × {pctDisplay}% ÷ {periodsPerYear} 期/年 ＝ {Math.round(perPeriod).toLocaleString("zh-TW")} 元
                        {pctDisplay === 4 && (dividendYieldPct === "" || dividendYieldPct === null) ? "（預設股息 4%）" : ""}
                      </span>
                    </>
                  );
                })()
              )}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 13, color: "#d1d5db" }}>
              股利 (%)
              {(!rateSource || rateSource === "annual") && <span style={{ fontSize: 10, color: "#6b7280", marginLeft: 6 }}>（以年化報酬率為準）</span>}
            </label>
            <input
              type="number"
              min={0}
              step={0.1}
              value={stockDividendPct === "" ? "" : stockDividendPct}
              onChange={(e) => {
                const v = e.target.value;
                setStockDividendPct(v === "" ? "" : (Number(v) || 0));
                setRateSource("dividend");
              }}
              onFocus={(e) => e.target.select()}
              style={{ ...inputStyle, opacity: (!rateSource || rateSource === "annual") ? 0.6 : 1, color: (!rateSource || rateSource === "annual") ? "#9ca3af" : "#e5e7eb" }}
              placeholder="例：3"
            />
            <div style={{ fontSize: 11, padding: "6px 8px", background: "rgba(245,196,81,0.12)", borderRadius: 6, border: "1px solid rgba(245,196,81,0.3)", color: "#f5c451", display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontWeight: 600 }}>【股利】一張（1000 股）本{effectivePayoutLabel}可領（現金等值）</span>
              {selectedEtfInfo?.price != null && selectedEtfInfo?.dividendPerPeriod != null ? (
                <>
                  <span>{(selectedEtfInfo.dividendPerPeriod * 1000).toLocaleString("zh-TW")} 元</span>
                  <span style={{ fontSize: 10, opacity: 0.9 }}>計算式：{selectedEtfInfo.dividendPerPeriod} 元/股 × 1000 股 ＝ {(selectedEtfInfo.dividendPerPeriod * 1000).toLocaleString("zh-TW")} 元（股利以現金等值估算）</span>
                </>
              ) : (
                (() => {
                  const price = selectedEtfInfo?.price ?? 100;
                  const pct = (Number(stockDividendPct) || 3) / 100;
                  const periodsPerYear = payoutFrequency === "month" ? 12 : payoutFrequency === "quarter" ? 4 : payoutFrequency === "semiannual" ? 2 : 1;
                  const perPeriod = (price * 1000 * pct) / periodsPerYear;
                  const pctDisplay = stockDividendPct !== "" && stockDividendPct !== null ? Number(stockDividendPct) : 3;
                  return (
                    <>
                      <span>{Math.round(perPeriod).toLocaleString("zh-TW")} 元</span>
                      <span style={{ fontSize: 10, opacity: 0.9 }}>
                        計算式：股價 {price} 元 × 1000 股 × {pctDisplay}% ÷ {periodsPerYear} 期/年 ＝ {Math.round(perPeriod).toLocaleString("zh-TW")} 元
                        {pctDisplay === 3 && (stockDividendPct === "" || stockDividendPct === null) ? "（預設股利 3%）" : ""}（股數依該檔公告）
                      </span>
                    </>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
