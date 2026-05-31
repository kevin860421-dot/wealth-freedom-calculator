import type { ReactNode } from "react";
import { QuickCalculatorJsonLd } from "@/lib/quick-calculator-json-ld";
import { buildQuickPageMetadata } from "@/lib/quick-open-graph-metadata";

const shareTitle = "複利美夢 VS 崩盤現實 計算機｜不要只看美好複利而忽略風險，一秒算清期末大跌三十趴時的資產下場";

export const metadata = buildQuickPageMetadata({
  id: 10,
  shareTitle,
  ogAlt: "複利美夢 VS 崩盤現實 計算機 — 不要只看美好複利而忽略風險，一秒算清期末大跌三十趴時的資產下場",
});

export default function Quick10Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <QuickCalculatorJsonLd id={10} />
    </>
  );
}
