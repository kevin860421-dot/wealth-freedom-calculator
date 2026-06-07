/**
 * 產生破產計算機可改公式的 Excel 範本（本息均攤、本金均攤、DTI）
 * 執行：node scripts/generate-quick11-loan-excel.mjs
 */
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

const OUT_DIR = path.join(import.meta.dirname, "..", "assets", "downloads");
const OUT_FILE = path.join(OUT_DIR, "quick11-loan-dti-template.xlsx");
const OUT_TMP = path.join(OUT_DIR, "quick11-loan-dti-template.tmp.xlsx");

/** 與 quick-11 預設試算一致 */
const DEFAULTS = {
  principal: 12_000_000,
  annualRate: 2.2,
  years: 30,
  monthlyIncome: 80_000,
};

const COLORS = {
  bg: "FFF8F9FA",
  white: "FFFFFFFF",
  headerFill: "FFF0F4F8",
  border: "FFE2E8F0",
  title: "FF2D3748",
  label: "FF4A5568",
  accent: "FF2563EB",
  warn: "FFB45309",
  danger: "FFDC2626",
  safe: "FF059669",
};

const wb = new ExcelJS.Workbook();
wb.creator = "財富自由計算機";
wb.created = new Date();

const ws = wb.addWorksheet("貸款試算", {
  views: [{ state: "frozen", ySplit: 1, showGridLines: true }],
  properties: { defaultRowHeight: 22 },
});

ws.columns = [
  { width: 24 },
  { width: 20 },
  { width: 12 },
  { width: 38 },
];

function styleRange(fromRow, toRow, fromCol, toCol, fn) {
  for (let r = fromRow; r <= toRow; r++) {
    for (let c = fromCol; c <= toCol; c++) {
      fn(ws.getCell(r, c), r, c);
    }
  }
}

function thinBorder(cell) {
  cell.border = {
    top: { style: "thin", color: { argb: COLORS.border } },
    left: { style: "thin", color: { argb: COLORS.border } },
    bottom: { style: "thin", color: { argb: COLORS.border } },
    right: { style: "thin", color: { argb: COLORS.border } },
  };
}

function setFill(cell, argb) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
}

// --- 標題 ---
ws.getRow(1).height = 28;
const titleCell = ws.getCell("A1");
titleCell.value = "破產計算機 · 貸款利息試算表（公式可改）";
titleCell.font = { bold: true, size: 14, color: { argb: COLORS.title } };
titleCell.alignment = { vertical: "middle" };
ws.mergeCells("A1:D1");
setFill(titleCell, COLORS.white);

ws.addRow([]);

// --- 輸入區 ---
const inputSectionRow = ws.rowCount + 1;
ws.addRow(["【輸入區】改 B 欄數字即可", "", "", ""]).font = {
  bold: true,
  color: { argb: COLORS.title },
};

const inputHeaderRow = ws.rowCount + 1;
ws.addRow(["項目", "數值", "單位", "說明"]);
ws.getRow(inputHeaderRow).font = { bold: true, color: { argb: COLORS.label } };
ws.getRow(inputHeaderRow).height = 24;

ws.addRow(["貸款本金", DEFAULTS.principal, "NT$", "例：1200 萬"]);
const rPrincipal = ws.rowCount;
ws.addRow(["年利率", DEFAULTS.annualRate, "%", "例：2.2（純數字，非文字）"]);
const rRate = ws.rowCount;
ws.addRow(["貸款年期", DEFAULTS.years, "年", "例：30（純數字）"]);
const rYears = ws.rowCount;
ws.addRow(["月收入（預警）", DEFAULTS.monthlyIncome, "NT$", "算 DTI 用"]);
const rIncome = ws.rowCount;

ws.addRow([]);

// --- 試算結果 ---
ws.addRow(["【試算結果】", "", "", ""]).font = { bold: true, color: { argb: COLORS.title } };

ws.addRow(["項目", "結果", "單位", "公式說明"]);
const resultHeaderRow = ws.rowCount;
ws.getRow(resultHeaderRow).font = { bold: true, color: { argb: COLORS.label } };
ws.getRow(resultHeaderRow).height = 24;

ws.addRow([
  "本息均攤 · 每月繳款",
  { formula: `PMT(B${rRate}/12/100,B${rYears}*12,-B${rPrincipal})` },
  "NT$",
  "月利率 r＝年利率÷12÷100；n＝年期×12",
]);
const rAnnuity = ws.rowCount;

ws.addRow([
  "本金均攤 · 首期月付",
  { formula: `B${rPrincipal}/(B${rYears}*12)+B${rPrincipal}*B${rRate}/12/100` },
  "NT$",
  "首期＝本金攤還＋首期利息",
]);
const rEqFirst = ws.rowCount;

ws.addRow([
  "本息均攤 · 總繳利息",
  { formula: `B${rAnnuity}*B${rYears}*12-B${rPrincipal}` },
  "NT$",
  "總付款－本金",
]);
const rTotalInt = ws.rowCount;

ws.addRow([
  "DTI（月付／月收入）",
  { formula: `IF(B${rIncome}=0,0,B${rAnnuity}/B${rIncome})` },
  "比率",
  "建議 <35% 較安全；≥50% 預警",
]);
const rDti = ws.rowCount;

ws.addRow([
  "DTI 百分比",
  { formula: `B${rDti}*100` },
  "%",
  "破產計算機同款指標",
]);
const rDtiPct = ws.rowCount;

ws.addRow([
  "財務健康狀態",
  {
    formula: `IF(B${rDtiPct}>=50,"⚠ 破產預警：先降月付或拉高收入",IF(B${rDtiPct}>=35,"⚠ 壓力偏高：月付偏緊","✓ 安全區：現金流尚可"))`,
  },
  "",
  "DTI>50% 自動顯示預警",
]);
const rWarn = ws.rowCount;

ws.addRow([]);

ws.addRow([
  "線上試算",
  "https://wealth-freedom-calculator.vercel.app/quick-11",
  "",
  "手動輸入嫌麻煩可回站內試算",
]);
ws.addRow([
  "財富自由計算機",
  "https://wealth-freedom-calculator.vercel.app/",
  "",
  "長期 FIRE／股利課稅／54C 完整版",
]);

// --- 數字格式（B 欄一律數值）---
ws.getCell(`B${rPrincipal}`).numFmt = "#,##0";
ws.getCell(`B${rRate}`).numFmt = "0.00";
ws.getCell(`B${rYears}`).numFmt = "0";
ws.getCell(`B${rIncome}`).numFmt = "#,##0";

for (const r of [rAnnuity, rEqFirst, rTotalInt]) {
  ws.getCell(`B${r}`).numFmt = "#,##0";
}
ws.getCell(`B${rDti}`).numFmt = "0.00%";
ws.getCell(`B${rDtiPct}`).numFmt = '0.0"%"';

// --- 視覺：白底卡片 ---
const lastDataRow = ws.rowCount;
for (let r = 1; r <= lastDataRow; r++) {
  ws.getRow(r).height = Math.max(ws.getRow(r).height || 22, 22);
}
ws.getRow(1).height = 28;
ws.getRow(inputHeaderRow).height = 24;
ws.getRow(resultHeaderRow).height = 24;

styleRange(1, lastDataRow, 1, 4, (cell) => {
  if (!cell.fill?.fgColor?.argb || cell.fill.fgColor.argb === "FFFFFFFF") {
    setFill(cell, COLORS.bg);
  }
});

styleRange(inputSectionRow, rIncome, 1, 4, (cell, r, c) => {
  setFill(cell, COLORS.white);
  thinBorder(cell);
  cell.font = { ...(cell.font || {}), color: { argb: r === inputHeaderRow ? COLORS.label : COLORS.title } };
  if (r === inputHeaderRow) setFill(cell, COLORS.headerFill);
  if (c === 2 && r > inputHeaderRow) {
    cell.font = { bold: true, color: { argb: COLORS.accent } };
    cell.alignment = { horizontal: "right", vertical: "middle" };
  }
  cell.alignment = { ...(cell.alignment || {}), vertical: "middle", wrapText: true };
});

styleRange(resultHeaderRow, rWarn, 1, 4, (cell, r, c) => {
  setFill(cell, COLORS.white);
  thinBorder(cell);
  if (r === resultHeaderRow) setFill(cell, COLORS.headerFill);
  cell.alignment = { vertical: "middle", wrapText: true };
  if (c === 2 && r > resultHeaderRow) {
    cell.alignment = { horizontal: "right", vertical: "middle" };
  }
});

ws.getCell(`B${rAnnuity}`).font = { bold: true, color: { argb: COLORS.accent } };
ws.getCell(`B${rDtiPct}`).font = { bold: true, color: { argb: COLORS.warn } };

// 預警列依公式結果著色（條件式較複雜，改以說明色標）
ws.getCell(`A${rWarn}`).font = { bold: true, color: { argb: COLORS.danger } };
ws.getCell(`B${rWarn}`).font = { bold: true, color: { argb: COLORS.danger } };
ws.getCell(`B${rWarn}`).alignment = { horizontal: "left", vertical: "middle", wrapText: true };

// 連結列
for (const r of [rWarn + 2, rWarn + 3]) {
  const linkCell = ws.getCell(`B${r}`);
  if (typeof linkCell.value === "string" && linkCell.value.startsWith("http")) {
    linkCell.value = { text: linkCell.value, hyperlink: linkCell.value };
    linkCell.font = { color: { argb: COLORS.accent }, underline: true };
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true });
await wb.xlsx.writeFile(OUT_TMP);
try {
  if (fs.existsSync(OUT_FILE)) fs.unlinkSync(OUT_FILE);
  fs.renameSync(OUT_TMP, OUT_FILE);
  console.log("Wrote", OUT_FILE);
} catch (err) {
  console.warn("Could not replace locked file; wrote", OUT_TMP);
  console.warn(err.message);
}
console.log("Rows:", { rPrincipal, rRate, rYears, rIncome, rAnnuity, rTotalInt, rDti, rDtiPct, rWarn });
