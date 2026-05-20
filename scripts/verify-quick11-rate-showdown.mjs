import { buildLoanSchedules } from "../app/quick-11/logic.ts";
import { buildRateShowdownDeltas, buildRateShowdownRows, interestMetaphor } from "../app/quick-11/rate-showdown.ts";

function annuityTotalInterest(P, annualPct, years) {
  const out = buildLoanSchedules(P, annualPct, years);
  return Math.round(out.annuityTotalInterest);
}

function formulaTotalInterest(P, annualPct, years) {
  const n = years * 12;
  const rm = annualPct / 100 / 12;
  const pmt =
    rm <= 0 ? P / n : (P * rm * Math.pow(1 + rm, n)) / (Math.pow(1 + rm, n) - 1);
  return Math.round(pmt * n - P);
}

function monthlyPayment(P, annualPct, years) {
  const n = years * 12;
  const rm = annualPct / 100 / 12;
  if (rm <= 0) return P / n;
  return (P * rm * Math.pow(1 + rm, n)) / (Math.pow(1 + rm, n) - 1);
}

console.log("=== 1. 專案邏輯 vs 教科書本息均攤公式 ===\n");

const checks = [
  { label: "第11台預設 1200萬 / 2.2% / 30年", P: 12_000_000, r: 2.2, y: 30 },
  { label: "房貸情境 1100萬 / 2.2% / 30年", P: 11_000_000, r: 2.2, y: 30 },
  { label: "汽車貸 80萬 / 4.2% / 7年", P: 800_000, r: 4.2, y: 7 },
];

for (const c of checks) {
  const app = annuityTotalInterest(c.P, c.r, c.y);
  const ref = formulaTotalInterest(c.P, c.r, c.y);
  const pmt = Math.round(monthlyPayment(c.P, c.r, c.y));
  const ok = app === ref ? "OK" : `差 ${app - ref} 元`;
  console.log(c.label);
  console.log(`  月付約 NT$ ${pmt.toLocaleString("zh-TW")}`);
  console.log(`  總利息 專案: ${app.toLocaleString("zh-TW")} | 公式: ${ref.toLocaleString("zh-TW")} | ${ok}`);
  console.log("");
}

console.log("=== 2. 網路常見房貸參考（1100萬、30年、本息均攤）===\n");
const P11 = 11_000_000;
const pmt11 = Math.round(monthlyPayment(P11, 2.2, 30));
const ti11 = annuityTotalInterest(P11, 2.2, 30);
console.log("專案試算 @ 2.2%:");
console.log(`  月付約 ${pmt11.toLocaleString("zh-TW")} 元（網路文章常寫約 41,000 元級）`);
console.log(`  總利息約 ${Math.round(ti11 / 10_000)} 萬（約 ${ti11.toLocaleString("zh-TW")} 元）`);
console.log("網路整理常見區間：月付約 4.1 萬、總利息約 370～400 萬\n");

console.log("=== 3. 利率大對決（1100萬、30年、基準2.2%、本息均攤）===\n");
const allRows = buildRateShowdownRows(P11, 30, 2.2, "annuity");
console.log(`  檔數: ${allRows.length}（基準1 + 加碼${allRows.length - 1}），最高年利率 ${allRows.at(-1)?.annualRatePct}%`);
const last = allRows.at(-1);
if (last) console.log(`  最高檔總利息 ${Math.round(last.totalInterest / 10_000)} 萬，比基準多 ${Math.round(last.extraVsBaseline / 10_000)} 萬`);
console.log(`  加碼檔數公式: ${buildRateShowdownDeltas(2.2).length - 1} 檔（至15%）`);

console.log("\n=== 4. 與你舉例文案對照（總利息440萬 @2.2% 需較大本金）===\n");
// 反推本金使總利息≈440萬
const target = 4_400_000;
let lo = 8_000_000;
let hi = 16_000_000;
for (let i = 0; i < 50; i++) {
  const mid = Math.round((lo + hi) / 2);
  if (annuityTotalInterest(mid, 2.2, 30) < target) lo = mid;
  else hi = mid;
}
const impliedP = hi;
const base440 = annuityTotalInterest(impliedP, 2.2, 30);
const at32 = annuityTotalInterest(impliedP, 3.2, 30);
const at52 = annuityTotalInterest(impliedP, 5.2, 30);
console.log(`若總利息要約 440 萬（2.2%/30年），本金約 ${impliedP.toLocaleString("zh-TW")} 元`);
console.log(`  2.2% 總利息: ${Math.round(base440 / 10_000)} 萬`);
console.log(`  3.2% 總利息: ${Math.round(at32 / 10_000)} 萬（多 ${Math.round((at32 - base440) / 10_000)} 萬）`);
console.log(`  5.2% 總利息: ${Math.round(at52 / 10_000)} 萬（多 ${Math.round((at52 - base440) / 10_000)} 萬）`);
console.log("（你舉例 440→654→1123 萬，對應本金約 1,200～1,300 萬級，非預設 1,100 萬）\n");

console.log("=== 5. 利率敏感度方向檢查（應隨利率遞增）===\n");
const rows = buildRateShowdownRows(P11, 30, 2.2, "annuity");
let monotonic = true;
for (let i = 1; i < rows.length; i++) {
  if (rows[i].totalInterest < rows[i - 1].totalInterest) monotonic = false;
}
console.log(monotonic ? "總利息隨加碼利率遞增：OK" : "異常：利率越高利息應越高");

console.log("\n=== 6. 多送銀行比喻分級（萬）===\n");
for (const w of [30, 80, 200, 450, 550, 600, 732, 867, 1000, 1200]) {
  console.log(`  ${w} 萬 → ${interestMetaphor(w, 1)}`);
}
