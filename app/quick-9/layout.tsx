import type { ReactNode } from "react";
import { QuickCalculatorJsonLd } from "@/lib/quick-calculator-json-ld";
import { buildQuickPageMetadata } from "@/lib/quick-open-graph-metadata";

const shareTitle = "延遲享樂計算機 2｜分期享樂還是投入複利，一秒算清轉念之間拉開數十萬資產差距";

export const metadata = buildQuickPageMetadata({
  id: 9,
  shareTitle,
  ogAlt: "延遲享樂計算機 2 — 分期享樂還是投入複利，一秒算清轉念之間拉開數十萬資產差距",
});

export default function Quick9Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <QuickCalculatorJsonLd id={9} />
    </>
  );
}
