import type { ReactNode } from "react";
import { QUICK12_DISPLAY_TITLE } from "@/app/quick-12/display-title";
import { QuickCalculatorJsonLd } from "@/lib/quick-calculator-json-ld";
import { buildQuickPageMetadata } from "@/lib/quick-open-graph-metadata";

const shareTitle = `${QUICK12_DISPLAY_TITLE}｜月薪年終股利一鍋試算，一秒算清打工人薪資單上被東扣西扣的真實血汗錢`;

export const metadata = buildQuickPageMetadata({
  id: 12,
  shareTitle,
  ogAlt: `${QUICK12_DISPLAY_TITLE} — 月薪年終股利一鍋試算，一秒算清打工人薪資單上被東扣西扣的真實血汗錢`,
  imageHeight: 640,
});

export default function Quick12Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <QuickCalculatorJsonLd id={12} />
    </>
  );
}
