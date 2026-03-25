/**
 * 財富自由計算機 — 狀態持久化（現階段：瀏覽器 localStorage；PWA 安裝後仍為同源儲存）。
 *
 * ## 與後端銜接
 * - 本檔定義 **版本化快照** `CalculatorSnapshotV1` 與介面 `CalculatorStateRepository`。
 * - 日後若改為帳號後台：實作 `RemoteCalculatorStateRepository`（fetch + JWT），
 *   在單一入口替換 `getDefaultCalculatorRepository()` 即可，**不必**散佈改 UI。
 * - 快照 JSON 亦可直接作為 API request/response body 的基底。
 *
 * ## 限制
 * - localStorage 有容量上限（約 5MB）、同源策略；清除網站資料會刪除。
 * - 敏感個資不應長期放 localStorage；後端上線後應搭配登入與傳輸加密。
 */

export const CALCULATOR_STATE_STORAGE_KEY = "wf-calculator-state-v1";
export const CALCULATOR_SNAPSHOT_VERSION = 1 as const;

export type PayoutFrequencyPersist = "month" | "quarter" | "semiannual" | "year";

/** 可序列化、可給未來 API 使用的計算機表單快照 */
export type CalculatorSnapshotV1 = {
  v: typeof CALCULATOR_SNAPSHOT_VERSION;
  initialPrincipal: string;
  monthlyContribution: string;
  monthlyExtra: string;
  annualReturnRate: number;
  /** null 表示輸入框為空字串 */
  dividendYieldPct: number | null;
  stockDividendPct: number | null;
  rateSource: "annual" | "dividend" | null;
  targetQuarterIncome: string;
  reinvestRatio: number;
  payoutFrequency: PayoutFrequencyPersist;
  selectedEtf: string;
  defaultYearStr: string;
  defaultMonthStr: string;
  initialYearStr: string;
  initialMonthStr: string;
  nthPeriod: number;
  targetYearsToAchieve: string;
  taxBracketRate: number;
  applyTaxInTable: boolean;
  applyNhi2InTable: boolean;
  annualIncome: string;
  separateTaxOpen: boolean;
  manualOverrides: Record<string, number>;
  etfRatioEstimates: Record<string, string>;
  etfCodeFilter: string;
};

export type PersistResult = { ok: true } | { ok: false; error: string };

/** 抽象儲存層：本機與遠端共用介面 */
export interface CalculatorStateRepository {
  load(): CalculatorSnapshotV1 | null;
  save(snapshot: CalculatorSnapshotV1): PersistResult;
  clear(): PersistResult;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseSnapshot(raw: string | null): CalculatorSnapshotV1 | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o) || o.v !== CALCULATOR_SNAPSHOT_VERSION) return null;
    if (typeof o.initialPrincipal !== "string") return null;
    if (typeof o.monthlyContribution !== "string") return null;
    if (typeof o.monthlyExtra !== "string") return null;
    return o as unknown as CalculatorSnapshotV1;
  } catch {
    return null;
  }
}

export class LocalStorageCalculatorRepository implements CalculatorStateRepository {
  constructor(private readonly key: string = CALCULATOR_STATE_STORAGE_KEY) {}

  load(): CalculatorSnapshotV1 | null {
    if (typeof window === "undefined") return null;
    try {
      return parseSnapshot(window.localStorage.getItem(this.key));
    } catch {
      return null;
    }
  }

  save(snapshot: CalculatorSnapshotV1): PersistResult {
    if (typeof window === "undefined") return { ok: false, error: "no-window" };
    try {
      window.localStorage.setItem(this.key, JSON.stringify(snapshot));
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: msg };
    }
  }

  clear(): PersistResult {
    if (typeof window === "undefined") return { ok: false, error: "no-window" };
    try {
      window.localStorage.removeItem(this.key);
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: msg };
    }
  }
}

let defaultRepo: CalculatorStateRepository = new LocalStorageCalculatorRepository();

/** 單元測試或日後 DI 可替換 */
export function setCalculatorStateRepository(repo: CalculatorStateRepository): void {
  defaultRepo = repo;
}

export function getDefaultCalculatorRepository(): CalculatorStateRepository {
  return defaultRepo;
}

export function buildSnapshotFromInputs(args: {
  initialPrincipal: string;
  monthlyContribution: string;
  monthlyExtra: string;
  annualReturnRate: number;
  dividendYieldPct: number | "";
  stockDividendPct: number | "";
  rateSource: "annual" | "dividend" | null;
  targetQuarterIncome: string;
  reinvestRatio: number;
  payoutFrequency: PayoutFrequencyPersist;
  selectedEtf: string;
  defaultYearStr: string;
  defaultMonthStr: string;
  initialYearStr: string;
  initialMonthStr: string;
  nthPeriod: number;
  targetYearsToAchieve: string;
  taxBracketRate: number;
  applyTaxInTable: boolean;
  applyNhi2InTable: boolean;
  annualIncome: string;
  separateTaxOpen: boolean;
  manualOverrides: Record<string, number>;
  etfRatioEstimates: Record<string, string>;
  etfCodeFilter: string;
}): CalculatorSnapshotV1 {
  return {
    v: CALCULATOR_SNAPSHOT_VERSION,
    initialPrincipal: args.initialPrincipal,
    monthlyContribution: args.monthlyContribution,
    monthlyExtra: args.monthlyExtra,
    annualReturnRate: args.annualReturnRate,
    dividendYieldPct: args.dividendYieldPct === "" ? null : args.dividendYieldPct,
    stockDividendPct: args.stockDividendPct === "" ? null : args.stockDividendPct,
    rateSource: args.rateSource,
    targetQuarterIncome: args.targetQuarterIncome,
    reinvestRatio: args.reinvestRatio,
    payoutFrequency: args.payoutFrequency,
    selectedEtf: args.selectedEtf,
    defaultYearStr: args.defaultYearStr,
    defaultMonthStr: args.defaultMonthStr,
    initialYearStr: args.initialYearStr,
    initialMonthStr: args.initialMonthStr,
    nthPeriod: args.nthPeriod,
    targetYearsToAchieve: args.targetYearsToAchieve,
    taxBracketRate: args.taxBracketRate,
    applyTaxInTable: args.applyTaxInTable,
    applyNhi2InTable: args.applyNhi2InTable,
    annualIncome: args.annualIncome,
    separateTaxOpen: args.separateTaxOpen,
    manualOverrides: { ...args.manualOverrides },
    etfRatioEstimates: { ...args.etfRatioEstimates },
    etfCodeFilter: args.etfCodeFilter,
  };
}
