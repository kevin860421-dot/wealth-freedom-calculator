import type { ReactNode } from "react";
import { QUICK6_DISPLAY_TITLE } from "@/app/quick-6/display-title";
import { QuickCalculatorJsonLd } from "@/lib/quick-calculator-json-ld";
import { buildQuickPageMetadata } from "@/lib/quick-open-graph-metadata";

const shareTitle = `${QUICK6_DISPLAY_TITLE}｜買房背房貸還是直接入市，一秒算清兩種人生選擇的真實資產大斷層`;

export const metadata = buildQuickPageMetadata({
  id: 6,
  shareTitle,
  ogAlt: `${QUICK6_DISPLAY_TITLE} — 買房背房貸還是直接入市，一秒算清兩種人生選擇的真實資產大斷層`,
});

export default function Quick6Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <QuickCalculatorJsonLd id={6} />
    </>
  );
}
