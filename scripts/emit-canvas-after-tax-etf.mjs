#!/usr/bin/env node
/**
 * 將 2026-08 ETF 母體寫入 Canvas 樣板（總排行前 50 用同一母體）。
 * 執行：npx tsx --tsconfig tsconfig.json scripts/emit-canvas-after-tax-etf.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { AFTER_TAX_RANK_2026_08_ETF } from "../lib/blog/after-tax-rank-2026-08-universe.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const canvasPath =
  process.env.CANVAS_AFTER_TAX_PATH ??
  path.join(
    process.env.USERPROFILE ?? "",
    ".cursor",
    "projects",
    "d-73-Wealth-Freedom-Calculator",
    "canvases",
    "after-tax-dividend-report-template.canvas.tsx",
  );

const rows = AFTER_TAX_RANK_2026_08_ETF.map((r) => ({
  ticker: r.ticker,
  name: r.name,
  price: r.price,
  lastCashPerUnit: r.lastCashPerUnit,
  stockDivPerUnit: r.stockDivPerUnit,
  ttmCashPerUnit: r.ttmCashPerUnit,
  ttmComplete: r.ttmComplete,
  freq: r.freq,
  prevRank: 0,
  exDate: r.exDate,
  lastBuy: r.lastBuy,
  payDate: r.payDate,
  ...(r.recentCashPayouts?.length ? { recentCashPayouts: r.recentCashPayouts } : {}),
}));

const block = `const ETF_SNAPSHOT: SnapshotRow[] = ${JSON.stringify(rows, null, 2)};\n`;

let src = fs.readFileSync(canvasPath, "utf8");
const start = src.indexOf("const ETF_SNAPSHOT: SnapshotRow[] = [");
const end = src.indexOf("];\n\nconst STOCK_SNAPSHOT", start);
if (start < 0 || end < 0) {
  console.error("Could not find ETF_SNAPSHOT block in canvas");
  process.exit(1);
}
src = src.slice(0, start) + block + src.slice(end + 3);
fs.writeFileSync(canvasPath, src);
console.log(`Canvas ETF_SNAPSHOT updated: ${rows.length} rows`);
