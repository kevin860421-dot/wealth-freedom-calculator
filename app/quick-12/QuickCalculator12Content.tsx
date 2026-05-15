"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type Dispatch, type KeyboardEvent, type SetStateAction, type WheelEvent } from "react";
import { QuickBlogLinksToggle } from "@/app/components/quick-blog-links-toggle";
import { QuickSeoArticle } from "@/app/components/quick-seo-article";
import { QuickSeoExtras } from "@/app/components/quick-seo-extras";
import { TICKER_PRESETS, type TickerPreset } from "@/app/ticker-presets";
import { NHI2_THRESHOLD } from "@/lib/dividend-tax-sandbox";
import { QUICK12_DISPLAY_TITLE } from "./display-title";
import {
  computeCombinedSalaryAndStocks,
  computeSalaryTaxBurden,
  computeStockNhi2Snapshot,
  INSURED_SALARY_MAX,
  INSURED_SALARY_MIN,
  LABOR_SELF_RATE,
  NHI_SELF_RATE,
  SIMPLIFIED_EXEMPTION_AND_DEDUCTION,
  type StockDividendRowInput,
  type StockNhi2PkSnapshot,
} from "./logic";
import styles from "./quick-12.module.css";
import {
  annualDividendFromMarketValueApprox,
  default54cPctFromPreset,
  defaultLotMarketValueTwd,
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

/** 試算中：完整算式先 eval；未完成算式則退回 fallback，避免 `45000+` 被誤 parse */
function parseMoneyFieldLive(raw: string, fallback: number): number {
  const ev = tryEvalArithmeticMoneyExpr(raw);
  if (ev !== null) return ev;
  if (hasIncompleteMoneyExpr(raw)) return fallback;
  return parseNum(raw, fallback);
}

/** Enter／失焦：結算算式並格式化（月薪可夾投保上下限） */
function commitMoneyText(raw: string, fallback: number, min: number, max: number | null): string {
  const ev = tryEvalArithmeticMoneyExpr(raw);
  let n = Math.round(ev !== null ? ev : parseNum(raw, fallback));
  n = Math.max(min, n);
  if (max !== null) n = Math.min(max, n);
  return formatInputMoney(n);
}

/** 持股市值算式：去千分位、全形運算子 → 可 eval 片段 */
function normalizeMoneyExprForEval(raw: string): string {
  return raw
    .replace(/，/g, ",")
    .replace(/,/g, "")
    .replace(/\s+/g, "")
    .replace(/＋/g, "+")
    .replace(/－/g, "-")
    .replace(/／/g, "/")
    .replace(/＊/g, "*")
    .replace(/（/g, "(")
    .replace(/）/g, ")");
}

/** 僅允許數字與 + - * /（）；Enter／失焦時結算 */
function tryEvalArithmeticMoneyExpr(raw: string): number | null {
  const normalized = normalizeMoneyExprForEval(raw);
  if (!normalized) return null;
  if (!/^[\d+\-*/().]+$/u.test(normalized)) return null;
  try {
    const v = new Function(`"use strict"; return (${normalized});`)();
    if (typeof v !== "number" || !Number.isFinite(v)) return null;
    return Math.round(Math.max(0, v));
  } catch {
    return null;
  }
}

function hasIncompleteMoneyExpr(raw: string): boolean {
  const n = normalizeMoneyExprForEval(raw);
  if (!/[+\-*/]/.test(n)) return false;
  return tryEvalArithmeticMoneyExpr(raw) === null;
}

function parseMarketValueForGross(raw: string): number {
  const ev = tryEvalArithmeticMoneyExpr(raw);
  if (ev !== null) return ev;
  return Math.max(0, parseNum(raw, 0));
}

function wheelStepForMarketValue(cur: number): number {
  if (!Number.isFinite(cur) || cur <= 0) return 1_000;
  if (cur >= 2_000_000) return 100_000;
  if (cur >= 500_000) return 50_000;
  if (cur >= 100_000) return 10_000;
  return 1_000;
}

function formatCommittedMarketValueField(raw: string): string {
  const n = parseMarketValueForGross(raw);
  return n > 0 ? formatInputMoney(n) : "";
}

type MarketGrossRow = { presetId: string; marketValueText: string; grossText: string };

function recomputeGrossFromMarketValue<T extends MarketGrossRow>(row: T): T {
  if (row.presetId === "none") return { ...row };
  const pr = TICKER_PRESETS.find((x) => x.id === row.presetId);
  if (!pr) return { ...row };
  if (hasIncompleteMoneyExpr(row.marketValueText)) return { ...row };
  const m = parseMarketValueForGross(row.marketValueText);
  const y = pr.dividendYieldPct ?? 0;
  const next = { ...row };
  if (m > 0 && y > 0) {
    next.grossText = formatInputMoney(annualDividendFromMarketValueApprox(m, y));
  } else if (m <= 0) {
    next.grossText = formatInputMoney(estimatedAnnualCashDividendPerLot(pr));
  }
  return next;
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

type PkSideState = Pick<StockRowState, "presetId" | "label" | "grossText" | "ratioText" | "marketValueText">;

/** 舊版名稱「2330（2 張）」或半形「2330(2 張)」仍可能留在 state／快取 */
function matchesLegacyLotsLabel(presetId: string, rawLabel: string): boolean {
  const t = rawLabel.trim();
  if (!t) return false;
  const esc = presetId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    new RegExp(`^${esc}\\s*（\\s*\\d+\\s*張）$`, "u").test(t) ||
    new RegExp(`^${esc}\\s*\\(\\s*\\d+\\s*張\\s*\\)$`, "u").test(t)
  );
}

function stripLegacyLotsPkLabel(side: PkSideState): PkSideState {
  if (side.presetId === "none" || !matchesLegacyLotsLabel(side.presetId, side.label)) return side;
  return { ...side, label: side.presetId };
}

/** 試算庫 label「元大台50（0050）- ETF…」→「元大台50」 */
function shortNameFromPresetLabel(fullLabel: string): string {
  const paren = fullLabel.indexOf("（");
  if (paren > 0) return fullLabel.slice(0, paren).trim();
  return fullLabel.split(" - ")[0]?.trim() || fullLabel;
}

/** PK 抬頭／階梯：代碼＋試算庫簡稱；不顯示張數（張數僅影響預設市值／配息試算） */
function pkDisplayTitle(side: PkSideState, fallback: string): string {
  const preset =
    side.presetId !== "none" ? TICKER_PRESETS.find((p) => p.id === side.presetId) : undefined;

  if (preset) {
    const libName = shortNameFromPresetLabel(preset.label);
    const lab = side.label.trim();
    const looksLegacyLots = matchesLegacyLotsLabel(preset.id, lab);
    const isDefaultCodeLabel = lab === "" || lab === preset.id || looksLegacyLots;
    const displayName = isDefaultCodeLabel ? libName : lab;
    return `${preset.id} ${displayName}`;
  }

  const lab = side.label.trim();
  if (!lab) return fallback;

  const codeGuess = lab.replace(/\s/g, "").split(/[（(]/)[0] ?? "";
  const guessed = TICKER_PRESETS.find((p) => p.id === codeGuess);
  if (guessed) return `${guessed.id} ${shortNameFromPresetLabel(guessed.label)}`;

  return lab;
}

/** PK 階梯：第一行代碼、第二行簡稱＋欄位，避免單行過長 */
function pkStepTitleLines(side: PkSideState, fallback: string): { code: string; sub: string } {
  const full = pkDisplayTitle(side, fallback).trim();
  const preset =
    side.presetId !== "none" ? TICKER_PRESETS.find((p) => p.id === side.presetId) : undefined;
  if (preset && full.startsWith(preset.id)) {
    const rest = full.slice(preset.id.length).trim();
    return { code: preset.id, sub: rest ? `${rest} · 二代健保` : "二代健保" };
  }
  const tok = (full.split(/\s+/)[0] || fallback).trim() || fallback;
  const rest = full.slice(tok.length).trim();
  return { code: tok, sub: rest ? `${rest} · 二代健保` : "二代健保" };
}

/** 自試算庫帶入：張數用於預設持市值與配息；代號欄僅代碼 */
function pkSideFromPresetId(presetId: string, lots = 1): PkSideState {
  const preset = TICKER_PRESETS.find((p) => p.id === presetId);
  if (!preset) {
    return { presetId: "none", label: "", grossText: "0", ratioText: "100", marketValueText: "" };
  }
  const nLots = Math.max(1, Math.floor(lots));
  const mv = defaultLotMarketValueTwd(preset, nLots);
  const y = preset.dividendYieldPct ?? 0;
  const grossNum =
    mv > 0 && y > 0 ? annualDividendFromMarketValueApprox(mv, y) : Math.round(estimatedAnnualCashDividendPerLot(preset) * nLots);
  const r54 = default54cPctFromPreset(preset);
  return {
    presetId: preset.id,
    label: preset.id,
    grossText: formatInputMoney(grossNum),
    ratioText: String(r54),
    marketValueText: mv > 0 ? formatInputMoney(mv) : "",
  };
}

/** 內建三組對戰（數值由試算庫 × 張數） */
const QUICK12_PK_SCENARIOS: readonly { id: number; label: string; title: string; a: PkSideState; b: PkSideState }[] = [
  {
    id: 0,
    label: "①",
    title: "00878 ×1 vs 2330 ×2",
    a: pkSideFromPresetId("00878", 1),
    b: pkSideFromPresetId("2330", 2),
  },
  {
    id: 1,
    label: "②",
    title: "0056 ×1 vs 2330 ×2",
    a: pkSideFromPresetId("0056", 1),
    b: pkSideFromPresetId("2330", 2),
  },
  {
    id: 2,
    label: "③",
    title: "2454 ×1 vs 2330 ×2",
    a: pkSideFromPresetId("2454", 1),
    b: pkSideFromPresetId("2330", 2),
  },
];

function Quick12Nhi2PkHalf(props: {
  title: string;
  side: PkSideState;
  setSide: Dispatch<SetStateAction<PkSideState>>;
  snapshot: StockNhi2PkSnapshot;
  isLight: boolean;
  /** 二代健保試算較省：外框呼吸動畫（與下方結果一致） */
  winnerFrame?: boolean;
}) {
  const { title, side, setSide, snapshot, isLight, winnerFrame = false } = props;

  const applyPreset = (presetId: string) => {
    if (presetId === "none") {
      setSide((prev) => ({ ...prev, presetId: "none" }));
      return;
    }
    const preset = TICKER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const r54 = default54cPctFromPreset(preset);
    const mv = defaultLotMarketValueTwd(preset, 1);
    const mvText = mv > 0 ? formatInputMoney(mv) : "";
    setSide((prev) => ({
      ...prev,
      presetId: preset.id,
      label: preset.id,
      marketValueText: mvText,
      grossText: grossTextFromPresetAndRow(preset, { marketValueText: mvText }),
      ratioText: String(r54),
    }));
  };

  const onLabel = (raw: string) => {
    const code = raw.trim().replace(/\s/g, "");
    const preset = TICKER_PRESETS.find((p) => p.id === code);
    if (preset) {
      const r54 = default54cPctFromPreset(preset);
      const mv = defaultLotMarketValueTwd(preset, 1);
      const mvText = mv > 0 ? formatInputMoney(mv) : "";
      setSide((prev) => ({
        ...prev,
        label: preset.id,
        presetId: preset.id,
        marketValueText: mvText,
        grossText: grossTextFromPresetAndRow(preset, { marketValueText: mvText }),
        ratioText: String(r54),
      }));
      return;
    }
    setSide((prev) => ({ ...prev, label: raw, presetId: "none" }));
  };

  const commitMarketValue = () => {
    setSide((prev) => {
      const formatted = formatCommittedMarketValueField(prev.marketValueText);
      return recomputeGrossFromMarketValue({ ...prev, marketValueText: formatted });
    });
  };

  const onMarketWheel = (e: WheelEvent<HTMLInputElement>) => {
    if (document.activeElement !== e.currentTarget) return;
    e.preventDefault();
    e.stopPropagation();
    setSide((prev) => {
      if (prev.presetId === "none") return prev;
      const cur = parseMarketValueForGross(prev.marketValueText);
      const step = wheelStepForMarketValue(cur);
      const nextVal = Math.max(0, cur + (e.deltaY < 0 ? step : -step));
      const nextText = nextVal > 0 ? formatInputMoney(nextVal) : "";
      return recomputeGrossFromMarketValue({ ...prev, marketValueText: nextText });
    });
  };

  const onMarketKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  return (
    <div
      className={`rounded-lg border p-2 ${isLight ? "border-slate-200 bg-white" : "border-slate-600 bg-slate-900/50"} ${winnerFrame ? styles.pkHalfWinner : ""}`}
      data-pk-winner={winnerFrame ? "1" : undefined}
    >
      <p className={`${styles.pkCardTitle} mb-1.5 text-[12px] font-black ${isLight ? "text-slate-800" : "text-sky-200"}`}>{title}</p>
      <label className={`${styles.label} mb-2`}>
        <span>代號（選填）</span>
        <input
          className={styles.input}
          value={side.label}
          onChange={(e) => onLabel(e.target.value)}
          placeholder="例：0050"
          inputMode="text"
          autoCapitalize="characters"
        />
      </label>
      <label className={`${styles.label} mb-2`}>
        <span>預設標的</span>
        <select className={styles.select} value={side.presetId} onChange={(e) => applyPreset(e.target.value)} aria-label={`${title}：預設標的`}>
          <option value="none">不使用預設</option>
          {TICKER_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.id}｜{p.label.length > 36 ? `${p.label.slice(0, 34)}…` : p.label}
            </option>
          ))}
        </select>
      </label>
      <label className={`${styles.label} mb-2`}>
        <span>持股市值（元，選填）</span>
        <input
          className={`${styles.input} ${styles.mvWheelInput}`}
          value={side.marketValueText}
          onChange={(e) => {
            const mv = e.target.value;
            setSide((prev) => recomputeGrossFromMarketValue({ ...prev, marketValueText: mv }));
          }}
          onBlur={commitMarketValue}
          onKeyDown={onMarketKeyDown}
          onWheel={onMarketWheel}
          title="滾輪上下微調；可輸入算式如 500000+200000 或 (600000-50000)*0.5 — Enter 或離開欄位結算"
          inputMode="decimal"
          placeholder={side.presetId !== "none" ? "市值、算式或滾輪微調→年配息" : "先選預設再填市值"}
        />
      </label>
      <div className={styles.row2}>
        <label className={styles.label}>
          <span>年現金配息（元）</span>
          <input
            className={styles.input}
            value={side.grossText}
            onChange={(e) => setSide((prev) => ({ ...prev, grossText: e.target.value, presetId: "none", marketValueText: "" }))}
            inputMode="decimal"
          />
        </label>
        <label className={styles.label}>
          <span>54C 占比（%）</span>
          <input
            className={styles.input}
            value={side.ratioText}
            onChange={(e) => setSide((prev) => ({ ...prev, ratioText: e.target.value, presetId: "none" }))}
            inputMode="decimal"
          />
        </label>
      </div>
      <div className={`mt-1.5 rounded-md border px-2 py-1 text-[11px] font-black leading-tight ${isLight ? "border-amber-200 bg-amber-50 text-amber-950" : "border-amber-500/35 bg-amber-950/30 text-amber-100"}`}>
        計入 {fmt(Math.round(snapshot.taxable54))} → 二代健保 {fmt(snapshot.nhi2)}
        {snapshot.taxable54 < NHI2_THRESHOLD ? " · 免" : ""}
      </div>
    </div>
  );
}

export function QuickCalculator12Content({
  embeddedInMiniBlog = false,
  initialPage,
  initialPkScenarioIdx = 0,
}: {
  embeddedInMiniBlog?: boolean;
  /** mini-blog 文內試算：0 月薪、1 股票、2 PK */
  initialPage?: 0 | 1 | 2;
  /** 僅在 initialPage 為 PK 時使用；對應 QUICK12_PK_SCENARIOS 索引 */
  initialPkScenarioIdx?: number;
} = {}) {
  const [isLight, setIsLight] = useState(false);
  const embedPage = initialPage ?? 0;
  const pkIdxInit =
    embedPage === 2
      ? Math.max(
          0,
          Math.min(QUICK12_PK_SCENARIOS.length - 1, Math.floor(Number(initialPkScenarioIdx) || 0)),
        )
      : 0;

  const [currentPage, setCurrentPage] = useState(embedPage);

  const [monthlyText, setMonthlyText] = useState("45,000");
  const [bonusText, setBonusText] = useState("100,000");
  const [sideText, setSideText] = useState("30,000");
  const [stockRows, setStockRows] = useState(defaultStockRows);
  /** 二代健保 PK：兩筆單筆股利對照（與加計股票相同二代健保規則） */
  const [pkA, setPkA] = useState<PkSideState>(() =>
    stripLegacyLotsPkLabel({ ...QUICK12_PK_SCENARIOS[pkIdxInit]!.a }),
  );
  const [pkB, setPkB] = useState<PkSideState>(() =>
    stripLegacyLotsPkLabel({ ...QUICK12_PK_SCENARIOS[pkIdxInit]!.b }),
  );
  const [pkScenarioIdx, setPkScenarioIdx] = useState(pkIdxInit);
  /** 統一在列表最後「收起／展開」全部股票列明細 */
  const [stockListCollapsed, setStockListCollapsed] = useState(false);

  useEffect(() => {
    if (stockRows.length === 0) setStockListCollapsed(false);
  }, [stockRows.length]);

  /** 清掉舊版「代碼（n 張）」名稱（熱更新／未重整仍可能殘留） */
  useEffect(() => {
    setPkA((s) => stripLegacyLotsPkLabel(s));
    setPkB((s) => stripLegacyLotsPkLabel(s));
  }, []);

  const commitMonthlyField = useCallback(() => {
    setMonthlyText((t) => commitMoneyText(t, 45_000, INSURED_SALARY_MIN, INSURED_SALARY_MAX));
  }, []);

  const commitBonusField = useCallback(() => {
    setBonusText((t) => commitMoneyText(t, 100_000, 0, null));
  }, []);

  const commitSideField = useCallback(() => {
    setSideText((t) => commitMoneyText(t, 30_000, 0, null));
  }, []);

  const onSalaryMoneyKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>, commit: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
      e.currentTarget.blur();
    }
  }, []);

  const monthly = Math.max(0, parseMoneyFieldLive(monthlyText, 45_000));
  const bonus = Math.max(0, parseMoneyFieldLive(bonusText, 100_000));
  const side = Math.max(0, parseMoneyFieldLive(sideText, 30_000));

  const monthlySliderValue = Math.min(INSURED_SALARY_MAX, Math.max(INSURED_SALARY_MIN, monthly));
  const bonusSliderMax = Math.max(1_000_000, Math.ceil(bonus / 100_000) * 100_000);
  const bonusSliderValue = Math.min(bonusSliderMax, Math.max(0, bonus));

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

  const pkSnapA = useMemo(
    () =>
      computeStockNhi2Snapshot({
        annualGross: parseNum(pkA.grossText, 0),
        ratio54cPct: parseNum(pkA.ratioText, 0),
      }),
    [pkA],
  );
  const pkSnapB = useMemo(
    () =>
      computeStockNhi2Snapshot({
        annualGross: parseNum(pkB.grossText, 0),
        ratio54cPct: parseNum(pkB.ratioText, 0),
      }),
    [pkB],
  );

  /** 僅兩欄 PK 卡片：二代健保較低者外框動畫（平手則兩側皆不強調） */
  const pkWinnerFrameA = pkSnapA.nhi2 < pkSnapB.nhi2;
  const pkWinnerFrameB = pkSnapB.nhi2 < pkSnapA.nhi2;

  const pkTitleA = useMemo(() => pkDisplayTitle(pkA, "上欄"), [pkA]);
  const pkTitleB = useMemo(() => pkDisplayTitle(pkB, "下欄"), [pkB]);
  const pkStepLinesA = useMemo(() => pkStepTitleLines(pkA, "上欄"), [pkA]);
  const pkStepLinesB = useMemo(() => pkStepTitleLines(pkB, "下欄"), [pkB]);
  const pkDiffPayerLines = useMemo(
    () => pkStepTitleLines(pkSnapA.nhi2 > pkSnapB.nhi2 ? pkA : pkB, "—"),
    [pkA, pkB, pkSnapA.nhi2, pkSnapB.nhi2],
  );

  /** PK 底部一句話：結構給 JSX，金額另用樣式凸顯 */
  const pkPick = useMemo(() => {
    if (pkSnapA.nhi2 === pkSnapB.nhi2) {
      return { kind: "tie" as const };
    }
    const diff = Math.abs(pkSnapA.nhi2 - pkSnapB.nhi2);
    const saver = pkSnapA.nhi2 < pkSnapB.nhi2 ? pkTitleA : pkTitleB;
    const payer = pkSnapA.nhi2 > pkSnapB.nhi2 ? pkTitleA : pkTitleB;
    return { kind: "pick" as const, saver, payer, diff };
  }, [pkSnapA.nhi2, pkSnapB.nhi2, pkTitleA, pkTitleB]);

  const canAddStockRow = useMemo(() => {
    if (stockRows.length >= MAX_STOCK_ROWS) return false;
    if (stockRows.length === 0) return true;
    return isStockRowCommitted(stockRows[stockRows.length - 1]!);
  }, [stockRows]);

  const activeOut = currentPage === 1 ? combined : salaryOnly;
  const lhPct = Math.round((LABOR_SELF_RATE + NHI_SELF_RATE) * 10000) / 100;

  const switchPage = useCallback((p: number) => {
    setCurrentPage(Math.max(0, Math.min(2, p)) as 0 | 1 | 2);
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
        return recomputeGrossFromMarketValue({ ...r, marketValueText });
      }),
    );
  }, []);

  const onMarketValueBlur = useCallback((rowId: string) => {
    setStockRows((rows) =>
      rows.map((r) => {
        if (r.id !== rowId) return r;
        const formatted = formatCommittedMarketValueField(r.marketValueText);
        return recomputeGrossFromMarketValue({ ...r, marketValueText: formatted });
      }),
    );
  }, []);

  const onMarketValueWheel = useCallback((rowId: string, e: WheelEvent<HTMLInputElement>) => {
    if (document.activeElement !== e.currentTarget) return;
    e.preventDefault();
    e.stopPropagation();
    setStockRows((rows) =>
      rows.map((r) => {
        if (r.id !== rowId) return r;
        if (r.presetId === "none") return r;
        const cur = parseMarketValueForGross(r.marketValueText);
        const step = wheelStepForMarketValue(cur);
        const nextVal = Math.max(0, cur + (e.deltaY < 0 ? step : -step));
        const nextText = nextVal > 0 ? formatInputMoney(nextVal) : "";
        return recomputeGrossFromMarketValue({ ...r, marketValueText: nextText });
      }),
    );
  }, []);

  const onStockRatioChange = useCallback((rowId: string, ratioText: string) => {
    setStockRows((rows) => rows.map((r) => (r.id === rowId ? { ...r, ratioText, presetId: "none" } : r)));
  }, []);

  const q12Dash = QUICK12_DISPLAY_TITLE.indexOf("-");
  const q12TitleFirst = q12Dash === -1 ? QUICK12_DISPLAY_TITLE : QUICK12_DISPLAY_TITLE.slice(0, q12Dash + 1);
  const q12TitleSecond = q12Dash === -1 ? "" : QUICK12_DISPLAY_TITLE.slice(q12Dash + 1);

  const pageTabs = [
    { id: 0, title: "月薪" },
    { id: 1, title: "股票" },
    { id: 2, title: "PK" },
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
            <p className={`text-[15px] font-black tracking-wide ${isLight ? "text-sky-800" : "text-sky-300"}`}>
              財富自由計算機 · 第 12 台
            </p>
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
          <h1
            className={`mt-1 text-[1.12rem] font-black leading-snug sm:text-[1.28rem] ${isLight ? "text-slate-900" : "text-white"}`}
          >
            <span className="block sm:inline">{q12TitleFirst}</span>
            {q12TitleSecond ? (
              <span className="block sm:inline sm:ml-0">{q12TitleSecond}</span>
            ) : null}
          </h1>
          <p className={`mt-2 text-[12px] font-semibold leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            月薪、年終、股利，先丟同一鍋試算；數字對齊了，心裡才不會亂。
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
                className={`min-h-[2rem] flex-1 rounded-md px-1 py-1 text-[11px] font-bold transition whitespace-nowrap ${
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
              {currentPage !== 2 ? (
              <>
              <div className={styles.panel}>
                <p className={`text-[14px] font-black ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                  {currentPage === 0 ? "薪資與獎金" : "薪資與獎金（與月薪試算共用）"}
                </p>
                <div className={styles.row2}>
                  <div className={styles.salaryCol}>
                    <label className={styles.label}>
                      <span>月薪（投保薪資）</span>
                      <input
                        className={styles.input}
                        value={monthlyText}
                        onChange={(e) => setMonthlyText(e.target.value)}
                        onBlur={commitMonthlyField}
                        onKeyDown={(e) => onSalaryMoneyKeyDown(e, commitMonthlyField)}
                        inputMode="decimal"
                        title="可輸入算式如 45000+5000 或 (48000-2000)*1；Enter 或離開欄位結算"
                      />
                    </label>
                    <input
                      type="range"
                      className={styles.salaryRange}
                      min={INSURED_SALARY_MIN}
                      max={INSURED_SALARY_MAX}
                      step={100}
                      value={monthlySliderValue}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (!Number.isFinite(v)) return;
                        setMonthlyText(formatInputMoney(Math.round(v)));
                      }}
                      aria-label="月薪（投保薪資）滑桿微調"
                    />
                  </div>
                  <div className={styles.salaryCol}>
                    <label className={styles.label}>
                      <span>年終／獎金（單筆）</span>
                      <input
                        className={styles.input}
                        value={bonusText}
                        onChange={(e) => setBonusText(e.target.value)}
                        onBlur={commitBonusField}
                        onKeyDown={(e) => onSalaryMoneyKeyDown(e, commitBonusField)}
                        inputMode="decimal"
                        title="可輸入算式；Enter 或離開欄位結算"
                      />
                    </label>
                    <input
                      type="range"
                      className={styles.salaryRange}
                      min={0}
                      max={bonusSliderMax}
                      step={1000}
                      value={bonusSliderValue}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (!Number.isFinite(v)) return;
                        setBonusText(formatInputMoney(Math.round(v)));
                      }}
                      aria-label="年終／獎金（單筆）滑桿微調"
                    />
                  </div>
                </div>
                <label className={styles.label}>
                  <span>兼職／其他現金（單筆）</span>
                  <input
                    className={styles.input}
                    value={sideText}
                    onChange={(e) => setSideText(e.target.value)}
                    onBlur={commitSideField}
                    onKeyDown={(e) => onSalaryMoneyKeyDown(e, commitSideField)}
                    inputMode="decimal"
                    title="可輸入算式；Enter 或離開欄位結算"
                  />
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
                                    className={`${styles.input} ${styles.mvWheelInput}`}
                                    value={row.marketValueText ?? ""}
                                    onChange={(e) => onMarketValueChange(row.id, e.target.value)}
                                    onBlur={() => onMarketValueBlur(row.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        (e.target as HTMLInputElement).blur();
                                      }
                                    }}
                                    onWheel={(e) => onMarketValueWheel(row.id, e)}
                                    title="滾輪上下微調；可輸入算式如 500000+200000 — Enter 或離開欄位結算"
                                    inputMode="decimal"
                                    placeholder={row.presetId !== "none" ? "市值、算式或滾輪微調→年配息" : "先選預設標的再填市值"}
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
              </>
              ) : (
                <div className={styles.panel}>
                  <p className={`mb-2 text-center text-[1.05rem] font-black tracking-wide ${isLight ? "text-slate-900" : "text-white"}`}>
                    ⚔️ PK
                  </p>
                  <div className="mb-2 flex gap-1">
                    {QUICK12_PK_SCENARIOS.map((s) => {
                      const active = pkScenarioIdx === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          title={s.title}
                          aria-label={`帶入對戰組 ${s.title}`}
                          onClick={() => {
                            setPkA(stripLegacyLotsPkLabel({ ...s.a }));
                            setPkB(stripLegacyLotsPkLabel({ ...s.b }));
                            setPkScenarioIdx(s.id);
                          }}
                          className={`min-h-0 flex-1 rounded-md border px-0.5 py-1.5 text-center text-[13px] font-black leading-none transition ${
                            active
                              ? isLight
                                ? "border-sky-500 bg-sky-500 text-white shadow-sm"
                                : "border-sky-400 bg-sky-600 text-white shadow-[0_0_8px_rgba(56,189,248,0.35)]"
                              : isLight
                                ? "border-slate-200 bg-white text-slate-800 hover:border-sky-300"
                                : "border-slate-600 bg-slate-900/50 text-sky-100 hover:border-slate-500"
                          }`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Quick12Nhi2PkHalf
                      title={pkTitleA}
                      side={pkA}
                      setSide={setPkA}
                      snapshot={pkSnapA}
                      isLight={isLight}
                      winnerFrame={pkWinnerFrameA}
                    />
                    <Quick12Nhi2PkHalf
                      title={pkTitleB}
                      side={pkB}
                      setSide={setPkB}
                      snapshot={pkSnapB}
                      isLight={isLight}
                      winnerFrame={pkWinnerFrameB}
                    />
                  </div>
                </div>
              )}

              <section
                className={styles.steps}
                aria-label={currentPage === 2 ? "PK 結果" : "試算結果階梯"}
              >
                <h2 className={styles.stepsTitle}>{currentPage === 2 ? "PK！" : "試算結果（階梯式）"}</h2>
                {currentPage === 2 ? (
                  <>
                    <div className={`${styles.step} ${styles.stepL1}`}>
                      <div className={styles.pkStepLabelStack}>
                        <div className={styles.pkStepLineCode}>{pkStepLinesA.code}</div>
                        <div className={styles.pkStepLineSub}>{pkStepLinesA.sub}</div>
                      </div>
                      <div className={`${styles.stepValue} ${styles.gov}`}>NT$ {fmt(pkSnapA.nhi2)}</div>
                    </div>
                    <div className={`${styles.step} ${styles.stepL1}`}>
                      <div className={styles.pkStepLabelStack}>
                        <div className={styles.pkStepLineCode}>{pkStepLinesB.code}</div>
                        <div className={styles.pkStepLineSub}>{pkStepLinesB.sub}</div>
                      </div>
                      <div className={`${styles.stepValue} ${styles.gov}`}>NT$ {fmt(pkSnapB.nhi2)}</div>
                    </div>
                    <div className={`${styles.step} ${styles.stepL2} ${styles.pkDiffStep}`}>
                      <div className={styles.stepLabel}>差多少</div>
                      {pkSnapA.nhi2 === pkSnapB.nhi2 ? (
                        <div className={`${styles.stepValue} ${styles.muted}`}>平手</div>
                      ) : (
                        <>
                          <div className={styles.pkDiffLead}>
                            <span
                              className={styles.pkDiffCode}
                              title={pkSnapA.nhi2 > pkSnapB.nhi2 ? pkTitleA : pkTitleB}
                            >
                              {pkDiffPayerLines.code}
                            </span>
                            <span className={styles.pkDiffVerb}>多付（二代健保）</span>
                          </div>
                          <div className={`${styles.stepValue} ${styles.gov} ${styles.pkDiffAmount}`}>
                            NT$ {fmt(Math.abs(pkSnapA.nhi2 - pkSnapB.nhi2))}
                          </div>
                        </>
                      )}
                    </div>
                    <div className={styles.pkHintBox} role="status">
                      {pkPick.kind === "tie" ? (
                        <p className={styles.pkHintLead}>平手，兩邊一樣。</p>
                      ) : (
                        <>
                          <p className={styles.pkHintLead}>
                            這局偏 <strong>{pkPick.saver}</strong>
                          </p>
                          <p className={styles.pkHintNum} aria-label={`約省 ${fmt(pkPick.diff)} 元`}>
                            NT$ {fmt(pkPick.diff)}
                          </p>
                          <p className={styles.pkHintSub}>比 {pkPick.payer} 省</p>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <>
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
                            {name}：54C 計入 {fmt(d.taxable54)} → 二代健保 {fmt(d.nhi2)}
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
                  </>
                )}
              </section>
          </div>
        </section>

        {!embeddedInMiniBlog ? (
          <>
            <QuickBlogLinksToggle quickRoute="/quick-12" />
            <QuickSeoExtras id={12} />
            <QuickSeoArticle id={12} />
          </>
        ) : null}

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
