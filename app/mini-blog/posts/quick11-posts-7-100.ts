import type { TopicSeed } from "./topic-types";
import { QUICK11_LOAN_PRESETS, type Quick11LoanPresetKey } from "../../quick-11/loan-scenarios";

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
      ? "千萬級房貸／情境本金與試算機「🏠 房貸」快捷一致"
      : `本金級距與試算機「${loan.icon} ${loan.label}」快捷一致`;

  const title = `${loan.label}×${tab.title}：月付、總利息怎麼一起看？${roundNote}`.trim();
  const subtitle = `${principalHint}；建議開箱後直接停在「${tab.title}」分頁做對照。`;
  const seoTitle = `${loan.label}${tab.title}試算｜破產計算機｜${pickSeo(loanKey, serial, "a")}`;
  const metaDescription = `${tab.hook} 錨點：${loan.icon} ${loan.label}、${tab.title}。長尾：${pickSeo(loanKey, serial, "a")}、${pickSeo(loanKey, serial, "b")}。情境試算僅供參考，以契約為準。`;

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
    closeQuestion: `若「${tab.title}」下的數字比你預期更硬，你會先調本金、年期，還是先拉高每月多還？`,
    calculatorRoute: "/quick-11",
    calculatorName: "破產計算機",
    calculatorNote: `本篇 slug 已綁定：開啟文內試算會停在「${tab.title}」分頁；按 ${loan.icon} ${loan.label} 快捷可重設為文中錨點數字。`,
  };
}

/** 平日 09:00／15:00 各一篇，略過週六日（連假可再手動調檔） */
function assignPublishIsoSlots(count: number): string[] {
  const out: string[] = [];
  let slotStartMs = Date.parse("2026-05-18T09:00:00+08:00");
  while (out.length < count) {
    const wd = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Taipei", weekday: "short" }).format(new Date(slotStartMs));
    if (wd === "Sat" || wd === "Sun") {
      slotStartMs += 24 * 60 * 60 * 1000;
      continue;
    }
    const ymd = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(slotStartMs));
    out.push(`${ymd}T09:00:00+08:00`);
    if (out.length >= count) break;
    out.push(`${ymd}T15:00:00+08:00`);
    slotStartMs += 24 * 60 * 60 * 1000;
  }
  return out.slice(0, count);
}

function generate(): { seeds: TopicSeed[]; publishBySlug: Record<string, string> } {
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

  const times = assignPublishIsoSlots(seeds.length);
  const publishBySlug: Record<string, string> = {};
  seeds.forEach((s, i) => {
    publishBySlug[s.slug] = times[i];
  });

  return { seeds, publishBySlug };
}

const generated = generate();

export const QUICK11_POSTS_7_TO_100: TopicSeed[] = generated.seeds;
export const QUICK11_PUBLISH_DATES_7_100 = generated.publishBySlug;
