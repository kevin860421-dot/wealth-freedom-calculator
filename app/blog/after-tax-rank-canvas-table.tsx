'use client';

import { cloneElement, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import "./after-tax-rank-canvas.css";

type Freq = "月" | "季" | "半年" | "年";
type RankBasis = "ttm" | "last";
type Derived = {
  ticker: string;
  name: string;
  price: number;
  lastCashPerUnit: number;
  stockDivPerUnit: number;
  ttmCashPerUnit: number;
  freq: Freq;
  lots: number;
  capital: number;
  grossDividend: number;
  wireFee: number;
  nhi: number;
  fee: number;
  net: number;
  rank: number;
  prevRank: number;
  delta: number;
  lastBuy: string;
  exDate: string;
  payDate: string;
};

export type CanvasRankRow = Derived;
export type CanvasRankBasis = RankBasis;

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
  monthlyText: _monthlyText,
  onMonthlyText: _onMonthlyText,
  aboveRank4 = null,
}: {
  rows: Derived[];
  capitalLabel: string;
  monthlyText: string;
  onMonthlyText: (value: string) => void;
  aboveRank4?: ReactNode;
}) {
  const [expandedTicker, setExpandedTicker] = useState("",
  );
  const [layoutShell, setLayoutShell] = useState<HTMLDivElement | null>(null);
  const [isMobileLayout, setIsMobileLayout] = useState(false);

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
  const [capitalShrink, setCapitalShrink] = useState(false);
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
      const prevMax = mobileTable.style.maxWidth;
      const prevMaxPriority = mobileTable.style.getPropertyPriority("max-width");
      const tickerCells = [...mobileTable.querySelectorAll<HTMLElement>('[data-col="ticker"]')];
      const tickerInline = tickerCells.map((el) => ({
        width: el.style.width,
        widthPriority: el.style.getPropertyPriority("width"),
        maxWidth: el.style.maxWidth,
        maxPriority: el.style.getPropertyPriority("max-width"),
      }));
      for (const el of tickerCells) {
        el.style.setProperty("width", "max-content", "important");
        el.style.setProperty("max-width", "none", "important");
      }
      mobileTable.style.setProperty("width", "max-content", "important");
      mobileTable.style.setProperty("max-width", "none", "important");
      const contentW = mobileTable.scrollWidth;
      const tickerNaturalW = tickerTh.getBoundingClientRect().width;
      for (const id of [...RANK_MOBILE_OPTIONAL_ORDER, "stockDiv" as const]) {
        const th = mobileTable.querySelector<HTMLElement>(`thead th[data-col="${id}"]`);
        if (!th) continue;
        optionalWidthRef.current[id] = Math.ceil(th.getBoundingClientRect().width);
      }
      if (prevInlineWidth) mobileTable.style.setProperty("width", prevInlineWidth, prevPriority);
      else mobileTable.style.removeProperty("width");
      if (prevMax) mobileTable.style.setProperty("max-width", prevMax, prevMaxPriority);
      else mobileTable.style.removeProperty("max-width");
      tickerCells.forEach((el, index) => {
        const prev = tickerInline[index];
        if (prev.width) el.style.setProperty("width", prev.width, prev.widthPriority);
        else el.style.removeProperty("width");
        if (prev.maxWidth) el.style.setProperty("max-width", prev.maxWidth, prev.maxPriority);
        else el.style.removeProperty("max-width");
      });
      const tickerW = tickerTh.getBoundingClientRect().width;
      const capitalThForGap = mobileTable.querySelector<HTMLElement>('thead th[data-col="capital"]');
      let nameRight = tickerTh.getBoundingClientRect().left;
      mobileTable.querySelectorAll<HTMLElement>(".rank-ticker-code, .rank-ticker-name").forEach((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        nameRight = Math.max(nameRight, range.getBoundingClientRect().right);
        range.detach();
      });
      const nextAfterName =
        mobileTable.querySelector<HTMLElement>('thead th[data-col="stockDiv"]') ||
        mobileTable.querySelector<HTMLElement>('thead th[data-col="cashDiv"]') ||
        mobileTable.querySelector<HTMLElement>('thead th[data-col="freq"]') ||
        mobileTable.querySelector<HTMLElement>('thead th[data-col="lastBuy"]') ||
        capitalThForGap;
      const openGap = nextAfterName
        ? nextAfterName.getBoundingClientRect().left - nameRight
        : 0;
      const tickerBudget = Math.min(tickerNaturalW, RANK_MOBILE_TICKER_MIN_PX);
      const tightW = contentW - tickerNaturalW + tickerBudget;
      const capitalTh = mobileTable.querySelector<HTMLElement>('thead th[data-col="capital"]');
      const expandTh = mobileTable.querySelector<HTMLElement>('thead th[data-col="expand"]');
      let capitalTextOverflow = false;
      if (capitalTh) {
        const limit = expandTh
          ? expandTh.getBoundingClientRect().left
          : (shell?.getBoundingClientRect().right ?? capitalTh.getBoundingClientRect().right);
        const probe = document.createElement("span");
        probe.textContent = capitalTh.textContent;
        probe.style.cssText = `position:absolute;left:-9999px;top:0;white-space:nowrap;visibility:hidden;font:${getComputedStyle(capitalTh).font};`;
        document.body.appendChild(probe);
        const naturalW = probe.getBoundingClientRect().width;
        probe.remove();
        const fullW = capitalShrink ? naturalW * (14 / 12) : naturalW;
        const style = getComputedStyle(capitalTh);
        const inner =
          capitalTh.clientWidth -
          (parseFloat(style.paddingLeft) || 0) -
          (parseFloat(style.paddingRight) || 0);
        const textRight = capitalTh.getBoundingClientRect().right - (parseFloat(style.paddingRight) || 0);
        capitalTextOverflow = fullW > inner + 1 || textRight > limit + 1;
      }
      setCapitalShrink(capitalTextOverflow);
      setHiddenCount((prev) => {
        const widthForOverflow = prev >= 2 ? tightW : contentW;
        const contentOverflow = shellW > 0 && widthForOverflow > shellW + 1;
        const nextHide = RANK_MOBILE_OPTIONAL_ORDER[prev];
        let nextHideW =
          (nextHide && optionalWidthRef.current[nextHide]) ??
          (nextHide && RANK_MOBILE_OPTIONAL_FALLBACK_PX[nextHide]) ??
          56;
        if (nextHide === "cashDiv") {
          nextHideW += optionalWidthRef.current.stockDiv ?? RANK_MOBILE_OPTIONAL_FALLBACK_PX.stockDiv ?? 48;
        }
        if (
          (contentOverflow || tickerW < RANK_MOBILE_TICKER_MIN_PX) &&
          prev < RANK_MOBILE_OPTIONAL_ORDER.length &&
          openGap < nextHideW
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
          const base = next === "cashDiv" ? tightW : contentW;
          const holeFits = openGap >= colW + RANK_MOBILE_RESTORE_GAP_PX;
          if (holeFits || (shellW > 0 && base + colW + RANK_MOBILE_RESTORE_GAP_PX <= shellW)) {
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
    // hiddenCount、capitalShrink 在 deps：收欄或縮小後再量一次
  }, [isMobileLayout, mobileTable, hiddenCount, capitalShrink]);

  const hiddenCols = rankMobileHiddenCols(hiddenCount);
  const mobileVisibleIds = RANK_MOBILE_PRIMARY_IDS.filter((id) => !hiddenCols.has(id));

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
        {rows.length > 3 ? aboveRank4 : null}
        {rows.length > 3 ? (
      <div className="rank-report-table-scroll rank-report-mobile-scroll">
        <table
          ref={setMobileTable}
          className="rank-report-data-table rank-report-mobile-table"
          data-hidden-optional={String(hiddenCount)}
          data-capital-shrink={capitalShrink ? "1" : "0"}
        >
          <thead>
            <tr>
              {mobileVisibleIds.map((id) => {
                const header = RANK_MOBILE_HEADERS.find((h) => h.id === id);
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
                  {mobileVisibleIds.map((col) => {
                    const cell = renderRankMobilePrimaryCell(col, row, expanded, () =>
                      setExpandedTicker(expanded ? "" : row.ticker),
                    );
                    return cell ? cloneElement(cell, { key: col }) : null;
                  })}
                  {renderRankMobileExpandCell(row, expanded, () =>
                    setExpandedTicker(expanded ? "" : row.ticker),
                  )}
                </tr>,
                renderRankMediumExpandRow(
                  row,
                  expanded,
                  mobileVisibleIds.length + 1,
                  hiddenCols,
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

export { RankReportResponsiveTable, RankSplitNote };
