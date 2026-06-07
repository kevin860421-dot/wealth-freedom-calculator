/**
 * 產生破產計算機 Excel 範本
 * 版面 1:1 對齊 /quick-11/excel-preview（單一白卡片 + 表格外 footer）
 * 執行：node scripts/generate-quick11-loan-excel.mjs
 */
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

const OUT_DIR = path.join(import.meta.dirname, "..", "assets", "downloads");
const OUT_FILE = path.join(OUT_DIR, "quick11-loan-dti-template.xlsx");
const OUT_TMP = path.join(OUT_DIR, "quick11-loan-dti-template.tmp.xlsx");

const DEFAULTS = {
  principal: 12_000_000,
  annualRate: 2.2,
  years: 30,
  monthlyIncome: 80_000,
};

/** 與 excel-preview-view.tsx 同色 */
const C = {
  pageBg: "FFF8F9FA",
  white: "FFFFFFFF",
  headerFill: "FFF0F4F8",
  border: "FFE2E8F0",
  title: "FF2D3748",
  label: "FF4A5568",
  inputValue: "FF0284C7",
  resultValue: "FF0369A1",
  warn: "FFD97706",
  danger: "FFDC2626",
  dangerBg: "FFFEF2F2",
  warnBg: "FFFFF7ED",
  safe: "FF059669",
};

/** 繁中 Windows Excel 顯示名稱 */
const FONT = "微軟正黑體";
const EDGE = { style: "thin", color: { argb: C.border } };

function cellFont({ bold = false, size = 11, color = C.title } = {}) {
  return { bold, size, name: FONT, color: { argb: color } };
}

const wb = new ExcelJS.Workbook();
wb.creator = "財富自由計算機";
wb.created = new Date();

const ws = wb.addWorksheet("貸款試算", {
  views: [{ showGridLines: false }],
  properties: { defaultRowHeight: 22 },
});

/** A 欄左側縮排（約等同 px-3～4） */
const A_INDENT = 2;
ws.columns = [{ width: 30 }, { width: 20 }, { width: 11 }, { width: 56 }];

function setFill(cell, argb) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function align(cell, horizontal = "left", { indent = 0 } = {}) {
  cell.alignment = {
    horizontal,
    vertical: "middle",
    wrapText: false,
    shrinkToFit: false,
    indent,
  };
}

function mergeAD(row) {
  try {
    ws.unMergeCells(`A${row}:D${row}`);
  } catch {
    /* ok */
  }
  for (const col of ["B", "C", "D"]) {
    ws.getCell(`${col}${row}`).value = null;
  }
  ws.mergeCells(`A${row}:D${row}`);
  align(ws.getCell(`A${row}`), "left");
}

function setBorder(cell, parts) {
  cell.border = parts;
}

function applyOuterCard(topRow, bottomRow) {
  for (let c = 1; c <= 4; c++) {
    const top = ws.getCell(topRow, c);
    top.border = { ...(top.border || {}), top: EDGE };
    const bottom = ws.getCell(bottomRow, c);
    bottom.border = { ...(bottom.border || {}), bottom: EDGE };
  }
  for (let r = topRow; r <= bottomRow; r++) {
    const left = ws.getCell(r, 1);
    left.border = { ...(left.border || {}), left: EDGE };
    const right = ws.getCell(r, 4);
    right.border = { ...(right.border || {}), right: EDGE };
  }
}

function styleGridRow(r, { header = false, valueStyle = "input", dti = false, warn = false } = {}) {
  ws.getRow(r).height = header ? 26 : warn ? 28 : 24;
  for (let c = 1; c <= 4; c++) {
    const cell = ws.getCell(r, c);
    setBorder(cell, { top: EDGE, left: EDGE, bottom: EDGE, right: EDGE });
    align(cell, c === 1 ? "left" : c === 2 ? "right" : c === 3 ? "center" : "left", {
      indent: c === 1 ? A_INDENT : 0,
    });

    if (header) {
      setFill(cell, C.headerFill);
      cell.font = cellFont({ bold: true, size: 11, color: C.label });
      continue;
    }

    setFill(cell, C.white);
    if (c === 1) {
      cell.font = cellFont({ size: 11, color: C.title });
    } else if (c === 2) {
      const color = dti ? C.warn : valueStyle === "input" ? C.inputValue : C.resultValue;
      cell.font = cellFont({ bold: true, size: 11, color });
      align(cell, "right");
    } else if (c === 3) {
      cell.font = cellFont({ size: 11, color: C.label });
      align(cell, "center");
    } else {
      cell.font = cellFont({ size: 11, color: C.label });
    }

    if (warn && c === 1) {
      cell.font = cellFont({ bold: true, size: 11, color: C.danger });
    }
  }
}

function styleBandRow(r, text, { titleSize = false } = {}) {
  mergeAD(r);
  const cell = ws.getCell(`A${r}`);
  cell.value = text;
  setFill(cell, titleSize ? C.white : C.pageBg);
  cell.font = cellFont({ bold: true, size: titleSize ? 14 : 11, color: C.title });
  align(cell, "left", { indent: titleSize || text.includes("【") ? A_INDENT : 0 });
  ws.getRow(r).height = titleSize ? 32 : text.includes("【") ? 28 : 12;
  setBorder(cell, titleSize ? { bottom: EDGE } : {});
}

function styleWarnRow(r, dtiRow) {
  ws.getRow(r).height = 28;
  const label = ws.getCell(`A${r}`);
  setBorder(label, { top: EDGE, left: EDGE, bottom: EDGE, right: EDGE });
  align(label, "left", { indent: A_INDENT });
  label.font = cellFont({ bold: true, size: 11, color: C.danger });

  try {
    ws.unMergeCells(`B${r}:D${r}`);
  } catch {
    /* ok */
  }
  ws.getCell(`C${r}`).value = null;
  ws.getCell(`D${r}`).value = null;
  ws.mergeCells(`B${r}:D${r}`);
  const msg = ws.getCell(`B${r}`);
  msg.value = {
    formula: `IF(B${dtiRow}>=0.5,"⚠ 破產預警：先降月付或拉高收入",IF(B${dtiRow}>=0.35,"⚠ 壓力偏高：月付偏緊","✓ 安全區：現金流尚可"))`,
  };
  setBorder(msg, { top: EDGE, bottom: EDGE, right: EDGE });
  align(msg, "left");
  msg.font = cellFont({ bold: true, size: 11, color: C.danger });
}

// ========== 列結構（與 buildPreviewRows 一致）==========
const R = {
  title: 1,
  spacer1: 2,
  inputSection: 3,
  inputHeader: 4,
  principal: 5,
  rate: 6,
  years: 7,
  income: 8,
  spacer2: 9,
  resultSection: 10,
  resultHeader: 11,
  annuity: 12,
  totalInt: 13,
  dti: 14,
  warn: 15,
  spacerAfterCard: 16,
};

styleBandRow(R.title, "破產計算機 · 貸款利息試算表（公式可改）", { titleSize: true });
styleBandRow(R.spacer1, "");
styleBandRow(R.inputSection, "【輸入區】改 B 欄數字即可");

ws.getCell(`A${R.inputHeader}`).value = "項目";
ws.getCell(`B${R.inputHeader}`).value = "數值";
ws.getCell(`C${R.inputHeader}`).value = "單位";
ws.getCell(`D${R.inputHeader}`).value = "說明";
styleGridRow(R.inputHeader, { header: true });

ws.getCell(`A${R.principal}`).value = "貸款本金";
ws.getCell(`B${R.principal}`).value = DEFAULTS.principal;
ws.getCell(`C${R.principal}`).value = "NT$";
ws.getCell(`D${R.principal}`).value = "例：1200 萬";

ws.getCell(`A${R.rate}`).value = "年利率";
ws.getCell(`B${R.rate}`).value = DEFAULTS.annualRate;
ws.getCell(`C${R.rate}`).value = "%";
ws.getCell(`D${R.rate}`).value = "例：2.2 純數字";

ws.getCell(`A${R.years}`).value = "貸款年期";
ws.getCell(`B${R.years}`).value = DEFAULTS.years;
ws.getCell(`C${R.years}`).value = "年";
ws.getCell(`D${R.years}`).value = "例：30 純數字";

ws.getCell(`A${R.income}`).value = "月收入（預警）";
ws.getCell(`B${R.income}`).value = DEFAULTS.monthlyIncome;
ws.getCell(`C${R.income}`).value = "NT$";
ws.getCell(`D${R.income}`).value = "算 DTI 用";

for (const r of [R.principal, R.rate, R.years, R.income]) {
  styleGridRow(r, { valueStyle: "input" });
}

styleBandRow(R.spacer2, "");
styleBandRow(R.resultSection, "【試算結果】");

ws.getCell(`A${R.resultHeader}`).value = "項目";
ws.getCell(`B${R.resultHeader}`).value = "結果";
ws.getCell(`C${R.resultHeader}`).value = "單位";
ws.getCell(`D${R.resultHeader}`).value = "公式說明";
styleGridRow(R.resultHeader, { header: true });

ws.getCell(`A${R.annuity}`).value = "本息均攤 · 每月繳款";
ws.getCell(`B${R.annuity}`).value = {
  formula: `PMT(B${R.rate}/12/100,B${R.years}*12,-B${R.principal})`,
};
ws.getCell(`C${R.annuity}`).value = "NT$";
ws.getCell(`D${R.annuity}`).value = "PMT：月利率＝年利率÷12÷100";

ws.getCell(`A${R.totalInt}`).value = "本息均攤 · 總繳利息";
ws.getCell(`B${R.totalInt}`).value = { formula: `B${R.annuity}*B${R.years}*12-B${R.principal}` };
ws.getCell(`C${R.totalInt}`).value = "NT$";
ws.getCell(`D${R.totalInt}`).value = "總付款－本金";

ws.getCell(`A${R.dti}`).value = "DTI 債務收入比";
ws.getCell(`B${R.dti}`).value = { formula: `IF(B${R.income}=0,0,B${R.annuity}/B${R.income})` };
ws.getCell(`C${R.dti}`).value = "%";
ws.getCell(`D${R.dti}`).value = "月付÷月收入；<35% 安全；≥50% 預警";

for (const r of [R.annuity, R.totalInt]) {
  styleGridRow(r, { valueStyle: "result" });
}
styleGridRow(R.dti, { valueStyle: "result", dti: true });

ws.getCell(`A${R.warn}`).value = "財務健康狀態";
styleWarnRow(R.warn, R.dti);

// 白卡片外框（列 1～15，同預覽 rounded border 區塊）
applyOuterCard(R.title, R.warn);

// 頁面底色（卡片內 section／spacer）
for (const r of [R.spacer1, R.inputSection, R.spacer2, R.resultSection]) {
  mergeAD(r);
  setFill(ws.getCell(`A${r}`), C.pageBg);
}

// 表格下方留白（無超連結，導流改由網頁預覽按鈕）
mergeAD(R.spacerAfterCard);
setFill(ws.getCell(`A${R.spacerAfterCard}`), C.pageBg);
ws.getRow(R.spacerAfterCard).height = 24;

// 數字格式
ws.getCell(`B${R.principal}`).numFmt = "#,##0";
ws.getCell(`B${R.rate}`).numFmt = "0.00";
ws.getCell(`B${R.years}`).numFmt = "0";
ws.getCell(`B${R.income}`).numFmt = "#,##0";
ws.getCell(`B${R.annuity}`).numFmt = "#,##0";
ws.getCell(`B${R.totalInt}`).numFmt = "#,##0";
ws.getCell(`B${R.dti}`).numFmt = "0.0%";

ws.addConditionalFormatting({
  ref: `A${R.warn}:D${R.warn}`,
  rules: [
    {
      type: "expression",
      priority: 1,
      formulae: [`$B$${R.dti}>=0.5`],
      style: {
        fill: { type: "pattern", pattern: "solid", bgColor: { argb: C.dangerBg } },
        font: { ...cellFont({ bold: true, color: C.danger }) },
      },
    },
    {
      type: "expression",
      priority: 2,
      formulae: [`AND($B$${R.dti}>=0.35,$B$${R.dti}<0.5)`],
      style: {
        fill: { type: "pattern", pattern: "solid", bgColor: { argb: C.warnBg } },
        font: { ...cellFont({ bold: true, color: C.warn }) },
      },
    },
    {
      type: "expression",
      priority: 3,
      formulae: [`$B$${R.dti}<0.35`],
      style: {
        font: { ...cellFont({ bold: true, color: C.safe }) },
      },
    },
  ],
});

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
