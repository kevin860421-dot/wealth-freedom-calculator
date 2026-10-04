/**
 * 2026-09 總排行快照。
 * 股價：證交所 2026-09-30 ETF 收盤。沒有收盤的不列入，不用 8 月股價。
 * 配息：沿用 8 月已核對序列；除息日晚於 2026-08-31、早於等於 2026-09-30 的，補進樣本。
 */
import fs from "node:fs";
import path from "node:path";

const AS_OF = "2026-09-30";
const AUGUST_CUTOFF = "2026-08-31";
const ROOT = process.cwd();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getJson(url) {
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

function rocToIso(value) {
  const match = String(value ?? "").match(/(\d+)年(\d+)月(\d+)日/);
  if (!match) return null;
  const year = Number(match[1]) + 1911;
  return `${year}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
}

function parsePresets() {
  const text = fs.readFileSync(path.join(ROOT, "app/ticker-presets.ts"), "utf8");
  const presets = [];
  for (const block of text.split(/\n    \{\n/).slice(1)) {
    const id = block.match(/id: "([^"]+)"/)?.[1];
    const label = block.match(/label: "([^"]+)"/)?.[1];
    const frequency = block.match(/frequency: "([^"]+)"/)?.[1];
    const dividend = block.match(/dividendPerPeriod: ([0-9.]+)/)?.[1];
    if (!id || !label || !frequency) continue;
    if (!label.includes("- ETF -")) continue;
    presets.push({
      id,
      frequency,
      dividendPerPeriod: dividend ? Number(dividend) : 0,
    });
  }
  return presets;
}

function freqLabel(frequency) {
  if (frequency === "month") return "月";
  if (frequency === "quarter") return "季";
  if (frequency === "semiannual") return "半年";
  return "年";
}

function payoutsPerYear(freq) {
  if (freq === "月") return 12;
  if (freq === "季") return 4;
  if (freq === "半年") return 2;
  return 1;
}

function shortName(label) {
  return label.replace(/（\d+）.*$/, "").trim();
}

async function tradingCalendar() {
  const dates = [];
  for (let cursor = new Date(2025, 8, 1); cursor <= new Date(2026, 8, 1); cursor.setMonth(cursor.getMonth() + 1)) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const json = await getJson(
      `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${y}${m}01&stockNo=0050`,
    );
    for (const row of json.data ?? []) {
      const parts = String(row[0]).split("/");
      if (parts.length !== 3) continue;
      dates.push(`${Number(parts[0]) + 1911}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`);
    }
    await sleep(280);
  }
  return [...new Set(dates)].sort();
}

function previousTradingDay(calendar, iso) {
  return calendar.filter((day) => day < iso).at(-1) ?? "";
}

async function loadAudited() {
  const module = await import(
    pathToFileURL(path.join(ROOT, "app/blog/posts/after-tax-rank-2026-08-audited.ts")).href
  );
  return module.AFTER_TAX_RANK_2026_08_ETF_AUDITED;
}

import { pathToFileURL } from "node:url";

async function main() {
  const presets = parsePresets();
  const audited = new Map((await loadAudited()).map((row) => [row.ticker, row]));
  const index = await getJson(
    "https://www.twse.com.tw/exchangeReport/MI_INDEX?response=json&date=20260930&type=0099P",
  );
  const table = (index.tables ?? []).find((item) => (item.data ?? []).length > 10);
  if (!table) throw new Error("MI_INDEX 沒有 ETF 收盤表");
  const closes = new Map();
  const names = new Map();
  for (const row of table.data) {
    const price = Number(String(row[8]).replaceAll(",", ""));
    if (!Number.isFinite(price) || price <= 0) continue;
    closes.set(row[0], price);
    names.set(row[0], row[1]);
  }

  const dividends = await getJson("https://www.twse.com.tw/rwd/zh/ETF/etfDiv?response=json");
  const septemberEx = new Map();
  for (const row of dividends.data ?? []) {
    const exDate = rocToIso(row[2]);
    const cash = Number(String(row[5] ?? "").replaceAll(",", ""));
    if (!exDate || exDate <= AUGUST_CUTOFF || exDate > AS_OF) continue;
    if (!Number.isFinite(cash) || cash <= 0) continue;
    const list = septemberEx.get(row[0]) ?? [];
    list.push({ exDate, payDate: rocToIso(row[4]) ?? "", cash });
    septemberEx.set(row[0], list);
  }

  const calendar = await tradingCalendar();
  const rows = [];
  for (const preset of presets) {
    const price = closes.get(preset.id);
    if (!price) continue;
    const base = audited.get(preset.id);
    const freq = base?.freq ?? freqLabel(preset.frequency);
    const row = {
      ticker: preset.id,
      name: names.get(preset.id) || base?.name || shortName(preset.id),
      price,
      lastCashPerUnit: base?.lastCashPerUnit ?? preset.dividendPerPeriod,
      stockDivPerUnit: base?.stockDivPerUnit ?? 0,
      ttmCashPerUnit: base?.ttmCashPerUnit ?? preset.dividendPerPeriod * payoutsPerYear(freq),
      ttmComplete: base?.ttmComplete ?? false,
      ttmNote: base?.ttmNote ?? "配息序列沿用標的預設；股價改為證交所 2026-09-30 收盤",
      freq,
      exDate: base?.exDate ?? "—",
      lastBuy: base?.lastBuy ?? "—",
      payDate: base?.payDate ?? "—",
      recentCashPayouts: base?.recentCashPayouts ? [...base.recentCashPayouts] : undefined,
    };
    if (!(row.lastCashPerUnit > 0) && !(row.ttmCashPerUnit > 0) && !(row.recentCashPayouts?.length)) {
      continue;
    }
    const added = (septemberEx.get(preset.id) ?? []).sort((a, b) => a.exDate.localeCompare(b.exDate));
    if (added.length > 0) {
      const newest = added.at(-1);
      row.lastCashPerUnit = newest.cash;
      row.exDate = newest.exDate;
      row.lastBuy = previousTradingDay(calendar, newest.exDate);
      row.payDate = newest.payDate || row.payDate;
      if (row.recentCashPayouts?.length) {
        row.recentCashPayouts.push(...added.map((item) => item.cash));
        row.ttmCashPerUnit = Number(row.recentCashPayouts.reduce((sum, cash) => sum + cash, 0).toFixed(4));
      }
      row.ttmNote = `${row.ttmNote}；${added.map((item) => item.exDate).join("、")} 除息已列入上一期`;
    } else if (!base) {
      row.ttmNote = "股價為證交所 2026-09-30 收盤；配息仍是標的預設，這期沒有新的除息可補";
    } else {
      row.ttmNote = `${base.ttmNote}；股價改為 2026-09-30 收盤`;
    }
    if (!row.recentCashPayouts?.length) delete row.recentCashPayouts;
    rows.push(row);
  }
  rows.sort((a, b) => a.ticker.localeCompare(b.ticker, "zh-Hant"));

  const check = rows.find((row) => row.ticker === "00919");
  if (!check || check.price !== 31.88 || check.lastCashPerUnit !== 1.1 || check.exDate !== "2026-09-16" || check.lastBuy !== "2026-09-15") {
    throw new Error(`00919 核對失敗 ${JSON.stringify(check)}`);
  }

  const body = rows
    .map((row) => `  ${JSON.stringify(row, null, 2).replaceAll("\n", "\n  ")},`)
    .join("\n");
  const file = `import type { AfterTaxRankSnapshotRow } from "@/lib/blog/after-tax-rank";

/** 2026-09 月報 ETF。收盤 2026-09-30。配息沿用 8 月已核對序列，並補上 8/31 之後、9/30 以前的除息。 */
export const AFTER_TAX_RANK_2026_09_ETF: AfterTaxRankSnapshotRow[] = [
${body}
];
`;
  fs.writeFileSync(path.join(ROOT, "app/blog/posts/after-tax-rank-2026-09.ts"), file);
  console.log(`rows ${rows.length}`);
  console.log(`00919 ${JSON.stringify({ price: check.price, cash: check.lastCashPerUnit, ex: check.exDate, buy: check.lastBuy, samples: check.recentCashPayouts })}`);
  const rank29 = rows.find((row) => row.ticker === "00929");
  console.log(`00929 ${JSON.stringify(rank29)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
