import { getBlogPostBySlug, isBlogPostPublished } from "@/app/blog/posts/registry";

export const AFTER_TAX_RANK_SERIES_START = { year: 2026, month: 8 } as const;
export const AFTER_TAX_RANK_SERIES_LENGTH = 30;

/** 總排行主表顯示筆數（依所需本金升冪取前 N）。 */
export const AFTER_TAX_RANK_TOTAL_TOP_N = 50;

export function afterTaxRankSlug(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}-after-tax-dividend-rank`;
}

/** 不帶月份的固定入口。內容改連到最新一期，網址本身不換。 */
export const AFTER_TAX_RANK_LATEST_SLUG = "after-tax-dividend-rank";

/** 稅後實領月報系列路由（吃錢彈窗不顯示）。含固定入口與各期紀錄。 */
const AFTER_TAX_RANK_BLOG_PATH_RE =
  /^\/blog\/(?:\d{4}-\d{2}-)?after-tax-dividend-rank\/?$/;

export function isAfterTaxRankBlogPath(pathname: string): boolean {
  return AFTER_TAX_RANK_BLOG_PATH_RE.test(pathname);
}

/** 附榜分頁：以最近一期入帳配息回推排行（`month` 保留供系列期別 API 相容）。 */
export function afterTaxLastBasisTabLabel(_month: number): string {
  return "近一個月排行";
}

/** 主榜分頁：近 12 個月每期配息中位數回推本金（非算術平均）。 */
export function afterTaxTtmBasisTabLabel(): string {
  return "近期12個月 中位數";
}

export function afterTaxTtmBasisTabAriaLabel(): string {
  return "近期12個月：以每期現金配息中位數回推月領一萬所需本金";
}

/** 正文說明用（例：「8月配發入帳」）。 */
export function afterTaxLastPayoutInflowLabel(month: number): string {
  return `${month}月配發入帳`;
}

export function afterTaxRankPeriodMonth(periodId: string): number {
  const part = periodId.split("-")[1];
  const m = Number(part);
  return Number.isFinite(m) ? m : 0;
}

export type AfterTaxRankIssue = {
  year: number;
  month: number;
  slug: string;
  asOf: string;
};

/**
 * 已有快照、可以打開的期數。每一期一條網址，下一期不改寫上一期。
 * 未列在這裡的月份只存在於本系列範圍，尚未發布。
 * 固定入口 `/blog/after-tax-dividend-rank` 讀這份清單裡已公開的最新一期。
 */
export const AFTER_TAX_RANK_ISSUES: AfterTaxRankIssue[] = [
  {
    year: 2026,
    month: 8,
    slug: afterTaxRankSlug(2026, 8),
    asOf: "2026-08-31",
  },
  {
    year: 2026,
    month: 9,
    slug: afterTaxRankSlug(2026, 9),
    asOf: "2026-09-30",
  },
];

/** 月份選單只放行公開時間已到、且沒有被快照鎖住的總排行。 */
function isRankMonthOpen(year: number, month: number): boolean {
  const entry = getBlogPostBySlug(afterTaxRankSlug(year, month));
  if (!entry || entry.holdForSnapshot) return false;
  return isBlogPostPublished(entry.publishAtIso);
}

export function rankingMonthIndex(year: number, month: number): number {
  return year * 12 + month;
}

export function isAfterTaxRankSeriesMonth(year: number, month: number): boolean {
  if (month < 1 || month > 12) return false;
  const start = rankingMonthIndex(
    AFTER_TAX_RANK_SERIES_START.year,
    AFTER_TAX_RANK_SERIES_START.month,
  );
  const current = rankingMonthIndex(year, month);
  return current >= start && current < start + AFTER_TAX_RANK_SERIES_LENGTH;
}

export function getAfterTaxRankIssue(
  year: number,
  month: number,
): AfterTaxRankIssue | null {
  return AFTER_TAX_RANK_ISSUES.find((item) => item.year === year && item.month === month) ?? null;
}

/** @deprecated 請用 getAfterTaxRankYearOptions(anchorYear) */
export const AFTER_TAX_RANK_YEAR_OPTIONS = [2024, 2025, 2026, 2027, 2028, 2029] as const;

/** 以日曆進位正規化年月（支援算式結果如 11+5 → 次年 4 月）。 */
export function normalizeRankingYearMonth(
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

/** 系列 30 期涵蓋的西元年區間（下拉預設只顯示這段，不列出更早／更晚）。 */
export function getAfterTaxRankSeriesYearBounds(): { minYear: number; maxYear: number } {
  const start = AFTER_TAX_RANK_SERIES_START;
  const last = shiftRankingMonth(start.year, start.month, AFTER_TAX_RANK_SERIES_LENGTH - 1);
  return { minYear: start.year, maxYear: last.year };
}

export type AfterTaxRankYearPickState = {
  /** 是否可在下拉里點選（系列內才有） */
  selectable: boolean;
  disabledReason: string;
};

export function getAfterTaxRankYearPickState(year: number): AfterTaxRankYearPickState {
  if (!isAfterTaxRankSeriesYear(year)) {
    return { selectable: false, disabledReason: "無資料" };
  }
  return { selectable: true, disabledReason: "" };
}

/**
 * 年份下拉清單：
 * - 只顯示系列涵蓋的 min～max 年（隱藏過去／遠未來）
 * - 若算式結果落在範圍外，仍把該年插進清單一筆（灰字、不可點），輸入格可保留計算結果
 */
export function getAfterTaxRankYearMenuOptions(anchorYear: number): number[] {
  const { minYear, maxYear } = getAfterTaxRankSeriesYearBounds();
  const years: number[] = [];
  for (let y = minYear; y <= maxYear; y++) years.push(y);
  const anchor = Math.round(anchorYear);
  if (Number.isFinite(anchor) && (anchor < minYear || anchor > maxYear)) {
    years.push(anchor);
    years.sort((a, b) => a - b);
  }
  return years;
}

/** @deprecated 請用 getAfterTaxRankYearMenuOptions */
export function getAfterTaxRankYearOptions(
  anchorYear: number,
  yearsBefore = 10,
  yearsAfter = 10,
): number[] {
  const anchor = Math.round(anchorYear);
  if (!Number.isFinite(anchor)) return [...AFTER_TAX_RANK_YEAR_OPTIONS];
  const start = anchor - yearsBefore;
  const end = anchor + yearsAfter;
  const out: number[] = [];
  for (let y = start; y <= end; y++) out.push(y);
  return out;
}

export function shiftRankingMonth(year: number, month: number, deltaMonths: number) {
  const base = normalizeRankingYearMonth(year, month);
  if (!base) return { year, month };
  const d = new Date(base.year, base.month - 1, 1);
  d.setMonth(d.getMonth() + Math.round(deltaMonths));
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export type AfterTaxRankPeriodStatus =
  | "ready"
  | "before-start"
  | "unpublished"
  | "invalid"
  | "after-end";

export type AfterTaxRankPeriodResolve = {
  year: number;
  month: number;
  status: AfterTaxRankPeriodStatus;
  hint: string;
  issue: AfterTaxRankIssue | null;
};

export function resolveAfterTaxRankPeriod(
  year: number,
  month: number,
): AfterTaxRankPeriodResolve {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    year < 1990 ||
    year > 2100
  ) {
    return {
      year,
      month,
      status: "invalid",
      hint: "請輸入西元年與 1–12 月。",
      issue: null,
    };
  }
  const start = rankingMonthIndex(
    AFTER_TAX_RANK_SERIES_START.year,
    AFTER_TAX_RANK_SERIES_START.month,
  );
  const current = rankingMonthIndex(year, month);
  if (current < start) {
    return {
      year,
      month,
      status: "before-start",
      hint: "無資料。最早資料為2026年8月。",
      issue: null,
    };
  }
  const issue = getAfterTaxRankIssue(year, month);
  if (issue && isRankMonthOpen(year, month)) {
    return { year, month, status: "ready", hint: "", issue };
  }
  if (current < start + AFTER_TAX_RANK_SERIES_LENGTH) {
    return {
      year,
      month,
      status: "unpublished",
      hint: "敬請期待。",
      issue: null,
    };
  }
  return {
    year,
    month,
    status: "after-end",
    hint: "無資料。最早資料為2026年8月。",
    issue: null,
  };
}

export function isSelectableAfterTaxRankPeriod(year: number, month: number): boolean {
  return resolveAfterTaxRankPeriod(year, month).status === "ready";
}

export function getLatestPublishedAfterTaxRankIssue(): AfterTaxRankIssue {
  const sorted = [...AFTER_TAX_RANK_ISSUES].sort(
    (a, b) => rankingMonthIndex(b.year, b.month) - rankingMonthIndex(a.year, a.month),
  );
  return sorted[0]!;
}

/** 年份是否落在本系列任一月份內（供下拉顯示／禁用）。 */
export function isAfterTaxRankSeriesYear(year: number): boolean {
  for (let month = 1; month <= 12; month += 1) {
    if (isAfterTaxRankSeriesMonth(year, month)) return true;
  }
  return false;
}

export type AfterTaxRankMenuItemState = {
  selectable: boolean;
  /** disabled 時給 title／輔助說明 */
  disabledReason: string;
};

export function getAfterTaxRankMenuItemState(
  year: number,
  month: number,
): AfterTaxRankMenuItemState {
  const resolved = resolveAfterTaxRankPeriod(year, month);
  if (resolved.status === "ready") {
    return { selectable: true, disabledReason: "" };
  }
  if (resolved.status === "unpublished") {
    return { selectable: false, disabledReason: "敬請期待" };
  }
  if (resolved.status === "before-start" || resolved.status === "after-end") {
    return { selectable: false, disabledReason: "無資料" };
  }
  return { selectable: false, disabledReason: resolved.hint };
}
