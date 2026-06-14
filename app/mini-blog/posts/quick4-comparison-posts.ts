/**
 * 第 4 台：高搜尋量比較型支柱文（非單一 ticker slug）
 */
import type { TopicSeed } from "./topic-types";

export const QUICK4_COMPARISON_POSTS: TopicSeed[] = [
  {
    slug: "quick4-0056-00878-00919-high-dividend-compare",
    title: "0056、00878、00919 怎麼配？高股息組合先用期別看現金流",
    subtitle: "三檔配息月份錯開，但「可月領」仍要按期別試算，別只用殖利率想像。",
    seoTitle: "0056 00878 00919 比較｜高股息ETF配息月份與月領試算",
    metaDescription:
      "比較 0056（元大高股息）、00878（國泰永續高股息）、00919（群益台灣精選高息）配息節奏；用 ETF 領息夢想模擬器分別帶入三檔看可月領。（示意）",
    focus: "0056／00878／00919 高股息比較",
    keywordA: "0056 00878 00919 比較",
    keywordB: "高股息ETF配息月份",
    keywordC: "高股息月領試算",
    closeQuestion: "你會三檔均分，還是一檔為核心、兩檔補配息月份？",
    calculatorRoute: "/quick-4",
    calculatorName: "ETF 領息夢想模擬器",
    calculatorNote: "請先選 0056／00878／00919 其中一檔試算，再換檔對照可月領；一次只改標的。",
  },
  {
    slug: "quick4-00929-monthly-dividend-cashflow-guide",
    title: "00929 月配息怎麼試算？每月可領多少要用期別看",
    subtitle: "月配 ETF 不是每月都一樣厚；仍要看第幾期、扣完稅費後能再投多少。",
    seoTitle: "00929 月配息試算｜復華台灣科技優息每月領多少？",
    metaDescription:
      "00929（復華台灣科技優息）月配示意：用第 4 台帶入 00929，看月投 2 萬、20 年下的可月領與總資產。（非報酬保證）",
    focus: "00929 月配現金流",
    keywordA: "00929 月配息",
    keywordB: "00929 每月領多少",
    keywordC: "00929 領息試算",
    closeQuestion: "你選 00929，是因為月配體感，還是成分股邏輯？",
    calculatorRoute: "/quick-4",
    calculatorName: "ETF 領息夢想模擬器",
    calculatorNote: "試算已可帶入 00929；請對照連續數期可月領，別只看單一月份。",
    tickerCode: "00929",
  },
  {
    slug: "quick4-dividend-ex-month-calendar-guide",
    title: "高股息 ETF 除息月份怎麼排？0056／00878／00919 一次對照",
    subtitle: "想湊每月有息，除息月比殖利率海報更重要。",
    seoTitle: "ETF除息月份對照｜0056 00878 00919 配息月曆與試算",
    metaDescription:
      "整理 0056（1/4/7/10）、00878（2/5/8/11）、00919（3/6/9/12）除息月份示意，並用領息夢想模擬器按期別看可月領。（示意）",
    focus: "除息月份對照",
    keywordA: "ETF除息月份",
    keywordB: "00919 除息日",
    keywordC: "高股息配息月曆",
    closeQuestion: "你的現金流是需要「每月都有」，還是「季季有就好」？",
    calculatorRoute: "/quick-4",
    calculatorName: "ETF 領息夢想模擬器",
    calculatorNote: "建議輪流帶入 0056、00878、00919，對照非配息月可月領是否為 0。",
  },
];

export const QUICK4_COMPARISON_SLUGS: readonly string[] = QUICK4_COMPARISON_POSTS.map((p) => p.slug);
