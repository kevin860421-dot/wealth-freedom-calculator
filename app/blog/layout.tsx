import type { ReactNode } from "react";
import { BlogMoneyEatenSplash } from "./blog-money-eaten-splash";

/**
 * 部落格區塊：沿用全站深色莫蘭迪底；進入部落格時可顯示吃錢小彈窗（見 BlogMoneyEatenSplash）。
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
