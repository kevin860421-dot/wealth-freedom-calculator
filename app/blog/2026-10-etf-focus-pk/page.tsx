import type { Metadata } from "next";
import { LockedRankPage, lockedRankMetadata } from "../after-tax-rank-locked-issue";

export const dynamic = "force-dynamic";

const SLUG = "2026-10-etf-focus-pk";

export function generateMetadata(): Metadata {
  return lockedRankMetadata(SLUG);
}

export default function AfterTaxEtfRank202610Page() {
  return <LockedRankPage slug={SLUG} />;
}
