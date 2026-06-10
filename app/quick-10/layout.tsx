import type { ReactNode } from "react";
import { QUICK10_DISPLAY_NAME, QUICK10_SHARE_TAGLINE } from "@/app/quick-10/quick10-brand";
import { QuickCalculatorJsonLd } from "@/lib/quick-calculator-json-ld";
import { buildQuickPageMetadata } from "@/lib/quick-open-graph-metadata";

const shareTitle = `${QUICK10_DISPLAY_NAME}｜${QUICK10_SHARE_TAGLINE}`;

export const metadata = buildQuickPageMetadata({
  id: 10,
  shareTitle,
  ogAlt: `${QUICK10_DISPLAY_NAME} — ${QUICK10_SHARE_TAGLINE}`,
});

export default function Quick10Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <QuickCalculatorJsonLd id={10} />
    </>
  );
}
