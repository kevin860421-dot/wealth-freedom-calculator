/**
 * 月領 1 萬張數／本金／實領逆推：與 lib/blog/after-tax-rank.ts 同步。
 */
import { AFTER_TAX_RANK_2026_08_ETF } from "../app/blog/posts/after-tax-rank-2026-08";
import {
  deriveAfterTaxRank,
  perPeriodNetTarget,
  solveLotsForPeriodNet,
} from "../lib/blog/after-tax-rank";

const ttm = deriveAfterTaxRank(AFTER_TAX_RANK_2026_08_ETF, "ttm");
console.log(
  "主榜排行",
  ttm.map((r) => `${r.rank}.${r.ticker} cap=${Math.round(r.capital)} net=${r.net}`).join(" | "),
);

const r919 = ttm.find((x) => x.ticker === "00919")!;
const r929 = ttm.find((x) => x.ticker === "00929")!;
const r940 = ttm.find((x) => x.ticker === "00940")!;

console.log("00919 季", {
  net: r919.net,
  nhi: r919.nhi,
  fee: r919.fee,
  wire: r919.wireFee,
  lots: r919.lots.toFixed(1),
});
console.log("00929 月", { net: r929.net, nhi: r929.nhi, fee: r929.fee });
console.log("00940 月", { net: r940.net, nhi: r940.nhi, fee: r940.fee });

if (r919.net !== 30_000) console.warn("WARN 00919 實領應為 30000");
if (r929.net !== 10_000) console.warn("WARN 00929 實領應為 10000");
if (r940.fee < 4000) console.warn(`WARN 00940 低股息張數多，手續費應偏高；得 ${r940.fee}`);

const sanity = solveLotsForPeriodNet(1.0, perPeriodNetTarget("季"));
const checkNet =
  sanity.grossDividend - sanity.nhi - sanity.fee - 10;
if (Math.abs(checkNet - 30_000) > 2) {
  console.warn(`WARN 季配逆推實領偏差 ${checkNet}`);
}

console.log("verify:after-tax-rank done");
