/**
 * 產生破產計算機 Excel（首頁精簡 + 本息／本金 明細分頁）
 * 執行：npm run generate:quick11-excel
 */
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { spawnSync } from "node:child_process";
import { deliverQuick11ToUserDownloads } from "./deliver-excel-to-user-downloads.mjs";

const USER_XLSM = "D:\\下載\\quick11-home-v5-dual-sheets.xlsm";
const XLWINGS_TIMEOUT_MS = 130_000;

function isFileLocked(filePath) {
  if (!fs.existsSync(filePath)) return false;
  try {
    const fd = fs.openSync(filePath, "r+");
    fs.closeSync(fd);
    return false;
  } catch {
    return true;
  }
}

function assertPathsWritable(...paths) {
  const locked = paths.filter((p) => isFileLocked(p));
  if (locked.length) {
    console.error(
      `[quick11-excel] 已停止：下列檔案使用中，請關閉 Excel 後重試：\n  ${locked.join("\n  ")}`,
    );
    process.exit(2);
  }
}

const OUT_DIR = path.join(import.meta.dirname, "..", "assets", "downloads");
const OUT_FILE = path.join(OUT_DIR, "quick11-loan-dti-template.xlsx");
const OUT_TMP = path.join(OUT_DIR, "quick11-loan-dti-template.tmp.xlsx");

const HOME_SHEET = "首頁";
const DROPDOWN_COL_PRINCIPAL = 30; // AD
const DROPDOWN_COL_INCOME = 31; // AE
const SHEET_ANNUITY = "本息均攤";
const SHEET_EQUAL = "本金平均";

const DEFAULTS = {
  principal: 12_000_000,
  annualRate: 2.2,
  years: 30,
  monthlyIncome: 80_000,
};

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
  inputValue: "FF1E293B",
  inputFill: "FFFFFBEB",
  inputBorder: "FFF59E0B",
  inputHint: "FF92400E",
  resultValue: "FF0369A1",
  panelLabel: "FF64748B",
  warn: "FFEA580C",
  danger: "FFDC2626",
  dangerBg: "FFFEF2F2",
  warnBg: "FFFFF7ED",
  safe: "FF059669",
  safeBg: "FFECFDF5",
  stepBtn: "FFF1F5F9",
  stepBtnText: "FF475569",
  /** 本息均攤按鈕 */
  btnAnnuity: "FF0284C7",
  /** 本金平均按鈕 */
  btnEqual: "FF059669",
};

const INPUT_EDGE = { style: "medium", color: { argb: C.inputBorder } };

const FONT = "微軟正黑體";
const EDGE = { style: "thin", color: { argb: C.border } };

const R = {
  title: 1,
  subtitle: 2,
  presetRow: 3,
  inputPanel: 4,
  inputHeader: 5,
  principal: 6,
  rate: 7,
  years: 8,
  income: 9,
  gapMid: 10,
  resultPanel: 11,
  resultHeader: 12,
  annPay: 13,
  eqPay: 14,
  annTotalInt: 15,
  dti: 16,
  warn: 17,
  disclaimer: 18,
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
const TEMPLATE_VERSION = "v6a-chart-dynamic-presets";

/** 首頁欄位：A 項目｜B 可改｜C +｜D −｜E 單位｜F 說明｜G 間隔｜H/I 右側摘要 */
const COL = {
  item: 1,
  input: 2,
  plus: 3,
  minus: 4,
  unit: 5,
  desc: 6,
  gap: 7,
  sideLabel: 8,
  sideValue: 9,
};
const LAST_COL = COL.sideValue;

const HOME_PAY = `'${HOME_SHEET}'!$B$${PAY}`;
const HOME_N = `(${HOME_YR}*12)`;
const HOME_MR = `${HOME_RT}/12/100`;

/** 與 app/quick-11/loan-scenarios.ts 六種預設一致 */
const LOAN_PRESETS = [
  { icon: "🛵", label: "機車貸", amount: 50_000, rate: 14, years: 4, income: 36_000 },
  { icon: "🚗", label: "汽車貸", amount: 800_000, rate: 4.2, years: 7, income: 65_000 },
  { icon: "💳", label: "信貸", amount: 500_000, rate: 8, years: 5, income: 55_000 },
  { icon: "🏠", label: "房貸", amount: 11_000_000, rate: 2.2, years: 30, income: 120_000 },
  { icon: "🎓", label: "學貸", amount: 450_000, rate: 1.9, years: 10, income: 42_000 },
  { icon: "🛠️", label: "裝潢貸", amount: 1_000_000, rate: 3.5, years: 10, income: 75_000 },
];

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
  mergeRow(ws, row, 1, LAST_COL);
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

function styleStepCell(ws, row, col, sign, { alt = false } = {}) {
  const cell = ws.getCell(row, col);
  cell.value = sign;
  setFill(cell, sign === "+" ? "FFECFDF5" : "FFFFF7ED");
  cell.font = cellFont({ bold: true, size: 14, color: sign === "+" ? C.safe : C.warn });
  align(cell, "center");
  cell.border = { top: EDGE, left: EDGE, bottom: EDGE, right: EDGE };
}

function styleDataRow(ws, row, values, { kind = "input", alt = false, dti = false, steppers = false } = {}) {
  ws.getRow(row).height = 28;

  if (steppers) {
    styleStepCell(ws, row, COL.plus, "+", { alt });
    styleStepCell(ws, row, COL.minus, "-", { alt });
  } else {
    [COL.plus, COL.minus].forEach((c) => {
      const cell = ws.getCell(row, c);
      cell.value = "";
      setFill(cell, alt ? C.bandLight : C.white);
      cell.border = { top: EDGE, left: EDGE, bottom: EDGE, right: EDGE };
    });
  }

  const specs = [
    { col: COL.item, val: values[0], role: "label" },
    { col: COL.input, val: values[1], role: "value" },
    { col: COL.unit, val: values[2], role: "unit" },
    { col: COL.desc, val: values[3], role: "desc" },
  ];

  specs.forEach(({ col, val, role }) => {
    const cell = ws.getCell(row, col);
    cell.value = val ?? "";
    setFill(cell, alt ? C.bandLight : C.white);
    cell.border = { top: EDGE, left: EDGE, bottom: EDGE, right: EDGE };

    if (role === "label") {
      cell.font = cellFont({ size: 11, color: C.title });
      align(cell, "left", { indent: 1 });
    } else if (role === "value") {
      if (kind === "input") {
        setFill(cell, C.inputFill);
        cell.border = { top: INPUT_EDGE, left: INPUT_EDGE, bottom: INPUT_EDGE, right: INPUT_EDGE };
        cell.font = cellFont({ bold: true, size: 12, color: C.inputValue });
      } else {
        cell.font = cellFont({ bold: true, size: 11, color: dti ? C.warn : C.resultValue });
      }
      align(cell, "right");
    } else if (role === "unit") {
      cell.font = cellFont({ size: 10, color: C.label });
      align(cell, "center");
    } else {
      cell.font = cellFont({ size: 10, color: C.panelLabel });
      align(cell, "left", { wrap: true });
    }
  });
}


function writeDropdownLists(ws) {
  ws.getCell(1, DROPDOWN_COL_PRINCIPAL).value = "principal_list";
  for (let i = 0; i < 41; i += 1) {
    ws.getCell(2 + i, DROPDOWN_COL_PRINCIPAL).value = 5_000_000 + i * 500_000;
  }
  ws.getCell(1, DROPDOWN_COL_INCOME).value = "income_list";
  for (let i = 0; i < 41; i += 1) {
    ws.getCell(2 + i, DROPDOWN_COL_INCOME).value = 50_000 + i * 5_000;
  }
  ws.getColumn(DROPDOWN_COL_PRINCIPAL).hidden = true;
  ws.getColumn(DROPDOWN_COL_INCOME).hidden = true;
}


function applyInputValidation(ws, row, { type, min, max, list, listRef, numFmt }) {
  const cell = ws.getCell(row, 2);
  const validation = {
    type,
    allowBlank: false,
    showInputMessage: false,
    showErrorMessage: true,
    errorStyle: "warning",
    errorTitle: "請由清單選擇",
    error: "請點儲存格右側 ▾ 下拉選單，或按 C/D ± 微調。",
  };

  if (type === "list") {
    validation.formulae = [listRef ? listRef : list];
  } else if (type === "decimal") {
    validation.operator = "between";
    validation.formulae = [min, max];
  } else if (type === "whole") {
    validation.operator = "between";
    validation.formulae = [min, max];
  }

  cell.dataValidation = validation;

  if (numFmt) cell.numFmt = numFmt;
}

function styleSideRow(ws, row, label, valueFormula, { header = false, highlight = false } = {}) {
  const labelCell = ws.getCell(row, COL.sideLabel);
  const valueCell = ws.getCell(row, COL.sideValue);
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
  mergeRow(ws, row, 1, LAST_COL);
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

function stylePresetHintRow(ws, row) {
  ws.getRow(row).height = 30;
  const label = ws.getCell(row, COL.item);
  label.value = "貸款模式";
  label.font = cellFont({ bold: true, size: 11, color: C.title });
  align(label, "left", { indent: 1 });
  setFill(label, C.bandLight);
  label.border = { top: EDGE, left: EDGE, bottom: EDGE, right: EDGE };

  for (let i = 0; i < 6; i += 1) {
    const cell = ws.getCell(row, COL.input + i);
    cell.value = "";
    setFill(cell, C.bandLight);
    cell.border = { top: EDGE, left: EDGE, bottom: EDGE, right: EDGE };
  }

  mergeRow(ws, row, COL.unit, COL.desc);
  const hint = ws.getCell(row, COL.unit);
  hint.value = "xlsm：點選左側六顆色按鈕一鍵套用（機車／汽車／信貸／房貸／學貸／裝潢）";
  hint.font = cellFont({ size: 10, color: C.panelLabel });
  align(hint, "left", { indent: 1, wrap: true });
  setFill(hint, C.bandLight);
  hint.border = { top: EDGE, left: EDGE, bottom: EDGE, right: EDGE };
}


function styleBackButton(ws, cell, { accent = C.btnAnnuity } = {}) {
  cell.value = { text: "←  回首頁", hyperlink: `#'${HOME_SHEET}'!A1`, tooltip: "返回首頁試算" };
  setFill(cell, accent);
  cell.font = cellFont({ bold: true, size: 12, color: C.white, underline: false });
  align(cell, "center");
  cell.border = {
    top: { style: "medium", color: { argb: accent } },
    left: { style: "medium", color: { argb: accent } },
    bottom: { style: "medium", color: { argb: accent } },
    right: { style: "medium", color: { argb: accent } },
  };
  ws.getRow(1).height = 34;
  ws.getColumn(1).width = 13;
}

function styleDisclaimer(ws, row) {
  mergeRow(ws, row, 1, LAST_COL);
  const cell = ws.getCell(row, 1);
  cell.value = "（試算結果僅供參考，實際以銀行／法令為準；負債比建議＜35%，≥50% 為破產預警。）";
  setFill(cell, C.pageBg);
  cell.font = cellFont({ size: 9, color: C.panelLabel });
  align(cell, "left", { indent: 1 });
  ws.getRow(row).height = 26;
}

/** 試算結果列：A 欄超連結直達明細；B/C 數值；D 欄留空 */
function styleResultRowLinkInA(ws, row, label, amountFormula, unit, targetSheet, linkColor, { alt = false } = {}) {
  styleDataRow(ws, row, ["", amountFormula, unit, ""], { kind: "result", alt });
  ws.getCell(row, 2).numFmt = "#,##0";

  const aCell = ws.getCell(row, 1);
  aCell.value = {
    text: label,
    hyperlink: `#'${targetSheet}'!A1`,
    tooltip: `開啟「${targetSheet}」每期繳款明細`,
  };
  setFill(aCell, linkColor);
  aCell.font = cellFont({ bold: true, size: 11, color: C.white, underline: false });
  align(aCell, "left", { indent: 1 });
  aCell.border = { top: EDGE, left: EDGE, bottom: EDGE, right: EDGE };
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
  styleBackButton(ws, backCell, { accent: method === "annuity" ? C.btnAnnuity : C.btnEqual });

  mergeRow(ws, 1, 2, 5);
  const titleCell = ws.getCell(1, 2);
  titleCell.value = `${sheetName} · 每期繳款明細（連動首頁 B 欄）`;
  titleCell.font = cellFont({ bold: true, size: 13, color: C.title });
  align(titleCell, "left", { indent: 1 });
  ws.getRow(1).height = 28;

  mergeRow(ws, 2, 1, 5);
  const hintCell = ws.getCell(2, 1);
  hintCell.value =
    "右側視窗：【檢視】→【新建視窗】→【並排顯示】→ 拖曳此視窗到螢幕右邊｜改首頁 B6～B8 後此表自動重算";
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
    { width: 24 },
    { width: 17 },
    { width: 5.5 },
    { width: 5.5 },
    { width: 9 },
    { width: 42 },
    { width: 2 },
    { width: 22 },
    { width: 17 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
  ];

  for (let r = 1; r <= R.disclaimer; r += 1) {
    for (let c = 1; c <= LAST_COL; c += 1) {
      if (!ws.getCell(r, c).fill?.fgColor) setFill(ws.getCell(r, c), C.pageBg);
    }
  }

  styleTitleRow(ws, R.title, "破產計算機 · 貸款利息試算表（公式可改）");
  styleTitleRow(ws, R.subtitle, "【 輸入區 】B 欄 ▾ 下拉；C/D ± 微調；右側圖表（最長 50 年）", { subtitle: true });

  stylePresetHintRow(ws, R.presetRow);

  stylePanelHeader(ws, R.inputPanel, 1, COL.desc, "輸入參數");
  stylePanelHeader(ws, R.inputPanel, COL.sideLabel, COL.sideValue, "參數總覽");
  styleTableHeader(ws, R.inputHeader, [1, 2, 3, 4, 5, 6], ["項目", "▾ 可選", "+", "−", "單位", "說明"]);
  styleSideRow(ws, R.inputHeader, "摘要", null, { header: true });

  styleDataRow(ws, R.principal, ["貸款本金", DEFAULTS.principal, "NT$", "可輸入或 B 欄下拉快選"], { kind: "input", steppers: true });
  styleDataRow(ws, R.rate, ["年利率", DEFAULTS.annualRate, "%", "例：2.2；可下拉"], { kind: "input", alt: true, steppers: true });
  styleDataRow(ws, R.years, ["貸款年期", DEFAULTS.years, "年", "可下拉 5～50 年"], { kind: "input", steppers: true });
  styleDataRow(ws, R.income, ["月收入（預警）", DEFAULTS.monthlyIncome, "NT$", "算 DTI 用"], { kind: "input", alt: true, steppers: true });

  writeDropdownLists(ws);

  applyInputValidation(ws, R.principal, {
    type: "list",
    listRef: "$AD$2:$AD$42",
    numFmt: "#,##0",
  });
  applyInputValidation(ws, R.rate, {
    type: "list",
    list: '"1.0,1.2,1.5,1.8,2.0,2.2,2.5,2.8,3.0,3.5,4.0,5.0"',
    numFmt: "0.00",
  });
  applyInputValidation(ws, R.years, {
    type: "list",
    list: '"5,10,15,20,25,30,35,40,45,50"',
    numFmt: "0",
  });
  applyInputValidation(ws, R.income, {
    type: "list",
    listRef: "$AE$2:$AE$42",
    numFmt: "#,##0",
  });

  applyPanelBorder(ws, R.inputPanel, R.income, 1, COL.desc);

  styleSideRow(ws, R.principal, "貸款本金", { formula: `B${PR}` });
  styleSideRow(ws, R.rate, "年利率", { formula: `TEXT(B${RT},"0.00")&"%"` });
  styleSideRow(ws, R.years, "貸款年期", { formula: `TEXT(B${YR},"0")&" 年"` });
  styleSideRow(ws, R.income, "月收入（預警）", { formula: `B${INC}` });

  ws.getRow(R.gapMid).height = 10;

  stylePanelHeader(ws, R.resultPanel, 1, COL.desc, "試算結果");
  stylePanelHeader(ws, R.resultPanel, COL.sideLabel, COL.sideValue, "資金總覽");
  styleTableHeader(ws, R.resultHeader, [1, 2, 3, 4, 5, 6], ["項目", "結果", "", "", "單位", "公式說明"]);
  styleSideRow(ws, R.resultHeader, "摘要", null, { header: true });

  const mr = `B${RT}/12/100`;
  const n = `B${YR}*12`;
  const eqFirstPay = `B${PR}*(${mr})+B${PR}/(${n})`;

  styleResultRowLinkInA(
    ws,
    R.annPay,
    "▸ 本息均攤 · 每期明細",
    { formula: `PMT(${mr},${n},-B${PR})` },
    "NT$",
    SHEET_ANNUITY,
    C.btnAnnuity,
  );
  styleResultRowLinkInA(
    ws,
    R.eqPay,
    "▸ 本金平均 · 每期明細",
    { formula: eqFirstPay },
    "NT$",
    SHEET_EQUAL,
    C.btnEqual,
    { alt: true },
  );

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

  styleSideRow(ws, R.annPay, "本息均攤 · 每月繳款", { formula: `B${PAY}` });
  styleSideRow(ws, R.eqPay, "本金平均 · 首期月付", { formula: `B${EQP}` });
  styleSideRow(ws, R.annTotalInt, "總繳金額", { formula: `B${PR}+B${TINT}` });
  styleSideRow(ws, R.dti, "利息佔本金比例", { formula: `IF(B${PR}=0,0,B${TINT}/B${PR})` }, { highlight: true });

  applyPanelBorder(ws, R.inputPanel, R.income, COL.sideLabel, COL.sideValue);
  applyPanelBorder(ws, R.resultPanel, R.dti, 1, COL.desc);
  applyPanelBorder(ws, R.resultPanel, R.dti, COL.sideLabel, COL.sideValue);

  styleWarnBanner(ws, R.warn, DTI);
  styleDisclaimer(ws, R.disclaimer);

  ws.getCell("K1").value = TEMPLATE_VERSION;
  ws.getCell("K1").font = cellFont({ size: 9, color: C.panelLabel });

  ws.getCell(`B${PR}`).numFmt = "#,##0";
  ws.getCell(`B${RT}`).numFmt = "0.00";
  ws.getCell(`B${YR}`).numFmt = "0";
  ws.getCell(`B${INC}`).numFmt = "#,##0";
  ws.getCell(`B${PAY}`).numFmt = "#,##0";
  ws.getCell(`B${EQP}`).numFmt = "#,##0";
  ws.getCell(`B${TINT}`).numFmt = "#,##0";
  ws.getCell(`B${DTI}`).numFmt = "0.0%";
  ws.getCell(`I${R.annPay}`).numFmt = "#,##0";
  ws.getCell(`I${R.eqPay}`).numFmt = "#,##0";
  ws.getCell(`I${R.annTotalInt}`).numFmt = "#,##0";
  ws.getCell(`I${R.dti}`).numFmt = "0.00%";
  for (const row of [R.principal, R.income]) ws.getCell(`I${row}`).numFmt = "#,##0";

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
    ref: `A${R.warn}:I${R.warn}`,
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
if (isFileLocked(OUT_FILE)) {
  console.error(`[quick11-excel] 已停止：${OUT_FILE} 使用中，請關閉 Excel 後重試`);
  process.exit(2);
}
await wb.xlsx.writeFile(OUT_TMP);
try {
  if (fs.existsSync(OUT_FILE)) fs.unlinkSync(OUT_FILE);
  fs.renameSync(OUT_TMP, OUT_FILE);
  console.log("Wrote", OUT_FILE);
} catch (err) {
  if (isFileLocked(OUT_FILE)) {
    try {
      fs.unlinkSync(OUT_TMP);
    } catch {
      /* ignore */
    }
    console.error(`[quick11-excel] 已停止：無法覆寫 ${OUT_FILE}（檔案使用中）`);
    process.exit(2);
  }
  console.warn("Could not replace locked file; wrote", OUT_TMP);
  console.warn(err.message);
}

const artifact = fs.existsSync(OUT_FILE) ? OUT_FILE : OUT_TMP;
const xlwingsPy = path.join(import.meta.dirname, "add-quick11-excel-xlwings-chart.py");
const xlsmOut = path.join(OUT_DIR, "quick11-loan-dti-template.xlsm");
assertPathsWritable(xlsmOut, USER_XLSM);
const xlFinalize = spawnSync(
  "py",
  ["-3", xlwingsPy, "-i", artifact, "-o", artifact, "--xlsm", xlsmOut, "--no-publish"],
  { encoding: "utf8", cwd: path.join(import.meta.dirname, ".."), timeout: XLWINGS_TIMEOUT_MS },
);
if (xlFinalize.error?.code === "ETIMEDOUT") {
  console.error(`[quick11-excel] 已停止：xlwings 逾時（>${XLWINGS_TIMEOUT_MS / 1000}s），請關閉 Excel 後重試`);
  process.exit(2);
}
if (xlFinalize.status === 2) {
  console.error(xlFinalize.stderr?.trim() || "[quick11-excel] 已停止：輸出檔使用中");
  process.exit(2);
}
if (xlFinalize.status === 0) {
  console.log("xlwings：淺色靜態 J2:Q11 折線圖 + B▾下拉 + C/D ± → xlsm");
} else {
  console.warn("[quick11-excel] xlwings 失敗（請關閉 Excel 後執行 npm run generate:quick11-excel-chart）：");
  console.warn(xlFinalize.stderr?.trim() || xlFinalize.stdout?.trim() || "");
}

const PUBLIC_DIR = path.join(import.meta.dirname, "..", "public", "downloads");
const PUBLIC_FILE = path.join(PUBLIC_DIR, "quick11-loan-dti-template.xlsx");
fs.mkdirSync(PUBLIC_DIR, { recursive: true });
if (fs.existsSync(artifact)) {
  fs.copyFileSync(artifact, PUBLIC_FILE);
  console.log("Copied to", PUBLIC_FILE);
}

if (xlFinalize.status === 0 && fs.existsSync(xlsmOut)) {
  const delivered = deliverQuick11ToUserDownloads({ xlsxPath: artifact, xlsmPath: xlsmOut });
  console.log("[quick11-excel] 請開啟 →", delivered.primary ?? "D:\\下載\\quick11-home-v5-dual-sheets.xlsm");
} else {
  const delivered = deliverQuick11ToUserDownloads({ xlsxPath: artifact, xlsmPath: null });
  console.warn("[quick11-excel] 僅 xlsx（無 ▲▼）；關閉 Excel 後執行：npm run generate:quick11-excel-chart");
  if (delivered.primary) console.log("[quick11-excel] 暫存 →", delivered.primary);
}
