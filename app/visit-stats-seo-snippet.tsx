import type { PublicStats } from "@/lib/stats-store";

/** 伺服端輸出至 HTML，供不執行或晚執行 JS 的爬蟲參考（數字為請求當下快照）。 */
export function VisitStatsSeoSnippet({ stats }: { stats: PublicStats }) {
  return (
    <aside
      aria-hidden
      style={{
        position: "absolute",
        width: "1px",
        height: "1px",
        padding: 0,
        margin: "-1px",
        overflow: "hidden",
        clipPath: "inset(50%)",
        whiteSpace: "nowrap",
        border: 0,
      }}
    >
      財富自由計算機 造訪統計 {stats.monthKey} 月工作階段瀏覽量 {stats.monthPageViews} 有效互動次數 {stats.monthEngagement}
    </aside>
  );
}
