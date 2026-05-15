import { getQuickFaqs } from "./quick-seo-faq-data";
import { QUICK_SEO_BLOCKS } from "./quick-seo-data";

const SITE_ORIGIN = "https://wealth-freedom-calculator.vercel.app";

export function quickCanonicalPath(id: number): string {
  return `/quick-${id}`;
}

export function buildQuickCalculatorJsonLd(id: number) {
  const block = QUICK_SEO_BLOCKS[id];
  if (!block) return null;

  const path = quickCanonicalPath(id);
  const url = `${SITE_ORIGIN}${path}`;
  const name = block.metaTitle.split("｜")[0] ?? `第 ${id} 台小計算機`;

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
        "@id": `${SITE_ORIGIN}/#website`,
        name: "財富自由計算機",
        url: SITE_ORIGIN,
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${url}#software`,
      name,
      description: block.metaDescription,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Windows, macOS, Android, iOS",
      isAccessibleForFree: true,
      url,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "TWD",
      },
    },
  ];

  if (faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      url,
      inLanguage: "zh-Hant",
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
