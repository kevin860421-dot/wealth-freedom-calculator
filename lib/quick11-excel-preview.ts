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
  annuityFirstInterest: number;
  totalInterest: number;
  annuityTotalRepayment: number;
  epFirstPayment: number;
  epFirstInterest: number;
  epTotalInterest: number;
  epTotalRepayment: number;
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
  const annuityFirstInterest = principal * r;
  const annuityTotalRepayment = principal + totalInterest;

  const epFirstInterest = principal * r;
  const epFirstPayment = principal / n + epFirstInterest;
  const epTotalInterest = principal * r * (n + 1) / 2;
  const epTotalRepayment = principal + epTotalInterest;

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
    annuityFirstInterest: Math.round(annuityFirstInterest),
    totalInterest: Math.round(totalInterest),
    annuityTotalRepayment: Math.round(annuityTotalRepayment),
    epFirstPayment: Math.round(epFirstPayment),
    epFirstInterest: Math.round(epFirstInterest),
    epTotalInterest: Math.round(epTotalInterest),
    epTotalRepayment: Math.round(epTotalRepayment),
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

  const paramSide = (row: number) => {
    if (row === 0) return side("摘要", "數值", true);
    if (row === 1) return side("貸款本金", `NT$ ${fmtMoney(inputs.principal)}`);
    if (row === 2) return side("年利率", `${inputs.annualRate.toFixed(2)}%`);
    if (row === 3) return side("貸款年期", `${inputs.years} 年`);
    return side("月收入", `NT$ ${fmtMoney(inputs.monthlyIncome)}`);
  };

  const fundSide = (row: number) => {
    const rows: Quick11ExcelPreviewSideRow[] = [
      side("本息均攤", "數值", true),
      side("本息 · 每月繳款", `NT$ ${fmtMoney(results.monthlyAnnuity)}`),
      side("本息 · 首期利息", `NT$ ${fmtMoney(results.annuityFirstInterest)}`),
      side("本息 · 總繳利息", `NT$ ${fmtMoney(results.totalInterest)}`),
      side("本息 · 總繳金額", `NT$ ${fmtMoney(results.annuityTotalRepayment)}`, true),
      side("本金平均 · 首月繳款", `NT$ ${fmtMoney(results.epFirstPayment)}`),
      side("本金平均 · 首期利息", `NT$ ${fmtMoney(results.epFirstInterest)}`),
      side("本金平均 · 總繳利息", `NT$ ${fmtMoney(results.epTotalInterest)}`),
      side("本金平均 · 總繳金額", `NT$ ${fmtMoney(results.epTotalRepayment)}`, true),
      side("負債比（DTI）", `${results.dtiPct.toFixed(1)}%`),
      side("利息佔本金比例", `${results.interestToPrincipalPct.toFixed(2)}%`, true),
      side("多出多少（本息）", `NT$ ${fmtMoney(results.totalInterest)}`, true),
    ];
    return rows[row] ?? side("", "");
  };

  return [
    { kind: "title", cells: ["破產計算機・貸款利息試算表（公式可改）", "", "", ""] },
    { kind: "subtitle", cells: ["【 輸入區 】改 B 欄數字即可自動計算", "", "", ""] },
    {
      kind: "panel",
      cells: ["✏️  輸入參數", "", "", ""],
      side: side("📋  參數總覽", ""),
    },
    {
      kind: "header",
      cells: ["項目", "數值", "單位", "說明"],
      side: paramSide(0),
    },
    {
      kind: "data",
      highlight: "input",
      cells: ["🏠  貸款本金", fmtMoney(inputs.principal), "NT$", "例：1200 萬"],
      side: paramSide(1),
    },
    {
      kind: "data",
      highlight: "input",
      cells: ["📊  年利率", inputs.annualRate.toFixed(2), "%", "例：2.2 純數字"],
      side: paramSide(2),
    },
    {
      kind: "data",
      highlight: "input",
      cells: ["📅  貸款年期", String(inputs.years), "年", "例：30 純數字"],
      side: paramSide(3),
    },
    {
      kind: "data",
      highlight: "input",
      cells: ["👤  月收入（預警）", fmtMoney(inputs.monthlyIncome), "NT$", "算 DTI 用"],
      side: paramSide(4),
    },
    { kind: "spacer", cells: ["", "", "", ""] },
    {
      kind: "panel",
      cells: ["🧮  試算結果", "", "", ""],
      side: side("💰  資金總覽", ""),
    },
    {
      kind: "header",
      cells: ["項目", "結果", "單位", "公式說明"],
      side: fundSide(0),
    },
    {
      kind: "data",
      highlight: "result",
      cells: ["本息均攤 · 每月繳款", fmtMoney(results.monthlyAnnuity), "NT$", "PMT：月利率＝年利率÷12÷100"],
      side: fundSide(1),
    },
    {
      kind: "data",
      highlight: "result",
      cells: ["本息均攤 · 首期利息", fmtMoney(results.annuityFirstInterest), "NT$", "第一個月利息"],
      side: fundSide(2),
    },
    {
      kind: "data",
      highlight: "result",
      cells: ["本息均攤 · 總繳利息", fmtMoney(results.totalInterest), "NT$", "總付款－本金"],
      side: fundSide(3),
    },
    {
      kind: "data",
      highlight: "result",
      cells: ["本息均攤 · 總繳金額", fmtMoney(results.annuityTotalRepayment), "NT$", "本金＋總利息"],
      side: fundSide(4),
    },
    {
      kind: "data",
      highlight: "result",
      cells: ["本金平均 · 首月繳款", fmtMoney(results.epFirstPayment), "NT$", "固定本金＋當月利息"],
      side: fundSide(5),
    },
    {
      kind: "data",
      highlight: "result",
      cells: ["本金平均 · 首期利息", fmtMoney(results.epFirstInterest), "NT$", "第一個月利息"],
      side: fundSide(6),
    },
    {
      kind: "data",
      highlight: "result",
      cells: ["本金平均 · 總繳利息", fmtMoney(results.epTotalInterest), "NT$", "遞減利息加總"],
      side: fundSide(7),
    },
    {
      kind: "data",
      highlight: "result",
      cells: ["本金平均 · 總繳金額", fmtMoney(results.epTotalRepayment), "NT$", "本金＋總利息"],
      side: fundSide(8),
    },
    {
      kind: "data",
      highlight: "result",
      cells: ["DTI 債務收入比", `${results.dtiPct.toFixed(1)}%`, "%", "本息月付÷月收入；<35% 安全"],
      side: fundSide(9),
    },
    {
      kind: "data",
      highlight: warnHighlight,
      cells: ["財務健康狀態", results.healthLabel, "", ""],
      side: fundSide(10),
    },
    {
      kind: "spacer",
      cells: ["", "", "", ""],
      side: fundSide(11),
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
      cells: [
        "（試算結果僅供參考，實際以銀行／法令為準；負債比建議＜35%，≥50% 為破產預警。）",
        "",
        "",
        "",
      ],
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
