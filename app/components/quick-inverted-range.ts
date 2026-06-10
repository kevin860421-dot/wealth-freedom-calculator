/** 左大右小：反轉 range 刻度（與首頁 mobile-stepper-fields 一致） */
export function clampRangeAmount(amount: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, amount));
}

export function invertedRangeDisplay(amount: number, min: number, max: number): number {
  const a = clampRangeAmount(amount, min, max);
  return max - a + min;
}

export function amountFromInvertedRange(raw: number, min: number, max: number): number {
  if (!Number.isFinite(raw)) return min;
  return clampRangeAmount(max - raw + min, min, max);
}

export function invertedFillPct(amount: number, min: number, max: number): string {
  const a = clampRangeAmount(amount, min, max);
  if (max <= min) return "0%";
  return `${((a - min) / (max - min)) * 100}%`;
}
