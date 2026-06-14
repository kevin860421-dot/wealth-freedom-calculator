/**
 * 驗證：100 檔標的 ↔ 100 篇文章 1:1 對應
 * 執行：npm run verify:quick4-coverage
 */
import { QUICK4_TICKER_CODES, QUICK4_TICKER_POSTS } from "../app/mini-blog/posts/quick4-posts-tickers";
import { TICKER_PRESETS } from "../app/ticker-presets";
import { QUICK1_EXCLUSIVE_POSTS } from "../app/mini-blog/posts/quick1-exclusive";

let failed = 0;
function ok(label: string, cond: boolean) {
  if (!cond) {
    console.error("FAIL:", label);
    failed++;
  } else {
    console.log("OK:", label);
  }
}

ok("100 ticker posts", QUICK4_TICKER_POSTS.length === 100);
ok("100 ticker codes list", QUICK4_TICKER_CODES.length === 100);

const slugSet = new Set(QUICK4_TICKER_POSTS.map((p) => p.slug));
ok("100 unique slugs", slugSet.size === 100);

const codeSet = new Set(QUICK4_TICKER_POSTS.map((p) => p.tickerCode!.toUpperCase()));
ok("100 unique ticker codes", codeSet.size === 100);

for (const id of QUICK4_TICKER_CODES) {
  const seed = QUICK4_TICKER_POSTS.find((p) => p.tickerCode === id);
  const preset = TICKER_PRESETS.find((p) => p.id === id);
  const post = QUICK1_EXCLUSIVE_POSTS.find((p) => p.slug === `quick4-${id.toLowerCase()}-dividend-simulator`);
  if (!seed) ok(`seed for ${id}`, false);
  if (!preset) ok(`preset for ${id}`, false);
  if (!post) ok(`exclusive post for ${id}`, false);
  if (seed && seed.seoTitle.includes("台股標的")) ok(`seoTitle no generic name ${id}`, false);
  if (seed && !seed.seoTitle.includes(id) && !(preset && seed.seoTitle.includes(preset.label.split("（")[0] ?? "")))
    ok(`seoTitle has code or name ${id}`, false);
}

const noGeneric = QUICK4_TICKER_POSTS.every((p) => !p.title.includes("台股標的"));
ok("no 台股標的 in titles", noGeneric);

const hot = ["00919", "00878", "0056", "00929", "0050", "00907", "00730"];
for (const id of hot) {
  ok(`hot ticker ${id} covered`, codeSet.has(id));
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nAll 100 tickers have matching articles.");
