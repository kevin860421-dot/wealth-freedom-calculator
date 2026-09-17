import {
  afterTaxLastBasisTabLabel,
  afterTaxLastPayoutInflowLabel,
  afterTaxRankPeriodMonth,
  afterTaxTtmBasisTabLabel,
} from "@/lib/blog/after-tax-rank-series";

export { AFTER_TAX_RANK_2026_08_ETF_AUDITED } from "./after-tax-rank-2026-08-audited";
export { AFTER_TAX_RANK_2026_08_ETF } from "@/lib/blog/after-tax-rank-2026-08-universe";

const RANK_MONTH = afterTaxRankPeriodMonth("2026-08");

/** 2026年8月榜。截止 2026-08-31。除息日晚於截止日者不列入本期配發。 */
export const AFTER_TAX_RANK_2026_08 = {
  periodId: "2026-08",
  periodTitle: "2026年8月",
  rankingMonth: RANK_MONTH,
  lastBasisTabLabel: afterTaxLastBasisTabLabel(RANK_MONTH),
  ttmBasisTabLabel: afterTaxTtmBasisTabLabel(),
  lastPayoutInflowLabel: afterTaxLastPayoutInflowLabel(RANK_MONTH),
  asOf: "2026-08-31",
  author: "財富自由計算機編輯部",
  canonicalPath: "/blog/2026-08-after-tax-dividend-rank",
  priceSource: "臺灣證券交易所 個股日成交資訊 STOCK_DAY，收盤 2026-08-31",
  dividendSource: "臺灣證券交易所 e添富配息清單，除息日 ≤ 2026-08-31",
  ttmSource:
    "00919／00878／0056 近一年配息引自工商時報 2026-09-07 整理；其餘為 e添富截止日前已除息合計（未滿 12 個月已註記）",
} as const;
