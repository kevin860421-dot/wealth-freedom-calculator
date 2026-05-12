import type { TopicSeed } from "./topic-types";
import {
  formatPrincipalZhTW,
  QUICK11_LOAN_PRESETS,
  type Quick11LoanPresetKey,
} from "../../quick-11/loan-scenarios";

/**
 * 第 7～100 篇：6 貸款類型 × 8 試算分頁 × 2 輪 ≒ 96 組，取前 94 篇。
 * Slug：quick11-{loanKey}-t{tab}-s{serial} → loan-scenarios 解析 preset 與 initialPage。
 */

const TAB_PAGES = [
  { id: 1, title: "本息均攤", hook: "先看每期月付是否穩定，再把總利息當成「買這種穩定」的成本。" },
  { id: 2, title: "本金平均", hook: "前期月付通常較高，但總利息往往較省——適合你敢扛前期現金流的人。" },
  { id: 3, title: "提前還款", hook: "每月多還一點，縮短負債時間；先看總利息怎麼被剪掉。" },
  { id: 4, title: "大額還款", hook: "單筆還本後月付仍依剩餘本金走——適合拿到獎金／尾款時的情境。" },
  { id: 5, title: "延遲還款代價", hook: "寬限期／延後償還不是免費，晚還的利息會回來找你。" },
  { id: 6, title: "各種貸款 vs 存股", hook: "把槓桿成本跟長期報酬放在同一個框架比較，而不是各說各話。" },
  { id: 7, title: "風險模擬", hook: "升息或利率震盪時，月付與總成本會怎麼變？先做壓力測試。" },
  { id: 8, title: "財富翻轉", hook: "省下的利息能否轉成可投入資產，前提仍是現金流別先爆。" },
] as const;

const SEO_BANK: Record<Quick11LoanPresetKey, { a: string[]; b: string[]; c: string[] }> = {
  scooter: {
    a: ["機車貸款陷阱", "機車小額貸款", "機車分期試算", "機車貸款試算excel"],
    b: ["機車貸利率", "機車分期陷阱", "機車貸款總利息"],
    c: ["機車貸試算表", "機車貸款月付", "機車融資試算"],
  },
  car: {
    a: ["車貸試算", "中古車貸款利率", "汽車貸款月付"],
    b: ["車貸總利息", "車貸年期選擇", "車貸利率差1%"],
    c: ["車貸本息均攤", "車貸本金均攤", "車貸提前還款"],
  },
  personal: {
    a: ["信用貸款試算", "信貸利率8%", "信貸總利息"],
    b: ["信貸月付壓力", "信貸現金流", "信貸再貸"],
    c: ["信貸提前清償", "信貸手續費陷阱", "信貸與房貸並存"],
  },
  mortgage: {
    a: ["房貸試算", "房貸1100萬", "房貸本息均攤"],
    b: ["房貸本金均攤", "房貸升息壓力", "房貸提前還款"],
    c: ["房貸月付收入比", "青安房貸試算", "房貸寬限期"],
  },
  student: {
    a: ["就學貸款試算", "學貸還款壓力", "學貸利率"],
    b: ["學貸月付房租感", "學貸延後還款", "學貸分期"],
    c: ["學貸占收入比", "畢業後學貸", "學貸提前還"],
  },
  renovation: {
    a: ["裝潢貸試算", "裝潢分期利率", "裝潢貸100萬"],
    b: ["裝潢貸與房貸", "裝潢信用貸", "裝潢現金流"],
    c: ["裝潢貸月付", "裝潢貸總利息", "裝潢加貸風險"],
  },
};

function pickSeo(loanKey: Quick11LoanPresetKey, serial: number, field: "a" | "b" | "c"): string {
  const pool = SEO_BANK[loanKey][field];
  return pool[serial % pool.length];
}

function buildSeed(
  serial: number,
  loan: (typeof QUICK11_LOAN_PRESETS)[number],
  tab: (typeof TAB_PAGES)[number],
  round: number,
): TopicSeed {
  const loanKey = loan.key as Quick11LoanPresetKey;
  const slug = `quick11-${loanKey}-t${String(tab.id).padStart(2, "0")}-s${String(serial).padStart(3, "0")}`;
  const roundNote = round === 0 ? "" : "（進階對照）";
  const principalHint =
    loanKey === "mortgage"
      ? "千萬級房貸；本篇本金級距與文末試算「🏠 房貸」預設情境相同"
      : `本篇本金級距與文末試算「${loan.icon} ${loan.label}」預設情境相同`;

  const principalZh = formatPrincipalZhTW(loan.amount);
  const title =
    `${loan.label}${tab.title}划算嗎？${principalZh}、年利率 ${loan.annualRate}% 實測怎麼看${roundNote}`.trim();
  const subtitle = `有時不是繳不起，是繳完才發現心很空——${principalHint}；開啟文末試算後建議先查看「${tab.title}」單元的對照。`;
  const seoCore = `${pickSeo(loanKey, serial, "a")} × ${tab.title}`;
  const seoTitle = `破產計算機｜2026 ${seoCore}與 DTI 破產預警`;
  const metaDescription = `${tab.hook} 很多人拖到 DTI 變色才願意面對；本篇試算條件含 ${loan.icon} ${loan.label}、${tab.title}。延伸可對照：${pickSeo(loanKey, serial, "a")}、${pickSeo(loanKey, serial, "b")}。情境試算僅供參考，以契約為準。`;

  return {
    slug,
    title,
    subtitle,
    seoTitle,
    metaDescription,
    focus: `${loan.label}｜${tab.title}`,
    keywordA: pickSeo(loanKey, serial, "a"),
    keywordB: pickSeo(loanKey, serial, "b"),
    keywordC: pickSeo(loanKey, serial, "c"),
    closeQuestion: `若「${tab.title}」那頁數字讓你心裡一沉，你會先動本金、年期，還是先承認自己需要多留一點生活縫隙？`,
    calculatorRoute: "/quick-11",
    calculatorName: "破產計算機",
    calculatorNote: `本篇試算條件：文末試算開啟後會先顯示「${tab.title}」試算單元；若要回到與本文一致的預設本金／利率，請在試算頁選 ${loan.icon} ${loan.label} 情境。`,
  };
}

/** 台北時間 ISO（固定 +08:00，台灣無夏令時間） */
function formatTaipeiIso(ms: number): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(ms));
  const map = Object.fromEntries(
    parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}+08:00`;
}

/** 破產計算機 100 篇：前 6 篇維持 5/10～5/12 每日兩檔；自 5/13 起改為每日 2～3 篇、時刻錯開（避主要連假），降低規律訊號。 */
const QUICK11_PUBLISH_SLOT_COUNT = 100;
const QUICK11_LEGACY_SLOT_COUNT = 6;
const DAY_MS = 24 * 60 * 60 * 1000;
const QUICK11_FIRST_SLOT_OF_DAY_MS = Date.parse("2026-05-10T12:30:00+08:00");
const QUICK11_SECOND_SLOT_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const QUICK11_POST_MAY13_EXCLUDE_YMD = new Set([
  "2026-06-19",
  "2026-06-20",
  "2026-06-21",
  "2026-09-25",
  "2026-09-26",
  "2026-09-27",
  "2026-09-28",
  "2026-10-09",
  "2026-10-10",
  "2026-10-11",
  "2026-10-24",
  "2026-10-25",
  "2026-10-26",
  "2026-12-25",
  "2026-12-26",
  "2026-12-27",
]);

function taipeiYmdParts(ms: number): { y: string; mo: string; d: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(ms));
  const map = Object.fromEntries(parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value])) as Record<
    string,
    string
  >;
  return { y: map.year, mo: map.month, d: map.day };
}

function formatTaipeiIsoFromParts(y: string, mo: string, d: string, hour: number, minute: number, second: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}-${mo}-${d}T${pad(hour)}:${pad(minute)}:${pad(second)}+08:00`;
}

/** 5/13 起：每日 2～3 篇，時刻帶固定亂數偏移（仍確定性），避開連假曆日 */
function buildQuick11SlotsFromMay13(count: number): string[] {
  const MAY13_NOON_MS = Date.parse("2026-05-13T12:00:00+08:00");
  const out: string[] = [];
  let dayOffset = 0;
  let safety = 0;
  const clockPlans: Array<[number, number]> = [
    [9, 7],
    [13, 42],
    [20, 11],
  ];
  while (out.length < count && safety < 520) {
    safety += 1;
    const dayMs = MAY13_NOON_MS + dayOffset * DAY_MS;
    const { y, mo, d } = taipeiYmdParts(dayMs);
    const ymd = `${y}-${mo}-${d}`;
    if (QUICK11_POST_MAY13_EXCLUDE_YMD.has(ymd)) {
      dayOffset += 1;
      continue;
    }
    const postsToday = 2 + (dayOffset % 2);
    const baseIdx = out.length + dayOffset * 7;
    for (let k = 0; k < postsToday && out.length < count; k++) {
      const [h0, m0] = clockPlans[k % clockPlans.length];
      const jitter = (baseIdx * 19 + k * 23 + out.length * 11) % 37;
      const minute = Math.min(59, m0 + jitter);
      const second = 6 + ((baseIdx + k * 5) % 48);
      out.push(formatTaipeiIsoFromParts(y, mo, d, h0, minute, second));
    }
    dayOffset += 1;
  }
  if (out.length < count) {
    throw new Error(`[quick11] 無法產足 ${count} 個 5/13 後發文槽位（只產出 ${out.length}）`);
  }
  return out.slice(0, count);
}

export const QUICK11_ALL_100_PUBLISH_SLOTS: readonly string[] = (() => {
  const legacy = Array.from({ length: QUICK11_LEGACY_SLOT_COUNT }, (_, i) => {
    const dayIndex = Math.floor(i / 2);
    const slotInDay = i % 2;
    const ms =
      QUICK11_FIRST_SLOT_OF_DAY_MS +
      dayIndex * DAY_MS +
      (slotInDay === 0 ? 0 : QUICK11_SECOND_SLOT_OFFSET_MS);
    return formatTaipeiIso(ms);
  });
  const rest = buildQuick11SlotsFromMay13(QUICK11_PUBLISH_SLOT_COUNT - QUICK11_LEGACY_SLOT_COUNT);
  return [...legacy, ...rest];
})();

function generate(): TopicSeed[] {
  const seeds: TopicSeed[] = [];
  const loans = [...QUICK11_LOAN_PRESETS];

  for (let round = 0; round < 2 && seeds.length < 94; round += 1) {
    for (const loan of loans) {
      for (const tab of TAB_PAGES) {
        if (seeds.length >= 94) break;
        const serial = seeds.length + 7;
        seeds.push(buildSeed(serial, loan, tab, round));
      }
      if (seeds.length >= 94) break;
    }
  }

  return seeds;
}

export const QUICK11_POSTS_7_TO_100: TopicSeed[] = generate();
