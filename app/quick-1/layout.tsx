import type { ReactNode } from "react";
import { QuickCalculatorJsonLd } from "@/lib/quick-calculator-json-ld";
import { buildQuickPageMetadata } from "@/lib/quick-open-graph-metadata";

const shareTitle = "存股複利計算機｜月投兩萬未來月領六萬，一秒看清你的資產複利進度條";

export const metadata = buildQuickPageMetadata({
  id: 1,
  shareTitle,
  ogAlt: "存股複利計算機 — 月投兩萬未來月領六萬，一秒看清你的資產複利進度條",
});

export default function Quick1Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <QuickCalculatorJsonLd id={1} />
    </>
  );
}
