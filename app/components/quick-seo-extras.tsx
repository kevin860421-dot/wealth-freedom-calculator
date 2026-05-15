"use client";

import { QuickCuratedScenarios } from "./quick-curated-scenarios";
import { QuickFaqSection } from "./quick-faq-section";

/** 小計算機 SEO 擴充：精選情境內鏈 + 可見 FAQ（對應 layout JSON-LD） */
export function QuickSeoExtras({ id }: { id: number }) {
  return (
    <>
      <QuickCuratedScenarios id={id} />
      <QuickFaqSection id={id} />
    </>
  );
}
