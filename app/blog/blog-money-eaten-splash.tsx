"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isAfterTaxRankBlogPath } from "@/lib/blog/after-tax-rank-series";
import { MoneyEatenSpiritModal } from "../money-eaten-spirit-modal";

/**
 * 進入一般 /blog 時顯示吃錢彈窗；稅後實領月報系列（*-after-tax-dividend-rank）不顯示。
 */
export function BlogMoneyEatenSplash() {
  const pathname = usePathname() ?? "";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isAfterTaxRankBlogPath(pathname)) {
    return null;
  }

  return <MoneyEatenSpiritModal active={mounted} />;
}
