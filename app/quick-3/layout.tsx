import type { ReactNode } from "react";
import { QuickCalculatorJsonLd } from "@/lib/quick-calculator-json-ld";
import { buildQuickPageMetadata } from "@/lib/quick-open-graph-metadata";

const shareTitle = "夢想月領試算器｜想過理想生活還要努力多久，反推你現在每個月該投資多少錢";

export const metadata = buildQuickPageMetadata({
  id: 3,
  shareTitle,
  ogAlt: "夢想月領試算器 — 想過理想生活還要努力多久，反推你現在每個月該投資多少錢",
});

export default function Quick3Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <QuickCalculatorJsonLd id={3} />
    </>
  );
}
