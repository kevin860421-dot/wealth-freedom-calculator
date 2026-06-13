import type { ReactNode } from "react";
import { QUICK13_DISPLAY_TITLE } from "@/app/quick-13/display-title";
import { QuickCalculatorJsonLd } from "@/lib/quick-calculator-json-ld";
import { buildQuickPageMetadata } from "@/lib/quick-open-graph-metadata";

const shareTitle = `${QUICK13_DISPLAY_TITLE}｜股利試算、所得稅與二代健保補充保費，一次看清扣完還剩多少`;

export const metadata = buildQuickPageMetadata({
  id: 13,
  shareTitle,
  ogAlt: `${QUICK13_DISPLAY_TITLE} — 股利試算、54C、所得稅與二代健保補充保費`,
  imageHeight: 640,
});

export default function Quick13Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <QuickCalculatorJsonLd id={13} />
    </>
  );
}
