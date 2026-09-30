"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QuickStepperSliderField } from "@/app/components/quick-stepper-slider";
import { INVEST_ANNUAL_PCT } from "@/app/quick-3/logic";
import {
  MONEY_MAX,
  MONEY_MIN,
  YEARS_MAX,
  YEARS_MIN,
  commitMoneyFromRaw,
  commitYearsFromRaw,
} from "@/app/quick-4/logic";
import { TICKER_PRESETS } from "@/app/ticker-presets";
import { AFTER_TAX_RANK_2026_08, AFTER_TAX_RANK_2026_08_ETF } from "./posts/after-tax-rank-2026-08";
import {
  AFTER_TAX_DEFAULT_MONTHLY_NET,
  AFTER_TAX_RANK_NHI_THRESHOLD,
  capitalColumnLabel,
  deriveAfterTaxRank,
  formatRankMoney,
  withMonthlyTarget,
} from "@/lib/blog/after-tax-rank";
import {
  AFTER_TAX_RANK_TOTAL_TOP_N,
  afterTaxTtmBasisTabAriaLabel,
} from "@/lib/blog/after-tax-rank-series";
import {
  RankReportResponsiveTable,
  type CanvasRankBasis,
  type CanvasRankRow,
} from "./after-tax-rank-canvas-table";
import {
  clampNum,
  futureValueMonthlyContribution,
  monthsToReachTarget,
  requiredMonthlyToReachTarget,
} from "@/lib/quick-calculator-math";

type Basis = CanvasRankBasis;

const SECTION_TABS = [
  { id: "total-rank", label: "總排行" },
  { id: "etf-focus-pk", label: "ETF 排行" },
  { id: "stock-rent", label: "個股排行" },
  { id: "ex-div-preview", label: "搶先除息｜最後買進日" },
] as const;

type SectionId = (typeof SECTION_TABS)[number]["id"];

const SECTION_OPEN: Record<SectionId, boolean> = {
  "total-rank": true,
  "etf-focus-pk": false,
  "stock-rent": false,
  "ex-div-preview": false,
};

const SECTION_RELEASE: Record<SectionId, string> = {
  "total-rank": "2026/8/1 09:30",
  "etf-focus-pk": "2026/8/8 09:30",
  "stock-rent": "2026/8/15 09:30",
  "ex-div-preview": "2026/8/22 09:30",
};

function evaluateMonthly(raw: string): number | null {
  const src = raw
    .trim()
    .replace(/[,，]/g, "")
    .replace(/\s+/g, "")
    .replace(/^=/, "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/＋/g, "+")
    .replace(/－/g, "-");
  if (!src || !/^[0-9+\-*/().]+$/.test(src)) return null;
  let i = 0;
  const peek = () => src[i] ?? "";
  const eat = () => src[i++] ?? "";
  function parseExpression(): number {
    let value = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const op = eat();
      const right = parseTerm();
      value = op === "+" ? value + right : value - right;
    }
    return value;
  }
  function parseTerm(): number {
    let value = parseFactor();
    while (peek() === "*" || peek() === "/") {
      const op = eat();
      const right = parseFactor();
      if (op === "/" && right === 0) throw new Error("div0");
      value = op === "*" ? value * right : value / right;
    }
    return value;
  }
  function parseFactor(): number {
    if (peek() === "+") {
      eat();
      return parseFactor();
    }
    if (peek() === "-") {
      eat();
      return -parseFactor();
    }
    if (peek() === "(") {
      eat();
      const value = parseExpression();
      if (eat() !== ")") throw new Error("paren");
      return value;
    }
    const start = i;
    if (!/\d/.test(peek())) throw new Error("num");
    while (/\d/.test(peek())) eat();
    if (peek() === ".") {
      eat();
      while (/\d/.test(peek())) eat();
    }
    return Number(src.slice(start, i));
  }
  try {
    const value = parseExpression();
    if (i !== src.length || !Number.isFinite(value)) return null;
    return value;
  } catch {
    return null;
  }
}

function toCanvasRow(row: ReturnType<typeof deriveAfterTaxRank>[number]): CanvasRankRow {
  return {
    ticker: row.ticker,
    name: row.name,
    price: row.price,
    lastCashPerUnit: row.lastCashPerUnit,
    stockDivPerUnit: row.stockDivPerUnit,
    ttmCashPerUnit: row.ttmCashPerUnit,
    freq: row.freq,
    lots: row.lots,
    capital: row.capital,
    grossDividend: row.grossDividend,
    wireFee: row.wireFee,
    nhi: row.nhi,
    fee: row.fee,
    net: row.net,
    rank: row.rank,
    prevRank: 0,
    delta: 0,
    lastBuy: row.lastBuy,
    exDate: row.exDate,
    payDate: row.payDate,
  };
}

function monthlyPhrase(monthlyNet: number): string {
  return capitalColumnLabel(monthlyNet).replace(/^月領/, "").replace(/本金$/, "");
}

function MonthlyTargetField({
  monthlyText,
  onMonthlyText,
  commitMonthlyText,
}: {
  monthlyText: string;
  onMonthlyText: (value: string) => void;
  commitMonthlyText: (raw: string) => void;
}) {
  return (
    <label className="rank-monthly-target">
      <span>月領</span>
      <input
        className="rank-monthly-target-input"
        value={monthlyText ?? ""}
        onChange={(event) => onMonthlyText(event.currentTarget.value)}
        onBlur={(event) => commitMonthlyText(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          commitMonthlyText(event.currentTarget.value);
        }}
        inputMode="text"
        spellCheck={false}
        aria-label="月領目標，單位元，可輸入四則運算"
      />
      <span>本金</span>
    </label>
  );
}

function RankInvestPanel({
  ticker,
  capital,
  monthlyTarget,
  monthlyText,
  onMonthlyText,
  commitMonthlyText,
}: {
  ticker: string;
  capital: number;
  monthlyTarget: number;
  monthlyText: string;
  onMonthlyText: (value: string) => void;
  commitMonthlyText: (raw: string) => void;
}) {
  const annualPct = TICKER_PRESETS.find((preset) => preset.id === ticker)?.annualReturn ?? INVEST_ANNUAL_PCT;
  const linkDriver = useRef<"target" | "invest" | "years">("target");
  const [monthlyInvest, setMonthlyInvest] = useState(5_000);
  const [monthlyInvestText, setMonthlyInvestText] = useState("5,000");
  const [years, setYears] = useState(10);
  const [yearsText, setYearsText] = useState("10");
  const piled = useMemo(
    () => Math.round(futureValueMonthlyContribution(monthlyInvest, annualPct, years)),
    [annualPct, monthlyInvest, years],
  );

  const monthlyFor = (nextCapital: number, nextYears: number) => {
    const months = Math.max(1, Math.round(nextYears * 12));
    const raw = requiredMonthlyToReachTarget(nextCapital, annualPct, months);
    return Math.round(clampNum(raw, MONEY_MIN, MONEY_MAX) / 100) * 100;
  };

  const yearsFor = (monthly: number, nextCapital: number) => {
    if (monthly <= 0 || nextCapital <= 0) return YEARS_MIN;
    const months = monthsToReachTarget(nextCapital, monthly, annualPct, YEARS_MAX * 12);
    if (months == null) return YEARS_MAX;
    return Math.round(clampNum(Math.ceil(months / 12), YEARS_MIN, YEARS_MAX));
  };

  useEffect(() => {
    if (linkDriver.current === "invest") return;
    const next = monthlyFor(capital, years);
    setMonthlyInvest(next);
    setMonthlyInvestText(formatRankMoney(next));
  }, [annualPct, capital, years]);

  const followYears = (monthly: number) => {
    const next = yearsFor(monthly, capital);
    setYears(next);
    setYearsText(String(next));
  };

  const onMonthlyInvestText = (raw: string) => {
    setMonthlyInvestText(raw);
    const plain = raw.replace(/[,，\s]/g, "");
    if (!/^\d+$/.test(plain)) return;
    setMonthlyInvest(Math.round(clampNum(Number(plain), MONEY_MIN, MONEY_MAX)));
  };

  const commitMonthlyInvest = (raw?: string) => {
    linkDriver.current = "invest";
    const next = commitMoneyFromRaw(raw ?? monthlyInvestText, monthlyInvest);
    setMonthlyInvest(next);
    setMonthlyInvestText(formatRankMoney(next));
    followYears(next);
  };

  const bumpMonthlyInvest = (delta: number) => {
    linkDriver.current = "invest";
    const next = Math.round(clampNum(monthlyInvest + delta, MONEY_MIN, MONEY_MAX) / 100) * 100;
    setMonthlyInvest(next);
    setMonthlyInvestText(formatRankMoney(next));
    followYears(next);
  };

  const applyYears = (next: number) => {
    linkDriver.current = "years";
    const y = Math.round(clampNum(next, YEARS_MIN, YEARS_MAX));
    setYears(y);
    setYearsText(String(y));
  };

  const onYearsText = (raw: string) => {
    setYearsText(raw);
    const plain = raw.replace(/[,，\s]/g, "");
    if (!/^\d+$/.test(plain)) return;
    applyYears(Number(plain));
  };

  const commitYears = (raw?: string) => {
    applyYears(commitYearsFromRaw(raw ?? yearsText, years));
  };

  const bumpYears = (delta: number) => {
    applyYears(years + delta);
  };

  const markTarget = () => {
    linkDriver.current = "target";
  };

  return (
    <div className="quick4-blog-paper rank-invest-card">
      <label className="rank-invest-code">
        <span>ETF 代碼</span>
        <input readOnly value={ticker ?? ""} onChange={() => {}} aria-label="ETF 代碼" />
      </label>
      <QuickStepperSliderField
        label={
          <span style={{ display: "flex", width: "100%", justifyContent: "space-between" }}>
            <span>月領</span>
            <span>本金</span>
          </span>
        }
        labelStyle={{ fontSize: 15, fontWeight: 800 }}
        text={monthlyText}
        value={clampNum(monthlyTarget, 1000, 500_000)}
        min={1000}
        max={500_000}
        step={100}
        bumpStep={1000}
        ariaLabel="月領目標，單位元，可輸入四則運算"
        increaseRight
        onTextChange={(value) => {
          markTarget();
          onMonthlyText(value);
        }}
        onCommit={(raw) => {
          markTarget();
          commitMonthlyText(raw ?? monthlyText);
        }}
        onBump={(delta) => {
          markTarget();
          const next = Math.round(clampNum(monthlyTarget + delta, 1000, 500_000));
          commitMonthlyText(String(next));
        }}
        onChange={(value) => {
          markTarget();
          const next = Math.round(clampNum(value, 1000, 500_000));
          commitMonthlyText(String(next));
        }}
      />
      <div className="rank-invest-fields">
        <QuickStepperSliderField
          label="每月投入"
          text={monthlyInvestText}
          value={clampNum(monthlyInvest, MONEY_MIN, MONEY_MAX)}
          min={MONEY_MIN}
          max={MONEY_MAX}
          step={100}
          bumpStep={1000}
          ariaLabel="每月投入"
          increaseRight
          onTextChange={onMonthlyInvestText}
          onCommit={commitMonthlyInvest}
          onBump={bumpMonthlyInvest}
          onChange={(value) => {
            linkDriver.current = "invest";
            const next = Math.round(clampNum(value, MONEY_MIN, MONEY_MAX) / 100) * 100;
            setMonthlyInvest(next);
            setMonthlyInvestText(formatRankMoney(next));
            followYears(next);
          }}
        />
        <QuickStepperSliderField
          label="預計幾年"
          text={yearsText}
          value={clampNum(years, YEARS_MIN, YEARS_MAX)}
          min={YEARS_MIN}
          max={YEARS_MAX}
          step={1}
          bumpStep={1}
          ariaLabel="預計幾年"
          increaseRight
          onTextChange={onYearsText}
          onCommit={commitYears}
          onBump={bumpYears}
          onChange={(value) => {
            applyYears(value);
          }}
        />
      </div>
      <p className="rank-invest-note">
        若每月投入 {formatRankMoney(monthlyInvest)} 元、存 {years} 年，約累積 {formatRankMoney(piled)} 元。月領所需本金是 {formatRankMoney(capital)} 元。
      </p>
    </div>
  );
}

function BasisAndMonthlyRow({
  basis,
  setBasis,
  lastLabel,
  ttmLabel,
  monthlyText,
  onMonthlyText,
  commitMonthlyText,
}: {
  basis: Basis;
  setBasis: (basis: Basis) => void;
  lastLabel: string;
  ttmLabel: string;
  monthlyText: string;
  onMonthlyText: (value: string) => void;
  commitMonthlyText: (raw: string) => void;
}) {
  return (
    <div className="second-row-wrapper">
      <div className="data-mode-toggle" role="tablist" aria-label="排行基準">
        <button
          type="button"
          role="tab"
          className="mode-item"
          aria-selected={basis === "last"}
          aria-label={lastLabel}
          data-active={basis === "last" ? "true" : "false"}
          onClick={() => setBasis("last")}
        >
          {lastLabel}
        </button>
        <span className="data-mode-sep" aria-hidden="true">
          |
        </span>
        <button
          type="button"
          role="tab"
          className="mode-item"
          aria-selected={basis === "ttm"}
          aria-label={afterTaxTtmBasisTabAriaLabel()}
          data-active={basis === "ttm" ? "true" : "false"}
          onClick={() => setBasis("ttm")}
        >
          {ttmLabel}
        </button>
      </div>
      <MonthlyTargetField
        monthlyText={monthlyText}
        onMonthlyText={onMonthlyText}
        commitMonthlyText={commitMonthlyText}
      />
    </div>
  );
}

export function BlogAfterTaxRankTable() {
  const [basis, setBasis] = useState<Basis>("ttm");
  const [section, setSection] = useState<SectionId>("total-rank");
  const [monthlyText, setMonthlyText] = useState(String(AFTER_TAX_DEFAULT_MONTHLY_NET));
  const [monthlyTarget, setMonthlyTarget] = useState(AFTER_TAX_DEFAULT_MONTHLY_NET);
  const ranked = useMemo(
    () => deriveAfterTaxRank(AFTER_TAX_RANK_2026_08_ETF, basis),
    [basis],
  );
  const rows = useMemo(
    () =>
      withMonthlyTarget(ranked.slice(0, AFTER_TAX_RANK_TOTAL_TOP_N), basis, monthlyTarget).map(
        toCanvasRow,
      ),
    [ranked, basis, monthlyTarget],
  );
  const meta = AFTER_TAX_RANK_2026_08;
  const lead = ranked[0] ? toCanvasRow(ranked[0]) : undefined;
  const scaledLead = useMemo(() => {
    const top = ranked[0];
    if (!top) return undefined;
    return toCanvasRow(withMonthlyTarget([top], basis, monthlyTarget)[0]);
  }, [ranked, basis, monthlyTarget]);
  const nhiHits = ranked.filter((row) => row.nhi > 0).length;
  const sectionOpen = SECTION_OPEN[section];
  const capitalLabel = capitalColumnLabel(monthlyTarget);

  function onMonthlyText(next: string) {
    setMonthlyText(next);
    const plain = next.replace(/[,，]/g, "").trim();
    if (!/^\d+$/.test(plain)) return;
    const n = Math.round(Number(plain));
    if (n >= 1000 && n <= 500_000) setMonthlyTarget(n);
  }

  function commitMonthlyText(raw: string) {
    const value = evaluateMonthly(raw);
    if (value === null) {
      setMonthlyText(String(monthlyTarget));
      return;
    }
    const n = Math.round(value);
    if (n >= 1000 && n <= 500_000) {
      setMonthlyText(String(n));
      setMonthlyTarget(n);
      return;
    }
    setMonthlyText(String(monthlyTarget));
  }

  return (
    <div className="finance-dashboard-container">
      <div className="rank-report-conclusion">
        <h2 className="conclusion-title">本期結論</h2>
        <p className="conclusion-body">
          {lead
            ? `這期第一名是 ${lead.ticker}（${lead.name}）。依該期實領目標逆推，達平均月領 1 萬約需本金 ${formatRankMoney(lead.capital)} 元、${lead.lots.toFixed(1)} 張。本系列第一期，沒有上期名次可比較。`
            : "本期快照尚無排行資料。"}
        </p>
        <p className="conclusion-body">
          {nhiHits > 0
            ? `有 ${nhiHits} 檔在「持有達月領一萬張數」時，${meta.lastPayoutInflowLabel}超過二代健保 ${formatRankMoney(AFTER_TAX_RANK_NHI_THRESHOLD)} 元門檻。`
            : `本期在達標張數下，${meta.lastPayoutInflowLabel}都未過二代健保門檻。`}
          00919 在 8/31 公告 1.10 元，除息日 9/16，未列入本期上一期。
        </p>
      </div>
      <div className="first-row-wrapper">
        <div className="first-level-tabs" role="tablist" aria-label="月報主分類">
          {SECTION_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              className="tab-btn"
              aria-selected={section === tab.id}
              data-active={section === tab.id ? "true" : "false"}
              onClick={() => setSection(tab.id)}
            >
              <span className="tab-label-full">{tab.label}</span>
              <span className="tab-label-short">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      {sectionOpen ? (
        <>
          <BasisAndMonthlyRow
            basis={basis}
            setBasis={setBasis}
            lastLabel={meta.lastBasisTabLabel}
            ttmLabel={meta.ttmBasisTabLabel}
            monthlyText={monthlyText}
            onMonthlyText={onMonthlyText}
            commitMonthlyText={commitMonthlyText}
          />
          <div className="rank-report-table-block">
            <RankReportResponsiveTable
              rows={rows}
              capitalLabel={capitalLabel}
              monthlyText={monthlyText}
              onMonthlyText={onMonthlyText}
              aboveRank4={
                <BasisAndMonthlyRow
                  basis={basis}
                  setBasis={setBasis}
                  lastLabel={meta.lastBasisTabLabel}
                  ttmLabel={meta.ttmBasisTabLabel}
                  monthlyText={monthlyText}
                  onMonthlyText={onMonthlyText}
                  commitMonthlyText={commitMonthlyText}
                />
              }
            />
          </div>
          <p className="rank-split-note">資料截止 {meta.asOf}。收盤 {meta.asOf}；除息 {meta.asOf}。</p>
          {scaledLead ? (
            <>
              <p className="rank-invest-preface">
                如果現在存{scaledLead.ticker}，要月領{monthlyPhrase(monthlyTarget)}，我每個月要投資多少？
              </p>
              <RankInvestPanel
                ticker={scaledLead.ticker}
                capital={scaledLead.capital}
                monthlyTarget={monthlyTarget}
                monthlyText={monthlyText}
                onMonthlyText={onMonthlyText}
                commitMonthlyText={commitMonthlyText}
              />
            </>
          ) : null}
          {/* 第四台先隱藏 */}
        </>
      ) : (
        <div className="rank-section-locked" role="status">
          <div className="rank-section-locked-card">
            <h2>文章準備中</h2>
            <p>
              本篇預計於 <strong>{SECTION_RELEASE[section]}</strong> 公開，敬請期待。
            </p>
            <p>時間到之後重新整理頁面即可閱讀全文。</p>
          </div>
        </div>
      )}
    </div>
  );
}
