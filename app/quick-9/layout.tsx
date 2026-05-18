import type { Metadata } from "next";
import type { ReactNode } from "react";
import { QuickCalculatorJsonLd, quickCanonicalPath } from "@/lib/quick-calculator-json-ld";
import { QUICK_SEO_BLOCKS } from "@/lib/quick-seo-data";

const block = QUICK_SEO_BLOCKS[9];
const shareTitle = "延遲享樂計算機 2｜分期享樂還是投入複利，一秒算清轉念之間拉開數十萬資產差距";
const ogImagePath = "/og-quick-9.jpg";

export const metadata: Metadata = {
  title: block.metaTitle,
  description: block.metaDescription,
  alternates: { canonical: quickCanonicalPath(9) },
  openGraph: {
    title: shareTitle,
    description: block.metaDescription,
    url: quickCanonicalPath(9),
    siteName: "財富自由計算機",
    locale: "zh_TW",
    type: "website",
    images: [
      {
        url: ogImagePath,
        width: 1024,
        height: 640,
        alt: "延遲享樂計算機 2 — 分期享樂還是投入複利，一秒算清轉念之間拉開數十萬資產差距",
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

export default function Quick9Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <QuickCalculatorJsonLd id={9} />
    </>
  );
}
