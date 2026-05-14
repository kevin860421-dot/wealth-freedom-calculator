# 首頁大計算機 Technical SEO 可回復節點

本文件是「可回復」版本，不只是摘要。若之後 `app/layout.tsx` 的首頁 SEO / JSON-LD 被改壞，可依本文件把關鍵片段貼回。

## 鎖定檔案

- `app/layout.tsx`
- `.cursor/rules/homepage-technical-seo-checkpoint.mdc`

## 回復方式

1. 開啟 `app/layout.tsx`。
2. 確認 `metadata` 使用下方「metadata 節點」。
3. 在 `RootLayout` 內、`return` 前，確認有下方「structuredData 節點」。
4. 在 `<head>` 內、GA script 前，確認有下方 JSON-LD `<script>`。
5. 回復後執行：

```bash
npm run build
```

## metadata 節點

```tsx
export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: "財富自由計算機｜試算退休年期與Excel | 財富自由計算機",
  description:
    "用財富自由計算機、財富自由模擬器與財富計算機試算退休年期、台股ETF稅費和二代健保；支援財富自由計算機excel情境對照，也回應點樣用財富自由計算機。",
  verification: {
    google: "Xa8A6x-OcpVpIvDDdGXEPfjtcPZEpUHdykRg3SuwShQ",
  },
  openGraph: {
    title: "財富自由計算機｜試算退休年期與Excel | 財富自由計算機",
    description:
      "用財富自由計算機、財富自由模擬器與財富計算機試算退休年期、台股ETF稅費和二代健保；支援財富自由計算機excel情境對照。",
    url: "https://wealth-freedom-calculator.vercel.app/",
    siteName: "財富自由計算機",
    images: [
      {
        url: "https://wealth-freedom-calculator.vercel.app/og-share.png",
        width: 1024,
        height: 1024,
        alt: "財富自由計算機 — 我的退休時間縮短了",
      },
    ],
    locale: "zh_TW",
    type: "website",
  },
};
```

## structuredData 節點

此段放在 `RootLayout` 函式內：

```tsx
const initialStats = getPublicStatsSnapshot();
const siteOrigin = getSiteOrigin();
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": `${siteOrigin}/#software-application`,
      name: "台灣台股 ETF 財富自由計算機",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Windows, macOS, Android, iOS",
      url: siteOrigin,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "TWD",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "42",
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${siteOrigin}/#faq`,
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
```

## `<head>` JSON-LD script 節點

此段放在 `app/layout.tsx` 的 `<head>` 裡，建議放在 GA script 前：

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
/>
```

## 不要改壞的重點

- 同頁只保留一段 `type="application/ld+json"`，內部用單一 `@graph` 串 `SoftwareApplication` 與 `FAQPage`。
- Schema.org 正確欄位是 `name`，不要改成 `@name`。
- `aggregateRating.ratingValue` 固定 `4.9`。
- `aggregateRating.reviewCount` 固定 `42`。
- 保留 `.replace(/</g, "\\u003c")`，避免 inline JSON-LD 注入風險。
- Google 是否實際顯示星星與 FAQ，由 Google rich result 演算法決定；本節點只保證頁面輸出結構化資料。
