import type { TopicSeed } from "@/app/mini-blog/posts/topic-types";
import { formatPrincipalZhTW } from "@/app/quick-11/loan-scenarios";
import type { Quick11LoanPresetKey } from "@/app/quick-11/loan-scenarios";
import {
  QUICK11_EXCEL_UNLOCK_CODE,
  QUICK11_SUCCESS_BLOG_PATH,
  QUICK11_SUCCESS_BLOG_TITLE,
  shouldUseQuick11V2ArticleCopy,
} from "@/lib/quick11-marketing";

/** GA／搜尋意圖補強（第四張圖＋使用者提供長尾） */
export const QUICK11_GA_LONGTAIL_POOL: readonly string[] = [
  "信貸房貸壓力測試",
  "DTI 試算",
  "DTI 破產預警",
  "2026 房貸試算",
  "破產計算機",
  "信貸房貸破產計算機",
  "整合負債會影響信用嗎",
  "信貸轉貸推薦銀行",
  "裝潢貸100萬利息試算",
  "裝潢貸款推薦 PTT",
  "貸款利息試算表",
  "本息攤還公式",
  "提早退休 Excel 公式試算",
  "房貸本息均攤",
  "本金均攤試算",
  "車貸試算",
  "信用貸款試算",
  "就學貸款試算",
  "利率大對決",
  "月付收入比",
];

const LOAN_LONGTAIL_HOOK: Record<Quick11LoanPresetKey, string[]> = {
  scooter: ["機車貸試算excel", "機車小額貸款", "機車分期陷阱"],
  car: ["車貸利率差1%", "中古車貸款利率", "汽車貸款月付"],
  personal: ["信貸轉貸前利息", "整合負債會影響信用嗎", "信貸總利息"],
  mortgage: ["2026 房貸試算", "房貸1100萬月付", "房貸本息均攤"],
  student: ["學貸占收入比", "就學貸款還款壓力", "畢業後學貸"],
  renovation: ["裝潢貸100萬利息試算", "裝潢貸與房貸", "裝潢加貸風險"],
};

export function pickQuick11GaLongtail(serial: number): string {
  return QUICK11_GA_LONGTAIL_POOL[serial % QUICK11_GA_LONGTAIL_POOL.length];
}

export function buildQuick11V2Title(
  loanKey: Quick11LoanPresetKey,
  loanLabel: string,
  tabTitle: string,
  principalZh: string,
  annualRate: number,
  serial: number,
  keywordA: string,
): string {
  const extra = LOAN_LONGTAIL_HOOK[loanKey][serial % LOAN_LONGTAIL_HOOK[loanKey].length];
  const templates = [
    `${keywordA}：${principalZh}、年利率 ${annualRate}% 戳破月繳糖衣，用 DTI 精算破產預警線`,
    `${loanLabel}${tabTitle}｜${extra}前先算總利息（2026 試算）`,
    `${extra} × ${tabTitle}｜${principalZh} 信貸房貸壓力測試實測`,
    `破產計算機｜${loanLabel} ${tabTitle}：${pickQuick11GaLongtail(serial)} 怎麼看`,
  ];
  return templates[serial % templates.length];
}

export function buildQuick11V2SeoTitle(keywordA: string, tabTitle: string): string {
  return `破產計算機｜2026 ${keywordA} × ${tabTitle} × DTI 破產預警`;
}

export function buildQuick11V2MetaDescription(
  tabHook: string,
  loanIcon: string,
  loanLabel: string,
  tabTitle: string,
  keywordA: string,
  keywordB: string,
  keywordC: string,
): string {
  return `${tabHook} 本篇對齊 ${keywordA}、${keywordB} 與 ${keywordC} 的搜尋意圖；${loanIcon} ${loanLabel}、${tabTitle}、信貸房貸壓力測試與 DTI 破產預警同屏試算。情境僅供參考，以契約為準。`;
}

/** 前 100 字內重複核心長尾（Step 1） */
export function weaveQuick11Keywords(intro: string, keywordA: string, keywordB: string): string {
  const head = intro.slice(0, 100);
  const needA = !head.includes(keywordA);
  const needB = !head.includes(keywordB);
  if (!needA && !needB) return intro;
  const prefix = [needA ? keywordA : "", needB ? keywordB : ""].filter(Boolean).join("、");
  return `${prefix}——${intro}`;
}

/** 理財觀點中段：小計算機攻守內鏈（Step 2） */
export function buildQuick11InlineCalculatorCta(principalZh: string, calculatorName: string): string {
  return `🛠️ 延伸工具：算完上面的 ${principalZh} 例子，你是不是也好奇自己手上的貸款到底多驚人？建議立刻使用本站的【${calculatorName} ➔】，一秒做信貸房貸壓力測試與 DTI 破產預警。`;
}

/** 操作指南末段：Excel 索取（Step 3） */
export function buildQuick11ExcelLeadParagraph(): string {
  return `🎁 我把本息攤還與 DTI 破產預警公式打包成可改參數的 Excel 範本（公式全開、可離線保存）。到粉專私訊「${QUICK11_EXCEL_UNLOCK_CODE}」即可索取；也可在破產計算機頁底部一鍵複製解鎖密碼。`;
}

/** 成功部落格互導：時間軸＋具體關鍵字（財富試算筆記 8） */
export function buildQuick11SuccessBlogParagraph(): string {
  return `📌 延伸閱讀：本站「${QUICK11_SUCCESS_BLOG_TITLE}」用同一條時間軸把入帳與扣款拆開，搜尋表現好正因標題直打「ETF月配息／股利課稅節奏」這類長尾；貸款試算也該用同樣邏輯——別只看月付，要看 DTI 與總利息。`;
}

export function enhanceQuick11SectionsForV2(
  slug: string,
  publishAtIso: string,
  seed: TopicSeed,
  sections: { heading: string; paragraphs: string[]; bullets?: string[] }[],
  principalZh: string,
  calculatorName: string,
): typeof sections {
  if (!shouldUseQuick11V2ArticleCopy(slug, publishAtIso)) return sections;

  const keywordA = seed.keywordA ?? "信貸房貸壓力測試";
  const keywordB = seed.keywordB ?? "DTI 破產預警";

  return sections.map((section, idx) => {
    if (idx === 0) {
      const p0 = weaveQuick11Keywords(section.paragraphs[0] ?? "", keywordA, keywordB);
      return { ...section, paragraphs: [p0, ...section.paragraphs.slice(1)] };
    }
    if (section.heading === "理財觀點") {
      return {
        ...section,
        paragraphs: [...section.paragraphs, buildQuick11InlineCalculatorCta(principalZh, calculatorName)],
      };
    }
    if (section.heading === "操作指南") {
      return {
        ...section,
        paragraphs: [
          ...section.paragraphs,
          buildQuick11ExcelLeadParagraph(),
          buildQuick11SuccessBlogParagraph(),
        ],
      };
    }
    return section;
  });
}

export function formatPrincipalForSeed(amount: number): string {
  return formatPrincipalZhTW(amount);
}
