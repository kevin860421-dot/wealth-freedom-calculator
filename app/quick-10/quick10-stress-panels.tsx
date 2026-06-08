"use client";

import { formatTwd } from "./logic";
import {
  computeDayTradeStress,
  computeLeverageStress,
  computeMarginStress,
  computePledgeStress,
} from "./quick10-stress-calculations";
import {
  AlertBanner,
  MetricHero,
  Q10_DARK_CARD,
  Q10_SECTION_TITLE,
  StepperField,
  StressCard,
  StressSlider,
} from "./quick10-shared-ui";

export type MarginTabState = {
  buyPrice: number;
  buyPriceText: string;
  marginRatioPct: number;
  latestPrice: number;
  latestPriceText: string;
  lots: number;
  lotsText: string;
  extraDropPct: number;
};

export type PledgeTabState = {
  marketValue: number;
  marketValueText: string;
  loanAmount: number;
  loanAmountText: string;
  crashPct: number;
  pledgeLots: number;
};

export type LeverageTabState = {
  monthlyLoanPayment: number;
  monthlyLoanPaymentText: string;
  investmentTotal: number;
  investmentTotalText: string;
  emergencyReserve: number;
  emergencyReserveText: string;
  marketReturnPct: number;
};

export type DayTradeTabState = {
  buyTotal: number;
  buyTotalText: string;
  accountBalance: number;
  accountBalanceText: string;
};

type MarginHandlers = {
  setBuyPriceText: (v: string) => void;
  commitBuyPrice: () => void;
  bumpBuyPrice: (d: number) => void;
  setMarginRatioPct: (v: number) => void;
  setLatestPriceText: (v: string) => void;
  commitLatestPrice: () => void;
  bumpLatestPrice: (d: number) => void;
  setLotsText: (v: string) => void;
  commitLots: () => void;
  bumpLots: (d: number) => void;
  setExtraDropPct: (v: number) => void;
};

export function Quick10MarginPanel({ state, h }: { state: MarginTabState; h: MarginHandlers }) {
  const r = computeMarginStress({
    buyPrice: state.buyPrice,
    marginRatioPct: state.marginRatioPct,
    latestPrice: state.latestPrice,
    lots: state.lots,
    extraDropPct: state.extraDropPct,
  });

  return (
    <div className="space-y-2.5">
      <StressCard>
        <p className={Q10_SECTION_TITLE}>試算條件</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <StepperField
            label="買進股價"
            value={state.buyPrice}
            text={state.buyPriceText}
            onTextChange={h.setBuyPriceText}
            onCommit={h.commitBuyPrice}
            onBump={h.bumpBuyPrice}
            step={1}
          />
          <StepperField
            label="最新股價"
            value={state.latestPrice}
            text={state.latestPriceText}
            onTextChange={h.setLatestPriceText}
            onCommit={h.commitLatestPrice}
            onBump={h.bumpLatestPrice}
            step={1}
          />
          <StepperField
            label="持股張數"
            value={state.lots}
            text={state.lotsText}
            onTextChange={h.setLotsText}
            onCommit={h.commitLots}
            onBump={h.bumpLots}
            step={1}
            suffix="張"
          />
          <div className="space-y-1.5">
            <p className="text-[12px] font-semibold text-[#9CA3AF]">融資成數</p>
            <div className="flex gap-1.5">
              {[60, 50].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => h.setMarginRatioPct(pct)}
                  className={`flex-1 rounded-lg border px-2 py-2 text-[12px] font-black transition ${
                    state.marginRatioPct === pct
                      ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-300"
                      : "border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {pct === 60 ? "上市 60%" : "上櫃 50%"}
                </button>
              ))}
            </div>
            <p className="text-center text-[13px] font-black text-sky-300">{state.marginRatioPct}%</p>
          </div>
        </div>
        <div className="mt-3">
          <StressSlider
            label="模擬最新股價續跌"
            value={state.extraDropPct}
            min={-30}
            max={0}
            step={1}
            leftLabel="-30%（極限）"
            rightLabel="0%（不再跌）"
            onChange={h.setExtraDropPct}
            formatValue={(v) => `${v}%`}
          />
        </div>
      </StressCard>

      <StressCard alert={r.isMarginCall} warn={!r.isMarginCall && r.maintenancePct < 145}>
        <MetricHero
          label="當前融資維持率"
          value={`${r.maintenancePct.toFixed(1)}%`}
          tone={r.isMarginCall ? "red" : r.maintenancePct >= 166 ? "green" : "amber"}
          sub={`模擬股價 NT$ ${formatTwd(Math.round(r.simulatedPrice))}`}
        />
        {r.isMarginCall ? <div className="mt-2"><AlertBanner level="red">🔴 券商追繳令已發出！</AlertBanner></div> : null}
      </StressCard>

      <div className={`${Q10_DARK_CARD} grid gap-3 sm:grid-cols-2`}>
        <MetricHero
          label="斷頭臨界價（130%）"
          value={`NT$ ${formatTwd(Math.round(r.marginCallCriticalPrice))}`}
          tone="amber"
        />
        <MetricHero
          label="補回 166% 安全線現金"
          value={`NT$ ${formatTwd(Math.round(r.cashToSafe166))}`}
          tone={r.cashToSafe166 > 0 ? "red" : "green"}
        />
      </div>
    </div>
  );
}

type PledgeHandlers = {
  setMarketValueText: (v: string) => void;
  commitMarketValue: () => void;
  bumpMarketValue: (d: number) => void;
  setLoanAmountText: (v: string) => void;
  commitLoanAmount: () => void;
  bumpLoanAmount: (d: number) => void;
  setCrashPct: (v: number) => void;
};

export function Quick10PledgePanel({ state, h }: { state: PledgeTabState; h: PledgeHandlers }) {
  const r = computePledgeStress({
    marketValue: state.marketValue,
    loanAmount: state.loanAmount,
    crashPct: state.crashPct,
    pledgeLots: state.pledgeLots,
  });

  return (
    <div className="space-y-2.5">
      <StressCard>
        <p className={Q10_SECTION_TITLE}>試算條件</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <StepperField
            label="質押股票總市值"
            value={state.marketValue}
            text={state.marketValueText}
            onTextChange={h.setMarketValueText}
            onCommit={h.commitMarketValue}
            onBump={h.bumpMarketValue}
            step={50_000}
          />
          <StepperField
            label="借款總金額"
            value={state.loanAmount}
            text={state.loanAmountText}
            onTextChange={h.setLoanAmountText}
            onCommit={h.commitLoanAmount}
            onBump={h.bumpLoanAmount}
            step={50_000}
          />
        </div>
        <div className="mt-3">
          <StressSlider
            label="模擬股票崩盤跌幅"
            value={state.crashPct}
            min={-40}
            max={0}
            step={1}
            leftLabel="-40%（海嘯）"
            rightLabel="0%（不跌）"
            onChange={h.setCrashPct}
            formatValue={(v) => `${v}%`}
          />
        </div>
      </StressCard>

      <StressCard alert={r.isPledgeCall}>
        <MetricHero
          label="質押維持率"
          value={`${r.maintenancePct.toFixed(1)}%`}
          tone={r.isPledgeCall ? "red" : "green"}
          sub={`海嘯後市值 NT$ ${formatTwd(Math.round(r.crashedMarketValue))} · 門檻 130%`}
        />
        {r.isPledgeCall ? <div className="mt-2"><AlertBanner level="amber">⚠️ 質押面臨追繳！</AlertBanner></div> : null}
      </StressCard>

      <div className={`${Q10_DARK_CARD} space-y-3`}>
        <MetricHero label="方案 A（補現金）" value={`NT$ ${formatTwd(Math.round(r.cashPlanA))}`} tone="red" sub="補至 160% 維持率" />
        <MetricHero label="方案 B（補股票）" value={`${r.extraLotsPlanB} 張`} tone="amber" sub={`以海嘯後市值估算（約 ${state.pledgeLots} 張基準）`} />
      </div>
    </div>
  );
}

type LeverageHandlers = {
  setMonthlyLoanPaymentText: (v: string) => void;
  commitMonthlyLoanPayment: () => void;
  bumpMonthlyLoanPayment: (d: number) => void;
  setInvestmentTotalText: (v: string) => void;
  commitInvestmentTotal: () => void;
  bumpInvestmentTotal: (d: number) => void;
  setEmergencyReserveText: (v: string) => void;
  commitEmergencyReserve: () => void;
  bumpEmergencyReserve: (d: number) => void;
  setMarketReturnPct: (v: number) => void;
};

export function Quick10LeveragePanel({ state, h }: { state: LeverageTabState; h: LeverageHandlers }) {
  const r = computeLeverageStress({
    monthlyLoanPayment: state.monthlyLoanPayment,
    investmentTotal: state.investmentTotal,
    emergencyReserve: state.emergencyReserve,
    marketReturnPct: state.marketReturnPct,
  });
  const bleedMonths =
    r.defenseMonthsNetBleed != null ? r.defenseMonthsNetBleed.toFixed(1) : "∞";

  return (
    <div className="space-y-2.5">
      <StressCard>
        <p className={Q10_SECTION_TITLE}>試算條件</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <StepperField
            label="套利信貸每月還款"
            value={state.monthlyLoanPayment}
            text={state.monthlyLoanPaymentText}
            onTextChange={h.setMonthlyLoanPaymentText}
            onCommit={h.commitMonthlyLoanPayment}
            onBump={h.bumpMonthlyLoanPayment}
            step={1_000}
          />
          <StepperField
            label="股市投資總額"
            value={state.investmentTotal}
            text={state.investmentTotalText}
            onTextChange={h.setInvestmentTotalText}
            onCommit={h.commitInvestmentTotal}
            onBump={h.bumpInvestmentTotal}
            step={50_000}
          />
          <StepperField
            label="緊急預備金"
            value={state.emergencyReserve}
            text={state.emergencyReserveText}
            onTextChange={h.setEmergencyReserveText}
            onCommit={h.commitEmergencyReserve}
            onBump={h.bumpEmergencyReserve}
            step={10_000}
          />
        </div>
        <div className="mt-3">
          <StressSlider
            label="模擬市場報酬率"
            value={state.marketReturnPct}
            min={-20}
            max={7}
            step={0.5}
            leftLabel="-20%（崩盤）"
            rightLabel="+7%（樂觀）"
            onChange={h.setMarketReturnPct}
            formatValue={(v) => `${v.toFixed(1)}%`}
          />
        </div>
      </StressCard>

      <StressCard alert={r.monthlyNetBleed > 0}>
        <MetricHero
          label="雙向失血防禦期"
          value={`${r.defenseMonthsLoanOnly.toFixed(1)} 個月`}
          tone={r.defenseMonthsLoanOnly < 6 ? "red" : "amber"}
          sub="預備金 ÷ 信貸月付額"
        />
      </StressCard>

      <div className={`${Q10_DARK_CARD} grid gap-3`}>
        <MetricHero
          label="每月純倒貼銀行"
          value={`NT$ ${formatTwd(Math.round(Math.max(0, r.monthlyNetBleed)))}`}
          tone={r.monthlyNetBleed > 0 ? "red" : "green"}
          sub={`股市月收益 NT$ ${formatTwd(Math.round(r.monthlyStockIncome))}`}
        />
        <MetricHero
          label="預備金燒完月數（含失血）"
          value={`${bleedMonths} 個月`}
          tone={r.defenseMonthsNetBleed != null && r.defenseMonthsNetBleed < 6 ? "red" : "neutral"}
        />
        <MetricHero label="年化失血估算" value={`NT$ ${formatTwd(Math.round(r.annualLossEstimate))}`} tone="red" />
      </div>
    </div>
  );
}

type DayTradeHandlers = {
  setBuyTotalText: (v: string) => void;
  commitBuyTotal: () => void;
  bumpBuyTotal: (d: number) => void;
  setAccountBalanceText: (v: string) => void;
  commitAccountBalance: () => void;
  bumpAccountBalance: (d: number) => void;
};

export function Quick10DayTradePanel({ state, h }: { state: DayTradeTabState; h: DayTradeHandlers }) {
  const r = computeDayTradeStress({
    buyTotal: state.buyTotal,
    accountBalance: state.accountBalance,
  });

  return (
    <div className="space-y-2.5">
      <StressCard>
        <p className={Q10_SECTION_TITLE}>試算條件</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <StepperField
            label="當沖未平倉／買進總額"
            value={state.buyTotal}
            text={state.buyTotalText}
            onTextChange={h.setBuyTotalText}
            onCommit={h.commitBuyTotal}
            onBump={h.bumpBuyTotal}
            step={10_000}
          />
          <StepperField
            label="交割戶餘額"
            value={state.accountBalance}
            text={state.accountBalanceText}
            onTextChange={h.setAccountBalanceText}
            onCommit={h.commitAccountBalance}
            onBump={h.bumpAccountBalance}
            step={10_000}
          />
        </div>
      </StressCard>

      <StressCard alert={r.isUnderfunded}>
        <MetricHero
          label="交割款現金黑洞"
          value={`NT$ ${formatTwd(Math.round(r.fundingGap))}`}
          tone={r.isUnderfunded ? "red" : "green"}
        />
        {r.isUnderfunded ? (
          <div className="mt-2">
            <AlertBanner level="red">
              🚨 警告：距離 T+2 早上 10:00 扣款資金不足！面臨違約交割、信用破產與刑事責任風險！
            </AlertBanner>
          </div>
        ) : (
          <div className="mt-2">
            <AlertBanner level="green">✅ 交割戶餘額足夠，暫無違約風險。</AlertBanner>
          </div>
        )}
      </StressCard>
    </div>
  );
}
