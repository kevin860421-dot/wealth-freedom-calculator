import { absoluteUrl, getSiteOrigin } from "@/lib/site-origin";

const SCHEMA_AUTHOR = {
  "@type": "Organization" as const,
  name: "財富自由計算機",
  url: "https://wealth-freedom-calculator.vercel.app/",
};

/** 與首頁 SoftwareApplication 一致，供小計算機 1～12 共用（Rich Results 建議欄位） */
export const SCHEMA_AGGREGATE_RATING = {
  "@type": "AggregateRating" as const,
  ratingValue: "4.9",
  reviewCount: "42",
};

/** 首頁專用 JSON-LD（勿放在 root layout 全站注入，避免與小計算機 FAQ 重複） */
export function buildHomeJsonLd(origin = getSiteOrigin()) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${origin}/#software-application`,
        name: "台灣台股 ETF 財富自由計算機",
        description:
          "試算退休年期、台股 ETF 股利課稅、54C、二代健保補充保費與每期須扣除；支援 Excel 情境對照。",
        image: absoluteUrl("/og-share.png", origin),
        applicationCategory: "FinanceApplication",
        operatingSystem: "All",
        browserRequirements: "Requires HTML5",
        url: origin,
        isAccessibleForFree: true,
        author: SCHEMA_AUTHOR,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "TWD",
        },
        aggregateRating: SCHEMA_AGGREGATE_RATING,
      },
      {
        "@type": "FAQPage",
        "@id": `${origin}/#faq`,
        name: "財富自由計算機常見問題",
        url: origin,
        inLanguage: "zh-Hant",
        mainEntity: [
          {
            "@type": "Question",
            name: "點樣用財富自由計算機？",
            acceptedAnswer: {
              "@type": "Answer",
              text: "只需在網頁輸入目標月領金額、選擇 0050、00878 等台股 ETF 或自訂標的，並設定定期定額與股利再投入比例，模擬器就會在 3 秒內自動跑出圖表，精準預測您達到財富自由的關鍵年份與時間表。",
            },
          },
          {
            "@type": "Question",
            name: "這款財富自由模擬器有算進台灣的所得稅與二代健保嗎？",
            acceptedAnswer: {
              "@type": "Answer",
              text: "有！本工具為台灣投資人量身打造，試算表全面整合了股利所得課稅、54C 應稅股利占比、8.5% 股利抵減、分離課稅選項以及二代健保 2.11% 補充保費門檻，能算出扣完稅費後最真實的複利資產成長曲線。",
            },
          },
          {
            "@type": "Question",
            name: "這台財富自由計算機可以導出試算表檔案嗎？",
            acceptedAnswer: {
              "@type": "Answer",
              text: "可以，本站提供免費線上即時試算，完全免下載任何 Excel 檔、免註冊即可使用，且支援一鍵匯出 Excel 功能，方便您保存不同情境的壓力測試假設。",
            },
          },
        ],
      },
    ],
  };
}

export { SCHEMA_AUTHOR };
