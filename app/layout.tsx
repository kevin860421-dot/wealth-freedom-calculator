import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getPublicStatsSnapshot } from "@/lib/stats-store";
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

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "財富自由計算機",
  description:
    "財富自由計算機：台股 ETF、定期定額、股利再投入、稅負與二代健保試算，結果僅供參考。",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialStats = getPublicStatsSnapshot();

  return (
    <html lang="zh-TW">
      <body className={`${geistSans.variable} ${geistMono.variable}`} style={{ position: "relative" }}>
        <VisitStatsSeoSnippet stats={initialStats} />
        <StatsProvider initialStats={initialStats}>{children}</StatsProvider>
      </body>
    </html>
  );
}
