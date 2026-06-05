/**
 * 產生破產計算機可改公式的 Excel 範本（本息均攤、本金均攤、DTI）
 * 執行：node scripts/generate-quick11-loan-excel.mjs
 */
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

const OUT_DIR = path.join(import.meta.dirname, "..", "assets", "downloads");
const OUT_FILE = path.join(OUT_DIR, "quick11-loan-dti-template.xlsx");

const wb = new ExcelJS.Workbook();
wb.creator = "財富自由計算機";
wb.created = new Date();

const ws = wb.addWorksheet("貸款試算", {
  views: [{ state: "frozen", ySplit: 1 }],
});

ws.columns = [
  { width: 22 },
  { width: 18 },
  { width: 14 },
  { width: 36 },
];

const title = ws.addRow(["破產計算機 · 貸款利息試算表（公式可改）", "", "", ""]);
title.font = { bold: true, size: 14, color: { argb: "FF1E3A8A" } };
ws.mergeCells("A1:D1");

ws.addRow([]);
ws.addRow(["【輸入區】改 B 欄數字即可", "", "", ""]).font = { bold: true };
ws.addRow(["項目", "數值", "單位", "說明"]);
ws.addRow(["貸款本金", 1200000, "NT$", "例：120 萬"]);
ws.addRow(["年利率", 2.2, "%", "例：2.2"]);
ws.addRow(["貸款年期", 30, "年", "例：30"]);
ws.addRow(["月收入（預警）", 80000, "NT$", "算 DTI 用"]);

const rPrincipal = 5;
const rRate = 6;
const rYears = 7;
const rIncome = 8;

ws.addRow([]);
ws.addRow(["【試算結果】", "", "", ""]).font = { bold: true };
ws.addRow(["項目", "結果", "單位", "公式說明"]);

const rAnnuity = 11;
ws.addRow([
  "本息均攤 · 每月繳款",
  {
    formula: `PMT(B${rRate}/12/100,B${rYears}*12,-B${rPrincipal})`,
  },
  "NT$",
  "Excel PMT：固定月付",
]);

const rEqFirst = 12;
ws.addRow([
  "本金均攤 · 首期月付",
  {
    formula: `B${rPrincipal}/(B${rYears}*12)+B${rPrincipal}*B${rRate}/12/100`,
  },
  "NT$",
  "首期＝本金攤還＋首期利息",
]);

const rTotalIntAnnuity = 13;
ws.addRow([
  "本息均攤 · 總繳利息",
  {
    formula: `B${rAnnuity}*B${rYears}*12-B${rPrincipal}`,
  },
  "NT$",
  "總付款－本金",
]);

const rDti = 14;
ws.addRow([
  "DTI（月付／月收入）",
  {
    formula: `IF(B${rIncome}=0,0,B${rAnnuity}/B${rIncome})`,
  },
  "比率",
  "建議 <35% 較安全；>50% 預警",
]);

const rDtiPct = 15;
ws.addRow([
  "DTI 百分比",
  { formula: `B${rDti}*100` },
  "%",
  "破產計算機同款指標",
]);

const rWarn = 16;
ws.addRow([
  "破產預警文字",
  {
    formula: `IF(B${rDtiPct}>=50,"準備吃土：先降月付或拉高收入",IF(B${rDtiPct}>=35,"壓力偏高：月付偏緊","安全區：現金流尚可"))`,
  },
  "",
  "對照 quick-11 預警",
]);

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

// 格式
for (let r = 4; r <= 8; r++) {
  ws.getCell(`B${r}`).numFmt = r === rRate ? "0.00" : "#,##0";
}
for (let r = rAnnuity; r <= rDtiPct; r++) {
  ws.getCell(`B${r}`).numFmt = r === rDti ? "0.00%" : r === rDtiPct ? "0.0" : "#,##0";
}
ws.getCell(`B${rAnnuity}`).font = { bold: true, color: { argb: "FF0369A1" } };
ws.getCell(`B${rDtiPct}`).font = { bold: true, color: { argb: "FFB45309" } };

fs.mkdirSync(OUT_DIR, { recursive: true });
await wb.xlsx.writeFile(OUT_FILE);
console.log("Wrote", OUT_FILE);
