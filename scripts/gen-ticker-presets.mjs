#!/usr/bin/env node
/**
 * 產生 app/ticker-presets.ts（100 檔：ETF + 上市股票，數值為試算參考用）
 * 執行：node scripts/gen-ticker-presets.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const out = path.join(root, "app", "ticker-presets.ts");

const M12 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const Q = [2, 5, 8, 11];
const H = [6, 12];
const H17 = [1, 7];

/** @param {string} freq */
function dm(freq, custom) {
  if (custom) return custom;
  if (freq === "month") return M12;
  if (freq === "quarter") return Q;
  if (freq === "semiannual") return H17;
  if (freq === "year") return [7];
  return Q;
}

/** [id, name, freq, price, divPer, divY, stkY, months?, annual?, ratio54c?] */
const existing = [
  ["0050", "元大台灣50", "semiannual", 155, 1.85, 2.4, 4.6, [1, 7], 7.0, "20"],
  ["0056", "元大高股息", "quarter", 37.5, 0.97, 10, 0, [1, 4, 7, 10], 7.5, "15"],
  ["006208", "富邦台50", "semiannual", 95, 1.4, 2.9, 4.1, [7, 11], 7.0, "10"],
  ["00878", "國泰永續高股息", "quarter", 21.75, 0.4, 7.4, 0, Q, 7.2, "15"],
  ["00900", "富邦特選高股息30", "quarter", 13.8, 0.2, 5.8, 1.7, Q, 7.5, "5"],
  ["00919", "群益台灣精選高息", "quarter", 23, 0.3, 5.2, 2.8, [3, 6, 9, 12], 8.0, "10"],
  ["00929", "復華台灣科技高股息", "month", 18.7, 0.08, 5.1, 2.9, M12, 8.0, "10"],
  ["00934", "中信成長高股息", "month", 22, 0.1, 5.4, 2.1, M12, 7.5, "5"],
  ["00935", "野村臺灣新科技50", "semiannual", 37.5, 0.68, 3.6, 3.9, [3, 9], 7.5, "5"],
  ["00940", "元大台灣價值高息", "quarter", 9.5, 0.12, 5.1, 2.4, [1, 4, 7, 10], 7.5, "5"],
];

/** ETF 補齊至 55 檔（含既有 10） */
const etfMore = [
  ["00646", "元大S&P500", "quarter", 48, 0.35, 2.9, 4.2],
  ["00662", "富邦NASDAQ", "semiannual", 28, 0.4, 2.8, 5.5],
  ["00730", "富邦台灣優質高息", "quarter", 16, 0.24, 6.0, 1.5],
  ["00692", "富邦公司治理", "quarter", 28, 0.5, 7.1, 0.5],
  ["00701", "國泰股利精選30", "quarter", 22, 0.28, 5.1, 1.8],
  ["00713", "元大台灣高息低波", "quarter", 52, 0.65, 5.0, 2.0],
  ["00728", "第一金工業30", "quarter", 18, 0.22, 4.9, 1.5],
  ["00731", "復華富時高息低波", "quarter", 24, 0.32, 5.3, 1.2],
  ["00733", "富邦臺灣中小", "semiannual", 35, 0.55, 3.1, 4.2],
  ["00735", "國泰臺韓科技", "semiannual", 32, 0.45, 2.8, 3.5],
  ["00757", "統一FANG+", "quarter", 42, 0.5, 4.8, 3.2],
  ["00762", "元大全球AI", "quarter", 18, 0.15, 3.3, 4.1],
  ["00771", "國泰北美科技", "semiannual", 38, 0.48, 2.5, 5.0],
  ["00830", "國泰費城半導體", "quarter", 45, 0.42, 3.7, 3.8],
  ["00850", "元大臺灣ESG永續", "quarter", 26, 0.35, 5.4, 1.6],
  ["00881", "國泰台灣科技龍頭", "quarter", 21, 0.3, 5.7, 1.4],
  ["00907", "永豐優息存股", "month", 14, 0.11, 8.5, 0.5, M12],
  ["00891", "中信美國市政債", "month", 35, 0.12, 4.1, 0],
  ["00905", "富邦信用債1-5Y", "month", 32, 0.1, 3.8, 0],
  ["00909", "國泰數位支付服務", "quarter", 20, 0.18, 3.6, 3.2],
  ["00913", "兆豐台灣晶圓製造", "quarter", 24, 0.25, 4.2, 2.5],
  ["00915", "凱基優選高股息30", "quarter", 17, 0.22, 5.2, 1.8],
  ["00918", "大華優利高填息30", "quarter", 18, 0.25, 5.6, 1.6],
  ["00922", "國泰台灣領袖50", "quarter", 30, 0.38, 5.1, 2.0],
  ["00923", "群益台ESG低碳50", "quarter", 19, 0.24, 5.0, 2.1],
  ["00924", "復華S&P500成長", "semiannual", 36, 0.4, 2.2, 4.5],
  ["00926", "凱基台灣5G+", "quarter", 16, 0.2, 5.0, 2.2],
  ["00927", "群益台灣中小型股", "quarter", 22, 0.28, 5.1, 1.9],
  ["00932", "宏大台灣ESG永續高息", "month", 14, 0.11, 9.4, 0],
  ["00936", "台新永續高息中小", "quarter", 19, 0.26, 5.5, 1.7],
  ["00939", "統一台灣高息動能", "month", 15, 0.06, 4.8, 2.0],
  ["00943", "兆豐電子高息等權", "quarter", 20, 0.24, 4.8, 2.0],
  ["00944", "新光台灣高息", "quarter", 12, 0.15, 5.0, 1.8],
  ["00945", "兆豐龍頭等權重", "quarter", 16, 0.2, 5.0, 1.9],
  ["00946", "群益台灣科技高息", "month", 10, 0.06, 7.2, 1.5],
  ["00947", "新光台灣半導體30", "quarter", 14, 0.18, 5.1, 1.8],
  ["00949", "凱基台灣AI50", "quarter", 18, 0.22, 4.9, 2.3],
  ["00951", "台新美國標普500", "semiannual", 33, 0.38, 2.3, 4.8],
  ["00952", "凱基台灣電力設施", "quarter", 17, 0.21, 4.9, 1.8],
  ["00954", "富邦臺灣中英德50", "quarter", 25, 0.3, 4.8, 2.0],
  ["00956", "中信台灣智慧綠能", "quarter", 15, 0.18, 4.8, 2.0],
  ["00960", "元大台灣金融高息", "month", 13, 0.1, 9.2, 0],
  ["00961", "元大投資級公司債", "month", 28, 0.11, 4.7, 0],
  ["00962", "中信電池及儲能", "quarter", 16, 0.19, 4.8, 2.0],
  ["00971", "野村美國研發龍頭", "semiannual", 22, 0.28, 2.5, 4.2],
];

/** 上市股票 45：季配／年配為參考 */
const stocks = [
  ["2330", "台積電", "quarter", 1085, 4.5, 1.7, 5.0],
  ["2317", "鴻海", "year", 185, 5.2, 2.8, 3.5],
  ["2454", "聯發科", "quarter", 980, 12, 1.2, 3.8],
  ["2308", "台達電", "quarter", 285, 3.2, 4.5, 3.2],
  ["2882", "國泰金", "year", 48, 1.8, 3.8, 2.5],
  ["2881", "富邦金", "year", 72, 3.5, 4.9, 2.8],
  ["2891", "中信金", "year", 38, 1.2, 3.2, 2.0],
  ["2886", "兆豐金", "year", 35, 1.1, 3.1, 2.0],
  ["2382", "廣達", "year", 220, 4.5, 2.0, 4.5],
  ["2412", "中華電", "year", 125, 4.8, 3.8, 2.2],
  ["3711", "日月光投控", "quarter", 145, 2.5, 6.9, 2.5],
  ["3034", "聯詠", "quarter", 520, 8, 1.5, 4.2],
  ["2303", "聯電", "quarter", 48, 0.45, 3.8, 2.0],
  ["3008", "大立光", "year", 2180, 65, 3.0, 3.5],
  ["6669", "緯穎", "quarter", 1780, 25, 1.4, 4.2],
  ["3037", "欣興", "quarter", 185, 2.5, 5.4, 2.8],
  ["2379", "瑞昱", "quarter", 520, 8, 1.5, 4.0],
  ["3443", "創意", "quarter", 680, 12, 1.8, 4.5],
  ["3231", "緯創", "quarter", 95, 1.2, 5.0, 2.8],
  ["3661", "世芯-KY", "quarter", 2450, 35, 1.4, 5.5],
  ["4919", "新光金", "year", 12, 0.15, 1.2, 1.0],
  ["5871", "中租-KY", "quarter", 285, 5.5, 7.7, 2.5],
  ["3045", "台灣大", "year", 115, 5.5, 4.8, 1.8],
  ["2357", "華碩", "year", 485, 12, 2.5, 3.8],
  ["2395", "研華", "year", 380, 10, 2.6, 3.5],
  ["2603", "長榮", "year", 168, 5, 3.0, 5.0],
  ["2609", "陽明", "year", 72, 2.5, 3.5, 4.2],
  ["2615", "萬海", "year", 85, 3, 3.5, 3.8],
  ["2912", "統一超", "year", 268, 8.5, 3.2, 2.5],
  ["1216", "統一", "year", 78, 2.8, 3.6, 2.2],
  ["2207", "和泰車", "year", 628, 15, 2.4, 3.0],
  ["1590", "亞德客-KY", "year", 720, 18, 2.5, 3.2],
  ["2049", "上銀", "year", 1850, 28, 1.5, 3.5],
  ["3653", "健策", "quarter", 520, 6, 1.2, 4.5],
  ["1301", "台塑", "year", 48, 1.8, 3.8, 2.0],
  ["1326", "台化", "year", 42, 1.5, 3.6, 1.8],
  ["2002", "中鋼", "year", 22, 0.5, 2.3, 1.5],
  ["2201", "裕隆", "year", 85, 2.2, 2.6, 2.0],
  ["2327", "國巨*", "quarter", 185, 3, 3.2, 2.8],
  ["2345", "智邦", "quarter", 420, 5.5, 1.3, 4.8],
  ["2354", "鴻準", "year", 72, 2, 2.8, 2.2],
  ["2376", "技嘉", "quarter", 185, 3.5, 2.0, 4.2],
  ["2408", "南亞科", "year", 485, 8, 1.6, 3.8],
  ["2409", "友達", "year", 16, 0.3, 1.9, 1.2],
  ["2439", "美律", "quarter", 185, 3, 3.2, 3.5],
];

function rowToPreset(row, kind) {
  const [id, name, freq, price, divPer, divY, stkY, monthsOpt, ar, r54] = row;
  const annualReturn = ar ?? Math.min(12, (divY + stkY) * 0.85 + 2);
  const freqLabel =
    freq === "month" ? "月配" : freq === "quarter" ? "季配" : freq === "semiannual" ? "半年配" : "年配";
  const kindTag = kind === "stock" ? "股票" : "ETF";
  const label = `${name}（${id}）- ${kindTag} - ${freqLabel} - 參考`;
  const dividendMonths = dm(freq, monthsOpt);
  const o = {
    id,
    label,
    annualReturn: Math.round(annualReturn * 10) / 10,
    frequency: freq,
    price,
    dividendPerPeriod: divPer,
    dividendYieldPct: divY,
    stockDividendPct: stkY,
    dividendMonths,
  };
  if (r54) o.ratio54c = r54;
  return o;
}

const presets = [
  ...existing.map((r) => rowToPreset(r, "etf")),
  ...etfMore.map((r) => rowToPreset([...r, undefined, undefined, undefined], "etf")),
  ...stocks.map((r) => rowToPreset([...r, undefined, undefined, undefined], "stock")),
];

if (presets.length !== 100) {
  console.error("Expected 100 presets, got", presets.length);
  process.exit(1);
}

const ids = new Set();
for (const p of presets) {
  if (ids.has(p.id)) throw new Error(`dup ${p.id}`);
  ids.add(p.id);
}

const header = `/**
 * 試算用標的預設（${presets.length} 檔：ETF + 上市股票）
 * 股價、配息、殖利率為參考用示意，實際以市場與公司公告為準。
 * 產生：node scripts/gen-ticker-presets.mjs
 */
export type TickerFrequency = "month" | "quarter" | "semiannual" | "year";

export type TickerPreset = {
  id: string;
  label: string;
  annualReturn: number;
  frequency: TickerFrequency;
  price?: number;
  dividendPerPeriod?: number;
  dividendYieldPct?: number;
  stockDividendPct?: number;
  dividendMonths?: number[];
  /** 54C 應稅股利占現金股利占比（%），供二代健保試算 */
  ratio54c?: string;
};

/** 從預設 label 判斷標的種類（例：「…- ETF - …」「…- 股票 - …」） */
export function tickerAssetKind(label: string): "ETF" | "股票" | null {
  if (label.includes("- ETF -")) return "ETF";
  if (label.includes("- 股票 -")) return "股票";
  return null;
}

/** 本金換算約可買股數，附代號與種類（例：約 270 股（0050 ETF）） */
export function formatApproxSharesLine(principal: number, preset: Pick<TickerPreset, "id" | "label" | "price"> | null | undefined): string {
  if (!preset?.price || preset.price <= 0) return "";
  const shares = Math.floor(principal / preset.price).toLocaleString("zh-TW");
  const kind = tickerAssetKind(preset.label);
  return kind ? \`約 \${shares} 股（\${preset.id} \${kind}）\` : \`約 \${shares} 股（\${preset.id}）\`;
}

`;

const plain = presets.map((p) => {
  const ratioLine = p.ratio54c ? `,\n      ratio54c: ${JSON.stringify(p.ratio54c)}` : "";
  return `    {
      id: ${JSON.stringify(p.id)},
      label: ${JSON.stringify(p.label)},
      annualReturn: ${p.annualReturn},
      frequency: ${JSON.stringify(p.frequency)} as TickerFrequency,
      price: ${p.price},
      dividendPerPeriod: ${p.dividendPerPeriod},
      dividendYieldPct: ${p.dividendYieldPct},
      stockDividendPct: ${p.stockDividendPct},
      dividendMonths: [${p.dividendMonths.join(", ")}]${ratioLine}
    }`;
});

const file = `${header}export const TICKER_PRESETS: TickerPreset[] = [
${plain.join(",\n")}
];

const M12 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

/** 各標的除息月份（1～12），供股利再投入試算 */
export function buildTickerDividendMonthsMap(): Record<string, number[]> {
  const m: Record<string, number[]> = {};
  for (const p of TICKER_PRESETS) {
    m[p.id] = [...(p.dividendMonths ?? [...M12])];
  }
  return m;
}

/** 54C 占比預設（%）；未設定者預設 10 */
export function buildDefault54cRatioMap(): Record<string, string> {
  const o: Record<string, string> = {};
  for (const p of TICKER_PRESETS) {
    o[p.id] = p.ratio54c ?? "10";
  }
  return o;
}
`;

fs.writeFileSync(out, file, "utf8");
console.log("Wrote", out, presets.length, "presets");
