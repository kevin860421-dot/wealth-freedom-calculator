import type { Metadata } from "next";
import type { ReactNode } from "react";
import { QuickCalculatorJsonLd, quickCanonicalPath } from "@/lib/quick-calculator-json-ld";
import { QUICK_SEO_BLOCKS } from "@/lib/quick-seo-data";

const block = QUICK_SEO_BLOCKS[10];
const shareTitle = "複利美夢 VS 崩盤現實 計算機｜不要只看美好複利而忽略風險，一秒算清期末大跌三十趴時的資產下場";
const ogImagePath = "/og-quick-10.jpg";

export const metadata: Metadata = {
  title: block.metaTitle,
  description: block.metaDescription,
  alternates: { canonical: quickCanonicalPath(10) },
  openGraph: {
    title: shareTitle,
    description: block.metaDescription,
    url: quickCanonicalPath(10),
    siteName: "財富自由計算機",
    locale: "zh_TW",
    type: "website",
    images: [
      {
        url: ogImagePath,
        width: 1024,
        height: 614,
        alt: "複利美夢 VS 崩盤現實 計算機 — 不要只看美好複利而忽略風險，一秒算清期末大跌三十趴時的資產下場",
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

export default function Quick10Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <QuickCalculatorJsonLd id={10} />
    </>
  );
}
