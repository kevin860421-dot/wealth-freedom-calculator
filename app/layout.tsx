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
  title: "財富自由計算機",
  description:
    "財富自由計算機：台股 ETF、定期定額、股利再投入、稅負與二代健保試算，結果僅供參考。",
  verification: {
    google: "Xa8A6x-OcpVpIvDDdGXEPfjtcPZEpUHdykRg3SuwShQ",
  },
  openGraph: {
    title: "財富自由計算機｜你離退休還有幾年？",
    description:
      "台股 ETF 定期定額、股利再投入、二代健保與稅負一次試算，掃碼立即算出你的退休年期。",
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
