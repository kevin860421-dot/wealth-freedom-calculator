import type { TopicSeed } from "./topic-types";
import { QUICK12_DISPLAY_TITLE } from "@/app/quick-12/display-title";

/** 第 12 台 mini-blog 第 2～100 篇（99 篇）：slug `quick12-s002`～`quick12-s100`。與首篇同 SEO 骨架，內容依「月薪／股票／PK」輪替＋感觸句輪替。 */

const PAGE_NAMES = ["月薪", "股票", "PK"] as const;

/** 內建 PK 情境標題（與 QuickCalculator12Content QUICK12_PK_SCENARIOS 一致） */
export const QUICK12_PK_SCENARIO_TITLES = ["00878 ×1 vs 2330 ×2", "0056 ×1 vs 2330 ×2", "2454 ×1 vs 2330 ×2"] as const;

/** 33 組感觸錨點 × 3 分頁＝99 篇，避免標題機械重複 */
const HOOKS: readonly string[] = [
  "薪轉入帳先笑一下，對扣繳憑單又沉默",
  "年終那筆錢，像煙火：亮一下、稅費像灰",
  "兼職與股利同一年進帳，情緒常比試算快",
  "毛額寫得漂亮，手領才決定你能不能生活",
  "勞健保像房租：每月都在，卻很少被記帳",
  "補充保費像遲到的簡訊：提醒你別太高興",
  "綜所稅不每月收，但它會把「多出來的」收回",
  "你以為賺夠了，其實只是還沒算到年底",
  "投資人最怕的不是跌，是現金流被扣到見底",
  "配息進帳很療癒，門檻一過又是另一個故事",
  "同一張薪水，兩種心情：發薪日與報稅季",
  "你不是不會存，是先把「能花的」想太大",
  "預算做在雲上，現實會在扣款那天落地",
  "手領普通不是羞恥，是終於願意對齊真實",
  "二代健保四個字，很多人第一次認真看是在生氣時",
  "累進稅像階梯：多一階，呼吸就不一樣",
  "同事聊報稅像在聊天氣，心裡卻都在比誰痛",
  "你問自己為什麼存不下來，答案可能在扣款明細",
  "別急著檢討意志力，先把「扣完還剩多少」講清楚",
  "數字不會安慰你，但它會停止你自我說謊",
  "把薪資、年終、股利放同一鍋，才不會各自樂觀",
  "你真正要花的是手領，不是面試時那句月薪",
  "報稅像年度健檢：不舒服，但能救命",
  "單筆入帳一高，心裡就要預留「補充保費的位置」",
  "你不需要更會賺，你需要更會看「扣完以後」",
  "情緒先跑在數字前面，月底就會加倍還債",
  "對帳那天如果安靜，通常不是沒事，是在消化",
  "把假設寫進試算，比把希望寫進記帳務實",
  "你願意誠實一次，預算才有機會變得溫柔",
  "稅費不是懲罰，是提醒你：自由有成本",
  "別跟毛額談戀愛，手領才是過日子的對象",
  "先把落差看清楚，再談要不要更努力",
  "最後會留下來的，是習慣對齊數字的人",
] as const;

const SEO_MIDDLE_ROTATE = [
  "勞健保綜所稅",
  "二代健保實領",
  "薪資股利合併示意",
  "補充保費門檻",
  "累進稅差額",
  "扣繳與手領",
] as const;

const KEY_A_POOL = [
  "二代健保補充保費試算",
  "實領薪資怎麼算",
  "勞健保自付試算",
  "年終獎金扣繳",
  "股利二代健保",
  "綜所稅累進試算",
  "月薪4萬5試算感觸",
  "投保薪資與實領",
  "兼職所得試算",
  "股票配息試算",
  "PK二代健保",
  "手領薪落差",
] as const;

const KEY_B_POOL = [
  "扣繳憑單對帳",
  "補充保費2萬門檻",
  "勞健保合計",
  "年終單筆入帳",
  "股利併入薪資",
  "累進稅級距",
  "每月可用現金",
  "毛額手領差異",
  "情境示意非報稅",
  "試算一次改一欄",
  "並排比對補充保費",
  "綜所稅應納示意",
] as const;

const KEY_C_POOL = [
  "財富自由計算機接續",
  "每期須扣除",
  "達標年期試算",
  "匯出Excel對照",
  "薪資股利同一鍋",
  "NHI2試算",
  "54C占比",
  "投保薪資上限",
  "年終與兼職並計",
  "多筆配息加總",
  "PK並排階梯",
  "手領階梯結果",
] as const;

export type Quick12EmbedTarget = { page: 0 | 1 | 2; pkScenarioIdx: number };

/** 由 mini-blog slug 決定文內試算初始分頁；首篇 intro 回傳 undefined（維持開頁預設）。 */
export function getQuick12EmbedTarget(slug: string): Quick12EmbedTarget | undefined {
  const m = /^quick12-s(\d{3})$/u.exec(slug);
  if (!m) return undefined;
  const serial = Number(m[1]);
  if (!Number.isFinite(serial) || serial < 2 || serial > 100) return undefined;
  const i = serial - 2;
  const page = (i % 3) as 0 | 1 | 2;
  const pkScenarioIdx = page === 2 ? (Math.floor(i / 3) % 3) as 0 | 1 | 2 : 0;
  return { page, pkScenarioIdx };
}

function pick<T extends readonly string[]>(pool: T, idx: number): T[number] {
  return pool[idx % pool.length]!;
}

function buildSeed(serial: number): TopicSeed {
  const i = serial - 2;
  const page = i % 3;
  const hook = HOOKS[Math.floor(i / 3)]!;
  const pageName = PAGE_NAMES[page]!;
  const pkScenarioIdx = page === 2 ? (Math.floor(i / 3) % 3) : 0;
  const pkTitle = page === 2 ? QUICK12_PK_SCENARIO_TITLES[pkScenarioIdx]! : "";

  const slug = `quick12-s${String(serial).padStart(3, "0")}`;
  const seoLead = `${hook}・實領與補充保費試算（示意）`;
  const seoMid = pick(SEO_MIDDLE_ROTATE, i);
  const seoTitle = `${seoLead}｜${QUICK12_DISPLAY_TITLE}｜${seoMid}｜財富自由計算機`;

  const title = `${hook}——我習慣先打開「${pageName}」這一頁對齊`;
  const subtitle = `不是要你變悲觀，是別再用毛額安慰自己。\n\n本篇試算條件與文末「${QUICK12_DISPLAY_TITLE}」開頁預設一致：月薪（投保薪資）45,000、年終／獎金 100,000、兼職／股利 30,000；建議你先切到「${pageName}」${page === 2 ? `，並用內建 PK「${pkTitle}」看兩側二代健保差異` : "，再一格一格改數字"}。情境示意，非報稅結論。`;

  const metaDescription = `${hook}。${page === 2 ? `PK「${pkTitle}」並排。` : `從「${pageName}」分頁看勞健保、補充保費與綜所示意。`}預設月薪4.5萬、年終10萬、兼職／股利3萬；延伸可接主站看每期須扣除與達標年期。`;

  const calculatorNote =
    page === 2
      ? `請下滑開啟文末試算：進入後請切到「PK」，並先點內建情境「${pkTitle}」；薪資預設維持月薪 45,000、年終 100,000、兼職／股利 30,000。`
      : `請下滑開啟文末試算：進入後請先切到「${pageName}」分頁；預設維持月薪 45,000、年終 100,000、兼職／股利 30,000，再一次只改一個欄位對照。`;

  return {
    slug,
    title,
    subtitle,
    seoTitle,
    metaDescription,
    focus: `${pageName}｜實領與稅費感觸`,
    keywordA: pick(KEY_A_POOL, i),
    keywordB: pick(KEY_B_POOL, i + 3),
    keywordC: pick(KEY_C_POOL, i + 5),
    closeQuestion:
      page === 0
        ? "你最近一次用「手領」而不是「月薪」去排預算，是什麼時候？"
        : page === 1
          ? "若把股票配息真的加進全年，你還敢用現在的花法嗎？"
          : `兩邊 PK 看完，你較想先調持股、還是先調「對現金流的想像」？`,
    calculatorRoute: "/quick-12",
    calculatorName: QUICK12_DISPLAY_TITLE,
    calculatorNote,
  };
}

/** 台北時間 ISO（+08:00） */
function formatTaipeiIsoFromParts(y: string, mo: string, d: string, hour: number, minute: number, second: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}-${mo}-${d}T${pad(hour)}:${pad(minute)}:${pad(second)}+08:00`;
}

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

const DAY_MS = 24 * 60 * 60 * 1000;

/** 與第 11 台量產文相近：避開主要連假曆日，降低「機械排程」感 */
const QUICK12_POST_EXCLUDE_YMD = new Set([
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

/**
 * 自 2026-05-15 起：每日 1～3 篇（循環 1、2、3），時段＋ jitter；產出第 2～100 篇的 99 個槽位。
 */
function buildQuick12SlotsFromMay15(count: number): string[] {
  const MAY15_ANCHOR_MS = Date.parse("2026-05-15T09:40:00+08:00");
  const out: string[] = [];
  let dayOffset = 0;
  let safety = 0;
  const clockPlans: Array<[number, number]> = [
    [8, 52],
    [12, 18],
    [15, 33],
    [19, 6],
    [21, 47],
  ];
  while (out.length < count && safety < 800) {
    safety += 1;
    const dayMs = MAY15_ANCHOR_MS + dayOffset * DAY_MS;
    const { y, mo, d } = taipeiYmdParts(dayMs);
    const ymd = `${y}-${mo}-${d}`;
    if (QUICK12_POST_EXCLUDE_YMD.has(ymd)) {
      dayOffset += 1;
      continue;
    }
    const postsToday = 1 + (dayOffset % 3);
    const baseIdx = out.length + dayOffset * 11;
    for (let k = 0; k < postsToday && out.length < count; k++) {
      const [h0, m0] = clockPlans[(baseIdx + k) % clockPlans.length]!;
      const jitter = (baseIdx * 17 + k * 29 + out.length * 13) % 41;
      const minute = Math.min(59, m0 + jitter);
      const second = 3 + ((baseIdx + k * 7) % 52);
      out.push(formatTaipeiIsoFromParts(y, mo, d, h0, minute, second));
    }
    dayOffset += 1;
  }
  if (out.length < count) {
    throw new Error(`[quick12] 無法產足 ${count} 個發文槽位（只產出 ${out.length}）`);
  }
  return out.slice(0, count);
}

export const QUICK12_INTRO_PUBLISH_ISO = "2026-05-14T09:00:00+08:00";

export const QUICK12_POSTS_2_TO_100: TopicSeed[] = Array.from({ length: 99 }, (_, j) => buildSeed(j + 2));

export const QUICK12_SLOTS_2_TO_100: readonly string[] = buildQuick12SlotsFromMay15(99);

export const QUICK12_ORDERED_SLUGS: readonly string[] = ["quick12-take-home-salary-nhi2-intro", ...QUICK12_POSTS_2_TO_100.map((s) => s.slug)];

export const QUICK12_ALL_PUBLISH_SLOTS: readonly string[] = [QUICK12_INTRO_PUBLISH_ISO, ...QUICK12_SLOTS_2_TO_100];

export const QUICK12_PUBLISH_DATES: Readonly<Record<string, string>> = (() => {
  if (QUICK12_ORDERED_SLUGS.length !== QUICK12_ALL_PUBLISH_SLOTS.length) {
    throw new Error(
      `[quick12] slug 數 ${QUICK12_ORDERED_SLUGS.length} !== 槽位數 ${QUICK12_ALL_PUBLISH_SLOTS.length}`,
    );
  }
  return Object.fromEntries(QUICK12_ORDERED_SLUGS.map((slug, i) => [slug, QUICK12_ALL_PUBLISH_SLOTS[i]!]));
})();

/** 折疊連結清單：與首篇同欄，description 用 subtitle 首行 */
export const QUICK12_ROUTE_LINK_ITEMS: ReadonlyArray<{ href: string; title: string; description: string }> =
  QUICK12_ORDERED_SLUGS.map((slug) => {
    if (slug === "quick12-take-home-salary-nhi2-intro") {
      return {
        href: `/mini-blog/${slug}`,
        title: QUICK12_DISPLAY_TITLE,
        description: "給常問「毛額好看、手領普通」的上班族；先對齊預設再慢慢改。",
      };
    }
    const seed = QUICK12_POSTS_2_TO_100.find((s) => s.slug === slug)!;
    const description = seed.subtitle.split("\n\n")[0]?.trim() ?? seed.title;
    return { href: `/mini-blog/${slug}`, title: seed.title, description };
  });
