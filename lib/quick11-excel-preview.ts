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
  annuityTotalRepayment: number;
  dtiRatio: number;
  dtiPct: number;
  interestToPrincipalPct: number;
  healthLabel: string;
};

export type Quick11ExcelPreviewSideRow = {
  label: string;
  value: string;
  highlight?: boolean;
};

export type Quick11ExcelPreviewRow = {
  kind: "title" | "subtitle" | "panel" | "header" | "data" | "spacer" | "warnBanner" | "disclaimer";
  cells: [string, string, string, string];
  highlight?: "input" | "result" | "warn" | "warnMid";
  side?: Quick11ExcelPreviewSideRow;
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
  const annuityTotalRepayment = principal + totalInterest;
  const dtiRatio = monthlyIncome <= 0 ? 0 : monthlyAnnuity / monthlyIncome;
  const dtiPct = dtiRatio * 100;
  const interestToPrincipalPct = principal <= 0 ? 0 : (totalInterest / principal) * 100;
  const healthLabel =
    dtiPct >= 50
      ? "⚠ 破產預警：先降月付或提高收入"
      : dtiPct >= 35
        ? "⚠ 壓力偏高：月付偏緊"
        : "✓ 安全區：現金流尚可";

  return {
    monthlyAnnuity: Math.round(monthlyAnnuity),
    totalInterest: Math.round(totalInterest),
    annuityTotalRepayment: Math.round(annuityTotalRepayment),
    dtiRatio,
    dtiPct,
    interestToPrincipalPct,
    healthLabel,
  };
}

function fmtMoney(n: number): string {
  return n.toLocaleString("zh-TW", { maximumFractionDigits: 0 });
}

function readInputsFromBuffer(buffer: Buffer): Quick11ExcelPreviewInputs | null {
  try {
    const wb = XLSX.read(buffer, { type: "buffer" });
    const ws = wb.Sheets["首頁"] ?? wb.Sheets["貸款試算"] ?? wb.Sheets[wb.SheetNames[0] ?? ""];
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

function side(label: string, value: string, highlight = false): Quick11ExcelPreviewSideRow {
  return { label, value, highlight };
}

function buildPreviewRows(inputs: Quick11ExcelPreviewInputs, results: Quick11ExcelPreviewResults): Quick11ExcelPreviewRow[] {
  const warnHighlight =
    results.dtiPct >= 50 ? "warn" : results.dtiPct >= 35 ? "warnMid" : "result";

  return [
    { kind: "title", cells: ["破產計算機 · 貸款利息試算表（公式可改）", "", "", ""] },
    { kind: "subtitle", cells: ["【 輸入區 】改 B 欄數字即可自動計算", "", "", ""] },
    { kind: "panel", cells: ["輸入參數", "", "", ""], side: side("參數總覽", "") },
    { kind: "header", cells: ["項目", "數值", "單位", "說明"], side: side("摘要", "數值", true) },
    {
      kind: "data",
      highlight: "input",
      cells: ["貸款本金", fmtMoney(inputs.principal), "NT$", "例：1200 萬"],
      side: side("貸款本金", `NT$ ${fmtMoney(inputs.principal)}`),
    },
    {
      kind: "data",
      highlight: "input",
      cells: ["年利率", inputs.annualRate.toFixed(2), "%", "例：2.2 純數字"],
      side: side("年利率", `${inputs.annualRate.toFixed(2)}%`),
    },
    {
      kind: "data",
      highlight: "input",
      cells: ["貸款年期", String(inputs.years), "年", "例：30 純數字"],
      side: side("貸款年期", `${inputs.years} 年`),
    },
    {
      kind: "data",
      highlight: "input",
      cells: ["月收入（預警）", fmtMoney(inputs.monthlyIncome), "NT$", "算 DTI 用"],
      side: side("月收入（預警）", `NT$ ${fmtMoney(inputs.monthlyIncome)}`),
    },
    { kind: "spacer", cells: ["", "", "", ""] },
    { kind: "panel", cells: ["試算結果", "", "", ""], side: side("資金總覽", "") },
    { kind: "header", cells: ["項目", "結果", "單位", "公式說明"], side: side("摘要", "數值", true) },
    {
      kind: "data",
      highlight: "result",
      cells: ["本息均攤 · 每月繳款", fmtMoney(results.monthlyAnnuity), "NT$", "PMT：月利率＝年利率÷12÷100"],
      side: side("總繳金額", `NT$ ${fmtMoney(results.annuityTotalRepayment)}`),
    },
    {
      kind: "data",
      highlight: "result",
      cells: ["本息均攤 · 總繳利息", fmtMoney(results.totalInterest), "NT$", "總付款－本金"],
      side: side("本金", `NT$ ${fmtMoney(inputs.principal)}`),
    },
    {
      kind: "data",
      highlight: "result",
      cells: ["DTI 債務收入比", `${results.dtiPct.toFixed(1)}%`, "%", "月付÷月收入；<35% 安全；≥50% 預警"],
      side: side("總利息", `NT$ ${fmtMoney(results.totalInterest)}`),
    },
    {
      kind: "data",
      highlight: "result",
      cells: ["", "", "", ""],
      side: side("利息佔本金比例", `${results.interestToPrincipalPct.toFixed(2)}%`, true),
    },
    {
      kind: "warnBanner",
      cells: [
        results.dtiPct >= 50
          ? "⚠ 財務健康狀態｜破產預警：先降月付或提高收入"
          : results.dtiPct >= 35
            ? "⚠ 財務健康狀態｜壓力偏高：月付偏緊，建議調整貸款條件"
            : "✓ 財務健康狀態｜安全區：現金流尚可",
        "",
        "",
        "",
      ],
      highlight: warnHighlight,
    },
    {
      kind: "disclaimer",
      cells: ["（試算結果僅供參考，實際以銀行／法令為準；負債比建議＜35%，≥50% 為破產預警。）", "", "", ""],
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
