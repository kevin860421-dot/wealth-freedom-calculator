/**
 * 驗證第 4 台路由：未發布 → 已發布最佳文；已發布 → 自己的 slug
 * 執行：npx tsx scripts/verify-quick4-routing.ts
 */
import { QUICK4_PUBLISH_DATES, QUICK4_TICKER_POSTS } from "../app/mini-blog/posts/quick4-posts-tickers";
import {
  assertQuick4TickerConsistency,
  resolveQuick4CalculatorHref,
  resolveQuick4PublishedMiniBlogHref,
  isQuick4TickerArticlePublished,
} from "../app/quick-4/quick4-mini-blog-routing";

let failed = 0;
function ok(label: string, cond: boolean) {
  if (!cond) {
    console.error("FAIL:", label);
    failed++;
  } else {
    console.log("OK:", label);
  }
}

const BEFORE_TICKER_00919 = new Date("2026-06-10T12:00:00+08:00");

const AFTER_0050 = new Date(QUICK4_PUBLISH_DATES["quick4-0050-dividend-simulator"]!);
AFTER_0050.setHours(AFTER_0050.getHours() + 1);

const BEFORE_0050 = new Date(QUICK4_PUBLISH_DATES["quick4-0050-dividend-simulator"]!);
BEFORE_0050.setHours(BEFORE_0050.getHours() - 1);

ok("100 ticker posts", QUICK4_TICKER_POSTS.length === 100);
ok("123 publish slots (23 thematic + 100 ticker)", Object.keys(QUICK4_PUBLISH_DATES).length === 123);

const unpub919 = resolveQuick4PublishedMiniBlogHref("00919", BEFORE_TICKER_00919);
ok("00919 before publish → not own", !unpub919.isOwnArticle);
ok("00919 before publish → no own slug", !unpub919.href.includes("quick4-00919-dividend-simulator"));
ok(
  "00919 consistency unpublished",
  assertQuick4TickerConsistency("00919", unpub919.slug.replace("/mini-blog/", ""), BEFORE_TICKER_00919),
);

const unpub0050 = resolveQuick4PublishedMiniBlogHref("0050", BEFORE_0050);
ok("0050 before own publish → not own slug", !unpub0050.isOwnArticle);
ok("0050 before own publish → published fallback", unpub0050.href.startsWith("/mini-blog/quick4-"));

const pub0050 = resolveQuick4PublishedMiniBlogHref("0050", AFTER_0050);
ok("0050 after publish → own article", pub0050.isOwnArticle);
ok("0050 after publish → own slug", pub0050.slug === "quick4-0050-dividend-simulator");
ok("0050 consistency published", assertQuick4TickerConsistency("0050", "quick4-0050-dividend-simulator", AFTER_0050));

ok("calc href 00919", resolveQuick4CalculatorHref("00919").includes("code=00919"));
ok("calc href 0050", resolveQuick4CalculatorHref("0050").includes("code=0050"));

for (const seed of QUICK4_TICKER_POSTS) {
  const code = seed.tickerCode!;
  if (seed.slug !== `quick4-${code.toLowerCase()}-dividend-simulator`) {
    ok(`slug pattern ${code}`, false);
  }
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll quick-4 routing checks passed.");
