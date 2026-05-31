import type { ReactNode } from "react";
import { QuickCalculatorJsonLd } from "@/lib/quick-calculator-json-ld";
import { buildQuickPageMetadata } from "@/lib/quick-open-graph-metadata";

const shareTitle = "雪球效應：本金 vs 複利｜死存本金還是股市滾利，一秒看清資產拉開兩倍差距";

export const metadata = buildQuickPageMetadata({
  id: 5,
  shareTitle,
  ogAlt: "雪球效應：本金 vs 複利 — 死存本金還是股市滾利，一秒看清資產拉開兩倍差距",
});

export default function Quick5Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <QuickCalculatorJsonLd id={5} />
    </>
  );
}
