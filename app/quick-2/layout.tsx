import type { ReactNode } from "react";
import { QuickCalculatorJsonLd } from "@/lib/quick-calculator-json-ld";
import { buildQuickPageMetadata } from "@/lib/quick-open-graph-metadata";

const shareTitle = "財富自由倒數計時器｜目標月領五萬還要熬多久，一秒算清你離提早退休還有幾年";

export const metadata = buildQuickPageMetadata({
  id: 2,
  shareTitle,
  ogAlt: "財富自由倒數計時器 — 目標月領五萬還要熬多久，一秒算清你離提早退休還有幾年",
});

export default function Quick2Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <QuickCalculatorJsonLd id={2} />
    </>
  );
}
