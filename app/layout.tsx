import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono, Noto_Sans_TC } from "next/font/google";
import Script from "next/script";
import { getSiteOrigin } from "@/lib/site-origin";
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

  return (
    <html lang="zh-TW">
      <head>
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
