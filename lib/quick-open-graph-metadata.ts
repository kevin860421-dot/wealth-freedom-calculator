import type { Metadata } from "next";
import { quickCanonicalPath } from "@/lib/quick-calculator-json-ld";
import { QUICK_SEO_BLOCKS } from "@/lib/quick-seo-data";
import { absoluteUrl } from "@/lib/site-origin";

type QuickPageMetadataInput = {
  id: number;
  shareTitle: string;
  ogAlt: string;
  imageWidth?: number;
  imageHeight?: number;
};

/** 小計算機分享預覽：og:image 一律用絕對 HTTPS URL + type（FB／Messenger 較穩） */
export function buildQuickPageMetadata({
  id,
  shareTitle,
  ogAlt,
  imageWidth = 1200,
  imageHeight = 630,
}: QuickPageMetadataInput): Metadata {
  const block = QUICK_SEO_BLOCKS[id];
  // ?v= 讓 FB 發文器略過舊快取（偵錯工具與發文器快取分開）
  const imageUrl = absoluteUrl(`/og-quick-${id}.jpg?v=20260519`);
  const pageUrl = absoluteUrl(quickCanonicalPath(id));

  return {
    title: block.metaTitle,
    description: block.metaDescription,
    alternates: { canonical: quickCanonicalPath(id) },
    openGraph: {
      title: shareTitle,
      description: block.metaDescription,
      url: pageUrl,
      siteName: "財富自由計算機",
      locale: "zh_TW",
      type: "website",
      images: [
        {
          url: imageUrl,
          secureUrl: imageUrl,
          width: imageWidth,
          height: imageHeight,
          alt: ogAlt,
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description: block.metaDescription,
      images: [imageUrl],
    },
  };
}
