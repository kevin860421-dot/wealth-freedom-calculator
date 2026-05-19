import { SCHEMA_AGGREGATE_RATING, SCHEMA_AUTHOR } from "@/lib/home-json-ld";
import { absoluteUrl, getSiteOrigin } from "@/lib/site-origin";
import { getQuickFaqs } from "./quick-seo-faq-data";
import { QUICK_SEO_BLOCKS } from "./quick-seo-data";

export function quickCanonicalPath(id: number): string {
  return `/quick-${id}`;
}

function quickSoftwareName(id: number, block: (typeof QUICK_SEO_BLOCKS)[number]): string {
  const fromTitle = block.metaTitle.split("｜")[0]?.trim();
  if (fromTitle) return fromTitle;
  return `第 ${id} 台小計算機`;
}

function quickOgImagePath(id: number): string {
  return `/og-quick-${id}.jpg`;
}

export function buildQuickCalculatorJsonLd(id: number) {
  const block = QUICK_SEO_BLOCKS[id];
  if (!block) return null;

  const origin = getSiteOrigin();
  const path = quickCanonicalPath(id);
  const url = absoluteUrl(path, origin);
  const softwareName = quickSoftwareName(id, block);
  const image = absoluteUrl(quickOgImagePath(id), origin);

  const faqs = getQuickFaqs(id);
  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: block.metaTitle,
      description: block.metaDescription,
      inLanguage: "zh-Hant",
      isPartOf: {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        name: "財富自由計算機",
        url: origin,
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${url}#software`,
      name: softwareName,
      description: block.metaDescription,
      image,
      applicationCategory: "FinanceApplication",
      operatingSystem: "All",
      browserRequirements: "Requires HTML5",
      isAccessibleForFree: true,
      url,
      author: SCHEMA_AUTHOR,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "TWD",
      },
      aggregateRating: SCHEMA_AGGREGATE_RATING,
    },
  ];

  if (faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      name: `${softwareName}常見問題`,
      url,
      inLanguage: "zh-Hant",
      isPartOf: { "@id": `${url}#webpage` },
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function QuickCalculatorJsonLd({ id }: { id: number }) {
  const jsonLd = buildQuickCalculatorJsonLd(id);
  if (!jsonLd) return null;

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- JSON-LD 標準寫法
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
    />
  );
}
