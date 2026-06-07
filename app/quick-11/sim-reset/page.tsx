import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isQuick11DevToolsEnabled } from "@/lib/quick11-dev-tools";
import { Quick11SimResetClient } from "./sim-reset-client";

export const metadata: Metadata = {
  title: "模擬資料重置｜破產計算機",
  robots: { index: false, follow: false },
};

/** 僅本機 development；正式站 404 */
export default function Quick11SimResetPage() {
  if (!isQuick11DevToolsEnabled()) notFound();
  return <Quick11SimResetClient />;
}
