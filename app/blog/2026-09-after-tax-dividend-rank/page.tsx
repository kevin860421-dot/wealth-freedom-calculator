import type { Metadata } from "next";
import { LockedRankPage, lockedRankMetadata } from "../after-tax-rank-locked-issue";

export const dynamic = "force-dynamic";

const SLUG = "2026-09-after-tax-dividend-rank";

export function generateMetadata(): Metadata {
  return lockedRankMetadata(SLUG);
}

export default function AfterTaxDividendRank202609Page() {
  return <LockedRankPage slug={SLUG} />;
}
