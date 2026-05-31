import type { ReactNode } from "react";
import { QUICK7_DISPLAY_TITLE } from "@/app/quick-7/display-title";
import { QuickCalculatorJsonLd } from "@/lib/quick-calculator-json-ld";
import { buildQuickPageMetadata } from "@/lib/quick-open-graph-metadata";

const shareTitle = `${QUICK7_DISPLAY_TITLE}｜同樣每月一筆錢，先繳車貸還是先存股？一秒看清長期差距`;

export const metadata = buildQuickPageMetadata({
  id: 7,
  shareTitle,
  ogAlt: `${QUICK7_DISPLAY_TITLE} — 車貸路線與直接投入全球股市的情境比較`,
  imageHeight: 672,
});

export default function Quick7Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <QuickCalculatorJsonLd id={7} />
    </>
  );
}
