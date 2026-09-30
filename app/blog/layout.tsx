import type { ReactNode } from "react";
import { BlogMoneyEatenSplash } from "./blog-money-eaten-splash";

/**
 * 部落格區塊：沿用全站深色莫蘭迪底；一般文章進入時可顯示吃錢小彈窗（稅後實領月報系列除外，見 BlogMoneyEatenSplash）。
 */
export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        color: "var(--morandi-text-body, #ddd4ca)",
      }}
    >
      <BlogMoneyEatenSplash />
      {children}
    </div>
  );
}
