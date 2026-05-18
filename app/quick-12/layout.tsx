import type { Metadata } from "next";
import type { ReactNode } from "react";
import { QUICK12_DISPLAY_TITLE } from "@/app/quick-12/display-title";
import { QuickCalculatorJsonLd, quickCanonicalPath } from "@/lib/quick-calculator-json-ld";
import { QUICK_SEO_BLOCKS } from "@/lib/quick-seo-data";

const block = QUICK_SEO_BLOCKS[12];
const shareTitle = `${QUICK12_DISPLAY_TITLE}｜月薪年終股利一鍋試算，一秒算清打工人薪資單上被東扣西扣的真實血汗錢`;
const ogImagePath = "/og-quick-12.jpg";

export const metadata: Metadata = {
  title: block.metaTitle,
  description: block.metaDescription,
  alternates: { canonical: quickCanonicalPath(12) },
  openGraph: {
    title: shareTitle,
    description: block.metaDescription,
    url: quickCanonicalPath(12),
    siteName: "財富自由計算機",
    locale: "zh_TW",
    type: "website",
    images: [
      {
        url: ogImagePath,
        width: 1024,
        height: 640,
        alt: `${QUICK12_DISPLAY_TITLE} — 月薪年終股利一鍋試算，一秒算清打工人薪資單上被東扣西扣的真實血汗錢`,
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

export default function Quick12Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <QuickCalculatorJsonLd id={12} />
    </>
  );
}
