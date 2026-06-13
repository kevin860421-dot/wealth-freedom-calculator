import type { Quick11LoanPresetKey } from "./loan-scenarios";

export type VehicleFinancePresetKey = Extract<Quick11LoanPresetKey, "scooter" | "car">;

export type VehicleFinanceFees = {
  originationFee: number;
  collateralSettingFee: number;
};

export const QUICK11_DEFAULT_VEHICLE_FEES: Record<VehicleFinancePresetKey, VehicleFinanceFees> = {
  scooter: { originationFee: 5_000, collateralSettingFee: 3_500 },
  car: { originationFee: 5_000, collateralSettingFee: 3_500 },
};

export function isVehicleFinancePreset(key: string | null | undefined): key is VehicleFinancePresetKey {
  return key === "scooter" || key === "car";
}

export function sumVehicleFees(fees: VehicleFinanceFees): number {
  return Math.max(0, fees.originationFee) + Math.max(0, fees.collateralSettingFee);
}

/** 名義本金 − 撥款前扣除 → 實際到手 */
export function computeNetProceeds(nominalPrincipal: number, fees: VehicleFinanceFees): number {
  const nominal = Math.max(0, nominalPrincipal);
  return Math.max(0, nominal - sumVehicleFees(fees));
}

/** 本息均攤月付（期數為月） */
export function computeAnnuityMonthlyPayment(
  principal: number,
  annualRatePct: number,
  periods: number,
): number {
  const p = Math.max(0, principal);
  const n = Math.max(1, Math.round(periods));
  const monthlyRate = Math.max(0, annualRatePct) / 100 / 12;
  if (monthlyRate <= 0) return p / n;
  const factor = Math.pow(1 + monthlyRate, n);
  return (p * monthlyRate * factor) / (factor - 1);
}

/**
 * 以 IRR 反推實質年利率（APR，有效年利率 %）。
 * 現金流：t=0 收到 netProceeds；之後每期支付 monthlyPayment（名義本金 PMT，實拿較少）。
 * 業界做法：Excel IRR / 金管會 APR 概念 — 把所有撥款前扣除併入借款成本。
 */
export function computeEffectiveAprPct(
  netProceeds: number,
  monthlyPayment: number,
  periods: number,
): number | null {
  if (netProceeds <= 0 || monthlyPayment <= 0 || periods <= 0) return null;

  const npv = (monthlyRate: number) => {
    let pvPayments = 0;
    for (let t = 1; t <= periods; t += 1) {
      pvPayments += monthlyPayment / (1 + monthlyRate) ** t;
    }
    return netProceeds - pvPayments;
  };

  let lo = 0;
  let hi = 0.01;
  while (npv(hi) <= 0 && hi < 2) hi *= 2;

  if (npv(lo) > 0 || npv(hi) <= 0) return null;

  for (let i = 0; i < 96; i += 1) {
    const mid = (lo + hi) / 2;
    const value = npv(mid);
    if (Math.abs(value) < 0.5) {
      return ((1 + mid) ** 12 - 1) * 100;
    }
    // 利率愈高 → 折現後月付愈低 → NPV 愈高
    if (value > 0) hi = mid;
    else lo = mid;
  }

  const monthly = (lo + hi) / 2;
  return ((1 + monthly) ** 12 - 1) * 100;
}

export function buildVehicleFinanceInsight(input: {
  nominalPrincipal: number;
  nominalRatePct: number;
  monthlyPayment: number;
  periods: number;
  fees: VehicleFinanceFees;
}) {
  const totalDeducted = sumVehicleFees(input.fees);
  const netProceeds = computeNetProceeds(input.nominalPrincipal, input.fees);
  const effectiveAprPct = computeEffectiveAprPct(netProceeds, input.monthlyPayment, input.periods);

  const aprIncreasePct =
    totalDeducted <= 0 || effectiveAprPct == null
      ? 0
      : Math.max(0, effectiveAprPct - input.nominalRatePct);

  /**
   * 相當增加多少利息：名義本金 PMT 總付 − 若只借「實拿金額」且名目利率不變的總付。
   * 意即：少拿這麼多，月付卻一樣，多付的總成本。
   */
  const totalPaidOnNominal = input.monthlyPayment * input.periods;
  const monthlyIfNetOnly = computeAnnuityMonthlyPayment(
    netProceeds,
    input.nominalRatePct,
    input.periods,
  );
  const totalIfNetOnly = monthlyIfNetOnly * input.periods;
  const equivalentExtraInterest =
    totalDeducted <= 0 ? 0 : Math.round(Math.max(0, totalPaidOnNominal - totalIfNetOnly));

  return {
    totalDeducted,
    netProceeds,
    effectiveAprPct,
    aprIncreasePct,
    equivalentExtraInterest,
    showPitfall: totalDeducted > 0 && effectiveAprPct != null && effectiveAprPct > input.nominalRatePct + 0.05,
  };
}
