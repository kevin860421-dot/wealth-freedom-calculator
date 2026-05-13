import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono, Noto_Sans_TC } from "next/font/google";
import Script from "next/script";
import "./desktop-mobile-isolation.css";
import "./globals.css";
import { getPublicStatsSnapshot } from "@/lib/stats-store";
import { PwaServiceWorkerRegister } from "./pwa-service-worker-register";
import { StatsProvider } from "./stats-provider";
import { VisitStatsSeoSnippet } from "./visit-stats-seo-snippet";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** 全站中文正文：螢幕閱讀用黑體，fallback 用系統常見繁中字族 */
const notoSansTc = Noto_Sans_TC({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-sans-tc",
  adjustFontFallback: true,
});

/**
 * 首頁為巨型 client bundle；若 force-dynamic 會讓每次請求都 SSR、邊緣無快取，TTFB 容易偏高。
 * 造訪統計不需秒級更新：用 ISR 讓 HTML 可在邊緣快取（頁內仍會 POST /api/stats 更新）。
 */
export const revalidate = 60;

function getSiteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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

  return (
    <html lang="zh-TW">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-BG3PNZVNJW"
          strategy="afterInteractive"
        />
        <Script id="ga4-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-BG3PNZVNJW');
          `}
        </Script>
      </head>
      <body
        className={`${notoSansTc.variable} ${geistSans.variable} ${geistMono.variable}`}
        style={{ position: "relative" }}
      >
        <VisitStatsSeoSnippet stats={initialStats} />
        <PwaServiceWorkerRegister />
        <StatsProvider initialStats={initialStats}>{children}</StatsProvider>
        <Analytics />
      </body>
    </html>
  );
}
