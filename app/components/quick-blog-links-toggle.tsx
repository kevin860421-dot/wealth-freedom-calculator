"use client";

import Link from "next/link";

type QuickRoute = "/quick-1" | "/quick-2" | "/quick-3" | "/quick-4" | "/quick-5" | "/quick-6" | "/quick-7" | "/quick-8" | "/quick-9" | "/quick-10";

type QuickBlogLinksToggleProps = {
  quickRoute: QuickRoute;
  title?: string;
};

const QUICK_ROUTE_LINKS: Record<QuickRoute, readonly { href: string; title: string; description: string }[]> = {
  "/quick-1": [
    {
      href: "/mini-blog/quick1-monthly-20000-compound-playbook",
      title: "每月投入兩萬，20 年後會自由嗎？",
      description: "從月投與年數出發，看清可執行自由。",
    },
    {
      href: "/mini-blog/quick1-first-million-discipline-map",
      title: "第一個一百萬不是天分題，是節奏題",
      description: "先找能長期執行的投入節奏。",
    },
    {
      href: "/mini-blog/quick1-retirement-monthly-cashflow-baseline",
      title: "退休月領怎麼抓？先算底線版本",
      description: "從月領倒推月投與年數。",
    },
    {
      href: "/mini-blog/quick1-monthly-10000-vs-15000-gap",
      title: "月投一萬 vs 一萬五，差在哪？",
      description: "同一時間軸下看差距被放大。",
    },
    {
      href: "/mini-blog/quick1-bonus-lump-sum-yearly-plan",
      title: "年終獎金該花還是加碼？",
      description: "先算十年差距，再做決定。",
    },
    {
      href: "/mini-blog/quick1-salary-growth-stepup-plan",
      title: "加薪後月投該怎麼調才不崩？",
      description: "先求可持續，再求速度。",
    },
    {
      href: "/mini-blog/quick1-bear-market-keep-investing",
      title: "市場下跌還要繼續投入嗎？",
      description: "看懂停扣與持續投入的長期差。",
    },
    {
      href: "/mini-blog/quick1-inflation-adjusted-goals",
      title: "目標金額要不要算通膨？",
      description: "避免只看名目數字。",
    },
    {
      href: "/mini-blog/quick1-couple-joint-invest-plan",
      title: "伴侶理財常吵架？先看同一張圖",
      description: "對齊投入與年數期待。",
    },
    {
      href: "/mini-blog/quick1-late-start-catchup-strategy",
      title: "30 歲才開始會太晚嗎？",
      description: "晚開始也能追回節奏。",
    },
    {
      href: "/mini-blog/quick1-freelancer-irregular-income-plan",
      title: "收入不固定怎麼月投？",
      description: "接案族可執行的彈性版本。",
    },
    {
      href: "/mini-blog/quick1-parenting-education-retire-balance",
      title: "有小孩後，教育金和退休金怎麼平衡？",
      description: "先排序，才不會兩頭亂。",
    },
    {
      href: "/mini-blog/quick1-debt-first-or-invest-first",
      title: "先還債還是先投資？",
      description: "重點在比例，不是二選一。",
    },
    {
      href: "/mini-blog/quick1-year-end-rebalance-checklist",
      title: "年底理財健檢：每年一次就有感",
      description: "固定檢查三個關鍵數字。",
    },
    {
      href: "/mini-blog/quick1-emergency-fund-before-invest",
      title: "緊急預備金要先存嗎？",
      description: "先鋪安全墊，投資才不易中斷。",
    },
    {
      href: "/mini-blog/quick1-etf-dividend-reinvest-idea",
      title: "配息該花還是再投入？",
      description: "一個選擇，十年差很多。",
    },
    {
      href: "/mini-blog/quick1-target-30000-passive-income",
      title: "目標月領 3 萬，月投要多少？",
      description: "先看底線，再調投入或年數。",
    },
    {
      href: "/mini-blog/quick1-monthly-5min-review-system",
      title: "每月 5 分鐘理財檢查法",
      description: "流程化，才能長期不焦慮。",
    },
    {
      href: "/mini-blog/quick1-avoid-over-optimistic-return",
      title: "報酬率別一開始就填太高",
      description: "保守/中性/樂觀三版更務實。",
    },
    {
      href: "/mini-blog/quick1-build-30year-freedom-habit",
      title: "30 年自由靠的是習慣，不是運氣",
      description: "先守節奏，時間會放大結果。",
    },
  ],
  "/quick-2": [
    {
      href: "/mini-blog/quick2-freedom-countdown-target-years",
      title: "財富自由倒數計時器怎麼用？",
      description: "目標月領與月投入，如何對齊時間壓力。",
    },
  ],
  "/quick-3": [
    {
      href: "/mini-blog/quick3-dream-monthly-income-simulator",
      title: "夢想月領試算器：先算再追夢",
      description: "先反推月投，再決定要調目標還是調年數。",
    },
  ],
  "/quick-4": [
    {
      href: "/mini-blog/quick4-etf-monthly-income-simulator-guide",
      title: "ETF 月領試算器：先算現金流再配置",
      description: "從目標月領反推路線，避免只追高配息。",
    },
  ],
  "/quick-5": [
    {
      href: "/mini-blog/quick5-principal-vs-compound-reality",
      title: "本金複利對照：你在買時間",
      description: "看懂本金線與複利線的長期分岔。",
    },
  ],
  "/quick-6": [
    {
      href: "/mini-blog/quick6-house-vs-invest-decision-map",
      title: "買房跟投資試算器：先看壓力",
      description: "同樣是資產，現金流體感可能完全不同。",
    },
  ],
  "/quick-7": [
    {
      href: "/mini-blog/quick7-car-vs-invest-decision-map",
      title: "買車跟投資試算器：先看代價",
      description: "一筆車款，可能換走十年的選擇權。",
    },
  ],
  "/quick-8": [
    {
      href: "/mini-blog/quick8-delay-gratification-simulator-guide",
      title: "延遲享樂模擬器：晚點花差多少？",
      description: "先看可投資金額，再決定現在就買。",
    },
  ],
  "/quick-9": [
    {
      href: "/mini-blog/quick9-delay-spending-value-calculator-guide",
      title: "延遲消費價值計算機：重算每次刷卡",
      description: "3/5/10 年切換，看清消費機會成本。",
    },
  ],
  "/quick-10": [
    {
      href: "/mini-blog/quick10-asset-stress-test-simulator-guide",
      title: "資產抗壓模擬器：逆風也要能走",
      description: "先測脆弱點，再調整可持續策略。",
    },
  ],
};

export function QuickBlogLinksToggle({ quickRoute, title = "📚 本台小計算機延伸文章（點我展開）" }: QuickBlogLinksToggleProps) {
  const links = QUICK_ROUTE_LINKS[quickRoute];
  return (
    <details
      className="quick-blog-links-toggle"
      style={{
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(0,0,0,0.16)",
        padding: 12,
      }}
    >
      <summary style={{ cursor: "pointer", fontSize: 15, fontWeight: 900, color: "rgba(226,232,240,0.98)" }}>{title}</summary>
      <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              borderRadius: 10,
              border: "1px solid rgba(148,163,184,0.35)",
              background: "rgba(15,23,42,0.55)",
              padding: "10px 12px",
              textDecoration: "none",
              color: "#e8eefc",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 900, lineHeight: 1.45 }}>{item.title}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: "rgba(191,219,254,0.92)", lineHeight: 1.45 }}>{item.description}</div>
          </Link>
        ))}
      </div>
    </details>
  );
}
