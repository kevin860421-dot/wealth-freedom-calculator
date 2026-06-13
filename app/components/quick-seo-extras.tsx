"use client";

import { QuickFaqSection } from "./quick-faq-section";

/** 小計算機 SEO 擴充：可見 FAQ（對應 layout JSON-LD）。精選情境資料見 lib/quick-curated-scenarios.ts，不在此渲染區塊。 */
export function QuickSeoExtras({ id }: { id: number }) {
  return <QuickFaqSection id={id} />;
}
