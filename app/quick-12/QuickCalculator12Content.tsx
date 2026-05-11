"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { QuickBlogLinksToggle } from "@/app/components/quick-blog-links-toggle";
import { TICKER_PRESETS, type TickerPreset } from "@/app/ticker-presets";
import {
  computeCombinedSalaryAndStocks,
  computeSalaryTaxBurden,
  INSURED_SALARY_MAX,
  INSURED_SALARY_MIN,
  LABOR_SELF_RATE,
  NHI_SELF_RATE,
  SIMPLIFIED_EXEMPTION_AND_DEDUCTION,
  type StockDividendRowInput,
} from "./logic";
import styles from "./quick-12.module.css";
import {
  annualDividendFromMarketValueApprox,
  default54cPctFromPreset,
  estimatedAnnualCashDividendPerLot,
  formatInputMoney,
} from "./ticker-helpers";

const MAX_STOCK_ROWS = 24;

function fmt(n: number) {
  return Math.round(Number.isFinite(n) ? n : 0).toLocaleString("zh-TW");
}

function parseNum(raw: string, fallback: number): number {
  const v = Number(String(raw).replace(/,/g, "").trim());
  return Number.isFinite(v) ? v : fallback;
}

function newStockRowId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `r-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

type StockRowState = {
  id: string;
  /** 與 TICKER_PRESETS.id 一致時表示已套用該預設；否則為 "none" */
  presetId: string;
  label: string;
  grossText: string;
  ratioText: string;
  /** 持股市值（元）：選預設後可搭配殖利率粗估年配息 */
  marketValueText: string;
};

const defaultStockRows = (): StockRowState[] => [];

function newEmptyStockRow(): StockRowState {
  return {
    id: newStockRowId(),
    presetId: "none",
    label: "",
    grossText: "0",
    ratioText: "100",
    marketValueText: "",
  };
}

/** 有任一有效輸入才允許再「新增一筆」，避免空白列無限堆疊 */
function isStockRowCommitted(row: StockRowState): boolean {
  if (row.presetId !== "none") return true;
  if (parseNum(row.grossText, 0) > 0) return true;
  if (parseNum(row.marketValueText, 0) > 0) return true;
  if (row.label.trim().length > 0) return true;
  return false;
}

function grossTextFromPresetAndRow(p: TickerPreset, row: Pick<StockRowState, "marketValueText">): string {
  const mv = parseNum(row.marketValueText, 0);
  const y = p.dividendYieldPct ?? 0;
  if (mv > 0 && y > 0) return formatInputMoney(annualDividendFromMarketValueApprox(mv, y));
  return formatInputMoney(estimatedAnnualCashDividendPerLot(p));
}

export function QuickCalculator12Content({ embeddedInMiniBlog = false }: { embeddedInMiniBlog?: boolean } = {}) {
  const [isLight, setIsLight] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const [monthlyText, setMonthlyText] = useState("45,000");
  const [bonusText, setBonusText] = useState("100,000");
  const [sideText, setSideText] = useState("30,000");
  const [stockRows, setStockRows] = useState(defaultStockRows);
  /** 統一在列表最後「收起／展開」全部股票列明細 */
  const [stockListCollapsed, setStockListCollapsed] = useState(false);

  useEffect(() => {
    if (stockRows.length === 0) setStockListCollapsed(false);
  }, [stockRows.length]);

  const monthly = Math.max(0, parseNum(monthlyText, 45_000));
  const bonus = Math.max(0, parseNum(bonusText, 100_000));
  const side = Math.max(0, parseNum(sideText, 30_000));

  const salaryInput = useMemo(
    () => ({ monthlyInsuredSalary: monthly, annualBonus: bonus, sideIncome: side }),
    [monthly, bonus, side],
  );

  const salaryOnly = useMemo(() => computeSalaryTaxBurden(salaryInput), [salaryInput]);

  const stockInputs: StockDividendRowInput[] = useMemo(
    () =>
      stockRows.map((r) => ({
        annualGross: Math.max(0, parseNum(r.grossText, 0)),
        ratio54cPct: Math.min(100, Math.max(0, parseNum(r.ratioText, 100))),
      })),
    [stockRows],
  );

  const combined = useMemo(() => computeCombinedSalaryAndStocks(salaryInput, stockInputs), [salaryInput, stockInputs]);

  const canAddStockRow = useMemo(() => {
    if (stockRows.length >= MAX_STOCK_ROWS) return false;
    if (stockRows.length === 0) return true;
    return isStockRowCommitted(stockRows[stockRows.length - 1]!);
  }, [stockRows]);

  const activeOut = currentPage === 1 ? combined : salaryOnly;
  const lhPct = Math.round((LABOR_SELF_RATE + NHI_SELF_RATE) * 10000) / 100;

  const switchPage = useCallback((p: number) => {
    setCurrentPage(Math.max(0, Math.min(1, p)));
  }, []);

  const addStockRow = useCallback(() => {
    setStockRows((rows) => {
      if (rows.length >= MAX_STOCK_ROWS) return rows;
      if (rows.length > 0 && !isStockRowCommitted(rows[rows.length - 1]!)) return rows;
      return [...rows, newEmptyStockRow()];
    });
  }, []);

  const removeStockRow = useCallback((id: string) => {
    setStockRows((rows) => rows.filter((r) => r.id !== id));
  }, []);

  const applyPresetFromSelect = useCallback((rowId: string, presetId: string) => {
    if (presetId === "none") {
      setStockRows((rows) => rows.map((r) => (r.id === rowId ? { ...r, presetId: "none" } : r)));
      return;
    }
    const preset = TICKER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const r54 = default54cPctFromPreset(preset);
    setStockRows((rows) =>
      rows.map((r) => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          presetId: preset.id,
          label: preset.id,
          grossText: grossTextFromPresetAndRow(preset, r),
          ratioText: String(r54),
        };
      }),
    );
  }, []);

  const onStockLabelChange = useCallback((rowId: string, raw: string) => {
    const code = raw.trim().replace(/\s/g, "");
    const preset = TICKER_PRESETS.find((p) => p.id === code);
    if (preset) {
      const r54 = default54cPctFromPreset(preset);
      setStockRows((rows) =>
        rows.map((r) =>
          r.id === rowId
            ? {
                ...r,
                label: preset.id,
                presetId: preset.id,
                grossText: grossTextFromPresetAndRow(preset, r),
                ratioText: String(r54),
              }
            : r,
        ),
      );
      return;
    }
    setStockRows((rows) => rows.map((r) => (r.id === rowId ? { ...r, label: raw, presetId: "none" } : r)));
  }, []);

  const onStockGrossChange = useCallback((rowId: string, grossText: string) => {
    setStockRows((rows) =>
      rows.map((r) => (r.id === rowId ? { ...r, grossText, presetId: "none", marketValueText: "" } : r)),
    );
  }, []);

  const onMarketValueChange = useCallback((rowId: string, marketValueText: string) => {
    setStockRows((rows) =>
      rows.map((r) => {
        if (r.id !== rowId) return r;
        const next: StockRowState = { ...r, marketValueText };
        if (r.presetId !== "none") {
          const preset = TICKER_PRESETS.find((p) => p.id === r.presetId);
          if (preset) {
            const mv = parseNum(marketValueText, 0);
            const y = preset.dividendYieldPct ?? 0;
            if (mv > 0 && y > 0) {
              next.grossText = formatInputMoney(annualDividendFromMarketValueApprox(mv, y));
            } else if (mv <= 0) {
              next.grossText = formatInputMoney(estimatedAnnualCashDividendPerLot(preset));
            }
          }
        }
        return next;
      }),
    );
  }, []);

  const onStockRatioChange = useCallback((rowId: string, ratioText: string) => {
    setStockRows((rows) => rows.map((r) => (r.id === rowId ? { ...r, ratioText, presetId: "none" } : r)));
  }, []);

  const pageTabs = [
    { id: 0, title: "月薪試算" },
    { id: 1, title: "加計股票" },
  ] as const;

  const shell = `${styles.shell} ${embeddedInMiniBlog ? styles.embedded : ""} ${isLight ? styles.themeLight : ""}`.trim();

  return (
    <main
      className={`${embeddedInMiniBlog ? "min-h-0" : "min-h-screen"} py-2.5 px-1.5 sm:px-2 ${
        isLight ? "bg-white text-slate-900" : "bg-[#020817] text-slate-100"
      }`}
    >
      <div className={shell}>
        <header
          className={`mb-2.5 rounded-xl border p-2.5 ${
            isLight ? "border-slate-200 bg-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)]" : "border-slate-700 bg-[#0f172a]"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className={`text-[15px] font-black tracking-wide ${isLight ? "text-sky-800" : "text-sky-300"}`}>財富自由計算機 · 第 12 台</p>
            <button
              type="button"
              onClick={() => setIsLight((v) => !v)}
              className={`shrink-0 rounded-md border px-2 py-1 text-[11px] font-bold ${
                isLight ? "border-slate-200 bg-white text-slate-900" : "border-slate-600 bg-slate-800 text-slate-200"
              }`}
              aria-label="切換淺色或深色"
            >
              {isLight ? "深" : "淺"}
            </button>
          </div>
          <h1 className={`mt-1 text-[1.35rem] font-black leading-tight ${isLight ? "text-slate-900" : "text-white"}`}>實領薪資與稅務負擔</h1>
          <p className={`mt-1 text-[13px] font-semibold leading-snug ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            開頁即試算。切「加計股票」可新增多筆年配息；二代健保以 54C 計入與 2 萬比（與大計算機一致）。
          </p>
        </header>

        <section
          className={`rounded-xl border p-2 ${
            isLight ? "border-slate-200 bg-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)]" : "border-slate-700 bg-[#0f172a]"
          }`}
        >
          <div
            className={`mb-2 flex flex-wrap items-stretch gap-1 rounded-lg border p-1.5 ${
              isLight ? "border-slate-200 bg-white" : "border-slate-700 bg-slate-900/40"
            }`}
          >
            {pageTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchPage(tab.id)}
                className={`min-h-[2.5rem] flex-1 rounded-md px-2 py-2 text-[14px] font-bold transition whitespace-nowrap ${
                  currentPage === tab.id
                    ? isLight
                      ? "bg-sky-600 text-white shadow-sm"
                      : "bg-sky-600 text-white shadow-[0_0_12px_rgba(2,132,199,0.35)]"
                    : isLight
                      ? "bg-transparent text-slate-600 hover:bg-slate-100"
                      : "bg-transparent text-slate-400 hover:bg-slate-800/80"
                }`}
              >
                {tab.title}
              </button>
            ))}
          </div>

          <div className="space-y-3">
              <div className={styles.panel}>
                <p className={`text-[14px] font-black ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                  {currentPage === 0 ? "薪資與獎金" : "薪資與獎金（與月薪試算共用）"}
                </p>
                <div className={styles.row2}>
                  <label className={styles.label}>
                    <span>月薪（投保薪資）</span>
                    <input className={styles.input} value={monthlyText} onChange={(e) => setMonthlyText(e.target.value)} inputMode="decimal" />
                  </label>
                  <label className={styles.label}>
                    <span>年終／獎金（單筆）</span>
                    <input className={styles.input} value={bonusText} onChange={(e) => setBonusText(e.target.value)} inputMode="decimal" />
                  </label>
                </div>
                <label className={styles.label}>
                  <span>兼職／其他現金（單筆）</span>
                  <input className={styles.input} value={sideText} onChange={(e) => setSideText(e.target.value)} inputMode="decimal" />
                </label>
                {currentPage === 1 ? (
                  <p className={`text-[12px] leading-snug ${isLight ? "text-amber-800" : "text-amber-200/90"}`}>
                    若股利改由下表輸入，建議將「兼職／其他」改 0，避免同一筆所得重複計入毛額。
                  </p>
                ) : null}
              </div>

              {currentPage === 1 ? (
                <div className={styles.panel}>
                  <p className={`mb-2 text-[14px] font-black ${isLight ? "text-slate-800" : "text-slate-200"}`}>股票／ETF 年配息</p>
                  {stockRows.length === 0 ? (
                    <>
                      <p className={`mb-3 text-[13px] leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                        尚無標的，請點下方按鈕新增。已有資料時，「新增一筆」會固定出現在最後一筆下方。
                      </p>
                      <button type="button" onClick={addStockRow} className={styles.addBelow} title="新增一筆股票／ETF">
                        ＋ 新增一筆
                      </button>
                    </>
                  ) : null}
                  {stockRows.length > 0 ? (
                    <ul className="m-0 flex list-none flex-col gap-2 p-0">
                      {stockRows.map((row, idx) => {
                        const summaryName = row.label.trim() || (row.presetId !== "none" ? row.presetId : "未命名");
                        return (
                          <li
                            key={row.id}
                            className={`rounded-lg border p-2 ${isLight ? "border-slate-200 bg-white" : "border-slate-600 bg-slate-900/50"}`}
                          >
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <span className={`text-[12px] font-bold ${isLight ? "text-slate-500" : "text-slate-500"}`}>第 {idx + 1} 筆</span>
                              <button
                                type="button"
                                onClick={() => removeStockRow(row.id)}
                                className={`text-[12px] font-bold underline decoration-dotted ${isLight ? "text-red-700" : "text-red-300"}`}
                              >
                                刪除
                              </button>
                            </div>
                            {stockListCollapsed ? (
                              <div
                                className={`${styles.collapseSummary} ${styles.collapseSummaryReadonly}`}
                                role="group"
                                aria-label={`${summaryName}，年配息`}
                              >
                                <span className="min-w-0 truncate font-black">{summaryName}</span>
                                <span className="shrink-0 font-mono text-[13px] opacity-90">NT$ {fmt(parseNum(row.grossText, 0))}</span>
                                <span className={`shrink-0 text-[12px] font-bold opacity-75 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                                  54C {Math.min(100, Math.max(0, parseNum(row.ratioText, 100)))}%
                                </span>
                              </div>
                            ) : (
                              <>
                                <label className={`${styles.label} mb-2`}>
                                  <span>名稱（選填，輸入完整代碼即帶入）</span>
                                  <input
                                    className={styles.input}
                                    value={row.label}
                                    onChange={(e) => onStockLabelChange(row.id, e.target.value)}
                                    placeholder="例：0050"
                                    inputMode="text"
                                    autoCapitalize="characters"
                                  />
                                </label>
                                <label className={`${styles.label} mb-2`}>
                                  <span>選擇預設標的（同首頁資料庫）</span>
                                  <select
                                    className={styles.select}
                                    value={row.presetId ?? "none"}
                                    onChange={(e) => applyPresetFromSelect(row.id, e.target.value)}
                                    aria-label={`第 ${idx + 1} 筆：預設標的`}
                                  >
                                    <option value="none">不使用預設（自填年配息與 54C）</option>
                                    {TICKER_PRESETS.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.id}｜{p.label.length > 44 ? `${p.label.slice(0, 42)}…` : p.label}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label className={`${styles.label} mb-2`}>
                                  <span>持股市值（元，選填）</span>
                                  <input
                                    className={styles.input}
                                    value={row.marketValueText ?? ""}
                                    onChange={(e) => onMarketValueChange(row.id, e.target.value)}
                                    inputMode="decimal"
                                    placeholder={row.presetId !== "none" ? "填市值→依殖利率粗估年配息" : "先選預設標的再填市值"}
                                  />
                                </label>
                                <div className={styles.row2}>
                                  <label className={styles.label}>
                                    <span>年現金配息（元）</span>
                                    <input
                                      className={styles.input}
                                      value={row.grossText}
                                      onChange={(e) => onStockGrossChange(row.id, e.target.value)}
                                      inputMode="decimal"
                                    />
                                  </label>
                                  <label className={styles.label}>
                                    <span>54C 占比（%）</span>
                                    <input
                                      className={styles.input}
                                      value={row.ratioText}
                                      onChange={(e) => onStockRatioChange(row.id, e.target.value)}
                                      inputMode="decimal"
                                    />
                                  </label>
                                </div>
                              </>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                  {stockRows.length > 0 ? (
                    <>
                      <button
                        type="button"
                        onClick={addStockRow}
                        disabled={!canAddStockRow}
                        title={
                          canAddStockRow
                            ? "在最後一筆下方新增下一筆"
                            : "請先完成上一筆：選預設、填名稱、持股市值或年配息其中一項"
                        }
                        className={styles.addBelow}
                      >
                        ＋ 新增一筆
                      </button>
                      {!canAddStockRow ? (
                        <p className={`${styles.addBelowHint} ${isLight ? "text-amber-800" : "text-amber-200/95"}`}>
                          請先完成上一筆（選預設、填名稱、市值或年配息其一），再新增下一筆。
                        </p>
                      ) : null}
                      <button
                        type="button"
                        className={styles.collapseBtn}
                        onClick={() => setStockListCollapsed((v) => !v)}
                      >
                        {stockListCollapsed ? "展開全部明細" : "收起全部明細"}
                      </button>
                    </>
                  ) : null}
                </div>
              ) : null}

              <section className={styles.steps} aria-label="試算結果階梯">
                <h2 className={styles.stepsTitle}>試算結果（階梯式）</h2>
                <div className={styles.taxHero} role="region" aria-label="綜合所得稅試算摘要">
                  <div className={styles.taxHeroLabel}>綜合所得稅（全年，示意）</div>
                  <div className={`${styles.taxHeroAmount} ${styles.gov}`}>
                    {activeOut.estimatedAnnualIncomeTax <= 0
                      ? `試算應納 NT$ ${fmt(activeOut.estimatedAnnualIncomeTax)}`
                      : `試算應納約 NT$ ${fmt(activeOut.estimatedAnnualIncomeTax)}`}
                  </div>
                  <p className={styles.taxHeroNote}>
                    申報時「退稅／補繳」要對照薪資扣繳、股利憑單與實際扣除；本頁未輸入已扣稅額，故只顯示應納稅額試算，非結算單。
                  </p>
                </div>
                {currentPage === 1 && combined.stockGrossTotal > 0 ? (
                  <div className={`${styles.step} ${styles.stepL1}`}>
                    <div className={styles.stepLabel}>股票年配息合計（稅前）</div>
                    <div className={styles.stepValue}>NT$ {fmt(combined.stockGrossTotal)}</div>
                  </div>
                ) : null}

                <div className={`${styles.step} ${styles.stepL1}`}>
                  <div className={styles.stepLabel}>① 原始總收入（稅前，全年）</div>
                  <div className={styles.stepValue}>NT$ {fmt(activeOut.grossAnnual)}</div>
                  <div className={styles.muted}>
                    {currentPage === 1 ? "＝ 月薪×12 + 年終 + 兼職 + 股票配息" : "＝ 月薪×12 + 年終 + 兼職"}
                  </div>
                </div>

                <div className={`${styles.step} ${styles.stepL2}`}>
                  <div className={styles.stepLabel}>② 勞保 + 健保自付（全年）</div>
                  <div className={`${styles.stepValue} ${styles.gov}`}>− NT$ {fmt(activeOut.annualLaborHealth)}</div>
                  <div className={styles.muted}>
                    投保 {fmt(activeOut.insuredMonthly)} 元／月 × {lhPct}% ×12（月薪輸入 {fmt(activeOut.monthlySalaryInput)}）
                  </div>
                </div>

                <div className={`${styles.step} ${styles.stepL2}`}>
                  <div className={styles.stepLabel}>③ 二代健保補充保費</div>
                  <div className={`${styles.stepValue} ${styles.gov}`}>− NT$ {fmt(activeOut.nhi2Total)}</div>
                  <div className={styles.muted}>
                    年終 −{fmt(activeOut.nhi2Bonus)}、兼職 −{fmt(activeOut.nhi2Side)}
                    {currentPage === 1 && combined.stockNhi2Total > 0 ? `、股票合計 −${fmt(combined.stockNhi2Total)}` : ""}
                  </div>
                  {currentPage === 1 && stockRows.length > 0 ? (
                    <ul className={`m-0 mt-2 list-none space-y-1 p-0 text-[12px] ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                      {stockRows.map((row, i) => {
                        const d = combined.stockDetails[i];
                        if (!d) return null;
                        const name = row.label.trim() || `第 ${i + 1} 筆`;
                        return (
                          <li key={row.id}>
                            {name}：54C 計入 {fmt(d.taxable54)} → 二代 {fmt(d.nhi2)}
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>

                <div className={`${styles.step} ${styles.stepL3}`}>
                  <div className={styles.stepLabel}>④ 扣勞健保與補充保費後 — 月均</div>
                  <div className={`${styles.stepValue} ${styles.pocket}`}>約 NT$ {fmt(activeOut.avgMonthlyAfterLhNhi2)} ／月</div>
                  <div className={styles.muted}>尚未扣隔年綜所稅</div>
                </div>

                <div className={`${styles.step} ${styles.stepL3}`}>
                  <div className={styles.stepLabel}>⑤ 隔年預估綜合所得稅（累進 5%～40%）</div>
                  <div className={`${styles.stepValue} ${styles.gov}`}>− NT$ {fmt(activeOut.estimatedAnnualIncomeTax)}</div>
                  <div className={styles.muted}>
                    淨額示意 {fmt(activeOut.taxableNetForIncomeTax)} ＝ 毛所得 − 勞健保 − {fmt(SIMPLIFIED_EXEMPTION_AND_DEDUCTION)}
                  </div>
                </div>

                <div className={`${styles.step} ${styles.stepL4}`}>
                  <div className={styles.stepLabel}>⑥ 最後實領（全年淨增加）</div>
                  <div className={`${styles.stepValue} ${styles.pocket}`}>NT$ {fmt(activeOut.finalNetAnnual)}</div>
                </div>

                <div className={`${styles.step} ${styles.stepL2}`} style={{ marginTop: 10 }}>
                  <div className={styles.stepLabel}>給政府／公保合計（示意）</div>
                  <div className={`${styles.stepValue} ${styles.gov}`}>NT$ {fmt(activeOut.governmentOutflowsAnnual)}</div>
                </div>

                <p className={styles.note}>
                  紅色為公費與稅；綠色為落袋。綜所為簡化扣除與累進，與實際申報可能不同。
                </p>
              </section>
          </div>
        </section>

        {!embeddedInMiniBlog ? <QuickBlogLinksToggle quickRoute="/quick-12" /> : null}

        {!embeddedInMiniBlog ? (
          <Link href="/" className={styles.cta}>
            進入財富自由計算機
          </Link>
        ) : null}

        <p className={styles.disclaimer}>* 試算僅供教育討論；費率與扣除以法令與個案為準。</p>
      </div>
    </main>
  );
}

export default QuickCalculator12Content;
