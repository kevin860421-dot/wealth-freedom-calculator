import {
  H1,
  H2,
  H3,
  Row,
  Stack,
  Stat,
  Table,
  Text,
  TextInput,
  canvasTokensLight,
  useCanvasState,
  useMemo,
  useRef,
} from "cursor/canvas";
import { useCallback, useEffect, useState } from "react";

/**
 * 稅後實領配息報表樣板（唯一邏輯本）。
 * 複製下一期／週報時：只改 PERIOD + SNAPSHOT + 說明文，不准另發明欄位或稅率。
 * 非正式站網址、未進部落格。數字為示意樣本，非正式行情。
 * @preview-reload 2026-09-22T20:32+08
 */

const NHI_RATE = 0.0211;
const NHI_THRESHOLD = 20_000;
const WIRE_FEE = 10;
const FEE_PER_LOT = 15;
const TOTAL_RANK_TOP_N = 50;

type Freq = "月" | "季" | "半年" | "年";
type RankBasis = "ttm" | "last";

/** 月報主分頁：總榜 / ETF PK / 個股收租 / 下月除息 */
type ReportSection = "total-rank" | "etf-focus-pk" | "stock-rent" | "ex-div-preview";

const ETF_FOCUS_PK_TICKERS = ["00919", "00929", "00878"] as const;

const REPORT_SECTION_TABS: {
  id: ReportSection;
  label: string;
  /** 手機（<600）等分 segmented 用的短標；沒給就用 label */
  shortLabel?: string;
  ariaLabel: string;
}[] = [
  { id: "total-rank", label: "總排行", ariaLabel: "總排行" },
  {
    id: "etf-focus-pk",
    label: "ETF 排行",
    ariaLabel: "ETF 排行：精選高股息 ETF 對照（00919、00929、00878）",
  },
  {
    id: "stock-rent",
    label: "個股排行",
    ariaLabel: "個股排行：高股息傳統個股",
  },
  {
    id: "ex-div-preview",
    label: "搶先除息｜最後買進日",
    shortLabel: "搶先除息",
    ariaLabel: "搶先除息：下月已公告的最後買進日",
  },
];

/** 當月 1 日總排行，8 日 ETF，15 日個股，22 日搶先除息。與部落格同為台北 09:30。 */
const SECTION_PUBLISH_DAY: Record<ReportSection, number> = {
  "total-rank": 1,
  "etf-focus-pk": 8,
  "stock-rent": 15,
  "ex-div-preview": 22,
};

/** 預覽時鐘：假設 2026-08-01 12:00（台北）。總排行已公開，後三格未到。 */
const RANK_SECTION_PREVIEW_NOW = new Date("2026-08-01T12:00:00+08:00");

function sectionPublishAt(year: number, month: number, id: ReportSection): Date {
  const day = String(SECTION_PUBLISH_DAY[id]).padStart(2, "0");
  const mm = String(month).padStart(2, "0");
  return new Date(`${year}-${mm}-${day}T09:30:00+08:00`);
}

function formatSectionPublishLabel(when: Date): string {
  return when.toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function afterTaxLastBasisTabLabel(_month: number): string {
  return "近一個月排行";
}

function afterTaxTtmBasisTabLabel(): string {
  return "近期12個月 中位數";
}

function afterTaxTtmBasisTabAriaLabel(): string {
  return "近期12個月：以每期現金配息中位數回推月領一萬所需本金";
}

function afterTaxLastPayoutInflowLabel(month: number): string {
  return `${month}月配發入帳`;
}

type SnapshotRow = {
  ticker: string;
  name: string;
  price: number;
  lastCashPerUnit: number;
  stockDivPerUnit: number;
  ttmCashPerUnit: number;
  ttmComplete: boolean;
  freq: Freq;
  prevRank: number;
  exDate: string;
  lastBuy: string;
  payDate: string;
  recentCashPayouts?: number[];
};

const PERIOD = {
  id: "2026-08",
  month: 8,
  title: "2026年8月榜單",
  /** 與 lib/blog/after-tax-rank-series.ts afterTaxLastBasisTabLabel 同步 */
  lastBasisTabLabel: afterTaxLastBasisTabLabel(8),
  ttmBasisTabLabel: afterTaxTtmBasisTabLabel(),
  lastPayoutInflowLabel: afterTaxLastPayoutInflowLabel(8),
  /** 與 app/blog/2026-08-after-tax-dividend-rank/page.tsx 的 H1 同步 */
  headline: "2026最新｜8月高股息配息排行！月領1萬要存幾張、成本多少？",
  asOf: "2026-08-31",
  author: "財富自由計算機編輯部",
  canonical: "/blog/2026-08-after-tax-dividend-rank",
  /** 表下來源行：只列日期，不列機構名 */
  sourceDates: "收盤 2026-08-31 · 除息≤2026-08-31 · 近一年配息 2026-09-07",
};

const BASIS_TABS: { id: RankBasis; label: string; ariaLabel: string }[] = [
  { id: "last", label: PERIOD.lastBasisTabLabel, ariaLabel: PERIOD.lastBasisTabLabel },
  {
    id: "ttm",
    label: PERIOD.ttmBasisTabLabel,
    ariaLabel: afterTaxTtmBasisTabAriaLabel(),
  },
];

const SERIES_START = { year: 2026, month: 8 };
const SERIES_LENGTH = 30;
const PUBLISHED_ISSUES = [{ year: 2026, month: 8, asOf: "2026-08-31" }];

function rankingMonthIndex(year: number, month: number) {
  return year * 12 + month;
}

function isAfterTaxRankSeriesMonth(year: number, month: number) {
  if (month < 1 || month > 12) return false;
  const start = rankingMonthIndex(SERIES_START.year, SERIES_START.month);
  const current = rankingMonthIndex(year, month);
  return current >= start && current < start + SERIES_LENGTH;
}

function getPublishedIssue(year: number, month: number) {
  return PUBLISHED_ISSUES.find((item) => item.year === year && item.month === month) ?? null;
}

function isBeforeSeriesStart(year: number, month: number) {
  return rankingMonthIndex(year, month) < rankingMonthIndex(SERIES_START.year, SERIES_START.month);
}

function normalizeRankingYearMonth(
  year: number,
  month: number,
): { year: number; month: number } | null {
  const y = Math.round(year);
  const m = Math.round(month);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return null;
  const d = new Date(y, m - 1, 1);
  if (Number.isNaN(d.getTime())) return null;
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function isAfterTaxRankSeriesYear(year: number) {
  for (let month = 1; month <= 12; month += 1) {
    if (isAfterTaxRankSeriesMonth(year, month)) return true;
  }
  return false;
}

function getSeriesYearBounds() {
  const last = shiftRankingMonth(SERIES_START.year, SERIES_START.month, SERIES_LENGTH - 1);
  return { minYear: SERIES_START.year, maxYear: last.year };
}

/** 下拉只列系列年份；算式超出範圍時多插一筆（不可點）。 */
function getYearMenuOptions(anchorYear: number) {
  const { minYear, maxYear } = getSeriesYearBounds();
  const years: number[] = [];
  for (let y = minYear; y <= maxYear; y++) years.push(y);
  const anchor = Math.round(anchorYear);
  if (Number.isFinite(anchor) && (anchor < minYear || anchor > maxYear)) {
    years.push(anchor);
    years.sort((a, b) => a - b);
  }
  return years;
}

function shiftRankingMonth(year: number, month: number, deltaMonths: number) {
  const base = normalizeRankingYearMonth(year, month);
  if (!base) return { year, month };
  const d = new Date(base.year, base.month - 1, 1);
  d.setMonth(d.getMonth() + Math.round(deltaMonths));
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function evaluateNumericCell(raw: string): number | null {
  const src = raw
    .trim()
    .replace(/\s+/g, "")
    .replace(/^=/, "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/＋/g, "+")
    .replace(/－/g, "-");
  if (!src) return null;
  if (!/^[0-9+\-*/().]+$/.test(src)) return null;
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

const MONTH_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

const ETF_SNAPSHOT: SnapshotRow[] = [
  {
    "ticker": "0050",
    "name": "元大台灣50",
    "price": 155,
    "lastCashPerUnit": 1.85,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 3.7,
    "ttmComplete": false,
    "freq": "半年",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "0056",
    "name": "元大高股息",
    "price": 54.6,
    "lastCashPerUnit": 1.35,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 4.082,
    "ttmComplete": true,
    "freq": "季",
    "prevRank": 0,
    "exDate": "2026-07-21",
    "lastBuy": "2026-07-20",
    "payDate": "2026-08-10"
  },
  {
    "ticker": "006208",
    "name": "富邦台50",
    "price": 95,
    "lastCashPerUnit": 1.4,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 2.8,
    "ttmComplete": false,
    "freq": "半年",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00878",
    "name": "國泰永續高股息",
    "price": 33.18,
    "lastCashPerUnit": 1.01,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 2.49,
    "ttmComplete": true,
    "freq": "季",
    "prevRank": 0,
    "exDate": "2026-08-18",
    "lastBuy": "2026-08-17",
    "payDate": "2026-09-11"
  },
  {
    "ticker": "00900",
    "name": "富邦特選高股息30",
    "price": 13.8,
    "lastCashPerUnit": 0.2,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 0.8,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00919",
    "name": "群益台灣精選高息",
    "price": 31.96,
    "lastCashPerUnit": 1,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 3.42,
    "ttmComplete": true,
    "freq": "季",
    "prevRank": 0,
    "exDate": "2026-06-16",
    "lastBuy": "2026-06-15",
    "payDate": "2026-07-13",
    "recentCashPayouts": [
      0.75,
      0.8,
      1,
      0.85
    ]
  },
  {
    "ticker": "00929",
    "name": "復華台灣科技優息",
    "price": 29.15,
    "lastCashPerUnit": 0.38,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 1.59,
    "ttmComplete": false,
    "freq": "月",
    "prevRank": 0,
    "exDate": "2026-08-19",
    "lastBuy": "2026-08-18",
    "payDate": "2026-09-14"
  },
  {
    "ticker": "00934",
    "name": "中信成長高股息",
    "price": 22,
    "lastCashPerUnit": 0.1,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 1.2000000000000002,
    "ttmComplete": false,
    "freq": "月",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00935",
    "name": "野村臺灣新科技50",
    "price": 57.3,
    "lastCashPerUnit": 1.2,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 1.2,
    "ttmComplete": false,
    "freq": "半年",
    "prevRank": 0,
    "exDate": "2026-03-17",
    "lastBuy": "2026-03-16",
    "payDate": "2026-04-14",
    "recentCashPayouts": [
      1.2
    ]
  },
  {
    "ticker": "00940",
    "name": "元大台灣價值高息",
    "price": 12.78,
    "lastCashPerUnit": 0.05,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 0.375,
    "ttmComplete": false,
    "freq": "月",
    "prevRank": 0,
    "exDate": "2026-08-11",
    "lastBuy": "2026-08-10",
    "payDate": "2026-09-01"
  },
  {
    "ticker": "00646",
    "name": "元大S&P500",
    "price": 48,
    "lastCashPerUnit": 0.35,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 1.4,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00662",
    "name": "富邦NASDAQ",
    "price": 28,
    "lastCashPerUnit": 0.4,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 0.8,
    "ttmComplete": false,
    "freq": "半年",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00730",
    "name": "富邦台灣優質高息",
    "price": 16,
    "lastCashPerUnit": 0.24,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 0.96,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00692",
    "name": "富邦公司治理",
    "price": 28,
    "lastCashPerUnit": 0.5,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 2,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00701",
    "name": "國泰股利精選30",
    "price": 22,
    "lastCashPerUnit": 0.28,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 1.12,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00713",
    "name": "元大台灣高息低波",
    "price": 61.9,
    "lastCashPerUnit": 1,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 1.78,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "2026-06-22",
    "lastBuy": "2026-06-21",
    "payDate": "2026-07-10",
    "recentCashPayouts": [
      0.78,
      1
    ]
  },
  {
    "ticker": "00728",
    "name": "第一金工業30",
    "price": 18,
    "lastCashPerUnit": 0.22,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 0.88,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00731",
    "name": "復華富時高息低波",
    "price": 24,
    "lastCashPerUnit": 0.32,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 1.28,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00733",
    "name": "富邦臺灣中小",
    "price": 35,
    "lastCashPerUnit": 0.55,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 1.1,
    "ttmComplete": false,
    "freq": "半年",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00735",
    "name": "國泰臺韓科技",
    "price": 32,
    "lastCashPerUnit": 0.45,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 0.9,
    "ttmComplete": false,
    "freq": "半年",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00757",
    "name": "統一FANG+",
    "price": 42,
    "lastCashPerUnit": 0.5,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 2,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00762",
    "name": "元大全球AI",
    "price": 18,
    "lastCashPerUnit": 0.15,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 0.6,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00771",
    "name": "國泰北美科技",
    "price": 38,
    "lastCashPerUnit": 0.48,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 0.96,
    "ttmComplete": false,
    "freq": "半年",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00830",
    "name": "國泰費城半導體",
    "price": 45,
    "lastCashPerUnit": 0.42,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 1.68,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00850",
    "name": "元大臺灣ESG永續",
    "price": 26,
    "lastCashPerUnit": 0.35,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 1.4,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00881",
    "name": "國泰台灣科技龍頭",
    "price": 21,
    "lastCashPerUnit": 0.3,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 1.2,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00907",
    "name": "永豐優息存股",
    "price": 14,
    "lastCashPerUnit": 0.11,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 1.32,
    "ttmComplete": false,
    "freq": "月",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00891",
    "name": "中信美國市政債",
    "price": 35,
    "lastCashPerUnit": 0.12,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 1.44,
    "ttmComplete": false,
    "freq": "月",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00905",
    "name": "富邦信用債1-5Y",
    "price": 32,
    "lastCashPerUnit": 0.1,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 1.2000000000000002,
    "ttmComplete": false,
    "freq": "月",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00909",
    "name": "國泰數位支付服務",
    "price": 20,
    "lastCashPerUnit": 0.18,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 0.72,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00913",
    "name": "兆豐台灣晶圓製造",
    "price": 24,
    "lastCashPerUnit": 0.25,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 1,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00915",
    "name": "凱基優選高股息30",
    "price": 17,
    "lastCashPerUnit": 0.22,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 0.88,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00918",
    "name": "大華優利高填息30",
    "price": 34.61,
    "lastCashPerUnit": 1.26,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 1.88,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "2026-06-18",
    "lastBuy": "2026-06-17",
    "payDate": "2026-07-13",
    "recentCashPayouts": [
      0.62,
      1.26
    ]
  },
  {
    "ticker": "00922",
    "name": "國泰台灣領袖50",
    "price": 30,
    "lastCashPerUnit": 0.38,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 1.52,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00923",
    "name": "群益台ESG低碳50",
    "price": 19,
    "lastCashPerUnit": 0.24,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 0.96,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00924",
    "name": "復華S&P500成長",
    "price": 36,
    "lastCashPerUnit": 0.4,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 0.8,
    "ttmComplete": false,
    "freq": "半年",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00926",
    "name": "凱基台灣5G+",
    "price": 16,
    "lastCashPerUnit": 0.2,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 0.8,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00927",
    "name": "群益台灣中小型股",
    "price": 22,
    "lastCashPerUnit": 0.28,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 1.12,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00932",
    "name": "宏大台灣ESG永續高息",
    "price": 14,
    "lastCashPerUnit": 0.11,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 1.32,
    "ttmComplete": false,
    "freq": "月",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00936",
    "name": "台新永續高息中小",
    "price": 19,
    "lastCashPerUnit": 0.26,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 1.04,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00939",
    "name": "統一台灣高息動能",
    "price": 15,
    "lastCashPerUnit": 0.06,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 0.72,
    "ttmComplete": false,
    "freq": "月",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00943",
    "name": "兆豐電子高息等權",
    "price": 20,
    "lastCashPerUnit": 0.24,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 0.96,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00944",
    "name": "新光台灣高息",
    "price": 12,
    "lastCashPerUnit": 0.15,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 0.6,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00945",
    "name": "兆豐龍頭等權重",
    "price": 16,
    "lastCashPerUnit": 0.2,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 0.8,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00946",
    "name": "群益台灣科技高息",
    "price": 10,
    "lastCashPerUnit": 0.06,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 0.72,
    "ttmComplete": false,
    "freq": "月",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00947",
    "name": "新光台灣半導體30",
    "price": 14,
    "lastCashPerUnit": 0.18,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 0.72,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00949",
    "name": "凱基台灣AI50",
    "price": 18,
    "lastCashPerUnit": 0.22,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 0.88,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00951",
    "name": "台新美國標普500",
    "price": 33,
    "lastCashPerUnit": 0.38,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 0.76,
    "ttmComplete": false,
    "freq": "半年",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00952",
    "name": "凱基台灣電力設施",
    "price": 17,
    "lastCashPerUnit": 0.21,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 0.84,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00954",
    "name": "富邦臺灣中英德50",
    "price": 25,
    "lastCashPerUnit": 0.3,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 1.2,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00956",
    "name": "中信台灣智慧綠能",
    "price": 15,
    "lastCashPerUnit": 0.18,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 0.72,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00960",
    "name": "元大台灣金融高息",
    "price": 13,
    "lastCashPerUnit": 0.1,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 1.2000000000000002,
    "ttmComplete": false,
    "freq": "月",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00961",
    "name": "元大投資級公司債",
    "price": 28,
    "lastCashPerUnit": 0.11,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 1.32,
    "ttmComplete": false,
    "freq": "月",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00962",
    "name": "中信電池及儲能",
    "price": 16,
    "lastCashPerUnit": 0.19,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 0.76,
    "ttmComplete": false,
    "freq": "季",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  },
  {
    "ticker": "00971",
    "name": "野村美國研發龍頭",
    "price": 22,
    "lastCashPerUnit": 0.28,
    "stockDivPerUnit": 0,
    "ttmCashPerUnit": 0.56,
    "ttmComplete": false,
    "freq": "半年",
    "prevRank": 0,
    "exDate": "—",
    "lastBuy": "—",
    "payDate": "—"
  }
];

const STOCK_SNAPSHOT: SnapshotRow[] = [
  {
    ticker: "2412",
    name: "中華電",
    price: 132.5,
    lastCashPerUnit: 5.2,
    stockDivPerUnit: 0,
    ttmCashPerUnit: 5.2,
    ttmComplete: true,
    freq: "年",
    prevRank: 2,
    exDate: "2026-07-03",
    lastBuy: "2026-07-02",
    payDate: "2026-08-06",
  },
  {
    ticker: "3045",
    name: "台灣大",
    price: 116.0,
    lastCashPerUnit: 4.4,
    stockDivPerUnit: 0,
    ttmCashPerUnit: 4.4,
    ttmComplete: true,
    freq: "年",
    prevRank: 1,
    exDate: "2026-06-26",
    lastBuy: "2026-06-25",
    payDate: "2026-07-24",
  },
  {
    ticker: "2912",
    name: "統一超",
    price: 248.5,
    lastCashPerUnit: 9.0,
    stockDivPerUnit: 0,
    ttmCashPerUnit: 9.0,
    ttmComplete: true,
    freq: "年",
    prevRank: 4,
    exDate: "2026-07-16",
    lastBuy: "2026-07-15",
    payDate: "2026-08-12",
  },
  {
    ticker: "2303",
    name: "聯電",
    price: 46.8,
    lastCashPerUnit: 2.85,
    stockDivPerUnit: 0,
    ttmCashPerUnit: 2.85,
    ttmComplete: true,
    freq: "年",
    prevRank: 3,
    exDate: "2026-06-24",
    lastBuy: "2026-06-23",
    payDate: "2026-07-16",
  },
  {
    ticker: "2002",
    name: "中鋼",
    price: 19.15,
    lastCashPerUnit: 0.7,
    stockDivPerUnit: 0.3,
    ttmCashPerUnit: 0.7,
    ttmComplete: true,
    freq: "年",
    prevRank: 5,
    exDate: "2026-07-08",
    lastBuy: "2026-07-07",
    payDate: "2026-08-07",
  },
];

type Derived = SnapshotRow & {
  lots: number;
  capital: number;
  grossDividend: number;
  wireFee: number;
  nhi: number;
  fee: number;
  net: number;
  ttmNetYield: number;
  lastNetYield: number;
  rank: number;
  delta: number;
};

function payoutsPerYear(freq: Freq): number {
  switch (freq) {
    case "月":
      return 12;
    case "季":
      return 4;
    case "半年":
      return 2;
    case "年":
      return 1;
  }
}

const DEFAULT_MONTHLY_NET = 10_000;

function perPeriodNetTarget(freq: Freq): number {
  return periodNetForMonthly(freq, DEFAULT_MONTHLY_NET);
}

function periodNetForMonthly(freq: Freq, monthlyNet: number): number {
  return monthlyNet * (12 / payoutsPerYear(freq));
}

/** 名次維持月領 1 萬的排序，只重算本金、張數與該目標下的費用、實領。 */
function withMonthlyTarget(ranked: Derived[], basis: RankBasis, monthlyNet: number): Derived[] {
  if (monthlyNet === DEFAULT_MONTHLY_NET) return ranked;
  return ranked.map((row) => {
    const targetNet = periodNetForMonthly(row.freq, monthlyNet);
    const div = dividendPerShareForPeriod(row, basis);
    const solved = solveLotsForPeriodNet(div, targetNet);
    const capital = row.price * solved.lots * 1000;
    return {
      ...row,
      lots: solved.lots,
      capital,
      grossDividend: solved.grossDividend,
      nhi: solved.nhi,
      fee: solved.fee,
      net: targetNet,
    };
  });
}

function monthlyWanLabel(n: number): string {
  if (n > 0 && n % 10_000 === 0) return `${n / 10_000}萬`;
  if (n > 0 && n % 1_000 === 0) return `${n / 1_000}千`;
  return money(n);
}

function capitalColumnLabel(monthlyNet: number): string {
  return `月領${monthlyWanLabel(monthlyNet)}本金`;
}

function getMedian(values: number[]): number {
  const arr = values.filter((n) => Number.isFinite(n) && n > 0);
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function recentCashPayoutSamplesForRow(row: SnapshotRow): number[] {
  if (row.recentCashPayouts?.length) {
    return row.recentCashPayouts.filter((n) => Number.isFinite(n) && n > 0);
  }
  const py = payoutsPerYear(row.freq);
  if (row.ttmComplete && py > 0 && row.ttmCashPerUnit > 0) {
    const per = row.ttmCashPerUnit / py;
    return Array.from({ length: py }, () => per);
  }
  if (row.lastCashPerUnit > 0) return [row.lastCashPerUnit];
  return [];
}

function dividendPerShareForPeriod(row: SnapshotRow, basis: RankBasis): number {
  if (basis === "last") return row.lastCashPerUnit;
  const median = getMedian(recentCashPayoutSamplesForRow(row));
  if (median > 0) return median;
  return row.lastCashPerUnit;
}

function solveLotsForPeriodNet(
  dividendPerShare: number,
  targetNet: number,
): { lots: number; grossDividend: number; nhi: number; fee: number } {
  const grossPerLot = dividendPerShare * 1000;
  if (grossPerLot <= 0 || targetNet <= 0) {
    return { lots: 0, grossDividend: 0, nhi: 0, fee: 0 };
  }
  const wire = WIRE_FEE;
  let lots = targetNet / grossPerLot;
  for (let i = 0; i < 40; i++) {
    const fee = Math.ceil(lots * FEE_PER_LOT);
    const netPlusCosts = targetNet + fee + wire;
    let grossDividend = netPlusCosts;
    let nhi = 0;
    if (grossDividend >= NHI_THRESHOLD) {
      grossDividend = netPlusCosts / (1 - NHI_RATE);
      nhi = Math.round(grossDividend * NHI_RATE);
    }
    const nextLots = grossDividend / grossPerLot;
    if (Math.abs(nextLots - lots) < 1e-5) {
      return { lots: nextLots, grossDividend, nhi, fee };
    }
    lots = nextLots;
  }
  const fee = Math.ceil(lots * FEE_PER_LOT);
  const netPlusCosts = targetNet + fee + wire;
  let grossDividend = netPlusCosts;
  let nhi = 0;
  if (grossDividend >= NHI_THRESHOLD) {
    grossDividend = netPlusCosts / (1 - NHI_RATE);
    nhi = Math.round(grossDividend * NHI_RATE);
  }
  return { lots, grossDividend, nhi, fee };
}

function compareByRequiredCapital(a: Derived, b: Derived): number {
  const diff = a.capital - b.capital;
  if (diff !== 0) return diff;
  return a.ticker.localeCompare(b.ticker, "zh-Hant");
}

function deriveAll(rows: SnapshotRow[], basis: RankBasis): Derived[] {
  const mapped = rows.map((row) => {
    const targetNet = perPeriodNetTarget(row.freq);
    const div = dividendPerShareForPeriod(row, basis);
    const { lots, grossDividend, nhi, fee } = solveLotsForPeriodNet(div, targetNet);
    const capital = row.price * lots * 1000;
    const ttmNetYield =
      capital > 0 ? ((row.ttmCashPerUnit * 1000) / (row.price * 1000)) * 100 : 0;
    const lastAnnualiser = payoutsPerYear(row.freq);
    const lastNetYield =
      capital > 0
        ? ((row.lastCashPerUnit * lastAnnualiser * 1000) / (row.price * 1000)) * 100
        : 0;
    return {
      ...row,
      lots,
      capital,
      grossDividend,
      wireFee: WIRE_FEE,
      nhi,
      fee,
      net: targetNet,
      ttmNetYield,
      lastNetYield,
      rank: 0,
      delta: 0,
    };
  });
  const sorted = [...mapped].sort(compareByRequiredCapital);
  return sorted.map((row, i) => {
    const rank = i + 1;
    return { ...row, rank, delta: row.prevRank - rank };
  });
}

function money(n: number): string {
  return Math.round(n).toLocaleString("zh-TW");
}

function MoneyYuan({ amount, className }: { amount: number; className: string }) {
  return (
    <span className={className}>
      <span className="rank-money-digits">{money(amount)}</span>
      <span className="rank-money-unit">元</span>
    </span>
  );
}

function lotsLabel(n: number): string {
  return n.toFixed(1);
}

/** 代號欄：與 blog `tickerStack` 同結構（Yahoo／watchlist 常見雙行＋名稱 nowrap，不靠 pre-line）。 */
function RankTickerCell({ ticker, name }: { ticker: string; name: string }) {
  return (
    <span className="rank-ticker-stack">
      <span className="rank-ticker-code">{ticker}</span>
      <span className="rank-ticker-name">{name}</span>
    </span>
  );
}

const RANK_TABLE_HEADERS: { id: string; label: string }[] = [
  { id: "rank", label: "排行" },
  { id: "ticker", label: "代號" },
  { id: "stockDiv", label: "股利" },
  { id: "cashDiv", label: "股息" },
  { id: "capital", label: "月領1萬本金" },
  { id: "wireFee", label: "匯費" },
  { id: "nhi", label: "二代健保" },
  { id: "fee", label: "手續費" },
  { id: "net", label: "實領" },
  { id: "prevRank", label: "上期排行" },
  { id: "delta", label: "升降" },
  { id: "freq", label: "頻率" },
  { id: "lastBuy", label: "最後買進日" },
];

/** 手機版獨立表：只渲染這 6 欄（與 blog AFTER_TAX_RANK_MOBILE_PRIMARY_COLS 一致） */
/**
 * 手機欄位（DataTables responsivePriority 概念，但門檻是「量出來」不是寫死 px）：
 * - 一律留在表上：排行、代號、月領1萬本金、▼（DataTables 的 all / control）
 * - 收進展開的順序（responsivePriority，數字愈大愈先收）：
 *   買進日 → 頻率 → 股息＋股利（同一組，一起收）
 * - 觸發：欄位自然寬加總 > 容器才收一欄；空得出該欄自然寬才放回。
 *   不拿「表格被拉成 100%」當溢位。
 */
const RANK_MOBILE_PRIMARY_IDS = ["rank", "ticker", "stockDiv", "cashDiv", "capital", "freq", "lastBuy"] as const;
type RankMobileColId = (typeof RANK_MOBILE_PRIMARY_IDS)[number];
/* 買進日優先權最低，最先收。股息與股利同一組，cashDiv 收起時 stockDiv 一起收。 */
const RANK_MOBILE_OPTIONAL_ORDER: readonly RankMobileColId[] = ["lastBuy", "freq", "cashDiv"];
/** 代號欄至少要能一行放下「復華台灣科技優息」8 字（11px）＋內距。 */
const RANK_MOBILE_TICKER_MIN_PX = 112;
/** 回復緩衝：收欄門檻 112 不動，放回只多要 8px 防臨界閃動（16 會讓欄卡在門檻下放不回來）。 */
const RANK_MOBILE_RESTORE_GAP_PX = 8;
/** 手機表 th/td 標準左右內距（對應 CSS `padding: 8px 4px`）。 */
const RANK_MOBILE_CELL_PAD_X = 4;
/** 欄位被收起後量不到寬度，用最後一次看到的寬度；初值為經驗值。 */
const RANK_MOBILE_OPTIONAL_FALLBACK_PX: Record<string, number> = {
  freq: 48,
  cashDiv: 56,
  stockDiv: 48,
  lastBuy: 60,
};

/** 手機表頭縮寫（只改顯示字，不改欄位 id）。 */
const RANK_MOBILE_HEADER_LABEL: Partial<Record<RankMobileColId, string>> = {
  lastBuy: "買進日",
};

const RANK_MOBILE_HEADERS = RANK_MOBILE_PRIMARY_IDS.map((id) => {
  const h = RANK_TABLE_HEADERS.find((x) => x.id === id);
  if (!h) throw new Error(`[canvas-rank] missing mobile header: ${id}`);
  return {
    id: h.id,
    label: RANK_MOBILE_HEADER_LABEL[id] ?? h.label,
  };
});

function rankMobileHiddenCols(hiddenCount: number): ReadonlySet<RankMobileColId> {
  const hidden = new Set<RankMobileColId>(RANK_MOBILE_OPTIONAL_ORDER.slice(0, hiddenCount));
  if (hidden.has("cashDiv")) hidden.add("stockDiv");
  return hidden;
}

/** 手機日期：同年榜單省略年份，"2026-08-18" → "08/18"；無日期維持 "—"。 */
function mobileDateLabel(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[2]}/${m[3]}`;
}

const RANK_MOBILE_DETAIL: { col: string; label: string }[] = [
  { col: "cashDiv", label: "股息" },
  { col: "freq", label: "頻率" },
  { col: "lastBuy", label: "最後買進日" },
  { col: "net", label: "實領" },
  { col: "stockDiv", label: "股利" },
  { col: "wireFee", label: "匯費" },
  { col: "nhi", label: "二代健保" },
  { col: "fee", label: "手續費" },
  { col: "prevRank", label: "上期排行" },
  { col: "delta", label: "升降" },
];

function rankRowTone(row: Derived): "success" | "warning" | "neutral" {
  if (row.rank === 1) return "success";
  if (row.nhi > 0) return "warning";
  return "neutral";
}

function rankDetailValue(row: Derived, col: string): string {
  switch (col) {
    case "cashDiv":
      return row.lastCashPerUnit.toFixed(2);
    case "freq":
      return row.freq;
    case "lastBuy":
      return row.lastBuy;
    case "net":
      return money(row.net);
    case "stockDiv":
      return row.stockDivPerUnit.toFixed(2);
    case "wireFee":
      return money(row.wireFee);
    case "nhi":
      return row.nhi > 0 ? money(row.nhi) : "—";
    case "fee":
      return money(row.fee);
    case "prevRank":
      return row.prevRank === 0 ? "首期無" : String(row.prevRank);
    case "delta":
      return row.prevRank === 0 ? "—" : deltaLabel(row.delta);
    default:
      return "";
  }
}

/** 手機專用：展開鈕獨立一欄、固定最右；桌機表沒有這欄。 */
function renderRankMobileExpandCell(row: Derived, expanded: boolean, onToggle: () => void) {
  return (
    <td key="expand" data-col="expand" className="rank-expand-td">
      <button
        type="button"
        className="rank-row-expand-btn"
        aria-expanded={expanded}
        aria-controls={`rank-detail-${row.ticker}`}
        aria-label={`${row.ticker} 展開稅後明細`}
        onClick={onToggle}
      >
        <span aria-hidden="true">{expanded ? "▲" : "▼"}</span>
      </button>
    </td>
  );
}

function renderRankMobilePrimaryCell(
  col: (typeof RANK_MOBILE_PRIMARY_IDS)[number],
  row: Derived,
  _expanded: boolean,
  _onToggle: () => void,
) {
  const tone = rankRowTone(row);
  switch (col) {
    case "rank":
      return (
        <td data-col="rank">
          <span className="rank-row-dot" data-tone={tone} aria-hidden="true" />
          {row.rank}
        </td>
      );
    case "ticker":
      return (
        <td data-col="ticker" className="rank-ticker-td">
          <RankTickerCell ticker={row.ticker} name={row.name} />
        </td>
      );
    case "capital":
      return (
        <td data-col="capital" className="rank-capital-td">
          <div className="rank-capital-stack">
            <MoneyYuan amount={row.capital} className="rank-capital-amount" />
            <span className="rank-capital-lots">{lotsLabel(row.lots)} 張</span>
          </div>
        </td>
      );
    case "cashDiv":
      return <td data-col="cashDiv">{row.lastCashPerUnit.toFixed(2)}</td>;
    case "stockDiv":
      return <td data-col="stockDiv">{row.stockDivPerUnit.toFixed(2)}</td>;
    case "freq":
      return <td data-col="freq">{row.freq}</td>;
    case "lastBuy":
      return (
        <td data-col="lastBuy" title={row.lastBuy}>
          {mobileDateLabel(row.lastBuy)}
        </td>
      );
    default:
      return null;
  }
}

/** 展開後沿用同一組欄，排成第二列、第三列，不再另開一塊明細卡。 */
function renderRankMobileFollowRows(
  row: Derived,
  expanded: boolean,
  rowClass: string,
  mobileVisibleIds: readonly RankMobileColId[],
  hiddenCols: ReadonlySet<RankMobileColId>,
) {
  const fields = RANK_MOBILE_DETAIL.filter(
    ({ col }) =>
      !RANK_MOBILE_OPTIONAL_ORDER.includes(col as RankMobileColId) ||
      hiddenCols.has(col as RankMobileColId),
  );
  const valueSlots = mobileVisibleIds.filter((id) => id !== "rank");
  const perRow = Math.max(valueSlots.length, 1);
  const chunks: { col: string; label: string }[][] = [];
  for (let i = 0; i < fields.length; i += perRow) chunks.push(fields.slice(i, i + perRow));

  return chunks.map((chunk, chunkIndex) => (
    <tr
      key={`${row.ticker}-follow-${chunkIndex}`}
      id={chunkIndex === 0 ? `rank-detail-${row.ticker}` : undefined}
      className={`rank-mobile-follow-row ${rowClass}`}
      data-expanded={expanded ? "true" : "false"}
    >
      {mobileVisibleIds.map((colId) => {
        if (colId === "rank") return <td key="rank" data-col="rank" />;
        const field = chunk[valueSlots.indexOf(colId)];
        return (
          <td key={colId} data-col={colId}>
            {field ? (
              <span className="rank-follow-stack">
                <span className="rank-follow-label">{field.label}</span>
                <span className="rank-follow-value">{rankDetailValue(row, field.col)}</span>
              </span>
            ) : null}
          </td>
        );
      })}
      <td key="expand" data-col="expand" />
    </tr>
  ));
}

/** 真手機：裝置螢幕 ≤768 CSS px（含 DevTools 裝置模擬）。 */
const RANK_TABLE_MOBILE_MAX_PX = 768;
/** 桌機把視窗／Canvas 面板拉到很窄：≤600 才切手機版；700 多仍是桌機 13 欄橫滑。 */
const RANK_TABLE_NARROW_VIEWPORT_PX = 600;

function readRankTableIsMobile(_shell: HTMLElement | null): boolean {
  if (typeof window === "undefined") return false;
  const screenW = window.screen?.width ?? 0;
  if (screenW > 0 && screenW <= RANK_TABLE_MOBILE_MAX_PX) return true;
  return window.innerWidth <= RANK_TABLE_NARROW_VIEWPORT_PX;
}

function RankDetailMark({ kind }: { kind: "core" | "div" | "fee" | "rank" }) {
  const common = {
    width: 14,
    height: 14,
    viewBox: "0 0 14 14",
    fill: "none",
    "aria-hidden": true as const,
  };
  if (kind === "core") {
    return (
      <svg {...common}>
        <ellipse cx="7" cy="4.2" rx="4.2" ry="1.6" stroke="currentColor" strokeWidth="1.2" />
        <path d="M2.8 4.2v2.4c0 .9 1.9 1.6 4.2 1.6s4.2-.7 4.2-1.6V4.2" stroke="currentColor" strokeWidth="1.2" />
        <path d="M2.8 6.6v2.3c0 .9 1.9 1.6 4.2 1.6s4.2-.7 4.2-1.6V6.6" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  if (kind === "div") {
    return (
      <svg {...common}>
        <circle cx="7" cy="7" r="5.2" stroke="currentColor" strokeWidth="1.2" />
        <path d="M7 4.2v5.6M4.6 6.1h3.2a1.5 1.5 0 0 1 0 3H5.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "fee") {
    return (
      <svg {...common}>
        <rect x="2.2" y="3.2" width="9.6" height="7.6" rx="1.4" stroke="currentColor" strokeWidth="1.2" />
        <path d="M2.2 6h9.6" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4.2 2.6h5.6v3.1a2.8 2.8 0 0 1-5.6 0V2.6z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.2 3.5H2.7v1a1.5 1.5 0 0 0 1.5 1.5M9.8 3.5h1.5v1a1.5 1.5 0 0 1-1.5 1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 8.6v1.3M5.1 11.2h3.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** 手機只有一種欄位：表上固定排行、代號、股利、股息、月領；頻率與買進日進展開。 */
const RANK_MOBILE_ONE_VERSION_IDS = ["rank", "ticker", "stockDiv", "cashDiv", "capital"] as const;
const RANK_MOBILE_ONE_VERSION_HIDDEN: ReadonlySet<RankMobileColId> = new Set(["freq", "lastBuy"]);

function RankDetailPanels({
  row,
  hiddenCols,
}: {
  row: Derived;
  hiddenCols: ReadonlySet<RankMobileColId>;
}) {
  const yuan = (n: number) => `${money(n)} 元`;
  const empty = (value: string) => value === "—" || value === "首期無";
  const cell = (label: string, value: string, tone?: "net") => (
    <div key={label} className="rank-detail-cell">
      <span className="rank-detail-label">{label}</span>
      <span className={`rank-detail-num${tone === "net" ? " rank-detail-num-net" : ""}${empty(value) ? " rank-detail-num-empty" : ""}`}>
        {value}
      </span>
    </div>
  );
  const divPairHidden = hiddenCols.has("cashDiv");
  const payoutCells = [
    divPairHidden ? cell("股息", row.lastCashPerUnit.toFixed(2)) : null,
    divPairHidden ? cell("股利", row.stockDivPerUnit.toFixed(2)) : null,
    hiddenCols.has("freq") ? cell("頻率", row.freq) : null,
    hiddenCols.has("lastBuy") ? cell("買進日", mobileDateLabel(row.lastBuy)) : null,
  ].filter((item) => item != null);
  return (
        <div className="rank-detail">
          {payoutCells.length > 0 ? (
            <section className="rank-detail-band rank-detail-band-div">
              <div className="rank-detail-head">
                <span className="rank-detail-mark"><RankDetailMark kind="div" /></span>
                <span className="rank-detail-title">配息資訊</span>
              </div>
              <div className="rank-detail-grid">{payoutCells}</div>
            </section>
          ) : null}
          <section className="rank-detail-band rank-detail-band-fee">
            <div className="rank-detail-head">
              <span className="rank-detail-mark"><RankDetailMark kind="fee" /></span>
              <span className="rank-detail-title">費用與實領</span>
            </div>
            <div className="rank-detail-grid">
              {cell("實領金額", yuan(row.net), "net")}
              {cell("匯費", yuan(row.wireFee))}
              {cell("二代健保", row.nhi > 0 ? yuan(row.nhi) : "—")}
              {cell("手續費", yuan(row.fee))}
            </div>
          </section>
          <section className="rank-detail-band rank-detail-band-rank">
            <div className="rank-detail-head">
              <span className="rank-detail-mark"><RankDetailMark kind="rank" /></span>
              <span className="rank-detail-title">排名變化</span>
            </div>
            <div className="rank-detail-grid">
              {cell("上期排行", row.prevRank === 0 ? "首期無" : String(row.prevRank))}
              {cell("升降", row.prevRank === 0 ? "—" : deltaLabel(row.delta))}
            </div>
          </section>
        </div>
  );
}

/** 展開只補這一列沒出現的欄。上面看得到的不重複。 */
function renderRankMediumExpandRow(
  row: Derived,
  expanded: boolean,
  colSpan: number,
  hiddenCols: ReadonlySet<RankMobileColId>,
) {
  return (
    <tr
      key={`${row.ticker}-medium`}
      id={`rank-detail-${row.ticker}`}
      className="rank-tablet-expand-row"
      data-expanded={expanded ? "true" : "false"}
    >
      <td colSpan={colSpan}>
        <RankDetailPanels row={row} hiddenCols={hiddenCols} />
      </td>
    </tr>
  );
}

function RankMobileTopCard({ row, capitalLabel }: { row: Derived; capitalLabel: string }) {
  const place = row.rank <= 1 ? "1" : row.rank === 2 ? "2" : "3";
  const deltaDir = row.prevRank === 0 ? "flat" : row.delta > 0 ? "up" : row.delta < 0 ? "down" : "flat";
  const deltaText = row.prevRank === 0 ? "首期無" : deltaLabel(row.delta);
  const prevText = row.prevRank === 0 ? "" : `上期 ${row.prevRank}`;
  const payout: { label: string; value: string; net?: boolean }[] = [
    { label: "股利", value: row.stockDivPerUnit.toFixed(2) },
    { label: "股息", value: row.lastCashPerUnit.toFixed(2) },
    { label: "頻率", value: row.freq },
    { label: "買進日", value: mobileDateLabel(row.lastBuy) },
  ];
  const costs: { label: string; value: string; net?: boolean }[] = [
    { label: "實領", value: money(row.net), net: true },
    { label: "匯費", value: money(row.wireFee) },
    { label: "二代健保", value: row.nhi > 0 ? money(row.nhi) : "—" },
    { label: "手續費", value: money(row.fee) },
  ];
  const group = (
    kind: "div" | "fee",
    fields: { label: string; value: string; net?: boolean }[],
  ) => (
    <section key={kind} className={`rank-top-group rank-top-group-${kind}`}>
      <div className="rank-top-group-grid">
        {fields.map((field) => (
          <span key={field.label} className="rank-top-field">
            <span className="rank-top-field-label">{field.label}</span>
            <span className={`rank-top-field-value${field.net ? " rank-top-field-net" : ""}`}>
              {field.value}
            </span>
          </span>
        ))}
      </div>
    </section>
  );
  return (
    <article key={row.ticker} className="rank-top-card" data-place={place}>
      <div className="rank-top-card-head">
        <span className="rank-top-medal" aria-label={`第 ${row.rank} 名`}>{row.rank}</span>
        <div className="rank-top-id">
          <div className="rank-top-id-line">
            <span className="rank-top-code">{row.ticker}</span>
            <span className={`rank-top-delta rank-top-delta-${deltaDir}`}>{deltaText}</span>
            {prevText ? <span className="rank-top-prev">{prevText}</span> : null}
          </div>
          <span className="rank-top-name">{row.name}</span>
        </div>
        <div className="rank-top-hero">
          <span className="rank-top-hero-label">{capitalLabel}</span>
          <span className="rank-top-hero-line">
            <MoneyYuan amount={row.capital} className="rank-top-hero-num" />
            <span className="rank-top-hero-sub">{lotsLabel(row.lots)} 張</span>
          </span>
        </div>
      </div>
      <div className="rank-top-card-body">
        {group("div", payout)}
        {group("fee", costs)}
      </div>
    </article>
  );
}

function dividendMonthsForFreq(freq: Freq): number[] {
  if (freq === "月") return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  if (freq === "季") return [3, 6, 9, 12];
  if (freq === "半年") return [6, 12];
  return [6];
}

function quick4BuyFee(amount: number): number {
  if (amount <= 0) return 0;
  return Math.max(20, Math.round(amount * 0.001425));
}

/** 與第 4 台相同口徑：20% 級距、54C 全計、8.5% 抵減、單筆 2 萬才扣二代健保。 */
function quick4AfterTaxNet(gross: number, periodsPerYear: number): number {
  if (gross <= 0) return 0;
  if (gross < 20000) return gross;
  const credit = Math.min(gross * 0.085, 80000 / Math.max(1, periodsPerYear));
  const tax = Math.max(0, gross * 0.2 - credit);
  const nhi2 = gross * 0.0211;
  return Math.max(0, gross - tax - nhi2);
}

function projectQuick4(row: Derived, basis: RankBasis, monthly: number, years: number) {
  const annualCash =
    basis === "ttm" && row.ttmCashPerUnit > 0
      ? row.ttmCashPerUnit
      : row.lastCashPerUnit * payoutsPerYear(row.freq);
  const annualPct = row.price > 0 ? (annualCash / row.price) * 100 : 0;
  const months = dividendMonthsForFreq(row.freq);
  const annualRate = Math.min(99, Math.max(0, annualPct)) / 100;
  const add = Math.max(0, monthly - quick4BuyFee(monthly));
  let balance = 0;
  let lastDividendMonth = -1;
  const totalMonths = Math.max(1, Math.round(years) * 12);
  let lastNet = 0;
  for (let monthIndex = 0; monthIndex < totalMonths; monthIndex++) {
    const calMonth = (monthIndex % 12) + 1;
    balance += add;
    if (months.includes(calMonth)) {
      const since = lastDividendMonth < 0 ? monthIndex + 1 : monthIndex - lastDividendMonth;
      const gross = balance * annualRate * (since / 12);
      lastNet = quick4AfterTaxNet(gross, months.length);
      lastDividendMonth = monthIndex;
    }
  }
  const periodGross = balance * annualRate * (12 / months.length / 12);
  let afterTaxAnnual = 0;
  for (let i = 0; i < months.length; i++) afterTaxAnnual += quick4AfterTaxNet(periodGross, months.length);
  return {
    balanceEnd: Math.round(balance),
    lastNet: Math.round(lastNet),
    avgMonthly: Math.round(afterTaxAnnual / 12),
  };
}

function RankQuick4Panel({ row, basis }: { row: Derived; basis: RankBasis }) {
  const [monthlyText, setMonthlyText] = useCanvasState(`quick4-monthly-${row.ticker}`, "20000");
  const [yearsText, setYearsText] = useCanvasState(`quick4-years-${row.ticker}`, "20");
  const monthly = Math.max(0, Math.round(Number(monthlyText.replace(/,/g, "")) || 0));
  const years = Math.min(40, Math.max(1, Math.round(Number(yearsText) || 1)));
  const result = projectQuick4(row, basis, monthly, years);
  return (
    <div className="rank-quick4-panel" data-quick4-code={row.ticker}>
      <div className="rank-quick4-fields">
        <label>
          <span>代號</span>
          <TextInput value={row.ticker} disabled />
        </label>
        <label>
          <span>每月投入</span>
          <TextInput value={monthlyText} onChange={setMonthlyText} />
        </label>
        <label>
          <span>年數</span>
          <TextInput value={yearsText} onChange={setYearsText} />
        </label>
      </div>
      <div className="rank-quick4-stats">
        <Stat value={money(result.balanceEnd)} label="期末資產（元）" />
        <Stat value={money(result.avgMonthly)} label="平均每月稅後（元）" />
        <Stat value={money(result.lastNet)} label="最後一期稅後（元）" />
      </div>
    </div>
  );
}

function RankSplitNote({ rows }: { rows: Derived[] }) {
  const top = rows.slice(0, 3);
  if (top.length === 0 || rows.length <= 3) return null;
  if (top[0].ticker === "00929") {
    return (
      <p className="rank-split-note">
        這一期 00929 復華台灣科技優息排最前面，是因為 6 月 29 日換股之後，8 月仍配 0.38 元。當時買進鴻海、廣達、緯創，以及中華電、台灣大、遠傳，並賣出台積電、聯發科。
      </p>
    );
  }
  const lead = top.map((row) => `${row.ticker} ${row.name}`).join("、");
  return (
    <p className="rank-split-note">這一期第 1 名到第 3 名是 {lead}。</p>
  );
}

/** 桌機欄是固定積木。預設 80；下面這幾欄照指定寬。 */
function rankDeskBrickPx(id: string): number {
  if (id === "rank") return 50;
  if (id === "ticker") return 140;
  if (id === "stockDiv" || id === "cashDiv") return 64;
  if (id === "capital") return 124;
  if (id === "net") return 90;
  if (id === "prevRank") return 90;
  if (id === "lastBuy") return 120;
  return 80;
}

function RankReportResponsiveTable({
  rows,
  capitalLabel,
  monthlyText,
  onMonthlyText,
}: {
  rows: Derived[];
  capitalLabel: string;
  monthlyText: string;
  onMonthlyText: (value: string) => void;
}) {
  const [expandedTicker, setExpandedTicker] = useCanvasState(
    "rank-mobile-expand-v1",
    "",
  );
  const [layoutShell, setLayoutShell] = useState<HTMLDivElement | null>(null);
  const [isMobileLayout, setIsMobileLayout] = useState(() =>
    readRankTableIsMobile(null),
  );

  const layoutShellRef = useCallback((el: HTMLDivElement | null) => {
    setLayoutShell(el);
    setIsMobileLayout(readRankTableIsMobile(el));
  }, []);

  useEffect(() => {
    if (!layoutShell) return;
    const read = () => setIsMobileLayout(readRankTableIsMobile(layoutShell));
    read();
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("resize", read);
    };
  }, [layoutShell]);

  /* 手機表：量代號欄實際寬度，決定收幾個可讓位欄（頻率 → 股息 → 買進日）。 */
  const [mobileTable, setMobileTable] = useState<HTMLTableElement | null>(null);
  const [hiddenCount, setHiddenCount] = useState(0);
  const optionalWidthRef = useRef<Record<string, number>>({ ...RANK_MOBILE_OPTIONAL_FALLBACK_PX });

  useEffect(() => {
    if (!isMobileLayout || !mobileTable) return;
    const measure = () => {
      const tickerTh = mobileTable.querySelector<HTMLElement>('thead th[data-col="ticker"]');
      if (!tickerTh) return;
      for (const id of RANK_MOBILE_OPTIONAL_ORDER) {
        const th = mobileTable.querySelector<HTMLElement>(`thead th[data-col="${id}"]`);
        if (!th) continue;
        // 倒數第二欄身上有 nth-last-child(2) 的 12px 右內距；量「標準內距」下的寬，門檻才不會被灌水
        const padR = parseFloat(getComputedStyle(th).paddingRight) || RANK_MOBILE_CELL_PAD_X;
        optionalWidthRef.current[id] =
          th.getBoundingClientRect().width - padR + RANK_MOBILE_CELL_PAD_X;
      }
      const stockTh = mobileTable.querySelector<HTMLElement>('thead th[data-col="stockDiv"]');
      if (stockTh) {
        const padR = parseFloat(getComputedStyle(stockTh).paddingRight) || RANK_MOBILE_CELL_PAD_X;
        optionalWidthRef.current.stockDiv =
          stockTh.getBoundingClientRect().width - padR + RANK_MOBILE_CELL_PAD_X;
      }
      const shell = mobileTable.parentElement;
      const shellW = shell?.clientWidth ?? 0;
      const prevInlineWidth = mobileTable.style.width;
      const prevPriority = mobileTable.style.getPropertyPriority("width");
      mobileTable.style.setProperty("width", "max-content", "important");
      const contentW = mobileTable.offsetWidth;
      for (const id of [...RANK_MOBILE_OPTIONAL_ORDER, "stockDiv" as const]) {
        const th = mobileTable.querySelector<HTMLElement>(`thead th[data-col="${id}"]`);
        if (!th) continue;
        optionalWidthRef.current[id] = Math.ceil(th.getBoundingClientRect().width);
      }
      if (prevInlineWidth) mobileTable.style.setProperty("width", prevInlineWidth, prevPriority);
      else mobileTable.style.removeProperty("width");
      const tickerW = tickerTh.getBoundingClientRect().width;
      setHiddenCount((prev) => {
        const contentOverflow = shellW > 0 && contentW > shellW + 1;
        if (
          (contentOverflow || tickerW < RANK_MOBILE_TICKER_MIN_PX) &&
          prev < RANK_MOBILE_OPTIONAL_ORDER.length
        ) {
          return prev + 1;
        }
        if (prev > 0 && tickerW >= RANK_MOBILE_TICKER_MIN_PX) {
          const next = RANK_MOBILE_OPTIONAL_ORDER[prev - 1];
          let colW =
            optionalWidthRef.current[next] ?? RANK_MOBILE_OPTIONAL_FALLBACK_PX[next] ?? 56;
          if (next === "cashDiv") {
            colW += optionalWidthRef.current.stockDiv ?? RANK_MOBILE_OPTIONAL_FALLBACK_PX.stockDiv ?? 48;
          }
          if (shellW > 0 && contentW + colW + RANK_MOBILE_RESTORE_GAP_PX <= shellW) {
            return prev - 1;
          }
        }
        return prev;
      });
    };
    measure();
    const target = mobileTable.parentElement ?? mobileTable;
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(target);
    return () => ro.disconnect();
    // hiddenCount 在 deps：每收／放一欄後重量一次，讓 0→1→2 能連續走完
  }, [isMobileLayout, mobileTable, hiddenCount]);

  return (
    <div
      ref={layoutShellRef}
      className="rank-report-table-shell"
      data-rank-layout={isMobileLayout ? "mobile" : "desktop"}
      style={
        isMobileLayout
          ? undefined
          : {
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              overflow: "hidden",
            }
      }
    >
      {!isMobileLayout ? (
      <div className="rank-desk-stack">
      {[rows.slice(0, 3), rows.slice(3)].map((list, blockIndex) =>
        list.length === 0 ? null : (
          <div key={blockIndex === 0 ? "top" : "rest"}>
            {blockIndex === 1 ? <RankSplitNote rows={rows} /> : null}
      <div
        className="rank-desk-fit"
        role="region"
        aria-label="稅後配息排行"
        tabIndex={0}
        style={{
          display: "block",
          width: "100%",
          maxWidth: "100%",
          minWidth: "0px",
          overflowX: "hidden",
          overflowY: "hidden",
          boxSizing: "border-box",
          border: "1px solid #e7e5e4",
          borderRadius: "8px",
          background: "#fff",
        }}
      >
        <table
          style={{
            tableLayout: "fixed",
            width: "max-content",
            minWidth: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr style={{ background: "#fafaf9" }}>
              {RANK_TABLE_HEADERS.map((h) => {
                const colWidth = `${rankDeskBrickPx(h.id)}px`;
                return (
                  <th
                    key={h.id}
                    scope="col"
                    className={`col-${h.id}`}
                    style={{
                      width: colWidth,
                      minWidth: colWidth,
                      maxWidth: colWidth,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "clip",
                      padding: "12px 8px",
                      textAlign: h.id === "ticker" ? "left" : h.id === "rank" ? "center" : "right",
                      fontSize: "0.9375rem",
                      borderBottom: "1px solid #e7e5e4",
                      color: "#1c1917",
                      boxSizing: "border-box",
                    }}
                  >
                    {h.id === "capital" ? capitalLabel : h.label}
                  </th>
                );
              })}
              <th aria-hidden="true" style={{ width: "24px", minWidth: "24px", maxWidth: "24px", borderBottom: "1px solid #e7e5e4", padding: 0 }} />
            </tr>
          </thead>
          <tbody>
            {list.map((row, rowIndex) => {
              const tone = rankRowTone(row);
              const deskCell = (id: string, align: "left" | "right" | "center") => {
                const colWidth = `${rankDeskBrickPx(id)}px`;
                return {
                  width: colWidth,
                  minWidth: colWidth,
                  maxWidth: colWidth,
                  whiteSpace: "nowrap" as const,
                  overflow: "hidden" as const,
                  textOverflow: "clip" as const,
                  padding: "12px 8px",
                  textAlign: align,
                  fontSize: "0.9375rem",
                  borderBottom: "1px solid #e7e5e4",
                  color: "#1c1917",
                  boxSizing: "border-box" as const,
                };
              };
              return (
                <tr key={row.ticker} style={{ background: rowIndex % 2 === 1 ? "#fafaf9" : "#fff" }}>
                  <td className="col-rank" style={deskCell("rank", "center")}>
                    <span className="rank-row-dot" data-tone={tone} aria-hidden="true" />
                    {row.rank}
                  </td>
                  <td className="col-ticker" style={deskCell("ticker", "left")}>
                    <RankTickerCell ticker={row.ticker} name={row.name} />
                  </td>
                  <td className="col-stockDiv" style={deskCell("stockDiv", "right")}>{row.stockDivPerUnit.toFixed(2)}</td>
                  <td className="col-cashDiv" style={deskCell("cashDiv", "right")}>{row.lastCashPerUnit.toFixed(2)}</td>
                  <td className="col-capital" style={deskCell("capital", "right")}>
                    <div className="rank-capital-stack">
                      <MoneyYuan amount={row.capital} className="rank-capital-amount" />
                      <span className="rank-capital-lots">{lotsLabel(row.lots)} 張</span>
                    </div>
                  </td>
                  <td className="col-wireFee" style={deskCell("wireFee", "right")}>{money(row.wireFee)}</td>
                  <td className="col-nhi" style={deskCell("nhi", "right")}>{row.nhi > 0 ? money(row.nhi) : "—"}</td>
                  <td className="col-fee" style={deskCell("fee", "right")}>{money(row.fee)}</td>
                  <td className="col-net" style={deskCell("net", "right")}>{money(row.net)}</td>
                  <td className="col-prevRank" style={deskCell("prevRank", "right")}>
                    {row.prevRank === 0 ? "首期無" : String(row.prevRank)}
                  </td>
                  <td className="col-delta" style={deskCell("delta", "right")}>
                    {row.prevRank === 0 ? "—" : deltaLabel(row.delta)}
                  </td>
                  <td className="col-freq" style={deskCell("freq", "right")}>{row.freq}</td>
                  <td className="col-lastBuy" style={deskCell("lastBuy", "right")}>{row.lastBuy}</td>
                  <td aria-hidden="true" style={{ width: "24px", minWidth: "24px", maxWidth: "24px", borderBottom: "1px solid #e7e5e4", padding: 0 }} />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
          </div>
        ),
      )}
      </div>
      ) : (
      <div className="rank-mobile-board">
        <div className="rank-mobile-top-cards">
          {rows.slice(0, 3).map((row) => RankMobileTopCard({ row, capitalLabel }))}
        </div>
        {rows.length > 3 ? <RankSplitNote rows={rows} /> : null}
        {rows.length > 3 ? (
      <div className="rank-report-table-scroll rank-report-mobile-scroll">
        <table
          ref={setMobileTable}
          className="rank-report-data-table rank-report-mobile-table"
          data-hidden-optional="0"
        >
          <thead>
            <tr>
              {RANK_MOBILE_ONE_VERSION_IDS.map((id) => {
                const header = RANK_TABLE_HEADERS.find((h) => h.id === id);
                return (
                  <th key={id} data-col={id} scope="col">
                    {id === "capital" ? capitalLabel : (header?.label ?? id)}
                  </th>
                );
              })}
              <th data-col="expand" scope="col" aria-label="展開明細" />
            </tr>
          </thead>
          <tbody>
            {rows.slice(3).flatMap((row, index) => {
              const expanded = expandedTicker === row.ticker;
              const rowIndex = index + 3;
              const rowClass =
                rowIndex % 2 === 1 ? "rank-data-row rank-data-row-alt" : "rank-data-row";
              return [
                <tr key={row.ticker} className={rowClass}>
                  {RANK_MOBILE_ONE_VERSION_IDS.map((col) =>
                    renderRankMobilePrimaryCell(col, row, expanded, () =>
                      setExpandedTicker(expanded ? "" : row.ticker),
                    ),
                  )}
                  {renderRankMobileExpandCell(row, expanded, () =>
                    setExpandedTicker(expanded ? "" : row.ticker),
                  )}
                </tr>,
                renderRankMediumExpandRow(
                  row,
                  expanded,
                  RANK_MOBILE_ONE_VERSION_IDS.length + 1,
                  RANK_MOBILE_ONE_VERSION_HIDDEN,
                ),
              ];
            })}
          </tbody>
        </table>
      </div>
        ) : null}
      </div>
      )}
    </div>
  );
}

function deltaLabel(d: number): string {
  if (d > 0) return `+${d}`;
  if (d < 0) return `${d}`;
  return "0";
}

function lightText(color: string) {
  return { color, fontSize: 17, lineHeight: 1.7 };
}

export default function AfterTaxDividendReportTemplate() {
  const t = canvasTokensLight;
  const [section, setSection] = useCanvasState<ReportSection>(
    "report-section-v1",
    "total-rank",
  );
  const [basis, setBasis] = useCanvasState<RankBasis>("report-basis", "ttm");
  const [monthlyText, setMonthlyText] = useCanvasState("rank-monthly-target-text", "10000");
  const [monthlyTarget, setMonthlyTarget] = useCanvasState("rank-monthly-target", DEFAULT_MONTHLY_NET);
  const [yearInput, setYearInput] = useCanvasState("rank-year-v6", "2026");
  const [monthInput, setMonthInput] = useCanvasState("rank-month-v6", "8");
  const [viewYear, setViewYear] = useCanvasState("rank-view-year-v7", 2026);
  const [viewMonth, setViewMonth] = useCanvasState("rank-view-month-v7", 8);
  const [openMenu, setOpenMenu] = useCanvasState<"year" | "month" | "">("rank-open-v8", "");

  const publishedIssue = getPublishedIssue(viewYear, viewMonth);
  const sectionRelease = sectionPublishAt(viewYear, viewMonth, section);
  const sectionOpen = RANK_SECTION_PREVIEW_NOW.getTime() >= sectionRelease.getTime();
  const sectionReleaseLabel = formatSectionPublishLabel(sectionRelease);

  const draftYearForMenu = useMemo(() => {
    const v = evaluateNumericCell(yearInput);
    return v === null ? viewYear : Math.round(v);
  }, [yearInput, viewYear]);

  const yearMenuOptions = useMemo(
    () => getYearMenuOptions(draftYearForMenu),
    [draftYearForMenu],
  );

  const page: {
    background: string;
    color: string;
    padding: number;
    minHeight: string;
    width: string;
    maxWidth: string;
    minWidth: number;
    boxSizing: "border-box";
    overflowX: "visible";
  } = {
    background: t.bg.editor,
    color: t.text.primary,
    padding: 24,
    minHeight: "100%",
    width: "100%",
    maxWidth: "100vw",
    minWidth: 0,
    boxSizing: "border-box",
    overflowX: "visible",
  };

  const showBasisTabs =
    section === "total-rank" || section === "stock-rent";

  const monthEtfRank = useMemo(() => deriveAll(ETF_SNAPSHOT, "ttm"), []);

  const rows = useMemo(() => {
    if (section === "ex-div-preview") {
      return [];
    }
    if (section === "etf-focus-pk") {
      const ranked = deriveAll(ETF_SNAPSHOT, basis);
      return ETF_FOCUS_PK_TICKERS.flatMap((ticker) => {
        const row = ranked.find((r) => r.ticker === ticker);
        return row ? [row] : [];
      }).sort(compareByRequiredCapital);
    }
    const snapshot = section === "stock-rent" ? STOCK_SNAPSHOT : ETF_SNAPSHOT;
    const ranked = deriveAll(snapshot, basis);
    if (section === "total-rank") {
      return ranked.slice(0, TOTAL_RANK_TOP_N).map((row, i) => ({
        ...row,
        rank: i + 1,
      }));
    }
    return ranked;
  }, [section, basis, monthEtfRank]);

  const shownRows = useMemo(
    () => withMonthlyTarget(rows, basis, monthlyTarget),
    [rows, basis, monthlyTarget],
  );
  const capitalLabel = capitalColumnLabel(monthlyTarget);

  function onMonthlyText(next: string) {
    setMonthlyText(next);
    const plain = next.replace(/[,，]/g, "").trim();
    if (!/^\d+$/.test(plain)) return;
    const n = Math.round(Number(plain));
    if (n >= 1000 && n <= 500_000) setMonthlyTarget(n);
  }

  function commitMonthlyText(raw: string) {
    const value = evaluateNumericCell(raw.replace(/[,，]/g, ""));
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

  const quick4Lead =
    section === "ex-div-preview" ? (deriveAll(ETF_SNAPSHOT, basis)[0] ?? null) : (rows[0] ?? null);

  const conclusionLead = monthEtfRank[0];
  const nhiHits = monthEtfRank.filter((r) => r.nhi > 0).length;

  const moverRows = [...rows]
    .filter((r) => r.prevRank !== 0 && r.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .map((r) => [
      r.ticker,
      String(r.prevRank),
      String(r.rank),
      deltaLabel(r.delta),
      r.freq,
    ]);

  function revertPickerToView() {
    setYearInput(String(viewYear));
    setMonthInput(String(viewMonth));
  }

  function applyPeriodValues(nextYear: number, nextMonth: number) {
    setOpenMenu("");
    if (
      !Number.isInteger(nextYear) ||
      !Number.isInteger(nextMonth) ||
      nextMonth < 1 ||
      nextMonth > 12 ||
      nextYear < 1990 ||
      nextYear > 2100
    ) {
      revertPickerToView();
      return;
    }
    const y = Math.round(nextYear);
    const m = Math.round(nextMonth);
    setYearInput(String(y));
    setMonthInput(String(m));
    const issue = getPublishedIssue(y, m);
    if (!issue) {
      return;
    }
    setViewYear(y);
    setViewMonth(m);
  }

  function applyDraft() {
    const yearValue = evaluateNumericCell(yearInput);
    const monthValue = evaluateNumericCell(monthInput);
    if (yearValue === null || monthValue === null) {
      revertPickerToView();
      return;
    }
    setOpenMenu("");
    const normalized = normalizeRankingYearMonth(yearValue, monthValue);
    if (!normalized) {
      revertPickerToView();
      return;
    }
    setYearInput(String(normalized.year));
    setMonthInput(String(normalized.month));
    applyPeriodValues(normalized.year, normalized.month);
  }

  function isSelectablePeriod(year: number, month: number) {
    return getPublishedIssue(year, month) !== null;
  }

  const pickerRootRef = useRef<HTMLDivElement | null>(null);
  const yearInputRef = useRef<HTMLInputElement | null>(null);
  const monthInputRef = useRef<HTMLInputElement | null>(null);

  function toggleYearMenu() {
    setOpenMenu(openMenu === "year" ? "" : "year");
  }

  function toggleMonthMenu() {
    setOpenMenu(openMenu === "month" ? "" : "month");
  }

  function onYearUnitPointerDown(event: {
    target: EventTarget | null;
    preventDefault: () => void;
  }) {
    const target = event.target as HTMLElement;
    if (target.closest?.("[role='listbox']")) return;
    if (target === yearInputRef.current) return;
    event.preventDefault();
    toggleYearMenu();
  }

  function onMonthUnitPointerDown(event: {
    target: EventTarget | null;
    preventDefault: () => void;
  }) {
    const target = event.target as HTMLElement;
    if (target.closest?.("[role='listbox']")) return;
    if (target === monthInputRef.current) return;
    event.preventDefault();
    toggleMonthMenu();
  }

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (pickerRootRef.current?.contains(event.target as Node)) return;
      setOpenMenu("");
      applyDraft();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenu("");
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  });

  const controlBox = {
    display: "inline-flex",
    alignItems: "center",
    height: 28,
    border: 0,
    background: "transparent",
  };
  const digitCol = {
    position: "relative" as const,
    display: "flex",
    alignItems: "center",
    height: 28,
  };
  const yearFieldCluster = {
    position: "relative" as const,
    display: "inline-flex",
    alignItems: "center",
    gap: 0,
  };
  const monthFieldCluster = yearFieldCluster;
  const yearDigitCol = { ...digitCol, width: "5ch" };
  const monthDigitCol = { ...digitCol, width: "calc(2ch + 1.2rem)", boxSizing: "border-box" as const };
  const yearField = {
    boxSizing: "border-box" as const,
    width: "100%",
    height: 28,
    border: 0,
    borderBottom: "1px solid transparent",
    margin: 0,
    background: "transparent",
    color: t.text.primary,
    fontSize: 15,
    fontVariantNumeric: "tabular-nums" as const,
    textAlign: "left" as const,
    padding: 0,
    minWidth: 0,
    outline: "none",
    cursor: "text",
    userSelect: "text" as const,
  };
  const monthField = {
    ...yearField,
    textAlign: "right" as const,
    padding: "0 10px",
  };
  const suffix = {
    color: t.text.primary,
    fontSize: 15,
    lineHeight: 1,
    padding: "0 2px",
  };
  const pickerUnit = {
    position: "relative" as const,
    display: "inline-flex",
    alignItems: "center",
    height: 28,
    cursor: "pointer",
    userSelect: "none" as const,
  };
  const chevronCol = {
    position: "relative" as const,
    flex: "0 0 18px",
    width: 18,
    minWidth: 18,
    height: 28,
    pointerEvents: "none" as const,
  };
  const chevron = {
    position: "absolute" as const,
    left: "50%",
    top: "50%",
    width: 0,
    height: 0,
    borderLeft: "3.5px solid transparent",
    borderRight: "3.5px solid transparent",
    borderTop: `4px solid ${t.text.tertiary}`,
    transform: "translate(-50%, -40%)",
    pointerEvents: "none" as const,
  };
  const menuBox = {
    position: "absolute" as const,
    left: 0,
    top: 30,
    zIndex: 40,
    margin: 0,
    padding: "4px 0",
    listStyle: "none" as const,
    background: t.bg.editor,
    border: `1px solid ${t.stroke.tertiary}`,
    borderRadius: 4,
    boxShadow: "0 8px 20px rgba(28, 25, 23, 0.12)",
    width: "100%",
    boxSizing: "border-box" as const,
    maxHeight: 256,
    overflow: "auto",
  };
  const menuItem = {
    display: "block",
    width: "100%",
    boxSizing: "border-box" as const,
    margin: 0,
    border: 0,
    background: "transparent",
    color: t.text.primary,
    fontSize: 15,
    fontVariantNumeric: "tabular-nums" as const,
    lineHeight: 1.6,
    textAlign: "left" as const,
    padding: "3px 10px 3px 0",
    cursor: "pointer",
  };
  const monthMenuPanel = {
    ...menuBox,
    width: "100%",
    padding: "3px 10px 4px",
    maxHeight: "none",
    overflow: "visible",
    border: `1px solid ${t.stroke.secondary}`,
    boxShadow: "0 10px 24px rgba(28, 25, 23, 0.16)",
  };
  const monthMenuItem = {
    ...menuItem,
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
    textAlign: "right" as const,
    padding: "1px 0",
  };
  const monthNum = {
    display: "block",
    width: "2ch",
    flexShrink: 0,
    textAlign: "right" as const,
    fontVariantNumeric: "tabular-nums" as const,
  };

  return (
    <div style={page}>
      <style>
        {`
.finance-dashboard-container {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  max-width: 1200px;
  margin: 0 auto;
  padding-left: 16px;
  padding-right: 16px;
}
@media (min-width: 1201px) {
  .finance-dashboard-container {
    max-width: 1250px !important;
    margin: 40px auto !important;
    padding-left: 60px !important;
    padding-right: 60px !important;
  }
}
@media (max-width: 1200px) and (min-width: 1025px) {
  .finance-dashboard-container {
    margin: 30px auto !important;
    padding-left: 24px !important;
    padding-right: 24px !important;
  }
}
@media (max-width: 1024px) {
  .finance-dashboard-container {
    margin: 20px auto !important;
    padding-left: 12px !important;
    padding-right: 12px !important;
  }
}
@media (max-width: 768px) {
  .finance-dashboard-container {
    margin: 10px auto !important;
    padding-left: 4px !important;
    padding-right: 4px !important;
  }
}
.first-row-wrapper {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  width: 100%;
  margin-bottom: 20px;
}
.second-row-wrapper {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
  width: 100%;
  margin-bottom: 12px;
  /* 與主分頁灰底 6px + .tab-btn 左 8px 對齊「總排行」文字起點 */
  padding-left: 14px;
  box-sizing: border-box;
}
.rank-top-hero-one-line {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}
.rank-top-hero-one-line .rank-top-hero-line {
  width: auto;
}
.rank-monthly-target {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 0 auto;
  font-size: 15px;
  line-height: 1.25;
  color: #57534e;
  white-space: nowrap;
}
/* 桌機表才對齊月領欄。769 以下若仍是桌機表（視窗窄、螢幕寬），不要把輸入貼到最右。 */
.finance-dashboard-container:has([data-rank-layout="desktop"]) .second-row-wrapper {
  display: grid;
  grid-template-columns: 319px 124px minmax(0, 1fr);
  align-items: center;
  column-gap: 0;
  padding-left: 0;
}
.finance-dashboard-container:has([data-rank-layout="desktop"]) .second-row-wrapper .data-mode-toggle {
  grid-column: 1;
  padding-left: 14px;
}
.finance-dashboard-container:has([data-rank-layout="desktop"]) .second-row-wrapper .rank-monthly-target {
  grid-column: 2;
  margin: 0;
  justify-self: start;
  padding-left: 26px;
}
.rank-monthly-target-input {
  width: 92px;
  height: 26px;
  box-sizing: border-box;
  margin: 0;
  padding: 0 6px;
  border: 1px solid #d6d3d1;
  border-radius: 6px;
  background: #fff;
  color: #1c1917;
  font-size: 14px;
  line-height: 24px;
  font-variant-numeric: tabular-nums;
}
.rank-report-table-block {
  width: 100%;
  min-width: 0;
}
.rank-report-table-panel {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  width: 100%;
  min-width: 0;
  max-width: 100%;
}
.rank-report-table-shell {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  flex-shrink: 1;
}
.rank-report-table-shell[data-rank-layout="desktop"] {
  display: block !important;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  overflow: hidden !important;
}
.rank-report-table-shell[data-rank-layout="mobile"] {
  width: 100%;
}
.data-mode-toggle {
  display: inline-flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.data-mode-toggle::-webkit-scrollbar {
  display: none;
}
.data-mode-sep {
  color: #d1d5db;
  user-select: none;
  line-height: 1;
  flex-shrink: 0;
}
.data-mode-toggle .mode-item {
  flex: 0 0 auto;
  appearance: none;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 15px;
  font-weight: 400;
  color: #6b7280;
  line-height: 1.45;
  white-space: nowrap;
  transition: color 0.2s ease;
}
.data-mode-toggle .mode-item:hover {
  color: #374151;
}
.data-mode-toggle .mode-item[data-active="true"] {
  color: #111827;
  font-weight: 600;
}
.finance-dashboard-container .tabs-container {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  white-space: nowrap;
}
.finance-dashboard-container .tabs-container::-webkit-scrollbar {
  display: none;
}
.finance-dashboard-container .first-level-tabs {
  display: inline-flex;
  flex: 0 0 auto;
  align-self: flex-start;
  width: auto;
  max-width: 100%;
  background-color: #f3f4f6;
  padding: 6px;
  border-radius: 30px;
  gap: 6px;
  border: none;
  align-items: center;
  flex-wrap: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  white-space: nowrap;
}
.finance-dashboard-container .first-level-tabs::-webkit-scrollbar {
  display: none;
}
.finance-dashboard-container .first-level-tabs .tab-btn {
  flex: 0 0 auto;
  appearance: none;
  margin: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  position: relative;
  white-space: nowrap;
  padding: 8px 18px;
  border-radius: 30px;
  color: #4b5563;
  font-weight: 500;
  font-size: 14px;
  line-height: 1.45;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.finance-dashboard-container .first-level-tabs .tab-btn:not([data-active="true"]):hover {
  background-color: rgba(0, 0, 0, 0.04);
  color: #111827;
}
.finance-dashboard-container .first-level-tabs .tab-btn[data-active="true"] {
  background-color: #ffffff;
  color: #111827;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
}
.finance-dashboard-container .first-level-tabs .tab-btn[data-active="true"]:hover {
  background-color: #ffffff;
  color: #111827;
}
.finance-dashboard-container .first-level-tabs .tab-btn[data-active="true"]::after {
  content: none;
  display: none;
}
.rank-report-conclusion {
  margin: 4px 0 20px;
}
.rank-report-conclusion .conclusion-title {
  margin: 0;
  font-size: 1.625rem;
  line-height: 1.38;
  font-weight: 700;
  color: #1c1917;
}
.rank-report-conclusion .conclusion-body {
  margin: 0;
  font-size: 1.125rem;
  line-height: 1.72;
  color: #292524;
}
.rank-report-table-scroll {
  --rank-sticky-w: 3.25rem;
  width: 100% !important;
  max-width: 100% !important;
  overflow-x: auto !important;
  overflow-y: hidden;
  border: 1px solid #e7e5e4;
  border-radius: 8px;
  background: #fff;
  display: block;
  -webkit-overflow-scrolling: touch;
}
.rank-report-table-scroll table,
.rank-report-table-scroll [role="table"],
.rank-report-table-scroll .rank-report-data-table {
  width: max-content !important;
  min-width: 100% !important;
  max-width: none !important;
  table-layout: auto;
  border-collapse: collapse;
  white-space: nowrap;
  font-size: 0.9375rem;
  line-height: 1.45;
  color: #1c1917;
}
.rank-report-mobile-scroll {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  border: 1px solid #e7e5e4;
  border-radius: 8px;
  background: #fff;
}
.rank-report-table-scroll th,
.rank-report-table-scroll td {
  padding: 12px 8px;
  border-bottom: 1px solid #e7e5e4;
  white-space: nowrap !important;
  text-align: right;
}
.rank-report-table-scroll th:nth-child(1),
.rank-report-table-scroll td:nth-child(1) {
  position: sticky;
  left: 0;
  z-index: 2;
  min-width: var(--rank-sticky-w);
  width: var(--rank-sticky-w);
  text-align: center;
  background: #fff;
  box-shadow: 1px 0 0 #e7e5e4;
}
.rank-report-table-scroll th:nth-child(2),
.rank-report-table-scroll td:nth-child(2) {
  position: sticky;
  left: var(--rank-sticky-w);
  z-index: 2;
  width: auto;
  min-width: max-content;
  text-align: left;
  background: #fff;
  box-shadow: 4px 0 10px -6px rgba(28, 25, 23, 0.12);
  white-space: nowrap;
  line-height: 1.3;
  vertical-align: top;
  padding-left: 8px;
  padding-right: 8px;
}
.rank-ticker-stack {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.3;
  text-align: left;
  width: auto;
  max-width: none;
}
.rank-ticker-code {
  font-weight: 700;
  color: #111827;
  font-size: 15px;
  letter-spacing: 0.5px;
  line-height: 1.3;
}
.rank-ticker-name {
  margin-top: 2px;
  color: #6b7280;
  font-size: 11px;
  font-weight: 400;
  line-height: 1.3;
  white-space: nowrap;
}
.rank-report-table-scroll th:nth-child(3),
.rank-report-table-scroll td:nth-child(3),
.rank-report-table-scroll th:nth-child(4),
.rank-report-table-scroll td:nth-child(4),
.rank-report-table-scroll th:nth-child(6),
.rank-report-table-scroll td:nth-child(6),
.rank-report-table-scroll th:nth-child(7),
.rank-report-table-scroll td:nth-child(7),
.rank-report-table-scroll th:nth-child(8),
.rank-report-table-scroll td:nth-child(8),
.rank-report-table-scroll th:nth-child(9),
.rank-report-table-scroll td:nth-child(9) {
  text-align: right;
  padding-left: 6px;
  padding-right: 8px;
}
.rank-report-table-scroll th:nth-child(10),
.rank-report-table-scroll td:nth-child(10),
.rank-report-table-scroll th:nth-child(11),
.rank-report-table-scroll td:nth-child(11),
.rank-report-table-scroll th:nth-child(12),
.rank-report-table-scroll td:nth-child(12),
.rank-report-table-scroll th:nth-child(13),
.rank-report-table-scroll td:nth-child(13) {
  text-align: center;
  padding-left: 8px;
  padding-right: 8px;
}
.rank-report-table-scroll th:nth-child(5),
.rank-report-table-scroll td:nth-child(5) {
  text-align: right;
  padding-left: 6px;
  padding-right: 8px;
}
.rank-report-table-scroll thead th:nth-child(5) {
  white-space: nowrap !important;
}
.rank-report-table-scroll td:nth-child(5) {
  white-space: normal;
  vertical-align: top;
}
.rank-report-table-scroll thead th {
  vertical-align: middle !important;
  padding-top: 14px;
  padding-bottom: 14px;
  background-color: #f9fafb !important;
}
.rank-report-table-scroll thead th:nth-child(1) {
  position: sticky !important;
  left: 0;
  z-index: 5;
  background-color: #f9fafb !important;
  box-shadow: 1px 0 0 #e7e5e4;
}
.rank-report-table-scroll thead th:nth-child(2) {
  position: sticky !important;
  left: var(--rank-sticky-w);
  z-index: 5;
  background-color: #f9fafb !important;
  box-shadow: 4px 0 10px -6px rgba(28, 25, 23, 0.12);
}
.rank-report-table-scroll tbody tr:nth-child(even) td {
  background: #fafaf9;
}
.rank-report-table-scroll tbody tr:nth-child(odd) td:nth-child(1),
.rank-report-table-scroll tbody tr:nth-child(odd) td:nth-child(2) {
  background: #fff;
}
.rank-report-table-scroll tbody tr:nth-child(even) td:nth-child(1),
.rank-report-table-scroll tbody tr:nth-child(even) td:nth-child(2) {
  background: #fafaf9;
}
.rank-data-row-alt td[data-col="rank"],
.rank-data-row-alt td[data-col="ticker"] {
  background: #fafaf9;
}
.rank-row-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  margin-right: 4px;
  vertical-align: 1px;
}
.rank-row-dot[data-tone="success"] {
  background: #16a34a;
}
.rank-row-dot[data-tone="warning"] {
  background: #d97706;
}
.rank-row-dot[data-tone="neutral"] {
  background: #a8a29e;
}
.rank-ticker-td-inner {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
  width: 100%;
  min-width: 0;
}
.rank-layout-desktop {
  display: block;
  width: 100%;
}
.rank-layout-mobile {
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
}
.rank-row-expand-btn {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  margin: 0;
  padding: 0;
  border: 1px solid #e7e5e4;
  border-radius: 6px;
  background: #fafaf9;
  color: #57534e;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
}
.rank-row-expand-btn:hover {
  background: #f5f5f4;
  color: #1c1917;
}
.rank-mobile-follow-row {
  display: none;
}
.rank-follow-stack {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  line-height: 1.3;
}
.rank-follow-label {
  font-size: 11px;
  font-weight: 500;
  color: #78716c;
}
.rank-follow-value {
  font-size: 14px;
  font-weight: 600;
  color: #1c1917;
}
.rank-capital-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.4;
  text-align: right;
}
.rank-capital-amount,
.rank-top-hero-num {
  font-family: "Microsoft JhengHei UI", "PingFang TC", "Noto Sans TC", sans-serif;
}
.rank-capital-amount {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}
.rank-money-digits,
.rank-money-unit {
  font-family: inherit;
  font-size: 1em;
  font-weight: inherit;
  font-style: inherit;
  line-height: inherit;
  color: inherit;
}
.rank-money-digits {
  font-variant-numeric: tabular-nums;
  letter-spacing: inherit;
}
.rank-money-unit {
  margin-left: 0.2em;
  letter-spacing: 0;
}
.rank-capital-lots {
  margin-top: 2px;
  font-size: 12px;
  font-weight: 400;
  color: #6b7280;
}
.rank-report-data-table td[data-col="capital"],
.rank-report-data-table thead th[data-col="capital"] {
  text-align: right;
}
.rank-report-data-table thead th[data-col="capital"] {
  white-space: nowrap !important;
}
.rank-report-mobile-scroll .rank-report-mobile-table {
  width: 100% !important;
  max-width: 100% !important;
  table-layout: auto;
  font-size: 14px;
  white-space: nowrap;
}
/*
 * 手機表 = 同一張桌機表（同 class：rank-report-table-scroll / rank-report-data-table），
 * 表頭灰、斑馬紋、邊線、sticky 全部沿用；這裡只覆寫「欄寬與裁切」。
 * 欄寬策略：排行／本金／買進日／▼ 貼內容（width:1% + nowrap）。
 * 窄表時代號欄吸收剩餘寬；容器 ≥480px 且欄都還在時，代號改貼名稱，剩餘寬分給股息／頻率／買進日。
 */
.rank-report-mobile-table th,
.rank-report-mobile-table td {
  padding: 8px 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}
.rank-report-mobile-table thead th {
  padding: 10px 4px;
}
/* tbody 夾了明細列，桌機的 nth-child(even) 斑馬紋對不上 → 用 rank-data-row-alt 上色 */
.rank-report-mobile-table tbody tr.rank-data-row td {
  background: #fff !important;
}
.rank-report-mobile-table tbody tr.rank-data-row-alt td {
  background: #fafaf9 !important;
}
/* 手機：排行欄「●1」只需 40px，比桌機 sticky 寬（52px）省 12px 給代號；ticker 的 left 跟著變數走 */
.rank-report-mobile-scroll {
  --rank-sticky-w: 2.5rem;
  container-type: inline-size;
}
.rank-report-mobile-table th[data-col="rank"],
.rank-report-mobile-table td[data-col="rank"] {
  width: var(--rank-sticky-w);
  min-width: var(--rank-sticky-w);
  max-width: var(--rank-sticky-w);
  text-align: center;
  white-space: nowrap;
  padding-left: 2px;
  padding-right: 2px;
}
.rank-report-mobile-table .rank-row-dot {
  margin-right: 3px;
}
.rank-report-mobile-table th[data-col="ticker"],
.rank-report-mobile-table td[data-col="ticker"] {
  left: var(--rank-sticky-w);
  width: 100%;
  max-width: 0;
  min-width: 0;
  text-align: left;
  white-space: normal;
  padding-left: 6px;
}
.rank-report-mobile-table td[data-col="ticker"] .rank-ticker-stack {
  display: flex;
  max-width: 100%;
  min-width: 0;
}
.rank-report-mobile-table td[data-col="ticker"] .rank-ticker-code {
  display: block;
  white-space: nowrap;
}
/* 名稱：最多兩行才截，不在一行就砍字 */
.rank-report-mobile-table td[data-col="ticker"] .rank-ticker-name {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  max-width: 100%;
  overflow: hidden;
  white-space: normal;
  word-break: break-all;
  line-height: 1.3;
}
.rank-report-mobile-table th[data-col="capital"],
.rank-report-mobile-table td[data-col="capital"] {
  width: 1%;
  text-align: right;
  white-space: nowrap;
}
.rank-report-mobile-table th[data-col="lastBuy"],
.rank-report-mobile-table td[data-col="lastBuy"] {
  width: 1%;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  font-variant-numeric: tabular-nums;
  color: #57534e;
}
.rank-report-mobile-table th[data-col="capital"],
.rank-report-mobile-table td[data-col="capital"] {
  vertical-align: middle;
}
/* 桌機 nth-child(5)（本金欄）有 vertical-align:top，手機第 5 欄是頻率 → 這裡明確壓回 middle */
.rank-report-mobile-table th[data-col="cashDiv"],
.rank-report-mobile-table td[data-col="cashDiv"],
.rank-report-mobile-table th[data-col="stockDiv"],
.rank-report-mobile-table td[data-col="stockDiv"] {
  width: 1%;
  text-align: right;
  white-space: nowrap;
  vertical-align: middle;
  font-variant-numeric: tabular-nums;
}
.rank-report-mobile-table th[data-col="freq"],
.rank-report-mobile-table td[data-col="freq"] {
  width: 1%;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  padding-left: 8px;
  padding-right: 8px;
}
/* 股息、股利還在表上時，代號不要撐開，這兩欄才不會被推到月領右邊。 */
.rank-report-mobile-table[data-hidden-optional="0"] th[data-col="ticker"],
.rank-report-mobile-table[data-hidden-optional="0"] td[data-col="ticker"],
.rank-report-mobile-table[data-hidden-optional="1"] th[data-col="ticker"],
.rank-report-mobile-table[data-hidden-optional="1"] td[data-col="ticker"] {
  width: 1%;
  max-width: none;
  min-width: 7.5rem;
  white-space: nowrap;
}
.rank-report-mobile-table[data-hidden-optional="0"] td[data-col="ticker"] .rank-ticker-name,
.rank-report-mobile-table[data-hidden-optional="1"] td[data-col="ticker"] .rank-ticker-name {
  display: block;
  white-space: nowrap;
  word-break: normal;
  -webkit-line-clamp: unset;
}
.rank-report-mobile-table th[data-col="expand"],
.rank-report-mobile-table td[data-col="expand"] {
  position: sticky;
  right: 0;
  z-index: 3;
  width: 1%;
  text-align: right;
  padding-left: 0;
  padding-right: 4px;
  white-space: nowrap;
  vertical-align: middle;
  background: #fff;
}
.rank-report-mobile-table thead th[data-col="expand"] {
  z-index: 4;
  background: #f9fafb;
}
.rank-report-mobile-table tbody tr.rank-data-row td[data-col="expand"] {
  background: #fff !important;
}
.rank-report-mobile-table tbody tr.rank-data-row-alt td[data-col="expand"] {
  background: #fafaf9 !important;
}
/* ▼ 前面那一欄（寬時是買進日、最窄時是本金）多 12px 右內距，數字不貼按鈕 */
.rank-report-mobile-table th:nth-last-child(2),
.rank-report-mobile-table td:nth-last-child(2) {
  padding-right: 12px;
}
/* ▼ 鈕 32→28px、去邊框改純箭頭（圓形 hover 底），視覺變輕；桌機表沒有這欄 */
.rank-report-mobile-table .rank-row-expand-btn {
  width: 1.75rem;
  height: 1.75rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #78716c;
  font-size: 11px;
}
.rank-report-mobile-table .rank-row-expand-btn:hover,
.rank-report-mobile-table .rank-row-expand-btn[aria-expanded="true"] {
  background: #f0efed;
  color: #1c1917;
}
.rank-report-mobile-table .rank-capital-amount {
  font-size: 14px;
}
.rank-report-mobile-table .rank-capital-lots {
  font-size: 11px;
}
.rank-mobile-follow-row[data-expanded="true"] {
  display: table-row;
}
.rank-report-mobile-table tr.rank-mobile-follow-row td {
  padding-top: 6px;
  padding-bottom: 8px;
  white-space: normal;
  overflow: visible;
  text-overflow: unset;
  vertical-align: top;
}
.rank-report-mobile-table tr.rank-mobile-follow-row td[data-col="ticker"] .rank-follow-stack {
  align-items: flex-start;
}
.rank-report-mobile-table tr.rank-mobile-follow-row td[data-col="capital"] .rank-follow-stack,
.rank-report-mobile-table tr.rank-mobile-follow-row td[data-col="cashDiv"] .rank-follow-stack {
  align-items: flex-end;
}
.rank-report-mobile-table tr.rank-mobile-follow-row td[data-col="freq"] .rank-follow-stack,
.rank-report-mobile-table tr.rank-mobile-follow-row td[data-col="lastBuy"] .rank-follow-stack {
  align-items: center;
}
.rank-mobile-board {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
  min-width: 0;
}
.rank-mobile-top-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  min-width: 0;
}
.rank-top-card {
  width: 100%;
  min-width: 0;
  margin: 0;
  border: 1px solid #eceae6;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(28, 25, 23, 0.04);
  overflow: hidden;
}
.rank-top-card[data-place="1"] {
  border-color: #ead9b0;
  background: #fffdf8;
}
.rank-top-card[data-place="2"] {
  background: #fff;
}
.rank-top-card[data-place="3"] {
  border-color: #efe4da;
  background: #fffcf9;
}
.rank-top-card-head {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  align-items: start;
  column-gap: 12px;
  padding: 10px 14px 8px;
}
.rank-top-medal {
  width: 36px;
  height: 36px;
  margin-top: 1px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  font-weight: 700;
  line-height: 1;
}
.rank-top-card[data-place="1"] .rank-top-medal {
  background: #f4e7c3;
  color: #8a6a1f;
}
.rank-top-card[data-place="2"] .rank-top-medal {
  background: #eeeae6;
  color: #44403c;
}
.rank-top-card[data-place="3"] .rank-top-medal {
  background: #f3e6dc;
  color: #7c4a28;
}
.rank-top-id {
  min-width: 0;
}
.rank-top-id-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 8px;
  min-width: 0;
}
.rank-top-code {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: #1c1917;
  line-height: 1.2;
}
.rank-top-name {
  display: block;
  margin-top: 1px;
  font-size: 15px;
  line-height: 1.25;
  color: #57534e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rank-top-delta {
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 14px;
  font-weight: 650;
  line-height: 1.35;
}
.rank-top-delta-up {
  color: #166534;
  background: #eaf6ef;
}
.rank-top-delta-down {
  color: #9a3412;
  background: #fef2e8;
}
.rank-top-delta-flat {
  color: #57534e;
  background: #f5f5f4;
}
.rank-top-prev {
  flex: 0 0 auto;
  font-size: 14px;
  color: #78716c;
}
.rank-top-hero {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1px;
  line-height: 1.2;
  text-align: left;
  white-space: nowrap;
}
.rank-top-hero-label {
  width: 100%;
  font-size: 15px;
  line-height: 1.25;
  color: #57534e;
  text-align: left;
}
.rank-top-hero-line {
  display: flex;
  align-items: baseline;
  justify-content: flex-start;
  width: 100%;
}
.rank-top-hero-num {
  font-size: 22px;
  font-weight: 700;
  color: #1c1917;
  letter-spacing: -0.3px;
}
.rank-top-hero-sub {
  margin-left: 8px;
  padding-left: 8px;
  border-left: 1px solid #e7e5e4;
  font-size: 15px;
  font-weight: 600;
  color: #57534e;
  font-variant-numeric: tabular-nums;
}
.rank-top-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0 12px 10px;
  padding-top: 8px;
  border-top: 1px solid #f0eeec;
}
.rank-top-group {
  border-radius: 10px;
  padding: 8px 10px;
}
.rank-top-group-div {
  background: #f6f4fb;
}
.rank-top-group-fee {
  background: #f3f8f5;
}
.rank-top-group-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px 8px;
}
.rank-top-field {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  min-width: 0;
  text-align: center;
}
.rank-top-field-label {
  font-size: 14px;
  line-height: 1.25;
  color: #57534e;
  white-space: nowrap;
  text-align: center;
}
.rank-top-field-value {
  font-size: 16px;
  font-weight: 650;
  line-height: 1.3;
  color: #1c1917;
  white-space: nowrap;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.rank-top-field-net {
  color: #16803d;
}
.rank-tablet-expand-row {
  display: none;
}
.rank-tablet-expand-row[data-expanded="true"] {
  display: table-row;
}
.rank-report-table-scroll tr.rank-tablet-expand-row > td {
  position: static !important;
  left: auto !important;
  z-index: auto !important;
  width: auto !important;
  min-width: 0 !important;
  max-width: none !important;
  padding: 0 !important;
  background: #fff !important;
  box-shadow: none !important;
  border-bottom: 1px solid #e5e7eb;
  text-align: left !important;
  white-space: normal !important;
  overflow: hidden;
  vertical-align: top;
}
.rank-detail {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 6px 8px 8px;
  background: #fff;
  overflow: hidden;
  text-align: left;
}
.rank-detail-band {
  border-radius: 8px;
  padding: 5px 8px 4px;
  text-align: left;
}
.rank-detail-band-core {
  background: #fbf3e4;
  color: #9a6b12;
}
.rank-detail-band-div {
  background: #f3f0fb;
  color: #6d5aa8;
}
.rank-detail-band-fee {
  background: #eaf6ef;
  color: #2f8a5b;
}
.rank-detail-band-rank {
  background: #eef4fc;
  color: #3d6eaf;
}
.rank-detail-head {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.rank-detail-mark {
  display: inline-flex;
  flex: 0 0 auto;
  color: inherit;
}
.rank-detail-title {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  color: inherit;
  white-space: nowrap;
}
.rank-detail-split {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(0, 0.7fr);
  align-items: center;
  min-width: 0;
}
.rank-detail-main {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.rank-detail-core-value {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  color: #1c1917;
  font-variant-numeric: tabular-nums;
}
.rank-detail-side {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  margin-left: 8px;
  padding-left: 8px;
  border-left: 1px solid rgba(154, 107, 18, 0.22);
}
.rank-detail-side-value {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
  color: #1c1917;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.rank-detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  margin-top: 2px;
}
.rank-detail-cell {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
  min-width: 0;
  padding: 3px 8px 3px 0;
}
.rank-detail-cell:nth-child(even) {
  padding: 3px 0 3px 8px;
  border-left: 1px solid rgba(28, 25, 23, 0.08);
}
.rank-detail-cell:nth-child(n + 3) {
  border-top: 1px solid rgba(28, 25, 23, 0.08);
}
.rank-detail-label {
  font-size: 12px;
  font-weight: 500;
  line-height: 1.25;
  color: #78716c;
  white-space: nowrap;
}
.rank-detail-num {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.25;
  color: #1c1917;
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
}
.rank-detail-num-net {
  color: #16803d;
}
.rank-detail-num-empty {
  color: #a8a29e;
  font-weight: 600;
}
.rank-report-table-shell[data-rank-layout="mobile"] .rank-report-mobile-scroll {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
}
@media (max-width: 960px) {
  [data-rank-title-row] {
    display: flex !important;
    flex-direction: column;
    align-items: stretch;
  }
  [data-rank-title-row] [data-period-picker] {
    width: 100%;
    margin-top: 10px;
    display: flex;
    justify-content: flex-end;
  }
}
@media (max-width: 768px) {
  [data-rank-title-row] [data-rank-h1] {
    font-size: clamp(1.75rem, 6.2vw, 2.125rem) !important;
    line-height: 1.42 !important;
  }
  .finance-dashboard-container .first-level-tabs .tab-btn {
    padding: 7px 14px;
    font-size: 13px;
  }
  .first-row-wrapper {
    margin-bottom: 16px;
  }
}
/* 分頁標籤：桌機顯示全稱，手機（<600）顯示短標 */
.first-level-tabs .tab-label-short {
  display: none;
}
@media (max-width: 599px) {
  .first-level-tabs .tab-label-full {
    display: none;
  }
  .first-level-tabs .tab-label-short {
    display: inline;
  }
  /* 手機：segmented control — 四格等分填滿一行，不滑、不切字 */
  .finance-dashboard-container .first-level-tabs {
    display: flex;
    width: 100%;
    max-width: 100%;
    padding: 4px;
    gap: 4px;
    overflow: hidden;
  }
  .finance-dashboard-container .first-level-tabs .tab-btn {
    flex: 1 1 0;
    min-width: 0;
    padding: 8px 6px;
    font-size: 13px;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* 等分後第一格文字置中，第二排改貼左框線（specificity 高於下方 768 規則） */
  .finance-dashboard-container .second-row-wrapper {
    padding-left: 4px;
  }
}
@media (max-width: 768px) {
  .second-row-wrapper {
    margin-bottom: 10px;
    padding-left: 13px;
  }
  .rank-report-conclusion .conclusion-title {
    font-size: 1.4375rem;
  }
  .rank-report-conclusion .conclusion-body {
    font-size: 1.0625rem;
    line-height: 1.7;
  }
}
/*
 * 非手機：不開拉條。欄位是固定寬積木。
 * 容器寬度放不下下一欄時，整欄 display:none，不在右緣留半個字。
 * 手機表不走這段。
 */
.rank-report-table-shell[data-rank-layout="desktop"] {
  display: block !important;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  overflow: hidden !important;
}
.rank-desk-stack {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
}
.rank-section-locked {
  position: relative;
  min-height: 280px;
  margin-top: 8px;
  border-radius: 16px;
  overflow: hidden;
  background: #fafaf9;
}
.rank-section-locked-ghost {
  padding: 28px 20px 36px;
  filter: blur(7px);
  pointer-events: none;
  user-select: none;
}
.rank-section-locked-ghost span {
  display: block;
  height: 14px;
  margin: 14px 0;
  border-radius: 7px;
  background: #e7e5e4;
}
.rank-section-locked-card {
  position: absolute;
  left: 50%;
  top: 46%;
  transform: translate(-50%, -50%);
  width: min(440px, calc(100% - 32px));
  padding: 22px 20px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #e7e5e4;
  box-shadow: 0 8px 28px rgba(28, 25, 23, 0.08);
  text-align: center;
}
.rank-section-locked-card h2 {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
  color: #1c1917;
}
.rank-section-locked-card p {
  margin: 0;
  font-size: 16px;
  line-height: 1.7;
  color: #44403c;
}
.rank-quick4-panel {
  margin: 14px 0 4px;
  padding: 12px 14px;
  border: 1px solid #e7e5e4;
  border-radius: 16px;
  background: #fff;
}
.rank-quick4-fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.rank-quick4-fields label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  color: #57534e;
}
.rank-quick4-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}
.rank-split-note {
  margin: 22px 0;
  font-size: 16px;
  line-height: 1.8;
  letter-spacing: 0.03em;
  color: #44403c;
}
.rank-desk-fit {
  container-type: inline-size;
  container-name: rank-desk;
}
@container rank-desk (max-width: 1145px) { .col-lastBuy { display: none !important; } }
@container rank-desk (max-width: 1025px) { .col-freq { display: none !important; } }
@container rank-desk (max-width: 945px) { .col-delta { display: none !important; } }
@container rank-desk (max-width: 865px) { .col-prevRank { display: none !important; } }
@container rank-desk (max-width: 775px) { .col-net { display: none !important; } }
@container rank-desk (max-width: 685px) { .col-fee { display: none !important; } }
@container rank-desk (max-width: 605px) { .col-nhi { display: none !important; } }
@container rank-desk (max-width: 525px) { .col-wireFee { display: none !important; } }
@container rank-desk (max-width: 445px) { .col-capital { display: none !important; } }
@container rank-desk (max-width: 321px) { .col-cashDiv { display: none !important; } }
@container rank-desk (max-width: 257px) { .col-stockDiv { display: none !important; } }
@container rank-desk (max-width: 193px) { .col-ticker { display: none !important; } }
/* 桌機代號欄鎖 140px，文字只跟內容一樣寬。手機表不在 .rank-desk-fit 裡。 */
.rank-desk-fit th.col-ticker,
.rank-desk-fit td.col-ticker {
  text-align: left !important;
  width: 140px !important;
  min-width: 140px !important;
  max-width: 140px !important;
  box-sizing: border-box !important;
}
.rank-desk-fit .rank-ticker-stack {
  display: flex !important;
  flex-direction: column !important;
  align-items: flex-start !important;
  justify-content: flex-start !important;
  width: max-content !important;
  max-width: 100% !important;
}
.rank-desk-fit .rank-ticker-code,
.rank-desk-fit .rank-ticker-name {
  text-align: left !important;
  width: max-content !important;
  display: block !important;
}
.rank-report-table-shell[data-rank-layout="desktop"] .rank-report-table-scroll {
  display: block;
  width: 100% !important;
  max-width: 100% !important;
  overflow-x: auto !important;
  overflow-y: hidden;
}
.rank-report-table-shell[data-rank-layout="desktop"] .rank-report-data-table {
  width: max-content !important;
  min-width: 100% !important;
  max-width: none !important;
}
.rank-report-table-shell[data-rank-layout="desktop"] .rank-report-data-table th,
.rank-report-table-shell[data-rank-layout="desktop"] .rank-report-data-table td {
  white-space: nowrap !important;
  overflow: visible;
  text-overflow: clip;
  max-width: none;
}
`}
      </style>
      <Stack gap={22} style={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>
        <Stack gap={16}>
          <Row gap={8} align="center" justify="space-between" wrap>
            <Text size="small" style={{ color: t.text.tertiary, fontSize: 13 }}>
              作者 {PERIOD.author}
            </Text>
            <Text size="small" style={{ color: t.text.tertiary, fontSize: 13 }}>
              {viewYear}年{viewMonth}月榜單 · 資料截止 {publishedIssue?.asOf ?? PERIOD.asOf}
            </Text>
          </Row>
          <div
            data-rank-title-row
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto",
              gap: 12,
              alignItems: "center",
            }}
          >
            <H1
              data-rank-h1
              style={{
                color: t.text.primary,
                fontSize: "clamp(2rem, 4.5vw, 2.75rem)",
                lineHeight: 1.45,
                fontWeight: 700,
                minWidth: 0,
                margin: 0,
              }}
            >
              {publishedIssue ? PERIOD.headline : `${viewYear}年${viewMonth}月稅後配息排行｜月領一萬要多少`}
            </H1>
            <div
              ref={pickerRootRef}
              data-period-picker="true"
              style={{
                justifySelf: "end",
                position: "relative",
                zIndex: 2,
              }}
              onPointerDown={(event: { stopPropagation: () => void }) => {
                event.stopPropagation();
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span
                  style={{ ...pickerUnit, ...yearFieldCluster }}
                  onPointerDown={onYearUnitPointerDown}
                  aria-expanded={openMenu === "year"}
                >
                  <span style={{ ...controlBox, ...yearDigitCol }}>
                    <input
                      ref={yearInputRef}
                      value={yearInput}
                      onChange={(event: { target: { value: string } }) =>
                        setYearInput(event.target.value)
                      }
                      onBlur={() => {
                        window.setTimeout(() => {
                          if (openMenu === "year") return;
                          applyDraft();
                        }, 0);
                      }}
                      onKeyDown={(event: { key: string; preventDefault: () => void }) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          setOpenMenu("");
                          applyDraft();
                        }
                      }}
                      aria-label="排行年份"
                      spellCheck={false}
                      style={yearField}
                    />
                  </span>
                  <span style={chevronCol} aria-hidden="true">
                    <span style={chevron} />
                  </span>
                  <span style={suffix}>年</span>
                  {openMenu === "year" ? (
                    <ul
                      role="listbox"
                      aria-label="年份"
                      style={{
                        ...menuBox,
                        left: 0,
                        right: 0,
                        width: "100%",
                        padding: "4px 12px",
                        overflowX: "hidden",
                        overflowY: "auto",
                        boxSizing: "border-box",
                      }}
                    >
                      {yearMenuOptions.map((item: number) => {
                        const yearSelectable = isAfterTaxRankSeriesYear(item);
                        return (
                          <li key={item} role="none">
                            <button
                              type="button"
                              role="option"
                              aria-disabled={!yearSelectable}
                              onMouseDown={(event: { preventDefault: () => void }) =>
                                event.preventDefault()
                              }
                              onClick={() => {
                                if (!yearSelectable) {
                                  setOpenMenu("");
                                  return;
                                }
                                const monthValue = evaluateNumericCell(monthInput);
                                applyPeriodValues(
                                  Number(item),
                                  monthValue === null ? viewMonth : Math.round(monthValue),
                                );
                              }}
                              style={{
                                ...menuItem,
                                padding: "4px 0",
                                opacity: yearSelectable ? 1 : 0.72,
                                color: yearSelectable ? t.text.primary : t.text.tertiary,
                                cursor: yearSelectable ? "pointer" : "not-allowed",
                                background:
                                  String(yearInput) === String(item)
                                    ? t.fill.tertiary
                                    : "transparent",
                              }}
                            >
                              {item}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </span>
                <span
                  style={{ ...pickerUnit, ...monthFieldCluster }}
                  onPointerDown={onMonthUnitPointerDown}
                  aria-expanded={openMenu === "month"}
                >
                  <span style={{ ...controlBox, ...monthDigitCol }}>
                    <input
                      ref={monthInputRef}
                      value={monthInput}
                      onChange={(event: { target: { value: string } }) =>
                        setMonthInput(event.target.value)
                      }
                      onBlur={() => {
                        window.setTimeout(() => {
                          if (openMenu === "month") return;
                          applyDraft();
                        }, 0);
                      }}
                      onKeyDown={(event: { key: string; preventDefault: () => void }) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          setOpenMenu("");
                          applyDraft();
                        }
                      }}
                      aria-label="排行月份"
                      spellCheck={false}
                      style={monthField}
                    />
                  </span>
                  <span style={chevronCol} aria-hidden="true">
                    <span style={chevron} />
                  </span>
                  <span style={suffix}>月</span>
                  {openMenu === "month" ? (
                    <ul
                      role="listbox"
                      aria-label="月份"
                      style={{
                        ...monthMenuPanel,
                        left: 0,
                        right: 0,
                        width: "100%",
                        overflowX: "hidden",
                        overflowY: "auto",
                        boxSizing: "border-box",
                      }}
                    >
                      {MONTH_OPTIONS.map((item) => {
                        const yearValue = evaluateNumericCell(yearInput);
                        const draftYear = yearValue === null ? viewYear : Math.round(yearValue);
                        const selectable = isSelectablePeriod(draftYear, Number(item));
                        return (
                          <li key={item} role="none">
                            <button
                              type="button"
                              role="option"
                              aria-disabled={!selectable}
                              onMouseDown={(event: { preventDefault: () => void }) =>
                                event.preventDefault()
                              }
                              onClick={() => {
                                applyPeriodValues(draftYear, Number(item));
                              }}
                              style={{
                                ...monthMenuItem,
                                opacity: selectable ? 1 : 0.72,
                                color: selectable ? t.text.primary : t.text.tertiary,
                                cursor: selectable ? "pointer" : "not-allowed",
                                background:
                                  String(Number(monthInput)) === item
                                    ? t.fill.tertiary
                                    : "transparent",
                              }}
                            >
                              <span style={monthNum}>{item}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </span>
              </div>
            </div>
          </div>
        </Stack>

        <div className="finance-dashboard-container">
          <div className="rank-report-conclusion">
            <Stack gap={12}>
              <h2 className="conclusion-title">本期結論</h2>
              <p className="conclusion-body">
                {conclusionLead
                  ? `這期第一名是 ${conclusionLead.ticker}（${conclusionLead.name}）。依該期實領目標逆推，達平均月領 1 萬約需本金 ${money(conclusionLead.capital)} 元、${lotsLabel(conclusionLead.lots)} 張。本系列第一期，沒有上期名次可比較。`
                  : "本期快照尚無排行資料。"}
              </p>
              <p className="conclusion-body">
                {nhiHits > 0
                  ? `有 ${nhiHits} 檔在「持有達月領一萬張數」時，${PERIOD.lastPayoutInflowLabel}超過二代健保 ${money(NHI_THRESHOLD)} 元門檻。`
                  : `本期在達標張數下，${PERIOD.lastPayoutInflowLabel}都未過二代健保門檻。`}
                00919 在 8/31 公告 1.10 元，除息日 9/16，未列入本期上一期。
              </p>
            </Stack>
          </div>
          <div className="first-row-wrapper">
            <div
              className="first-level-tabs"
              role="tablist"
              aria-label="月報主分類"
            >
              {REPORT_SECTION_TABS.map(({ id, label, shortLabel, ariaLabel }) => {
                const active = section === id;
                const releaseLabel = formatSectionPublishLabel(sectionPublishAt(viewYear, viewMonth, id));
                const open = RANK_SECTION_PREVIEW_NOW.getTime() >= sectionPublishAt(viewYear, viewMonth, id).getTime();
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    className="tab-btn"
                    aria-selected={active}
                    aria-label={open ? ariaLabel : `${ariaLabel}，預計 ${releaseLabel} 公開`}
                    data-active={active ? "true" : "false"}
                    data-scheduled={open ? "false" : "true"}
                    onClick={() => setSection(id)}
                  >
                    <span className="tab-label-full">{label}</span>
                    <span className="tab-label-short">{shortLabel ?? label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {sectionOpen ? null : (
            <div className="rank-section-locked">
              <div className="rank-section-locked-ghost" aria-hidden="true">
                <span style={{ width: "42%" }} />
                <span style={{ width: "88%" }} />
                <span style={{ width: "76%" }} />
                <span style={{ width: "91%" }} />
                <span style={{ width: "63%" }} />
                <span style={{ width: "84%" }} />
              </div>
              <div className="rank-section-locked-card" role="status">
                <h2>文章準備中</h2>
                <p>
                  本篇預計於 <strong>{sectionReleaseLabel}</strong> 公開，敬請期待。
                </p>
                <p>時間到之後重新整理頁面即可閱讀全文。</p>
              </div>
            </div>
          )}
          {sectionOpen && section !== "ex-div-preview" ? (
            <div className="second-row-wrapper">
              {showBasisTabs ? (
                <div className="data-mode-toggle" role="tablist" aria-label="排行基準">
                  {BASIS_TABS.flatMap(({ id, label, ariaLabel }, index) => {
                    const active = basis === id;
                    const tab = (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        className="mode-item"
                        aria-selected={active}
                        aria-label={ariaLabel}
                        data-active={active ? "true" : "false"}
                        onClick={() => setBasis(id)}
                      >
                        {label}
                      </button>
                    );
                    if (index === 0) return [tab];
                    return [
                      <span key={`sep-${id}`} className="data-mode-sep" aria-hidden="true">
                        |
                      </span>,
                      tab,
                    ];
                  })}
                </div>
              ) : null}
              <label className="rank-monthly-target">
                <span>月領</span>
                <input
                  className="rank-monthly-target-input"
                  value={monthlyText}
                  onChange={(event: { currentTarget: { value: string } }) =>
                    onMonthlyText(event.currentTarget.value)
                  }
                  onBlur={(event: { currentTarget: { value: string } }) =>
                    commitMonthlyText(event.currentTarget.value)
                  }
                  onKeyDown={(event: {
                    key: string;
                    preventDefault: () => void;
                    currentTarget: { value: string };
                  }) => {
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
            </div>
          ) : null}
          {sectionOpen && section === "etf-focus-pk" ? (
            <Stack gap={10} style={{ marginBottom: 12, marginTop: 10 }}>
              <Text size="small" style={lightText(t.text.secondary)}>
                不用整張大表：從月報快照抽出 00919、00929、00878，對照「月領稅後 1
                萬」要多少本金／張數（近 12 月稅後基準）。正式文可再加簡圖；數字仍只引用下表。
              </Text>
            </Stack>
          ) : null}
          {sectionOpen && section === "ex-div-preview" ? (
            <Stack gap={10} style={{ marginBottom: 12, marginTop: 10 }}>
              <Text size="small" style={lightText(t.text.secondary)}>
                下月已公告的最後買進日（示意）：00919 除息 9/16、最後買進 9/15。只列截止日前已公告的，之後還可能再公告。
              </Text>
            </Stack>
          ) : null}
          {sectionOpen && section !== "ex-div-preview" ? (
            <div className="rank-report-table-block">
              <div className="rank-report-table-panel">
                <RankReportResponsiveTable
                  rows={shownRows}
                  capitalLabel={capitalLabel}
                  monthlyText={monthlyText}
                  onMonthlyText={onMonthlyText}
                />
              </div>
              <Text size="small" style={lightText(t.text.tertiary)}>
                資料截止 {PERIOD.asOf}。{PERIOD.sourceDates}。
              </Text>
            </div>
          ) : null}
          {sectionOpen && quick4Lead ? (
            <RankQuick4Panel row={quick4Lead} basis={basis} />
          ) : null}
        </div>

        {moverRows.length > 0 ? (
          <Stack gap={8}>
            <H3 style={lightText(t.text.primary)}>名次變動</H3>
            <Table
              striped
              headers={["代號", "上期", "本期", "升降", "頻率"]}
              columnAlign={["left", "right", "right", "right", "center"]}
              rows={moverRows}
              style={{ background: t.bg.elevated, color: t.text.primary }}
            />
          </Stack>
        ) : null}

        <Stack gap={10}>
          <H2 style={lightText(t.text.primary)}>複製下一期時必守（唯一邏輯本）</H2>
          <Text style={lightText(t.text.secondary)}>
            大廠（Morningstar 研究報告、MoneyDJ／CMoney 排行工具頁）與 GitHub
            研報管線（FinSight、券商 initiating-coverage）都是同一條：先鎖定數據快照，再寫說明；說明不准發明數字。這張把那條做成可複製樣板，避免以後 100 套邏輯。
          </Text>

          <Table
            striped
            headers={["規則", "要做", "禁止"]}
            rows={[
              [
                "文體",
                "報表 + 說明。先表後文。結論只引用表。",
                "做成舊 mini-blog 故事文、或只有關鍵字沒有表。",
              ],
              [
                "複製方式",
                "整張複製。只改期別、快照、結論／說明三段。",
                "另開欄位、另定稅率、另做排序公式。",
              ],
              [
                "網址",
                "時間到、人審過才公開。未公開 noindex、不進 sitemap。",
                "先灌 30 個空頁給 Google 收。自動全文發布。",
              ],
              [
                "資料",
                "官方：投信公告、e添富、MOPS。快照存檔，頁面讀快照。",
                "爬 CMoney／MoneyDJ。FinMind 當公開站唯一來源。",
              ],
              [
                "數字",
                "程式從快照算排行。模型只寫說明草稿。",
                "讓 AI 算本金、稅、健保、名次。",
              ],
              [
                "主榜",
                "近12月稅後實領 → 月領一萬本金。ETF／個股分榜。",
                "用單期年化搶第一。ETF 跟個股混成一張榜。",
              ],
              [
                "欄位",
                "排行、股利、股息、月領1萬本金、稅、健保、手續費、實領、上期排行、升降、頻率、最後買進日。",
                "為了 SEO 再複製一張只差標題的表。",
              ],
              [
                "週報",
                "ETF之王／股票之王／ETF PK 股票：同一快照、不同問題。",
                "把月報第一名再貼一次叫之王。先建 120 個空週報網址。",
              ],
              [
                "新鮮度",
                "資料真的變了才改 dateModified 與截止日期。",
                "只改日期假裝更新。",
              ],
              [
                "揭露",
                "截止日、來源、稅務假設、非投資建議。",
                "JSON-LD 寫頁上沒有的評分或排行。",
              ],
            ]}
            style={{ background: t.bg.elevated, color: t.text.primary }}
          />
        </Stack>

        <Stack gap={8}>
          <H3 style={lightText(t.text.primary)}>系列怎麼共用這張，而不是各寫一套</H3>
          <Table
            striped
            headers={["系列", "同一份快照", "說明要回答的問題"]}
            rows={[
              [
                "月報（這張）",
                "是",
                "本月稅後誰第一、誰升降、月領一萬要多少、誰踩健保門檻",
              ],
              [
                "週2 焦點戰場 ETF",
                "是",
                "2～3 檔深度 PK（如 00919／00929／00878），月領一萬對照；不大表",
              ],
              [
                "週3 穩健收租個股",
                "是",
                "傳統高股息個股定存單補帖：除息進度、稅與二代健保後誰划算",
              ],
              [
                "週4 最後買進日",
                "是",
                "下月已公告的除息，最後一天要在哪一天前買到；不是再做一張排行",
              ],
            ]}
            style={{ background: t.bg.elevated, color: t.text.primary }}
          />
          <Text size="small" style={lightText(t.text.secondary)}>
            第 4 格是最後買進日（見 repo{" "}
            <code style={{ fontSize: 13 }}>lib/blog/after-tax-weekly-slots.ts</code>
            ）。從同一份快照挑出下個自然月已公告的除息，寫最後買進日。截止日之後才公告的不補進這一期。
          </Text>
        </Stack>

        <Stack gap={8}>
          <H3 style={lightText(t.text.primary)}>跟舊部落格哪裡不同</H3>
          <Table
            striped
            headers={["", "舊故事／試算文", "本報表文"]}
            rows={[
              ["開頭", "情境、口吻、先講痛點", "期別、截止日、宇宙、主榜定義"],
              ["主體", "段落 + 一個互動小工具", "排行表是主體，說明附在表下"],
              ["數字來源", "文內示意或計算機預設", "當期快照，與說明分離"],
              ["複製下一篇", "常另寫結構", "只換期別與快照，結構鎖定"],
              ["CTA", "一篇一顆計算機", "報表先把表看完；日後上線才加一顆"],
            ]}
            style={{ background: t.bg.elevated, color: t.text.primary }}
          />
        </Stack>

        <Stack gap={8}>
          <H3 style={lightText(t.text.primary)}>以後落地時的頁面骨架（仍不上線）</H3>
          <Text size="small" style={lightText(t.text.secondary)}>
            1. 抬頭（期別／截止／宇宙／主榜定義） 2. 本期結論 3. 可切 ETF／個股、主榜／附榜的表
            4. 名次變動 5. 說明三段 6. 方法與假設 7. FAQ（配息月份≠除息日、單期年化陷阱、健保門檻）
            8. 上期連結（公開後才有） 9. 來源與免責。未公開維持準備中頁。30
            期只預掛內部 slug，不進索引。
          </Text>
        </Stack>

        <Text size="small" style={lightText(t.text.tertiary)}>
          免責：示意試算，非投資建議、非報稅結論。實際配息、稅、二代健保以法令與投信／國稅局／健保署為準。含息總報酬可能與配息率方向不同。
        </Text>
      </Stack>
    </div>
  );
}
