import * as XLSX from "xlsx";
import { readQuick11ExcelBuffer } from "./quick11-excel-serve";

export type Quick11ExcelPreviewInputs = {
  principal: number;
  annualRate: number;
  years: number;
  monthlyIncome: number;
};

export type Quick11ExcelPreviewResults = {
  monthlyAnnuity: number;
  totalInterest: number;
  dtiRatio: number;
  dtiPct: number;
  healthLabel: string;
};

export type Quick11ExcelPreviewRow = {
  kind: "title" | "section" | "header" | "data" | "spacer";
  cells: [string, string, string, string];
  highlight?: "input" | "result" | "warn" | "warnMid";
};

export type Quick11ExcelPreviewFooter = {
  quick11Url: string;
  homeUrl: string;
};

export function computeQuick11ExcelResults(input: Quick11ExcelPreviewInputs): Quick11ExcelPreviewResults {
  const { principal, annualRate, years, monthlyIncome } = input;
  const r = annualRate / 100 / 12;
  const n = Math.max(1, Math.round(years * 12));
  const monthlyAnnuity =
    r <= 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalInterest = monthlyAnnuity * n - principal;
  const dtiRatio = monthlyIncome <= 0 ? 0 : monthlyAnnuity / monthlyIncome;
  const dtiPct = dtiRatio * 100;
  const healthLabel =
    dtiPct >= 50
      ? "⚠ 破產預警：先降月付或拉高收入"
      : dtiPct >= 35
        ? "⚠ 壓力偏高：月付偏緊"
        : "✓ 安全區：現金流尚可";

  return {
    monthlyAnnuity: Math.round(monthlyAnnuity),
    totalInterest: Math.round(totalInterest),
    dtiRatio,
    dtiPct,
    healthLabel,
  };
}

function fmtMoney(n: number): string {
  return n.toLocaleString("zh-TW", { maximumFractionDigits: 0 });
}

function readInputsFromBuffer(buffer: Buffer): Quick11ExcelPreviewInputs | null {
  try {
    const wb = XLSX.read(buffer, { type: "buffer" });
    const ws = wb.Sheets["貸款試算"] ?? wb.Sheets[wb.SheetNames[0] ?? ""];
    if (!ws) return null;
    const cellNum = (addr: string) => {
      const v = ws[addr]?.v;
      return typeof v === "number" && Number.isFinite(v) ? v : null;
    };
    return {
      principal: cellNum("B5") ?? 12_000_000,
      annualRate: cellNum("B6") ?? 2.2,
      years: cellNum("B7") ?? 30,
      monthlyIncome: cellNum("B8") ?? 80_000,
    };
  } catch {
    return null;
  }
}

function buildPreviewRows(inputs: Quick11ExcelPreviewInputs, results: Quick11ExcelPreviewResults): Quick11ExcelPreviewRow[] {
  const warnHighlight =
    results.dtiPct >= 50 ? "warn" : results.dtiPct >= 35 ? "warnMid" : "result";

  return [
    { kind: "title", cells: ["破產計算機 · 貸款利息試算表（公式可改）", "", "", ""] },
    { kind: "spacer", cells: ["", "", "", ""] },
    { kind: "section", cells: ["【輸入區】改 B 欄數字即可", "", "", ""] },
    { kind: "header", cells: ["項目", "數值", "單位", "說明"] },
    { kind: "data", highlight: "input", cells: ["貸款本金", fmtMoney(inputs.principal), "NT$", "例：1200 萬"] },
    { kind: "data", highlight: "input", cells: ["年利率", inputs.annualRate.toFixed(2), "%", "例：2.2 純數字"] },
    { kind: "data", highlight: "input", cells: ["貸款年期", String(inputs.years), "年", "例：30 純數字"] },
    { kind: "data", highlight: "input", cells: ["月收入（預警）", fmtMoney(inputs.monthlyIncome), "NT$", "算 DTI 用"] },
    { kind: "spacer", cells: ["", "", "", ""] },
    { kind: "section", cells: ["【試算結果】", "", "", ""] },
    { kind: "header", cells: ["項目", "結果", "單位", "公式說明"] },
    {
      kind: "data",
      highlight: "result",
      cells: ["本息均攤 · 每月繳款", fmtMoney(results.monthlyAnnuity), "NT$", "PMT：月利率＝年利率÷12÷100"],
    },
    {
      kind: "data",
      highlight: "result",
      cells: ["本息均攤 · 總繳利息", fmtMoney(results.totalInterest), "NT$", "總付款－本金"],
    },
    {
      kind: "data",
      highlight: "result",
      cells: ["DTI 債務收入比", `${results.dtiPct.toFixed(1)}%`, "%", "月付÷月收入；<35% 安全；≥50% 預警"],
    },
    {
      kind: "data",
      highlight: warnHighlight,
      cells: ["財務健康狀態", results.healthLabel, "", ""],
    },
  ];
}

export async function loadQuick11ExcelPreview(): Promise<{
  inputs: Quick11ExcelPreviewInputs;
  results: Quick11ExcelPreviewResults;
  rows: Quick11ExcelPreviewRow[];
  footer: Quick11ExcelPreviewFooter;
  missingFile: boolean;
}> {
  const buffer = readQuick11ExcelBuffer();
  const defaults: Quick11ExcelPreviewInputs = {
    principal: 12_000_000,
    annualRate: 2.2,
    years: 30,
    monthlyIncome: 80_000,
  };
  const footer: Quick11ExcelPreviewFooter = {
    quick11Url: "https://wealth-freedom-calculator.vercel.app/quick-11",
    homeUrl: "https://wealth-freedom-calculator.vercel.app/",
  };

  if (!buffer) {
    const results = computeQuick11ExcelResults(defaults);
    return {
      inputs: defaults,
      results,
      rows: buildPreviewRows(defaults, results),
      footer,
      missingFile: true,
    };
  }

  const inputs = readInputsFromBuffer(buffer) ?? defaults;
  const results = computeQuick11ExcelResults(inputs);
  return {
    inputs,
    results,
    rows: buildPreviewRows(inputs, results),
    footer,
    missingFile: false,
  };
}
