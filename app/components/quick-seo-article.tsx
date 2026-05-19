"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { SCHEMA_AUTHOR } from "@/lib/home-json-ld";
import { absoluteUrl } from "@/lib/site-origin";
import { QUICK_SEO_BLOCKS } from "@/lib/quick-seo-data";

export function QuickSeoArticle({ id }: { id: number }) {
  const pathname = usePathname();
  const block = QUICK_SEO_BLOCKS[id];

  const jsonLdString = useMemo(() => {
    if (!block) return null;
    const path = pathname && pathname !== "" ? pathname : `/quick-${id}`;
    const pageUrl = absoluteUrl(path.startsWith("/") ? path : `/${path}`);
    const articleBody = [
      ...block.paragraphs,
      "若需與首頁相同的台股 ETF／自訂標的、股利課稅、二代健保補充保費、手續費與每期須扣除等長軸試算，請前往財富自由計算機完整版：https://wealth-freedom-calculator.vercel.app/",
      "* 情境試算僅供教育與自我檢視；個案仍以法令、契約與實際報酬為準。",
    ].join("\n\n");

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: block.h2,
      description: block.metaDescription,
      articleBody,
      image: absoluteUrl(`/og-quick-${id}.jpg`),
      author: SCHEMA_AUTHOR,
      inLanguage: "zh-Hant",
      isAccessibleForFree: true,
      url: pageUrl,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": pageUrl,
      },
    };

    return JSON.stringify(jsonLd);
  }, [block, id, pathname]);

  if (!block || !jsonLdString) return null;

  return (
    <>
      <details
        style={{
          borderRadius: 14,
          border: "1px solid rgba(148,163,184,0.22)",
          background: "rgba(15,23,42,0.52)",
          padding: "12px 14px",
          color: "#cbd5e1",
          lineHeight: 1.82,
        }}
      >
        <summary
          style={{
            cursor: "pointer",
            color: "#e8eefc",
            fontSize: 15,
            lineHeight: 1.35,
            fontWeight: 900,
          }}
        >
          {block.summaryLabel}
        </summary>
        <section aria-labelledby={`quick-${id}-seo-article-heading`} style={{ marginTop: 12 }}>
          <h2
            id={`quick-${id}-seo-article-heading`}
            style={{
              margin: "0 0 12px",
              color: "#e8eefc",
              fontSize: 19,
              lineHeight: 1.35,
              fontWeight: 950,
            }}
          >
            {block.h2}
          </h2>
          <div style={{ display: "grid", gap: 10, fontSize: 14 }}>
          {block.paragraphs.map((paragraph, index) => (
            <p key={`${id}-${index}`} style={{ margin: 0 }}>
              {paragraph}
            </p>
          ))}
          <p style={{ margin: 0, color: "rgba(191,219,254,0.92)" }}>
            若需與首頁相同的台股 ETF／自訂標的、股利課稅、二代健保補充保費、手續費與每期須扣除等長軸試算，請前往財富自由計算機完整版。
          </p>
          <p style={{ margin: 0, color: "rgba(148,163,184,0.95)", fontSize: 12 }}>
            情境試算僅供教育與自我檢視；個案仍以法令、契約與實際報酬為準。
          </p>
          </div>
        </section>
      </details>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger -- JSON-LD 標準寫法
        dangerouslySetInnerHTML={{ __html: jsonLdString }}
      />
    </>
  );
}
