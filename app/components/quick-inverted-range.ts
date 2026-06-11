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

/** 左大右小：填色須對齊滑桿 thumb（用 display 值，非實際 amount） */
export function invertedFillPct(amount: number, min: number, max: number): string {
  const display = invertedRangeDisplay(amount, min, max);
  if (max <= min) return "0%";
  return `${((display - min) / (max - min)) * 100}%`;
}
