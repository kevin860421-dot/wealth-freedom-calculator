import type { ReactNode } from "react";
import { QuickCalculatorJsonLd } from "@/lib/quick-calculator-json-ld";
import { buildQuickPageMetadata } from "@/lib/quick-open-graph-metadata";

const shareTitle = "延遲享樂計算機｜一秒試算衝動消費的真實通膨代價";

export const metadata = buildQuickPageMetadata({
  id: 8,
  shareTitle,
  ogAlt: "延遲享樂計算機 — 一秒試算衝動消費的真實通膨代價",
  imageHeight: 536,
});

export default function Quick8Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <QuickCalculatorJsonLd id={8} />
    </>
  );
}
