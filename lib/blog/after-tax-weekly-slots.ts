/**
 * 稅後實領月報「附屬週報」格位（與月報同一期快照、不同問題）。
 * 第 4 格可選方案 A（ETF PK 股票）或方案 B（財報黑馬／配息潛力打包）。
 */

export const AFTER_TAX_WEEKLY_SLOT_COUNT = 4 as const;

export type AfterTaxWeeklyWeek = 1 | 2 | 3 | 4;

/** 第 4 週預設用方案 B（財報黑馬）；若要改回 PK 對決，改為 "A"。 */
export const AFTER_TAX_WEEK4_VARIANT: "A" | "B" = "B";

export type AfterTaxWeeklySlotId =
  | "w1-monthly-rank"
  | "w2-etf-king"
  | "w3-stock-king"
  | "w4-etf-vs-stock-pk"
  | "w4-earnings-dark-horse";

export type AfterTaxWeeklySlot = {
  week: AfterTaxWeeklyWeek;
  id: AfterTaxWeeklySlotId;
  /** 與當期月報共用 AFTER_TAX_RANK 快照（稅率、截止日、排行欄位一致） */
  sharesMonthlySnapshot: boolean;
  /** 編輯必答的一句話（SEO H1 / 結論骨幹） */
  editorialQuestion: string;
  slugSuffix: string;
};

const W4_SLOT: AfterTaxWeeklySlot =
  AFTER_TAX_WEEK4_VARIANT === "B"
    ? {
        week: 4,
        id: "w4-earnings-dark-horse",
        sharesMonthlySnapshot: true,
        editorialQuestion:
          "本月剛公布財報、獲利明顯成長的高股息個股，若維持或提高配息，稅後月領一萬本金會怎麼變？",
        slugSuffix: "earnings-dividend-dark-horse",
      }
    : {
        week: 4,
        id: "w4-etf-vs-stock-pk",
        sharesMonthlySnapshot: true,
        editorialQuestion: "同一目標月領一萬，ETF 與個股在本金、稅、健保、集中度上怎麼對決？",
        slugSuffix: "etf-vs-stock-pk",
      };

/** 每月四格固定順序；第 4 格依 AFTER_TAX_WEEK4_VARIANT 展開。 */
export const AFTER_TAX_WEEKLY_SLOTS: readonly AfterTaxWeeklySlot[] = [
  {
    week: 1,
    id: "w1-monthly-rank",
    sharesMonthlySnapshot: true,
    editorialQuestion: "本月稅後誰第一、誰升降、月領一萬要多少、誰踩健保門檻？",
    slugSuffix: "after-tax-dividend-rank",
  },
  {
    week: 2,
    id: "w2-etf-king",
    sharesMonthlySnapshot: true,
    editorialQuestion:
      "當月最熱門或剛宣布配息的 2～3 檔 ETF（如 00919 vs 00929 vs 00878）：稅後月領一萬要存幾張、誰最划算？",
    slugSuffix: "etf-focus-pk",
  },
  {
    week: 3,
    id: "w3-stock-king",
    sharesMonthlySnapshot: true,
    editorialQuestion:
      "非 ETF 的優質高股息個股（如中華電、統一超）：除權息進度與扣稅、二代健保後誰最像定存單？",
    slugSuffix: "stock-rent-supplement",
  },
  W4_SLOT,
];

export function afterTaxWeeklySlug(year: number, month: number, slot: AfterTaxWeeklySlot): string {
  const ym = `${year}-${String(month).padStart(2, "0")}`;
  if (slot.id === "w1-monthly-rank") {
    return `${ym}-after-tax-dividend-rank`;
  }
  return `${ym}-${slot.slugSuffix}`;
}

/** 方案 B 表列一檔「財報後配息潛力」候選（人審填入，程式只算稅後欄）。 */
export type EarningsDarkHorseRow = {
  ticker: string;
  name: string;
  /** 財報公告日（MOPS） */
  reportDate: string;
  /** 本期稅後淨利 YoY %，無合併則 null */
  profitYoYPct: number | null;
  /** 本期 EPS（元） */
  eps: number;
  /** 近四季或本期現金股利（元/股），與月報「股息」欄定義一致 */
  cashDivPerShare: number;
  /** 收盤價（截止日與月報 asOf 相同） */
  price: number;
  /** 編輯一句：為何可能提高明年配息（不寫保證） */
  dividendOutlook: string;
  /** 可選：與央行／市場利率敘事（降息有感、加息壓力等），純說明用 */
  rateNarrativeTag?: "cut-beneficiary" | "hike-resilient" | "neutral";
};

/**
 * 方案 B 入選條（每期人審勾選，不可全自動當投資建議）：
 * 1. 當月或截止日前 45 日內已公布季報／半年報（MOPS）。
 * 2. 稅後淨利 YoY ≥ 15%（或 EPS 由負轉正且原因已揭露）。
 * 3. 近 3 年有穩定現金股利紀錄（非一次性特別股利）。
 * 4. 仍落在「高股息／高現金流」讀者會搜的 universe（可從月報個股榜 + 自訂 watchlist）。
 * 5. 排除：僅靠業外、一次性收益、配息政策已明示下修者。
 */
export const EARNINGS_DARK_HORSE_ENTRY_RULES = [
  "財報公布日在本期窗口內（建議：截止日前 45 日）",
  "獲利 YoY 達標或 EPS 轉正且原因已讀",
  "有現金股利紀錄，非一次性特別配",
  "與月報同一 asOf 收盤價算月領一萬本金",
  "人審後才公開；未達標期數整週跳過或改發方案 A",
] as const;

/** 資料來源（白帽）：MOPS 財報、公開資訊觀測站、月報既有 e添富／證交所收盤。 */
export const EARNINGS_DARK_HORSE_SOURCES = [
  "MOPS 重大訊息與財務報表",
  "月報同期快照收盤價",
  "歷史現金股利（e添富／公司年報）",
] as const;
