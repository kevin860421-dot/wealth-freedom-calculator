import * as XLSX from "xlsx";
import { QUICK10_DISPLAY_NAME } from "./quick10-brand";

export type Quick10ChartExcelPayload = {
  monthly: number;
  horizonYears: number;
  annualPct: number;
  crashPct: number;
  marketIndex: number;
  crashMarketPoints: number;
  principalTotal: number;
  terminal: number;
  afterCrash: number;
  years: number[];
  windSeries: number[];
  crashSeries: number[];
};

export function downloadQuick10ChartExcel(payload: Quick10ChartExcelPayload) {
  const evaporation = Math.max(0, Math.round(payload.terminal - payload.afterCrash));
  const rows: (string | number)[][] = [
    [QUICK10_DISPLAY_NAME, "淨值走勢試算匯出"],
    ["匯出時間", new Date().toLocaleString("zh-TW", { hour12: false })],
    [],
    ["【試算假設】"],
    ["每月投入金額", payload.monthly],
    ["預計投入年數", payload.horizonYears],
    ["預期年化報酬率 %", payload.annualPct],
    ["期末大跌 %", payload.crashPct],
    ["加權指數參考", payload.marketIndex],
    ["情境大盤點位", payload.crashMarketPoints],
    [],
    ["【期末摘要】"],
    ["投入總本金", payload.principalTotal],
    ["順風總資產", payload.terminal],
    ["崩盤剩餘資產", payload.afterCrash],
    ["崩盤蒸發黑洞", evaporation],
    [],
    ["【逐年淨值走勢】"],
    ["年度", "順風複利淨值", "期末大跌淨值", "投入本金"],
  ];

  payload.years.forEach((year, i) => {
    rows.push([
      year,
      Math.round(payload.windSeries[i] ?? 0),
      Math.round(payload.crashSeries[i] ?? 0),
      Math.round(payload.principalTotal),
    ]);
  });

  rows.push([]);
  rows.push(["註：試算僅供參考，非投資建議。"]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "淨值走勢");
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `破產計算機股票版_淨值走勢_${stamp}.xlsx`, { cellStyles: false });
}
