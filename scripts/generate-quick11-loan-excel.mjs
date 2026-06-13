/**
 * 產生破產計算機 Excel（多分頁；首版先完成「首頁」）
 * 版面對齊 quick-11 首頁＋試算表視覺（左：輸入／試算；右：參數／資金總覽）
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

/** 模板版本（H1 供辨識；舊版無此欄） */
const TEMPLATE_VERSION = "v2-home-dual-20260613";

/** 與 excel-preview 同色 */
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
};

const FONT = "微軟正黑體";
const EDGE = { style: "thin", color: { argb: C.border } };
const EDGE_DARK = { style: "thin", color: { argb: "FFCBD5E1" } };

/** 首頁分頁列位（輸入 B 欄） */
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
  annFirstInt: 13,
  annTotalInt: 13 + 1,
  annTotalPay: 14 + 1,
  epPay: 15 + 1,
  epFirstInt: 16 + 1,
  epTotalInt: 17 + 1,
  epTotalPay: 18 + 1,
  dti: 19 + 1,
  health: 20 + 1,
  gapBeforeWarn: 21 + 1,
  warn: 22 + 1,
  disclaimer: 23 + 1,
};

const PR = R.principal;
const RT = R.rate;
const YR = R.years;
const INC = R.income;
const DTI = R.dti;

function cellFont({ bold = false, size = 11, color = C.title } = {}) {
  return { bold, size, name: FONT, color: { argb: color } };
}

function setFill(cell, argb) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function align(cell, horizontal = "left", { indent = 0, wrap = false } = {}) {
  cell.alignment = {
    horizontal,
    vertical: "middle",
    wrapText: wrap,
    shrinkToFit: false,
    indent,
  };
}

function setBorder(cell, parts) {
  cell.border = parts;
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
  for (let c = fromCol + 1; c <= toCol; c += 1) {
    ws.getCell(row, c).value = null;
  }
  ws.mergeCells(`${from}${row}:${to}${row}`);
}

function styleTitleRow(ws, row, text, { size = 14, dark = false, subtitle = false } = {}) {
  mergeRow(ws, row, 1, 7);
  const cell = ws.getCell(row, 1);
  cell.value = text;
  setFill(cell, dark ? C.headerDark : subtitle ? C.pageBg : C.white);
  cell.font = cellFont({ bold: true, size, color: dark ? C.white : C.label });
  align(cell, "left", { indent: 1 });
  ws.getRow(row).height = dark ? 30 : subtitle ? 22 : size >= 14 ? 32 : 24;
  if (!dark && !subtitle) setBorder(cell, { bottom: EDGE });
}

function stylePanelHeader(ws, row, fromCol, toCol, text) {
  mergeRow(ws, row, fromCol, toCol);
  const cell = ws.getCell(row, fromCol);
  cell.value = text;
  setFill(cell, C.headerDark);
  cell.font = cellFont({ bold: true, size: 11, color: C.white });
  align(cell, "left", { indent: 1 });
  ws.getRow(row).height = 26;
  for (let c = fromCol; c <= toCol; c += 1) {
    setBorder(ws.getCell(row, c), { top: EDGE, left: EDGE, bottom: EDGE, right: EDGE });
  }
}

function styleTableHeader(ws, row, cols, labels) {
  ws.getRow(row).height = 24;
  cols.forEach((col, i) => {
    const cell = ws.getCell(row, col);
    cell.value = labels[i] ?? "";
    setFill(cell, C.headerLight);
    cell.font = cellFont({ bold: true, size: 10, color: C.label });
    align(cell, i === 1 ? "right" : i === 2 ? "center" : "left", { indent: i === 0 ? 1 : 0 });
    setBorder(cell, { top: EDGE, left: EDGE, bottom: EDGE, right: EDGE });
  });
}

function styleDataRow(
  ws,
  row,
  cols,
  values,
  { kind = "input", alt = false, dti = false, warn = false } = {},
) {
  ws.getRow(row).height = warn ? 28 : 24;
  cols.forEach((col, i) => {
    const cell = ws.getCell(row, col);
    cell.value = values[i] ?? "";
    setFill(cell, alt ? C.bandLight : C.white);
    setBorder(cell, { top: EDGE, left: EDGE, bottom: EDGE, right: EDGE });

    if (i === 0) {
      cell.font = cellFont({ bold: warn, size: 11, color: warn ? C.danger : C.title });
      align(cell, "left", { indent: 1 });
    } else if (i === 1) {
      const color =
        warn ? C.danger : dti ? C.warn : kind === "input" ? C.inputValue : C.resultValue;
      cell.font = cellFont({ bold: true, size: 11, color });
      align(cell, "right");
    } else if (i === 2) {
      cell.font = cellFont({ size: 10, color: C.label });
      align(cell, "center");
    } else {
      cell.font = cellFont({ size: 10, color: C.panelLabel });
      align(cell, "left", { wrap: true });
    }
  });
}

function styleSideRow(ws, row, label, valueFormula, { header = false, highlight = false } = {}) {
  const labelCell = ws.getCell(row, 6);
  const valueCell = ws.getCell(row, 7);
  ws.getRow(row).height = header ? 24 : 22;

  labelCell.value = label;
  setFill(labelCell, header ? C.headerLight : highlight ? C.bandLight : C.white);
  labelCell.font = cellFont({ bold: header, size: header ? 10 : 11, color: header ? C.label : C.title });
  align(labelCell, "left", { indent: 1 });
  setBorder(labelCell, { top: EDGE, left: EDGE, bottom: EDGE, right: EDGE });

  if (header) {
    valueCell.value = "數值";
    valueCell.font = cellFont({ bold: true, size: 10, color: C.label });
    align(valueCell, "right");
  } else {
    valueCell.value = valueFormula;
    valueCell.font = cellFont({ bold: true, size: 11, color: C.resultValue });
    align(valueCell, "right");
  }
  setFill(valueCell, header ? C.headerLight : highlight ? C.bandLight : C.white);
  setBorder(valueCell, { top: EDGE, left: EDGE, bottom: EDGE, right: EDGE });
}

function applyRightPanelCardBg(ws, topRow, bottomRow) {
  for (let r = topRow; r <= bottomRow; r += 1) {
    for (const col of [6, 7]) {
      const cell = ws.getCell(r, col);
      if (r === topRow || r === bottomRow) continue;
      const existing = cell.fill?.fgColor?.argb;
      if (existing === C.headerDark || existing === C.headerLight) continue;
      if (!cell.fill?.fgColor) setFill(cell, "FFF8FBFF");
    }
  }
}

function applyColumnDivider(ws, topRow, bottomRow) {
  for (let r = topRow; r <= bottomRow; r += 1) {
    setFill(ws.getCell(r, 5), "FFE2E8F0");
  }
}

function applyPanelBorder(ws, topRow, bottomRow, leftCol, rightCol) {
  for (let c = leftCol; c <= rightCol; c += 1) {
    const top = ws.getCell(topRow, c);
    top.border = { ...(top.border || {}), top: EDGE };
    const bottom = ws.getCell(bottomRow, c);
    bottom.border = { ...(bottom.border || {}), bottom: EDGE };
  }
  for (let r = topRow; r <= bottomRow; r += 1) {
    const left = ws.getCell(r, leftCol);
    left.border = { ...(left.border || {}), left: EDGE };
    const right = ws.getCell(r, rightCol);
    right.border = { ...(right.border || {}), right: EDGE };
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
  ws.getRow(row).height = 30;
  setBorder(cell, { top: EDGE, left: EDGE, bottom: EDGE, right: EDGE });
}

function styleDisclaimer(ws, row) {
  mergeRow(ws, row, 1, 7);
  const cell = ws.getCell(row, 1);
  cell.value =
    "（試算結果僅供參考，實際以銀行／法令為準；負債比建議＜35%，≥50% 為破產預警。）";
  setFill(cell, C.pageBg);
  cell.font = cellFont({ size: 9, color: C.panelLabel });
  align(cell, "left", { indent: 1, wrap: true });
  ws.getRow(row).height = 28;
}

function buildHomeSheet(wb) {
  const ws = wb.addWorksheet("首頁", {
    properties: { defaultRowHeight: 22, tabColor: { argb: "FF0284C7" } },
  });

  ws.views = [
    {
      showGridLines: false,
      zoomScale: 80,
      activeCell: "F5",
      state: "normal",
      topLeftCell: "A1",
    },
  ];

  ws.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };

  ws.columns = [
    { width: 19 },
    { width: 12 },
    { width: 6 },
    { width: 20 },
    { width: 1.5 },
    { width: 18 },
    { width: 15 },
  ];

  // 頁面底色
  for (let r = 1; r <= R.disclaimer; r += 1) {
    for (let c = 1; c <= 7; c += 1) {
      if (!ws.getCell(r, c).fill?.fgColor) setFill(ws.getCell(r, c), C.pageBg);
    }
  }

  styleTitleRow(ws, R.title, "破產計算機・貸款利息試算表（公式可改）", { size: 16, dark: true });
  styleTitleRow(ws, R.subtitle, "【 輸入區 】改 B 欄數字即可自動計算 ｜ 右側：參數總覽＋資金總覽", { subtitle: true });

  // ── 左：輸入參數 ──
  stylePanelHeader(ws, R.inputPanel, 1, 4, "✏️  輸入參數");
  stylePanelHeader(ws, R.inputPanel, 6, 7, "📋  參數總覽");

  styleTableHeader(ws, R.inputHeader, [1, 2, 3, 4], ["項目", "數值", "單位", "說明"]);
  styleSideRow(ws, R.inputHeader, "摘要", null, { header: true });

  const inputRows = [
    [R.principal, "🏠  貸款本金", DEFAULTS.principal, "NT$", "例：1200 萬"],
    [R.rate, "📊  年利率", DEFAULTS.annualRate, "%", "例：2.2 純數字"],
    [R.years, "📅  貸款年期", DEFAULTS.years, "年", "例：30 純數字"],
    [R.income, "👤  月收入（預警）", DEFAULTS.monthlyIncome, "NT$", "算 DTI 用"],
  ];

  inputRows.forEach(([row, label, val, unit, desc], idx) => {
    ws.getCell(row, 1).value = label;
    ws.getCell(row, 2).value = val;
    ws.getCell(row, 3).value = unit;
    ws.getCell(row, 4).value = desc;
    styleDataRow(ws, row, [1, 2, 3, 4], [label, val, unit, desc], {
      kind: "input",
      alt: idx % 2 === 1,
    });
  });

  // 右：參數總覽（引用左欄）
  styleSideRow(ws, R.principal, "貸款本金", { formula: `B${PR}` });
  styleSideRow(ws, R.rate, "年利率", { formula: `TEXT(B${RT},"0.00")&"%"` });
  styleSideRow(ws, R.years, "貸款年期", { formula: `TEXT(B${YR},"0")&" 年"` });
  styleSideRow(ws, R.income, "月收入", { formula: `B${INC}` });

  ws.getCell(`F${R.gapMid}`).value = null;
  ws.getRow(R.gapMid).height = 8;

  // ── 左：試算結果（含首頁雙還款方式）──
  stylePanelHeader(ws, R.resultPanel, 1, 4, "🧮  試算結果");
  stylePanelHeader(ws, R.resultPanel, 6, 7, "💰  資金總覽");

  styleTableHeader(ws, R.resultHeader, [1, 2, 3, 4], ["項目", "結果", "單位", "公式說明"]);
  styleSideRow(ws, R.resultHeader, "本息均攤", null, { header: true });

  const mr = `B${RT}/12/100`;
  const n = `B${YR}*12`;

  const resultRows = [
    [
      R.annPay,
      "本息均攤 · 每月繳款",
      { formula: `PMT(${mr},${n},-B${PR})` },
      "NT$",
      "PMT：月利率＝年利率÷12÷100",
    ],
    [
      R.annFirstInt,
      "本息均攤 · 首期利息",
      { formula: `B${PR}*${mr}` },
      "NT$",
      "第一個月利息",
    ],
    [
      R.annTotalInt,
      "本息均攤 · 總繳利息",
      { formula: `B${R.annPay}*${n}-B${PR}` },
      "NT$",
      "總付款－本金",
    ],
    [
      R.annTotalPay,
      "本息均攤 · 總繳金額",
      { formula: `B${PR}+B${R.annTotalInt}` },
      "NT$",
      "本金＋總利息",
    ],
    [
      R.epPay,
      "本金平均 · 首月繳款",
      { formula: `B${PR}/${n}+B${PR}*${mr}` },
      "NT$",
      "固定本金＋當月利息",
    ],
    [
      R.epFirstInt,
      "本金平均 · 首期利息",
      { formula: `B${PR}*${mr}` },
      "NT$",
      "第一個月利息",
    ],
    [
      R.epTotalInt,
      "本金平均 · 總繳利息",
      { formula: `B${PR}*${mr}*(${n}+1)/2` },
      "NT$",
      "遞減利息加總",
    ],
    [
      R.epTotalPay,
      "本金平均 · 總繳金額",
      { formula: `B${PR}+B${R.epTotalInt}` },
      "NT$",
      "本金＋總利息",
    ],
    [
      R.dti,
      "DTI 債務收入比",
      { formula: `IF(B${INC}=0,0,B${R.annPay}/B${INC})` },
      "%",
      "本息月付÷月收入；<35% 安全",
    ],
  ];

  resultRows.forEach(([row, label, val, unit, desc], idx) => {
    styleDataRow(ws, row, [1, 2, 3, 4], [label, val, unit, desc], {
      kind: "result",
      alt: idx % 2 === 1,
      dti: row === R.dti,
    });
  });

  // 財務健康（左欄最後一列）
  mergeRow(ws, R.health, 2, 4);
  const healthFormula = {
    formula: `IF(B${DTI}>=0.5,"⚠ 破產預警：先降月付或提高收入",IF(B${DTI}>=0.35,"⚠ 壓力偏高：月付偏緊","✓ 安全區：現金流尚可"))`,
  };
  styleDataRow(ws, R.health, [1, 2, 3, 4], ["財務健康狀態", healthFormula, "", ""], {
    kind: "result",
    warn: true,
  });
  align(ws.getCell(`B${R.health}`), "left");

  // 右：資金總覽（本息＋本金平均＋多出多少）
  styleSideRow(ws, R.annPay, "本息 · 每月繳款", { formula: `B${R.annPay}` });
  styleSideRow(ws, R.annFirstInt, "本息 · 首期利息", { formula: `B${R.annFirstInt}` });
  styleSideRow(ws, R.annTotalInt, "本息 · 總繳利息", { formula: `B${R.annTotalInt}` });
  styleSideRow(ws, R.annTotalPay, "本息 · 總繳金額", { formula: `B${R.annTotalPay}` }, { highlight: true });

  styleSideRow(ws, R.epPay, "本金平均 · 首月繳款", { formula: `B${R.epPay}` });
  styleSideRow(ws, R.epFirstInt, "本金平均 · 首期利息", { formula: `B${R.epFirstInt}` });
  styleSideRow(ws, R.epTotalInt, "本金平均 · 總繳利息", { formula: `B${R.epTotalInt}` });
  styleSideRow(ws, R.epTotalPay, "本金平均 · 總繳金額", { formula: `B${R.epTotalPay}` }, { highlight: true });

  styleSideRow(ws, R.dti, "負債比（DTI）", { formula: `TEXT(B${DTI},"0.0%")` });
  styleSideRow(
    ws,
    R.health,
    "利息佔本金比例",
    { formula: `IF(B${PR}=0,0,B${R.annTotalInt}/B${PR})` },
    { highlight: true },
  );

  // 首頁「多出多少」＝總利息（本息）
  styleSideRow(ws, R.gapBeforeWarn, "多出多少（本息）", { formula: `B${R.annTotalInt}` }, { highlight: true });

  // 外框
  applyPanelBorder(ws, R.inputPanel, R.income, 1, 4);
  applyPanelBorder(ws, R.inputPanel, R.income, 6, 7);
  applyPanelBorder(ws, R.resultPanel, R.health, 1, 4);
  applyPanelBorder(ws, R.resultPanel, R.gapBeforeWarn, 6, 7);
  applyRightPanelCardBg(ws, R.inputHeader, R.gapBeforeWarn);
  applyColumnDivider(ws, R.inputPanel, R.gapBeforeWarn);

  styleWarnBanner(ws, R.warn, DTI);
  styleDisclaimer(ws, R.disclaimer);

  // 版本標記（舊模板無 H 欄）
  ws.getCell("H1").value = TEMPLATE_VERSION;
  ws.getCell("H1").font = cellFont({ size: 9, color: C.panelLabel });

  // 數字格式
  ws.getCell(`B${PR}`).numFmt = "#,##0";
  ws.getCell(`B${RT}`).numFmt = "0.00";
  ws.getCell(`B${YR}`).numFmt = "0";
  ws.getCell(`B${INC}`).numFmt = "#,##0";

  for (const row of [
    R.annPay,
    R.annFirstInt,
    R.annTotalInt,
    R.annTotalPay,
    R.epPay,
    R.epFirstInt,
    R.epTotalInt,
    R.epTotalPay,
  ]) {
    ws.getCell(`B${row}`).numFmt = "#,##0";
  }
  ws.getCell(`B${DTI}`).numFmt = "0.0%";
  ws.getCell(`G${R.health}`).numFmt = "0.00%";
  for (const row of [R.principal, R.income, R.annPay, R.annTotalPay, R.epTotalPay, R.gapBeforeWarn]) {
    ws.getCell(`G${row}`).numFmt = row === R.rate ? undefined : row === R.years ? undefined : "#,##0";
  }
  ws.getCell(`G${R.annTotalInt}`).numFmt = "#,##0";
  ws.getCell(`G${R.epTotalInt}`).numFmt = "#,##0";
  ws.getCell(`G${R.gapBeforeWarn}`).numFmt = "#,##0";

  ws.addConditionalFormatting({
    ref: `A${R.health}:D${R.health}`,
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

// 後續分頁預留（進階試算、攤還明細等）— 先隱藏占位
const placeholder = wb.addWorksheet("_reserved", { state: "veryHidden" });
placeholder.getCell("A1").value = "reserved for future tabs";

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
