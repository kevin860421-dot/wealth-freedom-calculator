#!/usr/bin/env node
/**
 * 產生 app/mini-blog/posts/quick4-posts-tickers.ts（100 檔標的 SEO 文）
 * 執行：node scripts/gen-quick4-ticker-posts.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const out = path.join(root, "app", "mini-blog", "posts", "quick4-posts-tickers.ts");
const presetPath = path.join(root, "app", "ticker-presets.ts");

/** 熱門優先（台股高股息／權值／常搜個股） */
const PRIORITY = [
  "00919", "00878", "0056", "00929", "0050", "006208", "2330", "2317", "00713", "00940",
  "00907", "00730", "00900", "00934", "00935", "00915", "00918", "00932", "00939", "00943",
  "00631R", "00646", "00662", "00692", "00701", "00731", "00733", "00757", "00830", "00850",
  "00881", "00905", "00909", "00913", "00922", "00923", "00924", "00926", "00927", "00936",
  "00944", "00945", "00946", "00947", "00949", "00951", "00952", "00954", "00956", "00960",
  "00961", "00962", "00971", "2454", "2308", "2882", "2881", "2891", "2886", "2382",
  "2412", "3711", "3034", "2303", "3008", "6669", "3037", "2379", "3443", "3231",
  "3661", "5871", "3045", "2357", "2395", "2603", "2609", "2615", "2912", "1216",
  "2207", "1590", "2049", "3653", "1301", "1326", "2002", "2327", "2345", "2376",
  "2408", "2409", "2439", "4919", "2201", "2354", "00728", "00735", "00762", "00771",
  "00891",
];

/** 自 ticker-presets.ts 解析名稱、配息、殖利率 */
function parsePresetsFromSource(src) {
  const map = new Map();
  const blocks = src.split(/\n    \{\n/g).slice(1);
  for (const block of blocks) {
    const id = block.match(/id: "([^"]+)"/)?.[1];
    if (!id) continue;
    const label = block.match(/label: "([^"]+)"/)?.[1] ?? id;
    const name = label.match(/^(.+?)（/)?.[1]?.trim() ?? id;
    const freq =
      label.includes("月配") ? "month" : label.includes("半年配") ? "semiannual" : label.includes("年配") ? "year" : "quarter";
    const dividendYieldPct = Number(block.match(/dividendYieldPct: ([\d.]+)/)?.[1] ?? 0);
    const stockDividendPct = Number(block.match(/stockDividendPct: ([\d.]+)/)?.[1] ?? 0);
    const monthsMatch = block.match(/dividendMonths: \[([^\]]*)\]/);
    const months = monthsMatch?.[1]
      ?.split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n));
    map.set(id, { id, name, label, freq, dividendYieldPct, stockDividendPct, months });
  }
  return map;
}

const presetSrc = fs.readFileSync(presetPath, "utf8");
const PRESET_MAP = parsePresetsFromSource(presetSrc);
const ALL_IDS = [...PRESET_MAP.keys()];

const seen = new Set();
const ORDERED_IDS = [];
for (const id of PRIORITY) {
  if (PRESET_MAP.has(id) && !seen.has(id)) {
    seen.add(id);
    ORDERED_IDS.push(id);
  }
}
for (const id of ALL_IDS) {
  if (!seen.has(id)) {
    seen.add(id);
    ORDERED_IDS.push(id);
  }
}
const TICKER_IDS = ORDERED_IDS.slice(0, 100);

if (TICKER_IDS.length !== 100) {
  console.error("[quick4] need 100 ticker ids, got", TICKER_IDS.length);
  process.exit(1);
}

const missingPreset = TICKER_IDS.filter((id) => !PRESET_MAP.has(id));
if (missingPreset.length) {
  console.error("[quick4] missing presets:", missingPreset.join(", "));
  process.exit(1);
}

/** 熱門檔自訂 SEO 主標（長尾關鍵字） */
const CUSTOM_SEO = {
  "00919": "算出00919未來可以領多少？【00919複利計算機】",
  "00878": "00878存股試算：算出00878要存幾張能退休？",
  "0056": "老牌高股息0056複利計算機：每月存1萬的驚人資產",
  "00929": "月配息ETF首選！00929未來每月領1萬需要多少本金？",
  "0050": "市值型大盤成長試算：長期投資0050複利模擬器",
  "006208": "小資族版0050！006208長期定期定額終極試算",
  "2330": "護國神山台積電存股試算：買零股＋股利再投入複利效果",
  "2317": "鴻海股利與資產成長模擬器：現在進場未來能賺多少？",
  "00713": "高股息＋抗震首選！00713定期定額複利計算機",
  "00940": "萬眾矚目高股息！00940配息與財富自由夢想模擬器",
  "00907": "00907永豐優息存股試算：月配息ETF每月能領多少？",
  "00730": "00730富邦台灣優質高息｜存股試算與月領示意",
  "00900": "00900富邦特選高股息30存股試算｜定期定額複利",
  "00915": "00915凱基優選高股息30｜要存幾張才夠？試算教學",
  "00918": "00918大華優利高填息30配息試算｜除息月份怎麼看",
  "00932": "00932兆豐永續高息等權｜高股息月領1萬要多少本金？",
  "00939": "00939統一台灣高息動能｜月配息試算與領息路線",
};

function nameFor(id) {
  return PRESET_MAP.get(id)?.name ?? id;
}

function freqLabel(freq) {
  if (freq === "month") return "月配";
  if (freq === "semiannual") return "半年配";
  if (freq === "year") return "年配";
  return "季配";
}

function yieldHint(id) {
  const p = PRESET_MAP.get(id);
  if (!p) return "配息／年化為試算示意";
  const parts = [freqLabel(p.freq)];
  if (p.dividendYieldPct > 0) parts.push(`股息示意 ${p.dividendYieldPct}%`);
  if (p.stockDividendPct > 0) parts.push(`股票股利示意 ${p.stockDividendPct}%`);
  if (p.months?.length && p.freq !== "month") parts.push(`除息月 ${p.months.join("/")}`);
  return parts.join("、");
}

const ARCH = [
  {
    focus: "月領門檻試算",
    title: (id, name) => `${name}（${id}）月領 1 萬要存多久？先用期別拆給你看`,
    subtitle: () => "別只看終點資產；第幾期、哪個年月能領到，才決定你能不能撐下去。",
    seo: (id, name) => `${id} 月領1萬要多少本金？${name} 領息試算`,
    meta: (id, name, y) =>
      `用 ETF 領息夢想模擬器試算 ${id}（${name}）：每月投入 2 萬、20 年，看第幾期可月領；${y}（示意）。`,
    kwA: (id) => `${id} 月領1萬`,
    close: () => "你會先追最快達標期，還是先追最穩、可重複的達標期？",
    note: (id, name) => `請下滑開啟試算：已預帶 ${id}（${name}），先看第 1 期可月領。`,
  },
  {
    focus: "定期定額複利",
    title: (id, name) => `每月存 1 萬試 ${name}（${id}），20 年後資產長什麼樣？`,
    subtitle: () => "複利不是口號；是每期扣完、再投入後，還能不能繼續。",
    seo: (id, name) => `${id} 定期定額試算｜${name} 每月存1萬 20年`,
    meta: (id, name, y) => `${name}（${id}）月投 1～2 萬、20 年，對照可月領與總資產；${y}。`,
    kwA: (id) => `${id} 定期定額`,
    close: () => "若月投少 3000，你的達標期會往後幾年？",
    note: (id, name) => `試算已帶 ${id}（${name}）；可改月投 10,000 與 20,000 對照。`,
  },
  {
    focus: "配息頻率節奏",
    title: (id, name) => `${name}（${id}）配息是月配還季配？除息月份一次看懂`,
    subtitle: () => "同樣標的，配息月份不同，「可月領」的體感也會不同。",
    seo: (id, name) => `${id} 配息月份｜${name} 除息日與現金流試算`,
    meta: (id, name, y) => `${id}（${name}）配息頻率與除息月份示意；${y}；用第 4 台看第 n 期可月領。`,
    kwA: (id) => `${id} 配息月份`,
    close: () => "你比較需要「每月都有感」，還是「季配一次較厚」？",
    note: (id) => `試算已帶 ${id}；請對照「期別設定」年月，看非配息月是否為 0。`,
  },
  {
    focus: "存股張數換算",
    title: (id, name) => `存 ${name}（${id}）要幾張才夠？先用試算表對照`,
    subtitle: () => "張數是結果；你要先對齊的是投入節奏與可領現金流。",
    seo: (id, name) => `${id} 要存幾張？${name} 存股試算`,
    meta: (id, name, y) => `${id}（${name}）存股：月投 2 萬、20 年看資產與可月領；${y}。`,
    kwA: (id) => `${id} 存幾張`,
    close: () => "若只追張數、不看期別可月領，你覺得會漏什麼？",
    note: (id, name) => `試算已選 ${id}（${name}）；看總資產再粗算張數。`,
  },
  {
    focus: "晚開始補課",
    title: (id, name) => `35 歲才開始存 ${name}（${id}），還來得及嗎？`,
    subtitle: () => "晚開始不是死刑；但你要接受較高的月投或較長的等待。",
    seo: (id, name) => `晚開始存 ${id} 來得及嗎？${name} 10年20年對照`,
    meta: (id, name, y) => `${id}（${name}）晚開始：年期改 10／20 年對照可月領；${y}。`,
    kwA: (id) => `${id} 晚開始存股`,
    close: () => "你願意用「較高月投」換時間，還是接受較晚才領？",
    note: (id) => `預帶 ${id}、20 年；請改年期 10 年看落差。`,
  },
  {
    focus: "稅費與二代健保",
    title: (id, name) => `${name}（${id}）配息試算：別忘了扣完還剩多少`,
    subtitle: () => "毛配息好看；可再投入的是扣完稅費、健保後的數字。",
    seo: (id, name) => `${id} 配息扣稅｜${name} 可月領試算`,
    meta: (id, name, y) => `${id}（${name}）配息示意含 54C／二代健保；${y}。`,
    kwA: (id) => `${id} 配息扣稅`,
    close: () => "你算配息時，有把「單次超過 2 萬」的門檻算進去嗎？",
    note: (id) => `試算已帶 ${id}；請看可月領列（非配息月可能為 0）。`,
  },
  {
    focus: "加薪加碼路線",
    title: (id, name) => `加薪後多存 ${name}（${id}）5000，差幾年？`,
    subtitle: () => "多 5000 不是小數；在複利與配息再投入下會被放大。",
    seo: (id, name) => `${id} 加薪加碼｜${name} 月投多5000差幾年`,
    meta: (id, name, y) => `對照 ${id}（${name}）月投 2 萬 vs 2.5 萬；${y}。`,
    kwA: (id) => `${id} 加薪存股`,
    close: () => "若只能多存 2000，你會選拉長年限還是降目標？",
    note: (id) => `預帶 ${id}；請只改「每月投入」做 A/B 對照。`,
  },
  {
    focus: "家庭雙薪目標",
    title: (id, name) => `兩人一起存 ${name}（${id}），月領 2 萬比較快？`,
    subtitle: () => "家庭目標要算「加總月投」，不是各自做夢。",
    seo: (id, name) => `${id} 家庭存股｜${name} 月領2萬路線`,
    meta: (id, name, y) => `${id}（${name}）雙薪月投 4 萬示意，20 年可月領試算；${y}。`,
    kwA: (id) => `${id} 家庭存股`,
    close: () => "伴侶若只願意存一半，你的計畫還成立嗎？",
    note: (id) => `預帶 ${id}；可把月投改 40,000 試雙薪加總。`,
  },
  {
    focus: "回檔壓力測試",
    title: (id, name) => `若 ${name}（${id}）遇到回檔，領息計畫還撐得住嗎？`,
    subtitle: () => "回檔時最危險的不是帳面綠；是你停扣、停投。",
    seo: (id, name) => `${id} 回檔試算｜${name} 領息計畫`,
    meta: (id, name, y) => `${id}（${name}）維持月投紀律下的可月領路徑；${y}。`,
    kwA: (id) => `${id} 回檔存股`,
    close: () => "回檔時你會減碼、停扣，還是維持原計畫？",
    note: (id) => `預帶 ${id}；固定月投，只改「第幾期」看不同年月。`,
  },
  {
    focus: "退休倒數",
    title: (id, name) => `距離退休 15 年，${name}（${id}）月投要加多少？`,
    subtitle: () => "時間變短時，能動的旋鈕其實不多：月投、目標、預期。",
    seo: (id, name) => `${id} 退休試算｜${name} 15年存股路線`,
    meta: (id, name, y) => `${id}（${name}）15 年、月投 2 萬起算可月領；${y}。`,
    kwA: (id) => `${id} 退休倒數`,
    close: () => "15 年內，你比較敢動月投，還是敢動生活開銷？",
    note: (id) => `預帶 ${id}；請改年期 15，對照 20 年可月領。`,
  },
  {
    focus: "ETF vs 個股思維",
    title: (id, name) => `${name}（${id}）適合當領息核心嗎？`,
    subtitle: () => "核心標的是「你能持續投、睡得著」的那一檔。",
    seo: (id, name) => `${id} 適合領息嗎？${name} 存股試算`,
    meta: (id, name, y) => `從 ${id}（${name}）配息與可月領，評估是否適合作為領息核心；${y}。`,
    kwA: (id) => `${id} 領息核心`,
    close: () => "你選核心標的，先看報酬還是先看配息穩定？",
    note: (id, name) => `試算已帶 ${id}（${name}）；看總資產與可月領再決定。`,
  },
  {
    focus: "年度檢視",
    title: (id, name) => `每年重新試算 ${name}（${id}），我會看這三個數字`,
    subtitle: () => "計畫不是寫一次；是每年對齊一次。",
    seo: (id, name) => `${id} 存股年度檢視｜${name} 領息三個數字`,
    meta: (id, name, y) => `${id}（${name}）年度檢視：月投、年期、可月領；${y}。`,
    kwA: (id) => `${id} 年度檢視`,
    close: () => "你上一次調整月投，是因為加薪還是因為恐慌？",
    note: (id) => `預帶 ${id}；建議截圖保存，明年同一套參數再比。`,
  },
];

const seeds = TICKER_IDS.map((id, i) => {
  const a = ARCH[i % ARCH.length];
  const name = nameFor(id);
  const y = yieldHint(id);
  const slug = `quick4-${id.toLowerCase()}-dividend-simulator`;
  return {
    slug,
    tickerCode: id,
    title: a.title(id, name),
    subtitle: a.subtitle(id, name),
    seoTitle: CUSTOM_SEO[id] ?? a.seo(id, name),
    metaDescription: a.meta(id, name, y),
    focus: `${id}｜${a.focus}`,
    keywordA: a.kwA(id),
    keywordB: `${id} ${name} 領息試算`,
    keywordC: `${id} 存股試算`,
    closeQuestion: a.close(id, name),
    calculatorRoute: "/quick-4",
    calculatorName: "ETF 領息夢想模擬器",
    calculatorNote: a.note(id, name),
  };
});

const badGeneric = seeds.filter((s) => s.seoTitle.includes("台股標的") || s.title.includes("台股標的"));
if (badGeneric.length) {
  console.error("[quick4] still has 台股標的 in titles:", badGeneric.map((s) => s.tickerCode).join(", "));
  process.exit(1);
}

const QUICK4_THEMATIC_SLUGS = [
  "quick4-etf-monthly-income-simulator-guide",
  "quick4-first-10000-dividend-milestone",
  "quick4-monthly-20000-dividend-blueprint",
  "quick4-monthly-30000-dividend-reality-check",
  "quick4-which-period-can-i-start-withdraw",
  "quick4-dividend-frequency-monthly-vs-quarterly",
  "quick4-reinvest-vs-cashout-dividend-choice",
  "quick4-tax-fee-impact-on-dividend-cashflow",
  "quick4-0050-vs-high-dividend-etf-cashflow",
  "quick4-0056-00878-00919-high-dividend-compare",
  "quick4-00929-monthly-dividend-cashflow-guide",
  "quick4-dividend-ex-month-calendar-guide",
  "quick4-year-month-selector-practical-planning",
  "quick4-late-start-dividend-catchup-plan",
  "quick4-salary-growth-dividend-stepup",
  "quick4-single-income-dividend-safety-margin",
  "quick4-couple-dividend-goal-alignment",
  "quick4-bonus-topup-dividend-acceleration",
  "quick4-dividend-vs-selling-shares-cashflow",
  "quick4-stress-test-dividend-during-drawdown",
  "quick4-annual-reset-dividend-plan-checklist",
  "quick4-export-excel-compare-two-scenarios",
  "quick4-build-30year-dividend-discipline",
];

function interleaveSlugs() {
  const ordered = QUICK4_THEMATIC_SLUGS.slice(0, 3);
  const restThematic = QUICK4_THEMATIC_SLUGS.slice(3);
  const tickers = seeds.map((s) => s.slug);
  const chunk = Math.ceil(tickers.length / restThematic.length);
  let ti = 0;
  for (const th of restThematic) {
    for (let c = 0; c < chunk && ti < tickers.length; c++) ordered.push(tickers[ti++]);
    ordered.push(th);
  }
  while (ti < tickers.length) ordered.push(tickers[ti++]);
  return ordered;
}

const ORDERED = interleaveSlugs();

const EXCLUDE = new Set([
  "2026-06-19", "2026-06-20", "2026-06-21", "2026-09-25", "2026-09-26", "2026-09-27", "2026-09-28",
  "2026-10-09", "2026-10-10", "2026-10-11", "2026-10-24", "2026-10-25", "2026-10-26",
  "2026-12-25", "2026-12-26", "2026-12-27",
]);

function fmt(y, mo, d, h, mi, s) {
  const p = (n) => String(n).padStart(2, "0");
  return `${y}-${mo}-${d}T${p(h)}:${p(mi)}:${p(s)}+08:00`;
}

function buildSlots(count, anchorIso, fixedFirst3) {
  const slots = [...fixedFirst3];
  let need = count - fixedFirst3.length;
  let dayOffset = 0;
  const anchor = Date.parse(anchorIso);
  const clocks = [
    [9, 12],
    [12, 28],
    [15, 45],
    [19, 8],
    [21, 33],
  ];
  while (need > 0 && dayOffset < 900) {
    const dayMs = anchor + dayOffset * 86400000;
    const d = new Date(dayMs);
    const ymd = d.toISOString().slice(0, 10);
    if (EXCLUDE.has(ymd)) {
      dayOffset++;
      continue;
    }
    const postsToday = 1 + (dayOffset % 3);
    for (let k = 0; k < postsToday && need > 0; k++) {
      const [h0, m0] = clocks[(slots.length + k) % clocks.length];
      const jitter = (slots.length * 13 + k * 17) % 37;
      slots.push(
        fmt(ymd.slice(0, 4), ymd.slice(5, 7), ymd.slice(8, 10), h0, Math.min(59, m0 + jitter), 5 + ((k * 3) % 50)),
      );
      need--;
    }
    dayOffset++;
  }
  return slots.slice(0, count);
}

const FIXED = ["2026-05-07T09:00:00+08:00", "2026-05-20T09:00:00+08:00", "2026-06-02T09:00:00+08:00"];
const ALL_SLOTS = buildSlots(ORDERED.length, "2026-06-15T09:30:00+08:00", FIXED);

const ts = `/**
 * 第 4 台：100 檔標的 SEO 量產文 ＋ 發布排程（與 23 篇主題文穿插）
 * 產生：node scripts/gen-quick4-ticker-posts.mjs
 */
import type { TopicSeed } from "./topic-types";

/** 100 檔標的各 1 篇；slug: quick4-{代號}-dividend-simulator */
export const QUICK4_TICKER_POSTS: TopicSeed[] = ${JSON.stringify(seeds, null, 2)};

export const QUICK4_TICKER_CODES: readonly string[] = ${JSON.stringify(TICKER_IDS, null, 2)};

export const QUICK4_THEMATIC_SLUGS: readonly string[] = ${JSON.stringify(QUICK4_THEMATIC_SLUGS, null, 2)};

export const QUICK4_ORDERED_SLUGS: readonly string[] = ${JSON.stringify(ORDERED, null, 2)};

export const QUICK4_ALL_PUBLISH_SLOTS: readonly string[] = ${JSON.stringify(ALL_SLOTS, null, 2)};

export const QUICK4_PUBLISH_DATES: Readonly<Record<string, string>> = (() => {
  if (QUICK4_ORDERED_SLUGS.length !== QUICK4_ALL_PUBLISH_SLOTS.length) {
    throw new Error(\`[quick4] slug \${QUICK4_ORDERED_SLUGS.length} !== slots \${QUICK4_ALL_PUBLISH_SLOTS.length}\`);
  }
  return Object.fromEntries(QUICK4_ORDERED_SLUGS.map((slug, i) => [slug, QUICK4_ALL_PUBLISH_SLOTS[i]!]));
})();

export function getQuick4TickerSeedBySlug(slug: string): TopicSeed | undefined {
  return QUICK4_TICKER_POSTS.find((s) => s.slug === slug);
}

export function getQuick4TickerSeedByCode(code: string): TopicSeed | undefined {
  const id = code.toUpperCase();
  return QUICK4_TICKER_POSTS.find((s) => s.tickerCode?.toUpperCase() === id);
}
`;

fs.writeFileSync(out, ts, "utf8");
console.log("Wrote", out);
console.log("  ticker posts:", seeds.length);
console.log("  ordered slugs:", ORDERED.length);
console.log("  sample codes:", TICKER_IDS.slice(0, 5).join(", "), "…", TICKER_IDS.slice(-3).join(", "));
console.log("  includes 00907:", TICKER_IDS.includes("00907"), "00730:", TICKER_IDS.includes("00730"));
