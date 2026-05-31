import type { ReactNode } from "react";
import { QuickCalculatorJsonLd } from "@/lib/quick-calculator-json-ld";
import { buildQuickPageMetadata } from "@/lib/quick-open-graph-metadata";

const shareTitle = "ETF 領息夢想模擬器｜輸入 0050 一鍵精準模擬，親眼見證你的被動收入滾雪球計畫";

export const metadata = buildQuickPageMetadata({
  id: 4,
  shareTitle,
  ogAlt: "ETF 領息夢想模擬器 — 輸入 0050 一鍵精準模擬，親眼見證你的被動收入滾雪球計畫",
});

export default function Quick4Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <QuickCalculatorJsonLd id={4} />
    </>
  );
}
