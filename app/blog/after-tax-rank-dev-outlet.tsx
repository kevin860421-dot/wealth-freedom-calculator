"use client";

import type { ComponentType } from "react";

/**
 * 正式 build 會把這段折成 null。
 * require 放在編譯期為 false 的分支裡，按鈕與各大部落格預覽不會進部署產物。
 */
const OutletBar: ComponentType | null =
  process.env.NODE_ENV === "development"
    ? (require("./after-tax-rank-outlet-bar") as { AfterTaxRankOutletBar: ComponentType })
        .AfterTaxRankOutletBar
    : null;

export function AfterTaxRankDevOutlet() {
  if (!OutletBar) return null;
  return <OutletBar />;
}
