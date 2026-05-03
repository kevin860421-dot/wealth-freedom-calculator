/**
 * 小計算機共用試算核心。
 *
 * 與首頁（app/page.tsx）在「簡化路徑」下一致：每期月複利一次、固定月投入於每期加入資產
 * （與各 quick 頁既有的 fvMonthly／累進迴圈相同結構）。完整股利課稅、二代健保、手續費與配息月份
 * 仍以首頁 simulate 為準；此檔僅集中純數學函式供 quick-1～quick-10（含 quick-6）共用，避免各頁複製分歧。
 */

export function clampNum(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** 期初 initial，每月底投入 monthlyContribution，月複利（年化拆成月利率） */
export function fvMonthly({
  annualReturnPct,
  months,
  initial,
  monthlyContribution,
}: {
  annualReturnPct: number;
  months: number;
  initial: number;
  monthlyContribution: number;
}): number {
  const r = clampNum(annualReturnPct, 0, 99) / 100 / 12;
  let bal = Math.max(0, Number.isFinite(initial) ? initial : 0);
  const c = Math.max(0, Number.isFinite(monthlyContribution) ? monthlyContribution : 0);
  const mMax = Math.max(0, Math.trunc(months));
  for (let m = 1; m <= mMax; m++) {
    bal = bal * (1 + r) + c;
  }
  return bal;
}

/** quick-3／月投累積：期初 0、定期定額至期末資產 */
export function futureValueMonthlyContribution(
  monthlyContribution: number,
  annualReturnPct: number,
  years: number,
): number {
  const months = Math.max(1, Math.round(years * 12));
  return fvMonthly({
    annualReturnPct,
    months,
    initial: 0,
    monthlyContribution,
  });
}

/** 期末資產以年化報酬粗估「月領」現金流（×年化÷12），與 quick-3 可月領列同一示意 */
export function estimatedMonthlyPayoutFromBalance(balance: number, annualReturnPct: number): number {
  const b = Math.max(0, Number.isFinite(balance) ? balance : 0);
  return b * (clampNum(annualReturnPct, 0, 99) / 100) / 12;
}

/** quick-2：擇時達標所需月數（上限 maxMonths） */
export function monthsToReachTarget(
  targetAsset: number,
  monthlyContribution: number,
  annualPct: number,
  maxMonths = 1200,
): number | null {
  const r = clampNum(annualPct, 0, 99) / 100 / 12;
  let bal = 0;
  for (let m = 1; m <= maxMonths; m++) {
    bal = bal * (1 + r) + monthlyContribution;
    if (bal >= targetAsset) return m;
  }
  return null;
}

/** 已知期末目標資產與期數，倒推每期應投入（年金終值反解） */
export function requiredMonthlyToReachTarget(targetAsset: number, annualPct: number, months: number): number {
  if (months <= 0) return 0;
  const r = clampNum(annualPct, 0, 99) / 100 / 12;
  if (r === 0) return targetAsset / months;
  const factor = (Math.pow(1 + r, months) - 1) / r;
  if (factor <= 0) return targetAsset / months;
  return targetAsset / factor;
}

/** quick-9：每月投入可依「第幾月」變動 */
export function simulateVariableContribution({
  annualReturnPct,
  months,
  initial,
  monthlyContributionAt,
}: {
  annualReturnPct: number;
  months: number;
  initial: number;
  monthlyContributionAt: (m: number) => number;
}): number {
  const r = clampNum(annualReturnPct, 0, 99) / 100 / 12;
  let bal = Math.max(0, Number.isFinite(initial) ? initial : 0);
  const mMax = Math.max(0, Math.trunc(months));
  for (let m = 1; m <= mMax; m++) {
    const c = Math.max(0, Number.isFinite(monthlyContributionAt(m)) ? monthlyContributionAt(m) : 0);
    bal = bal * (1 + r) + c;
  }
  return bal;
}

/** quick-10：回傳每期期末資產序列（含複利路徑） */
export function simulateMonthlyBalances({
  annualReturnPct,
  months,
  initial,
  monthlyContribution,
}: {
  annualReturnPct: number;
  months: number;
  initial: number;
  monthlyContribution: number;
}): number[] {
  const r = clampNum(annualReturnPct, 0, 99) / 100 / 12;
  let bal = Math.max(0, Number.isFinite(initial) ? initial : 0);
  const c = Math.max(0, Number.isFinite(monthlyContribution) ? monthlyContribution : 0);
  const mMax = Math.max(0, Math.trunc(months));
  const out: number[] = [];
  for (let m = 1; m <= mMax; m++) {
    bal = bal * (1 + r) + c;
    out.push(bal);
  }
  return out;
}
