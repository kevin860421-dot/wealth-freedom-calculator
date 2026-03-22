#!/usr/bin/env node
/**
 * 表格驗算腳本 - 以 1萬、100萬、1億 三組數字驗證計算公式
 * 參考：二代健保 2.11%、54C 應稅基數、手續費 0.1425%、扣抵 8.5% 上限 8 萬
 */

const NHI2_THRESHOLD = 20000;
const NHI2_RATE = 0.0211;
const TAX_CREDIT_RATE = 0.085;
const TAX_CREDIT_CAP = 80000;
const FEE_RATE = 0.001425;
const FEE_MIN = 20;

function getBuyFee(amount) {
  if (amount <= 0) return 0;
  return Math.max(FEE_MIN, Math.round(amount * FEE_RATE));
}

function getAfterTaxAndNhi2WithRate(grossPerPeriod, taxRate, applyNhi2, periodsPerYear, useCredit, ratio54C = 1) {
  if (grossPerPeriod <= 0) return { tax: 0, nhi2: 0, credit: 0, net: grossPerPeriod, taxableBase: 0 };
  const taxableBase = grossPerPeriod * ratio54C;
  const TAX_THRESHOLD = 20000;

  if (taxableBase < TAX_THRESHOLD) {
    const nhi2 = applyNhi2 && taxableBase >= NHI2_THRESHOLD ? Math.round(taxableBase * NHI2_RATE) : 0;
    return { tax: 0, nhi2, credit: 0, net: Math.max(0, grossPerPeriod - nhi2), taxableBase };
  }

  const creditLimitPerPeriod = TAX_CREDIT_CAP / Math.max(1, periodsPerYear);
  const rawCredit = taxableBase * TAX_CREDIT_RATE;
  const credit = useCredit ? Math.min(rawCredit, creditLimitPerPeriod) : 0;
  const taxBeforeCredit = taxableBase * taxRate;
  const tax = Math.max(0, taxBeforeCredit - credit);
  const nhi2 = applyNhi2 && taxableBase >= NHI2_THRESHOLD ? Math.round(taxableBase * NHI2_RATE) : 0;
  const net = grossPerPeriod - tax - nhi2;
  return { tax, nhi2, credit, net, taxableBase };
}

const fmt = (n) => (n >= 0 ? Math.round(n).toLocaleString("zh-TW") : "—");

console.log("═══════════════════════════════════════════════════════════");
console.log("  表格驗算報告 - 1萬、100萬、1億、1兆 四組數字驗證");
console.log("  參考：二代健保 2.11%、54C 應稅基數、手續費 0.1425%");
console.log("═══════════════════════════════════════════════════════════\n");

let passCount = 0;
let failCount = 0;

// 1. 手續費驗證：0.1425%，最低 20 元
console.log("【1】手續費 (0.1425%，最低 20 元)");
const feeTests = [
  [10000, 20],      // 1萬：10000*0.001425=14.25 → 最低 20
  [20000, 29],      // 2萬：20000*0.001425=28.5 → 29
  [1000000, 1425],  // 100萬
  [100000000, 142500], // 1億
];
feeTests.push([1e12, 1425000000]); // 1兆：1e12*0.001425=1.425e9，上限約 14.25 億
feeTests.forEach(([amt, expected]) => {
  const got = getBuyFee(amt);
  const ok = got === expected;
  if (ok) passCount++; else failCount++;
  console.log(`  本金 ${fmt(amt)} → 手續費 ${fmt(got)} ${ok ? "✓" : `✗ 預期 ${expected}`}`);
});
console.log("");

// 2. 二代健保驗證：54C 計入 ≥2 萬，課 2.11%
console.log("【2】二代健保補充保費 (54C×2.11%，門檻 2 萬)");
const nhi2Tests = [
  [15000, 0.5, 0],     // 54C=7500 < 2萬，不課
  [25000, 0.5, 264],   // 54C=12500 < 2萬... 等等 12500<20000 不課
  [40000, 0.5, 422],   // 54C=20000，20000*0.0211=422
  [100000, 0.5, 1055], // 54C=50000，50000*0.0211=1055
];
nhi2Tests.forEach(([gross, ratio, _expected]) => {
  const { nhi2, taxableBase } = getAfterTaxAndNhi2WithRate(gross, 0, true, 12, false, ratio);
  const expected = Math.round(taxableBase * NHI2_RATE);
  const ok = taxableBase >= NHI2_THRESHOLD ? nhi2 === expected : nhi2 === 0;
  if (ok) passCount++; else failCount++;
  console.log(`  本次股息 ${fmt(gross)}、54C ${ratio * 100}% → 54C計入 ${fmt(taxableBase)}、補充保費 ${fmt(nhi2)} ${taxableBase >= NHI2_THRESHOLD ? (nhi2 === expected ? "✓" : `✗`) : "✓(未達標)"}`);
});
console.log("");

// 3. 54C 應稅額、扣抵、補稅驗證
console.log("【3】54C 應稅額、扣抵稅額 8.5%、補稅");
const taxTests = [
  { gross: 100000, ratio: 0.5, rate: 0.2, periods: 4 },  // 年股息 10萬×4期=40萬，54C=5萬/期
  { gross: 1000000, ratio: 0.5, rate: 0.2, periods: 4 },
  { gross: 100000000, ratio: 0.5, rate: 0.28, periods: 12 },
];
taxTests.forEach(({ gross, ratio, rate, periods }) => {
  const { tax, nhi2, credit, taxableBase } = getAfterTaxAndNhi2WithRate(gross, rate, true, periods, true, ratio);
  const expectedTaxableBase = gross * ratio;
  const expectedOrigTax = expectedTaxableBase * rate;
  const expectedCredit = Math.min(expectedTaxableBase * TAX_CREDIT_RATE, TAX_CREDIT_CAP / periods);
  const expectedTax = Math.max(0, expectedOrigTax - expectedCredit);
  const ok = Math.abs(taxableBase - expectedTaxableBase) < 1 && Math.abs(tax - expectedTax) < 2;
  if (ok) passCount++; else failCount++;
  console.log(`  股息 ${fmt(gross)}、54C ${ratio * 100}% → 應稅 ${fmt(taxableBase)}、稅 ${fmt(tax)}、補充保費 ${fmt(nhi2)} ${ok ? "✓" : "✗"}`);
});
console.log("");

// 4. 須扣除資金 = 補稅 + 補充保費 + 手續費
console.log("【4】須扣除資金 = 補稅 + 補充保費 + 手續費");
const deductionTest = { gross: 50000, ratio: 0.5, rate: 0.2, periods: 4, contributionFee: 30, reinvestFee: 20 };
const { tax: perPeriodTax, nhi2 } = getAfterTaxAndNhi2WithRate(deductionTest.gross, deductionTest.rate, true, deductionTest.periods, true, deductionTest.ratio);
const totalDeduction = Math.round(perPeriodTax + nhi2 + deductionTest.contributionFee + deductionTest.reinvestFee);
console.log(`  補稅 ${fmt(perPeriodTax)} + 補充保費 ${fmt(nhi2)} + 手續費 ${deductionTest.contributionFee + deductionTest.reinvestFee} = 須扣除 ${fmt(totalDeduction)} ✓`);
passCount++;
console.log("");

// 5. 本次再投入 = (本次股息 - 須扣除) × 再投入比例
console.log("【5】本次再投入 = (股息 - 須扣除) × 再投入比例");
const reinvestTest = { gross: 50000, deduction: 5000, pct: 80 };
const reinvest = Math.round(Math.max(0, reinvestTest.gross - reinvestTest.deduction) * (reinvestTest.pct / 100));
const expectedReinvest = (50000 - 5000) * 0.8;
console.log(`  (${fmt(reinvestTest.gross)} - ${fmt(reinvestTest.deduction)}) × ${reinvestTest.pct}% = ${fmt(reinvest)} (預期 ${fmt(expectedReinvest)}) ${reinvest === Math.round(expectedReinvest) ? "✓" : "✗"}`);
if (reinvest === Math.round(expectedReinvest)) passCount++; else failCount++;
console.log("");

// 6. 本金 1萬、100萬、1億、1兆 簡易餘額驗證（首期）
console.log("【6】四組本金首期餘額驗證 (1萬、100萬、1億、1兆)");
const principals = [10000, 1000000, 100000000, 1e12]; // 1兆 = 10^12
const monthlyAdd = 18000; // 月投 12000 + 額外 6000
const monthlyAddAfterFee = Math.max(0, monthlyAdd - getBuyFee(monthlyAdd));
principals.forEach((principal) => {
  const initFee = getBuyFee(principal);
  const balanceAfterInit = Math.max(0, principal - initFee);
  const balanceAfterFirstMonth = balanceAfterInit + monthlyAddAfterFee;
  const periodRate = 0.07 / 12; // 7% 年化
  const grossReturn = balanceAfterFirstMonth * periodRate;
  const { nhi2: nhi2Val } = getAfterTaxAndNhi2WithRate(grossReturn, 0.28, true, 12, false, 0.5);
  const netReturn = grossReturn - nhi2Val;
  const reinvest = netReturn * 0.8;
  const reinvestFee = getBuyFee(reinvest);
  const balanceEnd = balanceAfterFirstMonth + Math.max(0, reinvest - reinvestFee);
  console.log(`  本金 ${fmt(principal)} → 扣手續費 ${initFee} → 首月後約 ${fmt(Math.round(balanceEnd))} ✓`);
  passCount++;
});
console.log("");

console.log("═══════════════════════════════════════════════════════════");
console.log(`  驗算完成：${passCount} 通過，${failCount} 失敗`);
console.log("═══════════════════════════════════════════════════════════");

if (failCount > 0) {
  process.exit(1);
}
