/**
 * 產生破產計算機 Excel（首頁精簡 + 本息／本金 明細分頁）
 * 執行：npm run generate:quick11-excel
 */
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { deliverExcelToUserDownloads } from "./deliver-excel-to-user-downloads.mjs";

const OUT_DIR = path.join(import.meta.dirname, "..", "assets", "downloads");
const OUT_FILE = path.join(OUT_DIR, "quick11-loan-dti-template.xlsx");
const OUT_TMP = path.join(OUT_DIR, "quick11-loan-dti-template.tmp.xlsx");

const HOME_SHEET = "首頁";
const SHEET_ANNUITY = "本息均攤";
const SHEET_EQUAL = "本金平均";

const DEFAULTS = {
  principal: 12_000_000,
  annualRate: 2.2,
  years: 30,
  monthlyIncome: 80_000,
};

const TEMPLATE_VERSION = "v5b-result-row-links";

/** 明細分頁最多 50 年 */
const MAX_SCHEDULE_PERIODS = 600;

const C = {
  pageBg: "FFF8F9FA",
  white: "FFFFFFFF",
  headerDark: "FF0B2545",
  headerLight: "FFEFF6FF",
  bandLight: "FFF0F9FF",
  border: "FFE2E8F0",
  title: "FF1E293B",
  label: "FF475569",
  inputValue: "FF0284C7",
  resultValue: "FF0369A1",
  panelLabel: "FF64748B",
  warn: "FFEA580C",
  danger: "FFDC2626",
  dangerBg: "FFFEF2F2",
  warnBg: "FFFFF7ED",
  safe: "FF059669",
  safeBg: "FFECFDF5",
  /** 本息均攤按鈕 */
  btnAnnuity: "FF0284C7",
  /** 本金平均按鈕 */
  btnEqual: "FF059669",
};

const FONT = "微軟正黑體";
const EDGE = { style: "thin", color: { argb: C.border } };

const R = {
  title: 1,
  subtitle: 2,
  inputPanel: 3,
  inputHeader: 4,
  principal: 5,
  rate: 6,
  years: 7,
  income: 8,
  gapMid: 9,
  resultPanel: 10,
  resultHeader: 11,
  annPay: 12,
  eqPay: 13,
  annTotalInt: 14,
  dti: 15,
  warn: 16,
  disclaimer: 17,
};

const PR = R.principal;
const RT = R.rate;
const YR = R.years;
const INC = R.income;
const PAY = R.annPay;
const EQP = R.eqPay;
const TINT = R.annTotalInt;
const DTI = R.dti;

const HOME_PR = `'${HOME_SHEET}'!$B$${PR}`;
const HOME_RT = `'${HOME_SHEET}'!$B$${RT}`;
const HOME_YR = `'${HOME_SHEET}'!$B$${YR}`;
const HOME_PAY = `'${HOME_SHEET}'!$B$${PAY}`;
const HOME_N = `${HOME_YR}*12`;
const HOME_MR = `${HOME_RT}/12/100`;

function cellFont({ bold = false, size = 11, color = C.title, underline = false } = {}) {
  return { bold, size, name: FONT, color: { argb: color }, underline: underline ? "single" : undefined };
}

function setFill(cell, argb) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function align(cell, horizontal = "left", { indent = 0, wrap = false } = {}) {
  cell.alignment = { horizontal, vertical: "middle", wrapText: wrap, shrinkToFit: false, indent };
}

function mergeRow(ws, row, fromCol, toCol) {
  if (fromCol >= toCol) return;
  const from = ws.getCell(row, fromCol).address.replace(/\d+$/, "");
  const to = ws.getCell(row, toCol).address.replace(/\d+$/, "");
  try {
    ws.unMergeCells(`${from}${row}:${to}${row}`);
  } catch {
    /* ok */
  }
  for (let c = fromCol + 1; c <= toCol; c += 1) ws.getCell(row, c).value = null;
  ws.mergeCells(`${from}${row}:${to}${row}`);
}

function styleTitleRow(ws, row, text, { subtitle = false } = {}) {
  mergeRow(ws, row, 1, 7);
  const cell = ws.getCell(row, 1);
  cell.value = text;
  setFill(cell, subtitle ? C.pageBg : C.headerDark);
  cell.font = cellFont({ bold: true, size: subtitle ? 11 : 15, color: subtitle ? C.label : C.white });
  align(cell, "left", { indent: 1 });
  ws.getRow(row).height = subtitle ? 24 : 34;
}

function stylePanelHeader(ws, row, fromCol, toCol, text) {
  mergeRow(ws, row, fromCol, toCol);
  const cell = ws.getCell(row, fromCol);
  cell.value = text;
  setFill(cell, C.headerDark);
  cell.font = cellFont({ bold: true, size: 11, color: C.white });
  align(cell, "left", { indent: 1 });
  ws.getRow(row).height = 28;
  for (let c = fromCol; c <= toCol; c += 1) {
    ws.getCell(row, c).border = { top: EDGE, left: EDGE, bottom: EDGE, right: EDGE };
  }
}

function styleTableHeader(ws, row, cols, labels) {
  ws.getRow(row).height = 26;
  cols.forEach((col, i) => {
    const cell = ws.getCell(row, col);
    cell.value = labels[i] ?? "";
    setFill(cell, C.headerLight);
    cell.font = cellFont({ bold: true, size: 11, color: C.label });
    align(cell, i === 1 || i >= 2 ? "right" : "left", { indent: i === 0 ? 1 : 0 });
    cell.border = { top: EDGE, left: EDGE, bottom: EDGE, right: EDGE };
  });
}

function styleDataRow(ws, row, values, { kind = "input", alt = false, dti = false } = {}) {
  ws.getRow(row).height = 26;
  [1, 2, 3, 4].forEach((col, i) => {
    const cell = ws.getCell(row, col);
    cell.value = values[i] ?? "";
    setFill(cell, alt ? C.bandLight : C.white);
    cell.border = { top: EDGE, left: EDGE, bottom: EDGE, right: EDGE };
    if (i === 0) {
      cell.font = cellFont({ size: 11, color: C.title });
      align(cell, "left", { indent: 1 });
    } else if (i === 1) {
      cell.font = cellFont({ bold: true, size: 11, color: dti ? C.warn : kind === "input" ? C.inputValue : C.resultValue });
      align(cell, "right");
    } else if (i === 2) {
      cell.font = cellFont({ size: 10, color: C.label });
      align(cell, "center");
    } else {
      cell.font = cellFont({ size: 10, color: C.panelLabel });
      align(cell, "left");
    }
  });
}

function styleSideRow(ws, row, label, valueFormula, { header = false, highlight = false } = {}) {
  const labelCell = ws.getCell(row, 6);
  const valueCell = ws.getCell(row, 7);
  ws.getRow(row).height = 26;
  labelCell.value = label;
  setFill(labelCell, header ? C.headerLight : highlight ? C.bandLight : C.white);
  labelCell.font = cellFont({ bold: header, size: 11, color: header ? C.label : C.title });
  align(labelCell, "left", { indent: 1 });
  labelCell.border = { top: EDGE, left: EDGE, bottom: EDGE, right: EDGE };
  if (header) {
    valueCell.value = "數值";
    valueCell.font = cellFont({ bold: true, size: 11, color: C.label });
  } else {
    valueCell.value = valueFormula;
    valueCell.font = cellFont({ bold: true, size: 11, color: C.resultValue });
  }
  align(valueCell, "right");
  setFill(valueCell, header ? C.headerLight : highlight ? C.bandLight : C.white);
  valueCell.border = { top: EDGE, left: EDGE, bottom: EDGE, right: EDGE };
}

function applyPanelBorder(ws, topRow, bottomRow, leftCol, rightCol) {
  for (let c = leftCol; c <= rightCol; c += 1) {
    ws.getCell(topRow, c).border = { ...ws.getCell(topRow, c).border, top: EDGE };
    ws.getCell(bottomRow, c).border = { ...ws.getCell(bottomRow, c).border, bottom: EDGE };
  }
  for (let r = topRow; r <= bottomRow; r += 1) {
    ws.getCell(r, leftCol).border = { ...ws.getCell(r, leftCol).border, left: EDGE };
    ws.getCell(r, rightCol).border = { ...ws.getCell(r, rightCol).border, right: EDGE };
  }
}

function styleWarnBanner(ws, row, dtiRow) {
  mergeRow(ws, row, 1, 7);
  const cell = ws.getCell(row, 1);
  cell.value = {
    formula: `IF(B${dtiRow}>=0.5,"⚠ 財務健康狀態｜破產預警：先降月付或提高收入",IF(B${dtiRow}>=0.35,"⚠ 財務健康狀態｜壓力偏高：月付偏緊，建議調整貸款條件","✓ 財務健康狀態｜安全區：現金流尚可"))`,
  };
  setFill(cell, C.dangerBg);
  cell.font = cellFont({ bold: true, size: 11, color: C.danger });
  align(cell, "left", { indent: 1 });
  ws.getRow(row).height = 32;
  cell.border = { top: EDGE, left: EDGE, bottom: EDGE, right: EDGE };
}

function styleDisclaimer(ws, row) {
  mergeRow(ws, row, 1, 7);
  const cell = ws.getCell(row, 1);
  cell.value = "（試算結果僅供參考，實際以銀行／法令為準；負債比建議＜35%，≥50% 為破產預警。）";
  setFill(cell, C.pageBg);
  cell.font = cellFont({ size: 9, color: C.panelLabel });
  align(cell, "left", { indent: 1 });
  ws.getRow(row).height = 26;
}

/** 試算結果列：藍／綠底 + 超連結開啟明細分頁（取代下方獨立按鈕列） */
function styleResultScheduleLinkRow(
  ws,
  row,
  { label, valueFormula, unit, hint, targetSheet, btnColor },
) {
  ws.getRow(row).height = 34;
  for (let col = 1; col <= 4; col += 1) {
    const cell = ws.getCell(row, col);
    setFill(cell, btnColor);
    cell.border = { top: EDGE, left: EDGE, bottom: EDGE, right: EDGE };
  }

  const labelCell = ws.getCell(row, 1);
  labelCell.value = {
    text: `▸ ${label}`,
    hyperlink: `#'${targetSheet}'!A1`,
    tooltip: `開啟「${targetSheet}」每期繳款明細`,
  };
  labelCell.font = cellFont({ bold: true, size: 11, color: C.white, underline: false });
  align(labelCell, "left", { indent: 1 });

  const valueCell = ws.getCell(row, 2);
  valueCell.value = valueFormula;
  valueCell.font = cellFont({ bold: true, size: 12, color: C.white });
  align(valueCell, "right");
  valueCell.numFmt = "#,##0";

  const unitCell = ws.getCell(row, 3);
  unitCell.value = unit;
  unitCell.font = cellFont({ size: 10, color: C.white });
  align(unitCell, "center");

  const hintCell = ws.getCell(row, 4);
  hintCell.value = hint;
  hintCell.font = cellFont({ size: 10, color: C.white });
  align(hintCell, "left");
}


function writeScheduleRows(ws, { headerRow, firstRow, method }) {
  const hdr = headerRow;
  const nRef = HOME_N;
  const pmtRef = HOME_PAY;
  const prRef = HOME_PR;
  const mrRef = HOME_MR;
  const lastRow = firstRow + MAX_SCHEDULE_PERIODS - 1;

  for (let i = 0; i < MAX_SCHEDULE_PERIODS; i += 1) {
    const row = firstRow + i;
    const prev = row - 1;
    const periodExpr = `ROW()-${hdr}`;
    const active = `(${periodExpr})<=${nRef}`;

    ws.getCell(row, 1).value = { formula: `IF(${active},${periodExpr},"")` };

    const balStartCell = ws.getCell(row, 7);
    if (row === firstRow) {
      balStartCell.value = { formula: `IF(${active},${prRef},"")` };
    } else {
      balStartCell.value = { formula: `IF(${active},E${prev},"")` };
    }

    ws.getCell(row, 3).value = { formula: `IF(${active},G${row}*${mrRef},"")` };

    const prinFormula =
      method === "annuity"
        ? `IF(${active},IF(${periodExpr}=${nRef},G${row},MIN(G${row},${pmtRef}-C${row})),"")`
        : `IF(${active},IF(${periodExpr}=${nRef},G${row},MIN(G${row},${prRef}/${nRef})),"")`;

    ws.getCell(row, 4).value = { formula: prinFormula };
    ws.getCell(row, 2).value = { formula: `IF(${active},C${row}+D${row},"")` };
    ws.getCell(row, 5).value = { formula: `IF(${active},G${row}-D${row},"")` };

    ws.getRow(row).height = 22;

    for (let c = 1; c <= 5; c += 1) {
      const cell = ws.getCell(row, c);
      setFill(cell, i % 2 === 0 ? C.white : C.bandLight);
      cell.border = { top: EDGE, left: EDGE, bottom: EDGE, right: EDGE };
      cell.font = cellFont({ size: 10, color: c === 2 ? C.resultValue : C.title });
      align(cell, c === 1 ? "center" : "right");
      if (c >= 2) cell.numFmt = "#,##0";
    }
    ws.getCell(row, 7).numFmt = "#,##0";
  }

  ws.getColumn(7).hidden = true;
  return lastRow;
}

/** 窄版明細分頁：可【新建視窗】拖到 Excel 右側 */
function buildMethodScheduleSheet(wb, sheetName, method) {
  const tabColor = method === "annuity" ? C.btnAnnuity : C.btnEqual;
  const ws = wb.addWorksheet(sheetName, {
    properties: { defaultRowHeight: 22, tabColor: { argb: tabColor } },
  });

  ws.columns = [
    { width: 8 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 2 },
    { width: 12 },
  ];

  ws.views = [{ showGridLines: true, zoomScale: 100, activeCell: "A4" }];

  const backCell = ws.getCell(1, 1);
  backCell.value = { text: "← 回首頁試算", hyperlink: `#'${HOME_SHEET}'!A1` };
  backCell.font = cellFont({ bold: true, size: 11, color: C.inputValue, underline: true });

  mergeRow(ws, 1, 2, 5);
  const titleCell = ws.getCell(1, 2);
  titleCell.value = `${sheetName} · 每期繳款明細（連動首頁 B 欄）`;
  titleCell.font = cellFont({ bold: true, size: 13, color: C.title });
  align(titleCell, "left", { indent: 1 });
  ws.getRow(1).height = 28;

  mergeRow(ws, 2, 1, 5);
  const hintCell = ws.getCell(2, 1);
  hintCell.value =
    "右側視窗：【檢視】→【新建視窗】→【並排顯示】→ 拖曳此視窗到螢幕右邊｜改首頁 B5～B7 後此表自動重算";
  setFill(hintCell, C.bandLight);
  hintCell.font = cellFont({ size: 10, color: C.label });
  align(hintCell, "left", { indent: 1, wrap: true });
  ws.getRow(2).height = 36;

  const headerRow = 3;
  const firstRow = 4;
  styleTableHeader(ws, headerRow, [1, 2, 3, 4, 5], ["期數", "每期還款", "每期利息", "每期本金", "剩餘本金"]);
  const lastRow = writeScheduleRows(ws, { headerRow, firstRow, method });
  applyPanelBorder(ws, headerRow, lastRow, 1, 5);

  ws.getCell("G1").value = method;
  return ws;
}

function buildHomeSheet(wb) {
  const ws = wb.addWorksheet(HOME_SHEET, {
    properties: { defaultRowHeight: 24, tabColor: { argb: C.btnAnnuity } },
  });

  ws.views = [{ showGridLines: false, zoomScale: 100, activeCell: "B5" }];

  ws.columns = [
    { width: 28 },
    { width: 16 },
    { width: 14 },
    { width: 42 },
    { width: 16 },
    { width: 24 },
    { width: 20 },
  ];

  for (let r = 1; r <= R.disclaimer; r += 1) {
    for (let c = 1; c <= 7; c += 1) {
      if (!ws.getCell(r, c).fill?.fgColor) setFill(ws.getCell(r, c), C.pageBg);
    }
  }

  styleTitleRow(ws, R.title, "破產計算機 · 貸款利息試算表（公式可改）");
  styleTitleRow(ws, R.subtitle, "【 輸入區 】改 B 欄數字即可自動計算", { subtitle: true });

  stylePanelHeader(ws, R.inputPanel, 1, 4, "輸入參數");
  stylePanelHeader(ws, R.inputPanel, 6, 7, "參數總覽");
  styleTableHeader(ws, R.inputHeader, [1, 2, 3, 4], ["項目", "數值", "單位", "說明"]);
  styleSideRow(ws, R.inputHeader, "摘要", null, { header: true });

  styleDataRow(ws, R.principal, ["貸款本金", DEFAULTS.principal, "NT$", "例：1200 萬"], { kind: "input" });
  styleDataRow(ws, R.rate, ["年利率", DEFAULTS.annualRate, "%", "例：2.2 純數字"], { kind: "input", alt: true });
  styleDataRow(ws, R.years, ["貸款年期", DEFAULTS.years, "年", "例：30 純數字"], { kind: "input" });
  styleDataRow(ws, R.income, ["月收入（預警）", DEFAULTS.monthlyIncome, "NT$", "算 DTI 用"], { kind: "input", alt: true });

  styleSideRow(ws, R.principal, "貸款本金", { formula: `B${PR}` });
  styleSideRow(ws, R.rate, "年利率", { formula: `TEXT(B${RT},"0.00")&"%"` });
  styleSideRow(ws, R.years, "貸款年期", { formula: `TEXT(B${YR},"0")&" 年"` });
  styleSideRow(ws, R.income, "月收入（預警）", { formula: `B${INC}` });

  ws.getRow(R.gapMid).height = 10;

  stylePanelHeader(ws, R.resultPanel, 1, 4, "試算結果");
  stylePanelHeader(ws, R.resultPanel, 6, 7, "資金總覽");
  styleTableHeader(ws, R.resultHeader, [1, 2, 3, 4], ["項目", "結果", "單位", "公式說明"]);
  styleSideRow(ws, R.resultHeader, "摘要", null, { header: true });

  const mr = `B${RT}/12/100`;
  const n = `B${YR}*12`;
  const eqFirstPay = `B${PR}*(${mr})+B${PR}/(${n})`;

  styleResultScheduleLinkRow(ws, R.annPay, {
    label: "本息均攤 · 每期繳款明細",
    valueFormula: { formula: `PMT(${mr},${n},-B${PR})` },
    unit: "NT$",
    hint: "點此列開啟明細分頁",
    targetSheet: SHEET_ANNUITY,
    btnColor: C.btnAnnuity,
  });
  styleResultScheduleLinkRow(ws, R.eqPay, {
    label: "本金平均 · 每期繳款明細",
    valueFormula: { formula: eqFirstPay },
    unit: "NT$",
    hint: "點此列開啟明細分頁（第一期）",
    targetSheet: SHEET_EQUAL,
    btnColor: C.btnEqual,
  });
  styleDataRow(
    ws,
    R.annTotalInt,
    ["本息均攤 · 總繳利息", { formula: `B${PAY}*${n}-B${PR}` }, "NT$", "總付款－本金"],
    { kind: "result", alt: true },
  );
  styleDataRow(
    ws,
    R.dti,
    ["DTI 債務收入比", { formula: `IF(B${INC}=0,0,B${PAY}/B${INC})` }, "%", "月付÷月收入；<35% 安全；≥50% 預警"],
    { kind: "result", dti: true },
  );

  styleSideRow(ws, R.annPay, "總繳金額", { formula: `B${PR}+B${TINT}` });
  styleSideRow(ws, R.eqPay, "本金", { formula: `B${PR}` });
  styleSideRow(ws, R.annTotalInt, "總利息", { formula: `B${TINT}` });
  styleSideRow(ws, R.dti, "利息佔本金比例", { formula: `IF(B${PR}=0,0,B${TINT}/B${PR})` }, { highlight: true });

  applyPanelBorder(ws, R.inputPanel, R.income, 1, 4);
  applyPanelBorder(ws, R.inputPanel, R.income, 6, 7);
  applyPanelBorder(ws, R.resultPanel, R.dti, 1, 4);
  applyPanelBorder(ws, R.resultPanel, R.dti, 6, 7);

  styleWarnBanner(ws, R.warn, DTI);
  styleDisclaimer(ws, R.disclaimer);

  ws.getCell("H1").value = TEMPLATE_VERSION;
  ws.getCell("H1").font = cellFont({ size: 9, color: C.panelLabel });

  ws.getCell(`B${PR}`).numFmt = "#,##0";
  ws.getCell(`B${RT}`).numFmt = "0.00";
  ws.getCell(`B${YR}`).numFmt = "0";
  ws.getCell(`B${INC}`).numFmt = "#,##0";
  ws.getCell(`B${PAY}`).numFmt = "#,##0";
  ws.getCell(`B${EQP}`).numFmt = "#,##0";
  ws.getCell(`B${TINT}`).numFmt = "#,##0";
  ws.getCell(`B${DTI}`).numFmt = "0.0%";
  ws.getCell(`G${R.annPay}`).numFmt = "#,##0";
  ws.getCell(`G${R.eqPay}`).numFmt = "#,##0";
  ws.getCell(`G${R.annTotalInt}`).numFmt = "#,##0";
  ws.getCell(`G${R.dti}`).numFmt = "0.00%";
  for (const row of [R.principal, R.income]) ws.getCell(`G${row}`).numFmt = "#,##0";

  ws.addConditionalFormatting({
    ref: `B${DTI}`,
    rules: [
      {
        type: "expression",
        priority: 1,
        formulae: [`B${DTI}>=0.5`],
        style: { font: { ...cellFont({ bold: true, color: C.danger }) } },
      },
      {
        type: "expression",
        priority: 2,
        formulae: [`AND(B${DTI}>=0.35,B${DTI}<0.5)`],
        style: { font: { ...cellFont({ bold: true, color: C.warn }) } },
      },
    ],
  });

  ws.addConditionalFormatting({
    ref: `A${R.warn}:G${R.warn}`,
    rules: [
      {
        type: "expression",
        priority: 1,
        formulae: [`$B$${DTI}>=0.5`],
        style: {
          fill: { type: "pattern", pattern: "solid", bgColor: { argb: C.dangerBg } },
          font: { ...cellFont({ bold: true, color: C.danger }) },
        },
      },
      {
        type: "expression",
        priority: 2,
        formulae: [`AND($B$${DTI}>=0.35,$B$${DTI}<0.5)`],
        style: {
          fill: { type: "pattern", pattern: "solid", bgColor: { argb: C.warnBg } },
          font: { ...cellFont({ bold: true, color: C.warn }) },
        },
      },
      {
        type: "expression",
        priority: 3,
        formulae: [`$B$${DTI}<0.35`],
        style: {
          fill: { type: "pattern", pattern: "solid", bgColor: { argb: C.safeBg } },
          font: { ...cellFont({ bold: true, color: C.safe }) },
        },
      },
    ],
  });

  return ws;
}

const wb = new ExcelJS.Workbook();
wb.creator = "財富自由計算機";
wb.created = new Date();
buildHomeSheet(wb);
buildMethodScheduleSheet(wb, SHEET_ANNUITY, "annuity");
buildMethodScheduleSheet(wb, SHEET_EQUAL, "equalPrincipal");

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

const PUBLIC_DIR = path.join(import.meta.dirname, "..", "public", "downloads");
const PUBLIC_FILE = path.join(PUBLIC_DIR, "quick11-loan-dti-template.xlsx");
fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.copyFileSync(fs.existsSync(OUT_FILE) ? OUT_FILE : OUT_TMP, PUBLIC_FILE);
console.log("Copied to", PUBLIC_FILE);

deliverExcelToUserDownloads(fs.existsSync(OUT_FILE) ? OUT_FILE : OUT_TMP, "quick11-home-v5-dual-sheets.xlsx");
