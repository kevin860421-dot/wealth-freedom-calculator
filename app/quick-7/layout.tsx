import type { Metadata } from "next";
import type { ReactNode } from "react";
import { QUICK7_DISPLAY_TITLE } from "@/app/quick-7/display-title";
import { QuickCalculatorJsonLd, quickCanonicalPath } from "@/lib/quick-calculator-json-ld";
import { QUICK_SEO_BLOCKS } from "@/lib/quick-seo-data";

const block = QUICK_SEO_BLOCKS[7];
const shareTitle = `${QUICK7_DISPLAY_TITLE}｜同樣每月一筆錢，先繳車貸還是先存股？一秒看清長期差距`;
const ogImagePath = "/og-quick-7.jpg";

export const metadata: Metadata = {
  title: block.metaTitle,
  description: block.metaDescription,
  alternates: { canonical: quickCanonicalPath(7) },
  openGraph: {
    title: shareTitle,
    description: block.metaDescription,
    url: quickCanonicalPath(7),
    siteName: "財富自由計算機",
    locale: "zh_TW",
    type: "website",
    images: [
      {
        url: ogImagePath,
        width: 1024,
        height: 672,
        alt: `${QUICK7_DISPLAY_TITLE} — 車貸路線與直接投入全球股市的情境比較`,
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

export default function Quick7Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <QuickCalculatorJsonLd id={7} />
    </>
  );
}
