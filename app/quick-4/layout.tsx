import type { Metadata } from "next";
import type { ReactNode } from "react";
import { QuickCalculatorJsonLd, quickCanonicalPath } from "@/lib/quick-calculator-json-ld";
import { QUICK_SEO_BLOCKS } from "@/lib/quick-seo-data";

const block = QUICK_SEO_BLOCKS[4];
const shareTitle = "ETF 領息夢想模擬器｜輸入 0050 一鍵精準模擬，親眼見證你的被動收入滾雪球計畫";
const ogImagePath = "/og-quick-4.jpg";

export const metadata: Metadata = {
  title: block.metaTitle,
  description: block.metaDescription,
  alternates: { canonical: quickCanonicalPath(4) },
  openGraph: {
    title: shareTitle,
    description: block.metaDescription,
    url: quickCanonicalPath(4),
    siteName: "財富自由計算機",
    locale: "zh_TW",
    type: "website",
    images: [
      {
        url: ogImagePath,
        width: 1024,
        height: 598,
        alt: "ETF 領息夢想模擬器 — 輸入 0050 一鍵精準模擬，親眼見證你的被動收入滾雪球計畫",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: shareTitle,
    description: block.metaDescription,
    images: [ogImagePath],
  },
};

export default function Quick4Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <QuickCalculatorJsonLd id={4} />
    </>
  );
}
