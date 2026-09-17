"use client";

import { useMemo, useState } from "react";
import { AFTER_TAX_RANK_2026_08, AFTER_TAX_RANK_2026_08_ETF } from "./posts/after-tax-rank-2026-08";
import { deriveAfterTaxRank, formatRankMoney, formatRankNhi } from "@/lib/blog/after-tax-rank";
import {
  AFTER_TAX_RANK_TOTAL_TOP_N,
  afterTaxTtmBasisTabAriaLabel,
} from "@/lib/blog/after-tax-rank-series";
import styles from "./blog-after-tax-rank-table.module.css";

type Basis = "ttm" | "last";

export function BlogAfterTaxRankTable() {
  const [basis, setBasis] = useState<Basis>("ttm");
  const rows = useMemo(
    () => deriveAfterTaxRank(AFTER_TAX_RANK_2026_08_ETF, basis, AFTER_TAX_RANK_TOTAL_TOP_N),
    [basis],
  );
  const meta = AFTER_TAX_RANK_2026_08;

  return (
    <div className={styles.financeDashboardContainer}>
      <div className={styles.secondRowWrapper}>
        <div className={styles.dataModeToggle} role="tablist" aria-label="排行基準">
          <button
            type="button"
            role="tab"
            aria-selected={basis === "last"}
            aria-label={meta.lastBasisTabLabel}
            className={styles.modeItem}
            data-active={basis === "last"}
            onClick={() => setBasis("last")}
          >
            {meta.lastBasisTabLabel}
          </button>
          <span className={styles.modeSep} aria-hidden="true">|</span>
          <button
            type="button"
            role="tab"
            aria-selected={basis === "ttm"}
            aria-label={afterTaxTtmBasisTabAriaLabel()}
            className={styles.modeItem}
            data-active={basis === "ttm"}
            onClick={() => setBasis("ttm")}
          >
            {meta.ttmBasisTabLabel}
          </button>
        </div>
      </div>
      <div className={styles.tableResponsivePanel}>
        <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>排行</th>
              <th>代號</th>
              <th>股利</th>
              <th>股息</th>
              <th>月領1萬本金</th>
              <th>匯費</th>
              <th>二代健保</th>
              <th>手續費</th>
              <th>實領</th>
              <th>上期排行</th>
              <th>頻率</th>
              <th>最後買進日</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.ticker}>
                <td>{row.rank}</td>
                <td className={styles.tickerCell}>
                  <div className={styles.tickerStack}>
                    <span className={styles.tickerCode}>{row.ticker}</span>
                    <span className={styles.tickerName}>{row.name}</span>
                  </div>
                  <span className={styles.note}>{row.ttmNote}</span>
                </td>
                <td>{row.stockDivPerUnit.toFixed(2)}</td>
                <td>{row.lastCashPerUnit.toFixed(2)}</td>
                <td className={styles.capitalCell}>
                  <div className={styles.capitalStack}>
                    <span className={styles.capitalAmount}>
                      {formatRankMoney(row.capital)}
                    </span>
                    <span className={styles.capitalLots}>
                      {row.lots.toFixed(1)} 張
                    </span>
                  </div>
                </td>
                <td>{formatRankMoney(row.wireFee)}</td>
                <td className={row.nhi > 0 ? undefined : styles.nhiDash}>
                  {formatRankNhi(row.nhi)}
                </td>
                <td>{formatRankMoney(row.fee)}</td>
                <td>{formatRankMoney(row.net)}</td>
                <td>首期無</td>
                <td>{row.freq}</td>
                <td>{row.lastBuy}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      <p className={styles.caption}>
        資料截止 {meta.asOf}。收盤 {meta.asOf}；除息 {meta.asOf}；近一年配息 2026-09-07。總排行顯示達月領目標所需本金前{" "}
        {AFTER_TAX_RANK_TOTAL_TOP_N} 檔 ETF（未覆核標的為試算預設，以 e添富覆核後更新）。上期排行：本系列第一期，沒有可比的上期名次。配息不入帳扣綜所稅（隔年 5
        月申報）。表內實領為該期目標（月1萬／季3萬／半年6萬），由股息毛額逆推張數；就源僅示意二代健保 2.11%、匯費 10
        元、手續費每張 15 元。
      </p>
    </div>
  );
}
