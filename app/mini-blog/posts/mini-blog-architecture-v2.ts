/**
 * mini-blog「第 11 台第 7 篇以後」同款架構 — 範本（ specs + 程式）
 *
 * ## 錨點文章（第 7 篇程式來源）
 * - Slug 形式：`quick11-{loan}-t{01-08}-s007`（見 `quick11-posts-7-100.ts`、`loan-scenarios.ts`）
 * - 段落產生：`quick1-exclusive.ts` 內 `buildSectionsQuick11` + `buildQuick11ExclusiveSections`
 *   （前言四段含「本篇試算條件」；理財觀點；操作指南）
 *
 * ## 2026/5/10 起其他小計算機（quick-1～10）
 * - 同一三段標題；前言嵌入「本篇試算條件」——數字必與各台 `view.tsx`／`page.tsx` **開預設值**一致（見下方 `TRIAL_*`）
 * - 文內試算元件維持現狀 lazy 載入整頁 UI；預設 state 即為案例數字，無需改 embed 程式即可對齊文案
 */

import type { Quick1ExclusiveSection, TopicSeed } from "./topic-types";

/** 給文件／助理用的架構說明（非執行邏輯） */
export const MINI_BLOG_ARCHITECTURE_SPEC = [
  "【標題層】H1 = TopicSeed.title",
  "【前言】談焦點 → 本篇試算條件（具體數字）→ 試算目的 → 請下滑開啟文末計算機",
  "【理財觀點】取捨與機會成本（通用，不含幕後術語）",
  "【操作指南】核對參數、一次改一變數、關鍵字融入句子（非標籤雲）",
].join("\n");

const MAY10_MS = Date.parse("2026-05-10T00:00:00+08:00");

/** 僅處理「台北日曆日 >= 2026-05-10」的文章（5/10 當天起套用） */
export function miniBlogUsesMay10Architecture(publishAtIso: string): boolean {
  const t = new Date(publishAtIso);
  if (Number.isNaN(t.getTime())) return false;
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(t);
  const postMs = Date.parse(`${ymd}T12:00:00+08:00`);
  return postMs >= MAY10_MS;
}

type CalcRoute = NonNullable<TopicSeed["calculatorRoute"]>;

/** 與各台試算「開頁預設」對齊之試算條件句（繁中、讀者向） */
export function getTrialConditionsLineForRoute(route: CalcRoute): string {
  const disclaimer = "（情境示意，非報酬保證；實際以你的契約與市場為準）";
  switch (route) {
    case "/quick-1":
      return `本篇試算條件（與文末試算開頁預設一致）：每月投入 NT$ 20,000、複利年化假設 7%、累積年期 20 年。${disclaimer}`;
    case "/quick-2":
      return `本篇試算條件（與文末試算開頁預設一致）：目標月領 NT$ 50,000、每月投入 NT$ 20,000、達標路徑試算年化假設 5%。${disclaimer}`;
    case "/quick-3":
      return `本篇試算條件（與文末試算開頁預設一致）：希望月領 NT$ 50,000、累積年期 20 年、建議月投試算年化假設 7%。${disclaimer}`;
    case "/quick-4":
      return `本篇試算條件（與文末試算開頁預設一致）：每月投入 NT$ 20,000、累積 20 年、標的 0050、配息示範由第 1 期起、起始年月 2026 年 3 月。${disclaimer}`;
    case "/quick-5":
      return `本篇試算條件（與文末試算開頁預設一致）：每月投入 NT$ 20,000、年期 20 年、長期報酬假設 7%。${disclaimer}`;
    case "/quick-6":
      return `本篇試算條件（與文末試算開頁預設一致）：每月投入 NT$ 20,000、年期 20 年、長期報酬假設 7%。${disclaimer}`;
    case "/quick-7":
      return `本篇試算條件（與文末試算開頁預設一致）：每月投入 NT$ 20,000、車貸年期 5 年示意、後續投入長期假設 7%。${disclaimer}`;
    case "/quick-8":
      return `本篇試算條件（與文末試算開頁預設一致）：總價／預算欄位示意 NT$ 20,000、每月投入 NT$ 20,000、年期 20 年。${disclaimer}`;
    case "/quick-9":
      return `本篇試算條件（與文末試算開頁預設一致）：總預算 NT$ 20,000、分期 2 年、延遲開始投資 2 年、年化假設 7%、圖表跨度 10 年。${disclaimer}`;
    case "/quick-10":
      return `本篇試算條件（與文末試算開頁預設一致）：每月投入 NT$ 20,000、年期 10 年、年化 7%、情境崩跌 -30%。${disclaimer}`;
    case "/quick-11":
      return `本篇為破產計算機專文，試算條件請以文內「本篇試算條件」段落為準。${disclaimer}`;
    case "/quick-12":
      return `本篇試算條件（與文末試算開頁預設一致）：貸款本金 NT$ 500,000、84 期、貸款年利率 6%、預期投資年化 7%、合併課稅邊際 5%。${disclaimer}`;
    default:
      return `本篇試算條件請以文末計算機開頁預設為起點再微調。${disclaimer}`;
  }
}

export function defaultCalculatorNoteAfterMay10(route: CalcRoute): string {
  switch (route) {
    case "/quick-1":
      return "文末試算開頁預設為月投 20,000／年化 7%／20 年；請再依個案調整。";
    case "/quick-2":
      return "文末試算開頁預設為目標月領 50,000、月投 20,000、達標試算年化 5%。";
    case "/quick-3":
      return "文末試算開頁預設為希望月領 50,000、20 年、建議試算年化 7%。";
    case "/quick-4":
      return "文末試算開頁預設為月投 20,000、20 年、0050、第 1 期配息、起始 2026/03。";
    case "/quick-5":
      return "文末試算開頁預設為月投 20,000、20 年、長期假設 7%。";
    case "/quick-6":
      return "文末試算開頁預設為月投 20,000、20 年、長期假設 7%。";
    case "/quick-7":
      return "文末試算開頁預設為月投 20,000、車貸年期 5 年、長期假設 7%。";
    case "/quick-8":
      return "文末試算開頁預設為總價示意 20,000、月投 20,000、20 年。";
    case "/quick-9":
      return "文末試算開頁預設為預算 20,000、分期 2 年、延遲 2 年、年化 7%、圖 10 年。";
    case "/quick-10":
      return "文末試算開頁預設為月投 20,000、10 年、年化 7%、崩盤 -30%。";
    case "/quick-12":
      return "文末試算開頁預設為本金 500,000／84 期／貸款利率 6%／投資年化 7%／邊際稅率 5%。";
    default:
      return "請以文末試算開頁預設為起點，再依個案調整參數。";
  }
}

/** quick-1～10：與第 11 台第 7 篇同款三段＋前言嵌入試算條件數字 */
export function buildMiniBlogSectionsInvestingV2(
  seed: TopicSeed,
  calculatorName: string,
  route: CalcRoute,
): Quick1ExclusiveSection[] {
  const trial = getTrialConditionsLineForRoute(route);
  return [
    {
      heading: "前言",
      paragraphs: [
        `這篇把「${seed.focus}」拉回可核對的數字：先別談口號，先用與文末試算一致的條件把矛盾講清楚。`,
        trial,
        `情境數字只用來對齊假設，不是保證報酬；重點是你能不能長期執行、以及現金流是否留緩衝。`,
        `請下滑開啟文末「${calculatorName}」：開頁預設即為上文條件，建議一次只改一個變數做對照。`,
      ],
    },
    {
      heading: "理財觀點",
      paragraphs: [
        "提高投入、拉長年限、或調整報酬假設，本質都是取捨：你需要的是能活下去的配置，而不是一次填到最樂觀。",
        "所以試算的目的不是堆數字自我安慰，而是把「每月扣多少、最後落到哪裡、能不能承受波動」對齊成可行節奏。",
      ],
    },
    {
      heading: "操作指南",
      paragraphs: [
        `請在「${calculatorName}」核對月投入、年期、報酬假設與（若有）目標月領、標的或情境參數；先確認與你的規畫接近，再開始調參。`,
        `若想延伸思考「${seed.keywordA}」與「${seed.keywordB}」怎麼影響結論，建議留在同一試算裡、一次只動一個條件。`,
        `也別忽略「${seed.keywordC}」這類常見假設：把它放進表裡比空談口號更能避開誤判。`,
      ],
    },
  ];
}
