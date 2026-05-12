/**
 * 手動／CI 可執行：npx tsx --tsconfig tsconfig.json scripts/validate-quick12-logic.ts
 * 驗證與 app/quick-12/logic.ts 一致的邊界與級距（數值變更時請同步更新預期）。
 */
import {
  computeCombinedSalaryAndStocks,
  computeSalaryTaxBurden,
  computeStockNhi2Snapshot,
  progressiveIncomeTaxAnnual,
  SIMPLIFIED_EXEMPTION_AND_DEDUCTION,
} from "../app/quick-12/logic";
import { TICKER_PRESETS } from "../app/ticker-presets";
import { default54cPctFromPreset, estimatedAnnualCashDividendPerLot } from "../app/quick-12/ticker-helpers";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// 免稅額 + 標準扣除 + 薪資特別扣除（與 logic 註解一致）
assert(SIMPLIFIED_EXEMPTION_AND_DEDUCTION === 97000 + 124000 + 218000, "SIMPLIFIED 合計應為 439000");

// 累進級距（56／126／252／472 萬淨額）；差額公式在邊界附近可能與四捨五入同額
const t56 = progressiveIncomeTaxAnnual(560_000);
const t56p1 = progressiveIncomeTaxAnnual(560_001);
assert(t56 === 28_000, `56 萬淨額預期 28000，實際 ${t56}`);
assert(t56p1 === 28_000, `56 萬零 1 元仍為 28000（12% 式四捨五入），實際 ${t56p1}`);
const t600k = progressiveIncomeTaxAnnual(600_000);
assert(t600k === 32_800, `60 萬淨額預期 32800，實際 ${t600k}`);

const rDefault = computeSalaryTaxBurden({ monthlyInsuredSalary: 45_000, annualBonus: 100_000, sideIncome: 30_000 });
assert(rDefault.grossAnnual === 670_000, "預設毛所得");
assert(rDefault.taxableNetForIncomeTax === 209_940, `預設綜所淨額預期 209940，實際 ${rDefault.taxableNetForIncomeTax}`);
assert(rDefault.estimatedAnnualIncomeTax === 10_497, `預設綜所稅預期 10497，實際 ${rDefault.estimatedAnnualIncomeTax}`);

const rLow = computeSalaryTaxBurden({ monthlyInsuredSalary: 30_000, annualBonus: 0, sideIncome: 0 });
assert(rLow.estimatedAnnualIncomeTax === 0, "低所得應免綜所（淨額<=0）");

const comb = computeCombinedSalaryAndStocks({ monthlyInsuredSalary: 45_000, annualBonus: 0, sideIncome: 0 }, [
  { annualGross: 500_000, ratio54cPct: 100 },
]);
assert(comb.stockNhi2Total > 0, "54C 全計入且超過 2 萬應有二代健保");
assert(comb.grossAnnual === 45_000 * 12 + 500_000, "加計股票毛額");

function nhi2SnapFromPresetId(id: string, lots = 1) {
  const p = TICKER_PRESETS.find((x) => x.id === id);
  if (!p) throw new Error(`missing preset ${id}`);
  const nLots = Math.max(1, Math.floor(lots));
  const gross = Math.round(estimatedAnnualCashDividendPerLot(p) * nLots);
  return computeStockNhi2Snapshot({
    annualGross: gross,
    ratio54cPct: default54cPctFromPreset(p),
  });
}

const s2330x2 = nhi2SnapFromPresetId("2330", 2);
assert(s2330x2.nhi2 > 0, "2330 試算庫 2 張應觸發二代健保");
const s2454x1 = nhi2SnapFromPresetId("2454", 1);
assert(s2454x1.nhi2 === 0 && s2454x1.taxable54 < 20_000, "2454 試算庫 1 張計入未達二代門檻");
assert(s2330x2.nhi2 > s2454x1.nhi2, "2454／2330×2：2330 二代健保應較大");

console.log("validate-quick12-logic: OK");
console.log("SIMPLIFIED_EXEMPTION_AND_DEDUCTION =", SIMPLIFIED_EXEMPTION_AND_DEDUCTION, "(含免稅額 9.7 萬 + 標扣 + 薪資特扣，示意常數)");
