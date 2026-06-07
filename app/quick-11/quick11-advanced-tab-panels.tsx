"use client";

import { useCallback, useMemo, useState } from "react";
import { QuickDualLineChart } from "@/app/components/quick-dual-line-chart";
import {
  buildBankNegotiationReportText,
  buildPrincipalInterestOverlapSeries,
  computeEmergencyFundMonths,
  computeInflationAdjustedPaymentPV,
  computeOpportunityCostFv,
  RATE_HIKE_PRESETS,
  type RateHikePreset,
} from "./quick11-advanced-calculations";
import { formatMoney, type PaymentRow } from "./logic";
import { getQ11Theme, type Q11Theme } from "./quick11-white-theme";

function MoneyInlineInput(props: {
  theme: Q11Theme;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  ariaLabel: string;
}) {
  const { theme, value, onChange, onBlur, ariaLabel } = props;
  return (
    <span className={`inline-flex min-w-[5rem] items-baseline gap-0.5 border-b-2 ${theme.inlineBorder} px-1 pb-0.5 align-middle`}>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.currentTarget.value.replace(/[^\d]/g, ""))}
        onBlur={onBlur}
        className={`w-[4rem] min-w-0 border-0 bg-transparent p-0 text-center text-[17px] font-black tabular-nums outline-none ${theme.input}`}
      />
      <span className={theme.inputSuffix}>NT$</span>
    </span>
  );
}

function PctInlineInput(props: {
  theme: Q11Theme;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  ariaLabel: string;
}) {
  const { theme, value, onChange, onBlur, ariaLabel } = props;
  return (
    <span className={`inline-flex min-w-[3.5rem] items-baseline gap-0.5 border-b-2 ${theme.inlineBorder} px-1 pb-0.5 align-middle`}>
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.currentTarget.value.replace(/[^\d.]/g, ""))}
        onBlur={onBlur}
        className={`w-[2.5rem] min-w-0 border-0 bg-transparent p-0 text-center text-[17px] font-black tabular-nums outline-none ${theme.input}`}
      />
      <span className={theme.inputSuffix}>%</span>
    </span>
  );
}

function InfoTile(props: {
  theme: Q11Theme;
  title: string;
  value: string;
  tone?: string;
  hint?: string;
}) {
  const { theme, title, value, tone, hint } = props;
  const tileTone = tone ?? theme.infoTone;
  return (
    <div className={`min-w-0 rounded-lg border p-2.5 ${tileTone}`}>
      <p className={`text-[13px] font-bold ${theme.muted}`}>{title}</p>
      <p className={`mt-1 font-mono text-[clamp(15px,4vw,20px)] font-black leading-none ${theme.bodyStrong}`}>{value}</p>
      {hint ? <p className={`mt-1 text-[11px] leading-snug ${theme.muted}`}>{hint}</p> : null}
    </div>
  );
}

export type Quick11AdvancedTabPanelsProps = {
  page: 9 | 10 | 11 | 12 | 13;
  isLight?: boolean;
  rows: PaymentRow[];
  loanAmount: number;
  loanYears: number;
  annualRate: number;
  monthlyIncome: number;
  methodLabel: string;
  monthlyPayment: number;
  dtiPct: number;
  totalInterest: number;
  totalRepayment: number;
  equalPrincipalInterest: number;
  prepaySavedInterest: number;
  rateShockPct: number;
  shockedMonthlyPayment: number;
  shockedDtiPct: number;
  inflationPct: number;
  inflationText: string;
  onInflationText: (v: string) => void;
  onInflationCommit: () => void;
  opportunityReturnPct: number;
  opportunityText: string;
  onOpportunityText: (v: string) => void;
  onOpportunityCommit: () => void;
  emergencySavings: number;
  emergencyText: string;
  onEmergencyText: (v: string) => void;
  onEmergencyCommit: () => void;
  rateHikePreset: RateHikePreset;
  onRateHikePreset: (p: RateHikePreset) => void;
  hikeMonthlyPayment: number;
  hikeDtiPct: number;
  hikeTotalInterest: number;
  hikeInterestIncrease: number;
  onOpenExcelWizard: () => void;
};

export function Quick11AdvancedTabPanels(props: Quick11AdvancedTabPanelsProps) {
  const {
    page,
    isLight = true,
    rows,
    loanAmount,
    loanYears,
    annualRate,
    monthlyIncome,
    methodLabel,
    monthlyPayment,
    dtiPct,
    totalInterest,
    totalRepayment,
    equalPrincipalInterest,
    prepaySavedInterest,
    rateShockPct,
    shockedMonthlyPayment,
    shockedDtiPct,
    inflationPct,
    inflationText,
    onInflationText,
    onInflationCommit,
    opportunityReturnPct,
    opportunityText,
    onOpportunityText,
    onOpportunityCommit,
    emergencySavings,
    emergencyText,
    onEmergencyText,
    onEmergencyCommit,
    rateHikePreset,
    onRateHikePreset,
    hikeMonthlyPayment,
    hikeDtiPct,
    hikeTotalInterest,
    hikeInterestIncrease,
    onOpenExcelWizard,
  } = props;

  const theme = getQ11Theme(isLight);
  const descMuted = isLight ? "text-slate-600" : "text-slate-300";
  const descStrong = isLight ? "text-slate-800" : "text-slate-100";
  const emeraldStrong = isLight ? "text-emerald-800" : "text-emerald-300";
  const skyStrong = isLight ? "text-sky-800" : "text-sky-200";
  const hikeBadTone = isLight ? "text-red-950 border-red-200 bg-red-50" : "text-red-100 border-red-500/40 bg-red-500/10";
  const hikeWarnBox = isLight
    ? "rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] font-bold text-red-800"
    : "rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-[13px] font-bold text-red-100";

  const [copyFlash, setCopyFlash] = useState(false);

  const overlap = useMemo(() => buildPrincipalInterestOverlapSeries(rows), [rows]);
  const inflationMetrics = useMemo(
    () => computeInflationAdjustedPaymentPV(rows, inflationPct),
    [rows, inflationPct],
  );
  const opportunityFv = useMemo(
    () => computeOpportunityCostFv(monthlyPayment, rows.length, opportunityReturnPct),
    [monthlyPayment, rows.length, opportunityReturnPct],
  );
  const emergencyMonths = useMemo(
    () => computeEmergencyFundMonths(emergencySavings, monthlyPayment),
    [emergencySavings, monthlyPayment],
  );
  const emergencyLow = Number.isFinite(emergencyMonths) && emergencyMonths < 6;

  const reportText = useMemo(
    () =>
      buildBankNegotiationReportText({
        loanAmount,
        annualRate,
        loanYears,
        monthlyIncome,
        methodLabel,
        monthlyPayment,
        dtiPct,
        totalInterest,
        totalRepayment,
        equalPrincipalInterest,
        interestSavedVsAnnuity: Math.max(0, totalInterest - equalPrincipalInterest),
        rateShockPct,
        shockedMonthlyPayment,
        shockedDtiPct,
        prepaySavedInterest,
        inflationPct,
        realPaymentPv: inflationMetrics.realPresentValue,
      }),
    [
      loanAmount,
      annualRate,
      loanYears,
      monthlyIncome,
      methodLabel,
      monthlyPayment,
      dtiPct,
      totalInterest,
      totalRepayment,
      equalPrincipalInterest,
      rateShockPct,
      shockedMonthlyPayment,
      shockedDtiPct,
      prepaySavedInterest,
      inflationPct,
      inflationMetrics.realPresentValue,
    ],
  );

  const copyReport = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopyFlash(true);
      window.setTimeout(() => setCopyFlash(false), 1800);
    } catch {
      /* ignore */
    }
  }, [reportText]);

  if (page === 9) {
    return (
      <div className="space-y-2">
        <p className={theme.pageTitle}>30 年交疊圖（本金 vs 利息）</p>
        <p className={`text-[13px] leading-relaxed ${descMuted}`}>
          藍線是<strong className={descStrong}>剩餘本金</strong>，紅線是<strong className={descStrong}>累積送給銀行的利息</strong>
          。兩線交叉後，你付的利息已超過當下本金。
        </p>
        {overlap.years.length ? (
          <div className={theme.glow}>
            <QuickDualLineChart
              variant={theme.chartVariant}
              title={`${methodLabel} · 本金與利息消長`}
              years={overlap.years}
              seriesA={overlap.cumInterestSeries}
              seriesB={overlap.balanceSeries}
              legendA="累積利息"
              legendB="剩餘本金"
              colorA="rgba(220, 38, 38, 0.88)"
              colorB="rgba(37, 99, 235, 0.88)"
              referenceLineY={loanAmount}
              yGamma={0.72}
              pointLabelMode="smart"
              showPointValues
              showPointValuesScope="last"
              redLabelBelowYearThreshold={99}
              legendFooter={
                overlap.crossoverYear != null ? (
                  <span>
                    📍 約第 <strong>{overlap.crossoverYear}</strong> 年：累積利息追上剩餘本金（示意，依目前方案）。
                  </span>
                ) : (
                  <span>此方案在貸款期內未出現利息追上本金交叉點（或年期較短）。</span>
                )
              }
            />
          </div>
        ) : (
          <div className={`${theme.card} text-sm ${descMuted}`}>請先在首頁輸入貸款條件。</div>
        )}
      </div>
    );
  }

  if (page === 10) {
    return (
      <div className="space-y-2">
        <p className={theme.pageTitle}>通膨縮水 × 機會成本</p>
        <div className={theme.card}>
          <p className={`text-[14px] font-bold ${theme.bodyStrong}`}>
            年通膨假設{" "}
            <PctInlineInput
              theme={theme}
              value={inflationText}
              onChange={onInflationText}
              onBlur={onInflationCommit}
              ariaLabel="年通膨率"
            />
          </p>
          <p className={`mt-2 text-[13px] leading-relaxed ${descMuted}`}>
            名義總還款 NT$ {formatMoney(inflationMetrics.nominalTotal)}，以逐月折現（PV = Σ 月付／(1+i)^t）約等於今日購買力{" "}
            <strong className={skyStrong}>NT$ {formatMoney(inflationMetrics.realPresentValue)}</strong>。
          </p>
        </div>
        <div className={theme.card}>
          <p className={`text-[14px] font-bold ${theme.bodyStrong}`}>
            若月付改投入年化{" "}
            <PctInlineInput
              theme={theme}
              value={opportunityText}
              onChange={onOpportunityText}
              onBlur={onOpportunityCommit}
              ariaLabel="機會成本年化報酬"
            />{" "}
            （不含稅費）
          </p>
          <p className={`mt-2 text-[13px] leading-relaxed ${descMuted}`}>
            每月 NT$ {formatMoney(monthlyPayment)} × {loanYears} 年，期末年金 FV 約{" "}
            <strong className={emeraldStrong}>NT$ {formatMoney(opportunityFv)}</strong>（若全數投入、不提前還款之示意）。
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <InfoTile theme={theme} title="名義總還款" value={`NT$ ${formatMoney(inflationMetrics.nominalTotal)}`} />
          <InfoTile
            theme={theme}
            title="通膨折現後"
            value={`NT$ ${formatMoney(inflationMetrics.realPresentValue)}`}
            tone={theme.infoAccent}
            hint={`通膨 ${inflationPct.toFixed(1)}%`}
          />
        </div>
        <p className={theme.muted}>* 通膨折現為固定月付之標準 PV；未含稅務與投資風險，個案以實際合約為準。</p>
      </div>
    );
  }

  if (page === 11) {
    const monthsLabel = Number.isFinite(emergencyMonths)
      ? emergencyMonths >= 120
        ? "10 年+"
        : `${emergencyMonths.toFixed(1)} 個月`
      : "—";
    const emergencyTone = emergencyLow
      ? theme.emergencyBad
      : emergencyMonths < 12
        ? theme.emergencyWarn
        : theme.emergencyOk;

    return (
      <div className="space-y-2">
        <p className={theme.pageTitle}>財務安全氣囊</p>
        <div className={theme.card}>
          <p className={`text-[14px] font-bold leading-relaxed ${theme.bodyStrong}`}>
            目前可動用存款（不含自備款）{" "}
            <MoneyInlineInput
              theme={theme}
              value={emergencyText}
              onChange={onEmergencyText}
              onBlur={onEmergencyCommit}
              ariaLabel="緊急預備金"
            />
          </p>
          <p className={`mt-2 text-[13px] ${descMuted}`}>
            以首月月付 NT$ {formatMoney(monthlyPayment)} 估算，可支撐約 <strong className={theme.bodyStrong}>{monthsLabel}</strong>
            （僅房貸，不含生活費）。
          </p>
        </div>
        <div className={`rounded-xl border p-3 ${emergencyTone}`}>
          {emergencyLow ? (
            <>
              <p className="text-[15px] font-black">🔴 宇航艙失壓警告</p>
              <p className="mt-1 text-[13px] font-semibold leading-relaxed">
                預備金不足 6 個月房貸。若收入中斷，現金流可能迅速吃緊。
              </p>
            </>
          ) : emergencyMonths < 12 ? (
            <>
              <p className="text-[15px] font-black">⚠️ 緩衝偏薄</p>
              <p className="mt-1 text-[13px] font-semibold">建議至少保留 6～12 個月月付當安全氣囊。</p>
            </>
          ) : (
            <>
              <p className="text-[15px] font-black">✅ 安全氣囊尚可</p>
              <p className="mt-1 text-[13px] font-semibold">仍請一併估算生活費與其他負債，勿只看房貸月付。</p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (page === 12) {
    return (
      <div className="space-y-2">
        <p className={theme.pageTitle}>銀行談判健檢報告</p>
        <div className={theme.glow}>
          <p className={`text-[13px] font-semibold ${descMuted}`}>打包本次試算重點，帶去跟銀行談利率、年限或還款方式。</p>
          <ul className={`mt-2 space-y-1.5 text-[13px] ${theme.body}`}>
            <li>
              · DTI <strong>{dtiPct.toFixed(1)}%</strong> · 首月月付 <strong>NT$ {formatMoney(monthlyPayment)}</strong>
            </li>
            <li>
              · 總利息 <strong>NT$ {formatMoney(totalInterest)}</strong> · 改本金平均約少{" "}
              <strong>NT$ {formatMoney(Math.max(0, totalInterest - equalPrincipalInterest))}</strong>
            </li>
            <li>
              · 升息 +{rateShockPct.toFixed(2)}% 示意 → 月付 NT$ {formatMoney(shockedMonthlyPayment)} · DTI {shockedDtiPct.toFixed(1)}%
            </li>
          </ul>
        </div>
        <button type="button" onClick={copyReport} className={theme.btnSecondary}>
          {copyFlash ? "✅ 已複製談判摘要" : "📋 複製談判摘要（貼到 Email／LINE）"}
        </button>
        <button type="button" onClick={onOpenExcelWizard} className={theme.btnPrimary}>
          📥 下載我的財務宇航報告（Excel 四步驟）
        </button>
        <p className={theme.muted}>Excel 含 DTI、本息試算與可改公式；須完成分享解鎖步驟。PDF 可自 Excel 另存。</p>
      </div>
    );
  }

  const hikePreset = RATE_HIKE_PRESETS.find((p) => p.id === rateHikePreset)!;

  return (
    <div className="space-y-2">
      <p className={theme.pageTitle}>央行升息連鎖反應</p>
      <p className={`text-[13px] ${descMuted}`}>一鍵切換利率情境，即時看月付與 DTI 是否「爆炸」。</p>
      <div className="flex flex-wrap gap-1.5">
        {RATE_HIKE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onRateHikePreset(preset.id)}
            className={`rounded-lg border px-2.5 py-2 text-[12px] font-bold transition ${
              rateHikePreset === preset.id ? theme.chipActive : theme.chipInactive
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <InfoTile
          theme={theme}
          title="新月付（首月）"
          value={`NT$ ${formatMoney(hikeMonthlyPayment)}`}
          tone={hikeDtiPct > 50 ? hikeBadTone : theme.infoAccent}
        />
        <InfoTile
          theme={theme}
          title="新 DTI"
          value={`${hikeDtiPct.toFixed(1)}%`}
          tone={hikeDtiPct > 50 ? hikeBadTone : theme.infoTone}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <InfoTile theme={theme} title="總利息增加" value={`+ NT$ ${formatMoney(hikeInterestIncrease)}`} tone={theme.warnAmber} />
        <InfoTile theme={theme} title="升息後總利息" value={`NT$ ${formatMoney(hikeTotalInterest)}`} />
      </div>
      {hikeDtiPct > 50 ? <div className={hikeWarnBox}>⚠️ DTI 破 50%：月付壓力顯著上升，宜評估延長年限、增自備款或轉貸談判。</div> : null}
      <p className={theme.muted}>
        現況利率 {annualRate.toFixed(2)}% → 情境 {(annualRate + hikePreset.addPct).toFixed(2)}%（本息均攤示意）。
      </p>
    </div>
  );
}
