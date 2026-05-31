import type { ReactNode } from "react";
import { QuickCalculatorJsonLd } from "@/lib/quick-calculator-json-ld";
import { buildQuickPageMetadata } from "@/lib/quick-open-graph-metadata";

const shareTitle = "破產計算機｜先看月付與預警，再決定你是不是要把自由賣給銀行";

export const metadata = buildQuickPageMetadata({
  id: 11,
  shareTitle,
  ogAlt: "破產計算機 — 先看月付與預警，再決定你是不是要把自由賣給銀行",
});

export default function Quick11Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <QuickCalculatorJsonLd id={11} />
    </>
  );
}
